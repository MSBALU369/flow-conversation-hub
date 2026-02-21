import { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const POLL_INTERVAL = 2500;

interface CallState {
  isInCall: boolean;
  isConnected: boolean;
  partnerName: string | null;
  partnerAvatar: string | null;
  callSeconds: number;
}

interface IncomingCall {
  active: boolean;
  callerName: string | null;
  callerAvatar: string | null;
  callId: string | null;
  roomId: string | null;
  callerId: string | null;
}

interface CallStateContextType {
  callState: CallState;
  incomingCall: IncomingCall;
  isSearching: boolean;
  startCall: (partnerName: string | null, partnerAvatar: string | null) => void;
  endCall: () => void;
  updateCallSeconds: (seconds: number) => void;
  triggerIncomingCall: (callerName: string, callerAvatar: string | null) => void;
  acceptIncomingCall: () => void;
  declineIncomingCall: () => void;
  startSearching: () => void;
  stopSearching: () => void;
}

const CallStateContext = createContext<CallStateContextType | undefined>(undefined);

export function CallStateProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [callState, setCallState] = useState<CallState>({
    isInCall: false,
    isConnected: false,
    partnerName: null,
    partnerAvatar: null,
    callSeconds: 0,
  });

  const [incomingCall, setIncomingCall] = useState<IncomingCall>({
    active: false,
    callerName: null,
    callerAvatar: null,
    callId: null,
    roomId: null,
    callerId: null,
  });

  const [isSearching, setIsSearching] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMatchedRef = useRef(false);
  const isFetchingRef = useRef(false);

  // ─── Realtime: listen for incoming direct calls ───
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`incoming-calls-${user.id}`)
      .on(
        "postgres_changes" as any,
        {
          event: "INSERT",
          schema: "public",
          table: "calls",
          filter: `receiver_id=eq.${user.id}`,
        },
        async (payload: any) => {
          const row = payload.new;
          if (!row || row.status !== "pending") return;

          // Fetch caller profile
          const { data: callerProfile } = await supabase
            .from("profiles")
            .select("username, avatar_url")
            .eq("id", row.caller_id)
            .single();

          setIncomingCall({
            active: true,
            callerName: callerProfile?.username || "Unknown",
            callerAvatar: callerProfile?.avatar_url || null,
            callId: row.id,
            roomId: row.id, // use call id as room id
            callerId: row.caller_id,
          });
        }
      )
      .subscribe();

    // Also listen for call status updates (declined by receiver triggers toast on caller)
    const statusChannel = supabase
      .channel(`call-status-${user.id}`)
      .on(
        "postgres_changes" as any,
        {
          event: "UPDATE",
          schema: "public",
          table: "calls",
          filter: `caller_id=eq.${user.id}`,
        },
        (payload: any) => {
          const row = payload.new;
          if (row?.status === "declined") {
            toast({
              title: "Call Declined",
              description: `${row.receiver_id ? "User" : "The user"} declined your call.`,
              variant: "destructive",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(statusChannel);
    };
  }, [user?.id, toast]);

  const fetchTokenAndNavigate = useCallback(async (roomId: string, matchedUserId?: string) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    const participantName = profile?.username || "User";

    try {
      const { data, error } = await supabase.functions.invoke("generate-livekit-token", {
        body: { room_id: roomId, participant_name: participantName },
      });

      if (error || !data?.token) {
        toast({ title: "Connection Error", description: "Could not establish call.", variant: "destructive" });
        setIsSearching(false);
        isFetchingRef.current = false;
        return;
      }

      setIsSearching(false);
      navigate("/call", { replace: true, state: { roomId, livekitToken: data.token, matchedUserId } });
    } catch {
      toast({ title: "Connection Error", description: "Could not establish call.", variant: "destructive" });
      setIsSearching(false);
    } finally {
      isFetchingRef.current = false;
    }
  }, [profile?.username, navigate, toast]);

  const pollForMatch = useCallback(async () => {
    if (!user?.id || isFetchingRef.current || isMatchedRef.current) return;

    try {
      const { data, error } = await supabase.rpc("find_match", { p_user_id: user.id });
      if (error) return;

      const result = data as { status: string; room_id?: string; matched_with?: string };

      if (result?.status === "matched" && result?.room_id) {
        isMatchedRef.current = true;
        if (pollRef.current) clearInterval(pollRef.current);
        await fetchTokenAndNavigate(result.room_id, result.matched_with);
      }
    } catch (err) {
      console.error("Matchmaking poll error:", err);
    }
  }, [user?.id, fetchTokenAndNavigate]);

  // Start/stop polling based on isSearching
  useEffect(() => {
    if (!isSearching || !user?.id) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }

    isMatchedRef.current = false;
    isFetchingRef.current = false;
    pollForMatch();
    pollRef.current = setInterval(pollForMatch, POLL_INTERVAL);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [isSearching, user?.id, pollForMatch]);

  const startSearching = useCallback(() => {
    setIsSearching(true);
  }, []);

  const stopSearching = useCallback(async () => {
    setIsSearching(false);
    isMatchedRef.current = false;
    if (pollRef.current) clearInterval(pollRef.current);
    if (user?.id) {
      await supabase.rpc("leave_matchmaking", { p_user_id: user.id });
    }
  }, [user?.id]);

  const startCall = useCallback((partnerName: string | null, partnerAvatar: string | null) => {
    setCallState({ isInCall: true, isConnected: true, partnerName, partnerAvatar, callSeconds: 0 });
  }, []);

  const endCall = useCallback(() => {
    setCallState({ isInCall: false, isConnected: false, partnerName: null, partnerAvatar: null, callSeconds: 0 });
  }, []);

  const updateCallSeconds = useCallback((seconds: number) => {
    setCallState(prev => ({ ...prev, callSeconds: seconds }));
  }, []);

  const triggerIncomingCall = useCallback((callerName: string, callerAvatar: string | null) => {
    setIncomingCall({ active: true, callerName, callerAvatar, callId: null, roomId: null, callerId: null });
  }, []);

  const acceptIncomingCall = useCallback(async () => {
    const current = incomingCall;
    
    // If this is a real DB-backed call (has callId), update status + get token
    if (current.callId) {
      // Update call status to answered
      await supabase
        .from("calls")
        .update({ status: "answered" })
        .eq("id", current.callId);

      const participantName = profile?.username || "User";
      const roomId = `direct_${current.callId}`;

      const { data, error } = await supabase.functions.invoke("generate-livekit-token", {
        body: { room_id: roomId, participant_name: participantName },
      });

      setIncomingCall({ active: false, callerName: null, callerAvatar: null, callId: null, roomId: null, callerId: null });

      if (error || !data?.token) {
        toast({ title: "Connection Error", description: "Could not join call.", variant: "destructive" });
        return;
      }

      setCallState({
        isInCall: true,
        isConnected: true,
        partnerName: current.callerName,
        partnerAvatar: current.callerAvatar,
        callSeconds: 0,
      });

      navigate("/call", {
        replace: true,
        state: {
          roomId,
          livekitToken: data.token,
          matchedUserId: current.callerId,
          partnerName: current.callerName,
          partnerAvatar: current.callerAvatar,
        },
      });
    } else {
      // Legacy/demo call — just update local state
      setIncomingCall(prev => {
        setCallState({ isInCall: true, isConnected: true, partnerName: prev.callerName, partnerAvatar: prev.callerAvatar, callSeconds: 0 });
        return { active: false, callerName: null, callerAvatar: null, callId: null, roomId: null, callerId: null };
      });
    }
  }, [incomingCall, profile?.username, navigate, toast]);

  const declineIncomingCall = useCallback(async () => {
    const current = incomingCall;
    
    // If real DB call, update status to declined
    if (current.callId) {
      await supabase
        .from("calls")
        .update({ status: "declined" })
        .eq("id", current.callId);
    }

    setIncomingCall({ active: false, callerName: null, callerAvatar: null, callId: null, roomId: null, callerId: null });
  }, [incomingCall]);

  return (
    <CallStateContext.Provider value={{
      callState, incomingCall, isSearching,
      startCall, endCall, updateCallSeconds,
      triggerIncomingCall, acceptIncomingCall, declineIncomingCall,
      startSearching, stopSearching,
    }}>
      {children}
    </CallStateContext.Provider>
  );
}

export function useCallState() {
  const context = useContext(CallStateContext);
  if (!context) throw new Error("useCallState must be used within CallStateProvider");
  return context;
}

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

interface OutgoingCall {
  active: boolean;
  callId: string | null;
  receiverName: string | null;
  receiverAvatar: string | null;
  receiverId: string | null;
}

interface CallStateContextType {
  callState: CallState;
  incomingCall: IncomingCall;
  outgoingCall: OutgoingCall;
  isSearching: boolean;
  startCall: (partnerName: string | null, partnerAvatar: string | null) => void;
  endCall: () => void;
  updateCallSeconds: (seconds: number) => void;
  triggerIncomingCall: (callerName: string, callerAvatar: string | null) => void;
  acceptIncomingCall: () => void;
  declineIncomingCall: () => void;
  startSearching: () => void;
  stopSearching: () => void;
  initiateDirectCall: (receiverId: string, receiverName: string, receiverAvatar: string | null) => Promise<void>;
  cancelOutgoingCall: () => Promise<void>;
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

  const [outgoingCall, setOutgoingCall] = useState<OutgoingCall>({
    active: false,
    callId: null,
    receiverName: null,
    receiverAvatar: null,
    receiverId: null,
  });

  const [isSearching, setIsSearching] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMatchedRef = useRef(false);
  const isFetchingRef = useRef(false);

  // ─── Realtime: listen for INCOMING calls (receiver side) ───
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
          if (!row || row.status !== "ringing") return;

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
            roomId: `direct_${row.id}`,
            callerId: row.caller_id,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // ─── Realtime: listen for STATUS UPDATES on calls where I am caller (accepted/declined) ───
  useEffect(() => {
    if (!user?.id) return;

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
        async (payload: any) => {
          const row = payload.new;
          if (!row) return;

          if (row.status === "declined") {
            // Receiver declined — hide outgoing banner, show toast
            setOutgoingCall({ active: false, callId: null, receiverName: null, receiverAvatar: null, receiverId: null });
            toast({
              title: "Call Declined",
              description: "The user declined your call.",
              variant: "destructive",
            });
          } else if (row.status === "accepted") {
            // Receiver accepted — BOTH sides now join the room
            const roomId = `direct_${row.id}`;
            const participantName = profile?.username || "User";

            try {
              const { data, error } = await supabase.functions.invoke("generate-livekit-token", {
                body: { room_id: roomId, participant_name: participantName },
              });

              if (error || !data?.token) {
                toast({ title: "Connection Error", description: "Could not establish call.", variant: "destructive" });
                setOutgoingCall({ active: false, callId: null, receiverName: null, receiverAvatar: null, receiverId: null });
                return;
              }

              const currentOutgoing = outgoingCall;
              setOutgoingCall({ active: false, callId: null, receiverName: null, receiverAvatar: null, receiverId: null });

              setCallState({
                isInCall: true,
                isConnected: true,
                partnerName: currentOutgoing.receiverName,
                partnerAvatar: currentOutgoing.receiverAvatar,
                callSeconds: 0,
              });

              navigate("/call", {
                replace: true,
                state: {
                  roomId,
                  livekitToken: data.token,
                  matchedUserId: currentOutgoing.receiverId,
                  partnerName: currentOutgoing.receiverName,
                  partnerAvatar: currentOutgoing.receiverAvatar,
                  directCallId: row.id,
                },
              });
            } catch {
              toast({ title: "Connection Error", description: "Could not establish call.", variant: "destructive" });
              setOutgoingCall({ active: false, callId: null, receiverName: null, receiverAvatar: null, receiverId: null });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(statusChannel);
    };
  }, [user?.id, profile?.username, navigate, toast, outgoingCall]);

  // ─── Realtime: listen for STATUS UPDATES on calls where I am receiver (caller cancelled = 'missed') ───
  useEffect(() => {
    if (!user?.id) return;

    const receiverStatusChannel = supabase
      .channel(`call-receiver-status-${user.id}`)
      .on(
        "postgres_changes" as any,
        {
          event: "UPDATE",
          schema: "public",
          table: "calls",
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload: any) => {
          const row = payload.new;
          if (!row) return;

          if (row.status === "missed" || row.status === "cancelled") {
            // Caller cancelled — hide incoming banner
            if (incomingCall.callId === row.id) {
              setIncomingCall({ active: false, callerName: null, callerAvatar: null, callId: null, roomId: null, callerId: null });
              toast({ title: "Call Cancelled", description: "The caller cancelled the call." });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(receiverStatusChannel);
    };
  }, [user?.id, incomingCall.callId, toast]);

  // ─── Initiate a direct call (caller side) ───
  const initiateDirectCall = useCallback(async (receiverId: string, receiverName: string, receiverAvatar: string | null) => {
    if (!profile?.id) return;

    try {
      const { data: callRow, error: callErr } = await supabase
        .from("calls")
        .insert({
          caller_id: profile.id,
          receiver_id: receiverId,
          status: "ringing",
        })
        .select()
        .single();

      if (callErr || !callRow) {
        toast({ title: "Call Error", description: "Could not initiate call.", variant: "destructive" });
        return;
      }

      // Show outgoing call banner — do NOT navigate to /call yet
      setOutgoingCall({
        active: true,
        callId: callRow.id,
        receiverName,
        receiverAvatar,
        receiverId,
      });
    } catch {
      toast({ title: "Call Error", description: "Something went wrong.", variant: "destructive" });
    }
  }, [profile?.id, toast]);

  // ─── Cancel outgoing call (caller side) ───
  const cancelOutgoingCall = useCallback(async () => {
    if (outgoingCall.callId) {
      await supabase
        .from("calls")
        .update({ status: "missed" })
        .eq("id", outgoingCall.callId);
    }
    setOutgoingCall({ active: false, callId: null, receiverName: null, receiverAvatar: null, receiverId: null });
  }, [outgoingCall.callId]);

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

    if (current.callId) {
      // Update call status to accepted — this triggers Realtime for the caller
      await supabase
        .from("calls")
        .update({ status: "accepted" })
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
      // Legacy/demo call
      setIncomingCall(prev => {
        setCallState({ isInCall: true, isConnected: true, partnerName: prev.callerName, partnerAvatar: prev.callerAvatar, callSeconds: 0 });
        return { active: false, callerName: null, callerAvatar: null, callId: null, roomId: null, callerId: null };
      });
    }
  }, [incomingCall, profile?.username, navigate, toast]);

  const declineIncomingCall = useCallback(async () => {
    const current = incomingCall;

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
      callState, incomingCall, outgoingCall, isSearching,
      startCall, endCall, updateCallSeconds,
      triggerIncomingCall, acceptIncomingCall, declineIncomingCall,
      startSearching, stopSearching,
      initiateDirectCall, cancelOutgoingCall,
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

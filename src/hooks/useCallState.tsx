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
  });

  const [isSearching, setIsSearching] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMatchedRef = useRef(false);
  const isFetchingRef = useRef(false);

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

  const stopSearching = useCallback(() => {
    setIsSearching(false);
    isMatchedRef.current = false;
    if (pollRef.current) clearInterval(pollRef.current);
    if (user?.id) {
      supabase.rpc("leave_matchmaking", { p_user_id: user.id }).then();
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
    setIncomingCall({ active: true, callerName, callerAvatar });
  }, []);

  const acceptIncomingCall = useCallback(() => {
    setIncomingCall(prev => {
      setCallState({ isInCall: true, isConnected: true, partnerName: prev.callerName, partnerAvatar: prev.callerAvatar, callSeconds: 0 });
      return { active: false, callerName: null, callerAvatar: null };
    });
  }, []);

  const declineIncomingCall = useCallback(() => {
    setIncomingCall({ active: false, callerName: null, callerAvatar: null });
  }, []);

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

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
  startSearching: (preferences?: { genderPref?: string | null; levelPref?: string | null }) => void;
  stopSearching: () => void;
  initiateDirectCall: (receiverId: string, receiverName: string, receiverAvatar: string | null) => Promise<void>;
  cancelOutgoingCall: () => Promise<void>;
  registerCurrentRoom: (room: any) => void;
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
  const currentRoomRef = useRef<any>(null);
  const outgoingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const outgoingCallRef = useRef(outgoingCall);

  // Keep ref in sync with state
  useEffect(() => { outgoingCallRef.current = outgoingCall; }, [outgoingCall]);

  const registerCurrentRoom = useCallback((room: any) => {
    currentRoomRef.current = room;
  }, []);


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
            const currentOutgoing = outgoingCallRef.current;
            setOutgoingCall({ active: false, callId: null, receiverName: null, receiverAvatar: null, receiverId: null });
            toast({
              title: "Call Declined",
              description: "The user declined your call.",
              variant: "destructive",
            });

            // Log missed call in chat_messages (caller is the inserter)
            if (currentOutgoing.receiverId) {
              supabase.from("chat_messages").insert({
                sender_id: user.id,
                receiver_id: currentOutgoing.receiverId,
                content: "📞 Missed Call",
                is_read: true,
              }).then(() => {});
            }

            // Log missed call in call_history for BOTH via RPC
            if (currentOutgoing.receiverId) {
              supabase.rpc("log_call_for_both" as any, {
                p_caller_id: user.id,
                p_receiver_id: currentOutgoing.receiverId,
                p_caller_name: profile?.username || "Unknown",
                p_receiver_name: currentOutgoing.receiverName || "Unknown",
                p_duration: 0,
                p_status: "missed",
              }).then(() => {});
            }
          } else if (row.status === "accepted") {
            // Receiver accepted — BOTH sides now join the room
            const roomId = `direct_${row.id}`;
            const participantName = profile?.username || "User";
            const participantId = user?.id;

            try {
              console.log("[DirectCall] Caller generating token for room:", roomId, "identity:", participantId);
              const { data, error } = await supabase.functions.invoke("generate-livekit-token", {
                body: { room_id: roomId, participant_name: participantName, participant_id: participantId },
              });

              if (error || !data?.token) {
                console.error("[DirectCall] Token generation failed:", error, data);
                toast({ title: "Failed to fetch token", description: "Could not establish call. Check your connection.", variant: "destructive" });
                setOutgoingCall({ active: false, callId: null, receiverName: null, receiverAvatar: null, receiverId: null });
                return;
              }

              // Read from ref to avoid stale closure
              const currentOutgoing = outgoingCallRef.current;
              setOutgoingCall({ active: false, callId: null, receiverName: null, receiverAvatar: null, receiverId: null });

              console.log("[DirectCall] Caller navigating to /call with token, partner:", currentOutgoing.receiverName);

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
            } catch (err) {
              console.error("[DirectCall] Caller connection error:", err);
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
  }, [user?.id, profile?.username, navigate, toast]);

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
    if (outgoingTimeoutRef.current) {
      clearTimeout(outgoingTimeoutRef.current);
      outgoingTimeoutRef.current = null;
    }
    const currentOutgoing = outgoingCallRef.current;
    if (currentOutgoing.callId) {
      await supabase
        .from("calls")
        .update({ status: "missed" })
        .eq("id", currentOutgoing.callId);
    }

    // Log missed call in call_history for BOTH via RPC
    if (user?.id && currentOutgoing.receiverId) {
      supabase.rpc("log_call_for_both" as any, {
        p_caller_id: user.id,
        p_receiver_id: currentOutgoing.receiverId,
        p_caller_name: profile?.username || "Unknown",
        p_receiver_name: currentOutgoing.receiverName || "Unknown",
        p_duration: 0,
        p_status: "missed",
      }).then(() => {});

      // Log missed call in chat_messages
      supabase.from("chat_messages").insert({
        sender_id: user.id,
        receiver_id: currentOutgoing.receiverId,
        content: "📞 Missed Call",
        is_read: true,
      }).then(() => {});
    }

    setOutgoingCall({ active: false, callId: null, receiverName: null, receiverAvatar: null, receiverId: null });
  }, [outgoingCall.callId, user?.id, profile?.username]);

  // ─── 60-second auto-timeout for outgoing calls ───
  useEffect(() => {
    if (!outgoingCall.active || !outgoingCall.callId) {
      if (outgoingTimeoutRef.current) {
        clearTimeout(outgoingTimeoutRef.current);
        outgoingTimeoutRef.current = null;
      }
      return;
    }

    outgoingTimeoutRef.current = setTimeout(async () => {
      // Auto-cancel: update DB to missed
      if (outgoingCall.callId) {
        await supabase
          .from("calls")
          .update({ status: "missed" })
          .eq("id", outgoingCall.callId);
      }

      // Play busy tone
      try {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(480, ctx.currentTime);
        osc.type = "sine";
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.8);
        osc.onended = () => ctx.close();
      } catch {}

      // Log missed call in chat + history before clearing state
      if (outgoingCall.receiverId) {
        supabase.from("chat_messages").insert({
          sender_id: user?.id || "",
          receiver_id: outgoingCall.receiverId,
          content: "📞 Missed Call",
          is_read: true,
        }).then(() => {});
      }
      // Log missed call in call_history for BOTH via RPC
      if (user?.id && outgoingCall.receiverId) {
        supabase.rpc("log_call_for_both" as any, {
          p_caller_id: user.id,
          p_receiver_id: outgoingCall.receiverId,
          p_caller_name: profile?.username || "Unknown",
          p_receiver_name: outgoingCall.receiverName || "Unknown",
          p_duration: 0,
          p_status: "missed",
        }).then(() => {});
      }

      setOutgoingCall({ active: false, callId: null, receiverName: null, receiverAvatar: null, receiverId: null });
      toast({
        title: "User Unavailable",
        description: "User unavailable or network error. Try again later.",
        variant: "destructive",
      });
    }, 30_000);

    return () => {
      if (outgoingTimeoutRef.current) {
        clearTimeout(outgoingTimeoutRef.current);
        outgoingTimeoutRef.current = null;
      }
    };
  }, [outgoingCall.active, outgoingCall.callId, toast]);

  const fetchTokenAndNavigate = useCallback(async (roomId: string, matchedUserId?: string) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    const participantName = profile?.username || "User";
    const participantId = user?.id;

    console.log("[Matchmaking] fetchTokenAndNavigate called — mode: random, room:", roomId, "matchedWith:", matchedUserId);

    try {
      const { data, error } = await supabase.functions.invoke("generate-livekit-token", {
        body: { room_id: roomId, participant_name: participantName, participant_id: participantId },
      });

      if (error || !data?.token) {
        console.error("[Matchmaking] Token generation failed:", error, data);
        toast({ title: "Connection Error", description: "Could not establish call.", variant: "destructive" });
        setIsSearching(false);
        isFetchingRef.current = false;
        return;
      }

      console.log("[Matchmaking] Token received, navigating to /call");
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
      console.log("[Matchmaking] Polling find_match for user:", user.id);
      const { data, error } = await supabase.rpc("find_match", { p_user_id: user.id });
      if (error) {
        console.error("[Matchmaking] find_match RPC error:", error);
        return;
      }

      const result = data as { status: string; room_id?: string; matched_with?: string };
      console.log("[Matchmaking] find_match result:", result);

      if (result?.status === "matched" && result?.room_id) {
        isMatchedRef.current = true;
        if (pollRef.current) clearInterval(pollRef.current);
        await fetchTokenAndNavigate(result.room_id, result.matched_with);
      }
    } catch (err) {
      console.error("[Matchmaking] Poll error:", err);
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

  const startSearching = useCallback(async (preferences?: { genderPref?: string | null; levelPref?: string | null }) => {
    console.log("[Matchmaking] startSearching called, userId:", user?.id, "preferences:", preferences);
    if (user?.id) {
      // Call join_matchmaking RPC with preferences (premium-verified server-side)
      const { error } = await (supabase.rpc as any)("join_matchmaking", {
        p_user_id: user.id,
        p_gender_pref: preferences?.genderPref || null,
        p_level_pref: preferences?.levelPref || null,
      });
      if (error) {
        console.error("[Matchmaking] join_matchmaking RPC error:", error);
      } else {
        console.log("[Matchmaking] Successfully joined matchmaking queue");
      }
    }
    setIsSearching(true);
  }, [user?.id]);

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
      // Call Waiting: disconnect current LiveKit room if in a call
      if (callState.isInCall && currentRoomRef.current) {
        try { currentRoomRef.current.disconnect(); } catch {}
        currentRoomRef.current = null;
      }

      // Update call status to accepted — this triggers Realtime for the caller
      await supabase
        .from("calls")
        .update({ status: "accepted" })
        .eq("id", current.callId);

      const participantName = profile?.username || "User";
      const participantId = user?.id;
      const roomId = `direct_${current.callId}`;

      console.log("[DirectCall] Receiver generating token for room:", roomId, "identity:", participantId);
      const { data, error } = await supabase.functions.invoke("generate-livekit-token", {
        body: { room_id: roomId, participant_name: participantName, participant_id: participantId },
      });

      setIncomingCall({ active: false, callerName: null, callerAvatar: null, callId: null, roomId: null, callerId: null });

      if (error || !data?.token) {
        console.error("[DirectCall] Receiver token generation failed:", error, data);
        toast({ title: "Failed to fetch token", description: "Could not join call. Check your connection.", variant: "destructive" });
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
          directCallId: current.callId,
          callerId: current.callerId,
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

      // Receiver-side: log missed call in chat so BOTH users see it
      if (current.callerId && user?.id) {
        supabase.from("chat_messages").insert({
          sender_id: current.callerId,
          receiver_id: user.id,
          content: "📞 Missed Call",
          is_read: true,
        }).then(() => {});
      }
    }

    setIncomingCall({ active: false, callerName: null, callerAvatar: null, callId: null, roomId: null, callerId: null });
  }, [incomingCall, user?.id]);

  return (
    <CallStateContext.Provider value={{
      callState, incomingCall, outgoingCall, isSearching,
      startCall, endCall, updateCallSeconds,
      triggerIncomingCall, acceptIncomingCall, declineIncomingCall,
      startSearching, stopSearching,
      initiateDirectCall, cancelOutgoingCall, registerCurrentRoom,
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

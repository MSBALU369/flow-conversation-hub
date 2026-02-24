import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  LiveKitRoom,
  AudioConference,
  RoomAudioRenderer,
  StartAudio,
  useRoomContext,
  useParticipants,
  useIsSpeaking,
  useLocalParticipant,
} from "@livekit/components-react";
import { RoomEvent, Track } from "livekit-client";
// LiveKit styles handled via custom CSS
import {
  ArrowLeft,
  RefreshCw,
  Mic,
  MicOff,
  Phone,
  Volume2,
  Gamepad2,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  Shield,
  RefreshCcw,
  MapPin,
  Flag,
  UserPlus,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { LevelBadge } from "@/components/ui/LevelBadge";
import { SignalStrength, type SignalLevel } from "@/components/ui/SignalStrength";
import { useProfile } from "@/hooks/useProfile";
import { useNetworkStrength } from "@/hooks/useNetworkStrength";
import { useCallState } from "@/hooks/useCallState";
import { useToast } from "@/hooks/use-toast";
import { useEnergySystem } from "@/hooks/useEnergySystem";
import { cn, isInAppBrowser } from "@/lib/utils";
import { GameListModal } from "@/components/games/GameListModal";
import { QuizBetModal } from "@/components/games/QuizBetModal";
import { GameBetModal } from "@/components/games/GameBetModal";
import { QuizGameOverlay } from "@/components/games/QuizGameOverlay";
import { WordChainGame } from "@/components/games/WordChainGame";
import { WouldYouRatherGame } from "@/components/games/WouldYouRatherGame";
import { TruthOrDareGame } from "@/components/games/TruthOrDareGame";
import { ChessGame } from "@/components/games/ChessGame";
import { LudoGame } from "@/components/games/LudoGame";
import { SnakeLadderGame } from "@/components/games/SnakeLadderGame";
import { ArcheryGame } from "@/components/games/ArcheryGame";
import { SudokuGame } from "@/components/games/SudokuGame";
import { FloatingGameBubble } from "@/components/games/FloatingGameBubble";

const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL;

const CALL_DURATION_LIMIT = 60;
const WARNING_TIME = 30;


const reportReasons = [
  { id: "no_signal", label: "No signal / Not speaking" },
  { id: "noise", label: "Noise Disturbance" },
  { id: "rude", label: "Rude Behavior" },
  { id: "abusive", label: "Abusive Language" },
  { id: "wrong_gender", label: "Wrong Gender" },
  { id: "spam", label: "Spam/Advertising" },
];

const likeReasons = [
  { id: "polite", label: "Polite & Friendly 😊" },
  { id: "english", label: "Great English Skills 🗣️" },
  { id: "helpful", label: "Helpful & Supportive 🤝" },
  { id: "interesting", label: "Very Interesting 🧠" },
  { id: "intelligent", label: "Intelligent 🎓" },
  { id: "funny", label: "Funny & Entertaining 😂" },
  { id: "personality", label: "Awesome Personality 🌟" },
  { id: "voice", label: "Pleasant Voice 🎙️" },
];

const talkPrompts = [
  "If truth was money, where would you spend it today?",
  "What's one thing you wish you could tell your younger self?",
  "If you could live in any country for a year, where would it be?",
  "What's a skill you'd love to learn and why?",
  "Describe your perfect weekend in three words.",
  "What's the most interesting thing you learned recently?",
  "If you could have dinner with anyone, who would it be?",
  "What's a fear you've overcome and how did you do it?",
  "What makes you laugh the most?",
  "If you could change one thing about the world, what would it be?",
  "What's your favorite childhood memory?",
  "Do you believe in second chances? Why or why not?",
  "What's the best advice you've ever received?",
  "If your life was a movie, what genre would it be?",
  "What does happiness mean to you?",
];

/** Inner call UI — rendered inside <LiveKitRoom> so hooks work */
/** Extracts LiveKit state and passes it down */
function LiveKitBridge({ children }: { children: (lk: { room: any; participants: any[]; localParticipant: any }) => React.ReactNode }) {
  const room = useRoomContext();
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const { registerCurrentRoom } = useCallState();

  // Register room globally for call-waiting disconnect
  useEffect(() => {
    registerCurrentRoom(room);
    return () => registerCurrentRoom(null);
  }, [room, registerCurrentRoom]);

  return <>{children({ room, participants, localParticipant })}</>;
}

/** Safe AudioConference that only renders inside LiveKitRoom */
function SafeAudioConference() {
  return (
    <div style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
      <AudioConference />
    </div>
  );
}

interface LiveKitState {
  room: any | null;
  participants: any[];
  localParticipant: any | null;
}

function CallRoomUI({ lk }: { lk: LiveKitState }) {
  const { room, participants, localParticipant } = lk;
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const partnerId = searchParams.get("partner");
  const statePartnerName = (location.state as any)?.partnerName || null;
  const statePartnerAvatar = (location.state as any)?.partnerAvatar || null;
  const stateMatchedUserId = (location.state as any)?.matchedUserId || null;
  const isFriendCall = !!statePartnerName;
  const { profile, updateProfile } = useProfile();
  const { toast } = useToast();
  const localNetworkState = useNetworkStrength();
  const { startCall, endCall, updateCallSeconds } = useCallState();
  const { isLowEnergy, isEmptyEnergy, energyBars, isPremium: isPremiumEnergy } = useEnergySystem({ isDraining: true });

  const remoteNetworkStatus: { signalLevel: SignalLevel; isOffline: boolean } = {
    signalLevel: 2,
    isOffline: false,
  };

  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const [showGameModal, setShowGameModal] = useState(false);
  const [showQuizBet, setShowQuizBet] = useState(false);
  const [showGameBet, setShowGameBet] = useState(false);
  const [pendingGame, setPendingGame] = useState<string | null>(null);
  const [quizActive, setQuizActive] = useState(false);
  const [quizCategory, setQuizCategory] = useState("general");
  const [quizBetAmount, setQuizBetAmount] = useState(0);
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [gameBetAmount, setGameBetAmount] = useState(0);
  const [gameMinimized, setGameMinimized] = useState(false);
  const [showPostCallModal, setShowPostCallModal] = useState(false);

  const [selectedReportReasons, setSelectedReportReasons] = useState<string[]>([]);
  const [selectedLikeReasons, setSelectedLikeReasons] = useState<string[]>([]);
  const [postCallRating, setPostCallRating] = useState<"like" | "dislike" | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [callStatus, setCallStatus] = useState<"connected" | "talking" | "unavailable">("connected");
  const [showMyProfile, setShowMyProfile] = useState(false);
  const [partnerProfile, setPartnerProfile] = useState<{ username: string | null; avatar_url: string | null; level: number | null; location: string | null } | null>(null);
  const [promptIndex, setPromptIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [pulseIntensity, setPulseIntensity] = useState(0);
  const [isPartnerMuted, setIsPartnerMuted] = useState(false);
  const [showEndCallWarning, setShowEndCallWarning] = useState(false);
  const [hasFollowedPartner, setHasFollowedPartner] = useState(false);

  const callStartTime = useRef<number>(Date.now());

  // Ghost call prevention: disconnect LiveKit + leave matchmaking on tab close
  useEffect(() => {
    const handleBeforeUnload = () => {
      try { room?.disconnect(); } catch {}
      if (profile?.id) {
        // Use sendBeacon pattern for reliability during unload
        supabase.rpc("leave_matchmaking", { p_user_id: profile.id }).then();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [room, profile?.id]);

  // LiveKit: toggle mute — only after room is connected
  useEffect(() => {
    if (localParticipant && room?.state === 'connected') {
      localParticipant.setMicrophoneEnabled(!isMuted);
    }
  }, [isMuted, localParticipant, room?.state]);

  // LiveKit: detect real speaking via audio level events
  useEffect(() => {
    if (!room) return;
    const handleActiveSpeakers = (speakers: any[]) => {
      const localIsSpeaking = speakers.some(s => s.isLocal);
      setIsSpeaking(localIsSpeaking);
      setPulseIntensity(localIsSpeaking ? 0.7 : 0);
    };
    room.on(RoomEvent.ActiveSpeakersChanged, handleActiveSpeakers);
    return () => { room.off(RoomEvent.ActiveSpeakersChanged, handleActiveSpeakers); };
  }, [room]);

  // LiveKit: detect real partner mute status
  useEffect(() => {
    if (!room) return;
    const handleTrackMuted = () => {
      const remoteParticipant = participants.find(p => !p.isLocal);
      if (remoteParticipant) {
        const audioTrack = remoteParticipant.getTrackPublications().find(
          t => t.kind === Track.Kind.Audio
        );
        setIsPartnerMuted(audioTrack?.isMuted ?? false);
      }
    };
    room.on(RoomEvent.TrackMuted, handleTrackMuted);
    room.on(RoomEvent.TrackUnmuted, handleTrackMuted);
    room.on(RoomEvent.ParticipantConnected, handleTrackMuted);
    handleTrackMuted(); // check initial state
    return () => {
      room.off(RoomEvent.TrackMuted, handleTrackMuted);
      room.off(RoomEvent.TrackUnmuted, handleTrackMuted);
      room.off(RoomEvent.ParticipantConnected, handleTrackMuted);
    };
  }, [room, participants]);

  // LiveKit: detect when partner disconnects or room closes — force end call for both users
  const hasHandledDisconnectRef = useRef(false);
  useEffect(() => {
    if (!room) return;
    hasHandledDisconnectRef.current = false;

    const forceEnd = async (isLocalDisconnect = false) => {
      if (hasHandledDisconnectRef.current) return;
      hasHandledDisconnectRef.current = true;
      toast({ title: "Call Ended", description: isLocalDisconnect ? "You were disconnected." : "The other user has left the call." });
      try { room.disconnect(); } catch {}
      endCall();

      // Clean up matchmaking queue + update calls table to ended
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        supabase.rpc("leave_matchmaking", { p_user_id: user.id }).then();

        // FIX #4: Network drop zombie — update any active calls to 'ended'
        const directCallId = (location.state as any)?.directCallId;
        if (directCallId) {
          supabase.from("calls").update({ status: "ended", ended_at: new Date().toISOString() }).eq("id", directCallId).then();
        }
      }

      // Show post-call modal instead of navigating away (so user can rate)
      if (!isFriendCall) {
        setPostCallRating(null);
        setSelectedReportReasons([]);
        setSelectedLikeReasons([]);
        setShowPostCallModal(true);
      } else {
        navigate("/");
      }
    };

    const handleParticipantDisconnected = (participant: any) => {
      if (!participant.isLocal) forceEnd(false);
    };
    // FIX #4: Local disconnect (network drop) also updates DB
    const handleRoomDisconnected = () => forceEnd(true);

    room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
    room.on(RoomEvent.Disconnected, handleRoomDisconnected);
    return () => {
      room.off(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected);
      room.off(RoomEvent.Disconnected, handleRoomDisconnected);
    };
  }, [room, endCall, navigate, toast, isFriendCall, location.state]);

  // Fetch partner profile from real data
  useEffect(() => {
    const effectivePartnerId = partnerId || stateMatchedUserId;
    if (effectivePartnerId) {
      const fetchPartner = async () => {
        const { data } = await supabase
          .from("profiles")
          .select("username, avatar_url, level, location_city, country")
          .eq("id", effectivePartnerId)
          .single();
        if (data) setPartnerProfile({ ...data, location: [data.location_city, data.country].filter(Boolean).join(", ") || null });
        else setPartnerProfile({ username: "Anonymous", avatar_url: null, level: 1, location: null });
      };
      fetchPartner();
    } else if (statePartnerName) {
      setPartnerProfile({
        username: statePartnerName,
        avatar_url: statePartnerAvatar,
        level: 1,
        location: null,
      });
    } else {
      setPartnerProfile({ username: "Anonymous", avatar_url: null, level: 1, location: null });
    }
  }, [partnerId, stateMatchedUserId, statePartnerName, statePartnerAvatar]);

  // Start call state globally
  useEffect(() => {
    startCall(partnerProfile?.username || null, partnerProfile?.avatar_url || null);
    return () => {};
  }, [partnerProfile]);

  useEffect(() => {
    const talkingTimer = setTimeout(() => {
      setCallStatus("talking");
    }, 1000);
    return () => clearTimeout(talkingTimer);
  }, []);

  // Timer
  useEffect(() => {
    if (!isConnected) return;
    setSeconds(0);
    setShowWarning(false);
    const interval = setInterval(() => {
      setSeconds((s) => {
        const next = s + 1;
        updateCallSeconds(next);
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isConnected]);

  useEffect(() => {
    if (seconds === WARNING_TIME && !showWarning) setShowWarning(true);
  }, [seconds, showWarning]);

  // Energy empty: auto-end call and redirect home
  useEffect(() => {
    if (isEmptyEnergy && !isPremiumEnergy) {
      toast({ title: "⚡ Low Energy", description: "Your battery is empty. Call ended." });
      handleEndCall(true);
      setTimeout(() => navigate("/"), 500);
    }
  }, [isEmptyEnergy, isPremiumEnergy]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercent = (seconds % CALL_DURATION_LIMIT) / CALL_DURATION_LIMIT * 100;

  const handleAttemptEndCall = () => {
    if (seconds < 60) {
      setShowEndCallWarning(true);
    } else {
      handleEndCall();
    }
  };

  const handleEndCall = async (skipPostCallModal = false) => {
    const callDuration = seconds;

    // Disconnect from LiveKit room
    hasHandledDisconnectRef.current = true; // prevent forceEnd from also firing
    try { room?.disconnect(); } catch {}
    endCall();

    if (isFriendCall || skipPostCallModal) {
      if (!skipPostCallModal) navigate(-1);
    } else {
      setPostCallRating(null);
      setSelectedReportReasons([]);
      setSelectedLikeReasons([]);
      setShowPostCallModal(true);
    }

    // Background DB work: save call history + clean matchmaking queue + log call in chat
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // FIX #5: Only the caller inserts call_history to prevent duplication
      const directCallId = (location.state as any)?.directCallId;
      const callerId = (location.state as any)?.callerId;
      const isCallerOrInitiator = !directCallId || callerId === undefined || user.id === callerId;
      if (isCallerOrInitiator) {
        supabase.from("call_history").insert({
          user_id: user.id,
          duration: callDuration,
          partner_name: partnerProfile?.username || "Partner",
          status: "outgoing",
        }).then(() => {});
      }
      supabase.rpc("leave_matchmaking", { p_user_id: user.id }).then();

      // Update calls table to ended
      if (directCallId) {
        supabase.from("calls").update({ status: "ended", ended_at: new Date().toISOString(), duration_sec: callDuration }).eq("id", directCallId).then();
      }

      // Instagram-style: log call as system message in chat_messages for friend calls
      const effectivePartnerId = partnerId || stateMatchedUserId;
      if (isFriendCall && effectivePartnerId) {
        const mins = Math.floor(callDuration / 60);
        const secs = callDuration % 60;
        const durationStr = mins > 0 ? `${mins}:${secs.toString().padStart(2, "0")} mins` : `${secs}s`;
        const callLabel = callDuration < 5 ? "📞 Missed Call" : `📞 Outgoing Call - ${durationStr}`;
        supabase.from("chat_messages").insert({
          sender_id: user.id,
          receiver_id: effectivePartnerId,
          content: callLabel,
        }).then(() => {});
      }
    }

    // Penalty logic
    const currentBars = profile?.energy_bars ?? 5;
    const currentCoins = profile?.coins ?? 0;
    const currentEarlyEndCount = (profile as any)?.early_end_count ?? 0;
    let batteryChange = 0;
    let coinDeduction = 0;
    let newEarlyEndCount = currentEarlyEndCount;

    if (callDuration < 30) {
      coinDeduction = currentCoins > 0 ? 2 : 0;
      newEarlyEndCount += 1;
      if (newEarlyEndCount % 2 === 0) batteryChange -= 1;
    } else if (callDuration < 60) {
      coinDeduction = currentCoins > 0 ? 1 : 0;
      newEarlyEndCount += 1;
    } else {
      batteryChange = 1;
      newEarlyEndCount = 0;
    }

    if (callDuration < 60 && newEarlyEndCount > 0 && newEarlyEndCount % 3 === 0) {
      batteryChange -= 1;
    }

    if (callDuration >= 1200) batteryChange = 7 - currentBars;

    // Backend-first: update Supabase directly, then local state syncs via realtime
    const updates: any = { early_end_count: newEarlyEndCount };
    if (batteryChange !== 0) {
      updates.energy_bars = Math.max(0, Math.min(7, currentBars + batteryChange));
    }
    if (coinDeduction > 0) {
      updates.coins = Math.max(0, currentCoins - coinDeduction);
    }
    if (user) {
      const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);
      if (error) {
        console.error("Failed to update profile penalties:", error);
        // Fallback to context update
        updateProfile(updates);
      }
      // Realtime subscription in useProfile will auto-sync the UI
    } else {
      updateProfile(updates);
    }
  };

  const handleSubmitPostCall = async () => {
    const effectivePartnerId = partnerId || stateMatchedUserId;
    const { data: { user } } = await supabase.auth.getUser();

    if (postCallRating === "like" && effectivePartnerId) {
      // Increment partner's XP as a trust reward (+5 XP per like)
      supabase.from("profiles")
        .update({ xp: ((partnerProfile as any)?.xp ?? 0) + 5 })
        .eq("id", effectivePartnerId)
        .then();
      // Insert notification for the liked user
      if (user) {
        supabase.from("notifications").insert({
          user_id: effectivePartnerId,
          type: "like",
          title: "Someone liked you!",
          message: selectedLikeReasons.length > 0
            ? likeReasons.filter(r => selectedLikeReasons.includes(r.id)).map(r => r.label).join(", ")
            : "You received a like after a call.",
          from_user_id: user.id,
        }).then();
      }
      toast({ title: `👍 You liked ${partnerProfile?.username || "Anonymous"}`, duration: 2000 });
    } else if (postCallRating === "dislike" && effectivePartnerId) {
      // Insert report row
      if (user) {
        supabase.from("reports").insert({
          reporter_id: user.id,
          reported_user_id: effectivePartnerId,
          reason: selectedReportReasons.length > 0
            ? reportReasons.filter(r => selectedReportReasons.includes(r.id)).map(r => r.label).join(", ")
            : "Disliked after call",
          description: null,
        }).then();
        // Increment partner's reports_count
        supabase.rpc("check_premium_expiration" as any, { p_user_id: effectivePartnerId }).then(); // reuse as a ping
        supabase.from("profiles")
          .update({ reports_count: ((partnerProfile as any)?.reports_count ?? 0) + 1 })
          .eq("id", effectivePartnerId)
          .then();
      }
      toast({ title: selectedReportReasons.length > 0 ? "Report Submitted" : `👎 You disliked ${partnerProfile?.username || "Anonymous"}`, description: selectedReportReasons.length > 0 ? "Thank you for helping keep our community safe." : undefined, duration: 2000 });
    }
    navigate("/");
  };

  const handleReconnect = () => {
    setIsConnected(false);
    setCallStatus("connected");
    setIsSpeaking(false);
    setPulseIntensity(0);
    setSeconds(0);
    toast({ title: "Reconnecting...", description: "Reconnecting with the same user" });
    setTimeout(() => {
      setIsConnected(true);
      setCallStatus("connected");
    }, 2000);
    setTimeout(() => {
      setCallStatus("talking");
    }, 3000);
  };

  return (
    <div className="min-h-screen flex flex-col call-immersive-bg">

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4 safe-top">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="w-12 h-12 rounded-2xl glass-button flex items-center justify-center hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </button>
          <button onClick={() => navigate("/profile")}>
            <LevelBadge level={profile?.level || 1} size="md" className="bg-primary/90 shadow-md cursor-pointer" />
          </button>
        </div>

        <button
          onClick={handleReconnect}
          className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-muted/50 transition-colors"
          title="Reconnect"
        >
          <RefreshCcw className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Signal Status */}
        <div className="flex items-end gap-1.5 -ml-3">
          <p className={cn(
            "text-[10px] leading-none",
            localNetworkState.isOffline
              ? "text-destructive"
              : !isConnected
                ? "text-muted-foreground animate-pulse"
                : localNetworkState.signalLevel >= 3
                  ? "text-green-400"
                  : localNetworkState.signalLevel === 2
                    ? "text-[hsl(var(--ef-streak))]"
                    : "text-destructive"
          )}>
            {localNetworkState.isOffline
              ? "No Network"
              : !isConnected
                ? "Connecting..."
                : localNetworkState.signalLevel >= 4
                  ? "Excellent"
                  : localNetworkState.signalLevel === 3
                    ? "Good"
                    : localNetworkState.signalLevel === 2
                      ? "Fair"
                      : "Weak"
            }
          </p>
          <SignalStrength
            level={isConnected ? localNetworkState.signalLevel : 0}
            showNA={localNetworkState.isOffline}
          />
        </div>

        <button
          onClick={() => setShowGameModal(true)}
          className="flex flex-col items-center gap-0.5"
        >
          <div className="w-12 h-12 rounded-2xl glass-button flex items-center justify-center hover:bg-muted transition-colors">
            <Gamepad2 className="w-6 h-6 text-foreground" />
          </div>
          <span className="text-[10px] text-muted-foreground font-medium">Games</span>
        </button>
      </header>

      {/* Talk Prompt Banner */}
      <div className="w-full flex justify-center px-4">
        <div className="w-full max-w-[320px] mx-auto px-3 py-2 rounded-xl bg-[hsl(0,0%,15%)]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-white/70 text-xs flex items-center gap-1.5">
              <span className="text-sm">💡</span> Talk about
            </span>
            <button
              onClick={() => setPromptIndex((prev) => (prev + 1) % talkPrompts.length)}
              className="text-white text-xs flex items-center gap-1 hover:text-white/80 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Next
            </button>
          </div>
          <p className="text-white text-xs leading-relaxed">
            {talkPrompts[promptIndex]}
          </p>
        </div>
      </div>

      {/* Safety Warning */}
      <div className="flex items-center justify-center gap-1.5 text-[10px] px-4 mt-5 mb-4">
        <Shield className="w-3 h-3 text-yellow-400" />
        <span className="text-yellow-400 font-semibold">Be careful & don't share your personal details</span>
      </div>

      {/* Bottom section */}
      <div className="px-4 pb-3 safe-bottom mt-12">
        {/* User Signal Strength - above avatar */}
        <div className="flex items-end gap-1.5 mb-8 justify-center -mt-12">
          <p className={cn(
            "text-[10px] leading-none",
            remoteNetworkStatus.isOffline
              ? "text-destructive"
              : !isConnected
                ? "text-muted-foreground animate-pulse"
                : remoteNetworkStatus.signalLevel >= 3
                  ? "text-green-400"
                  : remoteNetworkStatus.signalLevel === 2
                    ? "text-[hsl(var(--ef-streak))]"
                    : "text-destructive"
          )}>
            {remoteNetworkStatus.isOffline
              ? "No Network"
              : !isConnected
                ? "Connecting..."
                : remoteNetworkStatus.signalLevel >= 4
                  ? "Excellent"
                  : remoteNetworkStatus.signalLevel === 3
                    ? "Good"
                    : remoteNetworkStatus.signalLevel === 2
                      ? "Fair"
                      : "Weak"
            }
          </p>
          <SignalStrength
            level={isConnected ? remoteNetworkStatus.signalLevel : 0}
            showNA={remoteNetworkStatus.isOffline}
          />
        </div>

        {/* Partner Avatar with active speaker glow */}
        <div className="flex flex-col items-center mb-3">
          <button
            className="relative mb-1"
            onClick={() => navigate(`/user/${partnerId || 'demo'}`, {
              state: {
                id: partnerId || 'demo',
                name: partnerProfile?.username || 'Partner',
                avatar: partnerProfile?.avatar_url || null,
                level: partnerProfile?.level || 1,
                isOnline: true,
                followersCount: 128,
                followingCount: 45,
                fansCount: 32,
                location: partnerProfile?.location || "Istanbul, Turkey",
                uniqueId: "EF7K2M9X4PQ1",
                createdAt: "2024-09-15",
              }
            })}
          >
            {/* Active speaker glow rings */}
            {isSpeaking && callStatus === "talking" && (
              <>
                <div
                  className="absolute inset-0 rounded-full border-2 border-green-400/60 z-0"
                  style={{
                    transform: `scale(${1 + pulseIntensity * 0.25})`,
                    opacity: pulseIntensity * 0.7,
                    transition: 'transform 0.15s ease-out, opacity 0.15s ease-out'
                  }}
                />
                <div
                  className="absolute inset-0 rounded-full border-2 border-green-400/30 z-0"
                  style={{
                    transform: `scale(${1 + pulseIntensity * 0.45})`,
                    opacity: pulseIntensity * 0.4,
                    transition: 'transform 0.2s ease-out, opacity 0.2s ease-out'
                  }}
                />
              </>
            )}
            <Avatar className="w-24 h-24 relative z-10">
              <AvatarImage src={partnerProfile?.avatar_url || undefined} />
              <AvatarFallback className="text-4xl bg-muted">👤</AvatarFallback>
            </Avatar>
            {isPartnerMuted && (
              <div className="absolute top-0 right-0 z-30 w-7 h-7 rounded-full bg-destructive flex items-center justify-center shadow-lg">
                <MicOff className="w-3.5 h-3.5 text-white" />
              </div>
            )}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 z-20">
              <LevelBadge level={partnerProfile?.level || 1} size="md" />
            </div>
          </button>
        </div>

        <div className="flex flex-col items-center gap-0.5 mb-3">
          <h2 className="text-lg font-bold text-primary-foreground">{partnerProfile?.username || "Partner"}</h2>
          {partnerProfile?.location && (
            <p className="text-xs font-medium text-blue-400 flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {partnerProfile.location.replace(", ", " | ")}
            </p>
          )}
        </div>

        {/* Call Status */}
        <div className="flex items-center gap-1.5 justify-center mb-3">
          <span className={cn(
            "w-2 h-2 rounded-full animate-pulse",
            callStatus === "unavailable" ? "bg-destructive" : "bg-green-500"
          )} />
          <p className={cn(
            "text-xs font-medium",
            callStatus === "unavailable" ? "text-destructive" : isMuted ? "text-destructive" : "text-green-500"
          )}>
            {callStatus === "unavailable" ? "Unavailable" : callStatus === "connected" ? "Connected" : isMuted ? "Muted" : "Talking"}
          </p>
          {callStatus === "talking" && (
            <span className="flex items-center justify-center">
              {isMuted ? (
                <MicOff className="w-4 h-4 text-destructive" />
              ) : (
                <Mic className="w-4 h-4 text-green-500" />
              )}
            </span>
          )}
        </div>

        {/* Progress Bar */}
        <div className="flex justify-center mb-3 mt-4">
          <div className="max-w-[200px] w-full">
            <Progress value={progressPercent} className="h-1.5" />
          </div>
        </div>

        {/* Timer Display */}
        <div className="text-center mb-4">
          <span
            className={cn(
              "font-mono text-2xl font-semibold",
              isConnected
                ? showWarning
                  ? "text-[hsl(var(--ef-streak))]"
                  : "text-primary-foreground"
                : "text-primary-foreground/60"
            )}
          >
            {isConnected ? formatTime(seconds) : "00:00"}
          </span>
        </div>

        {/* Floating Glass Control Bar */}
        <div className="flex justify-center mb-3">
          <div className="floating-control-bar">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`call-control-pill ${isMuted ? 'active-destructive' : ''}`}
            >
              {isMuted ? (
                <MicOff className="w-4 h-4 text-destructive" />
              ) : (
                <Mic className="w-4 h-4 text-foreground" />
              )}
              <span className="text-[10px] mt-0.5">{isMuted ? 'Unmute' : 'Mute'}</span>
            </button>

            <button
              onClick={handleAttemptEndCall}
              className="call-control-end-pill"
            >
              <Phone className="w-6 h-6 rotate-[135deg] text-white" />
              <span className="text-[10px] mt-0.5 text-white">End</span>
            </button>

            <button
              onClick={() => setIsSpeaker(!isSpeaker)}
              className={`call-control-pill ${isSpeaker ? 'active-primary' : ''}`}
            >
              <Volume2 className={`w-4 h-4 ${isSpeaker ? 'text-primary' : 'text-foreground'}`} />
              <span className="text-[10px] mt-0.5">Speaker</span>
            </button>
          </div>
        </div>
      </div>

      {/* Ad Area */}
      <div className="px-4 pb-2 mt-auto pt-2">
        <div className="rounded-xl bg-muted/20 border border-border/30 flex items-center justify-center overflow-hidden" style={{ minHeight: 150 }}>
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <span className="text-xs font-medium">🎬 Auto Banner Ads</span>
            <span className="text-[10px]">Silent ads will play here</span>
          </div>
        </div>
      </div>

      {/* End Call Warning + Rating Modal */}
      <Dialog open={showEndCallWarning} onOpenChange={setShowEndCallWarning}>
        <DialogContent className="glass-card border-border max-w-[320px]">
          <DialogHeader>
            <DialogTitle className="text-foreground text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              End Call?
            </DialogTitle>
          </DialogHeader>
          {seconds < 30 ? (
            <div className="space-y-1.5">
              <p className="text-destructive text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-destructive flex-shrink-0" />
                Ending before 30 seconds will cost you 2 coins and battery will drain.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <p className="text-destructive text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-destructive flex-shrink-0" />
                Ending before 1 minute will cost you 1 coin.
              </p>
              <p className="text-muted-foreground text-xs flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                Ending early 3 times will drain 1 battery bar.
              </p>
            </div>
          )}

          {!isFriendCall && (
            <div className="space-y-3 pt-2">
              <p className="text-muted-foreground text-xs text-center">Rate your experience</p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => { setPostCallRating("like"); setSelectedReportReasons([]); setSelectedLikeReasons([]); }}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2 rounded-2xl transition-all border-2",
                    postCallRating === "like"
                      ? "border-green-500/60 bg-green-500/10"
                      : "border-transparent hover:bg-muted/50"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                    postCallRating === "like" ? "bg-green-500/30" : "bg-green-500/20"
                  )}>
                    {postCallRating === "like"
                      ? <Flag className="w-5 h-5 text-green-400 fill-green-400" />
                      : <ThumbsUp className="w-5 h-5 text-green-400" />
                    }
                  </div>
                  <span className="text-foreground text-[10px]">{postCallRating === "like" ? "Liked" : "Like"}</span>
                </button>
                <button
                  onClick={() => { setPostCallRating("dislike"); setSelectedLikeReasons([]); }}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2 rounded-2xl transition-all border-2",
                    postCallRating === "dislike"
                      ? "border-destructive/60 bg-destructive/10"
                      : "border-transparent hover:bg-muted/50"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                    postCallRating === "dislike" ? "bg-destructive/30" : "bg-destructive/20"
                  )}>
                    {postCallRating === "dislike"
                      ? <Flag className="w-5 h-5 text-destructive fill-destructive" />
                      : <ThumbsDown className="w-5 h-5 text-destructive" />
                    }
                  </div>
                  <span className="text-foreground text-[10px]">{postCallRating === "dislike" ? "Disliked" : "Dislike"}</span>
                </button>
              </div>

              {postCallRating === "dislike" && (
                <div className="space-y-1.5">
                  <p className="text-muted-foreground text-[10px]">Report a reason (optional):</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {reportReasons.map((reason) => (
                      <button
                        key={reason.id}
                        onClick={() => setSelectedReportReasons(prev =>
                          prev.includes(reason.id) ? prev.filter(r => r !== reason.id) : [...prev, reason.id]
                        )}
                        className={cn(
                          "p-1.5 rounded-lg text-center text-[10px] transition-colors",
                          selectedReportReasons.includes(reason.id)
                            ? "bg-destructive/20 border border-destructive/50"
                            : "glass-button hover:bg-muted/50"
                        )}
                      >
                        <span className="text-foreground">{reason.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {postCallRating === "like" && (
                <div className="space-y-1.5">
                  <p className="text-muted-foreground text-[10px]">What did you like? (optional):</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {likeReasons.map((reason) => (
                      <button
                        key={reason.id}
                        onClick={() => setSelectedLikeReasons(prev =>
                          prev.includes(reason.id) ? prev.filter(r => r !== reason.id) : [...prev, reason.id]
                        )}
                        className={cn(
                          "p-1.5 rounded-lg text-center text-[10px] transition-colors",
                          selectedLikeReasons.includes(reason.id)
                            ? "bg-green-500/20 border border-green-500/50"
                            : "glass-button hover:bg-muted/50"
                        )}
                      >
                        <span className="text-foreground">{reason.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => { setShowEndCallWarning(false); setPostCallRating(null); setSelectedReportReasons([]); }} className="flex-1">
              Stay
            </Button>
            <Button variant="destructive" onClick={() => {
              setShowEndCallWarning(false);
              if (postCallRating === "dislike" && selectedReportReasons.length > 0) {
                toast({ title: "Report Submitted", description: "Thank you for helping keep our community safe.", duration: 2000 });
              } else if (postCallRating === "like") {
                toast({ title: `👍 You liked ${partnerProfile?.username || "Anonymous"}`, duration: 2000 });
              } else if (postCallRating === "dislike") {
                toast({ title: `👎 You disliked ${partnerProfile?.username || "Anonymous"}`, duration: 2000 });
              }
              room?.disconnect();
              endCall();
              if (isFriendCall) {
                navigate(-1);
              } else {
                navigate("/");
              }
              handleEndCall(true);
            }} className="flex-1">
              End Call
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Game List Modal */}
      <GameListModal
        open={showGameModal}
        onOpenChange={setShowGameModal}
        onSelectGame={(game) => {
          setShowGameModal(false);
          if (game === "quiz") {
            setShowQuizBet(true);
          } else {
            setPendingGame(game);
            setShowGameBet(true);
          }
        }}
      />

      <QuizBetModal
        open={showQuizBet}
        onOpenChange={setShowQuizBet}
        onStart={(cat, bet) => {
          setQuizCategory(cat);
          setQuizBetAmount(bet);
          setShowQuizBet(false);
          setQuizActive(true);
        }}
      />

      <GameBetModal
        open={showGameBet}
        onOpenChange={setShowGameBet}
        gameId={pendingGame || ""}
        onStart={(bet) => {
          setGameBetAmount(bet);
          setActiveGame(pendingGame);
          setShowGameBet(false);
          setPendingGame(null);
        }}
      />

      {quizActive && !gameMinimized && (
        <QuizGameOverlay
          category={quizCategory}
          betAmount={quizBetAmount}
          partnerName={partnerProfile?.username || "Partner"}
          onClose={() => { setQuizActive(false); setGameMinimized(false); }}
          onMinimize={() => setGameMinimized(true)}
        />
      )}

      {activeGame === "wordchain" && !gameMinimized && <WordChainGame betAmount={gameBetAmount} partnerName={partnerProfile?.username || "Partner"} onClose={() => { setActiveGame(null); setGameMinimized(false); setGameBetAmount(0); }} onMinimize={() => setGameMinimized(true)} room={room} />}
      {activeGame === "wouldyourather" && !gameMinimized && <WouldYouRatherGame betAmount={gameBetAmount} partnerName={partnerProfile?.username || "Partner"} onClose={() => { setActiveGame(null); setGameMinimized(false); setGameBetAmount(0); }} onMinimize={() => setGameMinimized(true)} />}
      {activeGame === "truthordare" && !gameMinimized && <TruthOrDareGame betAmount={gameBetAmount} partnerName={partnerProfile?.username || "Partner"} onClose={() => { setActiveGame(null); setGameMinimized(false); setGameBetAmount(0); }} onMinimize={() => setGameMinimized(true)} />}
      {activeGame === "chess" && !gameMinimized && <ChessGame betAmount={gameBetAmount} partnerName={partnerProfile?.username || "Partner"} onClose={() => { setActiveGame(null); setGameMinimized(false); setGameBetAmount(0); }} onMinimize={() => setGameMinimized(true)} room={room} />}
      {activeGame === "ludo" && !gameMinimized && <LudoGame betAmount={gameBetAmount} partnerName={partnerProfile?.username || "Partner"} onClose={() => { setActiveGame(null); setGameMinimized(false); setGameBetAmount(0); }} onMinimize={() => setGameMinimized(true)} room={room} />}

      {activeGame === "snakeandladder" && !gameMinimized && <SnakeLadderGame betAmount={gameBetAmount} partnerName={partnerProfile?.username || "Partner"} onClose={() => { setActiveGame(null); setGameMinimized(false); setGameBetAmount(0); }} onMinimize={() => setGameMinimized(true)} />}
      {activeGame === "archery" && !gameMinimized && <ArcheryGame betAmount={gameBetAmount} partnerName={partnerProfile?.username || "Partner"} onClose={() => { setActiveGame(null); setGameMinimized(false); setGameBetAmount(0); }} onMinimize={() => setGameMinimized(true)} />}
      {activeGame === "sudoku" && !gameMinimized && <SudokuGame betAmount={gameBetAmount} partnerName={partnerProfile?.username || "Partner"} onClose={() => { setActiveGame(null); setGameMinimized(false); setGameBetAmount(0); }} onMinimize={() => setGameMinimized(true)} />}

      {gameMinimized && (activeGame || quizActive) && (
        <FloatingGameBubble
          gameName={activeGame || "quiz"}
          onReopen={() => setGameMinimized(false)}
        />
      )}

      {/* Post-Call Modal */}
      <Dialog open={showPostCallModal} onOpenChange={setShowPostCallModal}>
        <DialogContent className="glass-card border-border max-w-[320px]">
          <DialogHeader>
            <DialogTitle className="text-foreground text-lg text-center">Rate your experience</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex justify-center gap-4">
              <button
                onClick={() => { setPostCallRating("like"); setSelectedReportReasons([]); setSelectedLikeReasons([]); }}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-2xl transition-all border-2",
                  postCallRating === "like"
                    ? "border-green-500/60 bg-green-500/10"
                    : "border-transparent hover:bg-muted/50"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                  postCallRating === "like" ? "bg-primary" : "bg-primary/80"
                )}>
                  {postCallRating === "like"
                    ? <Flag className="w-5 h-5 text-primary-foreground fill-primary-foreground" />
                    : <ThumbsUp className="w-5 h-5 text-primary-foreground" />
                  }
                </div>
                <span className="text-foreground text-[10px]">{postCallRating === "like" ? "Liked" : "Like"}</span>
              </button>
              <button
                onClick={() => { setPostCallRating("dislike"); setSelectedLikeReasons([]); }}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-2xl transition-all border-2",
                  postCallRating === "dislike"
                    ? "border-destructive/60 bg-destructive/10"
                    : "border-transparent hover:bg-muted/50"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                  postCallRating === "dislike" ? "bg-destructive" : "bg-destructive/80"
                )}>
                  {postCallRating === "dislike"
                    ? <Flag className="w-5 h-5 text-destructive-foreground fill-destructive-foreground" />
                    : <ThumbsDown className="w-5 h-5 text-destructive-foreground" />
                  }
                </div>
                <span className="text-foreground text-[10px]">{postCallRating === "dislike" ? "Disliked" : "Dislike"}</span>
              </button>
            </div>

            {postCallRating === "dislike" && (
              <div className="space-y-1.5">
                <p className="text-muted-foreground text-[10px]">Report a reason (optional):</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {reportReasons.map((reason) => (
                    <button
                      key={reason.id}
                      onClick={() => setSelectedReportReasons(prev =>
                        prev.includes(reason.id) ? prev.filter(r => r !== reason.id) : [...prev, reason.id]
                      )}
                      className={cn(
                        "p-1.5 rounded-lg text-center text-[10px] transition-colors",
                        selectedReportReasons.includes(reason.id)
                          ? "bg-destructive/20 border border-destructive/50"
                          : "glass-button hover:bg-muted/50"
                      )}
                    >
                      <span className="text-foreground">{reason.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {postCallRating === "like" && (
              <div className="space-y-1.5">
                <p className="text-muted-foreground text-[10px]">What did you like? (optional):</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {likeReasons.map((reason) => (
                    <button
                      key={reason.id}
                      onClick={() => setSelectedLikeReasons(prev =>
                        prev.includes(reason.id) ? prev.filter(r => r !== reason.id) : [...prev, reason.id]
                      )}
                      className={cn(
                        "p-1.5 rounded-lg text-center text-[10px] transition-colors",
                        selectedLikeReasons.includes(reason.id)
                          ? "bg-green-500/20 border border-green-500/50"
                          : "glass-button hover:bg-muted/50"
                      )}
                    >
                      <span className="text-foreground">{reason.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <DialogFooter className="flex flex-col gap-2 sm:flex-col pt-1">
              <Button variant="destructive" onClick={handleSubmitPostCall} className="w-full">
                End Call
              </Button>
              <Button onClick={() => { setShowPostCallModal(false); setPostCallRating(null); setSelectedReportReasons([]); setSelectedLikeReasons([]); }} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                Stay
              </Button>

              {/* Follow User Button - small, below Stay with 3-step gap */}
              <div className="mt-6">
                {(partnerId || stateMatchedUserId) && !hasFollowedPartner && (
                  <button
                    onClick={async () => {
                      const effectivePartnerId = partnerId || stateMatchedUserId;
                      const { data: { user: authUser } } = await supabase.auth.getUser();
                      if (!authUser || !effectivePartnerId) return;
                      await supabase.from("friendships").insert({ user_id: authUser.id, friend_id: effectivePartnerId, status: "accepted" });
                      setHasFollowedPartner(true);
                      toast({ title: `Followed ${partnerProfile?.username || "User"}!`, duration: 2000 });
                    }}
                    className="w-full py-1.5 rounded-lg bg-blue-500 border border-blue-600 text-white text-[11px] font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <UserPlus className="w-3 h-3" />
                    Follow {partnerProfile?.username || "User"}
                  </button>
                )}
                {hasFollowedPartner && (
                  <p className="text-center text-[11px] text-primary font-medium">✓ Following {partnerProfile?.username || "User"}</p>
                )}
              </div>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* My Profile Popup */}
      <Dialog open={showMyProfile} onOpenChange={setShowMyProfile}>
        <DialogContent className="max-w-[280px] rounded-3xl glass-card border-border p-5">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <Avatar className="w-20 h-20 border-2 border-primary">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-muted text-lg">👤</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center border-2 border-background">
                <span className="text-primary-foreground text-[10px] font-bold">{profile?.level || 1}</span>
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-foreground font-bold text-base">{profile?.username || "You"}</h3>
              <p className="text-muted-foreground text-xs">Level {profile?.level || 1}</p>
              {profile?.location_city && (
                <p className="text-muted-foreground text-[10px] mt-0.5">{profile.location_city}{profile.country ? `, ${profile.country}` : ""}</p>
              )}
            </div>
            <div className="flex gap-4 text-center">
              <div>
                <p className="text-foreground font-bold text-sm">{profile?.following_count ?? 0}</p>
                <p className="text-muted-foreground text-[10px]">Following</p>
              </div>
              <div>
                <p className="text-foreground font-bold text-sm">{profile?.followers_count ?? 0}</p>
                <p className="text-muted-foreground text-[10px]">Followers</p>
              </div>
              <div>
                <p className="text-foreground font-bold text-sm">{profile?.streak_count ?? 0}</p>
                <p className="text-muted-foreground text-[10px]">Streak</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => {
                setShowMyProfile(false);
                navigate("/profile");
              }}
            >
              View Full Profile
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Main Call component — wraps everything in LiveKitRoom */
export default function Call() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { endCall } = useCallState();
  const livekitToken = (location.state as any)?.livekitToken || null;
  const roomId = (location.state as any)?.roomId || null;
  const directCallId = (location.state as any)?.directCallId || null;
  const callMode = directCallId ? "direct" : livekitToken ? "matched" : "none";

  console.log("[Call] Call Mode:", callMode, "| roomId:", roomId, "| hasToken:", !!livekitToken, "| directCallId:", directCallId);

  const noLiveKit: LiveKitState = { room: null, participants: [], localParticipant: null };

  // WebView escape hatch — block call entirely
  if (isInAppBrowser()) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center gap-6">
        <AlertTriangle className="w-16 h-16 text-destructive" />
        <h1 className="text-2xl font-bold text-foreground">In-App Browser Detected</h1>
        <p className="text-muted-foreground max-w-sm">
          ⚠️ You are using an In-App Browser. Microphone access is blocked by this app.
          Please tap the menu icon (•••) and select <strong>"Open in System Browser"</strong> or <strong>"Open in Chrome/Safari"</strong>.
        </p>
        <Button
          onClick={() => {
            navigator.clipboard.writeText(window.location.origin);
            const el = document.getElementById("copy-feedback");
            if (el) el.textContent = "✅ Link Copied!";
          }}
          className="gap-2"
          size="lg"
        >
          📋 Copy Link
        </Button>
        <p id="copy-feedback" className="text-sm text-primary font-medium h-5"></p>
        <Button variant="outline" onClick={() => navigate("/")} className="mt-2">
          ← Go Home
        </Button>
      </div>
    );
  }

  // If no token (e.g. direct navigation or friend call), render without LiveKit
  if (!livekitToken) {
    return <CallRoomUI lk={noLiveKit} />;
  }

  const handleLiveKitError = (error: Error) => {
    console.error("[LiveKit] Connection error:", error);
    toast({ title: "LiveKit connection failed", description: error.message || "Could not connect to the call server.", variant: "destructive" });
  };

  const handleLiveKitDisconnected = () => {
    console.warn("[LiveKit] Room disconnected");
  };

  console.log("[LiveKit] Connecting to room:", roomId, "with token length:", livekitToken?.length);

  // key={livekitToken} forces full remount on token change (call-waiting transition)
  return (
    <LiveKitRoom
      key={livekitToken}
      serverUrl={LIVEKIT_URL}
      token={livekitToken}
      connect={true}
      audio={true}
      video={false}
      style={{ height: "100%" }}
      onError={handleLiveKitError}
      onDisconnected={handleLiveKitDisconnected}
    >
      <SafeAudioConference />
      <RoomAudioRenderer />
      <StartAudio label="Tap to enable audio" className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold shadow-lg animate-pulse" />
      <LiveKitBridge>
        {(lk) => <CallRoomUI lk={lk} />}
      </LiveKitBridge>
    </LiveKitRoom>
  );
}

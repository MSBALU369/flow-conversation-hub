import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import worldMapImg from "@/assets/world-map.png";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const SEARCH_TIMEOUT = 30;
const POLL_INTERVAL = 2500; // Poll every 2.5 seconds

const STATUS_MESSAGES = [
  "Finding a perfect partner for you...",
  "Searching in Europe...",
  "Connecting to India...",
  "Looking for the best match...",
  "Scanning Australia...",
  "Checking in New York...",
];

export default function FindingUser() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useProfile();
  const { user } = useAuth();
  const { toast } = useToast();
  const [countdown, setCountdown] = useState(SEARCH_TIMEOUT);
  const [statusIndex, setStatusIndex] = useState(0);
  const [showNoMatchModal, setShowNoMatchModal] = useState(false);
  const [isFetchingToken, setIsFetchingToken] = useState(false);
  const [isMatched, setIsMatched] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  // Read premium filters from route state
  const levelFilter = (location.state as any)?.levelFilter || null;
  const genderFilter = (location.state as any)?.genderFilter || null;
  const hasFilters = !!(levelFilter || genderFilter);

  const [filtersActive, setFiltersActive] = useState(hasFilters);
  const [filterTimeout, setFilterTimeout] = useState(false);

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = countdown / SEARCH_TIMEOUT;
  const strokeDashoffset = circumference * (1 - progress);

  // Cleanup: leave matchmaking queue on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (pollRef.current) clearInterval(pollRef.current);
      // Fire-and-forget cleanup
      if (user?.id) {
        supabase.rpc("leave_matchmaking", { p_user_id: user.id }).then();
      }
    };
  }, [user?.id]);

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) return SEARCH_TIMEOUT;
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Status text cycling
  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // 30-second filter timeout for premium users
  useEffect(() => {
    if (!filtersActive) return;
    const timer = setTimeout(() => {
      setFilterTimeout(true);
      setShowNoMatchModal(true);
    }, 30000);
    return () => clearTimeout(timer);
  }, [filtersActive]);

  // Real matchmaking polling
  const pollForMatch = useCallback(async () => {
    if (!user?.id || isFetchingToken || isMatched || !mountedRef.current) return;

    try {
      const { data, error } = await supabase.rpc("find_match", { p_user_id: user.id });
      if (error || !mountedRef.current) return;

      const result = data as { status: string; room_id?: string; matched_with?: string };

      if (result?.status === "matched" && result?.room_id) {
        setIsMatched(true);
        if (pollRef.current) clearInterval(pollRef.current);
        await fetchTokenAndNavigate(result.room_id);
      }
    } catch (err) {
      console.error("Matchmaking poll error:", err);
    }
  }, [user?.id, isFetchingToken, isMatched]);

  // Start polling when component mounts (and user is ready)
  useEffect(() => {
    if (!user?.id || filterTimeout || isMatched) return;

    // Initial call
    pollForMatch();

    // Poll every 2.5s
    pollRef.current = setInterval(pollForMatch, POLL_INTERVAL);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [user?.id, filterTimeout, isMatched, pollForMatch]);

  const fetchTokenAndNavigate = async (roomId: string) => {
    if (!mountedRef.current) return;
    setIsFetchingToken(true);

    const participantName = profile?.username || "User";

    try {
      const { data, error } = await supabase.functions.invoke("generate-livekit-token", {
        body: { room_id: roomId, participant_name: participantName },
      });

      if (error || !data?.token) {
        console.error("Failed to get LiveKit token:", error);
        toast({
          title: "Connection Error",
          description: "Could not establish call. Please try again.",
          variant: "destructive",
        });
        navigate(-1);
        return;
      }

      navigate("/call", {
        replace: true,
        state: { roomId, livekitToken: data.token },
      });
    } catch (err) {
      console.error("Token fetch error:", err);
      toast({
        title: "Connection Error",
        description: "Could not establish call. Please try again.",
        variant: "destructive",
      });
      navigate(-1);
    }
  };

  const handleCancel = () => {
    if (user?.id) {
      supabase.rpc("leave_matchmaking", { p_user_id: user.id }).then();
    }
    navigate(-1);
  };

  const handleExpandSearch = () => {
    setFiltersActive(false);
    setFilterTimeout(false);
    setShowNoMatchModal(false);
    setCountdown(SEARCH_TIMEOUT);
    setIsFetchingToken(false);
    setIsMatched(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4 safe-top">
        <button
          onClick={handleCancel}
          className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-sm font-semibold text-foreground">Finding Partner</h1>
        <div className="w-10" />
      </header>

      {/* Active filters badge */}
      {filtersActive && (levelFilter || genderFilter) && (
        <div className="flex justify-center gap-2 px-4 mb-2">
          {levelFilter && (
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-medium">
              Level: {levelFilter}
            </span>
          )}
          {genderFilter && (
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-medium">
              Gender: {genderFilter}
            </span>
          )}
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 -mt-8">
        {/* World Map Image with animated markers */}
        <div className="relative w-full max-w-sm mb-6">
          <img src={worldMapImg} alt="World map" className="w-full h-auto opacity-80" />

          {/* === New York === */}
          <div className="absolute" style={{ left: "18%", top: "35%", transform: "translate(-50%, -50%)" }}>
            <span className="absolute rounded-full border-2 border-blue-500/50" style={{ width: 24, height: 24, marginLeft: -12, marginTop: -12, animation: "city-pulse 2s ease-out infinite", animationDelay: "0s" }} />
            <span className="absolute rounded-full border border-blue-400/30" style={{ width: 24, height: 24, marginLeft: -12, marginTop: -12, animation: "city-pulse 2s ease-out infinite", animationDelay: "0.6s" }} />
            <span className="block w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.7)]" style={{ animation: "city-blink 1.5s ease-in-out infinite", animationDelay: "0s" }} />
          </div>

          {/* === London === */}
          <div className="absolute" style={{ left: "46%", top: "24%", transform: "translate(-50%, -50%)" }}>
            <span className="absolute rounded-full border-2 border-blue-500/50" style={{ width: 24, height: 24, marginLeft: -12, marginTop: -12, animation: "city-pulse 2s ease-out infinite", animationDelay: "0.5s" }} />
            <span className="absolute rounded-full border border-blue-400/30" style={{ width: 24, height: 24, marginLeft: -12, marginTop: -12, animation: "city-pulse 2s ease-out infinite", animationDelay: "1.1s" }} />
            <span className="block w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.7)]" style={{ animation: "city-blink 1.5s ease-in-out infinite", animationDelay: "0.5s" }} />
          </div>

          {/* === New Delhi === */}
          <div className="absolute" style={{ left: "69%", top: "46%", transform: "translate(-50%, -50%)" }}>
            <span className="absolute rounded-full border-2 border-blue-500/50" style={{ width: 24, height: 24, marginLeft: -12, marginTop: -12, animation: "city-pulse 2s ease-out infinite", animationDelay: "1s" }} />
            <span className="absolute rounded-full border border-blue-400/30" style={{ width: 24, height: 24, marginLeft: -12, marginTop: -12, animation: "city-pulse 2s ease-out infinite", animationDelay: "1.6s" }} />
            <span className="block w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.7)]" style={{ animation: "city-blink 1.5s ease-in-out infinite", animationDelay: "1s" }} />
          </div>

          {/* === Sydney === */}
          <div className="absolute" style={{ left: "84%", top: "72%", transform: "translate(-50%, -50%)" }}>
            <span className="absolute rounded-full border-2 border-blue-500/50" style={{ width: 24, height: 24, marginLeft: -12, marginTop: -12, animation: "city-pulse 2s ease-out infinite", animationDelay: "1.5s" }} />
            <span className="absolute rounded-full border border-blue-400/30" style={{ width: 24, height: 24, marginLeft: -12, marginTop: -12, animation: "city-pulse 2s ease-out infinite", animationDelay: "2.1s" }} />
            <span className="block w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.7)]" style={{ animation: "city-blink 1.5s ease-in-out infinite", animationDelay: "1.5s" }} />
          </div>

          {/* === Tokyo === */}
          <div className="absolute" style={{ left: "86%", top: "34%", transform: "translate(-50%, -50%)" }}>
            <span className="absolute rounded-full border-2 border-blue-500/50" style={{ width: 24, height: 24, marginLeft: -12, marginTop: -12, animation: "city-pulse 2s ease-out infinite", animationDelay: "0.3s" }} />
            <span className="absolute rounded-full border border-blue-400/30" style={{ width: 24, height: 24, marginLeft: -12, marginTop: -12, animation: "city-pulse 2s ease-out infinite", animationDelay: "0.9s" }} />
            <span className="block w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.7)]" style={{ animation: "city-blink 1.5s ease-in-out infinite", animationDelay: "0.3s" }} />
          </div>

          {/* === Dubai === */}
          <div className="absolute" style={{ left: "62%", top: "40%", transform: "translate(-50%, -50%)" }}>
            <span className="absolute rounded-full border-2 border-blue-500/50" style={{ width: 24, height: 24, marginLeft: -12, marginTop: -12, animation: "city-pulse 2s ease-out infinite", animationDelay: "0.8s" }} />
            <span className="absolute rounded-full border border-blue-400/30" style={{ width: 24, height: 24, marginLeft: -12, marginTop: -12, animation: "city-pulse 2s ease-out infinite", animationDelay: "1.4s" }} />
            <span className="block w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.7)]" style={{ animation: "city-blink 1.5s ease-in-out infinite", animationDelay: "0.8s" }} />
          </div>

          {/* === São Paulo === */}
          <div className="absolute" style={{ left: "30%", top: "65%", transform: "translate(-50%, -50%)" }}>
            <span className="absolute rounded-full border-2 border-blue-500/50" style={{ width: 24, height: 24, marginLeft: -12, marginTop: -12, animation: "city-pulse 2s ease-out infinite", animationDelay: "1.2s" }} />
            <span className="absolute rounded-full border border-blue-400/30" style={{ width: 24, height: 24, marginLeft: -12, marginTop: -12, animation: "city-pulse 2s ease-out infinite", animationDelay: "1.8s" }} />
            <span className="block w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.7)]" style={{ animation: "city-blink 1.5s ease-in-out infinite", animationDelay: "1.2s" }} />
          </div>

          {/* === Singapore === */}
          <div className="absolute" style={{ left: "78%", top: "53%", transform: "translate(-50%, -50%)" }}>
            <span className="absolute rounded-full border-2 border-blue-500/50" style={{ width: 24, height: 24, marginLeft: -12, marginTop: -12, animation: "city-pulse 2s ease-out infinite", animationDelay: "1.4s" }} />
            <span className="absolute rounded-full border border-blue-400/30" style={{ width: 24, height: 24, marginLeft: -12, marginTop: -12, animation: "city-pulse 2s ease-out infinite", animationDelay: "2s" }} />
            <span className="block w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.7)]" style={{ animation: "city-blink 1.5s ease-in-out infinite", animationDelay: "1.4s" }} />
          </div>

          {/* Magnifying glass panning across */}
          <div
            className="absolute w-8 h-8 pointer-events-none"
            style={{ animation: "map-pan 6s ease-in-out infinite" }}
          >
            <Search className="w-full h-full text-foreground" />
          </div>

          <style>{`
            @keyframes city-blink {
              0%, 100% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.3; transform: scale(0.7); }
            }
            @keyframes city-pulse {
              0% { transform: scale(0.5); opacity: 0.6; }
              100% { transform: scale(2.5); opacity: 0; }
            }
            @keyframes map-pan {
              0% { left: 20%; top: 30%; }
              25% { left: 45%; top: 22%; }
              50% { left: 68%; top: 40%; }
              75% { left: 82%; top: 72%; }
              100% { left: 20%; top: 30%; }
            }
          `}</style>
        </div>

        {/* Circular countdown */}
        <div className="relative w-28 h-28 flex items-center justify-center mb-4">
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 128 128">
            <circle cx="64" cy="64" r={radius} fill="none" className="stroke-muted" strokeWidth="4" />
            <circle
              cx="64" cy="64" r={radius}
              fill="none"
              className="stroke-primary"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>
          <div className="flex flex-col items-center gap-1 z-10">
            <Search className="w-5 h-5 text-primary animate-pulse" />
            <span className="text-lg font-mono font-bold text-foreground">{countdown}s</span>
          </div>
        </div>

        {/* Dynamic status text */}
        <p className="text-sm font-medium text-primary animate-pulse mb-1 text-center transition-all duration-300">
          {STATUS_MESSAGES[statusIndex]}
        </p>
        <p className="text-xs text-muted-foreground/60">Please wait while we find a partner</p>

        {/* Cancel button */}
        <button
          onClick={handleCancel}
          className="mt-10 w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center hover:bg-destructive/20 transition-colors"
        >
          <X className="w-6 h-6 text-destructive" />
        </button>
        <p className="text-xs text-muted-foreground mt-2">Cancel</p>
      </main>

      {/* No Match Modal for premium filter timeout */}
      <Dialog open={showNoMatchModal} onOpenChange={setShowNoMatchModal}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center text-base">No Exact Matches Found</DialogTitle>
            <DialogDescription className="text-center text-xs">
              Currently no exact matches found for your selected filters. Would you like to expand your search to other levels/genders?
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 mt-2">
            <Button onClick={handleExpandSearch} className="w-full">
              Expand Search
            </Button>
            <Button variant="outline" onClick={handleCancel} className="w-full">
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

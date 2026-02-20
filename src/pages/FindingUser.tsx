import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const SEARCH_TIMEOUT = 30;

const STATUS_MESSAGES = [
  "Finding a perfect partner for you...",
  "Searching in Europe...",
  "Connecting to India...",
  "Looking for the best match...",
  "Scanning Australia...",
  "Checking in New York...",
];

// Simplified inline SVG world map paths (lightweight)
const MAP_PATH = "M30,45 Q35,30 50,28 Q55,25 65,27 Q72,25 78,30 Q82,28 88,32 Q92,30 95,35 L95,38 Q90,42 85,40 Q80,44 75,42 Q70,46 65,44 Q58,48 50,46 Q42,50 35,48 Q32,50 30,48 Z M55,55 Q58,52 62,54 Q65,52 68,55 Q70,58 67,60 Q63,62 58,60 Q55,58 55,55 Z M78,50 Q82,48 86,50 Q90,52 88,56 Q84,58 80,56 Q77,54 78,50 Z M20,35 Q25,30 30,32 Q28,38 22,40 Q18,38 20,35 Z";

// City marker positions (relative % on the map viewBox)
const CITIES = [
  { name: "New York", cx: 28, cy: 38, delay: "0s" },
  { name: "London", cx: 48, cy: 30, delay: "0.5s" },
  { name: "New Delhi", cx: 68, cy: 42, delay: "1s" },
  { name: "Sydney", cx: 85, cy: 58, delay: "1.5s" },
];

export default function FindingUser() {
  const navigate = useNavigate();
  const location = useLocation();
  const [countdown, setCountdown] = useState(SEARCH_TIMEOUT);
  const [statusIndex, setStatusIndex] = useState(0);
  const [showNoMatchModal, setShowNoMatchModal] = useState(false);

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

  // Auto-navigate to call (only if no filter timeout)
  useEffect(() => {
    if (filterTimeout) return;

    const connectTimer = setTimeout(() => {
      navigate("/call", { replace: true });
    }, 3500);

    return () => clearTimeout(connectTimer);
  }, [navigate, filterTimeout]);

  const handleCancel = () => navigate(-1);

  const handleExpandSearch = () => {
    setFiltersActive(false);
    setFilterTimeout(false);
    setShowNoMatchModal(false);
    setCountdown(SEARCH_TIMEOUT);
    // Will auto-navigate after 3.5s via the effect above
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
        {/* SVG World Map with animations */}
        <div className="relative w-full max-w-xs aspect-[16/10] mb-6">
          <svg viewBox="0 0 110 70" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            {/* Map background */}
            <path
              d={MAP_PATH}
              className="fill-muted/50 stroke-primary/20"
              strokeWidth="0.5"
            />

            {/* City markers with blinking animation */}
            {CITIES.map((city) => (
              <g key={city.name}>
                {/* Pulse ring */}
                <circle
                  cx={city.cx}
                  cy={city.cy}
                  r="3"
                  className="fill-none stroke-primary/40"
                  strokeWidth="0.5"
                  style={{
                    animation: `pulse-ring 2s ease-out infinite`,
                    animationDelay: city.delay,
                  }}
                />
                {/* Dot */}
                <circle
                  cx={city.cx}
                  cy={city.cy}
                  r="1.2"
                  className="fill-primary"
                  style={{
                    animation: `blink-dot 1.5s ease-in-out infinite`,
                    animationDelay: city.delay,
                  }}
                />
              </g>
            ))}

            {/* Magnifying glass panning across */}
            <g style={{ animation: "pan-search 6s ease-in-out infinite" }}>
              <circle cx="0" cy="0" r="5" className="fill-none stroke-primary/30" strokeWidth="0.6" />
              <line x1="3.5" y1="3.5" x2="6" y2="6" className="stroke-primary/30" strokeWidth="0.6" strokeLinecap="round" />
            </g>
          </svg>

          {/* CSS Keyframes */}
          <style>{`
            @keyframes blink-dot {
              0%, 100% { opacity: 1; r: 1.2; }
              50% { opacity: 0.3; r: 0.8; }
            }
            @keyframes pulse-ring {
              0% { r: 1.5; opacity: 0.6; }
              100% { r: 5; opacity: 0; }
            }
            @keyframes pan-search {
              0% { transform: translate(25px, 35px); }
              25% { transform: translate(50px, 28px); }
              50% { transform: translate(70px, 42px); }
              75% { transform: translate(85px, 55px); }
              100% { transform: translate(25px, 35px); }
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

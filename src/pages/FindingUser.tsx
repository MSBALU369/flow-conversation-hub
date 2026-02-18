import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

const SEARCH_TIMEOUT = 30;

export default function FindingUser() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(SEARCH_TIMEOUT);
  const [status, setStatus] = useState<"searching" | "connecting">("searching");

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = countdown / SEARCH_TIMEOUT;
  const strokeDashoffset = circumference * (1 - progress);

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Reset countdown and keep searching
          return SEARCH_TIMEOUT;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Simulate finding a user: searching → connecting → navigate to call
  useEffect(() => {
    const connectingTimer = setTimeout(() => {
      setStatus("connecting");
    }, 2000);

    const connectedTimer = setTimeout(() => {
      navigate("/call", { replace: true });
    }, 3500);

    return () => {
      clearTimeout(connectingTimer);
      clearTimeout(connectedTimer);
    };
  }, [navigate]);

  const handleCancel = () => {
    navigate(-1);
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

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 -mt-16">
        {/* Circular countdown */}
        <div className="relative w-40 h-40 flex items-center justify-center mb-6">
          {/* Outer pulse ring */}
          <div className="absolute inset-0 rounded-full border border-primary/20 animate-ping" style={{ animationDuration: '3s' }} />
          
          {/* SVG ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 128 128">
            <circle
              cx="64" cy="64" r={radius}
              fill="none"
              className="stroke-muted"
              strokeWidth="5"
            />
            <circle
              cx="64" cy="64" r={radius}
              fill="none"
              className="stroke-primary"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>

          {/* Center content */}
          <div className="flex flex-col items-center gap-2 z-10">
            <Search className="w-8 h-8 text-primary animate-pulse" />
            <span className="text-2xl font-mono font-bold text-foreground">{countdown}s</span>
          </div>
        </div>

        {/* Status text */}
        <p className={cn(
          "text-sm font-medium animate-pulse mb-2",
          status === "connecting" ? "text-primary" : "text-muted-foreground"
        )}>
          {status === "connecting" ? "Connecting..." : "Finding someone..."}
        </p>
        <p className="text-xs text-muted-foreground/60">Please wait while we find a partner</p>

        {/* Cancel button */}
        <button
          onClick={handleCancel}
          className="mt-12 w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center hover:bg-destructive/20 transition-colors"
        >
          <X className="w-6 h-6 text-destructive" />
        </button>
        <p className="text-xs text-muted-foreground mt-2">Cancel</p>
      </main>
    </div>
  );
}
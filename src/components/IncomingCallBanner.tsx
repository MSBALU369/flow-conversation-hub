import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Phone, PhoneOff } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useCallState } from "@/hooks/useCallState";
import { useNotificationSound } from "@/hooks/useNotificationSound";
import { cn } from "@/lib/utils";

export default function IncomingCallBanner() {
  const { incomingCall, acceptIncomingCall, declineIncomingCall } = useCallState();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const playSound = useNotificationSound();
  const soundPlayed = useRef(false);

  useEffect(() => {
    if (incomingCall.active) {
      requestAnimationFrame(() => setVisible(true));
      // Play "ting" exactly once per incoming call
      if (!soundPlayed.current) {
        soundPlayed.current = true;
        playSound("ting");
      }
    } else {
      setVisible(false);
      soundPlayed.current = false;
    }
  }, [incomingCall.active, playSound]);

  if (!incomingCall.active) return null;

  const handleAccept = () => {
    acceptIncomingCall();
    navigate("/call");
  };

  const handleDecline = () => {
    declineIncomingCall();
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] px-3 pt-2 safe-top">
      <div
        className={cn(
          "mx-auto w-fit rounded-2xl bg-[hsl(142,70%,45%)] backdrop-blur-xl border border-white/60 shadow-lg shadow-[hsl(142,70%,45%)]/20 px-2.5 py-1.5 flex items-center gap-2 transition-all duration-300",
          visible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
        )}
      >
        {/* Caller avatar */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" style={{ animationDuration: "2s" }} />
          <Avatar className="w-7 h-7 relative z-10">
            <AvatarImage src={incomingCall.callerAvatar || undefined} />
            <AvatarFallback className="bg-muted text-sm">👤</AvatarFallback>
          </Avatar>
        </div>

        {/* Caller info */}
        <div className="min-w-0">
          <p className="text-xs font-semibold text-white truncate">
            {incomingCall.callerName || "Unknown"}
          </p>
          <p className="text-[10px] text-white/70 animate-pulse">Incoming...</p>
        </div>

        {/* Decline button */}
        <button
          onClick={handleDecline}
          className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-md hover:bg-white/80 transition-colors"
        >
          <PhoneOff className="w-4 h-4 text-destructive" />
        </button>

        {/* Accept button */}
        <button
          onClick={handleAccept}
          className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-md hover:bg-white/80 transition-colors"
        >
          <Phone className="w-4 h-4 text-green-600" />
        </button>
      </div>
    </div>
  );
}

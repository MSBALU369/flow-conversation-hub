import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { PhoneOff } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useCallState } from "@/hooks/useCallState";
import { cn } from "@/lib/utils";

export default function OutgoingCallBanner() {
  const { outgoingCall, cancelOutgoingCall } = useCallState();
  const location = useLocation();
  const [visible, setVisible] = useState(false);

  const isOnCallPage = location.pathname === "/call";
  const showBanner = outgoingCall.active && !isOnCallPage;

  useEffect(() => {
    if (showBanner) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [showBanner]);

  if (!showBanner) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] px-3 pt-2 safe-top">
      <div
        className={cn(
          "mx-auto w-fit rounded-2xl bg-green-500 backdrop-blur-xl border border-white/60 shadow-lg shadow-green-500/20 px-2.5 py-1.5 flex items-center gap-2 transition-all duration-300",
          visible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
        )}
      >
        {/* Partner avatar */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" style={{ animationDuration: "2s" }} />
          <Avatar className="w-7 h-7 relative z-10">
            <AvatarImage src={outgoingCall.receiverAvatar || undefined} />
            <AvatarFallback className="bg-muted text-sm">👤</AvatarFallback>
          </Avatar>
        </div>

        {/* Partner info */}
        <div className="min-w-0">
          <p className="text-xs font-semibold text-white truncate">
            {outgoingCall.receiverName || "Unknown"}
          </p>
          <p className="text-[10px] text-white/70 animate-pulse">Ringing...</p>
        </div>

        {/* Cancel button */}
        <button
          onClick={cancelOutgoingCall}
          className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-md hover:bg-white/80 transition-colors"
        >
          <PhoneOff className="w-4 h-4 text-destructive" />
        </button>
      </div>
    </div>
  );
}

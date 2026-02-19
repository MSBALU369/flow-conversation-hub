import { Phone } from "lucide-react";
import { useCallState } from "@/hooks/useCallState";

export function GameCallBubble() {
  const { callState } = useCallState();

  if (!callState.isInCall) return null;

  const mins = Math.floor(callState.callSeconds / 60);
  const secs = callState.callSeconds % 60;
  const time = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

  return (
    <div className="fixed bottom-6 right-4 z-[60] flex items-center gap-2 bg-green-500 rounded-full px-3 py-1.5 shadow-lg shadow-green-500/30">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-green-400/40 animate-ping" style={{ animationDuration: "2s" }} />
        <Phone className="w-3.5 h-3.5 text-white relative z-10" />
      </div>
      <span className="text-xs font-mono font-bold text-white">{time}</span>
    </div>
  );
}

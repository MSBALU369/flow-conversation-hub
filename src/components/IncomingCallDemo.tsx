import { useState } from "react";
import { useCallState } from "@/hooks/useCallState";

/**
 * Dev-only toggle button to simulate an incoming call.
 * Hidden in production builds.
 */
export function IncomingCallDemo() {
  const { triggerIncomingCall, incomingCall, declineIncomingCall } = useCallState();
  const [show] = useState(() => import.meta.env.DEV);

  if (!show) return null;

  const handleToggle = () => {
    if (incomingCall.active) {
      declineIncomingCall();
    } else {
      triggerIncomingCall("Sarah_K", "https://i.pravatar.cc/150?img=47");
    }
  };

  return (
    <button
      onClick={handleToggle}
      className="fixed bottom-20 left-3 z-[100] px-2 py-1 rounded-md bg-muted/80 border border-border text-[10px] text-muted-foreground font-mono opacity-50 hover:opacity-100 transition-opacity"
    >
      {incomingCall.active ? "Dismiss Call" : "Sim Call"}
    </button>
  );
}

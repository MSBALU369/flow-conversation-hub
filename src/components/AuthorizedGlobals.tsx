import { useAuth } from "@/hooks/useAuth";
import FloatingCallBubble from "@/components/FloatingCallBubble";
import FloatingSearchBubble from "@/components/FloatingSearchBubble";
import IncomingCallBanner from "@/components/IncomingCallBanner";
import OutgoingCallBanner from "@/components/OutgoingCallBanner";
import { IncomingCallDemo } from "@/components/IncomingCallDemo";
import { RenewalReminder } from "@/components/RenewalReminder";
import { BatteryWarningModal } from "@/components/BatteryWarningModal";
import { GlobalListeners } from "@/components/GlobalListeners";
import { SessionEnforcer } from "@/components/SessionEnforcer";

export function AuthorizedGlobals() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <>
      <FloatingCallBubble />
      <FloatingSearchBubble />
      <IncomingCallBanner />
      <OutgoingCallBanner />
      <IncomingCallDemo />
      <RenewalReminder />
      <BatteryWarningModal />
      <GlobalListeners />
      <SessionEnforcer />
    </>
  );
}

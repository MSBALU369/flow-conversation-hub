import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import FloatingCallBubble from "@/components/FloatingCallBubble";
import FloatingSearchBubble from "@/components/FloatingSearchBubble";
import IncomingCallBanner from "@/components/IncomingCallBanner";
import OutgoingCallBanner from "@/components/OutgoingCallBanner";
import { IncomingCallDemo } from "@/components/IncomingCallDemo";
import { RenewalReminder } from "@/components/RenewalReminder";
import { BatteryWarningModal } from "@/components/BatteryWarningModal";
import { GlobalListeners } from "@/components/GlobalListeners";
import { SessionEnforcer } from "@/components/SessionEnforcer";
import { AppUpdateChecker } from "@/components/AppUpdateChecker";

export function AuthorizedGlobals() {
  const { user } = useAuth();
  const { requestPermissions } = usePushNotifications();

  useEffect(() => {
    if (user) {
      requestPermissions();
    }
  }, [user, requestPermissions]);

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
      <AppUpdateChecker />
    </>
  );
}

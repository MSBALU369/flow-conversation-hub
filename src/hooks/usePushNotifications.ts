import { useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Hook for managing push notification permissions and token storage.
 *
 * Currently uses Web Notification API with a mock token.
 * When wrapping with Capacitor, replace the token logic with:
 *
 * ```ts
 * import { PushNotifications } from "@capacitor/push-notifications";
 *
 * const result = await PushNotifications.requestPermissions();
 * if (result.receive === "granted") {
 *   await PushNotifications.register();
 *   PushNotifications.addListener("registration", (token) => {
 *     // Save token.value to Supabase
 *   });
 * }
 * ```
 */
export function usePushNotifications() {
  const { user } = useAuth();
  const requestedRef = useRef(false);

  const requestPermissions = useCallback(async () => {
    if (!user?.id || requestedRef.current) return;
    requestedRef.current = true;

    try {
      if (!("Notification" in window)) {
        console.log("Push notifications not supported in this browser");
        return;
      }

      const permission = await Notification.requestPermission();

      if (permission === "granted") {
        // TODO: Replace with real FCM token via getToken() + VAPID key
        const mockToken = `web-token-${user.id.slice(0, 8)}-${Date.now()}`;

        await supabase
          .from("profiles")
          .update({ fcm_token: mockToken } as any)
          .eq("id", user.id);

        console.log("Push notification permission granted, token saved");
      } else {
        console.log("Push notification permission:", permission);
      }
    } catch (err) {
      console.error("Push notification setup failed:", err);
    }
  }, [user?.id]);

  return { requestPermissions };
}

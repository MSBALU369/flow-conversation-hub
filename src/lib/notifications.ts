import { supabase } from "@/integrations/supabase/client";

/**
 * Send a push notification to a target user via the send-notification edge function.
 * Fails silently — never throws.
 */
export async function sendPushNotification(
  targetUserId: string,
  title: string,
  body: string,
  type: string = "general"
) {
  try {
    const { error } = await supabase.functions.invoke("send-notification", {
      body: { target_user_id: targetUserId, title, body, type },
    });
    if (error) console.warn("[sendPushNotification] Edge function error:", error);
  } catch (err) {
    console.warn("[sendPushNotification] Failed silently:", err);
  }
}

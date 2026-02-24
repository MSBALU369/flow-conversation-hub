import { supabase } from "@/integrations/supabase/client";

/**
 * Send a "follow_request" notification to the followed user.
 * Call this after inserting a friendship row.
 */
export async function sendFollowNotification(followerId: string, followedUserId: string) {
  try {
    // Fetch follower's username for the notification title
    const { data: follower } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", followerId)
      .single();

    const name = follower?.username || "Someone";

    await supabase.from("notifications").insert({
      user_id: followedUserId,
      from_user_id: followerId,
      type: "follow_request",
      title: `${name} started following you`,
      message: "Tap to view profile or follow back",
      is_read: false,
    });
  } catch (err) {
    console.error("Failed to send follow notification:", err);
  }
}

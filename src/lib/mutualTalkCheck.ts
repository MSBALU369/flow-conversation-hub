import { supabase } from "@/integrations/supabase/client";

/**
 * Check if two users have mutually talked (both have call_history entries
 * with each other's name, indicating completed calls).
 * We check if user A has a call with user B's name AND user B has a call with user A's name.
 * A simpler approach: check `calls` table for a completed call between them.
 */
export async function haveMutuallyTalked(userAId: string, userBId: string): Promise<boolean> {
  // Check the calls table for any completed call between the two users
  const { data } = await supabase
    .from("calls")
    .select("id")
    .or(`and(caller_id.eq.${userAId},receiver_id.eq.${userBId}),and(caller_id.eq.${userBId},receiver_id.eq.${userAId})`)
    .in("status", ["completed", "ended"])
    .limit(1);

  if (data && data.length > 0) return true;

  // Also check matches table as backup (matches are created for random calls)
  const { data: matches } = await supabase
    .from("matches")
    .select("id")
    .or(`and(user1_id.eq.${userAId},user2_id.eq.${userBId}),and(user1_id.eq.${userBId},user2_id.eq.${userAId})`)
    .not("ended_at", "is", null)
    .limit(1);

  return !!(matches && matches.length > 0);
}

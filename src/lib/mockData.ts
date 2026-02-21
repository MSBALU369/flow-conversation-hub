/**
 * Utility functions for formatting time values.
 * All mock/dummy data has been removed — the app uses real Supabase data.
 */

// ─── Time helpers ────────────────────────────────────────────────────────────

export function formatDuration(totalMinutes: number): string {
  if (totalMinutes < 60) return `${Math.round(totalMinutes)}m`;
  const hours = Math.floor(totalMinutes / 60);
  const mins = Math.round(totalMinutes % 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function formatSpeakTime(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  if (minutes < 1440) return `${(minutes / 60).toFixed(1).replace(/\.0$/, "")}h`;
  const days = (minutes / 1440).toFixed(1).replace(/\.0$/, "");
  return `${days}d`;
}

/** Together Total = You + Opponent (straight addition) */
export function calculateTogetherTotal(
  yourMinutes: number,
  opponentMinutes: number,
  _mutualMinutes?: number,
): number {
  return yourMinutes + opponentMinutes;
}

// ─── Interfaces (kept for type reuse) ────────────────────────────────────────

export interface CompareUser {
  id: string;
  name: string;
  avatar: string | null;
  /** Opponent's all-time total */
  allTimeMinutes: number;
  /** Opponent's daily breakdown for the current week */
  data: { day: string; minutes: number }[];
}

export interface LikeCategory {
  emoji: string;
  label: string;
  count: number;
  users: { name: string; id: string }[];
}

export interface FlagCategory {
  label: string;
  count: number;
}

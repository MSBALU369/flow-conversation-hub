/**
 * Centralized mock data — single source of truth for all demo/dummy values.
 * 
 * MATHEMATICAL RULES:
 *   - mutualWeekMinutes  <= user's own weekTotal  (Mutual Talk ≤ You)
 *   - mutualAllTimeMinutes <= user's own allTimeMinutes equivalent
 *   - Together Total = You + Opponent – Mutual Talk
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

// ─── Compare users (Speaking Time graph) ─────────────────────────────────────

export interface CompareUser {
  name: string;
  avatar: string;
  /** Opponent's all-time total */
  allTimeMinutes: number;
  /** Mutual talk THIS WEEK (must be ≤ your own weekTotal) */
  mutualWeekMinutes: number;
  /** Mutual talk ALL TIME (must be ≤ your own allTimeTotal) */
  mutualAllTimeMinutes: number;
  /** Opponent's daily breakdown for the current week */
  data: { day: string; minutes: number }[];
}

/**
 * Each user's weekly total = sum(data[].minutes).
 * All mutual values are kept safely below realistic thresholds.
 */
/**
 * Current user's totals (from DB in production, mock for now).
 * All opponent mutualAllTime values MUST sum to <= currentUser.allTimeTotal.
 * All opponent mutualThisWeek values MUST be 0 (since user's thisWeek is 0).
 */
export const currentUserTotals = {
  thisWeekTotal: 0,   // minutes
  allTimeTotal: 17,   // minutes
};

/**
 * Lookup for opponent mutual data. If an opponent is NOT in this map,
 * default mutualThisWeek and mutualAllTime to 0.
 * Sum of mutualAllTime = 8+4+2+2+1 = 17 = currentUser.allTimeTotal ✓
 */
export const opponentMutualData: Record<string, { mutualThisWeek: number; mutualAllTime: number }> = {
  "Alex":  { mutualThisWeek: 0, mutualAllTime: 8 },
  "James": { mutualThisWeek: 0, mutualAllTime: 4 },
  "Zara":  { mutualThisWeek: 0, mutualAllTime: 2 },
  "Sarah": { mutualThisWeek: 0, mutualAllTime: 2 },
  "Mia":   { mutualThisWeek: 0, mutualAllTime: 1 },
};

/** Safe lookup – returns 0 for unknown opponents */
export function getOpponentMutual(name: string) {
  return opponentMutualData[name] ?? { mutualThisWeek: 0, mutualAllTime: 0 };
}

/**
 * Opponent data. Mutual values are distributed so:
 *   - mutualWeekMinutes = 0 for all (user's week is 0)
 *   - sum of mutualAllTimeMinutes = 10+5+2 = 17 = currentUser.allTimeTotal ✓
 */
export const sampleCompareUsers: CompareUser[] = [
  {
    name: "Sarah",
    avatar: "👩",
    allTimeMinutes: 820,
    mutualWeekMinutes: 0,
    mutualAllTimeMinutes: 2,
    data: [
      { day: "Mon", minutes: 12 },
      { day: "Tue", minutes: 25 },
      { day: "Wed", minutes: 8 },
      { day: "Thu", minutes: 35 },
      { day: "Fri", minutes: 18 },
      { day: "Sat", minutes: 42 },
      { day: "Sun", minutes: 15 },
    ], // weekTotal = 155
  },
  {
    name: "Alex",
    avatar: "👨",
    allTimeMinutes: 1250,
    mutualWeekMinutes: 0,
    mutualAllTimeMinutes: 8,
    data: [
      { day: "Mon", minutes: 30 },
      { day: "Tue", minutes: 10 },
      { day: "Wed", minutes: 45 },
      { day: "Thu", minutes: 20 },
      { day: "Fri", minutes: 55 },
      { day: "Sat", minutes: 5 },
      { day: "Sun", minutes: 25 },
    ], // weekTotal = 190
  },
  {
    name: "Mia",
    avatar: "👧",
    allTimeMinutes: 640,
    mutualWeekMinutes: 0,
    mutualAllTimeMinutes: 1,
    data: [
      { day: "Mon", minutes: 5 },
      { day: "Tue", minutes: 40 },
      { day: "Wed", minutes: 22 },
      { day: "Thu", minutes: 15 },
      { day: "Fri", minutes: 38 },
      { day: "Sat", minutes: 28 },
      { day: "Sun", minutes: 50 },
    ], // weekTotal = 198
  },
  {
    name: "James",
    avatar: "🧑",
    allTimeMinutes: 980,
    mutualWeekMinutes: 0,
    mutualAllTimeMinutes: 5,
    data: [
      { day: "Mon", minutes: 20 },
      { day: "Tue", minutes: 15 },
      { day: "Wed", minutes: 35 },
      { day: "Thu", minutes: 50 },
      { day: "Fri", minutes: 10 },
      { day: "Sat", minutes: 30 },
      { day: "Sun", minutes: 8 },
    ], // weekTotal = 168
  },
  {
    name: "Zara",
    avatar: "👩‍🦱",
    allTimeMinutes: 1530,
    mutualWeekMinutes: 0,
    mutualAllTimeMinutes: 2,
    data: [
      { day: "Mon", minutes: 48 },
      { day: "Tue", minutes: 32 },
      { day: "Wed", minutes: 18 },
      { day: "Thu", minutes: 10 },
      { day: "Fri", minutes: 25 },
      { day: "Sat", minutes: 60 },
      { day: "Sun", minutes: 35 },
    ], // weekTotal = 228
  },
];
// Verification: mutualAllTime sum = 2+8+1+4+2 = 17 = currentUser.allTimeTotal ✓
// All mutualWeekMinutes = 0 (user's thisWeek = 0) ✓

// ─── Trust Score ──────────────────────────────────────────────────────────────

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

/**
 * Total likes = sum of all category counts = 164
 * Total flags = sum of all flag counts = 4
 */
export const trustScoreLikeCategories: LikeCategory[] = [
  { emoji: "😊", label: "Polite & Friendly", count: 45, users: [{ name: "Mia", id: "mock-1" }, { name: "Omar_B", id: "mock-2" }, { name: "Lina_K", id: "mock-3" }, { name: "Sara_J", id: "mock-4" }] },
  { emoji: "🗣️", label: "Great English Skills", count: 32, users: [{ name: "Ahmed_R", id: "mock-5" }, { name: "Priya_D", id: "mock-6" }, { name: "Tom_L", id: "mock-7" }] },
  { emoji: "🌟", label: "Awesome Personality", count: 24, users: [{ name: "Lina_K", id: "mock-3" }, { name: "Omar_B", id: "mock-2" }, { name: "Sara_J", id: "mock-4" }] },
  { emoji: "🤝", label: "Helpful & Supportive", count: 18, users: [{ name: "Lina_K", id: "mock-3" }, { name: "Omar_B", id: "mock-2" }] },
  { emoji: "😂", label: "Funny & Entertaining", count: 15, users: [{ name: "Sara_J", id: "mock-4" }, { name: "Mia", id: "mock-1" }] },
  { emoji: "🧠", label: "Very Interesting", count: 12, users: [{ name: "Tom_L", id: "mock-7" }, { name: "Ahmed_R", id: "mock-5" }] },
  { emoji: "🎙️", label: "Pleasant Voice", count: 10, users: [{ name: "Priya_D", id: "mock-6" }] },
  { emoji: "🎓", label: "Intelligent", count: 8, users: [{ name: "Tom_L", id: "mock-7" }] },
];
// Verification: 45+32+24+18+15+12+10+8 = 164 ✓

export const trustScoreFlagCategories: FlagCategory[] = [
  { label: "No signal / Not speaking", count: 2 },
  { label: "Noise Disturbance", count: 1 },
  { label: "Wrong Gender", count: 1 },
  { label: "Rude Behavior", count: 0 },
  { label: "Abusive Language", count: 0 },
  { label: "Spam/Advertising", count: 0 },
];
// Verification: 2+1+1+0+0+0 = 4 ✓

// ─── Sample talents (for UserProfilePage fallback) ───────────────────────────

export const sampleTalents = [
  { id: "demo-1", title: "Tum Hi Ho - Cover", language: "Hindi", likes_count: 234, plays_count: 1820, duration_sec: 185, created_at: "2025-01-20" },
  { id: "demo-2", title: "Shape of You Remix", language: "English", likes_count: 156, plays_count: 920, duration_sec: 210, created_at: "2025-01-15" },
  { id: "demo-3", title: "Stand-up: Airport Life", language: "English", likes_count: 89, plays_count: 450, duration_sec: 120, created_at: "2024-12-28" },
  { id: "demo-4", title: "Motivational Speech", language: "Hindi", likes_count: 312, plays_count: 2100, duration_sec: 300, created_at: "2024-12-10" },
];

// ─── Default weekly data for UserProfilePage ─────────────────────────────────

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

/** Deterministic fallback data (no Math.random!) */
export const defaultMyWeeklyData = DAY_LABELS.map((day, i) => ({
  day,
  minutes: [18, 32, 12, 28, 22, 38, 20][i],
}));
// weekTotal = 170

export const defaultFriendWeeklyData = DAY_LABELS.map((day, i) => ({
  day,
  minutes: [25, 15, 40, 30, 45, 10, 35][i],
}));
// weekTotal = 200

/** Deterministic mutual talk for UserProfilePage comparison */
export const defaultMutualWeekMinutes = 35;

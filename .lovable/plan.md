
## Add Relative Time ("ago") Labels for Today's Calls

### What Changes
In the expanded call history dropdown, each call entry currently shows a full date/time string (e.g., "Feb 24, 2026 · 4:17 PM"). For calls that happened **today**, we will add a relative time label like "2h ago" or "5m ago" next to (or replacing) the timestamp.

Calls from **previous days** will continue showing the standard date format unchanged.

### How It Will Look
- Today's calls: **"5m ago"** or **"2h ago"** (short relative format)
- Older calls: **"Feb 23, 2026 · 4:17 PM"** (unchanged)

### Technical Details

**File:** `src/components/CombinedHistoryModal.tsx`

1. **Add a helper function** `formatTimeAgo` that:
   - Checks if the call's `created_at` date is today (using `date-fns`'s `isToday`)
   - If today: calculates the difference in minutes/hours and returns a string like "5m ago", "2h ago", or "just now"
   - If not today: returns the existing full date format (`"MMM d, yyyy · h:mm a"`)

2. **Update the call entry timestamp** (line 273-275) to use this new helper instead of the raw `format()` call.

3. **Imports**: Add `isToday`, `differenceInMinutes`, `differenceInHours` from `date-fns` (already installed).

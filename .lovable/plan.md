

# Implementation Plan: 4 Major Updates

## 1. Registration Screen - Username Validation with Debouncing

**What changes:**
- Create a `useDebounce` hook (`src/hooks/useDebounce.ts`) that delays a value by 500ms
- Update `Onboarding.tsx` to:
  - Restrict username input to alphanumeric characters only (regex filter on input change)
  - After 500ms debounce, query `profiles` table to check if the username already exists
  - Show a red error message "Username already taken or not available" below the input when taken
  - Show a green checkmark when the username is available
  - Disable the "Get Started" button while a taken username is entered

**Technical details:**
- New file: `src/hooks/useDebounce.ts` - generic debounce hook using `useState` + `useEffect` with a configurable delay
- In `Onboarding.tsx`: filter input with `/^[a-zA-Z0-9]*$/`, use debounced value to run `supabase.from('profiles').select('id').eq('username', debouncedUsername).maybeSingle()`, display validation state below the input

---

## 2. Finding Screen - Engaging 2D Map Animation

**What changes:**
- Completely redesign `FindingUser.tsx` with:
  - An inline SVG world map (lightweight, no external dependencies) showing simplified continent outlines
  - Animated blinking dots on key capitals: New York (USA), London (Europe), New Delhi (India), Sydney (Australia)
  - A magnifying glass icon that pans across the map using CSS keyframe animations
  - Cycling status text that rotates every 3 seconds through: "Finding a perfect partner for you...", "Searching in Europe...", "Connecting to India...", "Looking for the best match..."
  - Keep the existing countdown timer and cancel button
  - Accept `levelFilter` and `genderFilter` from route state for premium matchmaking (point 4)

**Technical details:**
- All animations are pure CSS keyframes (no Framer Motion dependency needed to keep it lightweight)
- SVG map is a simplified world outline (~2KB inline) with positioned circle elements for city markers
- The magnifying glass uses a `@keyframes pan-search` animation moving across the map viewport
- Text cycling via a `useState` + `useEffect` interval

---

## 3. Sidebar / Support Section Content

**What changes:**

### Contact Us (`ContactUs.tsx`):
- Replace the generic "support@ef-app.com" card with two distinct email cards:
  - **Support**: help@englishflow.in - "For user queries and help"
  - **Partnerships**: collaborate@englishflow.in - "For companies and brands"

### Privacy Policy (`PrivacyPolicy.tsx`):
- Add a prominent section: "Voice Call Privacy" explicitly stating: "All voice calls on English Flow are 100% private, not recorded, and not saved. We do not have access to any audio content from your conversations."
- Add a section: "Data Security" stating: "User data is highly secured using industry-standard encryption and access controls."

### Legal Info (`LegalInfo.tsx`):
- Add a "Voice Communication" section explicitly stating: "Voice calls made through English Flow are 100% private. We do not record, store, or monitor any voice conversations."
- Add a "User Data Protection" section stating: "All user data is highly secured and protected using advanced encryption standards."

---

## 4. Speak With - Premium Strict Matchmaking with Timeout

**What changes:**
- Update `FindingUser.tsx` to read `levelFilter` and `genderFilter` from `useLocation().state`
- When filters are active (premium user), show the active filters on the finding screen
- After exactly 30 seconds of searching with filters, show a modal: "Currently no exact matches found. Would you like to expand your search to other levels/genders?" with two buttons:
  - "Expand Search" - resets filters to Any/Random and restarts the countdown
  - "Cancel" - navigates back
- Create a `NoMatchModal` component for this prompt

**Technical details:**
- `FindingUser.tsx` uses `useLocation()` to get filter state
- A 30-second timeout triggers the `NoMatchModal` dialog
- "Expand Search" clears filters and resets the search state
- The existing countdown timer continues to work alongside this logic

---

## Files to Create
1. `src/hooks/useDebounce.ts`

## Files to Modify
1. `src/pages/Onboarding.tsx` - username validation
2. `src/pages/FindingUser.tsx` - map animation + filter timeout logic
3. `src/pages/ContactUs.tsx` - two email addresses
4. `src/pages/PrivacyPolicy.tsx` - voice privacy + data security sections
5. `src/pages/LegalInfo.tsx` - voice communication + data protection sections


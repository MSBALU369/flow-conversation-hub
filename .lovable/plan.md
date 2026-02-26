
# 9-Point Feature Enhancement Plan

## Overview
This plan addresses 9 critical feature updates to the FlowTalk2 app. Each change is scoped to enhance existing logic without breaking current WebRTC, Supabase, or routing flows.

---

## 1. Online/Offline Green Dot Sync

**Problem**: Home screen uses `is_online` column (stale). Chat uses `last_seen` threshold (correct).

**Changes**:
- **`src/pages/Home.tsx`**: Replace `is_online` query with `last_seen`-based threshold (2 minutes), matching the pattern already in `Chat.tsx` line 267-276. The `onlineCount` query becomes: `SELECT COUNT(*) WHERE last_seen > NOW() - INTERVAL '2 minutes'`.
- **`src/pages/Chat.tsx`**: Already uses `last_seen` threshold for the friend list green dot -- no change needed for chat list. Ensure the individual chat header also uses the same `last_seen` logic (verify current rendering).

**Files**: `src/pages/Home.tsx`

---

## 2. Call History Duplicate Fix & Screen Lock Persistence

**Problem**: Duplicate call logs may occur when both `handleEndCall` and `forceEnd` fire. Screen lock triggers `Disconnected` event ending the call.

**Changes**:
- **`src/pages/Call.tsx`**: 
  - Add a `callLoggedRef = useRef(false)` guard. Both `handleEndCall` and `forceEnd` check this ref before calling `log_call_for_both`. Set it to `true` after the first log.
  - For screen lock: suppress `RoomEvent.Disconnected` from immediately ending the call. Instead, detect reconnection state -- when the room fires `Reconnected`, continue normally. Only treat `Disconnected` as final if the user explicitly clicked End or if the partner left (`ParticipantDisconnected`). Add a `reconnectingRef` to track this state.

**Files**: `src/pages/Call.tsx`

---

## 3. Call End Feedback Banner Logic

**Problem**: Currently both users get feedback immediately when either disconnects. Friend calls should have no feedback banner.

**Changes**:
- **Random Calls**: When User A clicks End:
  - User A's `handleEndCall` disconnects LiveKit and shows the post-call feedback modal (already works).
  - User B's `ParticipantDisconnected` handler should NOT immediately end the call. Instead, keep User B's call active (show "Partner left" but remain on screen). Only after User A submits/skips the feedback (which triggers User A's full disconnect cleanup), User B's call ends and User B gets their own feedback banner.
  - Implementation: In `forceEnd` for random calls, show the post-call modal for User B as well (current behavior is correct -- `forceEnd` already shows `setShowPostCallModal(true)` for non-friend calls).
  - The key fix: ensure User A's disconnect does NOT also force-end User B's call prematurely via any shared state. Since LiveKit handles this peer-to-peer, when User A disconnects, User B gets `ParticipantDisconnected` which already triggers `forceEnd` showing the feedback modal. This flow is actually already correct.

- **Friend Calls**: Already handled -- `isFriendCall` check at line 321-328 navigates back without showing feedback. No change needed.

**Files**: `src/pages/Call.tsx` (minor verification/cleanup)

---

## 4. On-Call UI Network & Reconnect

**Problem**: Remote signal strength is hardcoded to `2` (line 158-161). Reconnect is fake (just toggles state).

**Changes**:
- **`src/pages/Call.tsx`**:
  - **Remote signal strength**: Use LiveKit's `connectionQuality` from the remote participant. Map `ConnectionQuality.Excellent` to 4, `Good` to 3, `Poor` to 1, `Unknown` to 2. Listen to `RoomEvent.ConnectionQualityChanged`.
  - **Reconnect button**: Replace fake reconnect with actual `room.disconnect()` then re-navigate to `/call` with the same token/room params (or request a new token). For simplicity: disconnect, wait 500ms, then reconnect using `room.connect(LIVEKIT_URL, token)`. Reset timer to 00:00.
  - **Disconnect countdown**: When `RoomEvent.Disconnected` fires (non-intentional), show a 60-second countdown overlay with "User disconnected" message. If reconnection happens within 60s, dismiss. If not, end call.

**Files**: `src/pages/Call.tsx`, `src/hooks/useNetworkStrength.ts` (unchanged)

---

## 5. In-Call Games Multiplayer Sync Fix

**Problem**: Most games (Snake & Ladder, Archery, Sudoku, Would You Rather, Truth or Dare) don't pass `room` prop, so they play against AI instead of the real partner.

**Changes**:
- **`src/pages/Call.tsx`**: Pass `room={room}` to ALL game components (currently only WordChain, Chess, Ludo receive it). Add `room` prop to: `SnakeLadderGame`, `ArcheryGame`, `SudokuGame`, `WouldYouRatherGame`, `TruthOrDareGame`, `QuizGameOverlay`.
- **Each game component**: Ensure they accept `room` prop and use `useGameSync` for real-time state exchange. For games currently using AI/dummy logic, add multiplayer path when `room` is provided. Add 60-second disconnect timer when partner drops (via LiveKit `ParticipantDisconnected` event in the game context).
- **UI refresh**: Update game components with modern Tailwind styling, subtle animations, and better visual hierarchy. This is a significant effort -- scope to incremental improvements per game rather than full redesigns.

**Files**: `src/pages/Call.tsx`, `src/components/games/SnakeLadderGame.tsx`, `src/components/games/ArcheryGame.tsx`, `src/components/games/SudokuGame.tsx`, `src/components/games/WouldYouRatherGame.tsx`, `src/components/games/TruthOrDareGame.tsx`, `src/components/games/QuizGameOverlay.tsx`

---

## 6. Message Chat Box Fixes

**Problem**: (a) New friend messages require refresh, (b) tick marks may not update, (c) long-press not implemented for actions, (d) voice playback broken for placeholder blobs.

**Changes**:
- **(a) Real-time new friends**: The inbox Realtime listener (line 327-356) only updates existing friends. Add logic to also handle messages from new friends (not yet in `chatFriends`): fetch the sender's profile and prepend them.
- **(b) Tick marks**: The Realtime UPDATE subscription already handles `is_read` changes. Verify the sender-side channel also updates ticks when the receiver marks as read. Add a subscription for updates on messages where `sender_id=eq.${profile.id}` to catch read receipts.
- **(c) Long-press actions**: Replace the current context menu trigger (if any click-based) with a proper long-press handler using `onTouchStart`/`onTouchEnd` with a 500ms timeout. Show the action menu (emoji, copy, forward, pin, edit, delete) on long press only.
- **(d) Voice playback**: The current recording creates a placeholder `ArrayBuffer` blob (line 812) which produces no audio. Integrate the real `MediaRecorder` API to capture actual audio from the microphone. Store the real audio blob to Supabase Storage. Playback already works via `handlePlayVoice` if `mediaUrl` points to real audio.

**Files**: `src/pages/Chat.tsx`

---

## 7. Global Incoming Banners

**Problem**: Verify banners display globally over any screen.

**Changes**:
- **`src/components/AuthorizedGlobals.tsx`**: Already renders `IncomingCallBanner`, `OutgoingCallBanner`, and `GlobalListeners` globally. These use `z-[200]` and fixed positioning.
- **Verification**: Ensure the banner z-index is above all modals/dialogs (Radix uses `z-50`). Current `z-[200]` is sufficient. Test that the message toast from `useGlobalMessageListener` appears on all screens -- it uses Sonner which renders at document root. No code changes likely needed, just verification.

**Files**: Minimal or no changes -- verify existing behavior.

---

## 8. Forgot Password Removal from Signup

**Problem**: "Forgot Password" link should only appear on Login, not Signup.

**Changes**:
- **`src/pages/Login.tsx`**: The "Forgot Password" button at lines 303-310 already has `{!isSignUp && (...)}` guard. This means it already only shows on Login mode. No change needed -- already correctly implemented.

**Files**: No changes needed.

---

## 9. Delay App Ratings for New Users

**Problem**: `SmartAppReview` shows based only on time since last prompt, not account age.

**Changes**:
- **`src/components/SmartAppReview.tsx`**: Accept an additional `createdAt` prop (the user's `created_at` from their profile). Before showing the review, check if the account is older than 15 days. If not, return early.
- **`src/pages/Profile.tsx`**: Pass `createdAt={profile?.created_at}` to `SmartAppReview`.

**Files**: `src/components/SmartAppReview.tsx`, `src/pages/Profile.tsx`

---

## Technical Summary

| # | Feature | Primary Files | Risk |
|---|---------|--------------|------|
| 1 | Green dot sync | Home.tsx | Low |
| 2 | Call history dedup + screen lock | Call.tsx | Medium |
| 3 | Feedback banner logic | Call.tsx | Low (mostly correct) |
| 4 | Remote signal + reconnect | Call.tsx | Medium |
| 5 | Games multiplayer sync | Call.tsx + 6 game files | High |
| 6 | Chat fixes (4 sub-items) | Chat.tsx | Medium-High |
| 7 | Global banners | Verify only | Low |
| 8 | Forgot password | Already done | None |
| 9 | Delay ratings | SmartAppReview.tsx, Profile.tsx | Low |

**Safety**: All changes are additive enhancements. No existing routes, providers, or core auth/WebRTC flows are modified or removed. The `isProfileComplete` function, all providers in `App.tsx`, and the full route table remain untouched.

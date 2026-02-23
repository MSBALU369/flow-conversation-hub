

# Chat UI & Functionality Perfection Update

## Summary
This plan enhances the existing Chat.tsx with 4 major improvements: WhatsApp-style image rendering with full-screen viewer, proper View Once logic, read receipt tick marks, functional context menu actions, and two-way Clear Chat. All features already have partial implementations that will be enhanced -- not duplicated.

---

## PART 1: WhatsApp-Style Image Rendering & Full-Screen Viewer

### What exists now
- Images show as text labels ("Photo" / "View once photo") inside chat bubbles (lines 1370-1401)
- `compressImage()` function already exists (lines 72-89) and is called during upload (lines 957-963)
- `mediaUrl` is stored on messages but never rendered as an actual `<img>` tag in bubbles

### Changes
1. **Direct image rendering in bubbles**: Replace the text-only rendering for `type === "image"` (non-viewOnce) messages with an actual `<img>` tag using `message.mediaUrl`, styled as `max-w-[75vw] rounded-lg overflow-hidden` -- matching WhatsApp's bubble style
2. **Full-screen image viewer**: Add a new state `fullScreenImage` (string | null). When a regular image is clicked, set it. Render a fixed full-screen overlay (`fixed inset-0 z-50 bg-black/95`) with the image centered, a close button, and tap-to-dismiss
3. **Compression is already implemented** -- no changes needed. The existing `compressImage` (max 1200px, quality 0.7) is already called before upload

### Gallery Dialog fix
- The Gallery Dialog (lines 1742-1752) currently shows placeholder icons instead of actual images. Update to render `<img src={msg.mediaUrl}>` for each media message

---

## PART 2: View Once Logic Enhancement

### What exists now
- View Once detection: `viewOnce` is set based on content prefix "View once" (line 388)
- Receiver sees "Tap to view" button (lines 1371-1394) that deletes from storage + DB
- BUT: clicking "Tap to view" never actually shows the image -- it just deletes it immediately

### Changes
1. **Show image before deleting**: When receiver taps "Tap to view":
   - Fetch `media_url` from DB
   - Open the full-screen viewer with that URL
   - When the viewer is closed, THEN delete from Storage + mark `deleted_for_everyone = true` in DB
2. **View Once bubble UI**: Show a distinct bubble with camera icon and "Photo (View Once)" text, with a frosted/blurred background effect to make it visually distinct
3. **After viewed**: Message transforms to " Opened" (greyed out, non-clickable)

---

## PART 3: Read Receipts (Tick Marks)

### What exists now
- `getStatusIcon()` function (lines 1064-1073) already renders:
  - Single grey Check for "sent"
  - Double grey CheckCheck for "delivered"  
  - Double blue CheckCheck for "read"
- Ticks are already displayed next to timestamps (line 1419)
- `is_read` is updated in realtime via UPDATE subscription (line 493)
- Messages from friend are auto-marked as `is_read = true` when chat is open (lines 411-416, 453-458)

### Changes
1. **Replace Lucide icons with custom SVG ticks** for a more WhatsApp-authentic look (smaller, cleaner double-check marks)
2. **Ensure "sent" status is properly set**: Currently optimistic messages start as "sent", but once the DB confirms insertion, they should transition to "delivered". The realtime UPDATE handler already handles the "read" transition. Add logic so that when INSERT realtime fires for our own message, status becomes "delivered"
3. No database schema changes needed -- `is_read` boolean already covers sent/delivered/read flow

---

## PART 4: Message Context Menu & Clear Chat

### What exists now
- Hover action buttons exist (lines 1451-1499): React, Copy, Forward, Pin, Edit, Delete
- Copy handler works (line 841-845)
- Forward handler works (lines 847-857)
- Delete for me / Delete for everyone both work (lines 901-929)
- Clear Chat dialog exists (lines 1758-1868) with time picker (1h, 1d, 1m, all)
- BUT: Clear Chat only deletes the current user's sent messages (one-way), not both sides

### Changes

#### A. Long-press context menu (mobile)
- Add `onContextMenu` (right-click / long-press) handler on message bubbles that shows a native-feeling popup menu with: Copy, Reply, Forward, Pin, Edit (if eligible), Delete
- This complements the existing hover buttons which are desktop-only

#### B. Clear Chat -- Two-way vanish
- Current implementation only deletes `sender_id = profile.id` messages (lines 1809-1845)
- Update to delete messages from BOTH directions in the conversation:
  - Delete where `(sender_id = me AND receiver_id = friend) OR (sender_id = friend AND receiver_id = me)`
  - RLS only allows deleting own sent messages, so we need to use `deleted_for` array approach for the friend's messages (mark current user in `deleted_for` array) while physically deleting own messages
  - Update the query to: (1) physically delete own sent messages, (2) add user ID to `deleted_for` array for received messages
- Also clean up orphaned media from storage for deleted messages

---

## Technical Details

### New state variables in Chat.tsx
- `fullScreenImage: string | null` -- URL for full-screen image viewer
- `viewOnceImageUrl: string | null` -- URL for view-once image being viewed
- `viewOnceMessageId: string | null` -- ID of view-once message being viewed
- `contextMenuMessage: Message | null` -- message for long-press context menu
- `contextMenuPos: {x: number, y: number} | null` -- position of context menu

### Files modified
- `src/pages/Chat.tsx` -- All changes are in this single file (enhance existing code, no new files needed)

### No database schema changes required
- `chat_messages` table already has: `media_url`, `is_read`, `deleted_for` (array), `deleted_for_everyone`, `reactions`, `reply_to_id`, `is_pinned`, `edited_at`
- All needed columns exist

### No new dependencies
- All features use existing libraries (Lucide icons, Radix Dialog, Supabase client)


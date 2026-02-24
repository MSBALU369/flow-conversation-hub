
# Add WhatsApp-Style Date Separators to Chat Messages

## What Changes
Messages in the chat conversation view will be grouped by date with centered date labels between them, just like WhatsApp. Labels will show:
- **"Today"** for today's messages
- **"Yesterday"** for yesterday's messages
- **The full date** (e.g., "Monday, 24 February 2026") for older messages

## How It Will Look
```text
         ┌─────────────────┐
         │   23 Feb 2026   │
         └─────────────────┘
    [message]        [message]
    [message]

         ┌─────────────────┐
         │    Yesterday    │
         └─────────────────┘
    [message]

         ┌─────────────────┐
         │      Today      │
         └─────────────────┘
    [message]        [message]
```

## Technical Details

**File: `src/pages/Chat.tsx`**

1. Add a helper function `formatDateSeparator(date: Date)` that returns "Today", "Yesterday", or a formatted date string (e.g., "Monday, 24 February 2026") using `date-fns` (already imported).

2. Modify the message rendering loop (around line 1346) to insert a centered date separator `<div>` before the first message of each new day. Before each message, compare its date with the previous message's date -- if different (or first message), render a pill-shaped date label.

The date separator will be styled as a small rounded pill with muted background and centered text, matching WhatsApp's design language and the app's existing theme tokens.

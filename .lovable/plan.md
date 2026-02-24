

## Problem

The "History" button is not properly showing call logs for both parties. There are two root causes:

1. **RLS Policy Block**: The `call_history` table enforces `auth.uid() = user_id` on INSERT. When the caller tries to insert a record on behalf of the receiver (e.g., `user_id: receiverId`), the insert silently fails because the caller's auth token doesn't match the receiver's user_id.

2. **Missing Receiver-Side Logging**: When the receiver declines a call (`declineIncomingCall`), no missed call entry is created for the receiver's own history or in chat messages.

## Solution

### 1. Create a Database Function to Insert Call History for Both Parties

Create a new Supabase RPC function `log_call_for_both` that uses `SECURITY DEFINER` to bypass RLS and insert call history records for both the caller and receiver in a single call.

```text
Function: log_call_for_both(
  p_caller_id UUID,
  p_receiver_id UUID,
  p_caller_name TEXT,
  p_receiver_name TEXT,
  p_duration INT,
  p_status TEXT   -- 'completed', 'missed'
)
```

This function will:
- Insert a record for the caller (status = 'outgoing' or 'missed')
- Insert a record for the receiver (status = 'incoming' or 'missed')
- Validate that the calling user is one of the two parties

### 2. Update `useCallState.tsx`

- **Declined handler** (line ~162): Replace the two separate `call_history` inserts with a single `log_call_for_both` RPC call. Keep the `chat_messages` insert (caller-only to avoid duplicates).
- **Timeout handler** (line ~382): Same replacement — use the RPC instead of two separate inserts.
- **`declineIncomingCall`** (line ~592): After updating the call status to "declined", the receiver should also log the missed call in their own chat. Add a `chat_messages` insert from the receiver's perspective so BOTH users see "Missed Call" in their chat thread.

### 3. Update `Call.tsx` (handleEndCall)

- **Completed calls** (line ~427): Replace the two separate `call_history` inserts with the `log_call_for_both` RPC call, passing status as 'completed' (caller gets 'outgoing', receiver gets 'incoming').

### 4. SQL Migration

```sql
CREATE OR REPLACE FUNCTION public.log_call_for_both(
  p_caller_id UUID,
  p_receiver_id UUID,
  p_caller_name TEXT,
  p_receiver_name TEXT,
  p_duration INT DEFAULT 0,
  p_status TEXT DEFAULT 'completed'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate: the invoking user must be one of the two parties
  IF auth.uid() IS DISTINCT FROM p_caller_id
     AND auth.uid() IS DISTINCT FROM p_receiver_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Caller's record
  INSERT INTO call_history (user_id, partner_name, duration, status)
  VALUES (
    p_caller_id,
    p_receiver_name,
    p_duration,
    CASE WHEN p_status = 'missed' THEN 'missed' ELSE 'outgoing' END
  );

  -- Receiver's record
  INSERT INTO call_history (user_id, partner_name, duration, status)
  VALUES (
    p_receiver_id,
    p_caller_name,
    p_duration,
    CASE WHEN p_status = 'missed' THEN 'missed' ELSE 'incoming' END
  );
END;
$$;
```

### 5. Files Changed

| File | Change |
|------|--------|
| `supabase/migrations/new_migration.sql` | New `log_call_for_both` RPC function |
| `src/hooks/useCallState.tsx` | Replace dual inserts with RPC calls; add receiver-side chat log on decline |
| `src/pages/Call.tsx` | Replace dual inserts with RPC call for completed calls |
| `src/integrations/supabase/types.ts` | Add RPC type definition |

### Summary of What Changes for the User

- When a friend calls and the other friend **rejects** or **doesn't answer**: both users see "Missed Call" in their chat thread, and both users see the missed call entry in their History button with timestamp.
- When a call **completes**: both users see the call logged in their History (caller as "Outgoing", receiver as "Incoming") with duration and timestamp.
- The History button will now properly display all call records for both parties.


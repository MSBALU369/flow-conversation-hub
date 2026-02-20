

## Add Optional Reference ID Field to Signup

### What This Does
Adds an optional "Reference ID" input field on the signup form, below email and password. Users can optionally enter an existing member's UID (unique_id). If entered, it validates in real-time against the database -- showing an error if invalid, or accepting it if valid. After successful signup, the reference ID is saved to the new user's profile.

### How It Works
1. **New input field** appears only during signup mode, placed below the password field
2. **Real-time validation**: When the user types/blurs the reference ID field, a query checks the `profiles` table for a matching `unique_id`
3. **Feedback**: Shows "Wrong referenceID" in red if no match found, or a green checkmark if valid
4. **Optional**: Users can leave it blank and sign up without any issue
5. **On signup success**: After OTP verification, the `referred_by` field on the new user's profile is updated with the validated reference ID, triggering the existing `handle_referral` database function which awards 10 coins to the referrer

### Technical Details

**File: `src/pages/Login.tsx`**
- Add state variables: `referenceId`, `referenceIdError`, `referenceIdValid`
- Add a new `Input` field (visible only when `isSignUp` is true) with placeholder "Reference ID (optional)"
- On blur or change, if non-empty, query `supabase.from("profiles").select("unique_id").eq("unique_id", referenceId).maybeSingle()`
  - If no match: set error "Wrong referenceID"
  - If match found: set valid state, clear error
- After OTP verification succeeds (`handleVerifyOtp`), if `referenceId` is valid, update the new user's profile: `supabase.from("profiles").update({ referred_by: referenceId }).eq("id", user.id)`
- Block form submission if reference ID is non-empty but invalid

**No database changes needed** -- the `profiles.referred_by` column and `handle_referral` trigger already exist.


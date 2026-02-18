
## Add Skip Button to Login Page

Add a "Skip" button at the top-right of the Login page so users can enter the app without signing up or logging in.

### What will happen
- A "Skip" text button appears in the top-right corner of the login screen
- Clicking it navigates the user directly to the home page, bypassing login and onboarding
- The app will need to allow unauthenticated access to the home route when skipped

### Technical Details

**File: `src/pages/Login.tsx`**
- Add a "Skip" button positioned at the top-right of the card (or screen)
- On click, navigate to "/" using `useNavigate`

**File: `src/App.tsx`**
- Update the routing logic so unauthenticated users who skip can still view the home page
- Add a `localStorage` flag (e.g., `ef_skipped_login`) to track that the user chose to skip
- When no user is logged in but the skip flag is set, allow access to the main routes instead of redirecting to `/login`

### Flow
1. User lands on `/login`
2. Clicks "Skip" at the top
3. `localStorage.setItem("ef_skipped_login", "true")` is set
4. User is navigated to `/` and can browse the app as a guest

import { lazy, Suspense, memo } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, ProfileProvider } from "@/hooks/useProfile";
import { CallStateProvider } from "@/hooks/useCallState";
import { AuthorizedGlobals } from "@/components/AuthorizedGlobals";

// Eager-loaded critical pages (Home, Chat, Call, Talent, Rooms)
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import Chat from "./pages/Chat";
import Call from "./pages/Call";
import Talent from "./pages/Talent";
import Rooms from "./pages/Rooms";

// Lazy-loaded secondary pages
const Premium = lazy(() => import("./pages/Premium"));
const Profile = lazy(() => import("./pages/Profile"));
const FindingUser = lazy(() => import("./pages/FindingUser"));
const Learn = lazy(() => import("./pages/Learn"));
const RoomDiscussion = lazy(() => import("./pages/RoomDiscussion"));
const UserProfilePage = lazy(() => import("./pages/UserProfilePage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const FAQ = lazy(() => import("./pages/FAQ"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const LegalInfo = lazy(() => import("./pages/LegalInfo"));
const ContactUs = lazy(() => import("./pages/ContactUs"));
const Recommendations = lazy(() => import("./pages/Recommendations"));
const Admin = lazy(() => import("./pages/Admin"));
const Requests = lazy(() => import("./pages/Requests"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 300000,
      refetchOnWindowFocus: false,
      retry: 1,
      gcTime: 600000,
    },
  },
});

function isProfileComplete(profile: any): boolean {
  return !!(profile?.username);
}

const LoadingSpinner = memo(() => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
));
LoadingSpinner.displayName = "LoadingSpinner";

function AppRoutes() {
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const location = useLocation();

  if (loading || (user && profileLoading)) {
    return <LoadingSpinner />;
  }

  if (!user) {
    // Allow reset-password route even when not logged in (for email link flow)
    if (location.pathname === "/reset-password") {
      return (
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/reset-password" element={<ResetPassword />} />
          </Routes>
        </Suspense>
      );
    }
    if (location.pathname !== "/login") {
      return <Navigate to="/login" replace />;
    }
    return <Login />;
  }

  if (!isProfileComplete(profile)) {
    if (location.pathname !== "/onboarding") {
      return <Navigate to="/onboarding" replace />;
    }
    return <Onboarding />;
  }

  if (location.pathname === "/login" || location.pathname === "/onboarding") {
    return <Navigate to="/" replace />;
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/premium" element={<Premium />} />
        <Route path="/talent" element={<Talent />} />
        <Route path="/learn" element={<Learn />} />
        <Route path="/rooms" element={<Rooms />} />
        <Route path="/room/:roomCode" element={<RoomDiscussion />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/finding" element={<FindingUser />} />
        <Route path="/call" element={<Call />} />
        <Route path="/user/:id" element={<UserProfilePage />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/legal" element={<LegalInfo />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/requests" element={<Requests />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ProfileProvider>
          <CallStateProvider>
            <AppRoutes />
            <AuthorizedGlobals />
          </CallStateProvider>
        </ProfileProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

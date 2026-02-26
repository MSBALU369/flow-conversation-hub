import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, ProfileProvider } from "@/hooks/useProfile";
import { CallStateProvider } from "@/hooks/useCallState";
import { AuthorizedGlobals } from "@/components/AuthorizedGlobals";

// Lazy-loaded pages
const Login = lazy(() => import("./pages/Login"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Home = lazy(() => import("./pages/Home"));
const Chat = lazy(() => import("./pages/Chat"));
const Premium = lazy(() => import("./pages/Premium"));
const Profile = lazy(() => import("./pages/Profile"));
const Call = lazy(() => import("./pages/Call"));
const FindingUser = lazy(() => import("./pages/FindingUser"));
const Talent = lazy(() => import("./pages/Talent"));
const Learn = lazy(() => import("./pages/Learn"));
const Rooms = lazy(() => import("./pages/Rooms"));
const RoomDiscussion = lazy(() => import("./pages/RoomDiscussion"));
const UserProfilePage = lazy(() => import("./pages/UserProfilePage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const FAQ = lazy(() => import("./pages/FAQ"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const LegalInfo = lazy(() => import("./pages/LegalInfo"));
const ContactUs = lazy(() => import("./pages/ContactUs"));
const Admin = lazy(() => import("./pages/Admin"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 300000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function isProfileComplete(profile: any): boolean {
  // Founder rule: gender defaults to 'male' — users can always access home.
  // Only block if username is completely missing (null).
  return !!(profile?.username);
}

const LoadingSpinner = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

function AppRoutes() {
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const location = useLocation();

  if (loading || (user && profileLoading)) {
    return <LoadingSpinner />;
  }

  // Not logged in — only allow /login
  if (!user) {
    if (location.pathname !== "/login") {
      return <Navigate to="/login" replace />;
    }
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <Login />
      </Suspense>
    );
  }

  // Logged in but profile incomplete — only allow /onboarding
  if (!isProfileComplete(profile)) {
    if (location.pathname !== "/onboarding") {
      return <Navigate to="/onboarding" replace />;
    }
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <Onboarding />
      </Suspense>
    );
  }

  // Logged in + profile complete — block /login and /onboarding
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

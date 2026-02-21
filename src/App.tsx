import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, ProfileProvider } from "@/hooks/useProfile";
import { CallStateProvider } from "@/hooks/useCallState";
import FloatingCallBubble from "@/components/FloatingCallBubble";
import FloatingSearchBubble from "@/components/FloatingSearchBubble";
import IncomingCallBanner from "@/components/IncomingCallBanner";
import OutgoingCallBanner from "@/components/OutgoingCallBanner";
import { IncomingCallDemo } from "@/components/IncomingCallDemo";
import { RenewalReminder } from "@/components/RenewalReminder";
import { BatteryWarningModal } from "@/components/BatteryWarningModal";

// Pages
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import Chat from "./pages/Chat";
import Premium from "./pages/Premium";
import Profile from "./pages/Profile";
import Call from "./pages/Call";
import FindingUser from "./pages/FindingUser";
import Talent from "./pages/Talent";
import Learn from "./pages/Learn";
import Rooms from "./pages/Rooms";
import RoomDiscussion from "./pages/RoomDiscussion";
import UserProfilePage from "./pages/UserProfilePage";
import NotFound from "./pages/NotFound";
import FAQ from "./pages/FAQ";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import LegalInfo from "./pages/LegalInfo";
import ContactUs from "./pages/ContactUs";

const queryClient = new QueryClient();

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
    return <Login />;
  }

  // Logged in but profile incomplete — only allow /onboarding
  if (!isProfileComplete(profile)) {
    if (location.pathname !== "/onboarding") {
      return <Navigate to="/onboarding" replace />;
    }
    return <Onboarding />;
  }

  // Logged in + profile complete — block /login and /onboarding
  if (location.pathname === "/login" || location.pathname === "/onboarding") {
    return <Navigate to="/" replace />;
  }

  return (
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
      <Route path="*" element={<NotFound />} />
    </Routes>
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
            <FloatingCallBubble />
            <FloatingSearchBubble />
            <IncomingCallBanner />
            <OutgoingCallBanner />
            <IncomingCallDemo />
            <RenewalReminder />
            <BatteryWarningModal />
          </CallStateProvider>
        </ProfileProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

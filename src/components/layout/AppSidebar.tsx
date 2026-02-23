import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu,
  Home,
  User,
  Users,
  BookOpen,
  Trophy,
  Clock,
  HelpCircle,
  Shield,
  FileText,
  Mail,
  Eye,
  EyeOff,
  LogOut,
  RefreshCw,
  Zap,
  Crown,
  Coins,
  Phone,
  ShieldCheck,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { LevelsModal } from "@/components/LevelsModal";
import { TrustScoreModal } from "@/components/TrustScoreModal";
import { EFLogo } from "@/components/ui/EFLogo";
import { SpeakWithModal } from "@/components/SpeakWithModal";
import { PremiumModal } from "@/components/PremiumModal";
import { isAdminOrRoot } from "@/pages/Admin";

interface AppSidebarProps {
  onHistoryClick?: () => void;
}

export function AppSidebar({ onHistoryClick }: AppSidebarProps) {
  const [open, setOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    return !document.documentElement.classList.contains("light");
  });
  const [levelsModalOpen, setLevelsModalOpen] = useState(false);
  const [trustScoreModalOpen, setTrustScoreModalOpen] = useState(false);
  const [speakWithOpen, setSpeakWithOpen] = useState(false);
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);
  const { profile, updateProfile } = useProfile();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();



  const handleLogout = async () => {
    await supabase.auth.signOut();
    setOpen(false);
    navigate("/login");
    toast({ title: "Signed out", description: "See you soon!" });
  };

  const handleNavigate = (path: string) => {
    if (path.startsWith("#")) {
      toast({ title: "Coming soon", description: `This feature is under development.` });
    } else {
      navigate(path);
    }
    setOpen(false);
  };

  const handleHistoryClick = () => {
    setOpen(false);
    onHistoryClick?.();
  };

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }
    toast({ 
      title: newDark ? "Eye Safety On" : "Eye Safety Off", 
      description: newDark ? "Dark mode enabled to protect your eyes" : "Light mode enabled"
    });
  };

  const premiumDaysLeft = profile?.premium_expires_at
    ? Math.max(0, Math.ceil((new Date(profile.premium_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const handleLevelsClick = () => {
    setOpen(false);
    setLevelsModalOpen(true);
  };

  const handleTrustScoreClick = () => {
    setOpen(false);
    setTrustScoreModalOpen(true);
  };

  const handleSpeakWithClick = () => {
    setOpen(false);
    setSpeakWithOpen(true);
  };

  const menuItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: User, label: "Profile", path: "/profile" },
    { icon: Users, label: "Rooms", path: "/rooms" },
    // Non-premium: Show "Speak With" under Rooms, then Learn
    { icon: Phone, label: "Speak With", action: handleSpeakWithClick },
    { icon: BookOpen, label: "Learn", path: "/learn" },
    { icon: Trophy, label: "Levels", action: handleLevelsClick, badge: `Lv.${profile?.level ?? 1}` },
    { icon: Clock, label: "History", action: handleHistoryClick },
    { icon: Shield, label: "Trust Score", action: handleTrustScoreClick },
    ...(isAdminOrRoot(user?.email) ? [{ icon: ShieldCheck, label: "Admin Dashboard", path: "/admin" }] : []),
  ];

  const supportItems = [
    { icon: HelpCircle, label: "FAQ", path: "/faq" },
    { icon: Shield, label: "Privacy Policy", path: "/privacy" },
    { icon: FileText, label: "Legal Info", path: "/legal" },
    { icon: Mail, label: "Contact Us", path: "/contact" },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="p-2 glass-button rounded-xl hover:bg-muted transition-colors">
          <Menu className="w-5 h-5 text-foreground" />
        </button>
      </SheetTrigger>

      <SheetContent 
        side="left" 
        className="w-[300px] bg-background/95 backdrop-blur-xl border-border p-0"
      >
        <div className="flex flex-col h-full">
          {/* Header: Profile Section */}
           <SheetHeader className="p-4 pb-3">
            <div className="flex flex-col gap-3">
              <EFLogo size="md" className="mb-1" />
              <button
                onClick={() => handleNavigate("/profile")}
                className="flex items-center gap-3 hover:bg-muted/50 rounded-xl p-2 transition-colors w-full"
              >
                <div className="relative -ml-1">
                  <div className={`w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden ${
                    profile?.is_premium ? 'ring-2 ring-[hsl(45,100%,50%)]' : 'bg-muted'
                  }`}>
                    {profile?.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt="Avatar" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-lg">👤</span>
                    )}
                  </div>
                  {profile?.is_premium && (
                    <Crown className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 text-[hsl(45,100%,50%)]" fill="hsl(45,100%,50%)" style={{ filter: 'drop-shadow(0 0 3px hsl(45,100%,50%))' }} />
                  )}
                </div>
                <div className="text-left min-w-0 flex-1">
                  <SheetTitle className="text-foreground text-xs font-semibold truncate text-left">
                    {profile?.username || "User"}
                  </SheetTitle>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {user?.email || "No email"}
                  </p>
                </div>
              </button>

              {/* Coins Button */}
              <button
                onClick={() => handleNavigate("/profile")}
                className="w-full flex items-center justify-between px-2 py-1 rounded-lg border border-[hsl(45,100%,50%)]/20 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-[hsl(45,100%,50%)]" />
                  <span className="text-[10px] font-semibold text-foreground">🪙 My Coins</span>
                </div>
                <span className="text-[11px] font-bold text-[hsl(43,80%,40%)]">{profile?.coins ?? 0}</span>
              </button>
            </div>

            {/* Theme Toggle */}
            <div className="mt-2 w-full flex items-center justify-between p-2 rounded-xl border border-border bg-card shadow-sm">
              <div className="flex items-center gap-2">
                {isDark ? (
                  <Eye className="w-5 h-5 text-[hsl(142,71%,45%)]" />
                ) : (
                  <EyeOff className="w-5 h-5 text-destructive" />
                )}
                <span className="text-sm font-medium text-foreground">Eye Safety</span>
              </div>
              <button
                onClick={toggleTheme}
                className={cn(
                  "relative w-11 h-6 rounded-full transition-colors duration-200 border",
                  isDark ? "bg-[hsl(142,71%,45%)] border-[hsl(142,71%,45%)]" : "bg-destructive/20 border-destructive/40"
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 left-0.5 w-5 h-5 rounded-full shadow transition-transform duration-200",
                    isDark ? "translate-x-5 bg-primary-foreground" : "translate-x-0 bg-destructive"
                  )}
                />
              </button>
            </div>
          </SheetHeader>




          <Separator className="bg-border" />

          {/* Premium Status */}
          <div className="px-4 py-2">
            <div className={cn(
              "p-3 rounded-xl flex items-center gap-2.5",
              profile?.is_premium ? "bg-primary/20" : "bg-muted"
            )}>
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center",
                profile?.is_premium ? "bg-primary/30" : "bg-muted-foreground/20"
              )}>
                {profile?.is_premium ? (
                  <Crown className="w-5 h-5 text-primary" />
                ) : (
                  <Zap className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {profile?.is_premium ? "Premium Active" : "Free Plan"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {profile?.is_premium 
                    ? `${premiumDaysLeft} days left`
                    : "Upgrade for more features"
                  }
                </p>
              </div>
            </div>
          </div>

          <Separator className="bg-border" />

          {/* Navigation Menu */}
          <div className="flex-1 overflow-y-auto px-3 py-4">
            <div className="space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => item.action ? item.action() : handleNavigate(item.path!)}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 text-muted-foreground" />
                    <span className="text-foreground">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-xs font-semibold text-primary bg-primary/20 px-2 py-0.5 rounded">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <Separator className="bg-border my-4" />

            <p className="text-xs text-muted-foreground uppercase tracking-wider px-3 mb-2">
              Support
            </p>
            <div className="space-y-1">
              {supportItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleNavigate(item.path)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                >
                  <item.icon className="w-5 h-5 text-muted-foreground" />
                  <span className="text-foreground">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-muted-foreground">Version 3.0</span>
              <button className="text-xs text-primary flex items-center gap-1">
                <RefreshCw className="w-3 h-3" />
                Switch Account
              </button>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-destructive/10 hover:bg-destructive/20 transition-colors"
            >
              <LogOut className="w-5 h-5 text-destructive" />
              <span className="text-destructive font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </SheetContent>

      <LevelsModal
        open={levelsModalOpen}
        onOpenChange={setLevelsModalOpen}
        currentLevel={profile?.level ?? 1}
        currentXp={profile?.xp ?? 0}
      />

      <TrustScoreModal
        open={trustScoreModalOpen}
        onOpenChange={setTrustScoreModalOpen}
      />

      <SpeakWithModal
        open={speakWithOpen}
        onOpenChange={setSpeakWithOpen}
        isPremium={!!profile?.is_premium}
        onPremiumRequired={() => setPremiumModalOpen(true)}
      />

      <PremiumModal
        open={premiumModalOpen}
        onOpenChange={setPremiumModalOpen}
      />
    </Sheet>
  );
}

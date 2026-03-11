import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Lock, Phone, ShieldCheck, Zap, Clock, Flame, Play, Volume2, Info, Users, BadgeCheck, Diamond, Crown, ShieldAlert, Target } from "lucide-react";
import { TopPicksCarousel } from "@/components/home/TopPicksCarousel";
import { AdBanner } from "@/components/AdBanner";
import { SpeakWithModal } from "@/components/SpeakWithModal";
import { LevelsModal } from "@/components/LevelsModal";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { NeonBattery } from "@/components/ui/NeonBattery";
import { useProfile } from "@/hooks/useProfile";
import { PremiumModal } from "@/components/PremiumModal";
import { CombinedHistoryModal } from "@/components/CombinedHistoryModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useRole } from "@/hooks/useRole";
type GenderFilter = "random" | "female" | "male";

export default function Home() {
  const {
    profile,
    loading,
    updateProfile
  } = useProfile();
  const [selectedFilter, setSelectedFilter] = useState<GenderFilter>("random");
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const { role } = useRole();
  const [realOnlineCount, setRealOnlineCount] = useState(0);

  // Stable fake count per session (126–211)
  const [fakeCount] = useState(() => {
    const stored = sessionStorage.getItem("ef_fake_online");
    if (stored) return parseInt(stored, 10);
    const fake = Math.floor(Math.random() * (211 - 126 + 1)) + 126;
    sessionStorage.setItem("ef_fake_online", String(fake));
    return fake;
  });

  const isAdmin = role === "admin" || role === "root";

  // Fetch real online count using last_seen threshold (2 minutes)
  useEffect(() => {
    const fetchOnlineCount = async () => {
      const threshold = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gte("last_seen", threshold);
      setRealOnlineCount(count || 0);
    };
    fetchOnlineCount();
    const interval = setInterval(fetchOnlineCount, 60000);
    return () => clearInterval(interval);
  }, []);
  const [adPlaying, setAdPlaying] = useState(false);
  const [adProgress, setAdProgress] = useState(0);
  const [adFinished, setAdFinished] = useState(false);
  const [showLevelsModal, setShowLevelsModal] = useState(false);
  const isPremium = profile?.is_premium ?? false;
  const [showSpeakWith, setShowSpeakWith] = useState(false);
  const [showGuide, setShowGuide] = useState(false);


  // Simulate ad playback — award coins via DB after completion
  useEffect(() => {
    if (!adPlaying) return;
    const interval = setInterval(() => {
      setAdProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setAdPlaying(false);
          setAdFinished(true);
          // Award 5 coins — backend-first
          if (profile?.id) {
            (async () => {
              const { data, error } = await supabase
                .from("profiles")
                .update({ coins: (profile.coins ?? 0) + 5 })
                .eq("id", profile.id)
                .select("coins")
                .single();
              if (!error && data) {
                updateProfile({ coins: data.coins });
                toast({ title: "+5 Flow Points!", description: "FP awarded for watching the ad." });
              } else {
                toast({ title: "Failed to add Flow Points", variant: "destructive" });
              }
            })();
          }
          return 100;
        }
        return prev + 2;
      });
    }, 300);
    return () => clearInterval(interval);
  }, [adPlaying]);

  // Check and update streak on new day — only once per mount (no aggressive polling)
  useEffect(() => {
    if (!profile?.id) return;

    const checkStreak = async () => {
      const today = new Date().toISOString().split('T')[0];
      const lastActive = profile.last_refill_time ? new Date(profile.last_refill_time).toISOString().split('T')[0] : null;

      if (lastActive !== today) {
        const newStreak = Math.min((profile.streak_count || 0) + 1, 7);
        await updateProfile({
          streak_count: newStreak,
          last_refill_time: new Date().toISOString()
        });
        toast({
          title: `⚡ Day ${newStreak} Charged!`,
          description: "Streak Active. Keep practicing!"
        });
      }
    };

    checkStreak();
  }, [profile?.id]);
  const handleStartCall = () => {
    // Free users always get random — premium filters enforced server-side too
    const genderPref = isPremium && selectedFilter !== "random" ? selectedFilter : null;
    navigate("/finding", {
      state: {
        genderFilter: genderPref,
      },
    });
  };
  const handleGenderFilter = (filter: GenderFilter) => {
    if (filter === "random") {
      setSelectedFilter(filter);
    } else {
      // Premium trap - clicking locked filters opens premium modal
      if (!profile?.is_premium) {
        setShowPremiumModal(true);
      } else {
        setSelectedFilter(filter);
      }
    }
  };
  // isPremium already declared above
  const streakDays = profile?.streak_count || 1;
  const batteryBars = profile?.energy_bars ?? streakDays;
  return <div className="min-h-screen bg-background pb-20">
      {/* Animated gradient mesh background */}
      <div className="fixed inset-0 gradient-mesh pointer-events-none" />
      
      <div className="relative z-10">
        <AppHeader streakDays={streakDays} level={profile?.level ?? 1} showLogout onlineCount={realOnlineCount + fakeCount} onHistoryClick={() => setShowHistoryModal(true)} />

        <main className="px-3 pt-2 relative">
          {/* Battery indicator (hidden for premium) */}
          {!isPremium && (
            <div className="flex items-center justify-end gap-1 mb-0.5 scale-[0.65] origin-right">
              <span className={`text-[8px] font-medium ${
                batteryBars === 7 ? 'text-primary' : 
                batteryBars >= 5 ? 'text-accent' : 
                batteryBars >= 3 ? 'text-[hsl(var(--ef-streak))]' : 'text-destructive'
              }`}>
                {batteryBars === 7 ? '⚡ Full Power!' : 
                 batteryBars >= 5 ? '⚡ High Energy!' : 
                 batteryBars >= 3 ? '⚡ Medium' : '⚡ Low Energy'}
              </span>
              <NeonBattery segments={batteryBars} maxSegments={7} size="sm" />
            </div>
          )}

          {/* Premium/Role status banner */}
          {(isPremium || role) && <div className="glass-card p-2 mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <Zap className="w-3 h-3 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-xs font-medium text-foreground">{isPremium ? "Premium Active" : "Free Tier"}</p>
                    {role && (
                      <span className="inline-flex items-center gap-0.5 bg-primary/10 px-1.5 py-0.5 rounded-full">
                        <BadgeCheck className="w-2.5 h-2.5 text-primary" />
                        <span className="text-[9px] font-semibold text-primary capitalize">{role}</span>
                      </span>
                    )}
                    <span className="inline-flex items-center gap-0.5 bg-accent/10 px-1.5 py-0.5 rounded-full">
                      <Diamond className="w-2.5 h-2.5 text-accent" />
                      <span className="text-[9px] font-semibold text-accent">{profile?.coins ?? 0}</span>
                    </span>
                  </div>
                  {isPremium && profile?.premium_expires_at && (
                    <p className="text-[10px] text-primary">
                      {(() => {
                        const daysLeft = Math.ceil((new Date(profile.premium_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                        return daysLeft > 36000 ? "Lifetime Access" : `${daysLeft} days left`;
                      })()}
                    </p>
                  )}
                </div>
              </div>
            </div>}

          {/* Non-Premium Encouragement Banner */}
          {!isPremium && (
            <div className="mt-1 mb-3 glass-card-glow px-2.5 py-1.5 border border-primary/20 rounded-xl">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center flex-shrink-0">
                  <Crown className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="flex-1 flex items-center justify-between">
                   <p className="text-[10px] font-bold text-foreground">You can't be perfect in English until you start speaking.</p>
                   <Button size="sm" onClick={() => setShowGuide(true)} className="ml-3 rounded-full text-[10px] h-5 px-2 shrink-0 bg-green-600 hover:bg-green-700 text-white">
                     Open
                   </Button>
                 </div>
              </div>
            </div>
          )}

          {/* Main Card */}
          <div className={cn("glass-card-glow p-4 animate-fade-in relative", "mt-0")}>
            
            {/* Top Row: Online Count (left) + History */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
               {/* Online Count */}
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-full shadow-sm">
                  <div className="w-1.5 h-1.5 bg-[hsl(var(--ef-online))] rounded-full animate-pulse" />
                  {isAdmin ? (
                    <span className="text-xs font-bold text-[hsl(var(--ef-online))]">
                      Real: {realOnlineCount} | Fake: {fakeCount}
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-[hsl(var(--ef-online))]">
                      {realOnlineCount + fakeCount} Online
                    </span>
                  )}
                </div>
              </div>
              
              {/* History Button */}
              <button onClick={() => setShowHistoryModal(true)} className="h-8 w-8 glass-button rounded-full flex items-center justify-center hover:bg-muted transition-all duration-200 group">
                <Clock className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
              </button>
            </div>

            {/* Center: Large Circular Icon Container */}
            <div className="flex justify-center mb-3">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center glow-teal">
                <Phone className="w-8 h-8 text-primary" />
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-2xl font-bold text-foreground tracking-wide-custom text-center mb-1">
              Talk & Practice
            </h1>
            
            {/* Subtext */}
            <p className="text-muted-foreground text-center text-sm mb-3">
              Speak with 100% real people.
            </p>

            {/* Trust Badge */}
            <div className="flex items-center justify-center gap-1.5 mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              <span className="text-sm font-semibold text-primary">Your identity is safe & private</span>
            </div>

            <p className="text-xs text-muted-foreground text-center mb-3">Just Focus on Practicing</p>

            {/* Filter Row */}
            <div className="mb-4">
              <div className="flex gap-2">
                {/* Random - Always available */}
                <button onClick={() => handleGenderFilter("random")} className={cn("flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200", selectedFilter === "random" ? "bg-primary text-primary-foreground glow-teal" : "glass-button text-foreground hover:bg-muted")}>
                  Random
                </button>

                {/* Female - Locked for non-premium */}
                <button onClick={() => handleGenderFilter("female")} className={cn("flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 relative", selectedFilter === "female" && isPremium ? "bg-primary text-primary-foreground glow-teal" : "glass-button text-foreground/70 filter-locked")}>
                  Female
                </button>

                {/* Male - Locked for non-premium */}
                <button onClick={() => handleGenderFilter("male")} className={cn("flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 relative", selectedFilter === "male" && isPremium ? "bg-primary text-primary-foreground glow-teal" : "glass-button text-foreground/70 filter-locked")}>
                  Male
                </button>
              </div>
            </div>

            {/* Start Call Button */}
            <Button onClick={handleStartCall} className="w-full py-6 text-lg font-bold bg-primary text-primary-foreground hover:bg-primary/90 pulse-glow rounded-xl">
              <Phone className="w-6 h-6 mr-2" />
              Start Speaking
            </Button>

            {/* Speaking Level Indicator */}
            <button
              onClick={() => setShowLevelsModal(true)}
              className="w-full text-center text-sm text-muted-foreground mt-3 hover:opacity-80 transition-opacity"
            >
              You are a <span className="text-primary font-semibold underline underline-offset-2 decoration-primary/40">Level {profile?.level ?? 1}</span> speaker
              <Info className="inline w-3 h-3 ml-1 text-primary/60" />
            </button>
          </div>


          {/* Top Picks Carousel */}
          <TopPicksCarousel />



          {/* Ad Banner for non-premium */}
          {!isPremium && (
            <div className="mt-3">
              <AdBanner variant="compact" />
            </div>
          )}
        </main>

        <BottomNav />
      </div>
      
      {/* Premium Modal */}
      {showPremiumModal && <PremiumModal open={showPremiumModal} onOpenChange={setShowPremiumModal} />}
      
      {/* History Modal */}
      {showHistoryModal && <CombinedHistoryModal open={showHistoryModal} onOpenChange={setShowHistoryModal} />}

      {/* Speak With Modal (Premium) */}
      {showSpeakWith && <SpeakWithModal open={showSpeakWith} onOpenChange={setShowSpeakWith} />}

      {/* Safe Space Guide Modal */}
      <Dialog open={showGuide} onOpenChange={setShowGuide}>
        <DialogContent className="glass-card max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">🛡️ Speak Without Fear!</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="flex gap-3">
              <ShieldAlert className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-foreground"><span className="font-semibold">Strict Rules:</span> Ignore bad comments. If anyone behaves badly, just cut the call and hit 'Report'. We will take strict action against them.</p>
            </div>
            <div className="flex gap-3">
              <Target className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-foreground"><span className="font-semibold">Focus on Your Goal:</span> You are here to learn English. Don't worry about what others think. Make mistakes and learn.</p>
            </div>
            <div className="flex gap-3">
              <Lock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm text-foreground"><span className="font-semibold">Keep It Private:</span> Never share your phone number, real name, or personal details with strangers.</p>
            </div>
            <div className="flex gap-3">
              <Flame className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
              <p className="text-sm text-foreground"><span className="font-semibold">Practice Daily:</span> English speaking comes only with daily practice. Speak a little every day to become fluent.</p>
            </div>
            <div className="flex gap-3">
              <Crown className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
              <p className="text-sm text-foreground"><span className="font-semibold">VIP Premium:</span> Want to avoid time-passers? Go Premium to connect only with verified and serious learners.</p>
            </div>
          </div>
          <Button className="w-full mt-6 bg-primary text-primary-foreground" onClick={() => setShowGuide(false)}>Understood, let's speak! 🎤</Button>
        </DialogContent>
      </Dialog>

      {/* Levels Modal */}
      {showLevelsModal && <LevelsModal
        open={showLevelsModal}
        onOpenChange={setShowLevelsModal}
        currentLevel={profile?.level ?? 1}
        currentXp={profile?.xp ?? 0}
      />}

    </div>;
}
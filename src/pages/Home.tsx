import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Phone, ShieldCheck, Zap, Clock, Flame, Play, BookOpen, ExternalLink, Volume2, Pause, Info, GraduationCap, Users, BadgeCheck, Coins } from "lucide-react";
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
const sampleBooks = [
  { title: "Think and Grow Rich", author: "Napoleon Hill", category: "Motivational", url: "https://www.amazon.com/dp/0449214923" },
  { title: "Atomic Habits", author: "James Clear", category: "Self-Help", url: "https://www.amazon.com/dp/0735211299" },
  { title: "The Power of Now", author: "Eckhart Tolle", category: "Motivational", url: "https://www.amazon.com/dp/1577314808" },
  { title: "English Grammar in Use", author: "Raymond Murphy", category: "English", url: "https://www.amazon.com/dp/1108457657" },
];

const sampleCourses = [
  { title: "English Speaking Masterclass", author: "Udemy", category: "English", url: "https://www.udemy.com" },
  { title: "IELTS Preparation", author: "Coursera", category: "English", url: "https://www.coursera.org" },
  { title: "Public Speaking Skills", author: "Skillshare", category: "Communication", url: "https://www.skillshare.com" },
  { title: "Business English", author: "LinkedIn Learning", category: "Professional", url: "https://www.linkedin.com/learning" },
];

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
  const [onlineCount] = useState(() => Math.floor(Math.random() * 200 + 500));
  const [adPlaying, setAdPlaying] = useState(false);
  const [adProgress, setAdProgress] = useState(0);
  const [adFinished, setAdFinished] = useState(false);
  const [showLevelsModal, setShowLevelsModal] = useState(false);
  const [showBooksModal, setShowBooksModal] = useState(false);
  const [booksTab, setBooksTab] = useState<"books" | "courses">("books");
  const isPremium = profile?.is_premium ?? false;
  const [showSpeakWith, setShowSpeakWith] = useState(false);

  // Simulate ad playback
  useEffect(() => {
    if (!adPlaying) return;
    const interval = setInterval(() => {
      setAdProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setAdPlaying(false);
          setAdFinished(true);
          return 100;
        }
        return prev + 2;
      });
    }, 300);
    return () => clearInterval(interval);
  }, [adPlaying]);

  // Check and update streak on new day
  useEffect(() => {
    const checkStreak = async () => {
      if (!profile?.id) return;
      const today = new Date().toISOString().split('T')[0];
      const lastActive = profile.last_refill_time ? new Date(profile.last_refill_time).toISOString().split('T')[0] : null;

      // If new day, increment streak
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
    navigate("/finding");
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
        <AppHeader streakDays={streakDays} level={profile?.level ?? 1} showLogout onlineCount={onlineCount} onHistoryClick={() => setShowHistoryModal(true)} />

        <main className="px-3 pt-2 relative">
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
                      <Coins className="w-2.5 h-2.5 text-accent" />
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

          {/* Main Card */}
          <div className={cn("glass-card-glow p-4 animate-fade-in relative", isPremium ? "mt-0" : "mt-2")}>
            {/* Battery - Positioned on top-right of card (hidden for premium) */}
            {!isPremium && (
              <div className="absolute -top-6 -right-1 scale-75 flex items-center gap-1.5">
                <span className={`text-[10px] font-medium ${
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
            
            {/* Top Row: Online Count (left) + History */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {/* Online Count */}
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-full shadow-sm">
                  <div className="w-1.5 h-1.5 bg-[hsl(var(--ef-online))] rounded-full animate-pulse" />
                  <span className="text-xs font-bold text-[hsl(var(--ef-online))]">{onlineCount} Online</span>
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

          {/* Recommended Books & Courses Button (premium) / Ad Area (free) */}
          {isPremium ? (
            <div className="mt-4 space-y-3">
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => setShowBooksModal(true)}
                  className="gap-2 text-sm px-5 py-2.5 h-auto border-primary/30 text-primary hover:bg-primary/10"
                >
                  <BookOpen className="w-4 h-4" />
                  Recommended Books & Courses
                </Button>
              </div>
              {/* Speak With - Premium only on Home */}
              <div className="flex justify-center">
                <Button
                  onClick={() => setShowSpeakWith(true)}
                  className="gap-2 text-sm px-5 py-2.5 h-auto bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20"
                  variant="outline"
                >
                  <Users className="w-4 h-4" />
                  Speak With (Filter by Level)
                </Button>
              </div>
              <div className="h-12" />
            </div>
          ) : (
            <div className="mt-4 glass-card p-4">
              <div className="text-center">
                {!adPlaying && !adFinished && (
                  <div className="border border-dashed border-border rounded-xl py-8 flex flex-col items-center justify-center gap-3">
                    <button
                      onClick={() => { setAdPlaying(true); setAdProgress(0); setAdFinished(false); }}
                      className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center hover:bg-primary/30 transition-colors glow-teal"
                    >
                      <Play className="w-8 h-8 text-primary fill-primary" />
                    </button>
                    <p className="text-xs text-muted-foreground">Tap to watch ad</p>
                  </div>
                )}
                {adPlaying && (
                  <div className="rounded-xl bg-muted/50 py-6 flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                      <Volume2 className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-sm font-medium text-foreground">Playing Ad...</p>
                    <div className="w-3/4 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${adProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{Math.round(adProgress)}%</p>
                  </div>
                )}
                {adFinished && (
                  <div className="rounded-xl bg-muted/50 py-6 flex flex-col items-center gap-3">
                    <p className="text-sm text-foreground font-medium">✅ Ad complete! Thank you.</p>
                    <button
                      onClick={() => { setAdFinished(false); setAdProgress(0); }}
                      className="text-xs text-primary font-medium hover:underline"
                    >
                      Watch another
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>

        <BottomNav />
      </div>
      
      {/* Premium Modal */}
      <PremiumModal open={showPremiumModal} onOpenChange={setShowPremiumModal} />
      
      {/* History Modal */}
      <CombinedHistoryModal open={showHistoryModal} onOpenChange={setShowHistoryModal} />

      {/* Speak With Modal (Premium) */}
      <SpeakWithModal open={showSpeakWith} onOpenChange={setShowSpeakWith} />

      {/* Levels Modal */}
      <LevelsModal
        open={showLevelsModal}
        onOpenChange={setShowLevelsModal}
        currentLevel={profile?.level ?? 1}
        currentXp={profile?.xp ?? 0}
      />

      {/* Books & Courses Modal */}
      <Dialog open={showBooksModal} onOpenChange={setShowBooksModal}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">Recommended Books & Courses</DialogTitle>
          </DialogHeader>
          
          {/* Category Tabs */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setBooksTab("books")}
              className={cn(
                "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all",
                booksTab === "books"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              <BookOpen className="w-3.5 h-3.5 inline mr-1.5" />
              Books
            </button>
            <button
              onClick={() => setBooksTab("courses")}
              className={cn(
                "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all",
                booksTab === "courses"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              <GraduationCap className="w-3.5 h-3.5 inline mr-1.5" />
              Courses
            </button>
          </div>

          {/* Content */}
          <div className="space-y-2 overflow-y-auto flex-1 pr-1">
            {(booksTab === "books" ? sampleBooks : sampleCourses).map((item, i) => (
              <a
                key={i}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  {booksTab === "books" ? (
                    <BookOpen className="w-5 h-5 text-primary" />
                  ) : (
                    <GraduationCap className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.author} · {item.category}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
              </a>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>;
}
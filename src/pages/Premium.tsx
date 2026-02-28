import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Crown, Sparkles, ArrowLeft, AlertTriangle, CreditCard } from "lucide-react";
import premiumHero from "@/assets/premium-hero.png";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useProfile } from "@/hooks/useProfile";
import { PremiumCelebration } from "@/components/PremiumCelebration";
import { useToast } from "@/hooks/use-toast";
import { getRegionForCountry } from "@/lib/countryRegions";
import { ReportPaymentModal } from "@/components/ReportPaymentModal";

interface Plan {
  id: string;
  duration: string;
  price: number;
  currency: string;
}

const durationLabels: Record<string, string> = {
  "1_day": "1 Day",
  "1_week": "1 Week",
  "1_month": "1 Month",
  "6_month": "6 Months",
  "1_year": "1 Year"
};

const premiumFeatures = [
"Gender filter (Female/Male)",
"No advertisements",
"Book recommendations",
"Restrict your talent visibility",
"Priority matching",
"Exclusive badges",
"Choose speaker level (1-15)"];


// Bonus coins per plan duration
const bonusCoinsMap: Record<string, number> = {
  "1_day": 10,
  "1_week": 25,
  "1_month": 50,
  "6_month": 150,
  "1_year": 300
};

export default function Premium() {
  const navigate = useNavigate();
  const { profile, updateProfile } = useProfile();
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const userRegion = useMemo(() => {
    if (profile?.country) return getRegionForCountry(profile.country);
    return "INDIA";
  }, [profile?.country]);

  const isIndiaRegion = userRegion === "INDIA";

  useEffect(() => {
    const fetchPlans = async () => {
      const { data, error } = await supabase.
      from("plans").
      select("*").
      eq("region", userRegion).
      order("price", { ascending: false });

      if (!error && data) {
        setPlans(data);
        const sixMonth = data.find((p) => p.duration === "6_month");
        if (sixMonth) setSelectedPlan(sixMonth.id);
      }
      setLoading(false);
    };
    fetchPlans();
  }, [userRegion]);

  const formatPrice = (price: number, currency: string) => {
    if (currency === "INR") return `₹${price.toLocaleString()}`;
    return `$${price.toFixed(2)}`;
  };

  const getWeeklyPrice = (price: number, duration: string) => {
    const weeks: Record<string, number> = {
      "1_day": 1 / 7, "1_week": 1, "1_month": 4, "6_month": 26, "1_year": 52
    };
    return Math.round(price / weeks[duration]);
  };

  const getSavingsPercent = (duration: string) => {
    const savings: Record<string, number> = { "6_month": 83, "1_month": 60, "1_week": 0 };
    return savings[duration] || 0;
  };

  const handlePurchase = async () => {
    if (!selectedPlan || !profile?.id || purchasing) return;
    const plan = plans.find((p) => p.id === selectedPlan);
    if (!plan) return;

    setPurchasing(true);

    // Payment gateway routing placeholder
    if (isIndiaRegion) {
      // RAZORPAY PLACEHOLDER — In production, open Razorpay checkout
      toast({
        title: "🏦 Razorpay Gateway",
        description: "Razorpay payment flow will open here. Simulating success..."
      });
    } else {
      // STRIPE PLACEHOLDER — In production, redirect to Stripe Checkout
      toast({
        title: "💳 Stripe Gateway",
        description: "Stripe checkout will open here. Simulating success..."
      });
    }

    // Simulate 1.5s gateway processing
    await new Promise((r) => setTimeout(r, 1500));

    // Process via DB function (webhook simulation)
    const bonusCoins = bonusCoinsMap[plan.duration] || 50;
    const { data, error } = await supabase.rpc("process_premium_purchase", {
      p_user_id: profile.id,
      p_duration: plan.duration,
      p_bonus_coins: bonusCoins
    });

    if (error) {
      toast({ title: "Payment processing failed", description: error.message, variant: "destructive" });
      setPurchasing(false);
      return;
    }

    const result = data as any;
    if (result?.success) {
      // Sync local profile
      await updateProfile({
        is_premium: true,
        premium_expires_at: result.expires_at,
        coins: (profile.coins ?? 0) + bonusCoins,
        badges: [...(profile?.badges || []), "premium"].filter((b, i, a) => a.indexOf(b) === i)
      });
      setShowCelebration(true);
    } else {
      toast({ title: "Failed to activate premium", variant: "destructive" });
    }
    setPurchasing(false);
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-b from-primary/20 via-primary/10 to-background overflow-hidden flex-shrink-0">
        <button onClick={() => navigate(-1)} className="absolute top-3 left-3 p-2 rounded-full bg-background/60 backdrop-blur-sm hover:bg-background/80 transition-colors safe-top z-10">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex flex-col items-center pt-3 pb-2">
          <img src={premiumHero} alt="Premium" className="w-40 h-40 object-contain" />
          <div className="text-center px-4">
            <h1 className="text-xl font-bold text-foreground mb-0.5">Serious learners choose</h1>
            <span className="text-2xl font-bold text-primary premium-shimmer">Premium 👑</span>
          </div>
        </div>
        <button className="absolute top-3 right-3 text-primary text-xs glass-button px-2 py-1 rounded-full">FAQ</button>
      </div>

      <main className="px-3 flex-1 flex flex-col pb-16 overflow-y-auto">
        {/* Payment Gateway Indicator */}
        <div className="mb-2 flex items-center gap-2">
          





          <button
            onClick={() => setShowReportModal(true)}
            className="inline-flex items-center gap-1 glass-button px-2 py-1 rounded-full hover:bg-destructive/10 transition-colors">

            <AlertTriangle className="w-3 h-3 text-destructive" />
            <span className="text-[10px] text-destructive">Report Issue</span>
          </button>
        </div>

        {/* One-Time Deal */}
        <div className="mb-2">
          <button className="inline-flex items-center gap-1.5 glass-button px-3 py-1 rounded-full hover:bg-muted transition-colors">
            <Sparkles className="w-3 h-3 text-accent" />
            <span className="text-xs text-foreground">
              Try  {isIndiaRegion ? "₹49" : "$0.99"} ( 1 Day )
            </span>
          </button>
        </div>

        {/* Plan Selection */}
        <div className="mb-2">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-base font-semibold text-foreground">Choose your plan</h2>
            <span className="px-1.5 py-0.5 bg-muted text-muted-foreground text-[10px] rounded-full">Auto-renew</span>
          </div>

          <div className="space-y-1.5">
            {plans.
            filter((p) => ["6_month", "1_month", "1_week"].includes(p.duration)).
            map((plan) => {
              const isSelected = selectedPlan === plan.id;
              const savings = getSavingsPercent(plan.duration);
              const bonus = bonusCoinsMap[plan.duration] || 50;

              return (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={cn(
                    "w-full p-2.5 rounded-xl border-2 transition-all text-left relative",
                    isSelected ? "border-primary bg-primary/10" : "border-border bg-card"
                  )}>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                        "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                        isSelected ? "border-primary bg-primary" : "border-muted-foreground"
                      )}>
                          {isSelected && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                        </div>
                        <div>
                          <span className="text-sm text-foreground font-medium">
                            {durationLabels[plan.duration]}
                          </span>
                          {savings > 0 &&
                        <span className="text-primary text-[10px] ml-1.5">Save {savings}%</span>
                        }
                          <span className="text-accent text-[10px] ml-1.5">+{bonus} 🪙</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm text-foreground font-bold">
                          {formatPrice(plan.price, plan.currency)}
                        </span>
                        {plan.duration !== "1_week" &&
                      <span className="text-muted-foreground text-[10px] ml-1">
                            ({formatPrice(getWeeklyPrice(plan.price, plan.duration), plan.currency)}/week)
                          </span>
                      }
                      </div>
                    </div>
                  </button>);

            })}
          </div>
        </div>

        {/* Continue Button */}
        <Button
          onClick={handlePurchase}
          disabled={!selectedPlan || purchasing}
          className="w-full py-4 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 glow-teal mb-2">

          {purchasing ?
          <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              Processing...
            </div> :

          <>
              <Crown className="w-5 h-5 mr-2" />
              {isIndiaRegion ? "PAY WITH RAZORPAY" : "PAY WITH STRIPE"}
            </>
          }
        </Button>

        {/* Premium Features List */}
        <div className="glass-card p-2 px-3 mt-3">
          <h3 className="text-[10px] font-semibold text-foreground mb-1">Premium Features</h3>
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
            {premiumFeatures.map((feature, index) =>
            <div key={index} className="flex items-start gap-1">
                <div className="w-3 h-3 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-px">
                  <Check className="w-1.5 h-1.5 text-primary" />
                </div>
                <span className="text-[9px] leading-tight text-muted-foreground">{feature}</span>
              </div>
            )}
          </div>
        </div>

        {/* Gift Coins Notice */}
        <div className="glass-card p-2 px-3 mt-2 border-accent/30">
          <p className="text-[10px] text-accent font-medium text-center">
            🎁 Every Premium purchase includes FREE Gift Coins! Coins cannot be purchased separately.
          </p>
        </div>

        {/* T&C */}
        <p className="text-center text-muted-foreground text-[10px] mt-4 px-4">
          Subscription will auto-renew. Cancel anytime from your account settings. By continuing, you agree to our Terms & Conditions.
        </p>
      </main>

      <BottomNav />
      <PremiumCelebration
        show={showCelebration}
        onComplete={() => {
          setShowCelebration(false);
          const plan = plans.find((p) => p.id === selectedPlan);
          const bonus = plan ? bonusCoinsMap[plan.duration] || 50 : 50;
          toast({
            title: "Welcome to Premium! 👑",
            description: `Enjoy all premium features + ${bonus} bonus coins! 🪙`
          });
          navigate("/");
        }} />

      <ReportPaymentModal open={showReportModal} onOpenChange={setShowReportModal} />
    </div>);

}
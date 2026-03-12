import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Crown, Sparkles, ArrowLeft, AlertTriangle } from "lucide-react";
import premiumHero from "@/assets/premium-hero.png";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PremiumCelebration } from "@/components/PremiumCelebration";
import { useToast } from "@/hooks/use-toast";
import { ReportPaymentModal } from "@/components/ReportPaymentModal";

interface PlanItem {
  id: string;
  duration: string;
  label: string;
  price: string;
  weeklyPrice?: string;
  savingsPercent: number;
  bonusCoins: number;
  autoRenew: boolean;
}

// Mock data — RevenueCat SDK will replace these with real localized prices
const mockPlans: PlanItem[] = [
  { id: "plan_1y", duration: "1_year", label: "1 Year", price: "₹2,999", weeklyPrice: "₹58/week", savingsPercent: 90, bonusCoins: 1000, autoRenew: true },
  { id: "plan_6m", duration: "6_month", label: "6 Months", price: "₹1,999", weeklyPrice: "₹77/week", savingsPercent: 83, bonusCoins: 500, autoRenew: true },
  { id: "plan_1m", duration: "1_month", label: "1 Month", price: "₹399", weeklyPrice: "₹100/week", savingsPercent: 60, bonusCoins: 250, autoRenew: true },
  { id: "plan_1w", duration: "1_week", label: "1 Week", price: "₹199", savingsPercent: 0, bonusCoins: 100, autoRenew: true },
];

const oneDayPlan: PlanItem = {
  id: "plan_1d", duration: "1_day", label: "1 Day", price: "₹49", savingsPercent: 0, bonusCoins: 50, autoRenew: false,
};

const premiumFeatures = [
  "Gender filter (Female/Male)",
  "No advertisements",
  "Book recommendations",
  "Restrict your talent visibility",
  "Priority matching",
  "Exclusive badges",
  "Choose speaker level (1-15)",
];

export default function Premium() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [plans] = useState<PlanItem[]>(mockPlans);
  const [dayPlan] = useState<PlanItem>(oneDayPlan);
  const [selectedPlan, setSelectedPlan] = useState<string>("plan_1y");
  const [purchasing, setPurchasing] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const handleIAPCheckout = (plan: PlanItem) => {
    if (purchasing) return;
    setPurchasing(true);
    console.log("Initiating RevenueCat IAP for:", plan);
    // RevenueCat SDK will handle the exact local currency display and payment processing here later.
    toast({
      title: "IAP Checkout",
      description: `RevenueCat will process: ${plan.label} (${plan.price})`,
    });
    setTimeout(() => setPurchasing(false), 1500);
  };

  const selected = plans.find((p) => p.id === selectedPlan) || dayPlan;

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Hero */}
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
      </div>

      <main className="px-3 flex-1 flex flex-col pb-16 overflow-y-auto">
        {/* One-Time 1-Day Offer */}
        <div className="mb-2">
          <button
            onClick={() => setSelectedPlan(dayPlan.id)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full transition-colors border",
              selectedPlan === dayPlan.id
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-foreground hover:bg-muted"
            )}
          >
            <Sparkles className="w-3 h-3 text-accent" />
            <span className="text-xs">
              Try{"\u00A0\u00A0\u00A0"}{dayPlan.price} ( 1 Day — One-time )
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
            {plans.map((plan) => {
              const isSelected = selectedPlan === plan.id;
              return (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={cn(
                    "w-full p-2.5 rounded-xl border-2 transition-all text-left relative",
                    isSelected ? "border-primary bg-primary/10" : "border-border bg-card"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                        isSelected ? "border-primary bg-primary" : "border-muted-foreground"
                      )}>
                        {isSelected && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                      </div>
                      <div>
                        <span className="text-sm text-foreground font-medium">{plan.label}</span>
                        {plan.savingsPercent > 0 && (
                          <span className="bg-primary/15 text-primary text-[10px] ml-1.5 px-1.5 py-0.5 rounded-full font-semibold">
                            Save {plan.savingsPercent}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-foreground font-bold">{plan.price}</span>
                      {plan.weeklyPrice && (
                        <span className="text-muted-foreground text-[10px] ml-1">({plan.weeklyPrice})</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Continue Button */}
        <Button
          onClick={() => handleIAPCheckout(selected)}
          disabled={purchasing}
          className="w-full py-4 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 glow-teal mb-2"
        >
          {purchasing ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              Processing...
            </div>
          ) : (
            <>
              <Crown className="w-5 h-5 mr-2" />
              Continue
            </>
          )}
        </Button>

        {/* Features */}
        <div className="glass-card p-2 px-3 mt-3">
          <h3 className="text-[10px] font-semibold text-foreground mb-1">Premium Features</h3>
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
            {premiumFeatures.map((feature, i) => (
              <div key={i} className="flex items-start gap-1">
                <div className="w-3 h-3 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-px">
                  <Check className="w-1.5 h-1.5 text-primary" />
                </div>
                <span className="text-[9px] leading-tight text-muted-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Gift Coins Notice */}
        <div className="glass-card p-2 px-3 mt-2 border-accent/30">
          <p className="text-[10px] text-accent font-medium text-center">
            🎁 Every Premium purchase includes FREE Gift Coins! Coins cannot be purchased separately.
          </p>
        </div>

        {/* Report Issue */}
        <div className="flex justify-center mt-4">
          <button
            onClick={() => setShowReportModal(true)}
            className="inline-flex items-center gap-1 glass-button px-2 py-1 rounded-full hover:bg-destructive/10 transition-colors"
          >
            <AlertTriangle className="w-3 h-3 text-destructive" />
            <span className="text-[10px] text-destructive">Report Issue</span>
          </button>
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
          navigate("/");
        }}
      />
      <ReportPaymentModal open={showReportModal} onOpenChange={setShowReportModal} />
    </div>
  );
}

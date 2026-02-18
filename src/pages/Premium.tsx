import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Crown, Sparkles, ArrowLeft } from "lucide-react";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

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


export default function Premium() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      // Default to INDIA region for demo
      const { data, error } = await supabase.
      from("plans").
      select("*").
      eq("region", "INDIA").
      order("price", { ascending: false });

      if (!error && data) {
        setPlans(data);
        // Select the 6-month plan by default (best value)
        const sixMonth = data.find((p) => p.duration === "6_month");
        if (sixMonth) setSelectedPlan(sixMonth.id);
      }
      setLoading(false);
    };

    fetchPlans();
  }, []);

  const formatPrice = (price: number, currency: string) => {
    if (currency === "INR") {
      return `₹${price.toLocaleString()}`;
    }
    return `$${price.toFixed(2)}`;
  };

  const getWeeklyPrice = (price: number, duration: string) => {
    const weeks: Record<string, number> = {
      "1_day": 1 / 7,
      "1_week": 1,
      "1_month": 4,
      "6_month": 26,
      "1_year": 52
    };
    return Math.round(price / weeks[duration]);
  };

  const getSavingsPercent = (duration: string) => {
    const savings: Record<string, number> = {
      "6_month": 83,
      "1_month": 60,
      "1_week": 0
    };
    return savings[duration] || 0;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Section - Compact */}
      <div className="relative h-56 bg-gradient-to-b from-primary/20 via-primary/10 to-background overflow-hidden">
        <button onClick={() => navigate(-1)} className="absolute top-3 left-3 p-2 rounded-full bg-background/60 backdrop-blur-sm hover:bg-background/80 transition-colors safe-top z-10">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-4">
            {/* People Image Placeholder */}
            










            <h1 className="text-xl font-bold text-foreground mb-1">
              Serious learners choose
            </h1>
            <span className="text-2xl font-bold text-primary premium-shimmer">Premium 👑</span>
          </div>
        </div>
        <button className="absolute top-3 right-3 text-primary text-xs glass-button px-2 py-1 rounded-full">
          FAQ
        </button>
      </div>

      <main className="px-3 -mt-3">
        {/* One-Time Deal - Small Left-Aligned Chip */}
        <div className="mb-3">
          <button className="inline-flex items-center gap-1.5 glass-button px-3 py-1.5 rounded-full hover:bg-muted transition-colors">
            <Sparkles className="w-3 h-3 text-accent" />
            <span className="text-xs text-foreground">Try ₹49 ( 1 Day )</span>
          </button>
        </div>

        {/* Plan Selection */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-base font-semibold text-foreground">
              Choose your plan
            </h2>
            <span className="px-1.5 py-0.5 bg-muted text-muted-foreground text-[10px] rounded-full">
              Auto-renew
            </span>
          </div>

          <div className="space-y-2">
            {plans.
            filter((p) =>
            ["6_month", "1_month", "1_week"].includes(p.duration)
            ).
            map((plan) => {
              const isSelected = selectedPlan === plan.id;
              const savings = getSavingsPercent(plan.duration);

              return (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={cn(
                    "w-full p-3 rounded-xl border-2 transition-all text-left relative",
                    isSelected ?
                    "border-primary bg-primary/10" :
                    "border-border bg-card"
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
                          {/* Subtle savings inside the bar */}
                          {savings > 0 &&
                        <span className="text-primary text-[10px] ml-1.5">
                              Save {savings}%
                            </span>
                        }
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
        <Button className="w-full py-5 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 glow-teal">
          CONTINUE
        </Button>

        {/* Premium Features List - At bottom, compact */}
        <div className="glass-card p-2.5 px-3 mt-3">
          <h3 className="text-[10px] font-semibold text-foreground mb-1.5">Premium Features</h3>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1">
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

        {/* T&C */}
        <p className="text-center text-muted-foreground text-[10px] mt-3 px-4">
          Subscription will auto-renew. Cancel anytime from your account settings. By continuing, you agree to our Terms & Conditions.
        </p>
      </main>

      <BottomNav />
    </div>);

}
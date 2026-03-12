import { useState } from "react";
import { Crown, Check, Sparkles, Gift } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PremiumModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface MockPlan {
  id: string;
  duration: string;
  label: string;
  price: number;
  currency: string;
  symbol: string;
  bonusCoins: number;
  savings: number;
}

const indiaMockPlans: MockPlan[] = [
  { id: "in_1y", duration: "1_year", label: "1 Year", price: 2999, currency: "INR", symbol: "₹", bonusCoins: 1000, savings: 90 },
  { id: "in_6m", duration: "6_month", label: "6 Months", price: 1999, currency: "INR", symbol: "₹", bonusCoins: 500, savings: 83 },
  { id: "in_1m", duration: "1_month", label: "1 Month", price: 399, currency: "INR", symbol: "₹", bonusCoins: 250, savings: 60 },
  { id: "in_1w", duration: "1_week", label: "1 Week", price: 199, currency: "INR", symbol: "₹", bonusCoins: 100, savings: 0 },
  { id: "in_1d", duration: "1_day", label: "1 Day", price: 49, currency: "INR", symbol: "₹", bonusCoins: 50, savings: 0 },
];

const globalMockPlans: MockPlan[] = [
  { id: "gl_1y", duration: "1_year", label: "1 Year", price: 59.99, currency: "USD", symbol: "$", bonusCoins: 1000, savings: 90 },
  { id: "gl_6m", duration: "6_month", label: "6 Months", price: 39.99, currency: "USD", symbol: "$", bonusCoins: 500, savings: 83 },
  { id: "gl_1m", duration: "1_month", label: "1 Month", price: 7.99, currency: "USD", symbol: "$", bonusCoins: 250, savings: 60 },
  { id: "gl_1w", duration: "1_week", label: "1 Week", price: 3.99, currency: "USD", symbol: "$", bonusCoins: 100, savings: 0 },
  { id: "gl_1d", duration: "1_day", label: "1 Day", price: 0.99, currency: "USD", symbol: "$", bonusCoins: 50, savings: 0 },
];

const formatPrice = (symbol: string, price: number) => {
  if (symbol === "₹") return `${symbol}${price.toLocaleString("en-IN")}`;
  return `${symbol}${price.toFixed(2)}`;
};

const getWeeklyPrice = (symbol: string, price: number, duration: string) => {
  const weeks: Record<string, number> = {
    "1_day": 1 / 7, "1_week": 1, "1_month": 4, "6_month": 26, "1_year": 52,
  };
  const weekly = price / (weeks[duration] || 1);
  if (symbol === "₹") return `${symbol}${Math.round(weekly).toLocaleString("en-IN")}`;
  return `${symbol}${weekly.toFixed(2)}`;
};

export function PremiumModal({ open, onOpenChange }: PremiumModalProps) {
  const navigate = useNavigate();
  const [region, setRegion] = useState<"INDIA" | "GLOBAL">("INDIA");
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const plans = region === "INDIA" ? indiaMockPlans : globalMockPlans;

  // Auto-select yearly plan when region changes
  const activePlan = selectedPlan && plans.find(p => p.id === selectedPlan)
    ? selectedPlan
    : plans[0].id;

  const handleCheckout = (planId: string) => {
    console.log("[PremiumModal] handleCheckout called with planId:", planId);
    // Placeholder — will be wired to Razorpay / Stripe
    onOpenChange(false);
    navigate("/premium");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border w-[calc(100%-2rem)] max-w-sm mx-auto max-h-[90vh] overflow-y-auto p-4">
        <DialogHeader className="text-center pb-1">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-2 glow-teal">
            <Crown className="w-7 h-7 text-primary-foreground" />
          </div>
          <DialogTitle className="text-lg font-bold text-foreground tracking-wide">
            Unlock Premium 👑
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs mt-0.5">
            Choose your plan and start practicing with the best.
          </DialogDescription>
        </DialogHeader>

        {/* Dev Mode Toggle */}
        {import.meta.env.DEV && (
          <div className="flex items-center justify-center gap-2 py-1.5">
            <span className="text-[10px] text-muted-foreground font-mono">DEV</span>
            <button
              onClick={() => {
                setRegion(r => r === "INDIA" ? "GLOBAL" : "INDIA");
                setSelectedPlan(null);
              }}
              className={cn(
                "relative inline-flex h-6 w-[88px] items-center rounded-full transition-colors border border-border",
                region === "INDIA" ? "bg-primary/20" : "bg-accent/20"
              )}
            >
              <span
                className={cn(
                  "absolute h-5 w-[42px] rounded-full bg-primary transition-transform text-[10px] font-semibold text-primary-foreground flex items-center justify-center",
                  region === "INDIA" ? "translate-x-0.5" : "translate-x-[44px]"
                )}
              >
                {region === "INDIA" ? "₹ INR" : "$ USD"}
              </span>
              <span className="w-full flex justify-between px-2.5 text-[9px] text-muted-foreground font-medium">
                <span>INR</span>
                <span>USD</span>
              </span>
            </button>
          </div>
        )}

        {/* Plan Cards */}
        <div className="space-y-1.5 mt-1">
          {plans.map((plan) => {
            const isSelected = activePlan === plan.id;

            return (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={cn(
                  "w-full p-2.5 rounded-xl border-2 transition-all text-left relative",
                  isSelected
                    ? "border-primary bg-primary/10 shadow-[0_0_12px_hsl(var(--primary)/0.15)]"
                    : "border-border bg-card hover:border-muted-foreground/30"
                )}
              >
                {/* Best Value tag */}
                {plan.duration === "1_year" && (
                  <span className="absolute -top-2 right-3 bg-primary text-primary-foreground text-[9px] font-bold px-2 py-0.5 rounded-full">
                    BEST VALUE
                  </span>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {/* Radio indicator */}
                    <div className={cn(
                      "w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0",
                      isSelected ? "border-primary bg-primary" : "border-muted-foreground/50"
                    )}>
                      {isSelected && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                    </div>

                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm text-foreground font-semibold">{plan.label}</span>
                        {plan.savings > 0 && (
                          <span className="bg-primary/15 text-primary text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                            Save {plan.savings}%
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground mt-0.5">
                        +{plan.bonusCoins} Gift Coins 🪙
                      </span>
                    </div>
                  </div>

                  {/* Price block */}
                  <div className="text-right shrink-0 ml-2">
                    <span className="text-sm font-bold text-foreground tabular-nums">
                      {formatPrice(plan.symbol, plan.price)}
                    </span>
                    {!["1_week", "1_day"].includes(plan.duration) && (
                      <div className="text-[9px] text-muted-foreground">
                        {getWeeklyPrice(plan.symbol, plan.price, plan.duration)}/wk
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Continue Button */}
        <Button
          onClick={() => handleCheckout(activePlan)}
          className="w-full mt-3 py-5 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-base rounded-xl glow-teal"
        >
          <Sparkles className="w-5 h-5 mr-2" />
          Continue
        </Button>

        {/* Compliance Text */}
        <div className="mt-2 flex items-start gap-1.5 px-1">
          <Gift className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
          <p className="text-[10px] text-muted-foreground leading-tight">
            Every Premium purchase includes FREE Gift Coins! Coins cannot be purchased separately.
          </p>
        </div>

        {/* T&C */}
        <p className="text-center text-muted-foreground text-[9px] mt-1 px-2">
          Subscription auto-renews. Cancel anytime. By continuing you agree to our Terms & Conditions.
        </p>
      </DialogContent>
    </Dialog>
  );
}

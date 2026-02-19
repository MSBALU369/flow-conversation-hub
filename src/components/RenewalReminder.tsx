import { useEffect, useState } from "react";
import { Crown } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { cn } from "@/lib/utils";

/**
 * Shows a renewal reminder banner on login:
 * - 1 day before expiry for 1-week subs
 * - 2 days before expiry for 1-month subs
 * - 7 days before expiry for 6-month subs
 */
export function RenewalReminder() {
  const { profile } = useProfile();
  const [visible, setVisible] = useState(false);
  const [daysLeft, setDaysLeft] = useState(0);

  useEffect(() => {
    if (!profile?.is_premium || !profile?.premium_expires_at) return;

    const expiresAt = new Date(profile.premium_expires_at).getTime();
    const now = Date.now();
    const days = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
    setDaysLeft(days);

    // Check if already shown this session
    const shownKey = `renewal_shown_${profile.id}`;
    if (sessionStorage.getItem(shownKey)) return;

    // Determine if we should show based on subscription length heuristic
    const shouldShow =
      (days <= 1 && days > 0) || // 1-week sub: 1 day before
      (days <= 2 && days > 0) || // 1-month sub: 2 days before
      (days <= 7 && days > 0);   // 6-month sub: 1 week before

    if (shouldShow) {
      sessionStorage.setItem(shownKey, "1");
      setVisible(true);
      setTimeout(() => setVisible(false), 2000);
    }
  }, [profile?.is_premium, profile?.premium_expires_at, profile?.id]);

  if (!visible) return null;

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-[70] px-3 pt-2 safe-top transition-all duration-500",
        visible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      )}
    >
      <div className="mx-auto w-fit rounded-2xl bg-[hsl(45,100%,50%)] px-4 py-2 flex items-center gap-2 shadow-lg">
        <Crown className="w-5 h-5 text-white" fill="white" />
        <p className="text-sm font-semibold text-white">
          Premium expires in {daysLeft} day{daysLeft !== 1 ? "s" : ""} — Renew now!
        </p>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { Skeleton } from "@/components/ui/skeleton";
import { Crown, Clock, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaymentRecord {
  id: string;
  duration: string;
  bonus_coins: number;
  created_at: string;
  premium_expires_at: string | null;
}

interface PaymentHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PaymentHistoryModal({ open, onOpenChange }: PaymentHistoryModalProps) {
  const { profile } = useProfile();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !profile?.id) return;

    const fetchPayments = async () => {
      setLoading(true);

      // Fetch premium-related coin transactions as payment records
      const { data } = await supabase
        .from("coin_transactions")
        .select("*")
        .eq("receiver_id", profile.id)
        .eq("type", "premium_bonus")
        .order("created_at", { ascending: false })
        .limit(100);

      if (data && data.length > 0) {
        setPayments(data.map(t => ({
          id: t.id,
          duration: "Premium Plan",
          bonus_coins: t.amount,
          created_at: t.created_at,
          premium_expires_at: null,
        })));
      } else {
        setPayments([]);
      }
      setLoading(false);
    };
    fetchPayments();

    const channel = supabase
      .channel(`payment-history-${profile.id}`)
      .on("postgres_changes" as any, {
        event: "INSERT",
        schema: "public",
        table: "coin_transactions",
        filter: `receiver_id=eq.${profile.id}`,
      }, () => { fetchPayments(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [open, profile?.id]);

  const formatTimestamp = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
      " · " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  const totalCoinsAwarded = payments.reduce((s, p) => s + p.bonus_coins, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0 max-h-[85vh] overflow-hidden [&>button]:hidden">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div>
            <DialogTitle className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <Crown className="w-4 h-4 text-primary" />
              Payment History
            </DialogTitle>
            <p className="text-[10px] text-muted-foreground">{payments.length} premium payments</p>
          </div>
          <button onClick={() => onOpenChange(false)} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Summary */}
        <div className="flex gap-2 px-4 pb-2">
          <div className="flex-1 bg-primary/10 rounded-lg p-2.5 text-center">
            <p className="text-[10px] text-muted-foreground">Total Payments</p>
            <p className="text-lg font-bold text-primary">{payments.length}</p>
          </div>
          <div className="flex-1 bg-primary/10 rounded-lg p-2.5 text-center">
            <p className="text-[10px] text-muted-foreground">Bonus Coins</p>
            <p className="text-lg font-bold text-primary">+{totalCoinsAwarded} 🪙</p>
          </div>
        </div>

        {/* Premium status */}
        {profile?.is_premium && profile.premium_expires_at && (
          <div className="mx-4 mb-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-[10px] text-muted-foreground">Active Until</p>
            <p className="text-xs font-semibold text-primary">
              {new Date(profile.premium_expires_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>
        )}

        <ScrollArea className="px-4 pb-4 max-h-[calc(85vh-200px)]">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-10">
              <Crown className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No premium payments yet</p>
              <p className="text-[10px] text-muted-foreground mt-1">Your payment history will appear here</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {payments.map((p, idx) => (
                <div key={p.id} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-muted/30 border border-border/30">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <Crown className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground">
                      {p.duration} #{payments.length - idx}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock className="w-2.5 h-2.5 text-muted-foreground" />
                      <span className="text-[9px] text-muted-foreground">
                        {formatTimestamp(p.created_at)}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-primary shrink-0">
                    +{p.bonus_coins} 🪙
                  </span>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

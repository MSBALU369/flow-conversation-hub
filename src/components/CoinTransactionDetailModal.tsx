import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Crown, Play, Gift, Zap, Send, ArrowDownLeft, X, PhoneOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Transaction {
  id: string;
  sender_id: string;
  receiver_id: string;
  amount: number;
  type: string;
  status: string;
  created_at: string;
  sender_name?: string;
  receiver_name?: string;
}

const typeBadges: Record<string, { label: string; icon: typeof Crown; color: string }> = {
  premium_bonus: { label: "Premium Gift", icon: Crown, color: "bg-primary/20 text-primary" },
  ad_reward: { label: "Ad Reward", icon: Play, color: "bg-accent/20 text-accent" },
  send: { label: "Transfer", icon: Send, color: "bg-muted text-muted-foreground" },
  request: { label: "Request", icon: ArrowDownLeft, color: "bg-muted text-muted-foreground" },
  daily_login: { label: "Daily Login", icon: Gift, color: "bg-primary/20 text-primary" },
  energy_recharge: { label: "Energy", icon: Zap, color: "bg-destructive/20 text-destructive" },
  early_end_penalty: { label: "Early End", icon: PhoneOff, color: "bg-destructive/20 text-destructive" },
};

interface CoinTransactionDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export function CoinTransactionDetailModal({ open, onOpenChange, userId }: CoinTransactionDetailModalProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !userId) return;

    const fetchHistory = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("coin_transactions")
        .select("*")
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order("created_at", { ascending: false })
        .limit(100);

      if (data && data.length > 0) {
        const userIds = [...new Set(data.flatMap(t => [t.sender_id, t.receiver_id]))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username")
          .in("id", userIds);
        const nameMap = new Map((profiles || []).map(p => [p.id, p.username || "User"]));
        setTransactions(data.map(t => ({
          ...t,
          sender_name: nameMap.get(t.sender_id) || "System",
          receiver_name: nameMap.get(t.receiver_id) || "User",
        })));
      } else {
        setTransactions([]);
      }
      setLoading(false);
    };
    fetchHistory();

    const channel = supabase
      .channel(`coin-detail-${userId}`)
      .on("postgres_changes" as any, {
        event: "*",
        schema: "public",
        table: "coin_transactions",
      }, () => { fetchHistory(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [open, userId]);

  const formatTimestamp = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
      " · " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  const getLabel = (t: Transaction) => {
    const isSender = t.sender_id === userId;
    const isSelf = t.sender_id === t.receiver_id;
    if (t.type === "premium_bonus") return "Premium Gift Coins 🎁";
    if (t.type === "ad_reward") return "Ad Reward 🎬";
    if (t.type === "daily_login") return "Daily Login Bonus";
    if (t.type === "energy_recharge") return "Energy Recharge ⚡";
    if (t.type === "early_end_penalty") return "Ended call before 30s ☎️";
    if (t.type === "request") return isSender ? `Requested from ${t.receiver_name}` : `${t.sender_name} requested`;
    if (isSender && !isSelf) return `Sent to ${t.receiver_name}`;
    return `Received from ${t.sender_name}`;
  };

  const earned = transactions.filter(t =>
    (t.receiver_id === userId && t.sender_id !== userId) ||
    (t.sender_id === userId && t.receiver_id === userId && ["premium_bonus", "ad_reward", "daily_login"].includes(t.type))
  ).reduce((s, t) => s + t.amount, 0);

  const spent = transactions.filter(t =>
    (t.sender_id === userId && t.receiver_id !== userId && t.type === "send") ||
    (t.sender_id === userId && ["energy_recharge", "early_end_penalty"].includes(t.type))
  ).reduce((s, t) => s + t.amount, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0 max-h-[85vh] overflow-hidden [&>button]:hidden">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div>
            <DialogTitle className="text-sm font-bold text-foreground">Coin Transactions</DialogTitle>
            <p className="text-[10px] text-muted-foreground">{transactions.length} total transactions</p>
          </div>
          <button onClick={() => onOpenChange(false)} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Summary */}
        <div className="flex gap-2 px-4 pb-2">
          <div className="flex-1 bg-primary/10 rounded-lg p-2 text-center">
            <p className="text-[10px] text-muted-foreground">Earned</p>
            <p className="text-sm font-bold text-primary">+{earned}</p>
          </div>
          <div className="flex-1 bg-destructive/10 rounded-lg p-2 text-center">
            <p className="text-[10px] text-muted-foreground">Spent</p>
            <p className="text-sm font-bold text-destructive">-{spent}</p>
          </div>
        </div>

        <ScrollArea className="px-4 pb-4 max-h-[calc(85vh-140px)]">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-10">
              <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No transactions yet</p>
              <p className="text-[10px] text-muted-foreground mt-1">Coin activity will appear here</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {transactions.map(t => {
                const isSender = t.sender_id === userId;
                const isSelf = t.sender_id === t.receiver_id;
                const isSpent = (isSender && t.type === "send" && !isSelf) || ["energy_recharge", "early_end_penalty"].includes(t.type);
                const badge = typeBadges[t.type] || typeBadges.send;
                const BadgeIcon = badge.icon;

                return (
                  <div key={t.id} className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl bg-muted/30 border border-border/30">
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", badge.color)}>
                      <BadgeIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{getLabel(t)}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className={cn("text-[7px] px-1.5 py-0.5 rounded-full font-medium", badge.color)}>
                          {badge.label}
                        </span>
                        <span className="text-[9px] text-muted-foreground truncate">
                          {formatTimestamp(t.created_at)}
                        </span>
                      </div>
                      {t.status !== "completed" && (
                        <span className="text-[8px] text-yellow-500 font-medium">{t.status}</span>
                      )}
                    </div>
                    <span className={cn("text-sm font-bold shrink-0", isSpent ? "text-destructive" : "text-primary")}>
                      {isSpent ? "-" : "+"}{t.amount}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

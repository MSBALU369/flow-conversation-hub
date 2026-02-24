import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Clock, ArrowUp, ArrowDown, Crown, Play, Gift, Zap, Send, ArrowDownLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { CoinTransactionDetailModal } from "./CoinTransactionDetailModal";

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
};

export function CoinTransactionLog({ userId }: { userId: string }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const fetchHistory = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("coin_transactions")
        .select("*")
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order("created_at", { ascending: false })
        .limit(50);

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

    // Realtime sync
    const channel = supabase
      .channel(`coin-log-${userId}`)
      .on("postgres_changes" as any, {
        event: "*",
        schema: "public",
        table: "coin_transactions",
      }, () => { fetchHistory(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  if (loading) {
    return (
      <div className="space-y-2">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Transaction History</p>
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <>
        <button
          onClick={() => setDetailOpen(true)}
          className="w-full text-center py-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer group"
        >
          <Clock className="w-6 h-6 text-muted-foreground mx-auto mb-1 group-hover:text-primary transition-colors" />
          <p className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">No transactions yet</p>
          <p className="text-[9px] text-muted-foreground mt-0.5">Tap to view details</p>
        </button>
        <CoinTransactionDetailModal open={detailOpen} onOpenChange={setDetailOpen} userId={userId} />
      </>
    );
  }

  return (
    <>
      <button onClick={() => setDetailOpen(true)} className="w-full text-left group cursor-pointer">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Transaction History</p>
          <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {transactions.map(t => {
            const isSender = t.sender_id === userId;
            const isSelfTransaction = t.sender_id === t.receiver_id;
            const isSpent = isSender && t.type === "send" && !isSelfTransaction;
            const badge = typeBadges[t.type] || typeBadges.send;
            const BadgeIcon = badge.icon;

            const label = (() => {
              if (t.type === "premium_bonus") return "Premium Gift 🎁";
              if (t.type === "ad_reward") return "Ad Reward 🎬";
              if (t.type === "daily_login") return "Daily Login";
              if (t.type === "energy_recharge") return "Energy Recharge";
              if (t.type === "request") return isSender ? `Requested from ${t.receiver_name}` : `${t.sender_name} requested`;
              return isSpent ? `Sent to ${t.receiver_name}` : `From ${t.sender_name}`;
            })();

            return (
              <div key={t.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-muted/30">
                <div className={cn("w-6 h-6 rounded-full flex items-center justify-center", badge.color)}>
                  <BadgeIcon className="w-3 h-3" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-foreground truncate">{label}</p>
                  <div className="flex items-center gap-1">
                    <span className={cn("text-[7px] px-1 py-0.5 rounded-full font-medium", badge.color)}>
                      {badge.label}
                    </span>
                    <span className="text-[9px] text-muted-foreground">
                      {new Date(t.created_at).toLocaleDateString()} · {t.status}
                    </span>
                  </div>
                </div>
                <span className={cn("text-xs font-bold", isSpent ? "text-destructive" : "text-primary")}>
                  {isSpent ? "-" : "+"}{t.amount}
                </span>
              </div>
            );
          })}
        </div>
      </button>
      <CoinTransactionDetailModal open={detailOpen} onOpenChange={setDetailOpen} userId={userId} />
    </>
  );
}

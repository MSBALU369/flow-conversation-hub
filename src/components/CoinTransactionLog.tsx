import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Clock, ArrowUp, ArrowDown, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

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

export function CoinTransactionLog({ userId }: { userId: string }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

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
          sender_name: nameMap.get(t.sender_id) || "User",
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
      <div className="text-center py-4">
        <Clock className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
        <p className="text-xs text-muted-foreground">No transactions yet</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Transaction History</p>
      <div className="space-y-1 max-h-40 overflow-y-auto">
        {transactions.map(t => {
          const isSender = t.sender_id === userId;
          const isSpent = isSender && t.type === "send";
          return (
            <div key={t.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-muted/30">
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center",
                isSpent ? "bg-destructive/20" : "bg-primary/20"
              )}>
                {isSpent ? <ArrowUp className="w-3 h-3 text-destructive" /> : <ArrowDown className="w-3 h-3 text-primary" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-foreground truncate">
                  {t.type === "request"
                    ? (isSender ? `Requested from ${t.receiver_name}` : `${t.sender_name} requested`)
                    : (isSpent ? `Sent to ${t.receiver_name}` : `From ${t.sender_name}`)}
                </p>
                <p className="text-[9px] text-muted-foreground">
                  {new Date(t.created_at).toLocaleDateString()} · {t.status}
                </p>
              </div>
              <span className={cn("text-xs font-bold", isSpent ? "text-destructive" : "text-primary")}>
                {isSpent ? "-" : "+"}{t.amount}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

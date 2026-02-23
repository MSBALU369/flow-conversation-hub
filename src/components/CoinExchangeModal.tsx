import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, ArrowDownLeft, X, Clock, CheckCircle2, XCircle, Crown, Play, Coins, AlertTriangle, Gift, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ReportPaymentModal } from "@/components/ReportPaymentModal";

interface CoinExchangeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Friend {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

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

// Transaction type badge config
const typeBadges: Record<string, { label: string; icon: typeof Crown; color: string }> = {
  premium_bonus: { label: "Premium Gift", icon: Crown, color: "bg-primary/20 text-primary" },
  ad_reward: { label: "Ad Reward", icon: Play, color: "bg-accent/20 text-accent" },
  send: { label: "Transfer", icon: Send, color: "bg-muted text-muted-foreground" },
  request: { label: "Request", icon: ArrowDownLeft, color: "bg-muted text-muted-foreground" },
  daily_login: { label: "Daily Login", icon: Gift, color: "bg-primary/20 text-primary" },
  energy_recharge: { label: "Energy Recharge", icon: Zap, color: "bg-destructive/20 text-destructive" },
};

export function CoinExchangeModal({ open, onOpenChange }: CoinExchangeModalProps) {
  const { profile, updateProfile } = useProfile();
  const { toast } = useToast();
  const [tab, setTab] = useState<"send" | "history">("history");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [watchingAd, setWatchingAd] = useState(false);
  const [adProgress, setAdProgress] = useState(0);

  // Fetch friends
  useEffect(() => {
    if (!open || !profile?.id) return;
    const fetchFriends = async () => {
      const { data: following } = await supabase
        .from("friendships")
        .select("friend_id")
        .eq("user_id", profile.id)
        .eq("status", "accepted");

      if (!following || following.length === 0) { setFriends([]); return; }
      const ids = following.map(f => f.friend_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", ids);
      setFriends(profiles || []);
    };
    fetchFriends();
  }, [open, profile?.id]);

  // Fetch transaction history + realtime
  useEffect(() => {
    if (!open || !profile?.id) return;
    const fetchHistory = async () => {
      const { data } = await supabase
        .from("coin_transactions")
        .select("*")
        .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
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
    };
    fetchHistory();

    // Realtime sync
    const channel = supabase
      .channel(`coin-exchange-${profile.id}`)
      .on("postgres_changes" as any, {
        event: "*",
        schema: "public",
        table: "coin_transactions",
      }, () => { fetchHistory(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [open, profile?.id]);

  const handleSend = async () => {
    if (!selectedFriend || !profile?.id || loading) return;
    const coins = parseInt(amount);
    if (isNaN(coins) || coins <= 0) {
      toast({ title: "Invalid amount", variant: "destructive" });
      return;
    }
    if (coins > (profile.coins ?? 0)) {
      toast({ title: "Not enough coins", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("transfer_coins", {
        p_sender_id: profile.id,
        p_receiver_id: selectedFriend.id,
        p_amount: coins,
      });
      if (error) throw error;
      const result = data as any;
      if (result?.success) {
        toast({ title: `Sent ${coins} coins to ${selectedFriend.username}!` });
      } else {
        toast({ title: result?.error || "Transfer failed", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Transfer failed", description: err.message, variant: "destructive" });
    }
    setAmount("");
    setSelectedFriend(null);
    setLoading(false);
  };

  // Simulate rewarded ad — award 1 coin
  useEffect(() => {
    if (!watchingAd) return;
    const interval = setInterval(() => {
      setAdProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setWatchingAd(false);
          // Award 1 coin via DB
          if (profile?.id) {
            (async () => {
              await supabase
                .from("profiles")
                .update({ coins: (profile.coins ?? 0) + 1 })
                .eq("id", profile.id);
              // Log as ad_reward
              await supabase.from("coin_transactions").insert({
                sender_id: profile.id,
                receiver_id: profile.id,
                amount: 1,
                type: "ad_reward",
                status: "completed",
              });
              updateProfile({ coins: (profile.coins ?? 0) + 1 });
              toast({ title: "+1 Coin! 🪙", description: "Rewarded for watching ad." });
            })();
          }
          return 100;
        }
        return prev + (100 / 30);
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [watchingAd]);

  // Compute earned vs spent
  const earned = transactions
    .filter(t => t.receiver_id === profile?.id && t.sender_id !== profile?.id)
    .reduce((s, t) => s + t.amount, 0)
    + transactions
    .filter(t => t.sender_id === profile?.id && t.receiver_id === profile?.id && ["premium_bonus", "ad_reward", "daily_login"].includes(t.type))
    .reduce((s, t) => s + t.amount, 0);

  const spent = transactions
    .filter(t => t.sender_id === profile?.id && t.receiver_id !== profile?.id && t.type === "send")
    .reduce((s, t) => s + t.amount, 0)
    + transactions
    .filter(t => t.sender_id === profile?.id && t.type === "energy_recharge")
    .reduce((s, t) => s + t.amount, 0);

  const getTransactionLabel = (t: Transaction) => {
    const isSender = t.sender_id === profile?.id;
    if (t.type === "premium_bonus") return "Premium Gift Coins 🎁";
    if (t.type === "ad_reward") return "Ad Reward 🎬";
    if (t.type === "daily_login") return "Daily Login Bonus";
    if (t.type === "energy_recharge") return "Energy Recharge";
    if (t.type === "request") return isSender ? `Requested from ${t.receiver_name}` : `${t.sender_name} requested`;
    return isSender ? `Sent to ${t.receiver_name}` : `Received from ${t.sender_name}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs p-0 max-h-[85vh] overflow-hidden [&>button]:hidden">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div>
            <DialogTitle className="text-sm font-bold text-foreground">My Coins</DialogTitle>
            <p className="text-lg font-bold text-primary">{profile?.coins ?? 0} 🪙</p>
          </div>
          <button onClick={() => onOpenChange(false)} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Earned vs Spent Summary */}
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

        {/* Watch Ad for 1 Coin */}
        <div className="px-4 pb-2">
          {watchingAd ? (
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-2">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                <Play className="w-3 h-3 text-primary fill-primary" />
              </div>
              <div className="flex-1">
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${adProgress}%` }} />
                </div>
              </div>
              <span className="text-[10px] text-muted-foreground">{Math.round(adProgress)}%</span>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 text-xs border-accent/30 text-accent hover:bg-accent/10"
              onClick={() => { setWatchingAd(true); setAdProgress(0); }}
            >
              <Play className="w-3 h-3" />
              Watch Ad to earn 1 Coin
            </Button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 pb-2">
          {(["history", "send"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 py-1.5 rounded-lg text-xs font-medium transition-all",
                tab === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}
            >
              {t === "send" && <Send className="w-3 h-3 inline mr-1" />}
              {t === "history" && <Clock className="w-3 h-3 inline mr-1" />}
              {t === "history" ? "Transaction Log" : "Send Coins"}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto px-4 pb-4 max-h-[calc(85vh-220px)]">
          {tab === "send" && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">Send coins to a friend</p>
              <div className="space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Select Friend</p>
                <ScrollArea className="max-h-32">
                  <div className="space-y-1">
                    {friends.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">No friends yet. Follow someone first!</p>
                    )}
                    {friends.map(f => (
                      <button
                        key={f.id}
                        onClick={() => setSelectedFriend(f)}
                        className={cn(
                          "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors",
                          selectedFriend?.id === f.id ? "bg-primary/20 border border-primary/40" : "hover:bg-muted/50"
                        )}
                      >
                        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                          {f.avatar_url ? (
                            <img src={f.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs">{(f.username || "U")[0].toUpperCase()}</span>
                          )}
                        </div>
                        <span className="text-xs font-medium text-foreground">{f.username || "User"}</span>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Amount</p>
                <Input type="number" min={1} value={amount} onChange={e => setAmount(e.target.value)} placeholder="Enter coins" className="h-8 text-sm" />
              </div>
              <Button className="w-full" disabled={!selectedFriend || !amount || loading} onClick={handleSend}>
                <Send className="w-4 h-4 mr-1" />
                {loading ? "Processing..." : "Send Coins"}
              </Button>
            </div>
          )}

          {tab === "history" && (
            <div className="space-y-1.5">
              {transactions.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-8">No transactions yet</p>
              )}
              {transactions.map(t => {
                const isSender = t.sender_id === profile?.id;
                const isSelfTransaction = t.sender_id === t.receiver_id;
                const isSpent = isSender && t.type === "send" && !isSelfTransaction;
                const badge = typeBadges[t.type] || typeBadges.send;
                const BadgeIcon = badge.icon;

                return (
                  <div key={t.id} className="flex items-center gap-2 px-2 py-2 rounded-lg bg-muted/30">
                    <div className={cn("w-7 h-7 rounded-full flex items-center justify-center", badge.color)}>
                      <BadgeIcon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        {getTransactionLabel(t)}
                      </p>
                      <div className="flex items-center gap-1">
                        <span className={cn("text-[8px] px-1.5 py-0.5 rounded-full font-medium", badge.color)}>
                          {badge.label}
                        </span>
                        <span className="text-[9px] text-muted-foreground">
                          {new Date(t.created_at).toLocaleDateString()}
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
          )}
        </div>

        {/* Report Issue Footer */}
        <div className="px-4 pb-3 border-t border-border pt-2">
          <button
            onClick={() => setShowReportModal(true)}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
          >
            <AlertTriangle className="w-3 h-3 text-destructive" />
            <span className="text-[10px] text-destructive font-medium">Report Payment Issue</span>
          </button>
        </div>
      </DialogContent>
      <ReportPaymentModal open={showReportModal} onOpenChange={setShowReportModal} />
    </Dialog>
  );
}

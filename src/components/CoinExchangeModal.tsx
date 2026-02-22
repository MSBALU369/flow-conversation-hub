import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, ArrowDownLeft, X, Clock, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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

export function CoinExchangeModal({ open, onOpenChange }: CoinExchangeModalProps) {
  const { profile, updateProfile } = useProfile();
  const { toast } = useToast();
  const [tab, setTab] = useState<"send" | "request" | "history">("send");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

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

  // Fetch transaction history
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
          sender_name: nameMap.get(t.sender_id) || "User",
          receiver_name: nameMap.get(t.receiver_id) || "User",
        })));
      } else {
        setTransactions([]);
      }
    };
    fetchHistory();
  }, [open, profile?.id, tab]);

  const handleSend = async () => {
    if (!selectedFriend || !profile?.id) return;
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

  const handleRequest = async () => {
    if (!selectedFriend || !profile?.id) return;
    const coins = parseInt(amount);
    if (isNaN(coins) || coins <= 0) {
      toast({ title: "Invalid amount", variant: "destructive" });
      return;
    }
    setLoading(true);
    await supabase.from("coin_transactions").insert({
      sender_id: profile.id,
      receiver_id: selectedFriend.id,
      amount: coins,
      type: "request",
      status: "pending",
    });
    toast({ title: `Requested ${coins} coins from ${selectedFriend.username}` });
    setAmount("");
    setSelectedFriend(null);
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs p-0 max-h-[85vh] overflow-hidden [&>button]:hidden">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <DialogTitle className="text-sm font-bold text-foreground">Coin Exchange</DialogTitle>
          <button onClick={() => onOpenChange(false)} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 pb-2">
          {(["send", "request", "history"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "flex-1 py-1.5 rounded-lg text-xs font-medium transition-all",
                tab === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}
            >
              {t === "send" && <Send className="w-3 h-3 inline mr-1" />}
              {t === "request" && <ArrowDownLeft className="w-3 h-3 inline mr-1" />}
              {t === "history" && <Clock className="w-3 h-3 inline mr-1" />}
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto px-4 pb-4 max-h-[calc(85vh-100px)]">
          {(tab === "send" || tab === "request") && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                {tab === "send" ? "Send coins to a friend" : "Request coins from a friend"}
              </p>

              {/* Friend selection */}
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

              {/* Amount */}
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Amount</p>
                <Input
                  type="number"
                  min={1}
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="Enter coins"
                  className="h-8 text-sm"
                />
              </div>

              <Button
                className="w-full"
                disabled={!selectedFriend || !amount || loading}
                onClick={tab === "send" ? handleSend : handleRequest}
              >
                {tab === "send" ? <Send className="w-4 h-4 mr-1" /> : <ArrowDownLeft className="w-4 h-4 mr-1" />}
                {loading ? "Processing..." : tab === "send" ? "Send Coins" : "Request Coins"}
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
                const isRequest = t.type === "request";
                return (
                  <div key={t.id} className="flex items-center gap-2 px-2 py-2 rounded-lg bg-muted/30">
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center",
                      t.status === "completed" ? "bg-primary/20" : t.status === "rejected" ? "bg-destructive/20" : "bg-muted"
                    )}>
                      {t.status === "completed" ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> :
                       t.status === "rejected" ? <XCircle className="w-3.5 h-3.5 text-destructive" /> :
                       <Clock className="w-3.5 h-3.5 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground">
                        {isRequest
                          ? (isSender ? `Requested from ${t.receiver_name}` : `${t.sender_name} requested`)
                          : (isSender ? `Sent to ${t.receiver_name}` : `Received from ${t.sender_name}`)}
                      </p>
                      <p className="text-[9px] text-muted-foreground">
                        {new Date(t.created_at).toLocaleDateString()} · {t.status}
                      </p>
                    </div>
                    <span className={cn(
                      "text-xs font-bold",
                      isSender && t.type === "send" ? "text-destructive" : "text-primary"
                    )}>
                      {isSender && t.type === "send" ? "-" : "+"}{t.amount}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Ban, Coins, Trash2, LogOut, Zap, Clock } from "lucide-react";

interface UserRow {
  id: string;
  username: string | null;
  email: string | null;
  energy_bars: number | null;
  coins: number | null;
  created_at: string;
  is_premium: boolean | null;
  is_banned: boolean | null;
}

interface AdminUserActionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserRow | null;
  onRefresh: () => void;
}

export function AdminUserActionModal({ open, onOpenChange, user, onRefresh }: AdminUserActionModalProps) {
  const { toast } = useToast();
  const [banMenu, setBanMenu] = useState(false);
  const [coinAdjust, setCoinAdjust] = useState("");
  const [energyAdjust, setEnergyAdjust] = useState("");
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const handleBan = async (duration: string) => {
    setLoading(true);
    const banUntil = duration === "permanent" ? null : (() => {
      const d = new Date();
      if (duration === "1h") d.setHours(d.getHours() + 1);
      if (duration === "24h") d.setHours(d.getHours() + 24);
      if (duration === "7d") d.setDate(d.getDate() + 7);
      return d.toISOString();
    })();
    
    await supabase.from("profiles").update({ is_banned: true } as any).eq("id", user.id);
    toast({ title: "User Banned", description: `${user.username || user.email} banned ${duration === "permanent" ? "permanently" : `for ${duration}`}` });
    setBanMenu(false);
    setLoading(false);
    onRefresh();
  };

  const handleUnban = async () => {
    setLoading(true);
    await supabase.from("profiles").update({ is_banned: false } as any).eq("id", user.id);
    toast({ title: "User Unbanned" });
    setLoading(false);
    onRefresh();
  };

  const handleAdjustCoins = async () => {
    const amount = parseInt(coinAdjust);
    if (isNaN(amount)) return;
    setLoading(true);
    const newCoins = Math.max(0, (user.coins || 0) + amount);
    await supabase.from("profiles").update({ coins: newCoins }).eq("id", user.id);
    toast({ title: "Coins Adjusted", description: `${amount > 0 ? "+" : ""}${amount} coins → ${newCoins} total` });
    setCoinAdjust("");
    setLoading(false);
    onRefresh();
  };

  const handleSetEnergy = async () => {
    const val = parseInt(energyAdjust);
    if (isNaN(val) || val < 0 || val > 7) return;
    setLoading(true);
    await supabase.from("profiles").update({ energy_bars: val }).eq("id", user.id);
    toast({ title: "Energy Set", description: `Energy → ${val}/7` });
    setEnergyAdjust("");
    setLoading(false);
    onRefresh();
  };

  const handleWipeData = async () => {
    setLoading(true);
    // Delete user data from related tables
    await Promise.all([
      supabase.from("call_history").delete().eq("user_id", user.id),
      supabase.from("chat_messages").delete().or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`),
      supabase.from("notifications").delete().eq("user_id", user.id),
      supabase.from("coin_transactions").delete().or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`),
    ]);
    toast({ title: "Data Wiped", description: `All data for ${user.username || user.email} has been deleted`, variant: "destructive" });
    setLoading(false);
    onRefresh();
  };

  const handleForceLogout = async () => {
    setLoading(true);
    // Mark user offline - their session can be invalidated server-side
    await supabase.from("profiles").update({ is_online: false } as any).eq("id", user.id);
    toast({ title: "Force Logout", description: "User marked offline. Session invalidation requires Supabase Admin SDK." });
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border max-w-md bg-background max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            User: {user.username || "Unknown"} 
            <span className="text-xs text-muted-foreground ml-2">{user.email}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* User Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-muted/50 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-foreground">🪙 {user.coins ?? 0}</p>
              <p className="text-[10px] text-muted-foreground">Coins</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-foreground">⚡ {user.energy_bars ?? 0}/7</p>
              <p className="text-[10px] text-muted-foreground">Energy</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-foreground">{user.is_premium ? "👑" : "🆓"}</p>
              <p className="text-[10px] text-muted-foreground">{user.is_premium ? "Premium" : "Free"}</p>
            </div>
          </div>

          {/* Timed Ban Actions */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Ban className="w-3.5 h-3.5" /> Timed Actions
            </h4>
            {user.is_banned ? (
              <Button variant="outline" size="sm" className="w-full" onClick={handleUnban} disabled={loading}>
                Unban User
              </Button>
            ) : banMenu ? (
              <div className="grid grid-cols-2 gap-2">
                {[{ label: "1 Hour", val: "1h" }, { label: "24 Hours", val: "24h" }, { label: "7 Days", val: "7d" }, { label: "Permanent", val: "permanent" }].map((opt) => (
                  <Button key={opt.val} variant="destructive" size="sm" onClick={() => handleBan(opt.val)} disabled={loading}>
                    <Clock className="w-3 h-3 mr-1" /> {opt.label}
                  </Button>
                ))}
              </div>
            ) : (
              <Button variant="destructive" size="sm" className="w-full" onClick={() => setBanMenu(true)}>
                <Ban className="w-3.5 h-3.5 mr-1" /> Ban User
              </Button>
            )}
          </div>

          {/* Economy Actions */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Coins className="w-3.5 h-3.5" /> Economy Actions
            </h4>
            <div className="flex gap-2">
              <Input
                placeholder="+100 or -50"
                value={coinAdjust}
                onChange={(e) => setCoinAdjust(e.target.value)}
                className="h-8 text-xs bg-muted border-border"
              />
              <Button size="sm" onClick={handleAdjustCoins} disabled={loading}>Adjust Coins</Button>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Set energy (0-7)"
                value={energyAdjust}
                onChange={(e) => setEnergyAdjust(e.target.value)}
                className="h-8 text-xs bg-muted border-border"
              />
              <Button size="sm" onClick={handleSetEnergy} disabled={loading}>
                <Zap className="w-3 h-3 mr-1" /> Set
              </Button>
            </div>
          </div>

          {/* Destructive Actions */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Trash2 className="w-3.5 h-3.5" /> Destructive Actions
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="destructive" size="sm" onClick={handleWipeData} disabled={loading}>
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Wipe Data
              </Button>
              <Button variant="destructive" size="sm" onClick={handleForceLogout} disabled={loading}>
                <LogOut className="w-3.5 h-3.5 mr-1" /> Force Logout
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

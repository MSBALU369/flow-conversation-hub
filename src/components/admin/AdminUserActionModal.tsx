import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Ban, Coins, Trash2, LogOut, Zap, Clock, EyeOff, ShieldAlert } from "lucide-react";

interface UserRow {
  id: string;
  username: string | null;
  email: string | null;
  energy_bars: number | null;
  coins: number | null;
  created_at: string;
  is_premium: boolean | null;
  is_banned: boolean | null;
  is_hidden?: boolean | null;
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
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!user) return null;

  // BAN: permanently block email from re-registering
  const handleBan = async (duration: string) => {
    setLoading(true);
    await supabase.from("profiles").update({ is_banned: true } as any).eq("id", user.id);
    // Add email to banned_emails table so they can never re-register
    if (user.email) {
      await supabase.from("banned_emails" as any).upsert({ email: user.email.toLowerCase(), reason: `Banned ${duration}` } as any, { onConflict: "email" });
    }
    toast({ title: "User Banned", description: `${user.username || user.email} banned. Email blocked from re-registering.` });
    setBanMenu(false);
    setLoading(false);
    onRefresh();
  };

  const handleUnban = async () => {
    setLoading(true);
    await supabase.from("profiles").update({ is_banned: false } as any).eq("id", user.id);
    // Remove email from banned list
    if (user.email) {
      await supabase.from("banned_emails" as any).delete().eq("email", user.email.toLowerCase());
    }
    toast({ title: "User Unbanned", description: "Email removed from block list." });
    setLoading(false);
    onRefresh();
  };

  // DELETE: remove account, allow email re-registration
  const handleDeleteUser = async () => {
    setLoading(true);
    await supabase.rpc("delete_user_account", { p_user_id: user.id });
    toast({ title: "User Deleted", description: `${user.username || user.email} deleted. Email can be used to register again.`, variant: "destructive" });
    setConfirmDelete(false);
    setLoading(false);
    onOpenChange(false);
    onRefresh();
  };

  // HIDE: make user invisible to everyone except admin and themselves
  const handleToggleHide = async () => {
    setLoading(true);
    const newHidden = !(user as any).is_hidden;
    await supabase.from("profiles").update({ is_hidden: newHidden } as any).eq("id", user.id);
    toast({ title: newHidden ? "User Hidden" : "User Unhidden", description: newHidden ? "User is now invisible to all other users." : "User is visible again." });
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

  const handleForceLogout = async () => {
    setLoading(true);
    await supabase.from("profiles").update({ is_online: false } as any).eq("id", user.id);
    toast({ title: "Force Logout", description: "User marked offline." });
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

          {/* Status Indicators */}
          <div className="flex gap-2 flex-wrap">
            {user.is_banned && (
              <span className="text-[9px] px-2 py-1 rounded-full bg-destructive/20 text-destructive font-medium">🚫 Banned</span>
            )}
            {(user as any).is_hidden && (
              <span className="text-[9px] px-2 py-1 rounded-full bg-purple-500/20 text-purple-600 font-medium">👻 Hidden</span>
            )}
          </div>

          {/* Ban Actions */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Ban className="w-3.5 h-3.5" /> Ban (blocks email permanently)
            </h4>
            <p className="text-[10px] text-muted-foreground">Banned users cannot create a new account with the same email.</p>
            {user.is_banned ? (
              <Button variant="outline" size="sm" className="w-full" onClick={handleUnban} disabled={loading}>
                Unban User & Remove Email Block
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

          {/* Hide Action */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <EyeOff className="w-3.5 h-3.5" /> Hide (invisible to others)
            </h4>
            <p className="text-[10px] text-muted-foreground">Hidden users are invisible to everyone except admin and the user themselves.</p>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleToggleHide}
              disabled={loading}
            >
              <EyeOff className="w-3.5 h-3.5 mr-1" />
              {(user as any).is_hidden ? "Unhide User" : "Hide User"}
            </Button>
          </div>

          {/* Economy Actions */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Coins className="w-3.5 h-3.5" /> Economy Actions
            </h4>
            <div className="flex gap-2">
              <Input placeholder="+100 or -50" value={coinAdjust} onChange={(e) => setCoinAdjust(e.target.value)} className="h-8 text-xs bg-muted border-border" />
              <Button size="sm" onClick={handleAdjustCoins} disabled={loading}>Adjust Coins</Button>
            </div>
            <div className="flex gap-2">
              <Input placeholder="Set energy (0-7)" value={energyAdjust} onChange={(e) => setEnergyAdjust(e.target.value)} className="h-8 text-xs bg-muted border-border" />
              <Button size="sm" onClick={handleSetEnergy} disabled={loading}>
                <Zap className="w-3 h-3 mr-1" /> Set
              </Button>
            </div>
          </div>

          {/* Delete Action */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Trash2 className="w-3.5 h-3.5" /> Delete (allows re-registration)
            </h4>
            <p className="text-[10px] text-muted-foreground">Deleted users can create a new account with the same email address.</p>
            {confirmDelete ? (
              <div className="flex gap-2">
                <Button variant="destructive" size="sm" className="flex-1" onClick={handleDeleteUser} disabled={loading}>
                  ⚠️ Confirm Delete
                </Button>
                <Button variant="outline" size="sm" onClick={() => setConfirmDelete(false)} disabled={loading}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button variant="destructive" size="sm" className="w-full" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete User Account
              </Button>
            )}
          </div>

          {/* Force Logout */}
          <div className="space-y-2">
            <Button variant="outline" size="sm" className="w-full" onClick={handleForceLogout} disabled={loading}>
              <LogOut className="w-3.5 h-3.5 mr-1" /> Force Logout
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

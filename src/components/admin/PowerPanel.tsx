import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Zap, Crown, Shield, Search, UserPlus, UserMinus, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface UserRow {
  id: string;
  username: string | null;
  email: string | null;
  is_premium: boolean | null;
}

interface PowerPanelProps {
  users: UserRow[];
  onRefresh: () => void;
}

export function PowerPanel({ users, onRefresh }: PowerPanelProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [userRoles, setUserRoles] = useState<Record<string, string[]>>({});

  const filtered = search.trim()
    ? users.filter(u => {
        const q = search.toLowerCase();
        return (u.username || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q);
      }).slice(0, 20)
    : [];

  const fetchUserRole = async (userId: string) => {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    if (data) {
      setUserRoles(prev => ({ ...prev, [userId]: data.map((r: any) => r.role) }));
    }
  };

  const handleSearch = () => {
    filtered.forEach(u => {
      if (!userRoles[u.id]) fetchUserRole(u.id);
    });
  };

  const grantAdmin = async (userId: string) => {
    setLoading(`admin-grant-${userId}`);
    const { error } = await supabase.from("user_roles").upsert(
      { user_id: userId, role: "admin" } as any,
      { onConflict: "user_id,role" }
    );
    if (error) {
      // Try insert if upsert fails
      await supabase.from("user_roles").insert({ user_id: userId, role: "admin" } as any);
    }
    toast({ title: "Admin Granted", description: "User is now an admin." });
    await fetchUserRole(userId);
    setLoading(null);
    onRefresh();
  };

  const revokeAdmin = async (userId: string) => {
    setLoading(`admin-revoke-${userId}`);
    await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin" as any);
    toast({ title: "Admin Revoked", description: "User is no longer an admin." });
    await fetchUserRole(userId);
    setLoading(null);
    onRefresh();
  };

  const grantPremium = async (userId: string, days: number) => {
    setLoading(`premium-grant-${userId}`);
    await supabase.rpc("admin_grant_premium", {
      p_target_user_id: userId,
      p_duration_days: days,
      p_bonus_coins: 0,
    });
    toast({ title: "Premium Granted", description: `${days} day(s) of premium added.` });
    setLoading(null);
    onRefresh();
  };

  const revokePremium = async (userId: string) => {
    setLoading(`premium-revoke-${userId}`);
    await supabase.from("profiles").update({
      is_premium: false,
      premium_expires_at: null,
    }).eq("id", userId);
    toast({ title: "Premium Revoked", description: "User is no longer premium." });
    setLoading(null);
    onRefresh();
  };

  const isAdmin = (userId: string) => (userRoles[userId] || []).includes("admin");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 text-[10px] gap-1 justify-start w-full">
          <Zap className="w-3 h-3 text-primary" /> Power
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto border-border bg-background">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" /> Power Panel
          </DialogTitle>
        </DialogHeader>

        <p className="text-[10px] text-muted-foreground">
          Grant or revoke Admin role & Premium membership for any user.
        </p>

        <div className="flex gap-2">
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyUp={handleSearch}
            className="h-8 text-xs bg-muted border-border flex-1"
          />
          <Button size="sm" className="h-8" onClick={handleSearch}>
            <Search className="w-3.5 h-3.5" />
          </Button>
        </div>

        {search.trim() && filtered.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">No users found</p>
        )}

        <div className="space-y-2 max-h-[55vh] overflow-y-auto">
          {filtered.map(u => {
            const roles = userRoles[u.id] || [];
            const isAdminUser = roles.includes("admin");
            // Fetch role on first render of this user
            if (!userRoles[u.id]) fetchUserRole(u.id);

            return (
              <div key={u.id} className="p-3 rounded-xl border border-border bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-foreground">{u.username || "—"}</p>
                    <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">{u.email || "—"}</p>
                  </div>
                  <div className="flex gap-1">
                    {isAdminUser && (
                      <Badge className="text-[8px] px-1.5 py-0 h-4 bg-primary/15 text-primary border-primary/30">
                        <Shield className="w-2 h-2 mr-0.5" /> Admin
                      </Badge>
                    )}
                    {u.is_premium && (
                      <Badge className="text-[8px] px-1.5 py-0 h-4 bg-yellow-500/15 text-yellow-600 border-yellow-500/30">
                        <Crown className="w-2 h-2 mr-0.5" /> Premium
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Admin Actions */}
                <div className="flex gap-1.5">
                  {isAdminUser ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-7 text-[9px] flex-1 gap-1"
                      disabled={loading === `admin-revoke-${u.id}`}
                      onClick={() => revokeAdmin(u.id)}
                    >
                      {loading === `admin-revoke-${u.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserMinus className="w-3 h-3" />}
                      Remove Admin
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-[9px] flex-1 gap-1"
                      disabled={loading === `admin-grant-${u.id}`}
                      onClick={() => grantAdmin(u.id)}
                    >
                      {loading === `admin-grant-${u.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3" />}
                      Make Admin
                    </Button>
                  )}
                </div>

                {/* Premium Actions */}
                <div className="flex gap-1.5">
                  {u.is_premium ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-7 text-[9px] flex-1 gap-1"
                      disabled={loading === `premium-revoke-${u.id}`}
                      onClick={() => revokePremium(u.id)}
                    >
                      {loading === `premium-revoke-${u.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Crown className="w-3 h-3" />}
                      Remove Premium
                    </Button>
                  ) : (
                    <div className="flex gap-1 flex-1">
                      {[7, 30, 90, 365].map(d => (
                        <Button
                          key={d}
                          variant="outline"
                          size="sm"
                          className="h-7 text-[9px] flex-1 gap-0.5"
                          disabled={loading === `premium-grant-${u.id}`}
                          onClick={() => grantPremium(u.id, d)}
                        >
                          <Crown className="w-2.5 h-2.5" /> {d}d
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

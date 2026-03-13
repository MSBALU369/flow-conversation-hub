import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Zap, Crown, Shield, Search, UserPlus, UserMinus, Loader2,
  Ban, Trash2, EyeOff, Eye, Filter,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface UserRow {
  id: string;
  username: string | null;
  email: string | null;
  is_premium: boolean | null;
  is_banned?: boolean | null;
  is_hidden?: boolean | null;
  reports_count?: number | null;
}

interface PowerPanelProps {
  users: UserRow[];
  onRefresh: () => void;
}

type ActionFilter = "all" | "admin" | "premium" | "banned" | "hidden";

export function PowerPanel({ users, onRefresh }: PowerPanelProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [userRoles, setUserRoles] = useState<Record<string, string[]>>({});
  const [filter, setFilter] = useState<ActionFilter>("all");
  const [fetchedRoles, setFetchedRoles] = useState(false);

  // Fetch all roles at once when panel opens
  useEffect(() => {
    if (open && !fetchedRoles) {
      (async () => {
        const { data } = await supabase.from("user_roles").select("user_id, role");
        if (data) {
          const map: Record<string, string[]> = {};
          data.forEach((r: any) => {
            if (!map[r.user_id]) map[r.user_id] = [];
            map[r.user_id].push(r.role);
          });
          setUserRoles(map);
          setFetchedRoles(true);
        }
      })();
    }
  }, [open, fetchedRoles]);

  const filtered = users.filter(u => {
    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!(u.username || "").toLowerCase().includes(q) && !(u.email || "").toLowerCase().includes(q)) return false;
    }
    // Action filter
    const roles = userRoles[u.id] || [];
    switch (filter) {
      case "admin": return roles.includes("admin") || roles.includes("root");
      case "premium": return !!u.is_premium;
      case "banned": return !!u.is_banned;
      case "hidden": return !!(u as any).is_hidden;
      default: return true;
    }
  }).slice(0, 50);

  const grantAdmin = async (userId: string) => {
    setLoading(`admin-grant-${userId}`);
    const { error } = await supabase.from("user_roles").upsert(
      { user_id: userId, role: "admin" } as any,
      { onConflict: "user_id,role" }
    );
    if (error) {
      await supabase.from("user_roles").insert({ user_id: userId, role: "admin" } as any);
    }
    toast({ title: "✅ Admin Granted" });
    setUserRoles(prev => ({ ...prev, [userId]: [...(prev[userId] || []), "admin"] }));
    setLoading(null);
    onRefresh();
  };

  const revokeAdmin = async (userId: string) => {
    setLoading(`admin-revoke-${userId}`);
    await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin" as any);
    toast({ title: "✅ Admin Revoked" });
    setUserRoles(prev => ({ ...prev, [userId]: (prev[userId] || []).filter(r => r !== "admin") }));
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
    toast({ title: "✅ Premium Granted", description: `${days} day(s) added.` });
    setLoading(null);
    onRefresh();
  };

  const revokePremium = async (userId: string) => {
    setLoading(`premium-revoke-${userId}`);
    await supabase.from("profiles").update({
      is_premium: false,
      premium_expires_at: null,
    }).eq("id", userId);
    toast({ title: "✅ Premium Revoked" });
    setLoading(null);
    onRefresh();
  };

  const handleBan = async (userId: string, email: string | null) => {
    if (!confirm("Ban this user? Their email will be permanently blocked.")) return;
    setLoading(`ban-${userId}`);
    await supabase.from("profiles").update({ is_banned: true } as any).eq("id", userId);
    if (email) {
      await supabase.from("banned_emails" as any).upsert(
        { email: email.toLowerCase(), reason: "Banned via Power Panel" } as any,
        { onConflict: "email" }
      );
    }
    toast({ title: "🚫 User Banned" });
    setLoading(null);
    onRefresh();
  };

  const handleUnban = async (userId: string, email: string | null) => {
    setLoading(`unban-${userId}`);
    await supabase.from("profiles").update({ is_banned: false } as any).eq("id", userId);
    if (email) {
      await supabase.from("banned_emails" as any).delete().eq("email", email.toLowerCase());
    }
    toast({ title: "✅ User Unbanned" });
    setLoading(null);
    onRefresh();
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Permanently delete this user? They can re-register.")) return;
    setLoading(`delete-${userId}`);
    await supabase.rpc("delete_user_account", { p_user_id: userId });
    toast({ title: "🗑️ User Deleted", variant: "destructive" });
    setLoading(null);
    onRefresh();
  };

  const handleToggleHide = async (userId: string, currentHidden: boolean) => {
    setLoading(`hide-${userId}`);
    await supabase.from("profiles").update({ is_hidden: !currentHidden } as any).eq("id", userId);
    toast({ title: currentHidden ? "👁 User Visible" : "👻 User Hidden" });
    setLoading(null);
    onRefresh();
  };

  const isAdmin = (userId: string) => (userRoles[userId] || []).includes("admin") || (userRoles[userId] || []).includes("root");

  const filters: { key: ActionFilter; label: string; count: number }[] = [
    { key: "all", label: "All", count: users.length },
    { key: "admin", label: "Admins", count: users.filter(u => (userRoles[u.id] || []).some(r => r === "admin" || r === "root")).length },
    { key: "premium", label: "Premium", count: users.filter(u => u.is_premium).length },
    { key: "banned", label: "Banned", count: users.filter(u => u.is_banned).length },
    { key: "hidden", label: "Hidden", count: users.filter(u => (u as any).is_hidden).length },
  ];

  return (
    <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o) setFetchedRoles(false); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 text-[10px] gap-1 justify-start w-full">
          <Zap className="w-3 h-3 text-primary" /> Power Panel
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto border-border bg-background">
        <DialogHeader>
          <DialogTitle className="text-sm flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" /> Power Panel — Full User Control
          </DialogTitle>
        </DialogHeader>

        <p className="text-[10px] text-muted-foreground">
          All actions execute immediately at the database level.
        </p>

        {/* Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-8 text-xs bg-muted border-border pl-8"
            />
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex gap-1.5 flex-wrap">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "text-[9px] px-2 py-1 rounded-full border transition-colors font-medium",
                filter === f.key
                  ? "bg-primary/15 border-primary/30 text-primary"
                  : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/50"
              )}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">No users found</p>
        )}

        <div className="space-y-2 max-h-[55vh] overflow-y-auto">
          {filtered.map(u => {
            const roles = userRoles[u.id] || [];
            const isAdminUser = roles.includes("admin") || roles.includes("root");
            const isBanned = !!(u as any).is_banned;
            const isHidden = !!(u as any).is_hidden;

            return (
              <div key={u.id} className="p-3 rounded-xl border border-border bg-muted/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground truncate">{u.username || "—"}</p>
                    <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">{u.email || "—"}</p>
                  </div>
                  <div className="flex gap-1 flex-wrap justify-end">
                    {isAdminUser && (
                      <Badge className="text-[8px] px-1.5 py-0 h-4 bg-primary/15 text-primary border-primary/30">
                        <Shield className="w-2 h-2 mr-0.5" /> {roles.includes("root") ? "Root" : "Admin"}
                      </Badge>
                    )}
                    {u.is_premium && (
                      <Badge className="text-[8px] px-1.5 py-0 h-4 bg-yellow-500/15 text-yellow-600 border-yellow-500/30">
                        <Crown className="w-2 h-2 mr-0.5" /> Premium
                      </Badge>
                    )}
                    {isBanned && (
                      <Badge className="text-[8px] px-1.5 py-0 h-4 bg-destructive/15 text-destructive border-destructive/30">
                        🚫 Banned
                      </Badge>
                    )}
                    {isHidden && (
                      <Badge className="text-[8px] px-1.5 py-0 h-4 bg-purple-500/15 text-purple-600 border-purple-500/30">
                        👻 Hidden
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Admin/Premium Row */}
                <div className="flex gap-1.5">
                  {isAdminUser ? (
                    <Button variant="destructive" size="sm" className="h-6 text-[9px] flex-1 gap-0.5"
                      disabled={!!loading} onClick={() => revokeAdmin(u.id)}>
                      {loading === `admin-revoke-${u.id}` ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <UserMinus className="w-2.5 h-2.5" />}
                      Revoke Admin
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" className="h-6 text-[9px] flex-1 gap-0.5"
                      disabled={!!loading} onClick={() => grantAdmin(u.id)}>
                      {loading === `admin-grant-${u.id}` ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <UserPlus className="w-2.5 h-2.5" />}
                      Make Admin
                    </Button>
                  )}
                  {u.is_premium ? (
                    <Button variant="destructive" size="sm" className="h-6 text-[9px] flex-1 gap-0.5"
                      disabled={!!loading} onClick={() => revokePremium(u.id)}>
                      <Crown className="w-2.5 h-2.5" /> Revoke Premium
                    </Button>
                  ) : (
                    <div className="flex gap-0.5 flex-1">
                      {[7, 30, 90, 365].map(d => (
                        <Button key={d} variant="outline" size="sm" className="h-6 text-[8px] flex-1 px-1"
                          disabled={!!loading} onClick={() => grantPremium(u.id, d)}>
                          {d}d
                        </Button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Moderation Row: Ban, Hide, Delete */}
                <div className="flex gap-1.5">
                  {isBanned ? (
                    <Button variant="outline" size="sm" className="h-6 text-[9px] flex-1 gap-0.5"
                      disabled={!!loading} onClick={() => handleUnban(u.id, u.email)}>
                      Unban
                    </Button>
                  ) : (
                    <Button variant="destructive" size="sm" className="h-6 text-[9px] flex-1 gap-0.5"
                      disabled={!!loading} onClick={() => handleBan(u.id, u.email)}>
                      {loading === `ban-${u.id}` ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Ban className="w-2.5 h-2.5" />}
                      Ban
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="h-6 text-[9px] flex-1 gap-0.5"
                    disabled={!!loading} onClick={() => handleToggleHide(u.id, isHidden)}>
                    {isHidden ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
                    {isHidden ? "Unhide" : "Hide"}
                  </Button>
                  <Button variant="destructive" size="sm" className="h-6 text-[9px] flex-1 gap-0.5"
                    disabled={!!loading} onClick={() => handleDelete(u.id)}>
                    {loading === `delete-${u.id}` ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Trash2 className="w-2.5 h-2.5" />}
                    Delete
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

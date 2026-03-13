import { useState, useMemo } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users, Crown, UserCheck, Search, MoreVertical, Eye, AlertTriangle,
  Ban, ChevronDown, X, EyeOff, Trash2, ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UserRow {
  id: string;
  username: string | null;
  email: string | null;
  avatar_url?: string | null;
  energy_bars: number | null;
  coins: number | null;
  created_at: string;
  is_premium: boolean | null;
  is_banned: boolean | null;
  is_hidden?: boolean | null;
  deletion_requested_at?: string | null;
  reports_count?: number | null;
}

type UserFilter = "all" | "premium" | "free" | "banned" | "hidden" | "flagged";

interface AdminUserManagementProps {
  users: UserRow[];
  loading: boolean;
  onSelectUser: (user: UserRow) => void;
  onBanUsers: (ids: string[]) => void;
  onWarnUsers: (ids: string[]) => void;
  onHideUsers?: (ids: string[]) => void;
  onDeleteUsers?: (ids: string[]) => void;
}

export function AdminUserManagement({
  users, loading, onSelectUser, onBanUsers, onWarnUsers, onHideUsers, onDeleteUsers,
}: AdminUserManagementProps) {
  const [filter, setFilter] = useState<UserFilter>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const counts = useMemo(() => ({
    all: users.length,
    premium: users.filter(u => u.is_premium).length,
    free: users.filter(u => !u.is_premium).length,
    banned: users.filter(u => u.is_banned).length,
    hidden: users.filter(u => (u as any).is_hidden).length,
    flagged: users.filter(u => (u.reports_count ?? 0) >= 3).length,
  }), [users]);

  const filtered = useMemo(() => {
    let list = users;
    if (filter === "premium") list = list.filter(u => u.is_premium);
    if (filter === "free") list = list.filter(u => !u.is_premium);
    if (filter === "banned") list = list.filter(u => u.is_banned);
    if (filter === "hidden") list = list.filter(u => (u as any).is_hidden);
    if (filter === "flagged") list = list.filter(u => (u.reports_count ?? 0) >= 3);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(u =>
        (u.username || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [users, filter, search]);

  const allSelected = filtered.length > 0 && filtered.every(u => selected.has(u.id));
  const someSelected = selected.size > 0;

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map(u => u.id)));
  };

  const toggleOne = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const getStatus = (u: UserRow) => {
    if (u.deletion_requested_at) return "frozen";
    if (u.is_banned) return "banned";
    if ((u as any).is_hidden) return "hidden";
    if ((u.reports_count ?? 0) >= 3) return "flagged";
    return "active";
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "banned":
        return <Badge variant="destructive" className="text-[9px] px-1.5 py-0 h-5">Banned</Badge>;
      case "frozen":
        return <Badge className="text-[9px] px-1.5 py-0 h-5 bg-orange-500/20 text-orange-600 border-orange-500/30 hover:bg-orange-500/30">Frozen</Badge>;
      case "hidden":
        return <Badge className="text-[9px] px-1.5 py-0 h-5 bg-purple-500/20 text-purple-600 border-purple-500/30 hover:bg-purple-500/30">Hidden</Badge>;
      case "flagged":
        return <Badge className="text-[9px] px-1.5 py-0 h-5 bg-yellow-500/20 text-yellow-600 border-yellow-500/30 hover:bg-yellow-500/30">Flagged</Badge>;
      default:
        return <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-5">Active</Badge>;
    }
  };

  const statCards: { key: UserFilter; label: string; icon: React.ElementType; count: number; color: string }[] = [
    { key: "all", label: "All Users", icon: Users, count: counts.all, color: "text-foreground" },
    { key: "premium", label: "Premium", icon: Crown, count: counts.premium, color: "text-primary" },
    { key: "free", label: "Free", icon: UserCheck, count: counts.free, color: "text-muted-foreground" },
    { key: "banned", label: "Banned", icon: Ban, count: counts.banned, color: "text-destructive" },
    { key: "hidden", label: "Hidden", icon: EyeOff, count: counts.hidden, color: "text-purple-500" },
    { key: "flagged", label: "Flagged", icon: ShieldAlert, count: counts.flagged, color: "text-yellow-500" },
  ];

  return (
    <div className="space-y-4 mt-4">
      {/* Clickable Stat Cards */}
      <div className="grid grid-cols-3 gap-2">
        {statCards.map(s => (
          <button
            key={s.key}
            onClick={() => { setFilter(s.key); clearSelection(); }}
            className={cn(
              "flex flex-col items-center gap-1 p-3 rounded-xl border transition-all duration-200",
              filter === s.key
                ? "bg-primary/10 border-primary/30 shadow-sm ring-1 ring-primary/20"
                : "bg-muted/30 border-border hover:bg-muted/60 hover:border-primary/20"
            )}
          >
            <s.icon className={cn("w-4 h-4", s.color)} />
            <span className={cn("text-xl font-bold", s.color)}>{s.count}</span>
            <span className="text-[9px] text-muted-foreground font-medium">{s.label}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 h-9 text-sm bg-muted/50 border-border"
        />
      </div>

      {/* Bulk Actions Bar */}
      {someSelected && (
        <div className="sticky top-14 z-20 flex items-center gap-2 p-2.5 rounded-lg bg-primary/10 border border-primary/20 backdrop-blur-sm animate-in slide-in-from-top-2 duration-200">
          <span className="text-xs font-medium text-primary flex-1">
            {selected.size} user{selected.size > 1 ? "s" : ""} selected
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1">
                Bulk Actions <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[160px]">
              <DropdownMenuItem onClick={() => onBanUsers(Array.from(selected))} className="text-destructive text-xs gap-2">
                <Ban className="w-3.5 h-3.5" /> Ban Selected
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onWarnUsers(Array.from(selected))} className="text-xs gap-2">
                <AlertTriangle className="w-3.5 h-3.5" /> Send Warning
              </DropdownMenuItem>
              {onHideUsers && (
                <DropdownMenuItem onClick={() => onHideUsers(Array.from(selected))} className="text-xs gap-2">
                  <EyeOff className="w-3.5 h-3.5" /> Hide Selected
                </DropdownMenuItem>
              )}
              {onDeleteUsers && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onDeleteUsers(Array.from(selected))} className="text-destructive text-xs gap-2">
                    <Trash2 className="w-3.5 h-3.5" /> Delete Selected
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={clearSelection} className="text-xs gap-2">
                <X className="w-3.5 h-3.5" /> Clear Selection
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Stats */}
      <p className="text-xs text-muted-foreground">
        {filtered.length} user{filtered.length !== 1 ? "s" : ""} found
      </p>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <div className="max-h-[55vh] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="w-10">
                    <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Select all" />
                  </TableHead>
                  <TableHead className="text-[10px] font-semibold">User</TableHead>
                  <TableHead className="text-[10px] font-semibold">Email</TableHead>
                  <TableHead className="text-[10px] font-semibold">Plan</TableHead>
                  <TableHead className="text-[10px] font-semibold">Joined</TableHead>
                  <TableHead className="text-[10px] font-semibold">Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(u => {
                  const isChecked = selected.has(u.id);
                  const status = getStatus(u);
                  return (
                    <TableRow
                      key={u.id}
                      className={cn(
                        "transition-colors duration-150",
                        isChecked ? "bg-primary/5" : "hover:bg-muted/30"
                      )}
                    >
                      <TableCell className="py-2">
                        <Checkbox checked={isChecked} onCheckedChange={() => toggleOne(u.id)} aria-label={`Select ${u.username || u.email}`} />
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-7 h-7">
                            <AvatarImage src={u.avatar_url || ""} />
                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                              {(u.username || u.email || "?")[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium truncate max-w-[80px]">{u.username || "—"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-[10px] text-muted-foreground py-2 max-w-[100px] truncate">{u.email || "—"}</TableCell>
                      <TableCell className="py-2">
                        {u.is_premium ? (
                          <Badge className="text-[9px] px-1.5 py-0 h-5 bg-primary/15 text-primary border-primary/30 hover:bg-primary/20 gap-0.5">
                            <Crown className="w-2.5 h-2.5" /> Premium
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-5">Free</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-[10px] text-muted-foreground py-2">
                        {new Date(u.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="py-2">{statusBadge(status)}</TableCell>
                      <TableCell className="py-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1 rounded-md hover:bg-muted transition-colors">
                              <MoreVertical className="w-4 h-4 text-muted-foreground" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="min-w-[160px]">
                            <DropdownMenuItem onClick={() => onSelectUser(u)} className="text-xs gap-2">
                              <Eye className="w-3.5 h-3.5" /> View / Actions
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onWarnUsers([u.id])} className="text-xs gap-2">
                              <AlertTriangle className="w-3.5 h-3.5" /> Send Warning
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {onHideUsers && (
                              <DropdownMenuItem onClick={() => onHideUsers([u.id])} className="text-xs gap-2">
                                <EyeOff className="w-3.5 h-3.5" /> {(u as any).is_hidden ? "Unhide" : "Hide User"}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => onBanUsers([u.id])} className="text-destructive text-xs gap-2">
                              <Ban className="w-3.5 h-3.5" /> {u.is_banned ? "Unban" : "Ban User"}
                            </DropdownMenuItem>
                            {onDeleteUsers && (
                              <DropdownMenuItem onClick={() => onDeleteUsers([u.id])} className="text-destructive text-xs gap-2">
                                <Trash2 className="w-3.5 h-3.5" /> Delete User
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-sm text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}

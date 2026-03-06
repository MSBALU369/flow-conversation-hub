import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserMinus, RefreshCcw, Trash2, AlertTriangle } from "lucide-react";

interface PendingUser {
  id: string;
  username: string | null;
  email: string | null;
  unique_id: string | null;
  avatar_url: string | null;
  deletion_requested_at: string;
}

export function PendingDeletionsTab() {
  const { toast } = useToast();
  const [pending, setPending] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

  const fetchPending = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, username, email, unique_id, avatar_url, deletion_requested_at")
      .not("deletion_requested_at", "is", null)
      .order("deletion_requested_at", { ascending: true });
    setPending((data as PendingUser[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchPending(); }, []);

  const handleRestore = async (userId: string) => {
    setActionLoading(true);
    await supabase.from("profiles").update({ is_banned: false, deletion_requested_at: null } as any).eq("id", userId);
    setPending(prev => prev.filter(u => u.id !== userId));
    toast({ title: "✅ User Restored", description: "Account unfrozen and deletion cancelled." });
    setActionLoading(false);
  };

  const handleForceDelete = async (userId: string) => {
    setActionLoading(true);
    await supabase.rpc("delete_user_account", { p_user_id: userId });
    setPending(prev => prev.filter(u => u.id !== userId));
    toast({ title: "🗑️ Account Permanently Deleted", variant: "destructive" });
    setConfirmDeleteId(null);
    setActionLoading(false);
  };

  const handleRestoreAll = async () => {
    setActionLoading(true);
    const ids = pending.map(u => u.id);
    for (const id of ids) {
      await supabase.from("profiles").update({ is_banned: false, deletion_requested_at: null } as any).eq("id", id);
    }
    setPending([]);
    toast({ title: "✅ All Users Restored", description: `${ids.length} accounts unfrozen.` });
    setActionLoading(false);
  };

  const handleDeleteAll = async () => {
    setActionLoading(true);
    for (const u of pending) {
      await supabase.rpc("delete_user_account", { p_user_id: u.id });
    }
    const count = pending.length;
    setPending([]);
    toast({ title: "🗑️ All Accounts Permanently Deleted", description: `${count} accounts wiped.`, variant: "destructive" });
    setConfirmDeleteAll(false);
    setActionLoading(false);
  };

  const getTimeLeft = (requestedAt: string) => {
    const deleteBy = new Date(new Date(requestedAt).getTime() + 48 * 60 * 60 * 1000);
    const msLeft = deleteBy.getTime() - Date.now();
    if (msLeft <= 0) return "Ready to delete";
    const hours = Math.floor(msLeft / (1000 * 60 * 60));
    const mins = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m left`;
  };

  return (
    <div className="space-y-4 mt-4">
      {/* Header Card */}
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-destructive">
            <UserMinus className="w-4 h-4" />
            Pending Deletions
            <span className="ml-auto text-lg font-bold">{pending.length}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p className="text-[10px] text-muted-foreground mb-3">
            Accounts frozen by users who requested deletion. They have a 48-hour grace period before permanent removal.
          </p>
          {pending.length > 0 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs border-green-500/50 text-green-600 hover:bg-green-500/10"
                onClick={handleRestoreAll}
                disabled={actionLoading}
              >
                <RefreshCcw className="w-3.5 h-3.5 mr-1" /> Restore All
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="text-xs"
                onClick={() => setConfirmDeleteAll(true)}
                disabled={actionLoading}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete All Permanently
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      {loading ? (
        <p className="text-xs text-muted-foreground text-center py-8">Loading…</p>
      ) : pending.length === 0 ? (
        <div className="text-center py-12">
          <UserMinus className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No pending deletions</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="text-[10px] w-10">Avatar</TableHead>
                <TableHead className="text-[10px]">Username</TableHead>
                <TableHead className="text-[10px]">Unique ID</TableHead>
                <TableHead className="text-[10px]">Requested</TableHead>
                <TableHead className="text-[10px]">Time Left</TableHead>
                <TableHead className="text-[10px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pending.map(u => (
                <TableRow key={u.id}>
                  <TableCell className="p-2">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={u.avatar_url || ""} />
                      <AvatarFallback className="text-[9px] bg-muted">
                        {(u.username || "?")[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="p-2">
                    <p className="text-xs font-medium text-foreground">{u.username || "Unknown"}</p>
                    <p className="text-[9px] text-muted-foreground">{u.email || "—"}</p>
                  </TableCell>
                  <TableCell className="p-2 text-[10px] text-muted-foreground font-mono">
                    {u.unique_id || "—"}
                  </TableCell>
                  <TableCell className="p-2 text-[10px] text-muted-foreground">
                    {new Date(u.deletion_requested_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="p-2">
                    <span className="text-[10px] font-medium text-destructive">
                      {getTimeLeft(u.deletion_requested_at)}
                    </span>
                  </TableCell>
                  <TableCell className="p-2 text-right">
                    <div className="flex gap-1 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-[9px] h-6 px-2 border-green-500/50 text-green-600 hover:bg-green-500/10"
                        onClick={() => handleRestore(u.id)}
                        disabled={actionLoading}
                      >
                        <RefreshCcw className="w-3 h-3 mr-0.5" /> Restore
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="text-[9px] h-6 px-2"
                        onClick={() => setConfirmDeleteId(u.id)}
                        disabled={actionLoading}
                      >
                        <Trash2 className="w-3 h-3 mr-0.5" /> Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Single Delete Confirmation */}
      <AlertDialog open={!!confirmDeleteId} onOpenChange={() => setConfirmDeleteId(null)}>
        <AlertDialogContent className="border-destructive/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" /> Permanent Deletion
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this user and ALL their data (messages, calls, coins, friends, etc.). This action is <strong>irreversible</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => confirmDeleteId && handleForceDelete(confirmDeleteId)}
              disabled={actionLoading}
            >
              Yes, Delete Forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={confirmDeleteAll} onOpenChange={setConfirmDeleteAll}>
        <AlertDialogContent className="border-destructive/50">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" /> ⚠️ MASS PERMANENT DELETION
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to permanently delete <strong>{pending.length} user accounts</strong> and ALL their associated data. This action is <strong>completely irreversible</strong>. Are you absolutely sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteAll}
              disabled={actionLoading}
            >
              Yes, Delete All {pending.length} Accounts
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { RefreshCw, UserPlus, Trash2, LogIn } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ACCOUNTS_KEY = "ef_saved_accounts";

interface SavedAccount {
  email: string;
  refresh_token: string;
}

interface SwitchAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getSavedAccounts(): SavedAccount[] {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveSavedAccounts(accounts: SavedAccount[]) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export function SwitchAccountModal({ open, onOpenChange }: SwitchAccountModalProps) {
  const [accounts, setAccounts] = useState<SavedAccount[]>([]);
  const [switching, setSwitching] = useState<string | null>(null);
  const { user, session, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (open) setAccounts(getSavedAccounts());
  }, [open]);

  const handleAddAccount = async () => {
    if (!user?.email || !session?.refresh_token) return;

    // Save current account
    const existing = getSavedAccounts();
    const filtered = existing.filter((a) => a.email !== user.email);
    filtered.push({ email: user.email, refresh_token: session.refresh_token });
    saveSavedAccounts(filtered);

    // Sign out and go to login
    await signOut();
    onOpenChange(false);
    navigate("/login", { replace: true });
    toast({ title: "Account saved", description: "Log in with another account." });
  };

  const handleSwitchTo = async (account: SavedAccount) => {
    if (!user?.email || !session?.refresh_token) return;
    setSwitching(account.email);

    try {
      // Save current account first
      const existing = getSavedAccounts();
      const filtered = existing.filter((a) => a.email !== user.email);
      filtered.push({ email: user.email, refresh_token: session.refresh_token });
      saveSavedAccounts(filtered);

      // Try to set session with saved token
      const { data, error } = await supabase.auth.setSession({
        access_token: "", // Will be refreshed
        refresh_token: account.refresh_token,
      });

      if (error || !data.session) {
        // Token expired - remove it
        const updated = getSavedAccounts().filter((a) => a.email !== account.email);
        saveSavedAccounts(updated);
        setAccounts(updated);
        toast({ title: "Session expired", description: `Please log in manually for ${account.email}.`, variant: "destructive" });
        return;
      }

      // Update the saved token with the fresh one
      const updatedAccounts = getSavedAccounts().map((a) =>
        a.email === account.email ? { ...a, refresh_token: data.session!.refresh_token } : a
      );
      saveSavedAccounts(updatedAccounts);

      toast({ title: "Switched!", description: `Now logged in as ${account.email}` });
      onOpenChange(false);
      window.location.reload();
    } catch (err: any) {
      toast({ title: "Switch failed", description: err.message, variant: "destructive" });
    } finally {
      setSwitching(null);
    }
  };

  const handleRemove = (email: string) => {
    const updated = getSavedAccounts().filter((a) => a.email !== email);
    saveSavedAccounts(updated);
    setAccounts(updated);
    toast({ title: "Account removed" });
  };

  const otherAccounts = accounts.filter((a) => a.email !== user?.email);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <RefreshCw className="w-5 h-5 text-primary" />
            Switch Account
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2 py-2">
          {/* Current account */}
          {user?.email && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 border border-primary/20">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">
                {user.email[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{user.email}</p>
                <p className="text-[10px] text-primary">Currently active</p>
              </div>
            </div>
          )}

          {/* Saved accounts */}
          {otherAccounts.map((account) => (
            <div key={account.email} className="flex items-center gap-3 p-3 rounded-xl bg-muted hover:bg-muted/80 transition-colors">
              <div className="w-8 h-8 rounded-full bg-muted-foreground/20 flex items-center justify-center text-muted-foreground text-sm font-bold">
                {account.email[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{account.email}</p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs"
                  disabled={switching === account.email}
                  onClick={() => handleSwitchTo(account)}
                >
                  <LogIn className="w-3.5 h-3.5 mr-1" />
                  {switching === account.email ? "..." : "Switch"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-destructive"
                  onClick={() => handleRemove(account.email)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}

          {otherAccounts.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-3">No saved accounts</p>
          )}
        </div>

        <Button onClick={handleAddAccount} variant="outline" className="w-full gap-2">
          <UserPlus className="w-4 h-4" />
          Add Another Account
        </Button>
      </DialogContent>
    </Dialog>
  );
}

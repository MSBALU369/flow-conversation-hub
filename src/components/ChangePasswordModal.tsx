import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ChangePasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangePasswordModal({ open, onOpenChange }: ChangePasswordModalProps) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;

    // Check monthly limit (max 2 per calendar month)
    const changeCount = (profile as any)?.password_change_count ?? 0;
    const lastChanged = (profile as any)?.password_last_changed;
    if (lastChanged) {
      const lastDate = new Date(lastChanged);
      const now = new Date();
      const sameMonth = lastDate.getMonth() === now.getMonth() && lastDate.getFullYear() === now.getFullYear();
      if (sameMonth && changeCount >= 2) {
        toast({ title: "Limit reached", description: "You can only change your password 2 times per month.", variant: "destructive" });
        return;
      }
    }

    if (newPassword.length < 6) {
      toast({ title: "Password too short", description: "Minimum 6 characters.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Verify old password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: oldPassword,
      });
      if (signInError) {
        toast({ title: "Old password incorrect", description: "Please enter your current password.", variant: "destructive" });
        return;
      }

      // Update password
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      // Update count in DB
      const now = new Date();
      const lastChangedDate = lastChanged ? new Date(lastChanged) : null;
      const sameMonth = lastChangedDate && lastChangedDate.getMonth() === now.getMonth() && lastChangedDate.getFullYear() === now.getFullYear();
      const newCount = sameMonth ? changeCount + 1 : 1;

      await supabase.from("profiles").update({
        password_change_count: newCount,
        password_last_changed: now.toISOString(),
      } as any).eq("id", user.id);

      toast({ title: "Password changed!", description: "Your password has been updated." });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast({ title: "Reset email sent", description: "Check your email for the password reset link." });
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Lock className="w-5 h-5 text-primary" />
            Change Password
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Old Password</label>
            <Input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">New Password</label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 characters" minLength={6} required />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Confirm New Password</label>
            <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Changing..." : "Change Password"}
          </Button>
          <button type="button" onClick={handleForgotPassword} className="w-full text-xs text-primary hover:underline text-center py-1">
            Forgot Password?
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

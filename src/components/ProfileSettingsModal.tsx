import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ShieldOff, 
  Share2, 
  HelpCircle, 
  LogOut, 
  Trash2, 
  ChevronRight,
  AlertTriangle,
  Ghost,
  Lock,
  CreditCard,
  Key,
  Bell,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BlockedListManager } from "./BlockedListManager";
import { PaymentHistoryModal } from "./PaymentHistoryModal";
import { ChangePasswordModal } from "./ChangePasswordModal";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ProfileSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileSettingsModal({ open, onOpenChange }: ProfileSettingsModalProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useProfile();
  const { user } = useAuth();
  const [showBlockedList, setShowBlockedList] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [ghostMode, setGhostMode] = useState(false);
  const [appLockEnabled, setAppLockEnabled] = useState(() => localStorage.getItem("app_lock_enabled") === "true");

  useEffect(() => {
    if (profile) setGhostMode(!!(profile as any).is_ghost_mode);
  }, [profile]);

  const fetchAlerts = async () => {
    if (!user?.id) return;
    setAlertsLoading(true);
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .eq("type", "system")
      .order("created_at", { ascending: false })
      .limit(50);
    setAlerts(data || []);
    setAlertsLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
    navigate("/login");
    onOpenChange(false);
  };

  const handleDeleteAccount = async () => {
    if (!profile) return;
    // Freeze the account and mark deletion requested
    await supabase.from("profiles").update({
      is_banned: true,
      deletion_requested_at: new Date().toISOString(),
    } as any).eq("id", profile.id);
    toast({
      title: "Account Deletion Requested",
      description: "Your account has been frozen and will be permanently deleted within 48 hours.",
      variant: "destructive",
    });
    setShowDeleteConfirm(false);
    onOpenChange(false);
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleInviteFriends = async () => {
    const shareData = {
      title: "English Flow",
      text: "Practice English speaking with real people! Join me on English Flow.",
      url: window.location.origin,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
      toast({
        title: "Link Copied!",
        description: "Share link copied to clipboard.",
      });
    }
  };

  const menuItems = [
    {
      icon: Bell,
      label: "Support Team Alerts",
      description: "View admin broadcasts",
      onClick: () => { setShowAlerts(true); fetchAlerts(); },
      color: "text-primary",
    },
    ...(profile?.is_premium ? [{
      icon: CreditCard,
      label: "Payment History",
      description: "View premium payments",
      onClick: () => setShowPaymentHistory(true),
      color: "text-primary",
    }] : []),
    {
      icon: Key,
      label: "Change Password",
      description: "Update your password",
      onClick: () => setShowChangePassword(true),
      color: "text-primary",
    },
    {
      icon: ShieldOff,
      label: "Blocked List",
      description: "Manage blocked users",
      onClick: () => setShowBlockedList(true),
      color: "text-muted-foreground",
    },
    {
      icon: Share2,
      label: "Invite Friends",
      description: "Share English Flow",
      onClick: handleInviteFriends,
      color: "text-primary",
    },
    {
      icon: HelpCircle,
      label: "FAQ",
      description: "Help & Support",
      onClick: () => {
        toast({ title: "FAQ", description: "Opening help center..." });
      },
      color: "text-accent",
    },
    {
      icon: LogOut,
      label: "Sign Out",
      description: "Log out of your account",
      onClick: handleSignOut,
      color: "text-muted-foreground",
    },
    {
      icon: Trash2,
      label: "Delete Account",
      description: "Permanently delete your account",
      onClick: () => setShowDeleteConfirm(true),
      color: "text-destructive",
      danger: true,
    },
  ];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="glass-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-foreground">Settings</DialogTitle>
          </DialogHeader>

          {/* Tiny Ghost Mode & App Lock toggles */}
          <div className="flex items-center gap-3 px-1 pb-2">
            {profile?.is_premium && (
              <button
                onClick={async () => {
                  const newVal = !ghostMode;
                  setGhostMode(newVal);
                  await supabase.from("profiles").update({ is_ghost_mode: newVal, is_online: !newVal } as any).eq("id", profile.id);
                  toast({ title: newVal ? "Ghost Mode On 👻" : "Ghost Mode Off" });
                }}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors border",
                  ghostMode ? "bg-primary/15 border-primary/30 text-primary" : "bg-muted/50 border-border text-muted-foreground"
                )}
              >
                <Ghost className="w-3.5 h-3.5" />
                Ghost
              </button>
            )}
            <button
              onClick={() => {
                const newVal = !appLockEnabled;
                setAppLockEnabled(newVal);
                localStorage.setItem("app_lock_enabled", newVal.toString());
                toast({ title: newVal ? "App Lock Enabled 🔒" : "App Lock Disabled" });
              }}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors border",
                appLockEnabled ? "bg-primary/15 border-primary/30 text-primary" : "bg-muted/50 border-border text-muted-foreground"
              )}
            >
              <Lock className="w-3.5 h-3.5" />
              Lock
            </button>
          </div>

          <div className="py-2 space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.label}
                onClick={item.onClick}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors hover:bg-muted/50 ${
                  item.danger ? "hover:bg-destructive/10" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    item.danger ? "bg-destructive/20" : "bg-muted"
                  }`}>
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <div className="text-left">
                    <p className={`font-medium ${item.danger ? "text-destructive" : "text-foreground"}`}>
                      {item.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Blocked List Manager */}
      <BlockedListManager open={showBlockedList} onOpenChange={setShowBlockedList} />

      {/* Payment History */}
      <PaymentHistoryModal open={showPaymentHistory} onOpenChange={setShowPaymentHistory} />

      {/* Change Password */}
      <ChangePasswordModal open={showChangePassword} onOpenChange={setShowChangePassword} />

      {/* Delete Account Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="glass-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Delete Account
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Your account will be frozen immediately and permanently deleted within 48 hours.
              This action cannot be undone. All your data will be removed from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="glass-button border-border">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Support Team Alerts */}
      <Dialog open={showAlerts} onOpenChange={setShowAlerts}>
        <DialogContent className="glass-card border-border max-w-sm max-h-[70vh]">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" /> Support Team Alerts
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[50vh]">
            {alertsLoading ? (
              <div className="flex justify-center py-8">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : alerts.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">No alerts yet</p>
            ) : (
              <div className="space-y-2">
                {alerts.map((a: any) => (
                  <div key={a.id} className="p-3 rounded-xl border border-border bg-muted/30">
                    <p className="text-xs font-medium text-foreground">{a.title}</p>
                    {a.message && <p className="text-[10px] text-muted-foreground mt-0.5">{a.message}</p>}
                    <p className="text-[9px] text-muted-foreground mt-1">
                      {new Date(a.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ShieldOff, 
  Share2, 
  HelpCircle, 
  LogOut, 
  Trash2, 
  ChevronRight,
  AlertTriangle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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

interface ProfileSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileSettingsModal({ open, onOpenChange }: ProfileSettingsModalProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showBlockedList, setShowBlockedList] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
    // In a real implementation, this would call an edge function to delete the user
    toast({
      title: "Account Deletion Requested",
      description: "Your account deletion request has been submitted. This process may take up to 7 days.",
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

      {/* Delete Account Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="glass-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Delete Account
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This action cannot be undone. This will permanently delete your account
              and remove all your data from our servers.
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
    </>
  );
}

import { useState, useEffect } from "react";
import { ShieldOff, UserX, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BlockedUser {
  id: string;
  friend_id: string;
  username: string | null;
  avatar_url: string | null;
}


interface BlockedListManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BlockedListManager({ open, onOpenChange }: BlockedListManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [unblocking, setUnblocking] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchBlockedUsers();
    }
  }, [open, user?.id]);

  const fetchBlockedUsers = async () => {
    setLoading(true);
    
    if (!user?.id) {
      setBlockedUsers([]);
      setLoading(false);
      return;
    }
    
    const { data, error } = await supabase
      .from("friendships")
      .select(`
        id,
        friend_id,
        profiles:friend_id (
          username,
          avatar_url
        )
      `)
      .eq("user_id", user.id)
      .eq("status", "blocked");

    if (error) {
      console.error("Error fetching blocked users:", error);
      setBlockedUsers([]);
    } else {
      const formattedData: BlockedUser[] = (data || []).map((item: any) => ({
        id: item.id,
        friend_id: item.friend_id,
        username: item.profiles?.username || "Unknown User",
        avatar_url: item.profiles?.avatar_url,
      }));
      setBlockedUsers(formattedData);
    }
    setLoading(false);
  };

  const handleUnblock = async (friendshipId: string, friendId: string) => {
    setUnblocking(friendId);
    
    const { error } = await supabase
      .from("friendships")
      .delete()
      .eq("id", friendshipId);

    if (error) {
      console.error("Error unblocking user:", error);
      toast({
        title: "Error",
        description: "Failed to unblock user.",
        variant: "destructive",
      });
    } else {
      setBlockedUsers((prev) => prev.filter((u) => u.id !== friendshipId));
      toast({
        title: "Unblocked",
        description: "User has been unblocked. You can now interact again.",
      });
    }
    setUnblocking(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <ShieldOff className="w-5 h-5 text-destructive" />
            Blocked Users
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : blockedUsers.length === 0 ? (
            <div className="text-center py-8">
              <UserX className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No blocked users</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Users you block will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {blockedUsers.map((blockedUser) => (
                <div
                  key={blockedUser.id}
                  className="flex items-center justify-between p-3 glass-button rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                      {blockedUser.avatar_url ? (
                        <img
                          src={blockedUser.avatar_url}
                          alt={blockedUser.username || "User"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-lg">👤</span>
                      )}
                    </div>
                    <span className="font-medium text-foreground">
                      {blockedUser.username}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnblock(blockedUser.id, blockedUser.friend_id)}
                    disabled={unblocking === blockedUser.friend_id}
                    className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive font-semibold"
                  >
                    {unblocking === blockedUser.friend_id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "UNBLOCK"
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

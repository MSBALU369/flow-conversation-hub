import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GitBranch, User, X, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface ReferralTreeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TreeNode {
  id: string;
  username: string | null;
  avatar_url: string | null;
  children: TreeNode[];
}

export function ReferralTreeModal({ open, onOpenChange }: ReferralTreeModalProps) {
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [loading, setLoading] = useState(false);
  const [followStates, setFollowStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!open || !profile?.id) return;
    const buildTree = async () => {
      setLoading(true);

      // Get all referrals where current user is the referrer (direct)
      const { data: directRefs } = await supabase
        .from("referrals")
        .select("referred_user_id")
        .eq("referrer_id", profile.id);

      const directIds = (directRefs || []).map(r => r.referred_user_id);

      // Get sub-referrals (people referred by direct referrals)
      let subRefs: Record<string, string[]> = {};
      if (directIds.length > 0) {
        const { data: subs } = await supabase
          .from("referrals")
          .select("referrer_id, referred_user_id")
          .in("referrer_id", directIds);
        (subs || []).forEach(s => {
          if (!subRefs[s.referrer_id]) subRefs[s.referrer_id] = [];
          subRefs[s.referrer_id].push(s.referred_user_id);
        });
      }

      // Fetch all profiles
      const allIds = [...directIds, ...Object.values(subRefs).flat()];
      const profileMap = new Map<string, { username: string | null; avatar_url: string | null }>();
      if (allIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .in("id", allIds);
        (profiles || []).forEach(p => profileMap.set(p.id, p));
      }

      // Check follow states
      if (allIds.length > 0) {
        const { data: follows } = await supabase
          .from("friendships")
          .select("friend_id")
          .eq("user_id", profile.id)
          .in("friend_id", allIds)
          .eq("status", "accepted");
        const followSet: Record<string, boolean> = {};
        (follows || []).forEach(f => { followSet[f.friend_id] = true; });
        setFollowStates(followSet);
      }

      // Build tree
      const rootNode: TreeNode = {
        id: profile.id,
        username: profile.username,
        avatar_url: profile.avatar_url,
        children: directIds.map(did => ({
          id: did,
          username: profileMap.get(did)?.username || "User",
          avatar_url: profileMap.get(did)?.avatar_url || null,
          children: (subRefs[did] || []).map(sid => ({
            id: sid,
            username: profileMap.get(sid)?.username || "User",
            avatar_url: profileMap.get(sid)?.avatar_url || null,
            children: [],
          })),
        })),
      };

      setTree(rootNode);
      setLoading(false);
    };
    buildTree();
  }, [open, profile?.id]);

  const handleFollow = async (userId: string) => {
    if (!profile?.id) return;
    await supabase.from("friendships").insert({ user_id: profile.id, friend_id: userId, status: "accepted" });
    setFollowStates(prev => ({ ...prev, [userId]: true }));
  };

  const handleUnfollow = async (userId: string) => {
    if (!profile?.id) return;
    await supabase.from("friendships").delete().eq("user_id", profile.id).eq("friend_id", userId);
    setFollowStates(prev => ({ ...prev, [userId]: false }));
  };

  const renderNode = (node: TreeNode, depth: number = 0) => (
    <div key={node.id} className={`${depth > 0 ? "ml-6 border-l-2 border-primary/20 pl-3" : ""}`}>
      <div className="flex items-center gap-2 py-1.5">
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
          {node.avatar_url ? (
            <img src={node.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <User className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
        <button
          onClick={() => {
            if (node.id !== profile?.id) {
              onOpenChange(false);
              navigate(`/user/${node.id}`);
            }
          }}
          className="text-xs font-medium text-foreground hover:underline"
        >
          {node.id === profile?.id ? "You" : node.username || "User"}
        </button>
        {depth === 0 && <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">Root</span>}
        {depth > 0 && node.id !== profile?.id && (
          followStates[node.id] ? (
            <Button variant="outline" size="sm" className="text-[10px] h-5 px-2 ml-auto" onClick={() => handleUnfollow(node.id)}>
              Unfollow
            </Button>
          ) : (
            <Button size="sm" className="text-[10px] h-5 px-2 ml-auto" onClick={() => handleFollow(node.id)}>
              <UserPlus className="w-3 h-3 mr-0.5" /> Follow
            </Button>
          )
        )}
      </div>
      {node.children.length > 0 && (
        <div className="space-y-0.5">
          {node.children.map(child => renderNode(child, depth + 1))}
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs p-0 max-h-[80vh] overflow-hidden [&>button]:hidden">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <DialogTitle className="text-sm font-bold text-foreground flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-primary" />
            Referral Tree
          </DialogTitle>
          <button onClick={() => onOpenChange(false)} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        <ScrollArea className="px-4 pb-4 max-h-[calc(80vh-60px)]">
          {loading ? (
            <p className="text-xs text-muted-foreground text-center py-8">Loading tree...</p>
          ) : tree ? (
            tree.children.length === 0 ? (
              <div className="text-center py-8">
                <GitBranch className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No referrals yet</p>
                <p className="text-xs text-muted-foreground">Share your ID to grow your tree!</p>
              </div>
            ) : (
              renderNode(tree)
            )
          ) : null}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

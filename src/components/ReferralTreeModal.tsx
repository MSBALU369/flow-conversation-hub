import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GitBranch, User, X, UserPlus, UserMinus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { UserProfilePopup } from "@/components/UserProfilePopup";

interface ReferralTreeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TreeNode {
  id: string;
  username: string | null;
  avatar_url: string | null;
  level: number | null;
  is_online: boolean | null;
  country: string | null;
  region: string | null;
  location_city: string | null;
  children: TreeNode[];
}

export function ReferralTreeModal({ open, onOpenChange }: ReferralTreeModalProps) {
  const { profile } = useProfile();
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [loading, setLoading] = useState(false);
  const [followStates, setFollowStates] = useState<Record<string, boolean>>({});
  const [followLoading, setFollowLoading] = useState<Record<string, boolean>>({});
  const [popupUser, setPopupUser] = useState<{
    id: string;
    name: string;
    avatar: string | null;
    level: number;
    location?: string;
    isOnline: boolean;
    followersCount: number;
    followingCount: number;
  } | null>(null);

  useEffect(() => {
    if (!open || !profile?.id) return;
    const buildTree = async () => {
      setLoading(true);

      const { data: directRefs } = await supabase
        .from("referrals")
        .select("referred_user_id")
        .eq("referrer_id", profile.id);

      const directIds = (directRefs || []).map(r => r.referred_user_id);

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

      const allIds = [...directIds, ...Object.values(subRefs).flat()];
      const profileMap = new Map<string, { username: string | null; avatar_url: string | null; level: number | null; is_online: boolean | null; country: string | null; region: string | null; location_city: string | null }>();
      if (allIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, avatar_url, level, is_online, country, region, location_city")
          .in("id", allIds);
        (profiles || []).forEach(p => profileMap.set(p.id, p));
      }

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

      const makeNode = (id: string): TreeNode => {
        const p = profileMap.get(id);
        return {
          id,
          username: p?.username || "User",
          avatar_url: p?.avatar_url || null,
          level: p?.level ?? 1,
          is_online: p?.is_online ?? false,
          country: p?.country || null,
          region: p?.region || null,
          location_city: p?.location_city || null,
          children: (subRefs[id] || []).map(sid => makeNode(sid)),
        };
      };

      const rootNode: TreeNode = {
        id: profile.id,
        username: profile.username,
        avatar_url: profile.avatar_url,
        level: profile.level,
        is_online: true,
        country: profile.country,
        region: profile.region,
        location_city: profile.location_city || null,
        children: directIds.map(did => makeNode(did)),
      };

      setTree(rootNode);
      setLoading(false);
    };
    buildTree();
  }, [open, profile?.id]);

  // Real-time sync for follow states
  useEffect(() => {
    if (!open || !profile?.id) return;
    const channel = supabase
      .channel(`referral-tree-follows-${profile.id}`)
      .on("postgres_changes" as any, { event: "*", schema: "public", table: "friendships", filter: `user_id=eq.${profile.id}` }, async () => {
        const { data: follows } = await supabase
          .from("friendships")
          .select("friend_id")
          .eq("user_id", profile.id)
          .eq("status", "accepted");
        const followSet: Record<string, boolean> = {};
        (follows || []).forEach(f => { followSet[f.friend_id] = true; });
        setFollowStates(followSet);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [open, profile?.id]);

  const handleFollow = useCallback(async (userId: string) => {
    if (!profile?.id || followLoading[userId]) return;
    setFollowLoading(prev => ({ ...prev, [userId]: true }));
    await supabase.from("friendships").insert({ user_id: profile.id, friend_id: userId, status: "accepted" });
    const { sendFollowNotification } = await import("@/lib/followNotification");
    sendFollowNotification(profile.id, userId);
    setFollowStates(prev => ({ ...prev, [userId]: true }));
    setFollowLoading(prev => ({ ...prev, [userId]: false }));
  }, [profile?.id, followLoading]);

  const handleUnfollow = useCallback(async (userId: string) => {
    if (!profile?.id || followLoading[userId]) return;
    setFollowLoading(prev => ({ ...prev, [userId]: true }));
    await supabase.from("friendships").delete().eq("user_id", profile.id).eq("friend_id", userId);
    setFollowStates(prev => ({ ...prev, [userId]: false }));
    setFollowLoading(prev => ({ ...prev, [userId]: false }));
  }, [profile?.id, followLoading]);

  const openUserPopup = useCallback(async (node: TreeNode) => {
    const [{ count: followingCount }, { count: followersCount }] = await Promise.all([
      supabase.from("friendships").select("*", { count: "exact", head: true }).eq("user_id", node.id).eq("status", "accepted"),
      supabase.from("friendships").select("*", { count: "exact", head: true }).eq("friend_id", node.id).eq("status", "accepted"),
    ]);
    setPopupUser({
      id: node.id,
      name: node.username || "User",
      avatar: node.avatar_url,
      level: node.level ?? 1,
      isOnline: node.is_online ?? false,
      location: [node.location_city, node.region, node.country].filter(Boolean).join(", ") || undefined,
      followersCount: followersCount ?? 0,
      followingCount: followingCount ?? 0,
    });
  }, []);

  const depthLabel = (depth: number) => {
    if (depth === 0) return "Root";
    if (depth === 1) return "Level 1";
    return `Level ${depth}`;
  };

  const renderNode = (node: TreeNode, depth: number = 0) => (
    <div key={node.id} className={`${depth > 0 ? "ml-6 border-l-2 border-primary/20 pl-3" : ""}`}>
      <div className="flex items-center gap-2 py-1.5">
        <button
          onClick={() => node.id !== profile?.id && openUserPopup(node)}
          className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0 hover:ring-2 hover:ring-primary/40 transition-all"
        >
          {node.avatar_url ? (
            <img src={node.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <User className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
        <button
          onClick={() => node.id !== profile?.id && openUserPopup(node)}
          className="text-xs font-medium text-foreground hover:underline"
        >
          {node.id === profile?.id ? "You" : node.username || "User"}
        </button>
        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
          depth === 0 ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
        }`}>
          {depthLabel(depth)}
        </span>
        {depth > 0 && node.id !== profile?.id && (
          followStates[node.id] ? (
            <Button
              variant="outline"
              size="sm"
              className="text-[10px] h-5 px-2 ml-auto"
              onClick={() => handleUnfollow(node.id)}
              disabled={followLoading[node.id]}
            >
              Unfollow
            </Button>
          ) : (
            <Button
              size="sm"
              className="text-[10px] h-5 px-2 ml-auto"
              onClick={() => handleFollow(node.id)}
              disabled={followLoading[node.id]}
            >
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
    <>
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

      {/* Inline UserProfilePopup for drilled user */}
      {popupUser && (
        <UserProfilePopup
          open={!!popupUser}
          onOpenChange={(open) => !open && setPopupUser(null)}
          user={popupUser}
        />
      )}
    </>
  );
}

import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LevelBadge } from "@/components/ui/LevelBadge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin, BarChart3, Users, UserPlus, UserMinus, MessageCircle, MoreVertical, VolumeX, Ban, Heart, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { sendFollowNotification } from "@/lib/followNotification";

const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface UserProfilePopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    name: string;
    avatar: string | null;
    level: number;
    location?: string;
    isOnline: boolean;
    followersCount: number;
    followingCount: number;
    fansCount?: number;
    weeklyData?: { day: string; minutes: number }[];
  };
  myName?: string;
  myWeeklyData?: { day: string; minutes: number }[];
}

type ViewMode = "profile" | "following" | "followers" | "fans";

interface ListUser {
  id: string;
  username: string | null;
  avatar_url: string | null;
  level: number | null;
}

function CompareGraphInline({
  userName,
  friendName,
  myData,
  friendData,
}: {
  userName: string;
  friendName: string;
  myData: { day: string; minutes: number }[];
  friendData: { day: string; minutes: number }[];
}) {
  const maxMin = Math.max(...myData.map((d) => d.minutes), ...friendData.map((d) => d.minutes), 1);
  const cW = 260, cH = 120, pL = 36, pR = 10, pB = 10;
  const plotW = cW - pL - pR, plotH = cH - 10 - pB;
  const toPoints = (data: typeof myData) =>
    data.map((d, i) => ({
      x: pL + (i / (data.length - 1)) * plotW,
      y: cH - pB - (d.minutes / maxMin) * plotH,
    }));
  const toPath = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ");
  const myPts = toPoints(myData), friendPts = toPoints(friendData);
  const myTotal = myData.reduce((s, d) => s + d.minutes, 0);
  const friendTotal = friendData.reduce((s, d) => s + d.minutes, 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-center gap-4 text-[10px]">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#9ca3af" }} />
          <span className="text-muted-foreground">{userName} ({myTotal}m)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#38bdf8" }} />
          <span className="text-muted-foreground">{friendName} ({friendTotal}m)</span>
        </div>
      </div>
      <div className="flex justify-center">
        <svg width={cW} height={cH + 18} viewBox={`0 0 ${cW} ${cH + 18}`}>
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
            const y = cH - pB - pct * plotH;
            return (
              <g key={pct}>
                <line x1={pL} y1={y} x2={cW - pR} y2={y} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.15} />
                <text x={pL - 5} y={y + 3} textAnchor="end" fontSize={8} fontWeight="bold" fill="hsl(var(--foreground))">
                  {Math.round(pct * maxMin)}m
                </text>
              </g>
            );
          })}
          <path d={toPath(myPts)} fill="none" stroke="#9ca3af" strokeWidth={2} />
          {myPts.map((p, i) => <circle key={`m${i}`} cx={p.x} cy={p.y} r={2.5} fill="#9ca3af" />)}
          <path d={toPath(friendPts)} fill="none" stroke="#38bdf8" strokeWidth={2} />
          {friendPts.map((p, i) => <circle key={`f${i}`} cx={p.x} cy={p.y} r={2.5} fill="#38bdf8" />)}
          {dayLabels.map((day, i) => {
            const x = pL + (i / (dayLabels.length - 1)) * plotW;
            return (
              <text key={day} x={x} y={cH + 14} textAnchor="middle" fontSize={9} fontWeight="bold" fill="hsl(var(--foreground))">
                {day}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export function UserProfilePopup({ open, onOpenChange, user: initialUser, myName = "You", myWeeklyData }: UserProfilePopupProps) {
  const { profile: myProfile } = useProfile();
  const { toast } = useToast();

  // Stack for infinite drill-down
  const [userStack, setUserStack] = useState<UserProfilePopupProps["user"][]>([]);
  const currentUser = userStack.length > 0 ? userStack[userStack.length - 1] : initialUser;

  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("profile");
  const [listUsers, setListUsers] = useState<ListUser[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [liveFollowers, setLiveFollowers] = useState(currentUser.followersCount);
  const [liveFollowing, setLiveFollowing] = useState(currentUser.followingCount);

  // Reset state when dialog opens or user changes
  useEffect(() => {
    if (open) {
      setUserStack([]);
      setViewMode("profile");
      setListUsers([]);
    }
  }, [open, initialUser.id]);

  // Fetch real counts & follow state for current user
  useEffect(() => {
    if (!open || !currentUser.id) return;
    const fetchState = async () => {
      const [{ count: followingCount }, { count: followersCount }] = await Promise.all([
        supabase.from("friendships").select("*", { count: "exact", head: true }).eq("user_id", currentUser.id).eq("status", "accepted"),
        supabase.from("friendships").select("*", { count: "exact", head: true }).eq("friend_id", currentUser.id).eq("status", "accepted"),
      ]);
      setLiveFollowing(followingCount ?? 0);
      setLiveFollowers(followersCount ?? 0);

      if (myProfile?.id) {
        const { data } = await supabase
          .from("friendships")
          .select("id")
          .eq("user_id", myProfile.id)
          .eq("friend_id", currentUser.id)
          .eq("status", "accepted")
          .maybeSingle();
        setIsFollowing(!!data);

        // Fetch all my follows for list buttons
        const { data: allFollows } = await supabase
          .from("friendships")
          .select("friend_id")
          .eq("user_id", myProfile.id)
          .eq("status", "accepted");
        setFollowedIds(new Set((allFollows || []).map(f => f.friend_id)));
      }
    };
    fetchState();
  }, [open, currentUser.id, myProfile?.id]);

  // Real-time subscription for friendships changes
  useEffect(() => {
    if (!open || !currentUser.id) return;
    const channel = supabase
      .channel(`popup-friendships-${currentUser.id}`)
      .on("postgres_changes" as any, { event: "*", schema: "public", table: "friendships" }, async () => {
        const [{ count: fc }, { count: flc }] = await Promise.all([
          supabase.from("friendships").select("*", { count: "exact", head: true }).eq("user_id", currentUser.id).eq("status", "accepted"),
          supabase.from("friendships").select("*", { count: "exact", head: true }).eq("friend_id", currentUser.id).eq("status", "accepted"),
        ]);
        setLiveFollowing(fc ?? 0);
        setLiveFollowers(flc ?? 0);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [open, currentUser.id]);

  const handleFollow = useCallback(async () => {
    if (!myProfile?.id || followLoading) return;
    setFollowLoading(true);
    const newState = !isFollowing;
    setIsFollowing(newState);
    if (newState) {
      await supabase.from("friendships").insert({ user_id: myProfile.id, friend_id: currentUser.id, status: "accepted" });
      sendFollowNotification(myProfile.id, currentUser.id);
      setFollowedIds(prev => new Set(prev).add(currentUser.id));
    } else {
      await supabase.from("friendships").delete().eq("user_id", myProfile.id).eq("friend_id", currentUser.id);
      setFollowedIds(prev => { const n = new Set(prev); n.delete(currentUser.id); return n; });
    }
    setFollowLoading(false);
  }, [myProfile?.id, isFollowing, currentUser.id, followLoading]);

  const handleToggleFollowInList = useCallback(async (targetId: string) => {
    if (!myProfile?.id) return;
    const isCurrentlyFollowed = followedIds.has(targetId);
    if (isCurrentlyFollowed) {
      await supabase.from("friendships").delete().eq("user_id", myProfile.id).eq("friend_id", targetId);
      setFollowedIds(prev => { const n = new Set(prev); n.delete(targetId); return n; });
    } else {
      await supabase.from("friendships").insert({ user_id: myProfile.id, friend_id: targetId, status: "accepted" });
      sendFollowNotification(myProfile.id, targetId);
      setFollowedIds(prev => new Set(prev).add(targetId));
    }
  }, [myProfile?.id, followedIds]);

  const openList = useCallback(async (type: "following" | "followers" | "fans") => {
    setViewMode(type);
    setListLoading(true);
    setListUsers([]);
    try {
      let userIds: string[] = [];
      if (type === "following") {
        const { data } = await supabase.from("friendships").select("friend_id").eq("user_id", currentUser.id).eq("status", "accepted");
        userIds = (data || []).map(f => f.friend_id);
      } else if (type === "followers") {
        const { data } = await supabase.from("friendships").select("user_id").eq("friend_id", currentUser.id).eq("status", "accepted");
        userIds = (data || []).map(f => f.user_id);
      } else {
        const { data: followersData } = await supabase.from("friendships").select("user_id").eq("friend_id", currentUser.id).eq("status", "accepted");
        const followerIds = (followersData || []).map(f => f.user_id);
        const { data: followingData } = await supabase.from("friendships").select("friend_id").eq("user_id", currentUser.id).eq("status", "accepted");
        const followingSet = new Set((followingData || []).map(f => f.friend_id));
        userIds = followerIds.filter(id => !followingSet.has(id));
      }
      if (userIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("id, username, avatar_url, level").in("id", userIds);
        setListUsers(profiles || []);
      }
    } catch (err) {
      console.error("Error fetching list:", err);
    }
    setListLoading(false);
  }, [currentUser.id]);

  // Drill into a user from the list
  const drillIntoUser = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, level, is_online, country, region, location_city")
      .eq("id", userId)
      .maybeSingle();
    if (data) {
      setUserStack(prev => [...prev, {
        id: data.id,
        name: data.username || "User",
        avatar: data.avatar_url,
        level: data.level ?? 1,
        isOnline: data.is_online ?? false,
        location: [data.location_city, data.region, data.country].filter(Boolean).join(", ") || undefined,
        followersCount: 0,
        followingCount: 0,
      }]);
      setViewMode("profile");
    }
  }, []);

  const goBack = useCallback(() => {
    if (viewMode !== "profile") {
      setViewMode("profile");
    } else if (userStack.length > 0) {
      setUserStack(prev => prev.slice(0, -1));
    }
  }, [viewMode, userStack.length]);

  const canGoBack = viewMode !== "profile" || userStack.length > 0;

  const defaultMyData = dayLabels.map((day) => ({ day, minutes: Math.floor(Math.random() * 40) + 5 }));
  const defaultFriendData = currentUser.weeklyData || dayLabels.map((day) => ({ day, minutes: Math.floor(Math.random() * 45) + 5 }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border max-w-xs p-0 overflow-hidden [&>button]:hidden">
        {/* Header with back button */}
        {canGoBack && (
          <button
            onClick={goBack}
            className="absolute top-3 left-3 z-10 p-1.5 rounded-full bg-background/70 backdrop-blur-sm hover:bg-background/90 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </button>
        )}

        {viewMode === "profile" ? (
          <>
            {/* Top banner */}
            <div className="h-16 bg-gradient-to-r from-primary/30 to-accent/30 relative" />

            {/* Avatar row with 3-dot menu */}
            <div className="flex items-start justify-center -mt-8 px-4 relative">
              <div className="flex flex-col items-center flex-1">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-muted border-4 border-background flex items-center justify-center text-2xl font-bold text-foreground overflow-hidden">
                    {currentUser.avatar ? (
                      <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                    ) : (
                      currentUser.name[0]?.toUpperCase()
                    )}
                  </div>
                  {currentUser.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[hsl(var(--ef-online))] rounded-full border-2 border-background" />
                  )}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="absolute right-4 top-5 p-1.5 rounded-full hover:bg-muted transition-colors">
                    <MoreVertical className="w-4 h-4 text-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[140px]">
                  <DropdownMenuItem className="gap-2 text-sm">
                    <VolumeX className="w-4 h-4" /> Mute
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 text-sm text-destructive focus:text-destructive">
                    <Ban className="w-4 h-4" /> Block
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex flex-col items-center px-4 pb-4">
              {/* Name & Level */}
              <h3 className="text-lg font-bold text-foreground mt-2">{currentUser.name}</h3>
              <div className="mt-1">
                <LevelBadge level={currentUser.level} size="sm" />
              </div>

              {/* Location */}
              {currentUser.location && (
                <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  <span>{currentUser.location}</span>
                </div>
              )}

              {/* Clickable Stats row */}
              <div className="flex items-center gap-5 mt-3">
                <button onClick={() => openList("following")} className="text-center hover:opacity-70 transition-opacity">
                  <p className="text-sm font-bold text-foreground">{liveFollowing}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Following</p>
                </button>
                <button onClick={() => openList("followers")} className="text-center hover:opacity-70 transition-opacity">
                  <p className="text-sm font-bold text-foreground">{liveFollowers}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Followers</p>
                </button>
                <button onClick={() => openList("fans")} className="text-center hover:opacity-70 transition-opacity">
                  <p className="text-sm font-bold text-foreground">{currentUser.fansCount ?? 0}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">Fans</p>
                </button>
              </div>

              {/* Action buttons */}
              {currentUser.id !== myProfile?.id && (
                <div className="flex items-center gap-2 mt-3 w-full">
                  <Button
                    onClick={handleFollow}
                    variant={isFollowing ? "outline" : "default"}
                    size="sm"
                    className="flex-1 text-xs"
                    disabled={followLoading}
                  >
                    {isFollowing ? (
                      <><UserMinus className="w-3.5 h-3.5 mr-1" /> Unfollow</>
                    ) : (
                      <><UserPlus className="w-3.5 h-3.5 mr-1" /> Follow</>
                    )}
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 text-xs">
                    <MessageCircle className="w-3.5 h-3.5 mr-1" /> Message
                  </Button>
                </div>
              )}

              {/* Compare Graph */}
              <div className="w-full mt-4 glass-card p-3 rounded-xl">
                <div className="flex items-center gap-1.5 mb-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold text-foreground">Speaking Comparison</span>
                </div>
                <CompareGraphInline
                  userName={myName}
                  friendName={currentUser.name}
                  myData={myWeeklyData || defaultMyData}
                  friendData={defaultFriendData}
                />
              </div>
            </div>
          </>
        ) : (
          /* Followers / Following / Fans List View */
          <div className="pt-10 px-4 pb-4">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              {currentUser.name}'s {viewMode === "following" ? "Following" : viewMode === "followers" ? "Followers" : "Fans"}
            </h3>
            <ScrollArea className="max-h-[55vh]">
              {listLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              ) : listUsers.length === 0 ? (
                <p className="text-center text-muted-foreground text-xs py-10">No users found</p>
              ) : (
                <div className="space-y-1.5">
                  {listUsers.map(u => {
                    const isMe = u.id === myProfile?.id;
                    const amFollowing = followedIds.has(u.id);
                    return (
                      <div key={u.id} className="flex items-center gap-2.5 p-2 rounded-xl bg-muted/50">
                        <button
                          onClick={() => drillIntoUser(u.id)}
                          className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden"
                        >
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs font-medium text-foreground">
                              {(u.username || "U")[0].toUpperCase()}
                            </span>
                          )}
                        </button>
                        <button onClick={() => drillIntoUser(u.id)} className="flex-1 text-left min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{u.username || "User"}</p>
                        </button>
                        {!isMe && (
                          <Button
                            size="sm"
                            variant={amFollowing ? "outline" : "default"}
                            className="h-7 text-[10px] px-2 shrink-0"
                            onClick={() => handleToggleFollowInList(u.id)}
                          >
                            {amFollowing ? "Unfollow" : "Follow"}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

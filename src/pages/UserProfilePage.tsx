import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, MapPin, BarChart3, UserPlus, UserMinus, MessageCircle, MoreVertical, VolumeX, Ban, Copy, Calendar, Music, EyeOff, Users, Heart, Crown, Lock, ExternalLink, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LevelBadge } from "@/components/ui/LevelBadge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { sendFollowNotification } from "@/lib/followNotification";
import { useProfile } from "@/hooks/useProfile";
import { formatSpeakTime, calculateTogetherTotal } from "@/lib/mockData";

const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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
  const cW = 300, cH = 140, pL = 36, pR = 10, pB = 10;
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
      <div className="flex items-center justify-center gap-4 text-[11px]">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#9ca3af" }} />
          <span className="text-muted-foreground">{userName} ({formatSpeakTime(myTotal)})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#38bdf8" }} />
          <span className="text-muted-foreground">{friendName} ({formatSpeakTime(friendTotal)})</span>
        </div>
      </div>
      <div className="flex justify-center">
        <svg width={cW} height={cH + 18} viewBox={`0 0 ${cW} ${cH + 18}`}>
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
            const y = cH - pB - pct * plotH;
            return (
              <g key={pct}>
                <line x1={pL} y1={y} x2={cW - pR} y2={y} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.15} />
                <text x={pL - 5} y={y + 3} textAnchor="end" fontSize={9} fontWeight="bold" fill="hsl(var(--foreground))">
                  {pct * maxMin < 1 && pct > 0 ? `${Math.round(pct * maxMin * 60)}s` : `${Math.round(pct * maxMin)}m`}
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

interface UserState {
  id: string;
  name: string;
  avatar: string | null;
  level: number;
  location?: string;
  isOnline: boolean;
  uniqueId?: string;
  createdAt?: string;
  followersCount: number;
  followingCount: number;
  fansCount?: number;
  weeklyData?: { day: string; minutes: number }[];
  myName?: string;
  myWeeklyData?: { day: string; minutes: number }[];
}

export default function UserProfilePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [stableId] = useState(() => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    return "EF" + Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  });
  const locationHook = useLocation();
  const stateUser = locationHook.state as UserState | null;
  const [user, setUser] = useState<UserState | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const { toast } = useToast();
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const [userStatus, setUserStatus] = useState<string | null>(null);

  // Fetch profile from DB if no state was passed
  // Always fetch real profile + real counts from friendships table
  useEffect(() => {
    if (!id) return;
    setProfileLoading(true);
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, level, is_online, is_ghost_mode, unique_id, created_at, country, region, location_city, description, status_message")
        .eq("id", id)
        .maybeSingle();

      // Compute real counts from friendships table
      const [{ count: followingCount }, { count: followersCount }] = await Promise.all([
        supabase.from("friendships").select("*", { count: "exact", head: true }).eq("user_id", id).eq("status", "accepted"),
        supabase.from("friendships").select("*", { count: "exact", head: true }).eq("friend_id", id).eq("status", "accepted"),
      ]);

      if (data) {
        // Respect ghost mode: if user has ghost mode on, show as offline
        const effectiveOnline = data.is_ghost_mode ? false : (data.is_online ?? false);
        setUser({
          id: data.id,
          name: data.username || "Unknown",
          avatar: data.avatar_url,
          level: data.level ?? 1,
          isOnline: effectiveOnline,
          uniqueId: data.unique_id ?? undefined,
          createdAt: data.created_at,
          followersCount: followersCount ?? 0,
          followingCount: followingCount ?? 0,
          location: [data.location_city, data.region, data.country].filter(Boolean).join(", ") || undefined,
        });
        setUserBio(data.description || null);
        setUserStatus((data as any).status_message || null);
      }
      setProfileLoading(false);

      // Record profile view + send notification
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser && authUser.id !== id) {
        supabase.from("profile_views").insert({ viewer_id: authUser.id, viewed_user_id: id }).then(() => {});
        // Send notification
        const { data: viewerProfile } = await supabase.from("profiles").select("username, is_premium").eq("id", authUser.id).single();
        const { data: viewedProfile } = await supabase.from("profiles").select("is_premium").eq("id", id).single();
        const viewerName = viewerProfile?.username || "Someone";
        const notifMessage = viewedProfile?.is_premium ? `${viewerName} viewed your profile` : "Someone viewed your profile";
        supabase.from("notifications").insert({
          user_id: id,
          type: "profile_view",
          title: "Profile View",
          message: notifMessage,
          from_user_id: authUser.id,
        }).then(() => {});
      }
    };
    fetchProfile();
  }, [id]);
  const [showTalentsModal, setShowTalentsModal] = useState(false);
  const [talents, setTalents] = useState<{ id: string; title: string | null; language: string; likes_count: number; plays_count: number; duration_sec: number | null; created_at: string }[]>([]);
  const [loadingTalents, setLoadingTalents] = useState(false);
  const [hiddenTalents, setHiddenTalents] = useState<Set<string>>(new Set());
  const [showPremiumPrompt, setShowPremiumPrompt] = useState(false);
  const [userBio, setUserBio] = useState<string | null>(null);

  // Relationship list modal
  const [listModal, setListModal] = useState<{ type: "following" | "followers" | "fans"; title: string } | null>(null);
  const [listUsers, setListUsers] = useState<{ id: string; username: string; avatar_url: string | null }[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const { profile: myProfile } = useProfile();

  // Real speaking data from calls table
  const [myWeeklyReal, setMyWeeklyReal] = useState<{ day: string; minutes: number }[]>([]);
  const [friendWeeklyReal, setFriendWeeklyReal] = useState<{ day: string; minutes: number }[]>([]);
  const [mutualMinutes, setMutualMinutes] = useState(0);

  useEffect(() => {
    if (!user?.id || !myProfile?.id) return;
    const fetchCallStats = async () => {
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0=Sun
      const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - mondayOffset);
      weekStart.setHours(0, 0, 0, 0);
      const weekStartISO = weekStart.toISOString();

      const dayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

      const aggregateByDay = (calls: any[]) => {
        const map: Record<string, number> = {};
        dayOrder.forEach(d => map[d] = 0);
        calls.forEach(c => {
          const d = dayNames[new Date(c.created_at).getDay()];
          map[d] = (map[d] || 0) + (c.duration || 0) / 60;
        });
        return dayOrder.map(day => ({ day, minutes: map[day] }));
      };

      // Fetch MY call_history this week
      const { data: myCalls } = await supabase
        .from("call_history")
        .select("partner_name, duration, created_at")
        .eq("user_id", myProfile.id)
        .gte("created_at", weekStartISO);

      setMyWeeklyReal(aggregateByDay(myCalls || []));

      // Fetch the OPPONENT's username to match partner_name
      const opponentName = user.name;

      // Mutual calls = my calls where partner is this user
      const mutualCalls = (myCalls || []).filter(c => c.partner_name === opponentName);
      setFriendWeeklyReal(aggregateByDay(mutualCalls));

      let mutual = 0;
      mutualCalls.forEach(c => {
        mutual += (c.duration || 0) / 60;
      });
      setMutualMinutes(mutual);
    };
    fetchCallStats();
  }, [user?.id, myProfile?.id]);

  // Fetch user bio
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("profiles")
      .select("description")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setUserBio(data?.description || null);
      });
  }, [user?.id]);

  // Fetch my following list to know who I already follow + check if following this user
  useEffect(() => {
    const fetchMyFollowing = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;
      const { data } = await supabase
        .from("friendships")
        .select("friend_id")
        .eq("user_id", authUser.id)
        .eq("status", "accepted");
      if (data) {
        setFollowedIds(new Set(data.map(f => f.friend_id)));
        // Set initial follow state for this user
        if (id && data.some(f => f.friend_id === id)) {
          setIsFollowing(true);
        }
      }
    };
    fetchMyFollowing();
  }, [id]);

  const openListModal = async (type: "following" | "followers" | "fans") => {
    if (!user) return;
    const title = type === "following" ? "Following" : type === "followers" ? "Followers" : "Fans";
    setListModal({ type, title });
    setListLoading(true);
    setListUsers([]);

    try {
      let userIds: string[] = [];

      if (type === "following") {
        const { data } = await supabase
          .from("friendships")
          .select("friend_id")
          .eq("user_id", user.id)
          .eq("status", "accepted");
        userIds = (data || []).map(f => f.friend_id);
      } else if (type === "followers") {
        const { data } = await supabase
          .from("friendships")
          .select("user_id")
          .eq("friend_id", user.id)
          .eq("status", "accepted");
        userIds = (data || []).map(f => f.user_id);
      } else {
        // Fans = followers who the user doesn't follow back
        const { data: followersData } = await supabase
          .from("friendships")
          .select("user_id")
          .eq("friend_id", user.id)
          .eq("status", "accepted");
        const followerIds = (followersData || []).map(f => f.user_id);

        const { data: followingData } = await supabase
          .from("friendships")
          .select("friend_id")
          .eq("user_id", user.id)
          .eq("status", "accepted");
        const followingIds = new Set((followingData || []).map(f => f.friend_id));

        userIds = followerIds.filter(id => !followingIds.has(id));
      }

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .in("id", userIds);
        setListUsers(profiles || []);
      }
    } catch (err) {
      console.error("Error fetching list:", err);
    }
    setListLoading(false);
  };

  const handleToggleFollow = async (targetId: string) => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      toast({ title: "Please log in", description: "You need to be logged in to follow users." });
      return;
    }
    const isCurrentlyFollowed = followedIds.has(targetId);
    if (isCurrentlyFollowed) {
      await supabase
        .from("friendships")
        .delete()
        .eq("user_id", authUser.id)
        .eq("friend_id", targetId);
      setFollowedIds(prev => { const next = new Set(prev); next.delete(targetId); return next; });
      toast({ title: "Unfollowed" });
    } else {
      await supabase
        .from("friendships")
        .insert({ user_id: authUser.id, friend_id: targetId, status: "accepted" });
      setFollowedIds(prev => new Set(prev).add(targetId));
      toast({ title: "Followed!" });
    }
  };

  // No more mock talents - fetch real data only

  useEffect(() => {
    if (!showTalentsModal || !user) return;
    setLoadingTalents(true);
    supabase
      .from("talent_uploads")
      .select("id, title, language, likes_count, plays_count, duration_sec, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setTalents(data && data.length > 0 ? data : []);
        setLoadingTalents(false);
      });
  }, [showTalentsModal, user]);

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast({ title: "Copied!", description: "User ID copied to clipboard" });
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">User not found</p>
      </div>
    );
  }

  const dayLabelsArr = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const emptyWeekData = dayLabelsArr.map(day => ({ day, minutes: 0 }));
  const graphMyData = myWeeklyReal.length > 0 ? myWeeklyReal : emptyWeekData;
  const graphFriendData = friendWeeklyReal.length > 0 ? friendWeeklyReal : emptyWeekData;

  return (
    <div className="min-h-screen bg-background">
      {/* Banner with back button and 3-dot menu */}
      <div className="h-32 bg-gradient-to-r from-primary/30 to-accent/30 relative">
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 p-2 rounded-full bg-background/60 backdrop-blur-sm hover:bg-background/80 transition-colors safe-top"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="absolute top-4 right-4 p-2 rounded-full bg-background/60 backdrop-blur-sm hover:bg-background/80 transition-colors safe-top">
              <MoreVertical className="w-5 h-5 text-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[140px] bg-background border-border z-50">
            <DropdownMenuItem className="gap-2 text-sm" onClick={() => setShowTalentsModal(true)}>
              <Music className="w-4 h-4" /> Talents
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 text-sm">
              <VolumeX className="w-4 h-4" /> Mute
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 text-sm text-destructive focus:text-destructive">
              <Ban className="w-4 h-4" /> Block
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Profile content */}
      <div className="flex flex-col items-center -mt-14 px-6 pb-8">
        {/* Avatar */}
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-muted border-4 border-background flex items-center justify-center text-3xl font-bold text-foreground overflow-hidden">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              user.name[0]?.toUpperCase()
            )}
          </div>
          {user.isOnline && (
            <div className="absolute bottom-1 right-1 w-4 h-4 bg-[hsl(var(--ef-online))] rounded-full border-2 border-background" />
          )}
        </div>

        {/* Name & Level */}
        <h2 className="text-xl font-bold text-foreground mt-3">{user.name}</h2>
        {userStatus && (
          <p className="text-xs text-muted-foreground italic mt-0.5">"{userStatus}"</p>
        )}
        <div className="mt-1.5">
          <LevelBadge level={user.level} size="sm" />
        </div>

        {/* Location */}
        <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
          <MapPin className="w-3.5 h-3.5" />
          <span>{user.location || "Mumbai, India"}</span>
        </div>

        {/* User ID & Joining Date */}
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{user.uniqueId || stableId}</span>
            <button onClick={() => handleCopyId(user.uniqueId || stableId)} className="p-1 rounded hover:bg-muted transition-colors">
              <Copy className="w-3 h-3" />
            </button>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>{user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "Jan 2025"}</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-6 mt-5">
          <button onClick={() => openListModal("following")} className="flex flex-col items-center gap-0.5 hover:opacity-80 transition-opacity">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-lg font-bold text-foreground">{user.followingCount}</span>
            </div>
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Following</span>
          </button>
          <button onClick={() => openListModal("followers")} className="flex flex-col items-center gap-0.5 hover:opacity-80 transition-opacity">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-lg font-bold text-foreground">{user.followersCount}</span>
            </div>
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Followers</span>
          </button>
          <button onClick={() => openListModal("fans")} className="flex flex-col items-center gap-0.5 hover:opacity-80 transition-opacity">
            <div className="flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-destructive" />
              <span className="text-lg font-bold text-foreground">{user.fansCount ?? 0}</span>
            </div>
            <span className="text-xs text-muted-foreground uppercase tracking-wide">Fans</span>
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 mt-5 w-full max-w-xs">
          <Button
            onClick={async () => {
              if (!user?.id || !myProfile?.id) return;
              const newState = !isFollowing;
              setIsFollowing(newState);
              if (newState) {
                await supabase.from("friendships").insert({ user_id: myProfile.id, friend_id: user.id, status: "accepted" });
                sendFollowNotification(myProfile.id, user.id);
              } else {
                await supabase.from("friendships").delete().eq("user_id", myProfile.id).eq("friend_id", user.id);
              }
              // Refetch real counts from friendships
              const [{ count: newFollowing }, { count: newFollowers }] = await Promise.all([
                supabase.from("friendships").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "accepted"),
                supabase.from("friendships").select("*", { count: "exact", head: true }).eq("friend_id", user.id).eq("status", "accepted"),
              ]);
              setUser(prev => prev ? { ...prev, followersCount: newFollowers ?? 0, followingCount: newFollowing ?? 0 } : prev);
            }}
            variant={isFollowing ? "outline" : "default"}
            size="sm"
            className="flex-1"
          >
            {isFollowing ? (
              <><UserMinus className="w-4 h-4 mr-1.5" /> Unfollow</>
            ) : (
              <><UserPlus className="w-4 h-4 mr-1.5" /> Follow</>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            disabled={!isFollowing}
            onClick={() => {
              if (isFollowing) {
                navigate("/chat");
              } else {
                toast({ title: "Follow first", description: "You need to follow this user before sending messages." });
              }
            }}
          >
            <MessageCircle className="w-4 h-4 mr-1.5" /> Message
          </Button>
        </div>

        {/* Compare Graph */}
        <div className="w-full max-w-xs mt-6 glass-card p-4 rounded-xl">
          <div className="flex items-center gap-1.5 mb-3">
            <BarChart3 className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Speaking Comparison</span>
          </div>
          {(() => {
            const myTotal = graphMyData.reduce((s, d) => s + d.minutes, 0);
            const partnerTotal = graphFriendData.reduce((s, d) => s + d.minutes, 0);
            const safeMutual = Math.min(mutualMinutes, myTotal, partnerTotal);
            return (
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-[hsl(0,0%,90%)]/60 dark:bg-[hsl(0,0%,25%)]/40 rounded-lg px-2 py-1 text-center">
              <span className="text-[9px] text-muted-foreground block">You</span>
              <p className="text-xs font-bold text-[hsl(0,0%,20%)] dark:text-[hsl(0,0%,85%)]">{formatSpeakTime(myTotal)}</p>
            </div>
            <div className="bg-[hsl(140,40%,90%)]/60 dark:bg-[hsl(140,30%,20%)]/40 rounded-lg px-2 py-1 text-center">
              <span className="text-[9px] text-muted-foreground block">{user.name}</span>
              <p className="text-xs font-bold text-[hsl(140,50%,30%)] dark:text-[hsl(140,50%,60%)]">{formatSpeakTime(partnerTotal)}</p>
            </div>
            <div className="bg-[hsl(220,50%,93%)]/60 dark:bg-[hsl(220,40%,20%)]/40 rounded-lg px-2 py-1 text-center">
              <span className="text-[9px] text-muted-foreground block">Mutual Talk</span>
              <p className="text-xs font-bold text-[hsl(220,60%,45%)] dark:text-[hsl(220,60%,65%)]">{formatSpeakTime(safeMutual)}</p>
            </div>
            <div className="bg-[hsl(0,60%,93%)]/60 dark:bg-[hsl(0,40%,20%)]/40 rounded-lg px-2 py-1 text-center">
              <span className="text-[9px] text-muted-foreground block">Together Total</span>
              <p className="text-xs font-bold text-[hsl(0,70%,45%)] dark:text-[hsl(0,70%,60%)]">{formatSpeakTime(myTotal + partnerTotal)}</p>
            </div>
          </div>
            );
          })()}
          <CompareGraphInline
            userName={myProfile?.username || "You"}
            friendName={"With " + user.name}
            myData={graphMyData}
            friendData={graphFriendData}
          />
        </div>

        {/* About Me / Bio */}
        <div className="w-full max-w-xs mt-4 glass-card p-4 rounded-xl">
          <p className="text-xs font-semibold text-foreground mb-1.5">About</p>
          <p className="text-sm text-muted-foreground leading-relaxed">{userBio || "Hello 👋"}</p>
        </div>
      </div>

      {/* Talents Modal */}
      <Dialog open={showTalentsModal} onOpenChange={setShowTalentsModal}>
        <DialogContent className="glass-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Music className="w-5 h-5 text-primary" />
              {user.name}'s Talents
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto space-y-2 py-2">
            {loadingTalents ? (
              <p className="text-center text-muted-foreground text-sm py-8">Loading...</p>
            ) : talents.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">No talents uploaded yet</p>
            ) : (
              talents.map((t) => (
                <div
                  key={t.id}
                  className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
                    hiddenTalents.has(t.id) ? "opacity-40 bg-muted/30" : "bg-muted/50"
                  }`}
                >
                  <button
                    className="flex-1 min-w-0 text-left"
                    onClick={() => {
                      setShowTalentsModal(false);
                      navigate("/talent");
                    }}
                  >
                    <p className="text-sm font-medium text-foreground truncate">{t.title || "Untitled"}</p>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                      <span>{t.language}</span>
                      <span>•</span>
                      <span>❤️ {t.likes_count}</span>
                      <span>•</span>
                      <span>▶ {t.plays_count}</span>
                    </div>
                  </button>
                  <div className="flex items-center gap-1 ml-2">
                    {/* Hide talent - Premium only */}
                    <button
                      onClick={() => {
                        const isPremium = false; // TODO: check actual premium status
                        if (!isPremium) {
                          setShowPremiumPrompt(true);
                          return;
                        }
                        setHiddenTalents((prev) => {
                          const next = new Set(prev);
                          if (next.has(t.id)) next.delete(t.id);
                          else next.add(t.id);
                          return next;
                        });
                        toast({
                          title: hiddenTalents.has(t.id) ? "Talent visible" : "Talent hidden",
                          description: hiddenTalents.has(t.id) ? "This talent is now visible" : "This talent is now hidden",
                        });
                      }}
                      className="p-2 rounded-lg hover:bg-muted transition-colors"
                      title="Hide talent (Premium)"
                    >
                      <EyeOff className={`w-4 h-4 ${hiddenTalents.has(t.id) ? "text-muted-foreground" : "text-foreground"}`} />
                    </button>
                    {/* Restrict visibility - Premium only */}
                    <button
                      onClick={() => {
                        const isPremium = false;
                        if (!isPremium) {
                          setShowPremiumPrompt(true);
                          return;
                        }
                        toast({
                          title: "Restrict Visibility",
                          description: "Choose who can see this talent (Coming Soon)",
                        });
                      }}
                      className="p-2 rounded-lg hover:bg-muted transition-colors"
                      title="Restrict who can see (Premium)"
                    >
                      <Lock className="w-4 h-4 text-foreground" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          {/* View all on Talent page */}
          <button
            onClick={() => {
              setShowTalentsModal(false);
              navigate("/talent");
            }}
            className="flex items-center justify-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors py-2"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View on Talents Page
          </button>
        </DialogContent>
      </Dialog>

      {/* Premium Prompt Dialog */}
      <Dialog open={showPremiumPrompt} onOpenChange={setShowPremiumPrompt}>
        <DialogContent className="glass-card border-border max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              Premium Feature
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Hide and restrict your talents visibility is available for Premium members only.
          </p>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowPremiumPrompt(false)}>
              Later
            </Button>
            <Button size="sm" className="flex-1" onClick={() => { setShowPremiumPrompt(false); navigate("/premium"); }}>
              <Crown className="w-4 h-4 mr-1" /> Upgrade
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Following/Followers/Fans List Modal */}
      <Dialog open={!!listModal} onOpenChange={(open) => !open && setListModal(null)}>
        <DialogContent className="glass-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-foreground">{listModal?.title}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {listLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : listUsers.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-10">No users found</p>
            ) : (
              <div className="space-y-2 py-1">
                {listUsers.map(u => {
                  const isMe = u.id === myProfile?.id;
                  const amFollowing = followedIds.has(u.id);
                  return (
                    <div key={u.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/50">
                      <button
                        onClick={() => {
                          setListModal(null);
                          navigate(`/user/${u.id}`, {
                            state: {
                              id: u.id,
                              name: u.username || "User",
                              avatar: u.avatar_url,
                              level: 1,
                              isOnline: false,
                              followersCount: 0,
                              followingCount: 0,
                            },
                          });
                        }}
                        className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden"
                      >
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt={u.username || ""} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm font-medium text-foreground">
                            {(u.username || "U")[0].toUpperCase()}
                          </span>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setListModal(null);
                          navigate(`/user/${u.id}`, {
                            state: {
                              id: u.id,
                              name: u.username || "User",
                              avatar: u.avatar_url,
                              level: 1,
                              isOnline: false,
                              followersCount: 0,
                              followingCount: 0,
                            },
                          });
                        }}
                        className="flex-1 text-left min-w-0"
                      >
                        <p className="text-sm font-medium text-foreground truncate">{u.username || "User"}</p>
                      </button>
                      {!isMe && (
                        <Button
                          size="sm"
                          variant={amFollowing ? "outline" : "default"}
                          className="h-8 text-xs shrink-0"
                          onClick={() => handleToggleFollow(u.id)}
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
        </DialogContent>
      </Dialog>
    </div>
  );
}

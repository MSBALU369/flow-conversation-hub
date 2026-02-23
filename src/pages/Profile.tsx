import { useState, useEffect, useCallback } from "react";
import { Copy, Camera, MapPin, Calendar, Mail, Settings, Edit2, BarChart3, Users, Heart, Clock, Globe, GitCompareArrows, Crown, Coins, Gift, UserPlus, CheckCircle2, X, Shield, Send, ArrowDownLeft, GitBranch, Play, Volume2, BadgeCheck, Trash2, AlertTriangle, Trophy, Eye, Lock } from "lucide-react";
import { format, startOfWeek, endOfWeek, getDay } from "date-fns";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { LevelBadge } from "@/components/ui/LevelBadge";
import { ProfileSettingsModal } from "@/components/ProfileSettingsModal";
import { supabase } from "@/integrations/supabase/client";
import { LocationSelector } from "@/components/LocationSelector";
import { getRegionForCountry } from "@/lib/countryRegions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { TrustScoreModal } from "@/components/TrustScoreModal";
import { CoinExchangeModal } from "@/components/CoinExchangeModal";
import { ReferralTreeModal } from "@/components/ReferralTreeModal";
import { CoinTransactionLog } from "@/components/CoinTransactionLog";
import { formatDuration, calculateTogetherTotal, type CompareUser } from "@/lib/mockData";
import { useRole } from "@/hooks/useRole";
import { SmartAppReview } from "@/components/SmartAppReview";
import { TopTalkersModal } from "@/components/TopTalkersModal";
const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export default function Profile() {
  const navigate = useNavigate();
  const {
    profile,
    loading,
    updateProfile
  } = useProfile();
  const { user } = useAuth();
  const { role } = useRole();
  const {
    toast
  } = useToast();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [editName, setEditName] = useState("");
  const [showCompare, setShowCompare] = useState(false);
  const [showCompareList, setShowCompareList] = useState(false);
  const [selectedCompareUser, setSelectedCompareUser] = useState<CompareUser | null>(null);
  const [weeklyData, setWeeklyData] = useState<{
    day: string;
    minutes: number;
  }[]>(dayLabels.map(d => ({
    day: d,
    minutes: 0
  })));
  const [totalWeekMinutes, setTotalWeekMinutes] = useState(0);
  const [totalAllTimeMinutes, setTotalAllTimeMinutes] = useState(0);
  const [showUsersList, setShowUsersList] = useState<"following" | "followers" | "fans" | null>(null);
  const [showCoinsModal, setShowCoinsModal] = useState(false);
  const [referrals, setReferrals] = useState<{ id: string; referred_user_id: string; created_at: string; profile?: { username: string | null; avatar_url: string | null } }[]>([]);
  const [referralsLoading, setReferralsLoading] = useState(false);
  const [followingCount, setFollowingCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [fansCount, setFansCount] = useState(0);
  const [listUsers, setListUsers] = useState<{ id: string; username: string | null; avatar_url: string | null; level: number | null; is_online: boolean | null; location_city: string | null; unique_id: string | null; created_at: string; followers_count: number | null; following_count: number | null }[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [followedBackIds, setFollowedBackIds] = useState<Set<string>>(new Set());
  const [showTrustScore, setShowTrustScore] = useState(false);
  const [editingAboutMe, setEditingAboutMe] = useState(false);
  const [aboutMeText, setAboutMeText] = useState("");
  const [showCoinExchange, setShowCoinExchange] = useState(false);
  const [showReferralTree, setShowReferralTree] = useState(false);
  const [watchingAd, setWatchingAd] = useState(false);
  const [followActionLoading, setFollowActionLoading] = useState<string | null>(null);
  const [adProgress, setAdProgress] = useState(0);
  const [showTopTalkers, setShowTopTalkers] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [showVisitors, setShowVisitors] = useState(false);
  const [visitors, setVisitors] = useState<{ id: string; viewer_id: string; created_at: string; viewer_username?: string; viewer_avatar?: string | null }[]>([]);
  const [visitorsLoading, setVisitorsLoading] = useState(false);
  const [editingStatus, setEditingStatus] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  // Ad watching effect for coins
  useEffect(() => {
    if (!watchingAd) return;
    const interval = setInterval(() => {
      setAdProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setWatchingAd(false);
          // Award 5 coins — strict backend-first
          if (profile) {
            (async () => {
              const { data, error } = await supabase
                .from("profiles")
                .update({ coins: (profile.coins ?? 0) + 5 })
                .eq("id", profile.id)
                .select("coins")
                .single();
              if (!error && data) {
                updateProfile({ coins: data.coins });
                toast({ title: "+5 Coins!", description: "Coins added for watching the ad." });
              } else {
                toast({ title: "Failed to add coins", variant: "destructive" });
              }
            })();
          }
          return 100;
        }
        return prev + (100 / 30); // 30 seconds
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [watchingAd]);

  // Fetch real counts from friendships table
  const fetchCounts = useCallback(async () => {
    if (!profile?.id) return;

    const { count: followingC } = await supabase
      .from("friendships")
      .select("*", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .eq("status", "accepted");

    const { count: followersC } = await supabase
      .from("friendships")
      .select("*", { count: "exact", head: true })
      .eq("friend_id", profile.id)
      .eq("status", "accepted");

    const { data: iFollow } = await supabase
      .from("friendships")
      .select("friend_id")
      .eq("user_id", profile.id)
      .eq("status", "accepted");

    const { data: followMe } = await supabase
      .from("friendships")
      .select("user_id")
      .eq("friend_id", profile.id)
      .eq("status", "accepted");

    const iFollowSet = new Set((iFollow || []).map(f => f.friend_id));
    const followMeIds = (followMe || []).map(f => f.user_id);
    const fans = followMeIds.filter(id => !iFollowSet.has(id));

    setFollowingCount(followingC || 0);
    setFollowersCount(followersC || 0);
    setFansCount(fans.length);
  }, [profile?.id]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  // Fetch user list when a tab is opened
  useEffect(() => {
    if (!showUsersList || !profile?.id) {
      setListUsers([]);
      return;
    }
    const fetchList = async () => {
      setListLoading(true);
      let userIds: string[] = [];

      if (showUsersList === "following") {
        const { data } = await supabase
          .from("friendships")
          .select("friend_id")
          .eq("user_id", profile.id)
          .eq("status", "accepted");
        userIds = (data || []).map(f => f.friend_id);
      } else if (showUsersList === "followers") {
        const { data } = await supabase
          .from("friendships")
          .select("user_id")
          .eq("friend_id", profile.id)
          .eq("status", "accepted");
        userIds = (data || []).map(f => f.user_id);
      } else if (showUsersList === "fans") {
        const { data: iFollow } = await supabase
          .from("friendships")
          .select("friend_id")
          .eq("user_id", profile.id)
          .eq("status", "accepted");
        const { data: followMe } = await supabase
          .from("friendships")
          .select("user_id")
          .eq("friend_id", profile.id)
          .eq("status", "accepted");
        const iFollowSet = new Set((iFollow || []).map(f => f.friend_id));
        userIds = (followMe || []).map(f => f.user_id).filter(id => !iFollowSet.has(id));
      }

      if (userIds.length === 0) {
        setListUsers([]);
        setListLoading(false);
        return;
      }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, level, is_online, location_city, unique_id, created_at, followers_count, following_count")
        .in("id", userIds);

      setListUsers(profiles || []);
      setListLoading(false);
    };
    fetchList();
  }, [showUsersList, profile?.id]);

  const handleUnfollow = async (targetUserId: string) => {
    if (!profile?.id || followActionLoading) return;
    setFollowActionLoading(targetUserId);
    // Optimistic UI update
    setFollowingCount(prev => Math.max(0, prev - 1));
    setListUsers(prev => prev.filter(u => u.id !== targetUserId));
    
    const { error } = await supabase
      .from("friendships")
      .delete()
      .eq("user_id", profile.id)
      .eq("friend_id", targetUserId)
      .eq("status", "accepted");
    
    if (error) {
      fetchCounts();
      toast({ title: "Failed to unfollow", variant: "destructive" });
    } else {
      toast({ title: "Unfollowed", description: "User removed from your following list." });
    }
    setFollowActionLoading(null);
  };

  const handleRemoveFollower = async (targetUserId: string) => {
    if (!profile?.id || followActionLoading) return;
    setFollowActionLoading(targetUserId);
    setFollowersCount(prev => Math.max(0, prev - 1));
    setListUsers(prev => prev.filter(u => u.id !== targetUserId));
    
    const { error } = await supabase
      .from("friendships")
      .delete()
      .eq("user_id", targetUserId)
      .eq("friend_id", profile.id)
      .eq("status", "accepted");
    
    if (error) {
      fetchCounts();
      toast({ title: "Failed to remove follower", variant: "destructive" });
    } else {
      toast({ title: "Removed", description: "Follower removed." });
    }
    setFollowActionLoading(null);
  };

  const handleFollowBack = async (targetUserId: string) => {
    if (!profile?.id || followActionLoading) return;
    setFollowActionLoading(targetUserId);
    await supabase
      .from("friendships")
      .insert({ user_id: profile.id, friend_id: targetUserId, status: "accepted" });
    setFollowedBackIds(prev => new Set(prev).add(targetUserId));
    fetchCounts();
    toast({ title: "Followed", description: "You are now following this user." });
    setFollowActionLoading(null);
  };

  const handleUnfollowBack = async (targetUserId: string) => {
    if (!profile?.id || followActionLoading) return;
    setFollowActionLoading(targetUserId);
    await supabase
      .from("friendships")
      .delete()
      .eq("user_id", profile.id)
      .eq("friend_id", targetUserId);
    setFollowedBackIds(prev => {
      const next = new Set(prev);
      next.delete(targetUserId);
      return next;
    });
    fetchCounts();
    toast({ title: "Unfollowed", description: "You have unfollowed this user." });
    setFollowActionLoading(null);
  };

  // Fetch referrals when coins modal opens
  useEffect(() => {
    if (!showCoinsModal || !profile?.id) return;
    const fetchReferrals = async () => {
      setReferralsLoading(true);
      const { data } = await supabase
        .from("referrals")
        .select("id, referred_user_id, created_at")
        .eq("referrer_id", profile.id)
        .order("created_at", { ascending: false });

      if (data && data.length > 0) {
        const userIds = data.map(r => r.referred_user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .in("id", userIds);
        const profileMap = new Map((profiles || []).map(p => [p.id, p]));
        setReferrals(data.map(r => ({ ...r, profile: profileMap.get(r.referred_user_id) || undefined })));
      } else {
        setReferrals([]);
      }
      setReferralsLoading(false);
    };
    fetchReferrals();
  }, [showCoinsModal, profile?.id]);

  const [compareUsers, setCompareUsers] = useState<CompareUser[]>([]);
  const sampleCompareData = selectedCompareUser?.data || [];

  // Fetch compare users: ONLY mutual friends with call history
  const fetchCompareUsers = useCallback(async () => {
    if (!profile?.id) return;
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });

    // Step 1: Get mutual friends (both directions accepted)
    const { data: iFollow } = await supabase
      .from("friendships")
      .select("friend_id")
      .eq("user_id", profile.id)
      .eq("status", "accepted");
    const { data: followMe } = await supabase
      .from("friendships")
      .select("user_id")
      .eq("friend_id", profile.id)
      .eq("status", "accepted");

    const iFollowSet = new Set((iFollow || []).map(f => f.friend_id));
    const mutualFriendIds = (followMe || []).map(f => f.user_id).filter(id => iFollowSet.has(id));

    if (mutualFriendIds.length === 0) { setCompareUsers([]); return; }

    // Step 2: Get mutual friends' profiles
    const { data: friendProfiles } = await supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", mutualFriendIds);

    const friendProfileMap = new Map((friendProfiles || []).map(p => [p.username, p]));
    const friendUsernameSet = new Set((friendProfiles || []).map(p => p.username).filter(Boolean));

    // Step 3: Get call history and filter to only mutual friends
    const { data: calls } = await supabase
      .from("call_history")
      .select("partner_name, duration, created_at")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(500);

    if (!calls || calls.length === 0) { setCompareUsers([]); return; }

    // Group by partner name, only if they are a mutual friend
    const partnerMap = new Map<string, { totalMin: number; weeklyBuckets: number[] }>();
    calls.forEach(c => {
      const name = c.partner_name || "Anonymous";
      if (!friendUsernameSet.has(name)) return; // STRICT: skip non-friends
      if (!partnerMap.has(name)) partnerMap.set(name, { totalMin: 0, weeklyBuckets: new Array(7).fill(0) });
      const entry = partnerMap.get(name)!;
      entry.totalMin += (c.duration || 0) / 60;
      const d = new Date(c.created_at);
      if (d >= weekStart) {
        const jsDay = getDay(d);
        const idx = jsDay === 0 ? 6 : jsDay - 1;
        entry.weeklyBuckets[idx] += (c.duration || 0) / 60;
      }
    });

    if (partnerMap.size === 0) { setCompareUsers([]); return; }

    const users: CompareUser[] = [...partnerMap.entries()].map(([name, d]) => {
      const fp = friendProfileMap.get(name);
      return {
        id: fp?.id || name,
        name,
        avatar: fp?.avatar_url || null,
        allTimeMinutes: Math.round(d.totalMin),
        data: dayLabels.map((day, i) => ({ day, minutes: Math.round(d.weeklyBuckets[i]) })),
      };
    });

    setCompareUsers(users);
  }, [profile?.id]);

  useEffect(() => { fetchCompareUsers(); }, [fetchCompareUsers]);

  const fetchCallStats = useCallback(async () => {
    const {
      data: {
        user
      }
    } = await supabase.auth.getUser();
    if (!user) return;
    const now = new Date();
    const weekStart = startOfWeek(now, {
      weekStartsOn: 1
    });
    const weekEnd = endOfWeek(now, {
      weekStartsOn: 1
    });

    // Fetch this week's calls
    const {
      data: weekCalls
    } = await supabase.from("call_history").select("duration, created_at").eq("user_id", user.id).gte("created_at", weekStart.toISOString()).lte("created_at", weekEnd.toISOString());

    // Aggregate per day (Mon=0 ... Sun=6)
    const perDay = new Array(7).fill(0);
    (weekCalls || []).forEach(call => {
      const d = new Date(call.created_at);
      // getDay: 0=Sun,1=Mon...6=Sat -> convert to Mon=0...Sun=6
      const jsDay = getDay(d);
      const idx = jsDay === 0 ? 6 : jsDay - 1;
      perDay[idx] += (call.duration || 0) / 60; // seconds to minutes
    });
    setWeeklyData(dayLabels.map((day, i) => ({
      day,
      minutes: Math.round(perDay[i])
    })));
    setTotalWeekMinutes(perDay.reduce((a, b) => a + b, 0));

    // Fetch all-time total
    const {
      data: allCalls
    } = await supabase.from("call_history").select("duration").eq("user_id", user.id);
    const allTime = (allCalls || []).reduce((sum, c) => sum + (c.duration || 0), 0) / 60;
    setTotalAllTimeMinutes(allTime);
  }, []);
  useEffect(() => {
    fetchCallStats();
  }, [fetchCallStats]);
  const copyUniqueId = () => {
    if (profile?.unique_id) {
      navigator.clipboard.writeText(profile.unique_id);
      toast({
        title: "Copied!",
        description: "Account ID copied to clipboard"
      });
    }
  };
  const canEditProfile = () => {
    if (!profile?.last_username_change) return true;
    const lastChange = new Date(profile.last_username_change);
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    // If last change was more than a week ago, allow
    if (lastChange < oneWeekAgo) return true;
    // Count how many times changed this week by checking if last_username_change is within this week
    // Since we only store the last change timestamp, we use a simple rule:
    // Allow max 2 changes per week. We track this by checking the time gap.
    // If the last change was less than 3.5 days ago (half a week), that means likely 2 changes already.
    const diffDays = (now.getTime() - lastChange.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays < 3.5) return false; // Block: too soon after last change
    return true;
  };
  const handleEditName = async () => {
    if (!editName.trim()) return;
    if (!canEditProfile()) {
      toast({
        title: "Edit Limit Reached",
        description: "You can only change your name twice per week. Try again later.",
        variant: "destructive"
      });
      return;
    }
    const { error } = await updateProfile({
      username: editName,
      last_username_change: new Date().toISOString(),
    } as any);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: "Updated!",
      description: "Your name has been changed."
    });
    setShowEditModal(false);
  };
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Max size is 5MB",
        variant: "destructive"
      });
      return;
    }
    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${profile.id}/avatar_${Date.now()}.${ext}`;
      const {
        error: uploadError
      } = await supabase.storage.from("avatars").upload(path, file, {
        upsert: false
      });
      if (uploadError) throw uploadError;
      const {
        data: {
          publicUrl
        }
      } = supabase.storage.from("avatars").getPublicUrl(path);
      await updateProfile({
        avatar_url: publicUrl
      });
      toast({
        title: "Profile picture updated!"
      });
    } catch (err: any) {
      toast({
        title: "Upload failed",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setUploadingAvatar(false);
    }
  };
  const allData = [...weeklyData.map(d => d.minutes), ...(showCompare ? sampleCompareData.map(d => d.minutes) : [])];
  const maxMinutes = Math.max(...allData, 1);

  // Smart Y-axis ticks
  const generateYTicks = (max: number) => {
    if (max <= 5) return [0, 1, 2, 3, 4, 5];
    const rawStep = max / 4;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const candidates = [1, 2, 5, 10].map(m => m * magnitude);
    const step = candidates.find(s => s >= rawStep) || candidates[candidates.length - 1];
    const ticks: number[] = [];
    for (let v = 0; v <= max + step * 0.5; v += step) ticks.push(Math.round(v));
    return ticks;
  };
  const yTicks = generateYTicks(maxMinutes);
  const yMax = yTicks[yTicks.length - 1] || 60;

  const chartWidth = 340;
  const chartHeight = 180;
  const paddingLeft = 45;
  const paddingRight = 15;
  const paddingTop = 15;
  const paddingBottom = 15;
  const plotWidth = chartWidth - paddingLeft - paddingRight;
  const plotHeight = chartHeight - paddingTop - paddingBottom;

  const toPoint = (data: { day: string; minutes: number }, index: number, total: number) => ({
    x: paddingLeft + (index / (total - 1)) * plotWidth,
    y: chartHeight - paddingBottom - (data.minutes / yMax) * plotHeight,
    data,
  });

  const points = weeklyData.map((d, i) => toPoint(d, i, weeklyData.length));
  const linePath = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ");

  const comparePoints = sampleCompareData.map((d, i) => toPoint(d, i, sampleCompareData.length));
  const compareLinePath = comparePoints.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ");

  const myTotal = Math.round(totalWeekMinutes);
  const compareTotal = showCompare ? sampleCompareData.reduce((s, d) => s + d.minutes, 0) : 0;
  if (loading) {
    return <div className="min-h-screen bg-background pb-24">
        <AppHeader showLogout />
        <main className="px-4 pt-4">
          <Skeleton className="w-full h-48 rounded-2xl mb-4" />
          <Skeleton className="w-full h-32 rounded-2xl" />
        </main>
        <BottomNav />
      </div>;
  }
  return <div className="min-h-screen bg-background pb-24">
      {/* Animated gradient mesh background */}
      <div className="fixed inset-0 gradient-mesh pointer-events-none" />

      <div className="relative z-10">
        <AppHeader streakDays={profile?.streak_count ?? 1} level={profile?.level ?? 1} showLogout />

        <main className="px-4 pt-1 animate-fade-in flex flex-col items-center">
          {/* Settings Icon & Avatar Row */}
          <div className="flex justify-between items-start mb-1 w-full">
            <div />
            <div className="flex flex-col items-center -mt-1 ml-7">
              <div className="relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1">
                  <LevelBadge level={profile?.level ?? 1} size="sm" />
                  {profile?.is_premium && (
                    <>
                      <Crown className="w-6 h-6 text-[hsl(45,100%,50%)]" fill="url(#gold-gradient)" style={{ filter: 'drop-shadow(0 0 4px hsl(45,100%,55%)) drop-shadow(0 0 8px hsl(40,100%,45%))' }} />
                      <svg width="0" height="0"><defs><linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="hsl(50,100%,70%)" /><stop offset="50%" stopColor="hsl(45,100%,50%)" /><stop offset="100%" stopColor="hsl(35,100%,40%)" /></linearGradient></defs></svg>
                    </>
                  )}
                </div>
                <div className={`w-20 h-20 rounded-2xl bg-card border-4 flex items-center justify-center overflow-hidden ${
                  profile?.is_premium ? 'border-[hsl(45,100%,50%)]' : 'border-background'
                }`}>
                  {profile?.avatar_url ? <img src={profile.avatar_url} alt="Avatar" className="w-full h-full rounded-xl object-cover" /> : <span className="text-3xl text-muted-foreground">👤</span>}
                </div>
                <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary rounded-full flex items-center justify-center cursor-pointer">
                  <Camera className="w-3.5 h-3.5 text-primary-foreground" />
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" disabled={uploadingAvatar} />
                </label>
              </div>
            </div>
            <button onClick={() => setShowSettingsModal(true)} className="p-2.5 glass-button rounded-xl hover:bg-muted transition-colors">
              <Settings className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Name & Level Badge */}
          <div className="text-center mb-4 scale-[0.8] origin-top w-full">
            <div className="flex items-center justify-center gap-2 mb-1 ml-6">
              <h1 className="text-2xl font-bold text-foreground">
                {profile?.username || "User"}
              </h1>
              {/* Self-visible Blue Tick for Premium */}
              {profile?.is_premium && (
                <BadgeCheck className="w-5 h-5 text-[hsl(210,100%,50%)]" fill="hsl(210,100%,50%)" />
              )}
              <button onClick={() => {
              setEditName(profile?.username || "");
              setShowEditModal(true);
            }} className="p-1 hover:bg-muted/50 rounded">
                <Edit2 className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Status/Mood Message */}
            <div className="flex items-center justify-center gap-1 mb-1">
              {editingStatus ? (
                <div className="flex items-center gap-1">
                  <input
                    value={statusMessage}
                    onChange={(e) => setStatusMessage(e.target.value.slice(0, 60))}
                    placeholder="Set your status..."
                    className="text-xs bg-muted border border-border rounded-lg px-2 py-1 w-48 text-center text-foreground"
                    autoFocus
                    onKeyDown={async (e) => {
                      if (e.key === "Enter") {
                        await supabase.from("profiles").update({ status_message: statusMessage } as any).eq("id", profile?.id);
                        setEditingStatus(false);
                        toast({ title: "Status updated!" });
                      }
                    }}
                  />
                  <button onClick={async () => {
                    await supabase.from("profiles").update({ status_message: statusMessage } as any).eq("id", profile?.id);
                    setEditingStatus(false);
                    toast({ title: "Status updated!" });
                  }} className="text-[10px] px-1.5 py-0.5 rounded bg-primary text-primary-foreground">✓</button>
                </div>
              ) : (
                <button onClick={() => { setStatusMessage((profile as any)?.status_message || ""); setEditingStatus(true); }} className="text-xs text-muted-foreground italic hover:text-foreground transition-colors">
                  {(profile as any)?.status_message || "✏️ Tap to set your status"}
                </button>
              )}
            </div>
            
            {/* Joining Date */}
            <p className="text-xs text-muted-foreground mb-2">
              Joined {profile?.created_at ? format(new Date(profile.created_at), "MMM yyyy") : "Unknown"}
            </p>

            <LocationSelector country={profile?.country || null} city={profile?.location_city || null} lastLocationChange={profile?.last_location_change || null} compact onSelect={async (country, city) => {
            // Enforce 24-hour cooldown on location changes
            if (profile?.last_location_change) {
              const lastChange = new Date(profile.last_location_change);
              const hoursSince = (Date.now() - lastChange.getTime()) / (1000 * 60 * 60);
              if (hoursSince < 24) {
                toast({
                  title: "Location Locked",
                  description: "Location can only be changed once every 24 hours.",
                  variant: "destructive"
                });
                return;
              }
            }
            await updateProfile({
              country,
              location_city: city,
              region: getRegionForCountry(country),
              last_location_change: new Date().toISOString()
            } as any);
            toast({
              title: "Location updated!",
              description: `${city} | ${country}`
            });
          }} />

            {/* Account ID */}
            <div className="flex items-center justify-center gap-1.5 mt-1">
              <p className="text-sm text-muted-foreground font-bold font-mono">
                ID: {profile?.unique_id || "Loading..."}
              </p>
              <button onClick={copyUniqueId} className="p-0.5 hover:bg-muted/50 rounded transition-colors">
                <Copy className="w-3 h-3 text-muted-foreground" />
              </button>
            </div>

            {/* Role & Premium Status */}
            {role && (
              <div className="mt-3 flex flex-col items-center gap-1.5">
                <div className="flex items-center gap-2 flex-wrap justify-center">
                  <div className="flex items-center gap-1.5 bg-primary/10 px-3 py-1 rounded-full">
                    <BadgeCheck className="w-3.5 h-3.5 text-primary" />
                    <span className="text-xs font-semibold text-primary capitalize">Role: {role}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-accent/10 px-3 py-1 rounded-full">
                    <Coins className="w-3.5 h-3.5 text-accent" />
                    <span className="text-xs font-semibold text-accent">{profile?.coins ?? 0} Coins</span>
                  </div>
                </div>
                {profile?.is_premium ? (
                  <div className="flex items-center gap-1.5 bg-[hsl(45,80%,90%)] dark:bg-[hsl(45,60%,20%)] px-3 py-1 rounded-full">
                    <Crown className="w-3.5 h-3.5 text-[hsl(45,100%,40%)]" />
                    <span className="text-xs font-semibold text-[hsl(45,100%,30%)] dark:text-[hsl(45,100%,70%)]">
                      Premium Member
                      {profile.premium_expires_at && (
                        <span className="ml-1 font-normal">
                          {(() => {
                            const daysLeft = Math.ceil((new Date(profile.premium_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                            return daysLeft > 36000 ? "· Lifetime Access" : `· ${daysLeft}d left`;
                          })()}
                        </span>
                      )}
                    </span>
                  </div>
                ) : (
                  <span className="text-[10px] text-muted-foreground">Free Tier</span>
                )}
              </div>
            )}

          </div>

          {/* Stats Row - Clickable */}
          <div className="flex justify-center gap-6 mb-6 w-full -mt-3">
            <button onClick={() => setShowUsersList("following")} className="text-center hover:bg-muted/50 rounded-lg px-3 py-1 transition-colors">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Users className="w-4 h-4 text-accent" />
                <p className="text-xl font-bold text-foreground">
                  {followingCount}
                </p>
              </div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Following
              </p>
            </button>
            <button onClick={() => setShowUsersList("followers")} className="text-center hover:bg-muted/50 rounded-lg px-3 py-1 transition-colors">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Users className="w-4 h-4 text-primary" />
                <p className="text-xl font-bold text-foreground">
                  {followersCount}
                </p>
              </div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Followers
              </p>
            </button>
            <button onClick={() => setShowUsersList("fans")} className="text-center hover:bg-muted/50 rounded-lg px-3 py-1 transition-colors">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Heart className="w-4 h-4 text-destructive" />
                <p className="text-xl font-bold text-foreground">{fansCount}</p>
              </div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                Fans
              </p>
            </button>
          </div>

          {/* Weekly Line Chart - Speaking Time */}
          <div className="glass-card p-5 mb-4 w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-foreground text-base">Speaking Time</h3>
              </div>
              <button onClick={() => {
                if (showCompare) {
                  setShowCompare(false);
                  setSelectedCompareUser(null);
                } else {
                  setShowCompareList(true);
                }
              }} className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${showCompare ? 'bg-destructive/15 text-destructive' : 'bg-primary/15 text-primary hover:bg-primary/25'}`}>
                <GitCompareArrows className="w-3.5 h-3.5" />
                {showCompare && selectedCompareUser ? selectedCompareUser.name : 'Compare'}
              </button>
            </div>

            {/* Stats area - above chart */}
            {showCompare && selectedCompareUser ? (
              /* COMPARE MODE: 2-row stats grid */
              <div className="space-y-2 mb-3 mt-2">
                {/* Row 1: This Week */}
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">This Week</p>
              {(() => {
                      const safeMutual = 0;
                      return (
                    <div className="grid grid-cols-2 gap-2">
                    <div className="bg-[hsl(0,0%,90%)]/60 dark:bg-[hsl(0,0%,25%)]/40 rounded-lg px-2 py-1 text-center">
                      <span className="text-[9px] text-muted-foreground block">You</span>
                      <p className="text-xs font-bold text-[hsl(0,0%,20%)] dark:text-[hsl(0,0%,85%)]">{formatDuration(totalWeekMinutes)}</p>
                    </div>
                    <div className="bg-[hsl(140,40%,90%)]/60 dark:bg-[hsl(140,30%,20%)]/40 rounded-lg px-2 py-1 text-center">
                      <span className="text-[9px] text-muted-foreground block">{selectedCompareUser.name}</span>
                      <p className="text-xs font-bold text-[hsl(140,50%,30%)] dark:text-[hsl(140,50%,60%)]">{formatDuration(compareTotal)}</p>
                    </div>
                    <div className="bg-[hsl(220,50%,93%)]/60 dark:bg-[hsl(220,40%,20%)]/40 rounded-lg px-2 py-1 text-center">
                      <span className="text-[9px] text-muted-foreground block">Mutual Talk</span>
                      <p className="text-xs font-bold text-[hsl(220,60%,45%)] dark:text-[hsl(220,60%,65%)]">{formatDuration(safeMutual)}</p>
                    </div>
                    <div className="bg-[hsl(0,60%,93%)]/60 dark:bg-[hsl(0,40%,20%)]/40 rounded-lg px-2 py-1 text-center">
                      <span className="text-[9px] text-muted-foreground block">Together Total</span>
                      <p className="text-xs font-bold text-[hsl(0,70%,45%)] dark:text-[hsl(0,70%,60%)]">{formatDuration(totalWeekMinutes + compareTotal)}</p>
                    </div>
                  </div>
                      );
                    })()}
                </div>
                {/* Row 2: All Time */}
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">All Time</p>
              {(() => {
                      const safeMutual = 0;
                      return (
                    <div className="grid grid-cols-2 gap-2">
                    <div className="bg-[hsl(0,0%,90%)]/60 dark:bg-[hsl(0,0%,25%)]/40 rounded-lg px-2 py-1 text-center">
                      <span className="text-[9px] text-muted-foreground block">You</span>
                      <p className="text-xs font-bold text-[hsl(0,0%,20%)] dark:text-[hsl(0,0%,85%)]">{formatDuration(totalAllTimeMinutes)}</p>
                    </div>
                    <div className="bg-[hsl(140,40%,90%)]/60 dark:bg-[hsl(140,30%,20%)]/40 rounded-lg px-2 py-1 text-center">
                      <span className="text-[9px] text-muted-foreground block">{selectedCompareUser.name}</span>
                      <p className="text-xs font-bold text-[hsl(140,50%,30%)] dark:text-[hsl(140,50%,60%)]">{formatDuration(selectedCompareUser.allTimeMinutes)}</p>
                    </div>
                    <div className="bg-[hsl(220,50%,93%)]/60 dark:bg-[hsl(220,40%,20%)]/40 rounded-lg px-2 py-1 text-center">
                      <span className="text-[9px] text-muted-foreground block">Mutual Talk</span>
                      <p className="text-xs font-bold text-[hsl(220,60%,45%)] dark:text-[hsl(220,60%,65%)]">{formatDuration(safeMutual)}</p>
                    </div>
                    <div className="bg-[hsl(0,60%,93%)]/60 dark:bg-[hsl(0,40%,20%)]/40 rounded-lg px-2 py-1 text-center">
                      <span className="text-[9px] text-muted-foreground block">Together Total</span>
                      <p className="text-xs font-bold text-[hsl(0,70%,45%)] dark:text-[hsl(0,70%,60%)]">{formatDuration(totalAllTimeMinutes + selectedCompareUser.allTimeMinutes)}</p>
                    </div>
                  </div>
                      );
                    })()}
                </div>
              </div>
            ) : (
              /* NORMAL MODE: Two simple pills */
              <div className="flex items-center justify-center gap-3 mb-3 mt-2">
                <div className="bg-muted/50 rounded-lg px-3 py-1.5 text-center">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">This Week</span>
                  <p className="text-sm font-bold text-foreground">{formatDuration(totalWeekMinutes)}</p>
                </div>
                <div className="bg-muted/50 rounded-lg px-3 py-1.5 text-center">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">All Time</span>
                  <p className="text-sm font-bold text-foreground">{formatDuration(totalAllTimeMinutes)}</p>
                </div>
              </div>
            )}

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-muted-foreground/60" />
                <span className="text-xs text-muted-foreground">{profile?.username || "You"}</span>
              </div>
              {showCompare && selectedCompareUser && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: "hsl(var(--primary))" }} />
                  <span className="text-xs text-muted-foreground">{selectedCompareUser.name}</span>
                </div>
              )}
            </div>

            {/* Chart */}
            <div className="flex justify-center">
              <svg width={chartWidth} height={chartHeight + 30} className="overflow-visible">
                {yTicks.map((val) => {
                  const y = chartHeight - paddingBottom - (val / yMax) * plotHeight;
                  const label = val >= 60 ? `${Math.round(val / 60)}h` : `${val}m`;
                  return (
                    <g key={val}>
                      <line x1={paddingLeft} y1={y} x2={chartWidth - paddingRight} y2={y} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.12} />
                      <text x={paddingLeft - 8} y={y + 4} textAnchor="end" fontSize={11} fontWeight="700" fill="hsl(var(--foreground))">
                        {label}
                      </text>
                    </g>
                  );
                })}
                <path d={linePath} fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
                {points.map((p, i) => (
                  <circle key={`main-${i}`} cx={p.x} cy={p.y} r="3.5" fill="hsl(var(--muted-foreground))" opacity="0.7" />
                ))}
                {showCompare && (
                  <>
                    <path d={compareLinePath} fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    {comparePoints.map((p, i) => (
                      <circle key={`cmp-${i}`} cx={p.x} cy={p.y} r="3.5" fill="hsl(var(--primary))" />
                    ))}
                  </>
                )}
                {dayLabels.map((day, i) => {
                  const x = paddingLeft + (i / (dayLabels.length - 1)) * plotWidth;
                  return (
                    <text key={day} x={x} y={chartHeight + 18} textAnchor="middle" fontSize={12} fontWeight="700" fill="hsl(var(--foreground))">
                      {day}
                    </text>
                  );
                })}
              </svg>
            </div>

            {/* Footer */}
            <p className="text-center text-xs text-muted-foreground mt-3">Weekly speaking time comparison</p>
          </div>

          {/* Email Card */}
          <div className="glass-card px-2.5 py-1.5 mb-2 flex items-center gap-2 w-full">
            <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center">
              <Mail className="w-3 h-3 text-primary" />
            </div>
            <div>
              <p className="text-[7px] text-muted-foreground uppercase tracking-wider">
                Email (Private)
              </p>
              <p className="text-[10px] text-foreground leading-tight">{user?.email || "Not set"}</p>
            </div>
          </div>

          {/* Coins Button */}
          <button
            onClick={() => setShowCoinsModal(true)}
            className="glass-card px-4 py-3 mb-4 w-full flex items-center justify-between hover:bg-muted/60 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[hsl(45,100%,50%)]/20 flex items-center justify-center">
                <Coins className="w-5 h-5 text-[hsl(45,100%,50%)]" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-foreground">My Coins</p>
                <p className="text-xs text-muted-foreground">Earn coins to unlock a Mega Mystery Reward! 🎁</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xl font-bold text-[hsl(45,100%,50%)]">{profile?.coins ?? 0}</span>
              <Coins className="w-4 h-4 text-[hsl(45,100%,50%)]" />
            </div>
          </button>

          {/* Trust Score Button */}
          <button
            onClick={() => setShowTrustScore(true)}
            className="glass-card w-full flex items-center justify-between px-3 py-2.5 mb-4 hover:bg-muted/60 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-foreground">🛡️ Trust Score</p>
                <p className="text-xs text-muted-foreground">View your account health & feedback</p>
              </div>
            </div>
          </button>

          {/* About Me - Editable */}
          <div className="glass-card w-full px-4 py-3 mb-2">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold text-foreground">📝 About Me</p>
              {editingAboutMe ? (
                <div className="flex gap-1.5">
                  <button
                    onClick={async () => {
                      await updateProfile({ description: aboutMeText.trim() || "Hello" });
                      setEditingAboutMe(false);
                      toast({ title: "Bio updated!" });
                    }}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-semibold"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setAboutMeText(profile?.description || "Hello");
                      setEditingAboutMe(false);
                    }}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setAboutMeText(profile?.description || "Hello");
                    setEditingAboutMe(true);
                  }}
                  className="p-1 hover:bg-muted/50 rounded"
                >
                  <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
            {editingAboutMe ? (
              <textarea
                value={aboutMeText}
                onChange={(e) => setAboutMeText(e.target.value)}
                maxLength={200}
                rows={3}
                className="w-full bg-muted border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                autoFocus
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                {profile?.description || "Hello"}
              </p>
            )}
          </div>


          {/* Profile Visitors Button */}
          <button
            onClick={async () => {
              setShowVisitors(true);
              setVisitorsLoading(true);
              if (profile?.id) {
                const { data } = await supabase
                  .from("profile_views")
                  .select("id, viewer_id, created_at")
                  .eq("viewed_user_id", profile.id)
                  .order("created_at", { ascending: false })
                  .limit(30);
                if (data && data.length > 0) {
                  const viewerIds = [...new Set(data.map(v => v.viewer_id))];
                  const { data: profiles } = await supabase
                    .from("profiles")
                    .select("id, username, avatar_url")
                    .in("id", viewerIds);
                  const profileMap = new Map((profiles || []).map(p => [p.id, p]));
                  setVisitors(data.map(v => ({
                    ...v,
                    viewer_username: profileMap.get(v.viewer_id)?.username || "Unknown",
                    viewer_avatar: profileMap.get(v.viewer_id)?.avatar_url,
                  })));
                } else {
                  setVisitors([]);
                }
              }
              setVisitorsLoading(false);
            }}
            className="glass-card w-full flex items-center justify-between px-3 py-2.5 mb-4 hover:bg-muted/60 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Eye className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-foreground">👁️ Profile Visitors</p>
                <p className="text-xs text-muted-foreground">{profile?.is_premium ? "See who viewed your profile" : "Upgrade to see visitors"}</p>
              </div>
            </div>
          </button>

          {/* Top Talkers Button */}
          <button
            onClick={() => setShowTopTalkers(true)}
            className="glass-card w-full flex items-center justify-between px-3 py-2.5 mb-4 hover:bg-muted/60 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[hsl(45,100%,50%)]/20 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-[hsl(45,100%,50%)]" />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-foreground">🏆 Top Talkers</p>
                <p className="text-xs text-muted-foreground">Weekly leaderboard</p>
              </div>
            </div>
          </button>

        </main>

        {/* Edit Name Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="glass-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Edit Profile</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground mb-4">
                You can change your name 2 times per week.
              </p>
              <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Enter your name" className="mb-4 bg-muted border-border" />
              <Button onClick={handleEditName} className="w-full" disabled={!canEditProfile()}>
                {canEditProfile() ? "Save Changes" : "Edit Limit Reached"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Settings Modal */}
        <ProfileSettingsModal open={showSettingsModal} onOpenChange={setShowSettingsModal} />
        <TrustScoreModal open={showTrustScore} onOpenChange={setShowTrustScore} />
        <CoinExchangeModal open={showCoinExchange} onOpenChange={setShowCoinExchange} />
        <ReferralTreeModal open={showReferralTree} onOpenChange={setShowReferralTree} />
        <TopTalkersModal open={showTopTalkers} onOpenChange={setShowTopTalkers} />
        <SmartAppReview isPremium={!!profile?.is_premium} />

        {/* Profile Visitors Modal */}
        <Dialog open={showVisitors} onOpenChange={setShowVisitors}>
          <DialogContent className="max-w-sm max-h-[70vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-foreground text-base flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary" /> Profile Visitors
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2 py-2">
              {visitorsLoading ? (
                <p className="text-xs text-muted-foreground text-center py-8">Loading...</p>
              ) : visitors.length === 0 ? (
                <div className="text-center py-8">
                  <Eye className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No visitors yet</p>
                </div>
              ) : visitors.map((v) => (
                <div key={v.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className={`w-9 h-9 rounded-full bg-muted flex items-center justify-center overflow-hidden ${!profile?.is_premium ? "blur-sm" : ""}`}>
                    {v.viewer_avatar ? (
                      <img src={v.viewer_avatar} alt="" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <span className="text-sm">👤</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium text-foreground truncate ${!profile?.is_premium ? "blur-sm select-none" : ""}`}>
                      {v.viewer_username}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(v.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {!profile?.is_premium && (
                    <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  )}
                </div>
              ))}
              {!profile?.is_premium && visitors.length > 0 && (
                <button
                  onClick={() => { setShowVisitors(false); navigate("/premium"); }}
                  className="w-full mt-2 py-2 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
                >
                  🔓 Upgrade to Premium to see visitors
                </button>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* GDPR Delete Confirmation */}
        <Dialog open={showDeleteAccount} onOpenChange={setShowDeleteAccount}>
          <DialogContent className="max-w-xs">
            <DialogHeader>
              <DialogTitle className="text-destructive text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Delete Account
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <p className="text-xs text-muted-foreground">
                This will <strong>permanently delete</strong> your account and ALL data including messages, call history, coins, and friends. This cannot be undone.
              </p>
              <p className="text-xs text-muted-foreground">Type <strong>DELETE</strong> to confirm:</p>
              <Input
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="Type DELETE"
                className="text-sm"
              />
              <Button
                variant="destructive"
                className="w-full"
                disabled={deleteConfirm !== "DELETE"}
                onClick={async () => {
                  if (!profile?.id) return;
                  try {
                    await (supabase.rpc as any)("delete_user_account", { p_user_id: profile.id });
                    await supabase.auth.signOut();
                    navigate("/login");
                    toast({ title: "Account deleted", description: "All your data has been permanently removed." });
                  } catch (err: any) {
                    toast({ title: "Deletion failed", description: err.message, variant: "destructive" });
                  }
                }}
              >
                Permanently Delete Everything
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Compare User Selection Modal */}
        <Dialog open={showCompareList} onOpenChange={setShowCompareList}>
          <DialogContent className="glass-card border-border max-w-xs">
            <DialogHeader>
              <DialogTitle className="text-foreground text-sm">Compare with</DialogTitle>
            </DialogHeader>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {compareUsers.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8">No call partners yet. Start speaking to compare!</p>
              ) : compareUsers.map(user => <button key={user.id} onClick={() => {
              setSelectedCompareUser(user);
              setShowCompare(true);
              setShowCompareList(false);
            }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/60 transition-colors text-left">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    {user.avatar ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" /> : <span className="text-sm font-bold">{user.name[0]?.toUpperCase()}</span>}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{user.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatDuration(user.data.reduce((s, d) => s + d.minutes, 0))} this week · {formatDuration(user.allTimeMinutes)} total
                    </p>
                  </div>
                </button>)}
            </div>
          </DialogContent>
        </Dialog>

        {/* Following / Followers / Fans List Dialog */}
        <Dialog open={showUsersList !== null} onOpenChange={(open) => !open && setShowUsersList(null)}>
          <DialogContent className="glass-card border-border max-w-xs">
            <DialogHeader>
              <DialogTitle className="text-foreground text-sm capitalize">{showUsersList || ""}</DialogTitle>
            </DialogHeader>
            <div className="space-y-1 max-h-72 overflow-y-auto">
              {listLoading ? (
                <p className="text-center text-muted-foreground text-sm py-8">Loading...</p>
              ) : listUsers.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8">No users yet</p>
              ) : (
                listUsers.map(user => (
                  <div
                    key={user.id}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/60 transition-colors"
                  >
                    <button
                      className="flex items-center gap-3 flex-1 min-w-0 text-left"
                      onClick={() => {
                        setShowUsersList(null);
                        navigate(`/user/${user.id}`, {
                          state: {
                            id: user.id,
                            name: user.username || "User",
                            avatar: user.avatar_url,
                            level: user.level ?? 1,
                            isOnline: user.is_online ?? false,
                            location: user.location_city || "",
                            uniqueId: user.unique_id || "",
                            createdAt: user.created_at,
                            followersCount: user.followers_count ?? 0,
                            followingCount: user.following_count ?? 0,
                            myName: profile?.username || "You",
                            myWeeklyData: weeklyData,
                          },
                        });
                      }}
                    >
                      <div className="relative flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-foreground overflow-hidden">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            (user.username || "U")[0].toUpperCase()
                          )}
                        </div>
                        {user.is_online && (
                          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[hsl(var(--ef-online))] rounded-full border-2 border-background" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{user.username || "User"}</p>
                        <p className="text-[10px] text-muted-foreground">Level {user.level ?? 1} • {user.location_city || "Unknown"}</p>
                      </div>
                    </button>
                    {/* Action buttons */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {showUsersList === "following" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7 px-2"
                          onClick={() => handleUnfollow(user.id)}
                        >
                          Unfollow
                        </Button>
                      )}
                      {(showUsersList === "followers" || showUsersList === "fans") && (
                        <>
                          {followedBackIds.has(user.id) ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-7 px-2"
                              onClick={() => handleUnfollowBack(user.id)}
                            >
                              Unfollow
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-7 px-2"
                              onClick={() => handleFollowBack(user.id)}
                            >
                              Follow
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7 w-7 px-0 text-muted-foreground"
                            onClick={() => handleRemoveFollower(user.id)}
                          >
                            ✕
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>


        {/* Coins / Referral Modal */}
        <Dialog open={showCoinsModal} onOpenChange={setShowCoinsModal}>
          <DialogContent className="glass-card border-border max-w-xs p-0 max-h-[85vh] overflow-hidden [&>button]:hidden">
            {/* Custom Header with close */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-[hsl(45,100%,50%)]" />
                <h3 className="text-sm font-bold text-foreground">My Coins</h3>
              </div>
              <button onClick={() => setShowCoinsModal(false)} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="overflow-y-auto px-4 pb-4 space-y-3 max-h-[calc(85vh-60px)]">
              {/* Coins count */}
              <div className="text-center py-2">
                <p className="text-3xl font-bold text-[hsl(45,100%,50%)]">{profile?.coins ?? 0}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Total Coins</p>

                {/* Daily Login Bonus */}
                <button
                  onClick={async () => {
                    if (!profile?.id) return;
                    const lastLogin = localStorage.getItem(`daily_login_${profile.id}`);
                    const today = new Date().toDateString();
                    if (lastLogin === today) {
                      toast({ title: "Already claimed!", description: "Come back tomorrow for more coins." });
                      return;
                    }
                    const bonus = Math.random() > 0.5 ? 2 : 1;
                    const { error } = await supabase.from("profiles").update({ coins: (profile.coins ?? 0) + bonus }).eq("id", profile.id);
                    if (!error) {
                      localStorage.setItem(`daily_login_${profile.id}`, today);
                      updateProfile({ coins: (profile.coins ?? 0) + bonus });
                      toast({ title: `+${bonus} Daily Bonus!`, description: "Login tomorrow for more!" });
                      if (navigator.vibrate) navigator.vibrate(20);
                    }
                  }}
                  className="mt-1.5 px-3 py-1 rounded-full bg-primary/20 text-primary text-[10px] font-bold hover:bg-primary/30 transition-colors"
                >
                  🎁 Claim Daily Bonus
                </button>

                {/* Send & Request Buttons */}
                <div className="flex gap-2 mt-2 justify-center">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 text-xs h-8"
                    onClick={() => { setShowCoinsModal(false); setShowCoinExchange(true); }}
                  >
                    <Send className="w-3 h-3" /> Send
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 text-xs h-8"
                    onClick={() => { setShowCoinsModal(false); setShowCoinExchange(true); }}
                  >
                    <ArrowDownLeft className="w-3 h-3" /> Request
                  </Button>
                </div>
              </div>

              {/* Coin Transaction History (Master Log) */}
              <CoinTransactionLog userId={profile?.id || ""} />

              {/* Watch Ad for Coins */}
              <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-muted/30 border border-border/50">
                <span className="text-sm">📺</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground">Watch Ad (+5 Coins)</p>
                  <p className="text-[9px] text-muted-foreground">30-second ad</p>
                </div>
                {watchingAd ? (
                  <div className="flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-primary animate-pulse" />
                    <span className="text-[9px] text-primary font-medium">{Math.round(adProgress)}%</span>
                  </div>
                ) : (
                  <button
                    onClick={() => { setWatchingAd(true); setAdProgress(0); }}
                    className="shrink-0 px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-[9px] font-bold hover:bg-primary/90 transition-colors"
                  >
                    <Play className="w-3 h-3 inline mr-0.5" /> Watch
                  </button>
                )}
              </div>

              {/* Refer & Earn */}
              <div className="bg-gradient-to-r from-[hsl(45,100%,50%)]/10 to-[hsl(30,100%,50%)]/10 rounded-lg p-3 border border-[hsl(45,100%,50%)]/20">
                <div className="flex items-center gap-2 mb-1.5">
                  <Gift className="w-5 h-5 text-[hsl(45,100%,50%)]" />
                  <h3 className="text-sm font-bold text-foreground">Refer & Earn Coins!</h3>
                </div>
                <p className="text-[10px] text-muted-foreground mb-2">
                  Share your ID with friends. When they join, you earn <span className="font-bold text-[hsl(45,100%,50%)]">50 Coins!</span> 🚀
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-muted rounded-lg px-2.5 py-1.5 text-xs font-mono text-foreground truncate">
                    {profile?.unique_id || "Loading..."}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 h-7 w-7 p-0"
                    onClick={() => {
                      if (profile?.unique_id) {
                        navigator.clipboard.writeText(profile.unique_id);
                        toast({ title: "Copied!", description: "Share this ID with friends" });
                      }
                    }}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {/* Referral Stats — Merged "Refer & Join" */}
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowCoinsModal(false); setShowReferralTree(true); }}
                  className="flex-1 bg-muted/50 rounded-lg p-2 text-center cursor-pointer hover:scale-105 transition-transform"
                >
                  <UserPlus className="w-3.5 h-3.5 text-primary mx-auto mb-0.5" />
                  <p className="text-base font-bold text-foreground">{referrals.length}</p>
                  <p className="text-[9px] text-muted-foreground">Refer & Join</p>
                </button>
              </div>

              {/* Referral Tree Button */}
              <Button
                variant="outline"
                className="w-full gap-2 text-xs h-8"
                onClick={() => { setShowCoinsModal(false); setShowReferralTree(true); }}
              >
                <GitBranch className="w-3.5 h-3.5" />
                View Referral Tree
              </Button>

              {/* Referred Members (compact) */}
              {referrals.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Referred Members</h4>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {referrals.map(r => (
                      <div key={r.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-muted/30">
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                          {r.profile?.avatar_url ? (
                            <img src={r.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[10px]">👤</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{r.profile?.username || "User"}</p>
                        </div>
                        <span className="text-[10px] font-bold text-[hsl(45,100%,50%)]">+50</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {referrals.length === 0 && !referralsLoading && (
                <p className="text-center text-muted-foreground text-[10px] py-2">No referrals yet. Share your ID to start earning!</p>
              )}

              {/* Bonus Quests */}
              <div>
                <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Bonus Quests (Earn Tickets 🎟️)</h4>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-muted/30 border border-border/50">
                    <span className="text-sm">📺</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground">Watch Ad (+1 Ticket)</p>
                      <p className="text-[9px] text-muted-foreground">(Max 5/day)</p>
                    </div>
                    <button className="shrink-0 px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-[9px] font-bold hover:bg-primary/90 transition-colors">
                      Watch
                    </button>
                  </div>
                  <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-muted/30 border border-border/50">
                    <span className="text-sm">🌟</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground">Showcase Talent</p>
                      <p className="text-[9px] text-muted-foreground">Gain fans & likes for surprise Tickets!</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Redemption Banner */}
              <div className="flex items-center justify-between rounded-lg px-2.5 py-2 bg-[hsl(40,100%,50%)]/10 border border-[hsl(40,100%,50%)]/20">
                <p className="text-[10px] font-medium text-foreground">🎟️ My Tickets: 0 <span className="text-[9px] text-muted-foreground font-bold">(Expires in 7 Days!)</span></p>
                <button className="shrink-0 px-3 py-1 rounded-full bg-[hsl(30,100%,50%)] text-background text-[10px] font-extrabold hover:bg-[hsl(30,100%,45%)] transition-colors shadow-sm">
                  Redeem ⚡
                </button>
              </div>

              {/* Mystery Vaults */}
              <div className="space-y-1.5">
                <button
                  onClick={async () => {
                    if (!profile) return;
                    if ((profile.coins ?? 0) < 2000) {
                      toast({ title: "Not enough coins!", description: "You need 2,000 coins to unlock the Silver Vault.", variant: "destructive" });
                      return;
                    }
                    const newCoins = (profile.coins ?? 0) - 2000;
                    const newXp = (profile.xp ?? 0) + 500;
                    const { error } = await supabase.from("profiles").update({ coins: newCoins, xp: newXp }).eq("id", profile.id);
                    if (!error) {
                      updateProfile({ coins: newCoins, xp: newXp });
                      toast({ title: "🎁 Silver Vault Unlocked!", description: "+500 XP awarded! Keep grinding!" });
                    } else {
                      toast({ title: "Failed to unlock vault", variant: "destructive" });
                    }
                  }}
                  className="rounded-lg p-2.5 border border-muted-foreground/20 bg-muted/40 w-full text-left hover:bg-muted/60 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{(profile?.coins ?? 0) >= 2000 ? "🔓" : "🔒"}</span>
                    <div>
                      <p className="text-xs font-bold text-foreground">
                        <span className="text-muted-foreground">Silver Vault</span> — 2,000 Coins
                      </p>
                      <p className="text-[9px] text-muted-foreground">Unlock for +500 XP reward! 🎁</p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={async () => {
                    if (!profile) return;
                    if ((profile.coins ?? 0) < 5000) {
                      toast({ title: "Not enough coins!", description: "You need 5,000 coins to unlock the Gold Vault.", variant: "destructive" });
                      return;
                    }
                    const newCoins = (profile.coins ?? 0) - 5000;
                    const newXp = (profile.xp ?? 0) + 2000;
                    const { error } = await supabase.from("profiles").update({ coins: newCoins, xp: newXp }).eq("id", profile.id);
                    if (!error) {
                      updateProfile({ coins: newCoins, xp: newXp });
                      toast({ title: "🏆 Super Gold Vault Unlocked!", description: "+2000 XP awarded! You are a legend!" });
                    } else {
                      toast({ title: "Failed to unlock vault", variant: "destructive" });
                    }
                  }}
                  className="rounded-lg p-2.5 border border-[hsl(45,100%,50%)]/30 bg-gradient-to-r from-[hsl(280,80%,60%)]/10 to-[hsl(45,100%,50%)]/10 w-full text-left hover:from-[hsl(280,80%,60%)]/20 hover:to-[hsl(45,100%,50%)]/20 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{(profile?.coins ?? 0) >= 5000 ? "🔓" : "💎"}</span>
                    <div>
                      <p className="text-xs font-bold text-foreground">
                        <span className="text-[hsl(45,100%,50%)]">Super Gold Vault</span> — 5,000 Coins
                      </p>
                      <p className="text-[9px] text-muted-foreground">Unlock for +2000 XP ultimate reward! 🏆</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <BottomNav />
      </div>
    </div>;
}
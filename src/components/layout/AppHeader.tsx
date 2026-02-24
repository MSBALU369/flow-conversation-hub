import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Bell, Play, Search, X, Flame, Crown, ShieldCheck, UserPlus, Check } from "lucide-react";
import { EFLogo } from "@/components/ui/EFLogo";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Input } from "@/components/ui/input";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { LevelBadge } from "@/components/ui/LevelBadge";
import { supabase } from "@/integrations/supabase/client";
import { isAdminOrRoot } from "@/pages/Admin";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { sendFollowNotification } from "@/lib/followNotification";

interface AppHeaderProps {
  streakDays?: number;
  level?: number;
  showLogout?: boolean;
  onlineCount?: number;
  onHistoryClick?: () => void;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  is_read: boolean;
  created_at: string;
  from_user_id: string | null;
}

interface SearchResult {
  type: "user" | "talent" | "room";
  id: string;
  title: string;
  subtitle: string;
  avatar?: string | null;
  userId?: string;
  roomCode?: string;
}

export function AppHeader({ 
  streakDays = 1, 
  level = 1, 
  showLogout = false,
  onlineCount = 612,
  onHistoryClick
}: AppHeaderProps) {
  const location = useLocation();
  const isOnProfile = location.pathname === "/profile";
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const { profile } = useProfile();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [followedBackIds, setFollowedBackIds] = useState<Set<string>>(new Set());
  const [followLoading, setFollowLoading] = useState<string | null>(null);
  const showAdmin = isAdminOrRoot(user?.email);

  const userLevel = profile?.level ?? level;
  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Fetch real notifications
  useEffect(() => {
    if (!profile?.id) return;
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(20);
      const notifs = (data as Notification[]) || [];
      setNotifications(notifs);

      // Pre-load follow-back states for follow_request notifications
      const followFromIds = notifs
        .filter(n => n.type === "follow_request" && n.from_user_id)
        .map(n => n.from_user_id!);
      if (followFromIds.length > 0) {
        const { data: existing } = await supabase
          .from("friendships")
          .select("friend_id")
          .eq("user_id", profile.id)
          .in("friend_id", followFromIds);
        if (existing) {
          setFollowedBackIds(new Set(existing.map(f => f.friend_id)));
        }
      }
    };
    fetchNotifications();

    // Subscribe to realtime notifications
    const channel = supabase
      .channel(`notifications-${profile.id}`)
      .on(
        "postgres_changes" as any,
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${profile.id}`,
        },
        (payload: any) => {
          if (payload.new) {
            setNotifications(prev => [payload.new as Notification, ...prev].slice(0, 20));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile?.id]);

  const markAllRead = async () => {
    if (!profile?.id) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", profile.id)
      .eq("is_read", false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const handleAvatarClick = () => {
    navigate("/profile");
  };

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const [usersRes, talentRes, roomsRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, username, unique_id, avatar_url, level, country, location_city")
          .or(`username.ilike.%${query}%,unique_id.ilike.%${query}%`)
          .limit(10),
        supabase
          .from("talent_uploads")
          .select("id, title, description, user_id, language")
          .or(`title.ilike.%${query}%,description.ilike.%${query}%,language.ilike.%${query}%`)
          .limit(10),
        supabase
          .from("rooms")
          .select("id, room_code, title, language, is_private")
          .or(`title.ilike.%${query}%,room_code.ilike.%${query}%`)
          .limit(10),
      ]);

      const results: SearchResult[] = [];

      (usersRes.data || []).forEach((u) => {
        results.push({
          type: "user",
          id: u.id,
          title: u.username || "Unknown",
          subtitle: `${u.location_city || ""}${u.location_city && u.country ? " | " : ""}${u.country || ""} • Lv.${u.level || 1}`,
          avatar: u.avatar_url,
          userId: u.id,
        });
      });

      (talentRes.data || []).forEach((t) => {
        results.push({
          type: "talent",
          id: t.id,
          title: t.title || "Untitled",
          subtitle: `🎙️ ${t.language} talent post`,
          userId: t.user_id,
        });
      });

      (roomsRes.data || []).forEach((r) => {
        results.push({
          type: "room",
          id: r.id,
          title: r.title,
          subtitle: `${r.is_private ? "🔒 Private" : "🌐 Public"} • ${r.language} • Code: ${r.room_code}`,
          roomCode: r.room_code,
        });
      });

      setSearchResults(results);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, performSearch]);

  const handleResultClick = (result: SearchResult) => {
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);
    if (result.type === "room" && result.roomCode) {
      navigate(`/room/${result.roomCode}`);
    } else if (result.userId) {
      navigate(`/profile`); // TODO: navigate to /profile/:id when public profiles exist
    }
  };

  if (showSearch) {
    return (
      <div className="fixed inset-0 z-50 bg-background">
        <header className="flex items-center gap-2 px-3 py-2 safe-top border-b border-border">
          <Input
            type="text"
            placeholder="Search users, talent posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 h-9 text-sm bg-muted border-border text-foreground placeholder:text-muted-foreground"
            autoFocus
          />
          <button
            onClick={() => {
              setShowSearch(false);
              setSearchQuery("");
              setSearchResults([]);
            }}
            className="p-1.5 glass-button rounded-lg"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </header>
        <div className="px-3 py-2 overflow-y-auto max-h-[calc(100vh-60px)]">
          {searching && (
            <p className="text-xs text-muted-foreground text-center py-4">Searching...</p>
          )}
          {!searching && searchQuery.length >= 2 && searchResults.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">No results found</p>
          )}
          {!searching && searchQuery.length < 2 && (
            <p className="text-xs text-muted-foreground text-center py-4">Type at least 2 characters to search</p>
          )}
          {searchResults.map((result) => (
            <button
              key={`${result.type}-${result.id}`}
              onClick={() => handleResultClick(result)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/60 transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden shrink-0">
                {result.type === "user" && result.avatar ? (
                  <img src={result.avatar} alt="" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <span className="text-sm">{result.type === "user" ? "👤" : result.type === "room" ? "🏠" : "🎙️"}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground truncate">{result.title}</p>
                <p className="text-[10px] text-muted-foreground truncate">{result.subtitle}</p>
              </div>
              <span className="text-[8px] uppercase tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                {result.type}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <header className="flex items-center justify-between px-3 py-2 safe-top">
      {/* Left: Hamburger Menu + Logo */}
      <div className="flex items-center gap-2">
        <AppSidebar onHistoryClick={onHistoryClick} />
        {!isOnProfile && (
          <button onClick={handleAvatarClick} className="flex flex-col items-center gap-0.5 relative -mt-1">
            <div className={`relative w-10 h-10 rounded-full flex items-center justify-center overflow-hidden hover:ring-2 transition-all ${
              profile?.is_premium 
                ? 'ring-2 ring-[hsl(45,100%,50%)] hover:ring-[hsl(45,100%,60%)]' 
                : 'bg-primary/20 hover:ring-primary'
            }`}>
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover rounded-full" />
              ) : (
                <span className="text-sm">👤</span>
              )}
            </div>
            {profile?.is_premium && (
              <Crown className="absolute -top-2 left-1/2 -translate-x-1/2 w-3.5 h-3.5 text-[hsl(45,100%,50%)] drop-shadow-sm" fill="hsl(45,100%,50%)" />
            )}
            <span className="text-[8px] font-bold text-primary leading-none">Lv.{userLevel}</span>
          </button>
        )}
      </div>
      {/* Right: Streak + Search + Bell */}
      <div className="flex items-center gap-2">
        {/* Admin Dashboard Button */}
        {showAdmin && (
          <button
            onClick={() => navigate("/admin")}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/15 hover:bg-primary/25 transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-bold text-primary hidden sm:inline">Admin</span>
          </button>
        )}

        {/* Streak Badge */}
        <div className="flex items-center gap-0.5">
          <Flame className="w-4 h-4 text-[hsl(var(--ef-streak))] streak-fire" />
          <span className="text-xs font-bold text-[hsl(var(--ef-streak))]">{streakDays}</span>
        </div>

        <button
          onClick={() => setShowSearch(true)}
          className="p-1 hover:bg-muted rounded-lg transition-colors"
        >
          <Search className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Notification Bell with Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="p-1 relative hover:bg-muted rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0 bg-popover border-border" align="end">
            <div className="p-3 border-b border-border">
              <h3 className="font-semibold text-foreground text-sm">Notifications</h3>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <span className="text-2xl mb-2">🔔</span>
                  <p className="text-sm text-muted-foreground">No notifications yet</p>
                </div>
              ) : notifications.map((notification) => {
                const isFollow = notification.type === "follow_request";
                const fromId = notification.from_user_id;
                const alreadyFollowed = fromId ? followedBackIds.has(fromId) : false;

                const handleFollowBack = async () => {
                  if (!profile?.id || !fromId || followLoading) return;
                  setFollowLoading(fromId);
                  await supabase.from("friendships").insert({ user_id: profile.id, friend_id: fromId, status: "accepted" });
                  sendFollowNotification(profile.id, fromId);
                  setFollowedBackIds(prev => new Set(prev).add(fromId));
                  setFollowLoading(null);
                };

                const handleViewProfile = () => {
                  if (fromId) navigate(`/user/${fromId}`);
                };

                return (
                  <div
                    key={notification.id}
                    className={`p-3 border-b border-border hover:bg-muted transition-colors ${
                      !notification.is_read ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div
                      className="cursor-pointer"
                      onClick={isFollow && fromId ? handleViewProfile : undefined}
                    >
                      <p className="text-sm text-foreground">{notification.title}</p>
                      {notification.message && <p className="text-xs text-muted-foreground">{notification.message}</p>}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(notification.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {isFollow && fromId && (
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          size="sm"
                          variant={alreadyFollowed ? "outline" : "default"}
                          className="h-7 text-xs gap-1"
                          disabled={alreadyFollowed || followLoading === fromId}
                          onClick={handleFollowBack}
                        >
                          {alreadyFollowed ? <Check className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />}
                          {alreadyFollowed ? "Following" : "Follow Back"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          onClick={handleViewProfile}
                        >
                          View Profile
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="p-2 border-t border-border">
              <button onClick={markAllRead} className="w-full text-center text-xs text-primary hover:underline">
                Mark all as read
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}

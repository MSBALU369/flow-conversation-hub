import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Bell, Play, Search, X, Flame, Crown } from "lucide-react";
import { EFLogo } from "@/components/ui/EFLogo";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Input } from "@/components/ui/input";
import { useProfile } from "@/hooks/useProfile";
import { LevelBadge } from "@/components/ui/LevelBadge";
import { supabase } from "@/integrations/supabase/client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface AppHeaderProps {
  streakDays?: number;
  level?: number;
  showLogout?: boolean;
  onlineCount?: number;
  onHistoryClick?: () => void;
}

// Dummy notifications
const dummyNotifications = [
  { id: 1, text: "Sarah liked your talent post", time: "2m ago", unread: true },
  { id: 2, text: "New friend request from John", time: "15m ago", unread: true },
  { id: 3, text: "You reached Level 2! 🎉", time: "1h ago", unread: true },
  { id: 4, text: "Mike started following you", time: "3h ago", unread: false },
  { id: 5, text: "Your streak is now 5 days!", time: "1d ago", unread: false },
];

interface SearchResult {
  type: "user" | "talent";
  id: string;
  title: string;
  subtitle: string;
  avatar?: string | null;
  userId?: string;
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
  const navigate = useNavigate();

  const userLevel = profile?.level ?? level;
  const unreadCount = dummyNotifications.filter(n => n.unread).length;

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
      const [usersRes, talentRes] = await Promise.all([
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
    // Navigate to profile for users, or talent user's profile for talent
    if (result.userId) {
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
                  <span className="text-sm">{result.type === "user" ? "👤" : "🎙️"}</span>
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
              {dummyNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 border-b border-border hover:bg-muted cursor-pointer transition-colors ${
                    notification.unread ? 'bg-primary/5' : ''
                  }`}
                >
                  <p className="text-sm text-foreground">{notification.text}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{notification.time}</p>
                </div>
              ))}
            </div>
            <div className="p-2 border-t border-border">
              <button className="w-full text-center text-xs text-primary hover:underline">
                View all notifications
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}

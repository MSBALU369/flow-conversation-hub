import { memo, useCallback, useEffect, useRef, useState } from "react";
import { Home, MessageCircle, Crown, Mic, BookOpen, ShieldCheck, Sparkles } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { isAdminOrRoot } from "@/pages/Admin";

export const BottomNav = memo(function BottomNav() {
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();
  const showAdmin = isAdminOrRoot(user?.email);
  const lastFetchRef = useRef(0);

  const navItems = [
    { icon: Home, label: "Connect", path: "/" },
    { icon: MessageCircle, label: "Chat", path: "/chat" },
    ...(showAdmin
      ? [{ icon: ShieldCheck, label: "Admin", path: "/admin" }]
      : [{ icon: Crown, label: "Premium", path: "/premium" }]),
    { icon: Mic, label: "Talent", path: "/talent" },
    { icon: BookOpen, label: "Learn", path: "/learn" },
  ];

  const fetchUnread = useCallback(async () => {
    // Throttle: skip if called within 2s
    const now = Date.now();
    if (now - lastFetchRef.current < 2000) return;
    lastFetchRef.current = now;

    if (!user?.id) return;

    // Use count-only queries (no data transfer)
    const [{ count: msgCount }, { count: missedCalls }] = await Promise.all([
      supabase
        .from("chat_messages")
        .select("id", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("is_read", false),
      supabase
        .from("call_history")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "missed_incoming"),
    ]);

    setUnreadCount((msgCount ?? 0) + (missedCalls ?? 0));
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    fetchUnread();

    const channel = supabase
      .channel("unread-badge")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "chat_messages",
        filter: `receiver_id=eq.${user.id}`,
      }, fetchUnread)
      .subscribe();

    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchUnread();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      channel.unsubscribe();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [user?.id, fetchUnread]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 glass-nav safe-bottom z-50">
      <div className="flex items-center justify-around py-3 px-4 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const badge = item.path === "/chat" ? unreadCount : 0;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "nav-item py-2 px-3 rounded-xl min-w-[56px]",
                isActive && "active"
              )}
            >
              <div className="relative">
                <item.icon className={cn(
                  "w-5 h-5 transition-all duration-200",
                  isActive && "text-primary"
                )} />
                {badge > 0 && (
                  <span className="absolute -top-1 -right-2 bg-destructive text-destructive-foreground text-[8px] font-bold px-1 rounded-full min-w-[14px] text-center">
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-[10px] font-medium tracking-wide mt-1",
                isActive && "text-primary"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
});

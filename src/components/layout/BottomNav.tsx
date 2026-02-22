import { Home, MessageCircle, Crown, Mic, BookOpen } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { icon: Home, label: "Connect", path: "/" },
  { icon: MessageCircle, label: "Chat", path: "/chat" },
  { icon: Crown, label: "Premium", path: "/premium" },
  { icon: Mic, label: "Talent", path: "/talent" },
  { icon: BookOpen, label: "Learn", path: "/learn" },
];

export function BottomNav() {
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const fetchUnread = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count } = await supabase
        .from("chat_messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("is_read", false);

      setUnreadCount(count ?? 0);

      // Realtime subscription for new/updated messages
      channel = supabase
        .channel("unread-badge")
        .on("postgres_changes", {
          event: "*",
          schema: "public",
          table: "chat_messages",
          filter: `receiver_id=eq.${user.id}`,
        }, () => {
          // Re-fetch count on any change
          supabase
            .from("chat_messages")
            .select("*", { count: "exact", head: true })
            .eq("receiver_id", user.id)
            .eq("is_read", false)
            .then(({ count: c }) => setUnreadCount(c ?? 0));
        })
        .subscribe();
    };

    fetchUnread();
    return () => { channel?.unsubscribe(); };
  }, []);

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
}

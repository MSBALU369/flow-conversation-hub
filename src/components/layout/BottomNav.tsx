import { Home, MessageCircle, Crown, Mic, BookOpen, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, label: "Connect", path: "/" },
  { icon: MessageCircle, label: "Chat", path: "/chat", badge: 3 },
  { icon: Crown, label: "Premium", path: "/premium" },
  { icon: Mic, label: "Talent", path: "/talent" },
  { icon: BookOpen, label: "Learn", path: "/learn" },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 glass-nav safe-bottom z-50">
      <div className="flex items-center justify-around py-3 px-4 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
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
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 bg-destructive text-destructive-foreground text-[8px] font-bold px-1 rounded-full min-w-[14px] text-center">
                    {item.badge}
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

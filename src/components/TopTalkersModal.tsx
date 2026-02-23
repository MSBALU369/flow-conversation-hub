import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trophy, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TopTalkersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TopTalker {
  user_id: string;
  username: string;
  avatar_url: string | null;
  total_minutes: number;
}

export function TopTalkersModal({ open, onOpenChange }: TopTalkersModalProps) {
  const [talkers, setTalkers] = useState<TopTalker[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;

    // Check cache
    const cacheKey = "top_talkers_cache";
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { data, ts } = JSON.parse(cached);
      if (Date.now() - ts < 3600000) { // 1 hour cache
        setTalkers(data);
        return;
      }
    }

    const fetchTopTalkers = async () => {
      setLoading(true);
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const { data } = await supabase
        .from("call_history")
        .select("user_id, duration")
        .gte("created_at", weekAgo);

      if (!data || data.length === 0) { setTalkers([]); setLoading(false); return; }

      // Aggregate by user
      const map = new Map<string, number>();
      data.forEach(c => {
        map.set(c.user_id, (map.get(c.user_id) || 0) + (c.duration || 0));
      });

      const sorted = [...map.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      const userIds = sorted.map(([id]) => id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", userIds);

      const profileMap = new Map((profiles || []).map(p => [p.id, p]));
      const result: TopTalker[] = sorted.map(([id, seconds]) => ({
        user_id: id,
        username: profileMap.get(id)?.username || "User",
        avatar_url: profileMap.get(id)?.avatar_url || null,
        total_minutes: Math.round(seconds / 60),
      }));

      setTalkers(result);
      localStorage.setItem(cacheKey, JSON.stringify({ data: result, ts: Date.now() }));
      setLoading(false);
    };
    fetchTopTalkers();
  }, [open]);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs p-0 max-h-[80vh] overflow-hidden [&>button]:hidden">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <DialogTitle className="text-sm font-bold text-foreground flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[hsl(45,100%,50%)]" />
            Top Talkers (This Week)
          </DialogTitle>
          <button onClick={() => onOpenChange(false)} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        <div className="px-4 pb-4 overflow-y-auto max-h-[calc(80vh-60px)]">
          {loading ? (
            <p className="text-xs text-muted-foreground text-center py-8">Loading leaderboard...</p>
          ) : talkers.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">No call activity this week</p>
          ) : (
            <div className="space-y-1.5">
              {talkers.map((t, i) => (
                <div key={t.user_id} className="flex items-center gap-2.5 px-2 py-2 rounded-lg bg-muted/30">
                  <span className="text-sm w-6 text-center">{medals[i] || `#${i + 1}`}</span>
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                    {t.avatar_url ? (
                      <img src={t.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs">{t.username[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{t.username}</p>
                  </div>
                  <span className="text-xs font-bold text-primary">{t.total_minutes}m</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

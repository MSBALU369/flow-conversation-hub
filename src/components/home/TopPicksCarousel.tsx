import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface PickItem {
  id: string;
  title: string;
  cover_url: string;
}

export function TopPicksCarousel() {
  const navigate = useNavigate();
  const [picks, setPicks] = useState<PickItem[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("affiliate_products")
        .select("id, title, cover_url")
        .eq("language", "English")
        .order("clicks_count", { ascending: false })
        .limit(3);
      if (data) setPicks(data as PickItem[]);
    })();
  }, []);

  return (
    <button
      onClick={() => navigate("/learn")}
      className="mt-4 w-full rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all text-left overflow-hidden"
    >
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10">
            <BookOpen className="w-3.5 h-3.5 text-primary" />
          </div>
          <p className="text-sm font-bold text-foreground">Recommended Books & Courses</p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
      </div>
      {picks.length > 0 && (
        <ScrollArea className="w-full">
          <div className="flex gap-2 px-3 pb-2.5">
            {picks.map(p => (
              <div key={p.id} className="shrink-0 w-[72px]">
                <img
                  src={p.cover_url}
                  alt={p.title}
                  className="w-full h-[96px] object-cover rounded-lg border border-border"
                  loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                />
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}
    </button>
  );
}

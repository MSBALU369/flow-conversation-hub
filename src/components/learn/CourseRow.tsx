import { useState } from "react";
import { Play, ExternalLink, TrendingUp } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { VideoPlayerModal } from "./VideoPlayerModal";

interface Course {
  id: string;
  title: string;
  subcategory: string;
  cover_url: string;
  affiliate_link: string;
  is_free: boolean;
  clicks_count: number;
}

interface Props {
  title: string;
  courses: Course[];
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?&]+)/);
  return match ? match[1] : null;
}

export function CourseRow({ title, courses }: Props) {
  const [videoModal, setVideoModal] = useState<{ embedUrl: string; title: string } | null>(null);

  const handleClick = async (course: Course) => {
    await supabase.rpc("increment_affiliate_click" as any, { p_product_id: course.id });

    if (course.is_free) {
      const videoId = extractYouTubeId(course.affiliate_link);
      if (videoId) {
        setVideoModal({ embedUrl: `https://www.youtube.com/embed/${videoId}`, title: course.title });
        return;
      }
    }
    window.open(course.affiliate_link, "_blank", "noopener,noreferrer");
  };

  if (courses.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className="text-base font-bold text-foreground mb-3 px-4">{title}</h2>
      <ScrollArea className="w-full">
        <div className="flex gap-3 px-4 pb-2">
          {courses.map(course => (
            <button
              key={course.id}
              onClick={() => handleClick(course)}
              className="group shrink-0 w-[140px] rounded-2xl overflow-hidden border border-border bg-card hover:border-primary/40 hover:shadow-lg transition-all text-left"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                <img
                  src={course.cover_url}
                  alt={course.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                />
                <div className="absolute top-1.5 left-1.5">
                  {course.is_free ? (
                    <span className="text-[7px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500 text-white shadow-sm">FREE</span>
                  ) : (
                    <span className="text-[7px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500 text-white shadow-sm">PREMIUM</span>
                  )}
                </div>
                {course.clicks_count > 5 && (
                  <div className="absolute bottom-1 right-1 flex items-center gap-0.5 bg-background/80 backdrop-blur-sm rounded-full px-1.5 py-0.5">
                    <TrendingUp className="w-2.5 h-2.5 text-primary" />
                    <span className="text-[7px] font-medium">{course.clicks_count}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {course.is_free ? (
                    <Play className="w-7 h-7 text-white drop-shadow-lg" />
                  ) : (
                    <ExternalLink className="w-5 h-5 text-white drop-shadow-lg" />
                  )}
                </div>
              </div>
              <div className="p-2">
                <p className="text-[10px] font-semibold text-foreground leading-tight line-clamp-2">{course.title}</p>
                <p className="text-[8px] text-muted-foreground mt-0.5">{course.subcategory}</p>
              </div>
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      {videoModal && (
        <VideoPlayerModal
          open={!!videoModal}
          onOpenChange={(open) => !open && setVideoModal(null)}
          embedUrl={videoModal.embedUrl}
          title={videoModal.title}
        />
      )}
    </div>
  );
}

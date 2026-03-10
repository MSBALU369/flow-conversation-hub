import { useNavigate } from "react-router-dom";
import { BookOpen, ChevronRight } from "lucide-react";

export function TopPicksCarousel() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/learn")}
      className="mt-4 w-full flex items-center justify-between gap-2 rounded-xl border border-border bg-card px-3 py-2.5 hover:border-primary/40 hover:shadow-md transition-all text-left"
    >
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
          <BookOpen className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">Recommended Books & Courses</p>
          
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
    </button>
  );
}

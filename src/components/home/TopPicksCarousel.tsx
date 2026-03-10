import { useNavigate } from "react-router-dom";
import { BookOpen, ChevronRight } from "lucide-react";

export function TopPicksCarousel() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/learn")}
      className="mt-4 w-full rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all text-left"
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
    </button>
  );
}

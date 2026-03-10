import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Map } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LearningRoadmapModal } from "@/components/learn/LearningRoadmapModal";
import { CourseRow } from "@/components/learn/CourseRow";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface Course {
  id: string;
  title: string;
  subcategory: string;
  cover_url: string;
  affiliate_link: string;
  is_free: boolean;
  clicks_count: number;
  category: string;
  language: string;
  target_country: string;
}

const LANGUAGES = [
  "English", "Hindi", "Telugu", "Tamil", "Spanish", "Arabic",
  "French", "German", "Portuguese", "Mandarin", "Russian", "Japanese",
];

export default function Learn() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState("English");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [roadmapOpen, setRoadmapOpen] = useState(false);

  const userCountry = profile?.country ?? "GLOBAL";

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("affiliate_products" as any)
        .select("*")
        .order("clicks_count", { ascending: false });
      setCourses((data as any as Course[]) || []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    return courses.filter(c =>
      c.language === language &&
      (c.target_country === "GLOBAL" || c.target_country === userCountry)
    );
  }, [courses, language, userCountry]);

  const categoryChips = useMemo(() => {
    const subs = new Set(filtered.map(c => c.subcategory).filter(Boolean));
    return ["All", ...Array.from(subs).sort()];
  }, [filtered]);

  const categoryFiltered = useMemo(() => {
    if (selectedCategory === "All") return filtered;
    return filtered.filter(c => c.subcategory === selectedCategory);
  }, [filtered, selectedCategory]);

  const books = useMemo(() =>
    categoryFiltered.filter(c => c.category === "book").slice(0, 10),
  [categoryFiltered]);

  const trendingCourses = useMemo(() =>
    categoryFiltered.filter(c => c.category === "course").slice(0, 10),
  [categoryFiltered]);

  // Reset category chip when language changes and chip no longer exists
  useEffect(() => {
    if (selectedCategory !== "All" && !categoryChips.includes(selectedCategory)) {
      setSelectedCategory("All");
    }
  }, [categoryChips, selectedCategory]);

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader
        streakDays={profile?.streak_count ?? 1}
        level={profile?.level ?? 1}
        showLogout
      />

      <main className="pt-4">
        {/* Header */}
        <div className="px-4 mb-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">Learn Hub</h1>
            <p className="text-xs text-muted-foreground">Courses, books & free masterclasses</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRoadmapOpen(true)}
            className="gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/10"
          >
            <Map className="w-3.5 h-3.5" />
            My Learning Path
          </Button>
        </div>

        {/* Language Filter */}
        <div className="px-4 mb-4">
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-[160px] h-9 text-sm rounded-xl border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map(lang => (
                <SelectItem key={lang} value={lang}>{lang}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Category Chips */}
        <div className="mb-5">
          <h2 className="text-sm font-bold text-foreground mb-2 px-4">🏷️ Browse by Category</h2>
          <ScrollArea className="w-full">
            <div className="flex gap-2 px-4 pb-2">
              {categoryChips.map(chip => (
                <button
                  key={chip}
                  onClick={() => setSelectedCategory(chip)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    selectedCategory === chip
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-muted-foreground border-border hover:border-primary/40"
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : books.length === 0 && trendingCourses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <p className="text-muted-foreground text-sm text-center">No content available for {language} yet.</p>
          </div>
        ) : (
          <>
            <CourseRow title="📚 Recommended Books" courses={books} />
            <CourseRow title="🎓 Trending Courses" courses={trendingCourses} />
          </>
        )}
      </main>

      <BottomNav />

      <LearningRoadmapModal
        open={roadmapOpen}
        onOpenChange={setRoadmapOpen}
        userXp={profile?.xp ?? 0}
        userLevel={profile?.level ?? 1}
      />
    </div>
  );
}

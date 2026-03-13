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

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export default function Learn() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState("English");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [roadmapOpen, setRoadmapOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<"all" | "book" | "course">("all");

  const userCountry = profile?.country ?? "GLOBAL";

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("affiliate_products")
        .select("*")
        .order("clicks_count", { ascending: false });
      setCourses(shuffleArray((data as any as Course[]) || []));
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
    const priorityOrder = ["English Mastery", "English", "IT(Software) & AI", "Govt Exams", "Communication"];
    const sorted = Array.from(subs).sort((a, b) => {
      const ai = priorityOrder.indexOf(a);
      const bi = priorityOrder.indexOf(b);
      if (ai !== -1 && bi !== -1) return ai - bi;
      if (ai !== -1) return -1;
      if (bi !== -1) return 1;
      return a.localeCompare(b);
    });
    return ["All", ...sorted];
  }, [filtered]);

  const categoryFiltered = useMemo(() => {
    let result = filtered;
    if (selectedCategory !== "All") result = result.filter(c => c.subcategory === selectedCategory);
    if (typeFilter !== "all") result = result.filter(c => c.category === typeFilter);
    // Prioritize items with reliable images (local, youtube, udemy) over Amazon (often blocked)
    const imageScore = (c: Course) => {
      if (!c.cover_url || c.cover_url.includes('ef-logo') || c.cover_url.includes('placeholder')) return 0;
      if (c.cover_url.startsWith('/')) return 3; // local
      if (c.cover_url.includes('ytimg.com') || c.cover_url.includes('udemycdn.com')) return 2; // reliable CDN
      return 1; // amazon etc (may be blocked)
    };

    // Sort by image reliability desc, then: ONE English first, others, remaining English
    result.sort((a, b) => imageScore(b) - imageScore(a));

    const eng = result.filter(c => c.subcategory?.toLowerCase().includes("english"));
    const rest = result.filter(c => !c.subcategory?.toLowerCase().includes("english"));
    const reordered: typeof result = [];
    if (eng.length > 0) reordered.push(eng[0]);
    reordered.push(...rest);
    reordered.push(...eng.slice(1));
    return reordered;
  }, [filtered, selectedCategory, typeFilter]);

  // Top picks = trending items (highest clicks) for user's country
  const topPicks = useMemo(() =>
    categoryFiltered.slice(0, 10),
  [categoryFiltered]);

  const books = useMemo(() =>
    categoryFiltered.filter(c => c.category === "book"),
  [categoryFiltered]);

  const trendingCourses = useMemo(() =>
    categoryFiltered.filter(c => c.category === "course"),
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

        {/* Language + Type Filter */}
        <div className="px-4 mb-4 flex items-center gap-2 flex-wrap">
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-[140px] h-9 text-sm rounded-xl border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map(lang => (
                <SelectItem key={lang} value={lang}>{lang}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            onClick={() => setTypeFilter(typeFilter === "book" ? "all" : "book")}
            className={`h-9 px-3.5 rounded-xl text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
              typeFilter === "book"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted text-muted-foreground border-border hover:border-primary/40"
            }`}
          >
            📚 Books
          </button>
          <button
            onClick={() => setTypeFilter(typeFilter === "course" ? "all" : "course")}
            className={`h-9 px-3.5 rounded-xl text-xs font-semibold border transition-colors flex items-center gap-1.5 ${
              typeFilter === "course"
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted text-muted-foreground border-border hover:border-primary/40"
            }`}
          >
            🎓 Courses
          </button>
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
        ) : topPicks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <p className="text-muted-foreground text-sm text-center">Coming soon in {language}.</p>
          </div>
        ) : (
          <>
            <CourseRow title="🔥 Top Picks for You" courses={topPicks} />
            <CourseRow title="📚 Best-Selling Books" courses={books} />
            <CourseRow title="🎓 Recommended Courses" courses={trendingCourses} />
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

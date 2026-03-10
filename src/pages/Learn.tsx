import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Play, Lock, CheckCircle2, Star, Trophy, Zap, ExternalLink, TrendingUp } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface Course {
  id: string;
  title: string;
  subcategory: string;
  cover_url: string;
  affiliate_link: string;
  is_free: boolean;
  clicks_count: number;
}

const roadmapLevels = [
  { level: 1, title: "Beginner Basics", desc: "Start your English journey", xpNeeded: 0, subcategory: "English", icon: "🌱" },
  { level: 2, title: "Grammar Foundations", desc: "Master essential grammar rules", xpNeeded: 100, subcategory: "English", icon: "📖" },
  { level: 3, title: "Speaking Confidence", desc: "Build fluency in conversations", xpNeeded: 300, subcategory: "English", icon: "🗣️" },
  { level: 4, title: "IELTS / TOEFL Prep", desc: "Prepare for international exams", xpNeeded: 600, subcategory: "English", icon: "🎯" },
  { level: 5, title: "IT & Tech Skills", desc: "Learn programming & web dev", xpNeeded: 1000, subcategory: "IT", icon: "💻" },
  { level: 6, title: "Cloud Computing", desc: "AWS, Azure & cloud certifications", xpNeeded: 1500, subcategory: "Cloud", icon: "☁️" },
];

export default function Learn() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const userXp = profile?.xp ?? 0;
  const userLevel = profile?.level ?? 1;

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("affiliate_products" as any)
        .select("*")
        .eq("category", "course")
        .order("clicks_count", { ascending: false });
      setCourses((data as any as Course[]) || []);
      setLoading(false);
    })();
  }, []);

  const handleCourseClick = async (course: Course) => {
    await supabase.rpc("increment_affiliate_click" as any, { p_product_id: course.id });
    window.open(course.affiliate_link, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader
        streakDays={profile?.streak_count ?? 1}
        level={profile?.level ?? 1}
        showLogout
      />

      <main className="pt-4">
        <div className="px-4 mb-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Learn Hub
            </h1>
            <p className="text-xs text-muted-foreground">Your gamified learning roadmap</p>
          </div>
        </div>

        {/* XP Progress Card */}
        <div className="mx-4 mb-6 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/5 to-accent/10 p-4 border border-primary/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Level {userLevel}</p>
                <p className="text-[10px] text-muted-foreground">{userXp} XP earned</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Next milestone</p>
              <p className="text-sm font-bold text-primary">
                {roadmapLevels.find(r => r.xpNeeded > userXp)?.xpNeeded ?? "MAX"} XP
              </p>
            </div>
          </div>
          <Progress value={Math.min(100, (userXp / 1500) * 100)} className="h-2" />
        </div>

        {/* ROADMAP */}
        <div className="px-4 mb-6">
          <h2 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
            🗺️ Learning Roadmap
          </h2>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

            <div className="space-y-4">
              {roadmapLevels.map((stage, i) => {
                const isUnlocked = userXp >= stage.xpNeeded;
                const isCurrent = isUnlocked && (i === roadmapLevels.length - 1 || userXp < roadmapLevels[i + 1].xpNeeded);
                const stageCourses = courses.filter(c => c.subcategory === stage.subcategory);

                return (
                  <div key={stage.level} className="relative pl-14">
                    {/* Node circle */}
                    <div className={`absolute left-3.5 top-3 w-5 h-5 rounded-full border-2 flex items-center justify-center z-10 ${
                      isCurrent ? "border-primary bg-primary text-primary-foreground" :
                      isUnlocked ? "border-primary/60 bg-primary/20 text-primary" :
                      "border-muted-foreground/30 bg-muted text-muted-foreground"
                    }`}>
                      {isUnlocked ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <Lock className="w-2.5 h-2.5" />
                      )}
                    </div>

                    <div className={`rounded-2xl border p-4 transition-all ${
                      isCurrent ? "border-primary/40 bg-primary/5 shadow-md shadow-primary/10" :
                      isUnlocked ? "border-border bg-card" :
                      "border-border/50 bg-muted/30 opacity-60"
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{stage.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-foreground">Level {stage.level}: {stage.title}</h3>
                            {isCurrent && (
                              <Badge className="text-[8px] h-4 bg-primary text-primary-foreground">CURRENT</Badge>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground">{stage.desc}</p>
                        </div>
                        <span className="text-[9px] text-muted-foreground font-medium">{stage.xpNeeded} XP</span>
                      </div>

                      {/* Courses for this stage */}
                      {isUnlocked && stageCourses.length > 0 && (
                        <ScrollArea className="w-full mt-3">
                          <div className="flex gap-2">
                            {stageCourses.map(course => (
                              <button
                                key={course.id}
                                onClick={() => handleCourseClick(course)}
                                className="group shrink-0 w-[120px] rounded-xl overflow-hidden border border-border bg-background hover:border-primary/40 transition-all"
                              >
                                <div className="relative aspect-video overflow-hidden bg-muted">
                                  <img
                                    src={course.cover_url}
                                    alt={course.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                    loading="lazy"
                                    onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                                  />
                                  <div className="absolute top-1 left-1">
                                    {course.is_free ? (
                                      <span className="text-[7px] font-bold px-1.5 py-0.5 rounded-full bg-green-500 text-white">🟢 FREE</span>
                                    ) : (
                                      <span className="text-[7px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500 text-white">⭐ PREMIUM</span>
                                    )}
                                  </div>
                                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Play className="w-6 h-6 text-white" />
                                  </div>
                                </div>
                                <div className="p-1.5">
                                  <p className="text-[9px] font-semibold text-foreground leading-tight line-clamp-2 text-left">{course.title}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                          <ScrollBar orientation="horizontal" />
                        </ScrollArea>
                      )}

                      {!isUnlocked && (
                        <p className="text-[10px] text-muted-foreground mt-2 italic">
                          🔒 Earn {stage.xpNeeded - userXp} more XP to unlock
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* All courses browse */}
        <div className="px-4 mb-8">
          <h2 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
            🎓 Browse All Courses
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {courses.map(course => (
              <button
                key={course.id}
                onClick={() => handleCourseClick(course)}
                className="group rounded-2xl overflow-hidden border border-border bg-card hover:border-primary/40 hover:shadow-lg transition-all text-left"
              >
                <div className="relative aspect-video overflow-hidden bg-muted">
                  <img
                    src={course.cover_url}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    loading="lazy"
                    onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
                  />
                  <div className="absolute top-2 left-2">
                    {course.is_free ? (
                      <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-green-500 text-white shadow">🟢 FREE</span>
                    ) : (
                      <span className="text-[8px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white shadow">⭐ PREMIUM</span>
                    )}
                  </div>
                  {course.clicks_count > 0 && (
                    <div className="absolute bottom-1 right-1 flex items-center gap-0.5 bg-background/80 backdrop-blur-sm rounded-full px-1.5 py-0.5">
                      <TrendingUp className="w-2.5 h-2.5 text-primary" />
                      <span className="text-[7px] font-medium">{course.clicks_count}</span>
                    </div>
                  )}
                </div>
                <div className="p-2.5">
                  <p className="text-[11px] font-semibold text-foreground leading-tight line-clamp-2">{course.title}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Badge variant="secondary" className="text-[7px] h-3.5">{course.subcategory}</Badge>
                    <ExternalLink className="w-2.5 h-2.5 text-primary ml-auto" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

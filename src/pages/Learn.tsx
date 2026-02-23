import { useState } from "react";
import { BookOpen, Globe, Laptop, Building, Lock, ArrowRight, ArrowLeft, ExternalLink, ShoppingBag, GraduationCap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { useProfile } from "@/hooks/useProfile";

const categories = [
  {
    id: "english",
    title: "English",
    description: "IELTS, TOEFL, Spoken English",
    icon: Globe,
    color: "bg-primary/20",
    iconColor: "text-primary",
    courses: 12,
    locked: false,
  },
  {
    id: "it",
    title: "IT & Tech",
    description: "Programming, Web Dev, AI/ML",
    icon: Laptop,
    color: "bg-accent/20",
    iconColor: "text-accent",
    courses: 8,
    locked: true,
  },
  {
    id: "govt",
    title: "Government",
    description: "UPSC, SSC, Banking",
    icon: Building,
    color: "bg-[hsl(var(--ef-streak))]/20",
    iconColor: "text-[hsl(var(--ef-streak))]",
    courses: 15,
    locked: true,
  },
];

const affiliateResources = [
  { title: "Word Power Made Easy", author: "Norman Lewis", url: "https://www.amazon.in/dp/110187385X", desc: "The #1 vocabulary builder", type: "book" as const },
  { title: "English Grammar in Use", author: "Raymond Murphy", url: "https://www.amazon.in/dp/1108457657", desc: "Best-selling grammar reference", type: "book" as const },
  { title: "Atomic Habits", author: "James Clear", url: "https://www.amazon.in/dp/0735211299", desc: "Build better learning habits", type: "book" as const },
  { title: "Complete English Course", platform: "Udemy", url: "https://www.udemy.com/course/the-complete-english-language-course/", desc: "Beginner to Advanced", type: "course" as const },
  { title: "Learn English Specialization", platform: "Coursera", url: "https://www.coursera.org/specializations/learn-english", desc: "University-backed programme", type: "course" as const },
  { title: "English for Career Development", platform: "Coursera", url: "https://www.coursera.org/learn/english-for-career-development", desc: "Professional English skills", type: "course" as const },
];

export default function Learn() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [activeTab, setActiveTab] = useState<"learn" | "affiliate">("learn");

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader
        streakDays={profile?.streak_count ?? 1}
        level={profile?.level ?? 1}
        showLogout
      />

      <main className="px-4 pt-4">
        <button onClick={() => navigate(-1)} className="mb-3 p-2 rounded-full hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        {/* Tab Switcher */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab("learn")}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === "learn" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
          >
            <GraduationCap className="w-4 h-4 inline mr-1" /> Learn Hub
          </button>
          <button
            onClick={() => setActiveTab("affiliate")}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === "affiliate" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
          >
            <ShoppingBag className="w-4 h-4 inline mr-1" /> Affiliate Store
          </button>
        </div>

        {activeTab === "learn" && (
          <>
        {/* Hero */}
        <div className="glass-card-glow p-6 mb-6 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-primary/20 flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Learn Hub</h1>
          <p className="text-muted-foreground">
            Master new skills with our curated courses
          </p>
          <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-primary/10 rounded-full">
            <span className="text-primary text-sm font-medium">Coming Soon</span>
          </div>
        </div>

        {/* Categories */}
        <h2 className="text-lg font-semibold text-foreground mb-4">Categories</h2>
        <div className="space-y-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className="glass-card p-4 flex items-center gap-4 relative overflow-hidden"
            >
              {/* Icon */}
              <div className={`w-14 h-14 rounded-2xl ${category.color} flex items-center justify-center shrink-0`}>
                <category.icon className={`w-7 h-7 ${category.iconColor}`} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">{category.title}</h3>
                  {category.locked && (
                    <Lock className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">{category.description}</p>
                <p className="text-xs text-primary mt-1">{category.courses} courses</p>
              </div>

              {/* Arrow */}
              <ArrowRight className="w-5 h-5 text-muted-foreground shrink-0" />

              {/* Locked overlay */}
              {category.locked && (
                <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center">
                  <span className="text-sm text-muted-foreground">Coming Soon</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Recommended Books */}
        <h2 className="text-lg font-semibold text-foreground mt-8 mb-4">📚 Recommended Books</h2>
        <div className="space-y-3">
          {[
            { title: "Word Power Made Easy", author: "Norman Lewis", url: "https://www.amazon.in/dp/110187385X", desc: "The #1 vocabulary builder worldwide" },
            { title: "English Grammar in Use", author: "Raymond Murphy", url: "https://www.amazon.in/dp/1108457657", desc: "Best-selling grammar reference & practice" },
          ].map((book) => (
            <a
              key={book.title}
              href={book.url}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-card p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors group"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground text-sm">{book.title}</h3>
                <p className="text-xs text-muted-foreground">by {book.author}</p>
                <p className="text-xs text-primary mt-0.5">{book.desc}</p>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
            </a>
          ))}
        </div>

        {/* Recommended Courses */}
        <h2 className="text-lg font-semibold text-foreground mt-8 mb-4">🎓 Top Courses</h2>
        <div className="space-y-3 mb-8">
          {[
            { title: "Complete English Course", platform: "Udemy", url: "https://www.udemy.com/course/the-complete-english-language-course/", desc: "Beginner to Advanced — all-in-one" },
            { title: "Learn English Specialization", platform: "Coursera", url: "https://www.coursera.org/specializations/learn-english", desc: "University-backed English programme" },
          ].map((course) => (
            <a
              key={course.title}
              href={course.url}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-card p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors group"
            >
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
                <Globe className="w-6 h-6 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground text-sm">{course.title}</h3>
                <p className="text-xs text-muted-foreground">{course.platform}</p>
                <p className="text-xs text-accent mt-0.5">{course.desc}</p>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-accent shrink-0 transition-colors" />
            </a>
          ))}
        </div>
          </>
        )}

        {activeTab === "affiliate" && (
          <div className="space-y-4">
            <div className="glass-card-glow p-5 text-center">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-accent/20 flex items-center justify-center">
                <ShoppingBag className="w-7 h-7 text-accent" />
              </div>
              <h2 className="text-lg font-bold text-foreground mb-1">Affiliate Resources</h2>
              <p className="text-sm text-muted-foreground">Curated books & courses to boost your English</p>
            </div>

            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-primary" /> Books
            </h3>
            <div className="space-y-2">
              {affiliateResources.filter(r => r.type === "book").map(item => (
                <a
                  key={item.title}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-card p-3 flex items-center gap-3 hover:bg-muted/50 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-foreground text-sm">{item.title}</h4>
                    <p className="text-[10px] text-muted-foreground">by {"author" in item ? item.author : ""}</p>
                    <p className="text-[10px] text-primary">{item.desc}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0" />
                </a>
              ))}
            </div>

            <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5 mt-4">
              <GraduationCap className="w-4 h-4 text-accent" /> Courses
            </h3>
            <div className="space-y-2 mb-8">
              {affiliateResources.filter(r => r.type === "course").map(item => (
                <a
                  key={item.title}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glass-card p-3 flex items-center gap-3 hover:bg-muted/50 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
                    <Globe className="w-5 h-5 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-foreground text-sm">{item.title}</h4>
                    <p className="text-[10px] text-muted-foreground">{"platform" in item ? item.platform : ""}</p>
                    <p className="text-[10px] text-accent">{item.desc}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-accent shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

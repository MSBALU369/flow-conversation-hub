import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, GraduationCap, ExternalLink, TrendingUp, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/layout/AppHeader";
import { BottomNav } from "@/components/layout/BottomNav";
import { useProfile } from "@/hooks/useProfile";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface AffiliateProduct {
  id: string;
  title: string;
  category: string;
  subcategory: string;
  cover_url: string;
  affiliate_link: string;
  is_free: boolean;
  clicks_count: number;
}

export default function Recommendations() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const [products, setProducts] = useState<AffiliateProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("affiliate_products" as any)
        .select("*")
        .order("clicks_count", { ascending: false });
      setProducts((data as any as AffiliateProduct[]) || []);
      setLoading(false);
    })();
  }, []);

  const handleClick = async (product: AffiliateProduct) => {
    // Track click before redirecting
    await supabase.rpc("increment_affiliate_click" as any, { p_product_id: product.id });
    window.open(product.affiliate_link, "_blank", "noopener,noreferrer");
  };

  const books = products.filter(p => p.category === "book");
  const courses = products.filter(p => p.category === "course");

  const bookSubcategories = [...new Set(books.map(b => b.subcategory))];
  const courseSubcategories = [...new Set(courses.map(c => c.subcategory))];

  const renderRow = (title: string, items: AffiliateProduct[], icon: React.ReactNode) => (
    <div className="mb-8">
      <div className="flex items-center gap-2 px-4 mb-3">
        {icon}
        <h2 className="text-base font-bold text-foreground">{title}</h2>
        <span className="text-xs text-muted-foreground ml-auto">{items.length} items</span>
      </div>
      <ScrollArea className="w-full">
        <div className="flex gap-3 px-4 pb-4">
          {items.map(item => (
            <button
              key={item.id}
              onClick={() => handleClick(item)}
              className="group shrink-0 w-[140px] rounded-2xl overflow-hidden border border-border bg-card hover:border-primary/40 transition-all hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 duration-200"
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                <img
                  src={item.cover_url}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder.svg";
                  }}
                />
                {/* Badge overlay */}
                <div className="absolute top-2 left-2">
                  {item.is_free ? (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-green-500 text-white shadow-md">
                      🟢 FREE
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white shadow-md">
                      ⭐ PREMIUM
                    </span>
                  )}
                </div>
                {/* Click count */}
                {item.clicks_count > 0 && (
                  <div className="absolute bottom-2 right-2 flex items-center gap-0.5 bg-background/80 backdrop-blur-sm rounded-full px-1.5 py-0.5">
                    <TrendingUp className="w-2.5 h-2.5 text-primary" />
                    <span className="text-[8px] font-medium text-foreground">{item.clicks_count}</span>
                  </div>
                )}
              </div>
              <div className="p-2.5">
                <p className="text-[11px] font-semibold text-foreground leading-tight line-clamp-2 text-left">
                  {item.title}
                </p>
                <div className="flex items-center gap-1 mt-1.5">
                  <ExternalLink className="w-2.5 h-2.5 text-primary" />
                  <span className="text-[9px] text-primary font-medium">
                    {item.is_free ? "Watch Free" : "Get Now"}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );

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
              <Sparkles className="w-5 h-5 text-primary" />
              Recommended for You
            </h1>
            <p className="text-xs text-muted-foreground">Handpicked books & courses to level up your skills</p>
          </div>
        </div>

        {/* Hero banner */}
        <div className="mx-4 mb-6 rounded-2xl bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20 p-5 border border-primary/20">
          <p className="text-sm font-bold text-foreground">🔥 Trending This Week</p>
          <p className="text-xs text-muted-foreground mt-1">
            Top picks by our community — learn English, build tech skills, and grow your mind.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* BOOKS SECTION */}
            <div className="mb-6">
              <div className="px-4 mb-4">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" /> 📚 Books
                </h2>
              </div>
              {bookSubcategories.map(sub => renderRow(
                sub,
                books.filter(b => b.subcategory === sub),
                <Badge variant="secondary" className="text-[9px]">{sub}</Badge>
              ))}
            </div>

            {/* COURSES SECTION */}
            <div className="mb-6">
              <div className="px-4 mb-4">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-accent" /> 🎓 Courses
                </h2>
              </div>
              {courseSubcategories.map(sub => renderRow(
                sub,
                courses.filter(c => c.subcategory === sub),
                <Badge variant="secondary" className="text-[9px]">{sub}</Badge>
              ))}
            </div>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

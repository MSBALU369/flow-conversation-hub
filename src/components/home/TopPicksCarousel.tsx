import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ExternalLink, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Product {
  id: string;
  title: string;
  cover_url: string;
  affiliate_link: string;
  is_free: boolean;
}

export function TopPicksCarousel() {
  const [picks, setPicks] = useState<Product[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("affiliate_products" as any)
        .select("id, title, cover_url, affiliate_link, is_free")
        .eq("is_free", false)
        .order("clicks_count", { ascending: false })
        .limit(3);
      setPicks((data as any as Product[]) || []);
    })();
  }, []);

  const handleClick = async (product: Product) => {
    await supabase.rpc("increment_affiliate_click" as any, { p_product_id: product.id });
    window.open(product.affiliate_link, "_blank", "noopener,noreferrer");
  };

  if (picks.length === 0) return null;

  return (
    <div className="mt-4 glass-card p-3">
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-primary" />
          Top Picks for You
        </h3>
        <button
          onClick={() => navigate("/learn")}
          className="text-[10px] text-primary font-semibold hover:underline"
        >
          See all →
        </button>
      </div>
      <div className="flex gap-2.5">
        {picks.map(item => (
          <button
            key={item.id}
            onClick={() => handleClick(item)}
            className="group flex-1 rounded-xl overflow-hidden border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all"
          >
            <div className="relative aspect-[3/4] overflow-hidden bg-muted">
              <img
                src={item.cover_url}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
                onError={(e) => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }}
              />
              <div className="absolute top-1 left-1">
                <span className="text-[6px] font-bold px-1 py-0.5 rounded-full bg-amber-500 text-white">PREMIUM</span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-2">
                <ExternalLink className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="p-1.5">
              <p className="text-[8px] font-semibold text-foreground leading-tight line-clamp-2">{item.title}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";

interface SmartAppReviewProps {
  isPremium: boolean;
}

export function SmartAppReview({ isPremium }: SmartAppReviewProps) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);

  useEffect(() => {
    const key = "app_review_status";
    const lastPromptKey = "app_review_last_prompt";
    const status = localStorage.getItem(key);
    if (status === "rated") return;

    const lastPrompt = localStorage.getItem(lastPromptKey);
    const now = Date.now();
    const intervalMs = isPremium ? 30 * 86400000 : 15 * 86400000;

    if (lastPrompt && now - parseInt(lastPrompt) < intervalMs) return;

    // Show after 3 seconds
    const timer = setTimeout(() => {
      setOpen(true);
      localStorage.setItem(lastPromptKey, now.toString());
    }, 3000);
    return () => clearTimeout(timer);
  }, [isPremium]);

  const handleRate = () => {
    localStorage.setItem("app_review_status", "rated");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-center text-base">Enjoying English Flow? ⭐</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-3 py-2">
          <p className="text-xs text-muted-foreground text-center">Rate your experience to help us improve!</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} onClick={() => setRating(n)}>
                <Star className={`w-7 h-7 transition-colors ${n <= rating ? "text-[hsl(45,100%,50%)] fill-[hsl(45,100%,50%)]" : "text-muted-foreground"}`} />
              </button>
            ))}
          </div>
          <div className="flex gap-2 w-full">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => setOpen(false)}>Later</Button>
            <Button size="sm" className="flex-1" onClick={handleRate} disabled={rating === 0}>Submit</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

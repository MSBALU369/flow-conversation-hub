import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Flag, Info, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { trustScoreLikeCategories, trustScoreFlagCategories } from "@/lib/mockData";

interface TrustScoreModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// 5-stage health system
type HealthLevel = 1 | 2 | 3 | 4 | 5;

const healthConfig: Record<HealthLevel, { color: string; label: string; emoji: string; percent: number }> = {
  5: { color: "hsl(217,91%,60%)", label: "Elite", emoji: "🔵", percent: 100 },
  4: { color: "hsl(142,71%,45%)", label: "Excellent", emoji: "🟢", percent: 80 },
  3: { color: "hsl(48,96%,53%)", label: "Fair", emoji: "🟡", percent: 55 },
  2: { color: "hsl(25,95%,53%)", label: "Warning", emoji: "🟠", percent: 35 },
  1: { color: "hsl(0,72%,51%)", label: "At Risk", emoji: "🔴", percent: 15 },
};

const likeCategories = trustScoreLikeCategories;
const flagCategories = trustScoreFlagCategories;

type ActiveTab = "likes" | "flags";

export function TrustScoreModal({ open, onOpenChange }: TrustScoreModalProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("likes");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const navigate = useNavigate();
  // Default mock: Level 4 (Excellent)
  const healthLevel: HealthLevel = 4;
  const health = healthConfig[healthLevel];

  const totalLikes = likeCategories.reduce((s, c) => s + c.count, 0);
  const totalFlags = flagCategories.reduce((s, c) => s + c.count, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[340px] rounded-2xl p-0 gap-0 bg-background border-border overflow-hidden">
        <DialogHeader className="p-4 pb-3">
          <DialogTitle className="text-base font-bold text-foreground text-center">
            Trust Score & Feedback
          </DialogTitle>
        </DialogHeader>

        {/* Health Bar */}
        <div className="px-4 pb-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 font-medium">
            Account Health
          </p>
          <div className="relative h-3 rounded-full overflow-hidden bg-muted">
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
              style={{
                width: `${health.percent}%`,
                backgroundColor: health.color,
              }}
            />
          </div>
          <p className="text-center text-sm font-bold text-foreground mt-2">
            Account Status: <span style={{ color: health.color }}>{health.label}</span> {health.emoji}
          </p>
        </div>

        {/* Stats Cards (Tabs) */}
        <div className="px-4 pb-3">
          <div className="grid grid-cols-2 gap-2.5">
            {/* Caller Likes Card */}
            <button
              onClick={() => setActiveTab("likes")}
              className={cn(
                "rounded-xl border p-3 text-center transition-all",
                activeTab === "likes"
                  ? "border-[hsl(142,71%,45%)] bg-[hsl(142,71%,45%)]/10 ring-1 ring-[hsl(142,71%,45%)]/30"
                  : "border-[hsl(142,71%,45%)]/20 bg-[hsl(142,71%,45%)]/5"
              )}
            >
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1">
                Caller Likes
              </p>
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-2xl font-bold text-foreground">{totalLikes}</span>
                <Flag className="w-5 h-5 text-green-500 fill-green-500" />
              </div>
            </button>

            {/* Red Flags Card */}
            <button
              onClick={() => setActiveTab("flags")}
              className={cn(
                "rounded-xl border p-3 text-center transition-all",
                activeTab === "flags"
                  ? "border-destructive bg-destructive/10 ring-1 ring-destructive/30"
                  : "border-destructive/20 bg-destructive/5"
              )}
            >
              <div className="flex items-center justify-center gap-1 mb-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  Red Flags
                </p>
                <TooltipProvider delayDuration={0}>
                  <Tooltip open={showTooltip} onOpenChange={setShowTooltip}>
                    <TooltipTrigger asChild>
                      <span
                        onClick={(e) => { e.stopPropagation(); setShowTooltip(!showTooltip); }}
                        className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      >
                        <Info className="w-3 h-3" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[220px] text-xs">
                      Flags given by callers for bad behavior. Too many will result in a ban.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-2xl font-bold text-foreground">{totalFlags}</span>
                <Flag className="w-5 h-5 text-red-500 fill-red-500" />
              </div>
            </button>
          </div>
        </div>

        {/* Dynamic Bottom Section */}
        <div className="px-4 pb-4">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">
            {activeTab === "likes" ? "What Callers Like About You" : "Areas to Improve"}
          </p>
          <div className="space-y-1.5 max-h-[260px] overflow-y-auto">
            {activeTab === "likes"
              ? likeCategories.map((cat) => {
                  const isExpanded = expandedCategory === cat.label;
                  return (
                    <div key={cat.label}>
                      <button
                        onClick={() => setExpandedCategory(isExpanded ? null : cat.label)}
                        className="w-full flex items-center gap-2.5 p-2 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors"
                      >
                        <span className="text-base">{cat.emoji}</span>
                        <span className="text-sm text-foreground font-medium flex-1 text-left">{cat.label}</span>
                        <span className="text-[10px] font-bold bg-[hsl(142,71%,45%)]/15 text-[hsl(142,71%,45%)] px-2 py-0.5 rounded-full">
                          {cat.count}
                        </span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                      </button>
                      {isExpanded && (
                        <div className="ml-8 mt-1 space-y-1">
                          {cat.users.map((user) => (
                            <button
                              key={user.id}
                              onClick={() => { onOpenChange(false); navigate(`/user/${user.id}`); }}
                              className="w-full flex items-center gap-2 p-1.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                            >
                              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0">
                                {user.name.charAt(0)}
                              </div>
                              <span className="text-xs text-foreground">{user.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              : flagCategories.map((cat) => (
                    <div
                      key={cat.label}
                      className="flex items-center gap-2.5 p-2 rounded-xl bg-muted/40"
                    >
                      <Flag className="w-4 h-4 text-red-500 fill-red-500 flex-shrink-0" />
                      <span className="text-sm text-foreground font-medium flex-1 text-left">{cat.label}</span>
                      <span className="text-[10px] font-bold bg-destructive/15 text-destructive px-2 py-0.5 rounded-full">
                        {cat.count}
                      </span>
                    </div>
                  ))
            }
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

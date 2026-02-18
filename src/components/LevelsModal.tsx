import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { LevelBadge } from "@/components/ui/LevelBadge";
import { Trophy, Clock, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface LevelsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentLevel: number;
  currentXp: number;
}

const levels = [
  { level: 1, requirement: "1 minute", minutes: 1 },
  { level: 2, requirement: "10 minutes", minutes: 10 },
  { level: 3, requirement: "30 minutes", minutes: 30 },
  { level: 4, requirement: "60 minutes", minutes: 60 },
  { level: 5, requirement: "300 minutes", minutes: 300 },
  { level: 6, requirement: "10,080 minutes", minutes: 10080 },
  { level: 7, requirement: "43,200 minutes", minutes: 43200 },
  { level: 8, requirement: "64,800 minutes", minutes: 64800 },
  { level: 9, requirement: "86,400 minutes", minutes: 86400 },
  { level: 10, requirement: "129,600 minutes", minutes: 129600 },
  { level: 11, requirement: "172,800 minutes", minutes: 172800 },
  { level: 12, requirement: "216,000 minutes", minutes: 216000 },
  { level: 13, requirement: "259,200 minutes", minutes: 259200 },
  { level: 14, requirement: "302,400 minutes", minutes: 302400 },
  { level: 15, requirement: "345,600 minutes", minutes: 345600 },
];

export function LevelsModal({ open, onOpenChange, currentLevel, currentXp }: LevelsModalProps) {
  const currentLevelData = levels.find(l => l.level === currentLevel) || levels[0];
  const nextLevelData = levels.find(l => l.level === currentLevel + 1);
  
  const progressToNext = nextLevelData 
    ? Math.min(100, (currentXp / nextLevelData.minutes) * 100)
    : 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background/95 backdrop-blur-xl border-white/10 max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Trophy className="w-5 h-5 text-primary" />
            Speaker Levels
          </DialogTitle>
        </DialogHeader>

        {/* Current Progress */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <LevelBadge level={currentLevel} size="lg" />
              <span className="text-sm text-muted-foreground">Current Level</span>
            </div>
            {nextLevelData && (
              <span className="text-xs text-muted-foreground">
                Next: {nextLevelData.requirement}
              </span>
            )}
          </div>
          {nextLevelData ? (
            <div className="space-y-1">
              <Progress value={progressToNext} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                {currentXp} / {nextLevelData.minutes} minutes talked
              </p>
            </div>
          ) : (
            <p className="text-xs text-primary text-center font-medium">
              🎉 Maximum level achieved!
            </p>
          )}
        </div>

        {/* Levels List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {levels.map((levelData) => {
            const isCompleted = currentLevel >= levelData.level;
            const isCurrent = currentLevel === levelData.level;

            return (
              <div
                key={levelData.level}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border transition-all",
                  isCurrent
                    ? "bg-primary/10 border-primary/30"
                    : isCompleted
                    ? "bg-white/5 border-white/10 opacity-70"
                    : "bg-white/5 border-white/10"
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                    isCurrent
                      ? "bg-primary text-primary-foreground"
                      : isCompleted
                      ? "bg-green-500/20 text-green-400"
                      : "bg-white/10 text-muted-foreground"
                  )}
                >
                  {isCompleted && !isCurrent ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    levelData.level
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "font-medium text-sm",
                    isCurrent ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground"
                  )}>
                    Level {levelData.level}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{levelData.requirement} of talking</span>
                  </div>
                </div>

                {isCurrent && (
                  <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">
                    Current
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

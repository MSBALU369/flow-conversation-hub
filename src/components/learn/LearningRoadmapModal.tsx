import { CheckCircle2, Lock, Zap, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const roadmapLevels = [
  { level: 1, title: "Beginner Basics", desc: "Start your English journey", xpNeeded: 0, icon: "🌱" },
  { level: 2, title: "Grammar Foundations", desc: "Master essential grammar rules", xpNeeded: 100, icon: "📖" },
  { level: 3, title: "Speaking Confidence", desc: "Build fluency in conversations", xpNeeded: 300, icon: "🗣️" },
  { level: 4, title: "IELTS / TOEFL Prep", desc: "Prepare for international exams", xpNeeded: 600, icon: "🎯" },
  { level: 5, title: "IT & Tech Skills", desc: "Learn programming & web dev", xpNeeded: 1000, icon: "💻" },
  { level: 6, title: "Cloud Computing", desc: "AWS, Azure & cloud certifications", xpNeeded: 1500, icon: "☁️" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userXp: number;
  userLevel: number;
}

export function LearningRoadmapModal({ open, onOpenChange, userXp, userLevel }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] rounded-t-3xl bg-background">
        <SheetHeader className="pb-2">
          <SheetTitle className="text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            My Learning Path
          </SheetTitle>
        </SheetHeader>

        {/* XP Progress */}
        <div className="rounded-2xl bg-gradient-to-br from-primary/20 via-primary/5 to-accent/10 p-3 border border-primary/20 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center">
                <Zap className="w-4 h-4 text-primary" />
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

        {/* Roadmap */}
        <div className="overflow-y-auto max-h-[55vh] pr-1">
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
            <div className="space-y-3">
              {roadmapLevels.map((stage, i) => {
                const isUnlocked = userXp >= stage.xpNeeded;
                const isCurrent = isUnlocked && (i === roadmapLevels.length - 1 || userXp < roadmapLevels[i + 1].xpNeeded);

                return (
                  <div key={stage.level} className="relative pl-14">
                    <div className={`absolute left-3.5 top-3 w-5 h-5 rounded-full border-2 flex items-center justify-center z-10 ${
                      isCurrent ? "border-primary bg-primary text-primary-foreground" :
                      isUnlocked ? "border-primary/60 bg-primary/20 text-primary" :
                      "border-muted-foreground/30 bg-muted text-muted-foreground"
                    }`}>
                      {isUnlocked ? <CheckCircle2 className="w-3 h-3" /> : <Lock className="w-2.5 h-2.5" />}
                    </div>

                    <div className={`rounded-2xl border p-3 transition-all ${
                      isCurrent ? "border-primary/40 bg-primary/5 shadow-md shadow-primary/10" :
                      isUnlocked ? "border-border bg-card" :
                      "border-border/50 bg-muted/30 opacity-60"
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{stage.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-foreground">Lv.{stage.level}: {stage.title}</h3>
                            {isCurrent && <Badge className="text-[8px] h-4 bg-primary text-primary-foreground">CURRENT</Badge>}
                          </div>
                          <p className="text-[10px] text-muted-foreground">{stage.desc}</p>
                        </div>
                        <span className="text-[9px] text-muted-foreground font-medium">{stage.xpNeeded} XP</span>
                      </div>
                      {!isUnlocked && (
                        <p className="text-[10px] text-muted-foreground mt-1 italic">
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
      </SheetContent>
    </Sheet>
  );
}

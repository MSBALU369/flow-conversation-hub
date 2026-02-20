import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface SpeakWithModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPremium?: boolean;
  onPremiumRequired?: () => void;
}

const levels = ["Any", "1-5", "6-10", "11-20", "21+"];
const genders = ["Random", "Male", "Female"];

export function SpeakWithModal({ open, onOpenChange, isPremium, onPremiumRequired }: SpeakWithModalProps) {
  const [selectedLevel, setSelectedLevel] = useState("Any");
  const [selectedGender, setSelectedGender] = useState("Random");
  const navigate = useNavigate();

  const handleStart = () => {
    if (!isPremium) {
      onOpenChange(false);
      onPremiumRequired?.();
      return;
    }
    onOpenChange(false);
    navigate("/finding", { state: { levelFilter: selectedLevel, genderFilter: selectedGender } });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-base font-bold flex items-center gap-2">
            <Phone className="w-4 h-4 text-primary" />
            Speak With
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Level Filter */}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Level Range</p>
            <div className="flex flex-wrap gap-2">
              {levels.map(l => (
                <button
                  key={l}
                  onClick={() => setSelectedLevel(l)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    selectedLevel === l ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Gender Filter */}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Gender</p>
            <div className="flex gap-2">
              {genders.map(g => (
                <button
                  key={g}
                  onClick={() => setSelectedGender(g)}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-xs font-medium transition-all",
                    selectedGender === g ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={handleStart} className="w-full gap-2">
            <Phone className="w-4 h-4" />
            Start Speaking
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

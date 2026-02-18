import { Crown, Zap, Users, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PremiumModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PremiumModal({ open, onOpenChange }: PremiumModalProps) {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate("/premium");
  };

  const features = [
    { icon: Users, text: "Filter by Female or Male" },
    { icon: Zap, text: "Unlimited Daily Calls" },
    { icon: ShieldCheck, text: "Priority Matching" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border w-[calc(100%-3rem)] max-w-xs mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-3 glow-teal">
            <Crown className="w-8 h-8 text-primary-foreground" />
          </div>
          <DialogTitle className="text-xl font-bold text-foreground tracking-wide">
            Unlock Premium
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm mt-1">
            Choose who you practice with! Filter by gender and get matched with your preferred partners.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-2.5 mt-4">
          {features.map((feature, i) => (
            <div 
              key={i}
              className="flex items-center gap-3 p-2.5 glass-button rounded-xl"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                <feature.icon className="w-4.5 h-4.5 text-primary" />
              </div>
              <span className="text-foreground font-medium text-sm">{feature.text}</span>
            </div>
          ))}
        </div>

        <Button 
          onClick={handleUpgrade}
          className="w-full mt-4 py-5 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-base rounded-xl pulse-glow"
        >
          <Crown className="w-5 h-5 mr-2" />
          View Premium Plans
        </Button>
      </DialogContent>
    </Dialog>
  );
}

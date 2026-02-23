import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Database, Phone, Mail, CreditCard, Globe } from "lucide-react";

interface ToolMetricsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tool: {
    label: string;
    value: string;
    percent: number;
    details: { label: string; value: string }[];
  } | null;
}

const iconMap: Record<string, any> = {
  "Supabase DB": Database,
  "LiveKit": Phone,
  "Email Quota": Mail,
  "AdMob & Payments": CreditCard,
  "GoDaddy Domain": Globe,
};

export function ToolMetricsModal({ open, onOpenChange, tool }: ToolMetricsModalProps) {
  if (!tool) return null;
  const Icon = iconMap[tool.label] || Database;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border max-w-sm bg-background">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Icon className="w-5 h-5 text-primary" />
            {tool.label} — Detailed Metrics
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall Usage</span>
            <span className="font-semibold text-foreground">{tool.percent}%</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${tool.percent > 80 ? "bg-destructive" : "bg-primary"}`}
              style={{ width: `${tool.percent}%` }}
            />
          </div>
          <div className="space-y-2 pt-2">
            {tool.details.map((d) => (
              <div key={d.label} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-muted/50">
                <span className="text-xs text-muted-foreground">{d.label}</span>
                <span className="text-xs font-medium text-foreground">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";

interface ReportPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReportPaymentModal({ open, onOpenChange }: ReportPaymentModalProps) {
  const { profile } = useProfile();
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!profile?.id || !subject.trim() || loading) return;
    setLoading(true);
    const { error } = await supabase.from("support_tickets" as any).insert({
      user_id: profile.id,
      subject: subject.trim(),
      description: description.trim() || null,
      category: "payment",
    } as any);
    if (error) {
      toast({ title: "Failed to submit ticket", variant: "destructive" });
    } else {
      toast({ title: "Ticket submitted!", description: "Our team will review your issue shortly." });
      setSubject("");
      setDescription("");
      onOpenChange(false);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            Report Payment Issue
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Subject</p>
            <Input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="e.g. Payment deducted but premium not activated"
              className="h-8 text-sm"
            />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Details (optional)</p>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the issue..."
              className="text-sm min-h-[80px]"
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!subject.trim() || loading}
            className="w-full gap-2"
          >
            <Send className="w-4 h-4" />
            {loading ? "Submitting..." : "Submit Ticket"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

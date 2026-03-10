import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Send, MessageCircle, Globe, Clock, Shield, Ticket } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const categories = [
  { value: "payment", label: "💳 Payment Issue" },
  { value: "bug", label: "🐛 Bug Report" },
  { value: "abuse", label: "🚨 Report Abuse" },
  { value: "account", label: "👤 Account Help" },
  { value: "feature", label: "💡 Feature Request" },
  { value: "other", label: "📝 Other" },
];

export default function ContactUs() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("payment");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    if (!user) {
      toast({ title: "You must be logged in", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("support_tickets" as any).insert({
      user_id: user.id,
      subject: subject.trim(),
      description: message.trim(),
      category,
      status: "open",
    } as any);

    if (error) {
      toast({ title: "Failed to submit ticket", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Ticket Submitted! 🎫", description: "We'll review it within 24-48 hours." });
      setSubject("");
      setMessage("");
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <Mail className="w-5 h-5 text-primary" />
        <h1 className="text-lg font-semibold text-foreground">Contact & Support</h1>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* User Safety Notice */}
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-destructive" />
            <h2 className="text-sm font-semibold text-destructive">Safety First</h2>
          </div>
          <p className="text-xs text-foreground leading-relaxed">
            Users can report and block others at any time. <strong>Any abusive behavior will result in an immediate and permanent account ban.</strong> For urgent safety concerns, use the in-app report feature during or after a call.
          </p>
        </div>

        {/* Contact info cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-muted p-4 text-center">
            <Mail className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-xs font-medium text-foreground">Support</p>
            <p className="text-[10px] text-primary font-medium mt-1">help@englishflow.in</p>
            <p className="text-[9px] text-muted-foreground mt-0.5">User queries & help</p>
          </div>
          <div className="rounded-xl bg-muted p-4 text-center">
            <Globe className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-xs font-medium text-foreground">Partnerships</p>
            <p className="text-[10px] text-primary font-medium mt-1">collaborate@englishflow.in</p>
            <p className="text-[9px] text-muted-foreground mt-0.5">Companies & brands</p>
          </div>
          <div className="rounded-xl bg-muted p-4 text-center">
            <Clock className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-xs font-medium text-foreground">Response Time</p>
            <p className="text-[10px] text-muted-foreground mt-1">24-48 hours</p>
          </div>
          <div className="rounded-xl bg-muted p-4 text-center">
            <MessageCircle className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-xs font-medium text-foreground">Languages</p>
            <p className="text-[10px] text-muted-foreground mt-1">English, Hindi, Arabic</p>
          </div>
        </div>

        {/* Support Ticket Form */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Ticket className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">Submit a Support Ticket</p>
          </div>

          {/* Category Select */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {categories.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>

          <Input
            placeholder="Subject (e.g., Payment not received)"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="rounded-xl"
            maxLength={100}
          />
          <textarea
            placeholder="Describe your issue in detail..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            maxLength={1000}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
          <p className="text-[10px] text-muted-foreground text-right">{message.length}/1000</p>
          <Button onClick={handleSubmit} className="w-full gap-2" disabled={submitting}>
            {submitting ? (
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {submitting ? "Submitting..." : "Submit Ticket"}
          </Button>
        </div>

        <p className="text-[10px] text-muted-foreground/60 text-center">
          All tickets are reviewed by our team. You'll receive a response at your registered email address.
        </p>
      </main>
    </div>
  );
}

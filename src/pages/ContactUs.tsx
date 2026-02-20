import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Send, MessageCircle, Globe, Clock } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function ContactUs() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = () => {
    if (!subject.trim() || !message.trim()) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    toast({ title: "Message Sent!", description: "We'll get back to you within 24-48 hours." });
    setSubject("");
    setMessage("");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <Mail className="w-5 h-5 text-primary" />
        <h1 className="text-lg font-semibold text-foreground">Contact Us</h1>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Contact info cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-muted p-4 text-center">
            <Mail className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-xs font-medium text-foreground">Support</p>
            <p className="text-[10px] text-primary font-medium mt-1">help@englishflow.in</p>
            <p className="text-[9px] text-muted-foreground mt-0.5">For user queries and help</p>
          </div>
          <div className="rounded-xl bg-muted p-4 text-center">
            <Globe className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-xs font-medium text-foreground">Partnerships</p>
            <p className="text-[10px] text-primary font-medium mt-1">collaborate@englishflow.in</p>
            <p className="text-[9px] text-muted-foreground mt-0.5">For companies and brands</p>
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

        {/* Contact form */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">Send us a message</p>
          <Input
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="rounded-xl"
          />
          <textarea
            placeholder="Describe your issue or feedback..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
          <Button onClick={handleSubmit} className="w-full gap-2">
            <Send className="w-4 h-4" />
            Send Message
          </Button>
        </div>

        <p className="text-[10px] text-muted-foreground/60 text-center">
          For urgent safety concerns, please use the in-app report feature during or after a call.
        </p>
      </main>
    </div>
  );
}

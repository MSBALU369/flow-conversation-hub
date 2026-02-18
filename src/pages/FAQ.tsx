import { useNavigate } from "react-router-dom";
import { ArrowLeft, HelpCircle, ChevronDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    q: "What is English Flow?",
    a: "English Flow (EF) is a voice-based social platform that connects you with real people around the world to learn and practice English through real conversations. You get matched randomly or can call friends directly.",
  },
  {
    q: "Is my identity safe?",
    a: "Yes! Your real name and personal details are never shared. You interact using your chosen username and avatar only. We prioritize your privacy and safety.",
  },
  {
    q: "How does the energy/battery system work?",
    a: "You start with energy bars that deplete with short calls (under 30s) and recharge with longer calls (over 60s). A 20-minute call fully recharges your battery. Premium users get unlimited energy.",
  },
  {
    q: "What happens if someone is rude?",
    a: "You can report users after a call using the dislike button. Our moderation team reviews all reports and takes action including temporary or permanent bans for violations.",
  },
  {
    q: "How do levels and XP work?",
    a: "You earn XP by making calls, maintaining streaks, and engaging with the community. As you accumulate XP, you level up, unlocking new badges and features.",
  },
  {
    q: "Can I choose who to talk to?",
    a: "You can filter by gender (Random, Female, Male) on the home screen. You can also call friends directly from the Chat section. Premium users get additional filtering options.",
  },
  {
    q: "What is Premium?",
    a: "Premium gives you unlimited energy, gender filters, ad-free experience, a gold crown badge, and priority matching. Plans are available daily, weekly, monthly, and yearly.",
  },
  {
    q: "How do Rooms work?",
    a: "Rooms are group discussion spaces where multiple users can join and chat. You can create public or private rooms, set a topic, and invite friends using a room code.",
  },
];

export default function FAQ() {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <HelpCircle className="w-5 h-5 text-primary" />
        <h1 className="text-lg font-semibold text-foreground">Frequently Asked Questions</h1>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto space-y-2">
        {faqs.map((faq, i) => (
          <button
            key={i}
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="w-full text-left rounded-xl bg-muted p-4 transition-colors hover:bg-muted/80"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-foreground">{faq.q}</p>
              <ChevronDown className={cn("w-4 h-4 text-muted-foreground shrink-0 transition-transform", openIndex === i && "rotate-180")} />
            </div>
            {openIndex === i && (
              <p className="text-xs text-muted-foreground mt-3 leading-relaxed">{faq.a}</p>
            )}
          </button>
        ))}
      </main>
    </div>
  );
}

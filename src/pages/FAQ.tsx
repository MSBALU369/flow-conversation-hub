import { useNavigate } from "react-router-dom";
import { ArrowLeft, HelpCircle, ChevronDown, Shield } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    q: "What is English Flow?",
    a: "English Flow (EF) is a voice-based social platform that connects you with real people around the world to learn and practice English through live conversations. You get matched randomly or can call friends directly. Available globally in 190+ countries.",
  },
  {
    q: "Is my identity safe?",
    a: "Absolutely. Your real name, phone number, and personal details are never shared with other users. You interact using your chosen username and avatar only. We comply with GDPR (EU), CCPA (California), and global data protection regulations.",
  },
  {
    q: "Are voice calls recorded?",
    a: "No. All voice calls on English Flow are 100% private, not recorded, and not stored. Voice data is transmitted in real-time via encrypted WebRTC connections and is never saved on our servers or any third-party infrastructure.",
  },
  {
    q: "How does the energy/battery system work?",
    a: "You start with energy bars that deplete with very short calls (under 30 seconds) and recharge with longer calls (over 60 seconds). A 20-minute call fully recharges your battery. Premium users enjoy unlimited energy.",
  },
  {
    q: "What happens if someone is rude or abusive?",
    a: "You can report users after a call using the dislike/report button. Our moderation team reviews all reports within 24 hours. Users found violating our community guidelines face immediate action including temporary suspensions or permanent account bans. We maintain a zero-tolerance policy for harassment, hate speech, and abusive behavior.",
  },
  {
    q: "How do levels and XP work?",
    a: "You earn XP by making calls (5 XP per minute), maintaining daily streaks, completing achievements, and engaging with the community. As you accumulate XP, you level up, unlocking new badges, features, and recognition.",
  },
  {
    q: "Can I choose who to talk to?",
    a: "You can filter by gender (Random, Female, Male) on the home screen. You can also call friends directly from the Chat section. Premium users get additional filtering options including level-based matching.",
  },
  {
    q: "What is Premium?",
    a: "Premium gives you unlimited energy, gender & level filters, ad-free experience, a gold crown badge, priority matching, ghost mode, and profile visitor tracking. Plans are available daily, weekly, monthly, 6-month, and yearly with region-based pricing.",
  },
  {
    q: "How do Rooms work?",
    a: "Rooms are group discussion spaces where up to 20 users can join and text-chat in real time. You can create public or private rooms, set a topic, and invite friends using a unique room code.",
  },
  {
    q: "How do I report a user?",
    a: "After ending a call, tap the 'dislike' or 'report' button. Select the reason for your report and provide optional details. You can also report users from their profile page. All reports are reviewed by our moderation team.",
  },
  {
    q: "Can I block someone?",
    a: "Yes. You can block any user from their profile or from the chat screen. Blocked users cannot call you, message you, or see your online status. You can manage your blocked list from Profile Settings.",
  },
  {
    q: "How do I delete my account?",
    a: "Go to Profile Settings and tap 'Delete Account'. Your account will enter a 48-hour freeze period during which you can recover it. After 48 hours, your account and all associated data will be permanently erased.",
  },
  {
    q: "What age do I need to be?",
    a: "You must be at least 13 years old to use English Flow. Users under 18 should have parental consent. We reserve the right to terminate accounts of users who misrepresent their age.",
  },
  {
    q: "How do Flow Points work?",
    a: "Flow Points (FP) are our in-app currency. You earn them through calls (5 FP per 10+ minute call, max 20/day), referrals (50 FP per referral), and Premium bonuses. You can send Flow Points to friends as gifts.",
  },
  {
    q: "Is English Flow available in my country?",
    a: "English Flow is available worldwide. We support users from India, Middle East, Europe, Americas, Africa, and Asia-Pacific. Premium pricing is adjusted by region to ensure affordability.",
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
        {/* User Safety Notice */}
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-destructive" />
            <h2 className="text-sm font-semibold text-destructive">User Safety & Violations</h2>
          </div>
          <p className="text-xs text-foreground leading-relaxed">
            Users can report and block others at any time. <strong>Any abusive behavior — including harassment, hate speech, bullying, sexual content, or threats — will result in an immediate and permanent account ban.</strong> We maintain a zero-tolerance policy to ensure a safe community for all users.
          </p>
        </div>

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

        <p className="text-[10px] text-muted-foreground/60 text-center pt-4">
          Last updated: March 2026 • English Flow v2.0
        </p>
      </main>
    </div>
  );
}

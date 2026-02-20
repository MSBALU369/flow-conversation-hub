import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <Shield className="w-5 h-5 text-primary" />
        <h1 className="text-lg font-semibold text-foreground">Privacy Policy</h1>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6">
        <section className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <h2 className="text-sm font-semibold text-primary mb-2">🔒 Voice Call Privacy</h2>
          <p className="text-xs text-foreground leading-relaxed">
            All voice calls on English Flow are <strong>100% private, not recorded, and not saved</strong>. We do not have access to any audio content from your conversations. Your voice communications are completely ephemeral and exist only during the live call session.
          </p>
        </section>

        <section className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <h2 className="text-sm font-semibold text-primary mb-2">🛡️ Data Security</h2>
          <p className="text-xs text-foreground leading-relaxed">
            User data is <strong>highly secured</strong> using industry-standard encryption and access controls. All data is encrypted in transit (TLS) and at rest. We employ Row Level Security (RLS) policies to ensure users can only access their own data. Our infrastructure uses advanced encryption standards to protect your information at every level.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-foreground mb-2">1. Information We Collect</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            We collect your email address, username, avatar, gender preference, and location (city/country) during registration. Call metadata (duration, timestamps) is recorded for quality and safety purposes. We do not record or store any audio from your conversations.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-foreground mb-2">2. How We Use Your Data</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your data is used to provide the service, match you with speaking partners, track your progress (XP, levels, streaks), and enforce community guidelines. We never sell your personal information to third parties.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-foreground mb-2">3. Data Security</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            All data is encrypted in transit and at rest. We use industry-standard security practices including Row Level Security policies to ensure users can only access their own data. Authentication is handled through secure token-based systems.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-foreground mb-2">4. Your Rights</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            You can view, update, or delete your profile data at any time through the app settings. You may request a full data export or account deletion by contacting our support team. We will process such requests within 30 days.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-foreground mb-2">5. Cookies & Analytics</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            We use essential cookies for authentication and session management. Anonymous analytics help us improve the app experience. You can opt out of non-essential analytics in your profile settings.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-foreground mb-2">6. Changes to This Policy</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            We may update this policy from time to time. Significant changes will be communicated through in-app notifications. Continued use of the app after changes constitutes acceptance of the updated policy.
          </p>
        </section>

        <p className="text-[10px] text-muted-foreground/60 text-center pt-4">
          Last updated: February 2026
        </p>
      </main>
    </div>
  );
}

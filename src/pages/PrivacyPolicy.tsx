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
        <p className="text-xs text-muted-foreground">
          Effective Date: March 1, 2026 · Last Updated: March 10, 2026
        </p>
        <p className="text-xs text-foreground leading-relaxed">
          English Flow ("we", "us", "our") operates the English Flow mobile and web application (the "Service"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information. We comply with the General Data Protection Regulation (GDPR), California Consumer Privacy Act (CCPA), and other applicable data protection laws worldwide.
        </p>

        <section className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <h2 className="text-sm font-semibold text-primary mb-2">🔒 Voice Call Privacy</h2>
          <p className="text-xs text-foreground leading-relaxed">
            All voice calls are <strong>100% private, not recorded, and not stored</strong>. Voice data is transmitted via encrypted WebRTC connections in real-time and is never saved on our servers or any third-party infrastructure. We have zero access to the audio content of your conversations.
          </p>
        </section>

        <section className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <h2 className="text-sm font-semibold text-primary mb-2">🛡️ Data Security</h2>
          <p className="text-xs text-foreground leading-relaxed">
            All user data is protected using industry-standard encryption (AES-256 at rest, TLS 1.3 in transit). We implement strict Row Level Security (RLS) policies, role-based access controls, and regular security audits to ensure your personal information remains confidential and secure.
          </p>
        </section>

        <section className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
          <h2 className="text-sm font-semibold text-destructive mb-2">⚠️ User Violations & Safety</h2>
          <p className="text-xs text-foreground leading-relaxed">
            Users can report and block others at any time. <strong>Any abusive behavior — including harassment, hate speech, bullying, sexual content, impersonation, or threats — will result in an immediate and permanent account ban.</strong> We cooperate with law enforcement when required by applicable law.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-foreground mb-2">1. Information We Collect</h2>
          <p className="text-xs text-muted-foreground leading-relaxed mb-2">
            <strong>Account Data:</strong> Email address, username, avatar image, gender preference, country, and city during registration.
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed mb-2">
            <strong>Usage Data:</strong> Call metadata (duration, timestamps, partner IDs), XP progression, level, streak counts, coin transactions, and room participation.
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed mb-2">
            <strong>Device Data:</strong> Browser type, operating system, screen resolution, IP address, and push notification tokens (FCM).
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong>We do NOT collect:</strong> Phone numbers, real names (unless voluntarily provided), audio recordings, location GPS coordinates, or financial information (payments processed by third-party gateways).
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-foreground mb-2">2. How We Use Your Data</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            We use your data to: (a) provide and maintain the Service, (b) match you with speaking partners, (c) track your progress and achievements, (d) enforce community guidelines and process reports, (e) send transactional notifications, (f) improve app performance and user experience, and (g) prevent fraud and abuse. We never sell your personal information to third parties.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-foreground mb-2">3. Legal Basis for Processing (GDPR)</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            We process your data under: (a) <strong>Consent</strong> – you provide your data voluntarily during registration; (b) <strong>Contract</strong> – necessary to deliver the Service; (c) <strong>Legitimate Interest</strong> – improving security, preventing abuse, and enhancing user experience; (d) <strong>Legal Obligation</strong> – compliance with applicable laws and regulations.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-foreground mb-2">4. Data Sharing & Third Parties</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            We share data only with: (a) <strong>Supabase</strong> – database hosting & authentication; (b) <strong>LiveKit</strong> – real-time voice communication; (c) <strong>Firebase/Google</strong> – push notifications; (d) <strong>Payment processors</strong> (Razorpay/Stripe) – premium subscriptions (no financial data stored by us). All third parties are bound by data processing agreements.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-foreground mb-2">5. Your Rights</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Under GDPR, CCPA, and other applicable laws, you have the right to: (a) <strong>Access</strong> your personal data; (b) <strong>Rectify</strong> inaccurate data; (c) <strong>Delete</strong> your account and all data (via Settings → Delete Account); (d) <strong>Port</strong> your data; (e) <strong>Object</strong> to processing; (f) <strong>Withdraw consent</strong> at any time. Requests are processed within 30 days. California residents may also request disclosure of data sold or shared (we do not sell data).
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-foreground mb-2">6. Data Retention</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Account data is retained while your account is active. Upon account deletion, all data enters a 48-hour freeze period, after which it is permanently erased from all systems. Call metadata is retained for 90 days for moderation purposes, then automatically purged.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-foreground mb-2">7. Children's Privacy</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            English Flow is not intended for children under 13. We do not knowingly collect data from children under 13. If we discover that a child under 13 has created an account, we will immediately terminate it and delete all associated data.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-foreground mb-2">8. International Data Transfers</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your data may be transferred to and processed in countries outside your country of residence. We ensure all transfers comply with applicable data protection laws through Standard Contractual Clauses (SCCs) or equivalent safeguards.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-foreground mb-2">9. Cookies & Analytics</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            We use essential cookies for authentication and session management only. Anonymous analytics help us improve the app experience. We do not use advertising cookies or trackers. You can manage cookie preferences in your browser settings.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-foreground mb-2">10. Changes to This Policy</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            We may update this policy periodically. Material changes will be communicated through in-app notifications at least 30 days before they take effect. Continued use of the Service after changes constitutes acceptance of the updated policy.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-foreground mb-2">11. Contact Us</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            For privacy-related inquiries, data requests, or complaints, contact us at: <strong>privacy@englishflow.in</strong>. For EU residents, you may also lodge a complaint with your local Data Protection Authority.
          </p>
        </section>

        <p className="text-[10px] text-muted-foreground/60 text-center pt-4">
          © 2026 English Flow. All rights reserved. • Version 2.0
        </p>
      </main>
    </div>
  );
}

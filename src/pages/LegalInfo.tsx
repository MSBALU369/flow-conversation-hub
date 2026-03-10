import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Shield } from "lucide-react";

export default function LegalInfo() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <FileText className="w-5 h-5 text-primary" />
        <h1 className="text-lg font-semibold text-foreground">Terms of Service & Legal</h1>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6">
        <p className="text-xs text-muted-foreground">
          Effective Date: March 1, 2026 · Last Updated: March 10, 2026
        </p>
        <p className="text-xs text-foreground leading-relaxed">
          These Terms of Service ("Terms") govern your use of English Flow ("Service"). By accessing or using the Service, you agree to be bound by these Terms.
        </p>

        <section className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <h2 className="text-sm font-semibold text-primary mb-2">🔊 Voice Communication</h2>
          <p className="text-xs text-foreground leading-relaxed">
            Voice calls are <strong>100% private</strong>. We do not record, store, or monitor any voice conversations. All voice data is transmitted in real-time via encrypted WebRTC and is never saved.
          </p>
        </section>

        <section className="rounded-xl border border-primary/20 bg-primary/5 p-4">
          <h2 className="text-sm font-semibold text-primary mb-2">🛡️ User Data Protection</h2>
          <p className="text-xs text-foreground leading-relaxed">
            All user data is <strong>highly secured</strong> using AES-256 encryption at rest and TLS 1.3 in transit. We implement strict access controls, Row Level Security policies, and regular security audits.
          </p>
        </section>

        <section className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
          <h2 className="text-sm font-semibold text-destructive mb-2">⚠️ User Violations & Enforcement</h2>
          <p className="text-xs text-foreground leading-relaxed">
            Users can report and block others at any time. <strong>Any abusive behavior — including but not limited to harassment, hate speech, bullying, sexual content, threats, spam, impersonation, or sharing personal information without consent — will result in an immediate and permanent account ban.</strong> We reserve the right to terminate accounts at our sole discretion. Repeat offenders may be reported to law enforcement.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-foreground mb-2">1. Eligibility</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            You must be at least 13 years old to use English Flow. Users between 13 and 18 must have parental or guardian consent. By creating an account, you represent and warrant that you meet these eligibility requirements. We reserve the right to verify age and terminate accounts that misrepresent their age.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-foreground mb-2">2. Account Responsibilities</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. You must immediately notify us of any unauthorized use. Each person may only maintain one active account. Creating multiple accounts to evade bans or manipulate systems is strictly prohibited.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-foreground mb-2">3. Acceptable Use Policy</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            You agree NOT to: (a) harass, bully, threaten, or intimidate other users; (b) use hate speech, discriminatory language, or slurs; (c) share sexual, violent, or graphic content; (d) share personal information of others without consent; (e) spam, advertise, or solicit; (f) impersonate others or create misleading profiles; (g) attempt to hack, exploit, or reverse-engineer the Service; (h) use the Service for any illegal purpose; (i) engage in activities that disrupt the Service or other users' experience.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-foreground mb-2">4. Premium Subscriptions</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Premium plans are billed through our payment partners (Razorpay for India, Stripe for international). All payments are non-refundable except as required by applicable law. Plans auto-expire at the end of the subscription period. We reserve the right to modify pricing with 30 days notice. Premium benefits are personal and non-transferable.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-foreground mb-2">5. Intellectual Property</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            All content, trademarks, logos, and intellectual property within English Flow are owned by us or our licensors. User-generated content (voice recordings in Talent section) remains owned by the user but grants us a non-exclusive, worldwide, royalty-free license to display it within the platform. You may not reproduce, distribute, or create derivative works from our content without prior written consent.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-foreground mb-2">6. Limitation of Liability</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID FOR PREMIUM SERVICES IN THE 12 MONTHS PRECEDING THE CLAIM.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-foreground mb-2">7. Indemnification</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            You agree to indemnify, defend, and hold harmless English Flow, its officers, directors, employees, and agents from any claims, damages, or expenses (including reasonable attorney fees) arising from your use of the Service, your violation of these Terms, or your violation of any third-party rights.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-foreground mb-2">8. Dispute Resolution</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Any disputes shall first be attempted to be resolved through good-faith negotiation for 30 days. If unresolved, disputes shall be settled through binding arbitration under the rules of the applicable arbitration authority. You agree to waive your right to participate in class action lawsuits against English Flow. Nothing in this section prevents either party from seeking injunctive relief in court for intellectual property or data protection matters.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-foreground mb-2">9. Governing Law</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            These Terms shall be governed by and construed in accordance with the laws of India. For users in the European Union, mandatory consumer protection laws of your country of residence shall also apply. Any legal proceedings shall be conducted in the courts of [Registered Jurisdiction].
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-foreground mb-2">10. Termination</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            We may suspend or terminate your account at any time for violation of these Terms or for any reason at our sole discretion. Upon termination, your right to use the Service immediately ceases. Account deletion follows our 48-hour freeze policy. Provisions that by their nature should survive termination shall survive (including limitations of liability, indemnification, and dispute resolution).
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-foreground mb-2">11. Contact</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            For legal inquiries: <strong>legal@englishflow.in</strong><br />
            For support: <strong>help@englishflow.in</strong><br />
            For partnerships: <strong>collaborate@englishflow.in</strong>
          </p>
        </section>

        <p className="text-[10px] text-muted-foreground/60 text-center pt-4">
          © 2026 English Flow. All rights reserved. • Version 2.0
        </p>
      </main>
    </div>
  );
}

import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";

export default function LegalInfo() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <FileText className="w-5 h-5 text-primary" />
        <h1 className="text-lg font-semibold text-foreground">Legal Information</h1>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6">
        <section>
          <h2 className="text-sm font-semibold text-foreground mb-2">Terms of Service</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            By using English Flow, you agree to our terms. You must be at least 13 years old to use this service. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-foreground mb-2">Acceptable Use</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Users must not engage in harassment, hate speech, spam, or any illegal activity. Sharing personal information of others without consent is strictly prohibited. Violations may result in temporary or permanent account suspension.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-foreground mb-2">Intellectual Property</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            All content, trademarks, and intellectual property within English Flow are owned by us or our licensors. User-generated content (voice recordings in Talent section) remains owned by the user but grants us a license to display it within the platform.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-foreground mb-2">Limitation of Liability</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            English Flow is provided "as is" without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the service. Our total liability shall not exceed the amount you paid for Premium services.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-foreground mb-2">Dispute Resolution</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Any disputes shall be resolved through binding arbitration in accordance with applicable laws. Users agree to waive their right to participate in class action lawsuits against English Flow.
          </p>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-foreground mb-2">Governing Law</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            These terms shall be governed by and construed in accordance with applicable international laws. Any legal proceedings shall be conducted in the jurisdiction where the company is registered.
          </p>
        </section>

        <p className="text-[10px] text-muted-foreground/60 text-center pt-4">
          Last updated: February 2026
        </p>
      </main>
    </div>
  );
}

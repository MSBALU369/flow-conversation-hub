import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { EFLogo } from "@/components/ui/EFLogo";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Phone, Shield, Gift } from "lucide-react";

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const TEST_EMAIL = "324324324@ef.com";
  const TEST_RAW = "324324324";
  const TEST_PASS = "123456";

  const handleTestAccount = async () => {
    // Try sign in first
    let { error } = await signIn(TEST_EMAIL, TEST_PASS);
    if (error) {
      // If user doesn't exist, sign up
      const res = await signUp(TEST_EMAIL, TEST_PASS);
      if (res.error) throw res.error;
      // Try signing in again after signup
      const res2 = await signIn(TEST_EMAIL, TEST_PASS);
      if (res2.error) throw res2.error;
    }
    // Grant premium + 10000 coins
    const { data: { user: u } } = await supabase.auth.getUser();
    if (u) {
      const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      await supabase.from("profiles").update({
        is_premium: true,
        premium_expires_at: expiresAt,
        coins: 10000,
        badges: ["premium"],
      }).eq("id", u.id);
    }
    navigate("/");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Test account bypass
      if (email === TEST_RAW && password === TEST_PASS) {
        await handleTestAccount();
        return;
      }

      if (isSignUp) {
        const { error } = await signUp(email, password);
        if (error) throw error;
        toast({
          title: "Check your email ✉️",
          description: "We've sent you a verification link.",
        });
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
        navigate("/");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="fixed inset-0 gradient-mesh pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm glass-card p-6 animate-scale-in">
        {/* Logo & Branding */}
        <div className="flex flex-col items-center mb-6">
          <EFLogo size="lg" className="mb-3" />
          <h1 className="text-xl font-bold text-foreground">
            {isSignUp ? "Join English Flow" : "Welcome Back"}
          </h1>
          <p className="text-xs text-muted-foreground mt-1 text-center">
            {isSignUp
              ? "Practice English with real people worldwide 🌍"
              : "Continue your speaking journey 🚀"}
          </p>
        </div>

        {/* Feature highlights on signup */}
        {isSignUp && (
          <div className="flex items-center justify-center gap-4 mb-5">
            <div className="flex items-center gap-1">
              <Phone className="w-3 h-3 text-primary" />
              <span className="text-[10px] text-muted-foreground">Voice Calls</span>
            </div>
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-primary" />
              <span className="text-[10px] text-muted-foreground">100% Private</span>
            </div>
            <div className="flex items-center gap-1">
              <Gift className="w-3 h-3 text-primary" />
              <span className="text-[10px] text-muted-foreground">Earn Coins</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
          />


          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold py-6"
          >
            {loading ? "Loading..." : isSignUp ? "Create Account" : "Sign In"}
          </Button>
        </form>

        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="w-full mt-4 text-primary text-sm font-medium hover:underline"
        >
          {isSignUp
            ? "Already have an account? Sign In"
            : "New here? Create Account"}
        </button>

        {/* Trust footer */}
        <p className="text-center text-[9px] text-muted-foreground mt-4">
          Your identity is always safe & private 🔒
        </p>
      </div>
    </div>
  );
}

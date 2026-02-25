import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { EFLogo } from "@/components/ui/EFLogo";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Phone, Shield, Gift, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [referenceId, setReferenceId] = useState("");
  const [referenceIdError, setReferenceIdError] = useState("");
  const [signUpBlink, setSignUpBlink] = useState(false);
  const [referenceIdValid, setReferenceIdValid] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [resetStep, setResetStep] = useState<0 | 1 | 2 | 3>(0);
  const [resetEmail, setResetEmail] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetCooldown, setResetCooldown] = useState(0);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const retry = async <T,>(fn: () => Promise<T>, attempts = 3, delay = 1500): Promise<T> => {
    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (err: any) {
        const isNetwork = err?.message?.toLowerCase().includes("failed to fetch") || err?.message?.toLowerCase().includes("network");
        if (isNetwork && i < attempts - 1) {
          await new Promise(r => setTimeout(r, delay * (i + 1)));
          continue;
        }
        throw err;
      }
    }
    throw new Error("Request failed after retries");
  };

  const TEST_EMAIL = "324324324@ef.com";
  const TEST_RAW = "324324324";
  const TEST_PASS = "123456";

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  useEffect(() => {
    if (resetCooldown <= 0) return;
    const t = setTimeout(() => setResetCooldown(resetCooldown - 1), 1000);
    return () => clearTimeout(t);
  }, [resetCooldown]);

  const validateReferenceId = async (value: string) => {
    if (!value.trim()) {
      setReferenceIdError("");
      setReferenceIdValid(false);
      return;
    }
    const { data, error } = await supabase.rpc("check_reference_id", { ref_id: value.trim() });
    if (data === true) {
      setReferenceIdValid(true);
      setReferenceIdError("");
    } else {
      setReferenceIdValid(false);
      setReferenceIdError("Wrong referenceID");
    }
  };

  const handleTestAccount = async () => {
    let { error } = await signIn(TEST_EMAIL, TEST_PASS);
    if (error) {
      const res = await signUp(TEST_EMAIL, TEST_PASS);
      if (res.error) throw res.error;
      const res2 = await signIn(TEST_EMAIL, TEST_PASS);
      if (res2.error) throw res2.error;
    }
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
      if (email === TEST_RAW && password === TEST_PASS) {
        await handleTestAccount();
        return;
      }

      if (isSignUp) {
        if (referenceId.trim() && !referenceIdValid) {
          toast({ title: "Invalid Reference ID", description: "Please enter a valid reference ID or leave it blank.", variant: "destructive" });
          return;
        }
        const { error } = await retry(() => signUp(email, password));
        if (error) throw error;
        setOtpStep(true);
        setResendCooldown(60);
        toast({ title: "OTP Sent ✉️", description: "Check your email for a 6-digit code." });
      } else {
        const { error } = await retry(() => signIn(email, password));
        if (error) throw error;
        setLoginError("");
        try { await (supabase.rpc as any)("sync_test_role"); } catch {}
        navigate("/");
      }
    } catch (error: any) {
      const msg = error.message || "";
      if (!isSignUp) {
        if (msg.toLowerCase().includes("invalid login credentials")) {
          setLoginError("Incorrect email or password");
        } else {
          setLoginError(msg);
        }
        setSignUpBlink(true);
        setTimeout(() => setSignUpBlink(false), 3000);
      } else {
        toast({ title: "Error", description: msg, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token: otpCode, type: "signup" });
      if (error) throw error;
      // Save referral if valid
      if (referenceId.trim() && referenceIdValid) {
        const { data: { user: u } } = await supabase.auth.getUser();
        if (u) {
          await supabase.from("profiles").update({ referred_by: referenceId.trim() }).eq("id", u.id);
        }
      }
      // Auto-assign role & premium for test emails
      try { await (supabase.rpc as any)("sync_test_role"); } catch {}
      toast({ title: "Verified! ✅" });
      navigate("/");
    } catch (error: any) {
      toast({ title: "Invalid OTP", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({ type: "signup", email });
      if (error) throw error;
      setResendCooldown(60);
      toast({ title: "OTP Resent ✉️", description: "Check your email again." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // OTP verification screen
  if (otpStep) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-background">
        <div className="fixed inset-0 gradient-mesh pointer-events-none" />
        <div className="relative z-10 w-full max-w-sm glass-card p-6 animate-scale-in">
          <button onClick={() => { setOtpStep(false); setOtpCode(""); }} className="flex items-center gap-1 text-muted-foreground text-sm mb-4 hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex flex-col items-center mb-6">
            <EFLogo size="lg" className="mb-3" />
            <h1 className="text-xl font-bold text-foreground">Verify Your Email</h1>
            <p className="text-xs text-muted-foreground mt-1 text-center">
              Enter the 6-digit code sent to <span className="font-semibold text-foreground">{email}</span>
            </p>
          </div>

          <div className="flex justify-center mb-6">
            <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button onClick={handleVerifyOtp} disabled={loading || otpCode.length !== 6} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold py-6">
            {loading ? "Verifying..." : "Verify"}
          </Button>

          <button onClick={handleResendOtp} disabled={resendCooldown > 0 || loading} className="w-full mt-4 text-primary text-sm font-medium hover:underline disabled:text-muted-foreground disabled:no-underline">
            {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : "Resend OTP"}
          </button>

          <p className="text-center text-[9px] text-muted-foreground mt-4">
            Your identity is always safe & private 🔒
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="fixed inset-0 gradient-mesh pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm glass-card p-6 animate-scale-in">
        <div className="flex flex-col items-center mb-6">
          <EFLogo size="lg" className="mb-3" />
          <h1 className="text-xl font-bold text-foreground">
            {isSignUp ? "Join English Flow" : "Welcome Back"}
          </h1>
          <p className="text-xs text-muted-foreground mt-1 text-center">
            {isSignUp ? "Practice English with real people worldwide 🌍" : "Continue your speaking journey 🚀"}
          </p>
        </div>

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
          <Input type="email" placeholder="Email" value={email} onChange={(e) => { setEmail(e.target.value); setLoginError(""); }} required className="bg-muted border-border text-foreground placeholder:text-muted-foreground" />
          <Input type="password" placeholder="Password" value={password} onChange={(e) => { setPassword(e.target.value); setLoginError(""); }} required minLength={6} className="bg-muted border-border text-foreground placeholder:text-muted-foreground" />
          {isSignUp && (
            <div>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Reference ID (optional)"
                  value={referenceId}
                  onChange={(e) => {
                    setReferenceId(e.target.value);
                    if (!e.target.value.trim()) {
                      setReferenceIdError("");
                      setReferenceIdValid(false);
                    }
                  }}
                  onBlur={() => validateReferenceId(referenceId)}
                  className={`bg-muted border-border text-foreground placeholder:text-muted-foreground pr-10 ${referenceIdError ? "border-destructive" : referenceIdValid ? "border-green-500" : ""}`}
                />
                {referenceIdValid && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                )}
              </div>
              {referenceIdError && (
                <p className="text-destructive text-xs mt-1">{referenceIdError}</p>
              )}
            </div>
          )}
          <Button type="submit" disabled={loading || (isSignUp && !!referenceId.trim() && !referenceIdValid)} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold py-6">
            {loading ? "Loading..." : isSignUp ? "Create Account" : "Sign In"}
          </Button>
          {loginError && !isSignUp && (
            <p className="text-destructive text-xs text-center mt-2">{loginError}</p>
          )}
        </form>
        {!isSignUp && (
          <button
            onClick={() => { setResetEmail(email); setResetStep(1); }}
            className="w-full mt-2 text-primary/70 text-xs hover:text-primary hover:underline transition-colors"
          >
            Forgot Password?
          </button>
        )}
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className={`w-full mt-3 text-primary text-base font-semibold py-3 rounded-full border border-primary/30 hover:bg-primary/10 transition-all ${signUpBlink ? "animate-shake-zoom bg-primary/15 ring-2 ring-primary/50" : ""}`}
        >
          {isSignUp ? "Already have an account? Sign In" : "New here? Create Account"}
        </button>

        <p className="text-center text-[9px] text-muted-foreground mt-4">
          Your identity is always safe & private 🔒
        </p>
      </div>

      {/* In-App OTP Password Reset Flow */}
      {resetStep > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={() => setResetStep(0)}>
          <div className="w-full max-w-sm glass-card p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
            <button onClick={() => { if (resetStep === 1) setResetStep(0); else setResetStep(prev => (prev - 1) as any); }} className="flex items-center gap-1 text-muted-foreground text-sm mb-4 hover:text-foreground">
              <ArrowLeft className="w-4 h-4" /> {resetStep === 1 ? "Back to Login" : "Back"}
            </button>
            <div className="flex flex-col items-center mb-5">
              <EFLogo size="lg" className="mb-3" />
              <h1 className="text-xl font-bold text-foreground">
                {resetStep === 1 && "Reset Password"}
                {resetStep === 2 && "Enter OTP"}
                {resetStep === 3 && "New Password"}
              </h1>
              <p className="text-xs text-muted-foreground mt-1 text-center">
                {resetStep === 1 && "We'll send a 6-digit code to your email."}
                {resetStep === 2 && <>Enter the code sent to <span className="font-semibold text-foreground">{resetEmail}</span></>}
                {resetStep === 3 && "Choose a strong new password."}
              </p>
            </div>

            {resetStep === 1 && (
              <>
                <Input type="email" placeholder="Email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} className="bg-muted border-border text-foreground placeholder:text-muted-foreground mb-3" />
                <Button
                  disabled={resetLoading || !resetEmail.trim()}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold py-6"
                  onClick={async () => {
                    setResetLoading(true);
                    try {
                      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), { redirectTo: window.location.origin });
                      if (error) throw error;
                      toast({ title: "OTP Sent ✉️", description: "Check your email for the 6-digit code." });
                      setResetCooldown(60);
                      setResetStep(2);
                    } catch (err: any) {
                      toast({ title: "Error", description: err.message, variant: "destructive" });
                    } finally { setResetLoading(false); }
                  }}
                >
                  {resetLoading ? "Sending..." : "Send OTP"}
                </Button>
              </>
            )}

            {resetStep === 2 && (
              <>
                <div className="flex justify-center mb-4">
                  <InputOTP maxLength={6} value={resetOtp} onChange={setResetOtp}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button
                  disabled={resetLoading || resetOtp.length !== 6}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold py-6"
                  onClick={async () => {
                    setResetLoading(true);
                    try {
                      const { error } = await supabase.auth.verifyOtp({ email: resetEmail, token: resetOtp, type: "recovery" });
                      if (error) throw error;
                      toast({ title: "OTP Verified ✅" });
                      setResetStep(3);
                    } catch (err: any) {
                      toast({ title: "Invalid OTP", description: err.message, variant: "destructive" });
                    } finally { setResetLoading(false); }
                  }}
                >
                  {resetLoading ? "Verifying..." : "Verify OTP"}
                </Button>
                <button
                  onClick={async () => {
                    if (resetCooldown > 0) return;
                    setResetLoading(true);
                    try {
                      await supabase.auth.resetPasswordForEmail(resetEmail.trim(), { redirectTo: window.location.origin });
                      setResetCooldown(60);
                      toast({ title: "OTP Resent ✉️" });
                    } catch {} finally { setResetLoading(false); }
                  }}
                  disabled={resetCooldown > 0 || resetLoading}
                  className="w-full mt-3 text-primary text-sm font-medium hover:underline disabled:text-muted-foreground disabled:no-underline"
                >
                  {resetCooldown > 0 ? `Resend OTP in ${resetCooldown}s` : "Resend OTP"}
                </button>
              </>
            )}

            {resetStep === 3 && (
              <>
                <Input type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={6} className="bg-muted border-border text-foreground placeholder:text-muted-foreground mb-3" />
                <Input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} minLength={6} className="bg-muted border-border text-foreground placeholder:text-muted-foreground mb-3" />
                <Button
                  disabled={resetLoading || newPassword.length < 6 || newPassword !== confirmPassword}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold py-6"
                  onClick={async () => {
                    if (newPassword !== confirmPassword) {
                      toast({ title: "Passwords don't match", variant: "destructive" });
                      return;
                    }
                    setResetLoading(true);
                    try {
                      const { error } = await supabase.auth.updateUser({ password: newPassword });
                      if (error) throw error;
                      toast({ title: "Password Reset Successful ✅", description: "You can now sign in with your new password." });
                      setResetStep(0);
                      setResetOtp(""); setNewPassword(""); setConfirmPassword("");
                      await supabase.auth.signOut();
                    } catch (err: any) {
                      toast({ title: "Error", description: err.message, variant: "destructive" });
                    } finally { setResetLoading(false); }
                  }}
                >
                  {resetLoading ? "Saving..." : "Save New Password"}
                </Button>
                {newPassword && confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-destructive text-xs text-center mt-2">Passwords do not match</p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

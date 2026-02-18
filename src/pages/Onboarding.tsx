import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EFLogo } from "@/components/ui/EFLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LocationSelector } from "@/components/LocationSelector";
import { SkipForward } from "lucide-react";

const genderOptions = [
  { value: "male" as const, label: "Male", icon: "👨" },
  { value: "female" as const, label: "Female", icon: "👩" },
];

function generateAnonymousUsername(): string {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `Anonymous${num}`;
}

export default function Onboarding() {
  const [username, setUsername] = useState("");
  const [gender, setGender] = useState<"male" | "female" | null>(null);
  const [description, setDescription] = useState("");
  const [referralId, setReferralId] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [skipping, setSkipping] = useState(false);
  const { updateProfile } = useProfile();
  const navigate = useNavigate();
  const { toast } = useToast();

  const processReferral = async (code: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: referrer } = await supabase
        .from("profiles")
        .select("id")
        .eq("unique_id", code)
        .maybeSingle();
      if (referrer && referrer.id !== user.id) {
        await supabase.from("referrals").insert({
          referrer_id: referrer.id,
          referred_user_id: user.id,
        });
        const { data: rProfile } = await supabase
          .from("profiles")
          .select("coins")
          .eq("id", referrer.id)
          .single();
        if (rProfile) {
          await supabase
            .from("profiles")
            .update({ coins: (rProfile.coins || 0) + 50 })
            .eq("id", referrer.id);
        }
        await supabase
          .from("profiles")
          .update({ referred_by: referrer.id })
          .eq("id", user.id);
      }
    } catch {
      // Referral processing failed silently
    }
  };

  const handleSkip = async () => {
    setSkipping(true);
    try {
      const updates: any = {
        username: generateAnonymousUsername(),
        gender: "male" as const,
        description: "Hello",
      };
      const { error } = await updateProfile(updates);
      if (error) throw error;
      navigate("/", { replace: true });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSkipping(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    try {
      const updates: any = {
        username: username.trim() || generateAnonymousUsername(),
        gender: gender || ("male" as const),
        description: description.trim() || "Hello",
      };
      if (selectedCountry && selectedCity) {
        updates.country = selectedCountry;
        updates.location_city = selectedCity;
        updates.last_location_change = new Date().toISOString();
      }
      const { error } = await updateProfile(updates);
      if (error) throw error;

      // Process referral code (from field or from signup localStorage)
      const codeToProcess = referralId.trim() || localStorage.getItem("ef_referral_code") || "";
      if (codeToProcess) {
        localStorage.removeItem("ef_referral_code");
        await processReferral(codeToProcess);
      }

      navigate("/", { replace: true });
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
      <div className="w-full max-w-md glass-card p-6 animate-scale-in">
        {/* Top row: Logo left, Skip right */}
        <div className="flex items-center justify-between mb-3">
          <EFLogo size="lg" className="scale-110 origin-left" />
          <button
            type="button"
            onClick={handleSkip}
            disabled={skipping}
            className="flex items-center gap-1 px-3 py-1 rounded-full bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)] text-white text-[10px] font-bold transition-colors disabled:opacity-50 mr-[-4px]"
          >
            <SkipForward className="w-3.5 h-3.5" />
            {skipping ? "Skipping..." : "Skip"}
          </button>
        </div>

        <div className="flex flex-col items-center mb-2">
          <h1 className="text-base font-bold text-foreground">Complete Your Profile</h1>
          <p className="text-[10px] text-muted-foreground mt-0.5">All fields are optional</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-2">
          {/* Username */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              Username <span className="text-muted-foreground">(optional)</span>
            </label>
            <Input
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={30}
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-8 text-xs"
            />
          </div>

          {/* Gender */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              Gender <span className="text-muted-foreground">(optional)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {genderOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setGender(opt.value)}
                  className={`flex items-center justify-center gap-1 py-1.5 rounded-full border transition-all text-[11px] font-medium ${
                    gender === opt.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-muted text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  <span className="text-sm">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              Location <span className="text-muted-foreground">(optional)</span>
            </label>
            <LocationSelector
              country={null}
              city={null}
              lastLocationChange={null}
              onSelect={(country, city) => {
                setSelectedCountry(country);
                setSelectedCity(city);
              }}
            />
          </div>

          {/* Reference ID */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              Reference ID <span className="text-muted-foreground">(optional)</span>
            </label>
            <Input
              placeholder="Enter referrer's UID"
              value={referralId}
              onChange={(e) => setReferralId(e.target.value)}
              maxLength={20}
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground h-8 text-xs"
            />
          </div>

          {/* Description / Bio */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              Bio <span className="text-muted-foreground">(optional)</span>
            </label>
            <Textarea
              placeholder="Write a short bio..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
              rows={2}
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground resize-none text-xs"
            />
            <p className="text-[9px] text-muted-foreground text-right">{description.length}/200</p>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold py-4 text-sm"
          >
            {loading ? "Saving..." : "Get Started"}
          </Button>
        </form>
      </div>
    </div>
  );
}

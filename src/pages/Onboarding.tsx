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

const genderOptions = [
  { value: "male" as const, label: "Male", icon: "👨" },
  { value: "female" as const, label: "Female", icon: "👩" },
];

export default function Onboarding() {
  const [username, setUsername] = useState("");
  const [gender, setGender] = useState<"male" | "female" | null>(null);
  const [description, setDescription] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [loading, setLoading] = useState(false);
  const { updateProfile } = useProfile();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      toast({ title: "Username is required", variant: "destructive" });
      return;
    }
    if (!gender) {
      toast({ title: "Please select your gender", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const updates: any = {
        username: username.trim(),
        gender,
        description: description.trim() || null,
      };
      if (selectedCountry && selectedCity) {
        updates.country = selectedCountry;
        updates.location_city = selectedCity;
        updates.last_location_change = new Date().toISOString();
      }
      const { error } = await updateProfile(updates);
      if (error) throw error;

      // Process referral code from signup
      const storedReferral = localStorage.getItem("ef_referral_code");
      if (storedReferral) {
        localStorage.removeItem("ef_referral_code");
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            // Find referrer by unique_id
            const { data: referrer } = await supabase
              .from("profiles")
              .select("id")
              .eq("unique_id", storedReferral)
              .maybeSingle();

            if (referrer && referrer.id !== user.id) {
              // Create referral record
              await supabase.from("referrals").insert({
                referrer_id: referrer.id,
                referred_user_id: user.id,
              });
              // Award 50 coins to referrer
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
              // Save referred_by on new user
              await supabase
                .from("profiles")
                .update({ referred_by: referrer.id })
                .eq("id", user.id);
            }
          }
        } catch {
          // Referral processing failed silently - don't block onboarding
        }
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
      <div className="w-full max-w-sm glass-card p-8 animate-scale-in">
        <div className="flex flex-col items-center mb-6">
          <EFLogo size="lg" className="mb-4" />
          <h1 className="text-2xl font-bold text-foreground">Complete Your Profile</h1>
          <p className="text-sm text-muted-foreground mt-1">Tell us about yourself to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Username *</label>
            <Input
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={30}
              required
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Gender *</label>
            <div className="grid grid-cols-2 gap-3">
              {genderOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setGender(opt.value)}
                  className={`flex items-center justify-center gap-2 py-3 rounded-full border transition-all text-sm font-medium ${
                    gender === opt.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-muted text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  <span className="text-lg">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
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

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              About You <span className="text-muted-foreground">(optional)</span>
            </label>
            <Textarea
              placeholder="Write a short bio..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
              rows={3}
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">{description.length}/200</p>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold py-6"
          >
            {loading ? "Saving..." : "Get Started"}
          </Button>
        </form>
      </div>
    </div>
  );
}

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface Profile {
  id: string;
  email: string | null;
  username: string | null;
  unique_id: string | null;
  avatar_url: string | null;
  created_at: string;
  is_online: boolean | null;
  energy_bars: number | null;
  last_refill_time: string | null;
  last_username_change: string | null;
  level: number | null;
  xp: number | null;
  streak_count: number | null;
  badges: string[] | null;
  reports_count: number | null;
  wrong_gender_reports: number | null;
  is_banned: boolean | null;
  gender_locked: boolean | null;
  gender: "male" | "female" | "unknown" | null;
  followers_count: number | null;
  following_count: number | null;
  is_premium: boolean | null;
  premium_expires_at: string | null;
  country: string | null;
  region: string | null;
  description: string | null;
  last_location_change: string | null;
  location_city: string | null;
  coins: number | null;
  referred_by: string | null;
}

interface ProfileContextType {
  profile: Profile | null;
  loading: boolean;
  updateProfile: (updates: Partial<Omit<Profile, 'gender'>> & { gender?: "male" | "female" | "unknown"; location_city?: string; last_location_change?: string }) => Promise<{ data?: any; error?: any }>;
}

const ProfileContext = createContext<ProfileContextType | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    let isMounted = true;
    setProfileLoading(true);

    const fetchProfile = async () => {
      // Check and expire premium status server-side before fetching
      await supabase.rpc("check_premium_expiration" as any, { p_user_id: user.id });

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (!isMounted) return;

      if (error) {
        console.error("Error fetching profile:", error);
      } else {
        setProfile(data);
      }
      setProfileLoading(false);
    };

    fetchProfile();

    // Set user online
    supabase.from("profiles").update({ is_online: true }).eq("id", user.id).then();

    // Subscribe to realtime changes on this user's profile
    const channel = supabase
      .channel(`profile-${user.id}`)
      .on(
        "postgres_changes" as any,
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        (payload: any) => {
          if (isMounted && payload.new) {
            setProfile(payload.new);
          }
        }
      )
      .subscribe();

    // Set user offline on tab close / unmount
    const handleOffline = () => {
      supabase.from("profiles").update({ is_online: false }).eq("id", user.id).then();
    };
    window.addEventListener("beforeunload", handleOffline);

    return () => {
      isMounted = false;
      handleOffline();
      window.removeEventListener("beforeunload", handleOffline);
      supabase.removeChannel(channel);
    };
  }, [user, authLoading]);

  const loading = authLoading || profileLoading;

  const updateProfile = async (updates: Partial<Omit<Profile, 'gender'>> & { gender?: "male" | "female" | "unknown"; location_city?: string; last_location_change?: string }) => {
    if (!user) return { error: new Error("Not authenticated") };

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select()
      .single();

    if (!error && data) {
      setProfile(data);
    }

    return { data, error };
  };

  return (
    <ProfileContext.Provider value={{ profile, loading, updateProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
}

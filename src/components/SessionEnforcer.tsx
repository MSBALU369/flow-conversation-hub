import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const SESSION_KEY = "ef_session_id";

function generateSessionId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function SessionEnforcer() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const initializedRef = useRef(false);

  // On login, stamp a new session ID
  useEffect(() => {
    if (!user || initializedRef.current) return;
    initializedRef.current = true;

    const sessionId = generateSessionId();
    localStorage.setItem(SESSION_KEY, sessionId);

    // Write to profiles
    supabase
      .from("profiles")
      .update({ current_session_id: sessionId } as any)
      .eq("id", user.id)
      .then();
  }, [user]);

  // Listen for profile updates — if current_session_id changes, force logout
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`session-enforce-${user.id}`)
      .on(
        "postgres_changes" as any,
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${user.id}`,
        },
        (payload: any) => {
          const newSessionId = payload.new?.current_session_id;
          const localSessionId = localStorage.getItem(SESSION_KEY);
          if (newSessionId && localSessionId && newSessionId !== localSessionId) {
            // Another device logged in
            localStorage.removeItem(SESSION_KEY);
            toast({
              title: "Logged out",
              description: "You logged in on another device.",
              variant: "destructive",
            });
            signOut().then(() => navigate("/login", { replace: true }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, signOut, toast, navigate]);

  return null;
}

import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const SESSION_KEY = "ef_session_id";
const POLL_INTERVAL = 15_000; // 15s fallback poll

function generateSessionId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function SessionEnforcer() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const initializedRef = useRef(false);
  const loggingOutRef = useRef(false);

  const forceLogout = useCallback(async () => {
    if (loggingOutRef.current) return;
    loggingOutRef.current = true;
    localStorage.removeItem(SESSION_KEY);
    toast({
      title: "Logged out",
      description: "You logged in on another device.",
      variant: "destructive",
    });
    await signOut();
    navigate("/login", { replace: true });
  }, [signOut, toast, navigate]);

  // On login, stamp a new session ID
  useEffect(() => {
    if (!user || initializedRef.current) return;
    initializedRef.current = true;

    const sessionId = generateSessionId();
    localStorage.setItem(SESSION_KEY, sessionId);

    supabase
      .from("profiles")
      .update({ current_session_id: sessionId } as any)
      .eq("id", user.id)
      .then();
  }, [user]);

  // Realtime listener — if current_session_id changes, force logout
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
            forceLogout();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, forceLogout]);

  // Polling fallback — catches cases where realtime misses
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      const localSessionId = localStorage.getItem(SESSION_KEY);
      if (!localSessionId) return;

      const { data } = await supabase
        .from("profiles")
        .select("current_session_id")
        .eq("id", user.id)
        .single();

      if (data?.current_session_id && data.current_session_id !== localSessionId) {
        forceLogout();
      }
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [user, forceLogout]);

  return null;
}

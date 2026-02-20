import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchRole = async () => {
      const { data, error } = await (supabase.rpc as any)("get_my_role");
      if (!isMounted) return;
      if (!error && data) {
        setRole(data as string);
      }
      setLoading(false);
    };

    fetchRole();
    return () => { isMounted = false; };
  }, [user]);

  return { role, loading };
}

import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNotificationSound } from "@/hooks/useNotificationSound";
import { toast } from "sonner";

/**
 * Global listener for incoming chat messages AND admin broadcast alerts.
 */
export function useGlobalMessageListener() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const playSound = useNotificationSound();
  const openConversationRef = useRef<string | null>(null);

  useEffect(() => {
    const el = document.getElementById("active-chat-partner");
    openConversationRef.current = el?.getAttribute("data-partner-id") || null;
  });

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`global-msg-listener-${user.id}`)
      .on(
        "postgres_changes" as any,
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `receiver_id=eq.${user.id}`,
        },
        async (payload: any) => {
          const msg = payload.new;
          if (!msg || msg.sender_id === user.id) return;

          const el = document.getElementById("active-chat-partner");
          const currentPartnerId = el?.getAttribute("data-partner-id") || null;
          if (currentPartnerId === msg.sender_id) return;

          const { data: sender } = await supabase
            .from("profiles")
            .select("username, avatar_url")
            .eq("id", msg.sender_id)
            .single();

          const senderName = sender?.username || "Someone";
          const preview = msg.content
            ? msg.content.length > 60
              ? msg.content.slice(0, 60) + "…"
              : msg.content
            : "📷 Media";

          try { playSound("ting"); } catch {}

          toast(senderName, {
            description: preview,
            duration: 5000,
            action: {
              label: "Open",
              onClick: () => {
                navigate("/chat", {
                  state: {
                    openConversationWith: {
                      id: msg.sender_id,
                      name: senderName,
                      avatar: sender?.avatar_url || null,
                    },
                  },
                });
              },
            },
          });
        }
      )
      // Listen for admin broadcast notifications
      .on(
        "postgres_changes" as any,
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          const notif = payload.new;
          if (!notif || notif.type !== "system") return;

          // Show broadcast popup for 3 seconds
          toast("📢 " + (notif.title || "Alert"), {
            description: notif.message || "",
            duration: 3000,
          });

          try { playSound("ting"); } catch {}
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, navigate, playSound]);
}

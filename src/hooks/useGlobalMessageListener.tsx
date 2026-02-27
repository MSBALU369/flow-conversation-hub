import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNotificationSound } from "@/hooks/useNotificationSound";
import { toast } from "sonner";

/**
 * Global listener for incoming chat messages.
 * Shows an in-app banner (Sonner toast) when a message arrives
 * and the user is NOT currently viewing that specific conversation.
 */
export function useGlobalMessageListener() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const playSound = useNotificationSound();
  const openConversationRef = useRef<string | null>(null);
  const notifiedMessageIds = useRef<Set<string>>(new Set());

  // Determine if user is on chat page — the chat page stores selectedFriend
  // in component state, so we use a DOM-based signal: a hidden data attribute
  // set by Chat.tsx.  Simpler approach: if NOT on /chat, always show banner.
  // If ON /chat, we read the data attribute from document.
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

          // Check if user is currently viewing this conversation
          const el = document.getElementById("active-chat-partner");
          const currentPartnerId = el?.getAttribute("data-partner-id") || null;
          if (currentPartnerId === msg.sender_id) return; // Already in that chat

          // Fetch sender name + avatar
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

          // Play notification sound
          try { playSound("ting"); } catch {}

          // Show Sonner toast banner
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, navigate, playSound]);

  // ─── HTTP Polling Fallback for Messages ───
  useEffect(() => {
    if (!user?.id) return;

    const interval = setInterval(async () => {
      try {
        const { data: unreadMsgs } = await supabase
          .from("chat_messages")
          .select("id, sender_id, content, media_url, created_at")
          .eq("receiver_id", user.id)
          .eq("is_read", false)
          .order("created_at", { ascending: false })
          .limit(1);

        if (!unreadMsgs || unreadMsgs.length === 0) return;
        const msg = unreadMsgs[0];

        // Skip if already notified or it's from the current user
        if (notifiedMessageIds.current.has(msg.id)) return;
        if (msg.sender_id === user.id) return;

        // Check if user is viewing this conversation
        const el = document.getElementById("active-chat-partner");
        const currentPartnerId = el?.getAttribute("data-partner-id") || null;
        if (currentPartnerId === msg.sender_id) return;

        // Fetch sender profile
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

        // Mark as notified
        notifiedMessageIds.current.add(msg.id);
        // Keep set from growing unbounded
        if (notifiedMessageIds.current.size > 200) {
          const arr = Array.from(notifiedMessageIds.current);
          notifiedMessageIds.current = new Set(arr.slice(-100));
        }

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
      } catch {}
    }, 1500);

    return () => clearInterval(interval);
  }, [user?.id, navigate, playSound]);
}

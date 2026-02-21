import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Users, Copy, Check, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  sender_username?: string;
  sender_avatar?: string | null;
}

interface RoomInfo {
  id: string;
  room_code: string;
  title: string;
  is_private: boolean;
  host_id: string;
  max_members: number;
}

export default function RoomDiscussion() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useProfile();
  const { user } = useAuth();
  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [memberCount, setMemberCount] = useState(0);
  const [copiedCode, setCopiedCode] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch room info
  useEffect(() => {
    if (!roomCode) return;

    const fetchRoom = async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("room_code", roomCode)
        .single();

      if (error || !data) {
        toast({ title: "Error", description: "Room not found" });
        navigate("/rooms");
        return;
      }
      setRoom(data);
      setLoading(false);
    };

    fetchRoom();
  }, [roomCode]);

  // Fetch member count
  useEffect(() => {
    if (!room) return;

    const fetchMembers = async () => {
      const { count } = await supabase
        .from("room_members")
        .select("*", { count: "exact", head: true })
        .eq("room_id", room.id);
      setMemberCount(count ?? 0);
    };

    fetchMembers();
  }, [room]);

  // Clean up room membership on tab close / unmount (prevent ghost members)
  useEffect(() => {
    if (!room || !user) return;

    const cleanupMembership = () => {
      // Use sendBeacon for reliable tab-close cleanup
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/room_members?room_id=eq.${room.id}&user_id=eq.${user.id}`;
      const headers = {
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${(supabase as any).auth.session?.()?.access_token || ""}`,
      };
      // Fallback: fire-and-forget delete
      fetch(url, { method: "DELETE", headers, keepalive: true }).catch(() => {});
    };

    const handleBeforeUnload = () => {
      cleanupMembership();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // Component unmount cleanup (navigation away)
      if (room && user) {
        supabase
          .from("room_members")
          .delete()
          .eq("room_id", room.id)
          .eq("user_id", user.id)
          .then();
      }
    };
  }, [room, user]);

  // Fetch messages and subscribe to realtime
  useEffect(() => {
    if (!room) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from("room_messages")
        .select("id, content, created_at, sender_id")
        .eq("room_id", room.id)
        .order("created_at", { ascending: true })
        .limit(200);

      if (data && data.length > 0) {
        // Fetch sender profiles
        const senderIds = [...new Set(data.map((m) => m.sender_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .in("id", senderIds);

        const profileMap = new Map(profiles?.map((p) => [p.id, p]) ?? []);

        setMessages(
          data.map((m) => ({
            ...m,
            sender_username: profileMap.get(m.sender_id)?.username ?? "Unknown",
            sender_avatar: profileMap.get(m.sender_id)?.avatar_url,
          }))
        );
      }
    };

    fetchMessages();

    const channel = supabase
      .channel(`room-${room.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "room_messages",
          filter: `room_id=eq.${room.id}`,
        },
        async (payload) => {
          const msg = payload.new as any;
          const { data: senderProfile } = await supabase
            .from("profiles")
            .select("username, avatar_url")
            .eq("id", msg.sender_id)
            .single();

          setMessages((prev) => [
            ...prev,
            {
              ...msg,
              sender_username: senderProfile?.username ?? "Unknown",
              sender_avatar: senderProfile?.avatar_url,
            },
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room]);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !room || !user) return;

    const { error } = await supabase.from("room_messages").insert({
      room_id: room.id,
      sender_id: user.id,
      content: newMessage.trim(),
    });

    if (error) {
      toast({ title: "Error", description: "Failed to send message" });
      return;
    }

    setNewMessage("");
  };

  const handleCopyCode = () => {
    if (!room) return;
    navigator.clipboard.writeText(room.room_code);
    setCopiedCode(true);
    toast({ title: "Copied!", description: "Room code copied to clipboard" });
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleLeaveRoom = async () => {
    if (!room || !user) return;

    await supabase
      .from("room_members")
      .delete()
      .eq("room_id", room.id)
      .eq("user_id", user.id);

    toast({ title: "Left room", description: `You left "${room.title}"` });
    navigate("/rooms");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!room) return null;

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/rooms")} className="p-1.5 rounded-full hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-sm font-bold text-foreground truncate max-w-[180px]">{room.title}</h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="w-3 h-3" />
              <span>{memberCount} members</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleCopyCode} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-muted text-xs text-muted-foreground hover:text-foreground transition-colors">
            {copiedCode ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
            <span className="font-mono">{room.room_code}</span>
          </button>
          <button onClick={handleLeaveRoom} className="p-1.5 rounded-full hover:bg-destructive/10 text-destructive transition-colors" title="Leave room">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-3">
        <div className="space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-sm">No messages yet. Start the discussion!</p>
            </div>
          )}
          {messages.map((msg) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"}`}>
                  {!isMe && (
                    <p className="text-[10px] text-muted-foreground mb-0.5 ml-1">{msg.sender_username}</p>
                  )}
                  <div className={`px-3 py-2 rounded-2xl text-sm ${isMe ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted text-foreground rounded-bl-md"}`}>
                    {msg.content}
                  </div>
                  <p className={`text-[10px] text-muted-foreground mt-0.5 ${isMe ? "text-right mr-1" : "ml-1"}`}>
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="bg-card border-t border-border px-4 py-3 flex items-center gap-2 shrink-0">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder="Type a message..."
          className="flex-1 bg-muted border-0"
        />
        <Button onClick={handleSend} size="icon" className="shrink-0 bg-primary text-primary-foreground" disabled={!newMessage.trim()}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

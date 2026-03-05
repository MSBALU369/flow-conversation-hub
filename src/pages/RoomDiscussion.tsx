import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Users, Copy, Check, LogOut, ShieldBan, VolumeX, Mic, MicOff, Crown, Image, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { useEnergySystem } from "@/hooks/useEnergySystem";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RoomTableView } from "@/components/rooms/RoomTableView";
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useRoomContext,
  useParticipants,
  useLocalParticipant,
  AudioConference,
  StartAudio,
} from "@livekit/components-react";
import { RoomEvent } from "livekit-client";

const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL;

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  sender_username?: string;
  sender_avatar?: string | null;
  media_url?: string | null;
}

interface RoomInfo {
  id: string;
  room_code: string;
  title: string;
  is_private: boolean;
  host_id: string;
  max_members: number;
}

/** LiveKit voice controls inside the room */
function RoomVoiceControls({ activeSpeakers, setActiveSpeakers }: { activeSpeakers: string[]; setActiveSpeakers: (s: string[]) => void }) {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();
  const participants = useParticipants();
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    if (!room) return;
    const handleSpeakers = (speakers: any[]) => {
      setActiveSpeakers(speakers.map(s => s.identity));
    };
    room.on(RoomEvent.ActiveSpeakersChanged, handleSpeakers);
    return () => { room.off(RoomEvent.ActiveSpeakersChanged, handleSpeakers); };
  }, [room]);

  useEffect(() => {
    if (localParticipant && room?.state === 'connected') {
      localParticipant.setMicrophoneEnabled(!isMuted);
    }
  }, [isMuted, localParticipant, room?.state]);

  const remoteParticipants = participants.filter(p => !p.isLocal);

  return (
    <div className="bg-card/80 backdrop-blur-sm border-b border-border px-4 py-2 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-xs text-muted-foreground">
          {remoteParticipants.length + 1} in voice · {activeSpeakers.length} speaking
        </span>
      </div>
      <div className="flex items-center gap-2">
        <StartAudio label="Enable Audio" className="text-[10px] text-primary underline" />
        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
            isMuted ? "bg-destructive/20 text-destructive" : "bg-primary/20 text-primary"
          }`}
        >
          {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

export default function RoomDiscussion() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useProfile();
  const { user } = useAuth();
  const { isEmptyEnergy, isPremium: isPremiumEnergy } = useEnergySystem({ isDraining: true });

  useEffect(() => {
    if (isEmptyEnergy && !isPremiumEnergy) {
      toast({ title: "⚡ Low Energy", description: "Your battery is empty. Leaving room." });
      navigate("/rooms");
    }
  }, [isEmptyEnergy, isPremiumEnergy]);

  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [memberCount, setMemberCount] = useState(0);
  const [copiedCode, setCopiedCode] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [members, setMembers] = useState<{ user_id: string; username: string; avatar_url: string | null }[]>([]);
  const [mutedMembers, setMutedMembers] = useState<Set<string>>(new Set());
  const [showMembers, setShowMembers] = useState(false);
  const [livekitToken, setLivekitToken] = useState<string | null>(null);
  const [activeSpeakers, setActiveSpeakers] = useState<string[]>([]);
  const [showTable, setShowTable] = useState(true);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const isHost = room?.host_id === user?.id;

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

  // Generate LiveKit token
  useEffect(() => {
    if (!room || !user || !profile) return;
    const generateToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("generate-livekit-token", {
          body: {
            room_id: `room-${room.room_code}`,
            participant_name: profile.username || "User",
            participant_id: user.id,
          },
        });
        if (error) throw error;
        if (data?.token) setLivekitToken(data.token);
      } catch (err) {
        console.error("Failed to get LiveKit token for room:", err);
      }
    };
    generateToken();
  }, [room, user, profile]);

  // Fetch members
  useEffect(() => {
    if (!room) return;
    const fetchMembers = async () => {
      const { data, count } = await supabase
        .from("room_members")
        .select("user_id", { count: "exact" })
        .eq("room_id", room.id);
      setMemberCount(count ?? 0);
      if (data && data.length > 0) {
        const userIds = data.map(m => m.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .in("id", userIds);
        setMembers((profiles || []).map(p => ({ user_id: p.id, username: p.username || "Unknown", avatar_url: p.avatar_url })));
      }
    };
    fetchMembers();

    // Subscribe to member changes
    const channel = supabase
      .channel(`room-members-${room.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "room_members", filter: `room_id=eq.${room.id}` },
        () => { fetchMembers(); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [room]);

  const handleKickMember = async (targetUserId: string) => {
    if (!room || !isHost) return;
    await supabase.from("room_members").delete().eq("room_id", room.id).eq("user_id", targetUserId);
    toast({ title: "User kicked from room" });
  };

  const handleToggleMute = (targetUserId: string) => {
    setMutedMembers(prev => {
      const next = new Set(prev);
      if (next.has(targetUserId)) { next.delete(targetUserId); toast({ title: "User unmuted" }); }
      else { next.add(targetUserId); toast({ title: "User muted" }); }
      return next;
    });
  };

  // Cleanup on unmount/tab close
  useEffect(() => {
    if (!room || !user) return;
    const handleBeforeUnload = () => {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/room_members?room_id=eq.${room.id}&user_id=eq.${user.id}`;
      fetch(url, {
        method: "DELETE",
        headers: {
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${(supabase as any).auth.session?.()?.access_token || ""}`,
        },
        keepalive: true,
      }).catch(() => {});
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (room && user) {
        supabase.from("room_members").delete().eq("room_id", room.id).eq("user_id", user.id).then();
      }
    };
  }, [room, user]);

  // Fetch messages and subscribe
  useEffect(() => {
    if (!room) return;
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("room_messages")
        .select("id, content, created_at, sender_id, media_url")
        .eq("room_id", room.id)
        .order("created_at", { ascending: true })
        .limit(200);
      if (data && data.length > 0) {
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
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "room_messages", filter: `room_id=eq.${room.id}` },
        async (payload) => {
          const msg = payload.new as any;
          const { data: senderProfile } = await supabase
            .from("profiles")
            .select("username, avatar_url")
            .eq("id", msg.sender_id)
            .single();
          setMessages((prev) => [...prev, { ...msg, sender_username: senderProfile?.username ?? "Unknown", sender_avatar: senderProfile?.avatar_url }]);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [room]);

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // File handling
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB allowed" });
      return;
    }
    setMediaFile(file);
    const reader = new FileReader();
    reader.onload = () => setMediaPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const clearMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSend = async () => {
    if ((!newMessage.trim() && !mediaFile) || !room || !user) return;

    let mediaUrl: string | undefined;
    if (mediaFile) {
      setUploading(true);
      const ext = mediaFile.name.split(".").pop();
      const path = `room-${room.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("chat_media").upload(path, mediaFile);
      if (error) {
        toast({ title: "Upload failed", description: error.message });
        setUploading(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("chat_media").getPublicUrl(path);
      mediaUrl = urlData.publicUrl;
      setUploading(false);
    }

    const content = newMessage.trim() || (mediaUrl ? "📷 Media" : "");
    const insertData: any = { room_id: room.id, sender_id: user.id, content };
    if (mediaUrl) insertData.media_url = mediaUrl;

    const { error } = await supabase.from("room_messages").insert(insertData);
    if (error) { toast({ title: "Error", description: "Failed to send message" }); return; }
    setNewMessage("");
    clearMedia();
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
    await supabase.from("room_members").delete().eq("room_id", room.id).eq("user_id", user.id);
    const { count } = await supabase.from("room_members").select("*", { count: "exact", head: true }).eq("room_id", room.id);
    if (count === 0) {
      // Delete all messages and media when room is empty
      await cleanupRoomData(room.id);
      await supabase.from("rooms").delete().eq("id", room.id);
    }
    toast({ title: "Left room", description: `You left "${room.title}"` });
    navigate("/rooms");
  };

  const handleCloseRoom = async () => {
    if (!room || !user) return;
    await supabase.from("room_members").delete().eq("room_id", room.id);
    await cleanupRoomData(room.id);
    await supabase.from("rooms").delete().eq("id", room.id);
    toast({ title: "Room closed", description: `"${room.title}" has been permanently closed.` });
    navigate("/rooms");
  };

  // Delete all messages and media for a room
  const cleanupRoomData = async (roomId: string) => {
    // Delete media files from storage
    const { data: mediaFiles } = await supabase.storage.from("chat_media").list(`room-${roomId}`);
    if (mediaFiles && mediaFiles.length > 0) {
      const paths = mediaFiles.map(f => `room-${roomId}/${f.name}`);
      await supabase.storage.from("chat_media").remove(paths);
    }
    // Delete all messages
    await supabase.from("room_messages").delete().eq("room_id", roomId);
  };

  // URL detection
  const renderContent = (content: string, media_url?: string | null) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = content.split(urlRegex);

    return (
      <>
        {parts.map((part, i) =>
          urlRegex.test(part) ? (
            <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-primary underline break-all">
              {part}
            </a>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
        {media_url && (
          <img
            src={media_url}
            alt="shared media"
            className="mt-1.5 rounded-lg max-w-full max-h-48 object-cover cursor-pointer"
            onClick={() => window.open(media_url, "_blank")}
          />
        )}
      </>
    );
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

  const roomContent = (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-card/90 backdrop-blur-md border-b border-border px-4 py-2.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <button onClick={() => navigate("/rooms")} className="p-1.5 rounded-full hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-sm font-bold text-foreground truncate max-w-[140px]">{room.title}</h1>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span>{memberCount}/20 members</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={handleCopyCode} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-muted text-[10px] text-muted-foreground hover:text-foreground transition-colors">
            {copiedCode ? <Check className="w-3 h-3 text-primary" /> : <Copy className="w-3 h-3" />}
            <span className="font-mono">{room.room_code}</span>
          </button>
          <button onClick={() => setShowTable(!showTable)} className={`p-1.5 rounded-full transition-colors ${showTable ? "bg-primary/20 text-primary" : "hover:bg-muted text-muted-foreground"}`} title="Toggle table view">
            <Users className="w-4 h-4" />
          </button>
          {isHost && (
            <button onClick={() => setShowMembers(!showMembers)} className="p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors" title="Manage members">
              <Crown className="w-4 h-4 text-amber-400" />
            </button>
          )}
          <button onClick={handleLeaveRoom} className="p-1.5 rounded-full hover:bg-destructive/10 text-destructive transition-colors" title="Leave room">
            <LogOut className="w-4 h-4" />
          </button>
          <button onClick={handleCloseRoom} className="p-1.5 rounded-full hover:bg-destructive/10 text-destructive transition-colors" title="Close room for everyone">
            <span className="text-xs font-bold">✕</span>
          </button>
        </div>
      </div>

      {/* Voice Controls */}
      {livekitToken && <RoomVoiceControls activeSpeakers={activeSpeakers} setActiveSpeakers={setActiveSpeakers} />}

      {/* Table View */}
      {showTable && members.length > 0 && (
        <div className="shrink-0 border-b border-border bg-card/40">
          <RoomTableView
            members={members}
            hostId={room.host_id}
            currentUserId={user?.id}
            activeSpeakers={activeSpeakers}
            mutedMembers={mutedMembers}
            isHost={isHost}
            onKick={handleKickMember}
            onToggleMute={handleToggleMute}
          />
        </div>
      )}

      {/* Host Members Panel */}
      {showMembers && isHost && (
        <div className="bg-card border-b border-border px-4 py-2 space-y-1.5 shrink-0">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Manage Members ({memberCount})</p>
          {members.filter(m => m.user_id !== user?.id).map(m => (
            <div key={m.user_id} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 rounded-full bg-muted overflow-hidden shrink-0">
                  {m.avatar_url ? <img src={m.avatar_url} alt="" className="w-full h-full object-cover rounded-full" /> : <span className="text-xs flex items-center justify-center h-full">👤</span>}
                </div>
                <span className="text-xs text-foreground truncate">{m.username}</span>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => handleToggleMute(m.user_id)} className={`p-1 rounded hover:bg-muted transition-colors ${mutedMembers.has(m.user_id) ? "text-destructive" : "text-muted-foreground"}`} title={mutedMembers.has(m.user_id) ? "Unmute" : "Mute"}>
                  <VolumeX className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleKickMember(m.user_id)} className="p-1 rounded hover:bg-destructive/10 text-destructive transition-colors" title="Kick">
                  <ShieldBan className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          {members.filter(m => m.user_id !== user?.id).length === 0 && (
            <p className="text-[10px] text-muted-foreground text-center py-1">No other members</p>
          )}
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 px-3 py-2">
        <div className="space-y-2">
          {/* Temporary notice */}
          <div className="text-center py-2">
            <span className="text-[10px] bg-muted/60 text-muted-foreground px-3 py-1 rounded-full">
              💬 Messages are temporary — they vanish when the room closes
            </span>
          </div>

          {messages.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No messages yet. Start the discussion!</p>
            </div>
          )}
          {messages.map((msg) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"} gap-1.5`}>
                {!isMe && (
                  <div className="w-7 h-7 rounded-full bg-muted overflow-hidden shrink-0 mt-4">
                    {msg.sender_avatar ? (
                      <img src={msg.sender_avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] flex items-center justify-center h-full text-muted-foreground">
                        {(msg.sender_username || "?")[0]?.toUpperCase()}
                      </span>
                    )}
                  </div>
                )}
                <div className={`max-w-[72%] ${isMe ? "items-end" : "items-start"}`}>
                  {!isMe && (
                    <p className="text-[10px] text-muted-foreground mb-0.5 ml-1">{msg.sender_username}</p>
                  )}
                  <div className={`px-3 py-2 rounded-2xl text-sm ${isMe ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm"}`}>
                    {renderContent(msg.content, msg.media_url)}
                  </div>
                  <p className={`text-[9px] text-muted-foreground mt-0.5 ${isMe ? "text-right mr-1" : "ml-1"}`}>
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input with media support */}
      <div className="bg-card/90 backdrop-blur-md border-t border-border shrink-0">
        {mediaPreview && (
          <div className="px-4 pt-2 flex items-center gap-2">
            <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-border">
              <img src={mediaPreview} alt="preview" className="w-full h-full object-cover" />
              <button onClick={clearMedia} className="absolute top-0 right-0 w-4 h-4 rounded-full bg-destructive flex items-center justify-center">
                <X className="w-3 h-3 text-destructive-foreground" />
              </button>
            </div>
            <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">{mediaFile?.name}</span>
          </div>
        )}
        <div className="px-3 py-2 flex items-center gap-2">
          <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />
          <button onClick={() => fileRef.current?.click()} className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground">
            <Image className="w-5 h-5" />
          </button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Type a message..."
            className="flex-1 bg-muted border-0 h-9 text-sm"
          />
          <Button
            onClick={handleSend}
            size="icon"
            className="shrink-0 bg-primary text-primary-foreground h-9 w-9"
            disabled={(!newMessage.trim() && !mediaFile) || uploading}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Hidden AudioConference */}
      {livekitToken && (
        <div style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
          <AudioConference />
        </div>
      )}
    </div>
  );

  if (livekitToken && LIVEKIT_URL) {
    return (
      <LiveKitRoom serverUrl={LIVEKIT_URL} token={livekitToken} connect={true} audio={false} video={false}>
        <RoomAudioRenderer />
        <StartAudio label="Click to enable audio" />
        {roomContent}
      </LiveKitRoom>
    );
  }

  return roomContent;
}

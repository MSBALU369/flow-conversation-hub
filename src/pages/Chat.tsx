import { useState, useEffect, useRef, useCallback } from "react";
import { startOfWeek, getDay } from "date-fns";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Phone, MoreVertical, Send, Image, ArrowLeft, Check, CheckCheck, Mic, Eye, ImageIcon, BarChart3, BellOff, VolumeX, Images, Trash2, User, Volume2, UserPlus, Undo2, Crown } from "lucide-react";
import { BottomNav } from "@/components/layout/BottomNav";
import { useProfile } from "@/hooks/useProfile";
import { useCallState } from "@/hooks/useCallState";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";


interface Friend {
  id: string;
  name: string;
  avatar: string | null;
  lastMessage: string;
  time: string;
  unread: number;
  isOnline: boolean;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  timestamp: Date;
  status: "sent" | "delivered" | "read";
  type: "text" | "image" | "voice";
  viewOnce?: boolean;
}

// No more mock data — friends and messages are fetched from Supabase

const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function CompareGraph({ userName, friendName, myData, friendData }: { userName: string; friendName: string; myData: { day: string; minutes: number }[]; friendData: { day: string; minutes: number }[] }) {
  const maxMin = Math.max(...myData.map(d => d.minutes), ...friendData.map(d => d.minutes), 1);
  const cW = 280, cH = 140, pL = 40, pR = 10, pT = 10, pB = 10;
  const plotW = cW - pL - pR, plotH = cH - pT - pB;
  const toPoints = (data: typeof myData) =>
    data.map((d, i) => ({ x: pL + (i / (data.length - 1)) * plotW, y: cH - pB - (d.minutes / maxMin) * plotH }));
  const toPath = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ");
  const myPts = toPoints(myData), friendPts = toPoints(friendData);
  const myTotal = myData.reduce((s, d) => s + d.minutes, 0);
  const friendTotal = friendData.reduce((s, d) => s + d.minutes, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ background: "#9ca3af" }} />
          <span className="text-muted-foreground">{userName} ({myTotal}m)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ background: "#38bdf8" }} />
          <span className="text-muted-foreground">{friendName} ({friendTotal}m)</span>
        </div>
      </div>
      <div className="flex justify-center">
        <svg width={cW} height={cH + 20} viewBox={`0 0 ${cW} ${cH + 20}`}>
          {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
            const y = cH - pB - pct * plotH;
            return (
              <g key={pct}>
                <line x1={pL} y1={y} x2={cW - pR} y2={y} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.15} />
                <text x={pL - 5} y={y + 3} textAnchor="end" fontSize={9} fontWeight="bold" fill="hsl(var(--foreground))">{Math.round(pct * maxMin)}m</text>
              </g>
            );
          })}
          <path d={toPath(myPts)} fill="none" stroke="#9ca3af" strokeWidth={2} />
          {myPts.map((p, i) => <circle key={`m${i}`} cx={p.x} cy={p.y} r={3} fill="#9ca3af" />)}
          <path d={toPath(friendPts)} fill="none" stroke="#38bdf8" strokeWidth={2} />
          {friendPts.map((p, i) => <circle key={`f${i}`} cx={p.x} cy={p.y} r={3} fill="#38bdf8" />)}
          {dayLabels.map((day, i) => {
            const x = pL + (i / (dayLabels.length - 1)) * plotW;
            return <text key={day} x={x} y={cH + 14} textAnchor="middle" fontSize={10} fontWeight="bold" fill="hsl(var(--foreground))">{day}</text>;
          })}
        </svg>
      </div>
      <p className="text-center text-[10px] text-muted-foreground">Weekly speaking time comparison</p>
    </div>
  );
}

export default function Chat() {
  const { profile } = useProfile();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { startCall } = useCallState();
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showCompareGraph, setShowCompareGraph] = useState(false);
  const [compareMyData, setCompareMyData] = useState(dayLabels.map(d => ({ day: d, minutes: 0 })));
  const [compareFriendData, setCompareFriendData] = useState(dayLabels.map(d => ({ day: d, minutes: 0 })));
  const [mutedUsers, setMutedUsers] = useState<Set<string>>(new Set());

  // Load muted users from Supabase on mount
  useEffect(() => {
    if (!profile?.id) return;
    const loadMutedUsers = async () => {
      const { data } = await supabase
        .from("muted_users")
        .select("muted_user_id")
        .eq("user_id", profile.id);
      if (data) {
        setMutedUsers(new Set(data.map(d => d.muted_user_id)));
      }
    };
    loadMutedUsers();
  }, [profile?.id]);
  const [showGallery, setShowGallery] = useState(false);
  const [showClearChat, setShowClearChat] = useState(false);
  const [clearChatOption, setClearChatOption] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [addFriendOpen, setAddFriendOpen] = useState(false);
  const [chatFriends, setChatFriends] = useState<Friend[]>([]);
  const [mutualFollowers, setMutualFollowers] = useState<{ id: string; name: string; avatar: string | null; isOnline: boolean }[]>([]);
  const [swipeOffsets, setSwipeOffsets] = useState<Record<string, number>>({});
  const touchStartRef = useRef<{ x: number; y: number; id: string } | null>(null);
  const undoTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch mutual followers (people who follow you AND you follow them)
  useEffect(() => {
    if (!profile?.id) return;
    const fetchMutualFollowers = async () => {
      // Get people I follow
      const { data: iFollow } = await supabase
        .from("friendships")
        .select("friend_id")
        .eq("user_id", profile.id)
        .eq("status", "accepted");
      // Get people who follow me
      const { data: followMe } = await supabase
        .from("friendships")
        .select("user_id")
        .eq("friend_id", profile.id)
        .eq("status", "accepted");

      const iFollowSet = new Set((iFollow || []).map(f => f.friend_id));
      const followMeIds = (followMe || []).map(f => f.user_id);
      const mutualIds = followMeIds.filter(id => iFollowSet.has(id));

      if (mutualIds.length === 0) {
        setMutualFollowers([]);
        return;
      }

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, is_online")
        .in("id", mutualIds);

      const mutuals = (profiles || []).map(p => ({
        id: p.id,
        name: p.username || "User",
        avatar: p.avatar_url,
        isOnline: p.is_online ?? false,
      }));
      setMutualFollowers(mutuals);

      // Also set up chat friends from those who have existing messages
      const { data: recentMessages } = await supabase
        .from("chat_messages")
        .select("sender_id, receiver_id, content, created_at")
        .or(`sender_id.eq.${profile.id},receiver_id.eq.${profile.id}`)
        .order("created_at", { ascending: false });

      // Build friends list from recent messages
      const friendMap = new Map<string, Friend>();
      (recentMessages || []).forEach(msg => {
        const partnerId = msg.sender_id === profile.id ? msg.receiver_id : msg.sender_id;
        if (!friendMap.has(partnerId)) {
          const mutual = mutuals.find(m => m.id === partnerId);
          if (mutual) {
            const timeDiff = Date.now() - new Date(msg.created_at).getTime();
            const timeStr = timeDiff < 60000 ? "now" : timeDiff < 3600000 ? `${Math.floor(timeDiff / 60000)}m` : timeDiff < 86400000 ? `${Math.floor(timeDiff / 3600000)}h` : `${Math.floor(timeDiff / 86400000)}d`;
            friendMap.set(partnerId, {
              id: partnerId,
              name: mutual.name,
              avatar: mutual.avatar,
              lastMessage: msg.content || "📷 Media",
              time: timeStr,
              unread: 0,
              isOnline: mutual.isOnline,
            });
          }
        }
      });
      setChatFriends(Array.from(friendMap.values()));
    };
    fetchMutualFollowers();
  }, [profile?.id]);

  const handleRemoveChat = useCallback(async (friend: Friend) => {
    setChatFriends(prev => prev.filter(f => f.id !== friend.id));
    setSwipeOffsets(prev => { const n = { ...prev }; delete n[friend.id]; return n; });

    // Clear any existing undo timer
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);

    // Real DELETE from Supabase - delete messages sent by current user in this conversation
    if (profile?.id) {
      await supabase
        .from("chat_messages")
        .delete()
        .eq("sender_id", profile.id)
        .eq("receiver_id", friend.id);
    }

    toast({
      title: `Chat with ${friend.name} removed`,
      description: "Messages deleted from your side",
      action: (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setChatFriends(prev => [friend, ...prev]);
          }}
          className="gap-1"
        >
          <Undo2 className="w-3 h-3" />
          Undo
        </Button>
      ),
      duration: 5000,
    });
  }, [toast, profile?.id]);

  const handleTouchStart = useCallback((e: React.TouchEvent, friendId: string) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, id: friendId };
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent, friendId: string) => {
    if (!touchStartRef.current || touchStartRef.current.id !== friendId) return;
    const deltaX = e.touches[0].clientX - touchStartRef.current.x;
    const deltaY = Math.abs(e.touches[0].clientY - touchStartRef.current.y);
    // Only horizontal swipe, ignore vertical scrolling
    if (deltaY > 30) { touchStartRef.current = null; return; }
    // Prevent vertical scroll when swiping horizontally
    if (Math.abs(deltaX) > deltaY) {
      e.preventDefault();
    }
    if (deltaX < 0) {
      setSwipeOffsets(prev => ({ ...prev, [friendId]: Math.min(0, deltaX) }));
    }
  }, []);

  const handleTouchEnd = useCallback((friendId: string) => {
    const offset = swipeOffsets[friendId] || 0;
    if (offset < -100) {
      // Swiped far enough — remove
      const friend = chatFriends.find(f => f.id === friendId);
      if (friend) handleRemoveChat(friend);
    } else {
      // Snap back
      setSwipeOffsets(prev => ({ ...prev, [friendId]: 0 }));
    }
    touchStartRef.current = null;
  }, [swipeOffsets, chatFriends, handleRemoveChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  const MESSAGES_PER_PAGE = 40;
  const [hasMore, setHasMore] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const topSentinelRef = useRef<HTMLDivElement>(null);

  // Fetch real messages when a friend is selected + Realtime subscription
  useEffect(() => {
    if (!selectedFriend || !profile?.id) {
      setMessages([]);
      setHasMore(true);
      return;
    }
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .or(`and(sender_id.eq.${profile.id},receiver_id.eq.${selectedFriend.id}),and(sender_id.eq.${selectedFriend.id},receiver_id.eq.${profile.id})`)
        .order("created_at", { ascending: false })
        .range(0, MESSAGES_PER_PAGE - 1);

      const rows = data || [];
      setHasMore(rows.length === MESSAGES_PER_PAGE);

      const mapped: Message[] = rows.reverse().map(msg => ({
        id: msg.id,
        content: msg.content || "📷 Media",
        senderId: msg.sender_id === profile.id ? "me" : msg.sender_id,
        timestamp: new Date(msg.created_at),
        status: msg.is_read ? "read" as const : "delivered" as const,
        type: msg.media_url ? "image" as const : "text" as const,
        viewOnce: (msg.content || "").startsWith("📸 View once"),
      }));
      setMessages(mapped);
    };
    fetchMessages();

    // Realtime subscription for new messages in this conversation
    const channel = supabase
      .channel(`chat-${[profile.id, selectedFriend.id].sort().join("-")}`)
      .on(
        "postgres_changes" as any,
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
        },
        (payload: any) => {
          const msg = payload.new;
          if (!msg) return;
          // Only add messages that belong to this conversation
          const isRelevant =
            (msg.sender_id === profile.id && msg.receiver_id === selectedFriend.id) ||
            (msg.sender_id === selectedFriend.id && msg.receiver_id === profile.id);
          if (!isRelevant) return;

          const newMsg: Message = {
            id: msg.id,
            content: msg.content || "📷 Media",
            senderId: msg.sender_id === profile.id ? "me" : msg.sender_id,
            timestamp: new Date(msg.created_at),
            status: msg.is_read ? "read" as const : "delivered" as const,
            type: msg.media_url ? "image" as const : "text" as const,
          };
          // Avoid duplicates (from optimistic update)
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev;
            // Remove optimistic message if this is our own message
            if (msg.sender_id === profile.id) {
              const withoutOptimistic = prev.filter(m => !(m.senderId === "me" && m.content === msg.content && m.id.match(/^\d+$/)));
              return [...withoutOptimistic, newMsg];
            }
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedFriend?.id, profile?.id]);
  // Infinite scroll: load older messages
  const loadOlderMessages = useCallback(async () => {
    if (!selectedFriend || !profile?.id || loadingOlder || !hasMore) return;
    setLoadingOlder(true);
    const oldestTimestamp = messages.length > 0 ? messages[0].timestamp.toISOString() : new Date().toISOString();
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .or(`and(sender_id.eq.${profile.id},receiver_id.eq.${selectedFriend.id}),and(sender_id.eq.${selectedFriend.id},receiver_id.eq.${profile.id})`)
      .lt("created_at", oldestTimestamp)
      .order("created_at", { ascending: false })
      .range(0, MESSAGES_PER_PAGE - 1);

    const rows = data || [];
    setHasMore(rows.length === MESSAGES_PER_PAGE);
    const older: Message[] = rows.reverse().map(msg => ({
      id: msg.id,
      content: msg.content || "📷 Media",
      senderId: msg.sender_id === profile.id ? "me" : msg.sender_id,
      timestamp: new Date(msg.created_at),
      status: msg.is_read ? "read" as const : "delivered" as const,
      type: msg.media_url ? "image" as const : "text" as const,
    }));
    setMessages(prev => [...older, ...prev]);
    setLoadingOlder(false);
  }, [selectedFriend?.id, profile?.id, messages, loadingOlder, hasMore]);

  // IntersectionObserver for top sentinel
  useEffect(() => {
    if (!topSentinelRef.current || !selectedFriend) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingOlder) {
          loadOlderMessages();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(topSentinelRef.current);
    return () => observer.disconnect();
  }, [loadOlderMessages, hasMore, loadingOlder, selectedFriend]);


  useEffect(() => {
    if (isRecording) {
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 90) {
            stopRecording();
            return 90;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      setRecordingTime(0);
    }
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, [isRecording]);

  // Fetch real compare graph data when dialog opens
  useEffect(() => {
    if (!showCompareGraph || !profile?.id || !selectedFriend) return;
    const fetchCompareData = async () => {
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      // My call history this week
      const { data: myCalls } = await supabase
        .from("call_history")
        .select("duration, created_at")
        .eq("user_id", profile.id)
        .gte("created_at", weekStart.toISOString());
      const myBuckets = new Array(7).fill(0);
      (myCalls || []).forEach(c => {
        const jsDay = getDay(new Date(c.created_at));
        const idx = jsDay === 0 ? 6 : jsDay - 1;
        myBuckets[idx] += Math.round((c.duration || 0) / 60);
      });
      setCompareMyData(dayLabels.map((day, i) => ({ day, minutes: myBuckets[i] })));

      // Friend's call history this week
      const { data: friendCalls } = await supabase
        .from("call_history")
        .select("duration, created_at")
        .eq("user_id", selectedFriend.id)
        .gte("created_at", weekStart.toISOString());
      const friendBuckets = new Array(7).fill(0);
      (friendCalls || []).forEach(c => {
        const jsDay = getDay(new Date(c.created_at));
        const idx = jsDay === 0 ? 6 : jsDay - 1;
        friendBuckets[idx] += Math.round((c.duration || 0) / 60);
      });
      setCompareFriendData(dayLabels.map((day, i) => ({ day, minutes: friendBuckets[i] })));
    };
    fetchCompareData();
  }, [showCompareGraph, profile?.id, selectedFriend?.id]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !profile?.id || !selectedFriend) return;

    // Optimistic local update
    const tempId = Date.now().toString();
    const message: Message = {
      id: tempId,
      content: newMessage,
      senderId: "me",
      timestamp: new Date(),
      status: "sent",
      type: "text",
    };
    setMessages(prev => [...prev, message]);
    const msgContent = newMessage;
    setNewMessage("");

    // Persist to Supabase
    const { error } = await supabase.from("chat_messages").insert({
      sender_id: profile.id,
      receiver_id: selectedFriend.id,
      content: msgContent,
    });
    if (error) {
      console.error("Failed to send message:", error);
      toast({ title: "Message failed", description: "Could not send message.", variant: "destructive" });
    }
  };

  const startRecording = () => {
    setIsRecording(true);
    toast({
      title: "🎙️ Recording...",
      description: "Max 90 seconds. Tap again to stop.",
    });
  };

  const stopRecording = async () => {
    setIsRecording(false);
    if (recordingTime > 0 && profile?.id && selectedFriend) {
      // Create a small audio blob placeholder (real MediaRecorder integration would go here)
      const blob = new Blob([new ArrayBuffer(recordingTime * 100)], { type: "audio/webm" });
      const fileName = `${profile.id}/voice_${Date.now()}.webm`;

      // Optimistic local update
      const tempId = Date.now().toString();
      const voiceMessage: Message = {
        id: tempId,
        content: `🎤 Voice note (${recordingTime}s)`,
        senderId: "me",
        timestamp: new Date(),
        status: "sent",
        type: "voice",
      };
      setMessages(prev => [...prev, voiceMessage]);

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("chat_media")
        .upload(fileName, blob, { upsert: true });

      if (uploadError) {
        toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
        return;
      }

      const { data: { publicUrl } } = supabase.storage.from("chat_media").getPublicUrl(fileName);

      // Insert real message with media_url
      const { error } = await supabase.from("chat_messages").insert({
        sender_id: profile.id,
        receiver_id: selectedFriend.id,
        content: `🎤 Voice note (${recordingTime}s)`,
        media_url: publicUrl,
      });

      if (error) {
        toast({ title: "Failed to send voice note", variant: "destructive" });
      } else {
        toast({ title: "Voice note sent!", description: `${recordingTime} seconds recorded.` });
      }
    }
  };

  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImageOption = (viewOnce: boolean) => {
    setShowImageOptions(false);
    // Trigger file picker
    if (imageInputRef.current) {
      imageInputRef.current.setAttribute("data-view-once", viewOnce ? "true" : "false");
      imageInputRef.current.click();
    }
  };

  const handleImageFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.id || !selectedFriend) return;
    const viewOnce = e.target.getAttribute("data-view-once") === "true";

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image.", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 10MB", variant: "destructive" });
      return;
    }

    // Optimistic local update
    const tempId = Date.now().toString();
    const imageMessage: Message = {
      id: tempId,
      content: viewOnce ? "📸 View once photo" : "🖼️ Photo",
      senderId: "me",
      timestamp: new Date(),
      status: "sent",
      type: "image",
      viewOnce,
    };
    setMessages(prev => [...prev, imageMessage]);

    // Upload to Supabase Storage
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${profile.id}/img_${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("chat_media")
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("chat_media").getPublicUrl(fileName);

    // Insert real message with media_url
    const { error } = await supabase.from("chat_messages").insert({
      sender_id: profile.id,
      receiver_id: selectedFriend.id,
      content: viewOnce ? "📸 View once photo" : "🖼️ Photo",
      media_url: publicUrl,
    });

    if (error) {
      toast({ title: "Failed to send image", variant: "destructive" });
    } else {
      toast({ title: viewOnce ? "📸 View once image sent!" : "🖼️ Image sent!" });
    }

    // Reset input
    e.target.value = "";
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusIcon = (status: Message["status"]) => {
    switch (status) {
      case "sent":
        return <Check className="w-3 h-3 text-muted-foreground" />;
      case "delivered":
        return <CheckCheck className="w-3 h-3 text-muted-foreground" />;
      case "read":
        return <CheckCheck className="w-3 h-3 text-primary" />;
    }
  };

  // Chat Room View
  if (selectedFriend) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Chat Header */}
        <header className="flex items-center gap-3 px-4 py-3 glass-nav safe-top sticky top-0 z-10">
          <button
            onClick={() => setSelectedFriend(null)}
            className="p-2 -ml-2 rounded-lg hover:bg-muted/50"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>

          <button onClick={() => navigate(`/user/${selectedFriend.id}`, { state: { id: selectedFriend.id, name: selectedFriend.name, avatar: selectedFriend.avatar, level: 3, isOnline: selectedFriend.isOnline, followersCount: 12, followingCount: 8, fansCount: 0, location: "Mumbai, India", uniqueId: "EF" + selectedFriend.id.padStart(10, "0").slice(0, 10).toUpperCase(), createdAt: "2024-08-15T00:00:00Z", myName: profile?.username || "You" } })} className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                {selectedFriend.avatar ? (
                  <img src={selectedFriend.avatar} alt={selectedFriend.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span>{selectedFriend.name[0].toUpperCase()}</span>
                )}
              </div>
              {selectedFriend.isOnline && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-[hsl(var(--ef-online))] rounded-full border-2 border-background" />
              )}
            </div>

            <div className="text-left">
              <h2 className="font-semibold text-foreground">{selectedFriend.name}</h2>
              <p className="text-xs text-muted-foreground">
                {selectedFriend.isOnline ? "Online" : "Offline"}
              </p>
            </div>
          </button>

          {/* Audio Call Button */}
          <button
            className="p-2 rounded-lg hover:bg-muted/50 text-primary"
            onClick={() => {
              startCall(selectedFriend.name, selectedFriend.avatar);
              navigate("/call", { state: { partnerName: selectedFriend.name, partnerAvatar: selectedFriend.avatar } });
            }}
          >
            <Phone className="w-5 h-5" />
          </button>

          {/* Settings Menu - Updated options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded-lg hover:bg-muted/50">
                <MoreVertical className="w-5 h-5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover border-border">
              <DropdownMenuItem onClick={() => setShowGallery(true)}>
                <Images className="w-4 h-4 mr-2" />
                View Gallery
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(`/user/${selectedFriend?.id}`, { state: { id: selectedFriend?.id, name: selectedFriend?.name, avatar: selectedFriend?.avatar, level: 3, isOnline: selectedFriend?.isOnline, followersCount: 12, followingCount: 8, fansCount: 0, location: "Mumbai, India", uniqueId: "EF" + (selectedFriend?.id || "").padStart(10, "0").slice(0, 10).toUpperCase(), createdAt: "2024-08-15T00:00:00Z", myName: profile?.username || "You" } })}>
                <User className="w-4 h-4 mr-2" />
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onClick={() => setShowClearChat(true)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Chat
              </DropdownMenuItem>
              <DropdownMenuItem onClick={async () => {
                if (!selectedFriend || !profile?.id) return;
                const isMuted = mutedUsers.has(selectedFriend.id);
                if (isMuted) {
                  // Unmute: delete from DB
                  await supabase.from("muted_users").delete().eq("user_id", profile.id).eq("muted_user_id", selectedFriend.id);
                  setMutedUsers(prev => { const next = new Set(prev); next.delete(selectedFriend.id); return next; });
                  toast({ title: `Unmuted ${selectedFriend.name}` });
                } else {
                  // Mute: insert to DB
                  await supabase.from("muted_users").insert({ user_id: profile.id, muted_user_id: selectedFriend.id });
                  setMutedUsers(prev => new Set(prev).add(selectedFriend.id));
                  toast({ title: `Muted ${selectedFriend.name}`, description: "You won't receive notifications from this user." });
                }
              }}>
                {selectedFriend && mutedUsers.has(selectedFriend.id) ? (
                  <><VolumeX className="w-4 h-4 mr-2" />Unmute User</>
                ) : (
                  <><Volume2 className="w-4 h-4 mr-2" />Mute User</>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowCompareGraph(true)}>
                <BarChart3 className="w-4 h-4 mr-2" />
                Compare Graph
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Messages */}
        <main className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {/* Top sentinel for infinite scroll */}
          <div ref={topSentinelRef} className="h-1" />
          {loadingOlder && (
            <div className="text-center py-2">
              <span className="text-xs text-muted-foreground animate-pulse">Loading older messages...</span>
            </div>
          )}
          {messages.map((message) => {
            const isMe = message.senderId === "me";
            return (
              <div
                key={message.id}
                className={cn("flex", isMe ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[75%] px-4 py-2 rounded-2xl",
                    isMe
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "glass-card rounded-bl-md"
                  )}
                >
                  <p className={cn(
                    isMe ? "text-primary-foreground" : "text-foreground",
                    message.type === "voice" && "flex items-center gap-2"
                  )}>
                    {message.type === "voice" && <Mic className="w-4 h-4" />}
                    {message.type === "image" && message.viewOnce && !isMe && (
                      <button
                        className="inline-flex items-center gap-1 underline"
                        onClick={async () => {
                          // Show content briefly, then destroy from storage + DB
                          toast({ title: "📸 View Once", description: "This image will be deleted after viewing." });
                          // Extract storage path from media_url if available
                          const msgRow = await supabase
                            .from("chat_messages")
                            .select("media_url")
                            .eq("id", message.id)
                            .single();
                          const mediaUrl = msgRow.data?.media_url;
                          if (mediaUrl) {
                            // Extract file path from public URL
                            const pathMatch = mediaUrl.match(/chat_media\/(.+)$/);
                            if (pathMatch?.[1]) {
                              await supabase.storage.from("chat_media").remove([decodeURIComponent(pathMatch[1])]);
                            }
                          }
                          // Delete the message row
                          await supabase
                            .from("chat_messages")
                            .delete()
                            .eq("id", message.id);
                          // Remove from local state
                          setMessages(prev => prev.filter(m => m.id !== message.id));
                          toast({ title: "View Once media destroyed", description: "File permanently deleted." });
                        }}
                      >
                        <Eye className="w-4 h-4" /> Tap to view
                      </button>
                    )}
                    {message.type === "image" && message.viewOnce && isMe && (
                      <span className="inline-flex items-center gap-1">
                        <Eye className="w-4 h-4" /> {message.content}
                      </span>
                    )}
                    {!(message.type === "image" && message.viewOnce) && message.content}
                  </p>
                  <div className={cn(
                    "flex items-center gap-1 mt-1",
                    isMe ? "justify-end" : "justify-start"
                  )}>
                    <span className={cn(
                      "text-[10px]",
                      isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}>
                      {formatTime(message.timestamp)}
                    </span>
                    {isMe && getStatusIcon(message.status)}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </main>

        {/* Hidden file input for image uploads */}
        <input
          type="file"
          ref={imageInputRef}
          accept="image/*"
          className="hidden"
          onChange={handleImageFileSelected}
        />

        {/* Message Input */}
        <div className="p-4 glass-nav safe-bottom">
          {isRecording ? (
            <div className="flex items-center gap-3">
              <div className="flex-1 flex items-center gap-3 bg-destructive/20 rounded-xl px-4 py-3">
                <div className="w-3 h-3 bg-destructive rounded-full animate-pulse" />
                <span className="text-foreground font-medium">Recording...</span>
                <span className="text-muted-foreground ml-auto">{formatRecordingTime(recordingTime)} / 1:30</span>
              </div>
              <Button
                onClick={stopRecording}
                size="icon"
                className="bg-destructive text-destructive-foreground"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {/* Image Button with Options */}
              <button 
                onClick={() => setShowImageOptions(true)}
                className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground"
              >
                <Image className="w-5 h-5" />
              </button>
              
              {/* Mic Button - Voice Recording */}
              <button 
                onClick={startRecording}
                className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground"
              >
                <Mic className="w-5 h-5" />
              </button>
              
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-muted border-border"
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              />
              <Button
                onClick={handleSendMessage}
                size="icon"
                className="bg-primary text-primary-foreground"
                disabled={!newMessage.trim()}
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          )}
        </div>

        {/* Image Options Dialog */}
        <Dialog open={showImageOptions} onOpenChange={setShowImageOptions}>
          <DialogContent className="glass-card border-border max-w-xs">
            <DialogHeader>
              <DialogTitle className="text-foreground">Send Image</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-3">
              <button
                onClick={() => handleImageOption(false)}
                className="w-full flex items-center gap-3 p-4 glass-button rounded-xl hover:bg-muted transition-colors"
              >
                <ImageIcon className="w-6 h-6 text-primary" />
                <div className="text-left">
                  <p className="font-medium text-foreground">Send Image</p>
                  <p className="text-xs text-muted-foreground">Standard photo sharing</p>
                </div>
              </button>
              <button
                onClick={() => handleImageOption(true)}
                className="w-full flex items-center gap-3 p-4 glass-button rounded-xl hover:bg-muted transition-colors"
              >
                <Eye className="w-6 h-6 text-accent" />
                <div className="text-left">
                  <p className="font-medium text-foreground">View Once</p>
                  <p className="text-xs text-muted-foreground">Disappears after viewing</p>
                </div>
              </button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Compare Graph Dialog */}
        <Dialog open={showCompareGraph} onOpenChange={setShowCompareGraph}>
          <DialogContent className="glass-card border-border max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-foreground flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Speaking Time with {selectedFriend?.name}
              </DialogTitle>
            </DialogHeader>
            <CompareGraph userName={profile?.username || "You"} friendName={selectedFriend?.name || "User"} myData={compareMyData} friendData={compareFriendData} />
          </DialogContent>
        </Dialog>


        {/* Gallery Dialog */}
        <Dialog open={showGallery} onOpenChange={setShowGallery}>
          <DialogContent className="glass-card border-border max-w-sm max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-foreground flex items-center gap-2">
                <Images className="w-5 h-5 text-primary" />
                Shared Media
              </DialogTitle>
            </DialogHeader>
            <div className="py-2">
              {(() => {
                const mediaMessages = messages.filter(m => m.type === "image");
                if (mediaMessages.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center py-10">
                      <Images className="w-12 h-12 text-muted-foreground mb-3" />
                      <p className="text-sm text-muted-foreground">No shared media yet</p>
                      <p className="text-xs text-muted-foreground mt-1">Photos shared in chat will appear here</p>
                    </div>
                  );
                }
                return (
                  <div className="grid grid-cols-3 gap-2">
                    {mediaMessages.map(msg => (
                      <div key={msg.id} className="aspect-square rounded-lg bg-muted overflow-hidden">
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </DialogContent>
        </Dialog>

        {/* Clear Chat Dialog */}
        <Dialog open={showClearChat} onOpenChange={(open) => { setShowClearChat(open); if (!open) setClearChatOption(null); }}>
          <DialogContent className="glass-card border-border max-w-xs">
            <DialogHeader>
              <DialogTitle className="text-foreground flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-destructive" />
                Clear Chat
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">Select how far back to clear messages:</p>
            <div className="space-y-2 py-2">
              {[
                { label: "Last 1 Hour", value: "1h" },
                { label: "Last 1 Day", value: "1d" },
                { label: "Last 1 Month", value: "1m" },
                { label: "All Time", value: "all" },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setClearChatOption(opt.value)}
                  className={cn(
                    "w-full p-3 rounded-xl text-left text-sm font-medium transition-colors",
                    clearChatOption === opt.value
                      ? "bg-destructive/15 text-destructive border border-destructive/30"
                      : "bg-muted/50 text-foreground hover:bg-muted"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <DialogFooter className="flex gap-2 sm:gap-2">
              <Button variant="outline" className="flex-1" onClick={() => { setShowClearChat(false); setClearChatOption(null); }}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                disabled={!clearChatOption}
                onClick={async () => {
                  const now = new Date();
                  let cutoff: Date;
                  switch (clearChatOption) {
                    case "1h": cutoff = new Date(now.getTime() - 60 * 60 * 1000); break;
                    case "1d": cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000); break;
                    case "1m": cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
                    default: cutoff = new Date(0);
                  }
                  // Real Supabase DELETE with orphaned media cleanup
                  if (profile?.id && selectedFriend) {
                    // Step 1: Fetch messages to be deleted (to find media_urls)
                    let selectQuery = supabase
                      .from("chat_messages")
                      .select("id, media_url")
                      .eq("sender_id", profile.id)
                      .eq("receiver_id", selectedFriend.id);
                    if (clearChatOption !== "all") {
                      selectQuery = selectQuery.gte("created_at", cutoff.toISOString());
                    }
                    const { data: toDelete } = await selectQuery;

                    // Step 2: Remove orphaned media from storage
                    if (toDelete && toDelete.length > 0) {
                      const mediaPaths = toDelete
                        .filter(m => m.media_url)
                        .map(m => {
                          // Extract storage path from public URL
                          const url = m.media_url!;
                          const bucketSegment = "/chat_media/";
                          const idx = url.indexOf(bucketSegment);
                          return idx !== -1 ? url.substring(idx + bucketSegment.length).split("?")[0] : null;
                        })
                        .filter(Boolean) as string[];

                      if (mediaPaths.length > 0) {
                        await supabase.storage.from("chat_media").remove(mediaPaths);
                      }
                    }

                    // Step 3: Delete messages
                    let deleteQuery = supabase
                      .from("chat_messages")
                      .delete()
                      .eq("sender_id", profile.id)
                      .eq("receiver_id", selectedFriend.id);
                    if (clearChatOption !== "all") {
                      deleteQuery = deleteQuery.gte("created_at", cutoff.toISOString());
                    }

                    const { error } = await deleteQuery;
                    if (error) {
                      console.error("Failed to clear chat:", error);
                      toast({ title: "Failed to clear chat", variant: "destructive" });
                    } else {
                      setMessages(prev => prev.filter(m => {
                        if (m.senderId !== "me") return true;
                        if (clearChatOption === "all") return false;
                        return m.timestamp < cutoff;
                      }));
                      toast({ title: "Chat cleared", description: `Your messages from ${clearChatOption === "all" ? "all time" : `last ${clearChatOption === "1h" ? "1 hour" : clearChatOption === "1d" ? "1 day" : "1 month"}`} have been removed.` });
                    }
                  }
                  setShowClearChat(false);
                  setClearChatOption(null);
                }}
              >
                Clear
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    );
  }

  // Friends List View
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4 safe-top">
        <div className="relative">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center overflow-hidden cursor-pointer ${
              profile?.is_premium ? 'ring-2 ring-[hsl(45,100%,50%)]' : 'bg-primary/20'
            }`}
            onClick={() => navigate("/profile")}
          >
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-lg">👤</span>
            )}
          </div>
          {profile?.is_premium && (
            <Crown className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 text-[hsl(45,100%,50%)] drop-shadow-sm" fill="hsl(45,100%,50%)" />
          )}
        </div>

        <h1 className="text-xl font-bold text-foreground">Chat</h1>

        <Popover open={addFriendOpen} onOpenChange={setAddFriendOpen}>
          <PopoverTrigger asChild>
            <button className="relative w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-primary" />
              {mutualFollowers.filter(mf => !chatFriends.some(cf => cf.id === mf.id)).length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-destructive text-destructive-foreground text-xs font-bold flex items-center justify-center">
                  {mutualFollowers.filter(mf => !chatFriends.some(cf => cf.id === mf.id)).length}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64 p-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1.5">Mutual Followers</p>
            {mutualFollowers.filter(mf => !chatFriends.some(cf => cf.id === mf.id)).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No new followers to add</p>
            ) : (
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {mutualFollowers
                  .filter(mf => !chatFriends.some(cf => cf.id === mf.id))
                  .map((follower) => (
                    <button
                      key={follower.id}
                      onClick={() => {
                        const newFriend: Friend = {
                          id: follower.id,
                          name: follower.name,
                          avatar: follower.avatar,
                          lastMessage: "",
                          time: "",
                          unread: 0,
                          isOnline: follower.isOnline,
                        };
                        setChatFriends(prev => [newFriend, ...prev]);
                        setAddFriendOpen(false);
                        setSelectedFriend(newFriend);
                      }}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="relative">
                        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-foreground">
                          {follower.avatar ? (
                            <img src={follower.avatar} alt={follower.name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            follower.name[0].toUpperCase()
                          )}
                        </div>
                        {follower.isOnline && (
                          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[hsl(var(--ef-online))] rounded-full border-2 border-background" />
                        )}
                      </div>
                      <span className="text-sm font-medium text-foreground flex-1 text-left">{follower.name}</span>
                      <span className="text-xs text-primary font-medium">Add</span>
                    </button>
                  ))}
              </div>
            )}
          </PopoverContent>
        </Popover>
      </header>

      {/* Info Banner */}
      <div className="px-4 mb-4">
        <div className="glass-card p-3 text-center">
          <p className="text-sm text-muted-foreground">
            💬 Only mutual followers can chat with each other
          </p>
        </div>
      </div>

      <main className="px-4">
        {chatFriends.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <MessageCircle className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No chats yet</p>
            <p className="text-sm text-muted-foreground">
              Tap + to add a mutual follower!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {chatFriends.map((friend) => {
              const offset = swipeOffsets[friend.id] || 0;
              return (
                <div key={friend.id} className="relative overflow-hidden rounded-xl">
                  {/* Delete background */}
                  <div className="absolute inset-y-0 right-0 flex items-center justify-end pr-4 bg-destructive rounded-xl w-full">
                    <Trash2 className="w-5 h-5 text-destructive-foreground" />
                  </div>

                  {/* Swipeable card */}
                  <div
                    onTouchStart={(e) => handleTouchStart(e, friend.id)}
                    onTouchMove={(e) => handleTouchMove(e, friend.id)}
                    onTouchEnd={() => handleTouchEnd(friend.id)}
                    onClick={() => { if (Math.abs(offset) < 10) setSelectedFriend(friend); }}
                    className="relative flex items-center gap-3 p-3 rounded-xl bg-background transition-transform duration-200 ease-out cursor-pointer"
                    style={{ transform: `translateX(${offset}px)` }}
                  >
                    <div className="relative">
                      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-xl font-bold text-foreground">
                        {friend.avatar ? (
                          <img src={friend.avatar} alt={friend.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          friend.name[0].toUpperCase()
                        )}
                      </div>
                      {friend.isOnline && (
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-[hsl(var(--ef-online))] rounded-full border-2 border-background" />
                      )}
                    </div>

                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-foreground">{friend.name}</p>
                          {mutedUsers.has(friend.id) && (
                            <BellOff className="w-3.5 h-3.5 text-muted-foreground" />
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">{friend.time}</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {friend.lastMessage}
                      </p>
                    </div>

                    {friend.unread > 0 && (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-xs font-bold text-primary-foreground">
                          {friend.unread}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

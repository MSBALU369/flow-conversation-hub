import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { Mic, Play, Pause, Heart, MessageCircle, Star, Upload, Clock, Share2, Users, ArrowLeft, MoreVertical, EyeOff, Eye, Trash2, Flag, Send, Link, UserPlus, Reply, FolderOpen, ListMusic, Plus, Check, ThumbsDown, X, Lock, Globe, Coins } from "lucide-react";
import { UserProfilePopup } from "@/components/UserProfilePopup";
import { BottomNav } from "@/components/layout/BottomNav";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { MentionInput } from "@/components/MentionInput";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
interface TalentPost {
  id: string;
  user_id: string;
  username: string;
  avatar: string | null;
  language: string;
  category: string;
  title: string;
  likes: number;
  plays: number;
  shares: number;
  duration: string;
  isLiked: boolean;
  isFan: boolean;
  isPrivate: boolean;
}

// Categories for filtering
const categories = ["All", "Singing", "Dialogue", "Comedy", "Motivation", "Story"];
const languages = [
"All",
"English",
"Hindi",
"Telugu",
"Kannada",
"Tamil",
"Malayalam",
"Bengali",
"Marathi",
"Gujarati",
"Punjabi",
"Odia",
"Urdu",
"Assamese",
"Arabic",
"Spanish",
"French",
"German",
"Portuguese",
"Russian",
"Japanese",
"Korean",
"Chinese",
"Italian",
"Dutch",
"Turkish",
"Indonesian",
"Thai",
"Vietnamese",
"Nepali"];

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>, postId: string) => {
    const audio = audioElementsRef.current.get(postId);
    if (!audio || !audio.duration || !isFinite(audio.duration)) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * audio.duration;
    setAudioProgress(prev => ({ ...prev, [postId]: ratio * 100 }));
    setAudioCurrentTime(prev => ({ ...prev, [postId]: audio.currentTime }));
  };

// No mock data - talent posts fetched from Supabase
export default function Talent() {
  const {
    profile
  } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const [posts, setPosts] = useState<TalentPost[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showMyTalents, setShowMyTalents] = useState(false);
  const [myTalentFilter, setMyTalentFilter] = useState("All");
  const [selectedLanguage, setSelectedLanguage] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState<"recent" | "popular">("recent");
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [hiddenLoaded, setHiddenLoaded] = useState(false);
  const [commentOpenId, setCommentOpenId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<Record<string, {user: string;text: string;replies: {user: string;text: string;}[];}[]>>({});
  const [replyingTo, setReplyingTo] = useState<{postId: string;commentIdx: number;} | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sharePickerPostId, setSharePickerPostId] = useState<string | null>(null);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [playlistTab, setPlaylistTab] = useState<"playlist" | "hidden">("playlist");
  const [playlist, setPlaylist] = useState<Record<string, Set<string>>>({});
  const [playlistFilter, setPlaylistFilter] = useState("All");
  const [playlistLangFilter, setPlaylistLangFilter] = useState("All");
  const [previewPostId, setPreviewPostId] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const [profilePopupUser, setProfilePopupUser] = useState<any>(null);

  // Load hidden_talents from profile on mount
  useEffect(() => {
    if (!user?.id) return;
    const loadHidden = async () => {
      const { data } = await supabase.from("profiles").select("hidden_talents").eq("id", user.id).single();
      const arr = (data as any)?.hidden_talents || [];
      setHiddenIds(new Set(arr));
      setHiddenLoaded(true);
    };
    loadHidden();
  }, [user?.id]);

  // Fetch real talent posts from Supabase
  useEffect(() => {
    const fetchTalents = async () => {
      const { data } = await supabase.
      from("talent_uploads").
      select("id, title, language, category, likes_count, plays_count, duration_sec, created_at, user_id, is_private").
      eq("is_private", false).
      order("created_at", { ascending: false }).
      limit(50);

      if (!data || data.length === 0) {setPosts([]);return;}

      const userIds = [...new Set(data.map((t) => t.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("id, username, avatar_url").in("id", userIds);
      const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

      setPosts(data.map((t) => {
        const p = profileMap.get(t.user_id);
        const durMin = Math.floor((t.duration_sec || 0) / 60);
        const durSec = (t.duration_sec || 0) % 60;
        return {
          id: t.id,
          user_id: t.user_id,
          username: p?.username || "User",
          avatar: p?.avatar_url || null,
          language: t.language || "English",
          category: (t as any).category || "Singing",
          title: t.title || "Untitled",
          likes: t.likes_count,
          plays: t.plays_count,
          shares: 0,
          duration: `${durMin}:${durSec.toString().padStart(2, '0')}`,
          isLiked: false,
          isFan: false,
          isPrivate: t.is_private
        };
      }));
    };
    fetchTalents();
  }, [location.key]);

  // Fetch real friends for sharing from mutual followers
  const [shareFriends, setShareFriends] = useState<{id: string;name: string;avatar: string | null;}[]>([]);

  useEffect(() => {
    if (!profile?.id) return;
    const fetchShareFriends = async () => {
      const { data: iFollow } = await supabase.from("friendships").select("friend_id").eq("user_id", profile.id).eq("status", "accepted");
      const { data: followMe } = await supabase.from("friendships").select("user_id").eq("friend_id", profile.id).eq("status", "accepted");
      const iFollowSet = new Set((iFollow || []).map((f) => f.friend_id));
      const mutualIds = (followMe || []).map((f) => f.user_id).filter((id) => iFollowSet.has(id));
      if (mutualIds.length === 0) {setShareFriends([]);return;}
      const { data: profiles } = await supabase.from("profiles").select("id, username, avatar_url").in("id", mutualIds);
      setShareFriends((profiles || []).map((p) => ({ id: p.id, name: p.username || "User", avatar: p.avatar_url })));
    };
    fetchShareFriends();
  }, [profile?.id]);

  // Users available for @mention (post authors + friends)
  const mentionUsers = [
  ...shareFriends,
  ...posts.map((p) => ({ id: p.id, name: p.username }))].
  filter((u, i, arr) => arr.findIndex((x) => x.name === u.name) === i);

  // Upload form states
  const [uploadLanguage, setUploadLanguage] = useState("");
  const [uploadCategory, setUploadCategory] = useState("");
  const [uploadVisibility, setUploadVisibility] = useState<"public" | "private">("public");
  const [myTalentVisibility, setMyTalentVisibility] = useState<"all" | "public" | "private">("all");
  const [playedIds, setPlayedIds] = useState<Set<string>>(new Set());

  // Recording states for talent upload
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [previewProgress, setPreviewProgress] = useState(0);
  const [previewCurrentTime, setPreviewCurrentTime] = useState(0);
  const [previewDuration, setPreviewDuration] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Real audio playback state per talent card
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const [audioProgress, setAudioProgress] = useState<Record<string, number>>({});
  const [audioCurrentTime, setAudioCurrentTime] = useState<Record<string, number>>({});
  const [audioDuration, setAudioDuration] = useState<Record<string, number>>({});

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 120) {
            // Auto-stop at 2 minutes
            stopTalentRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } else if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
    return () => {
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    };
  }, [isRecording]);

  const startTalentRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];

      const preferredMimeTypes = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
      const supportedMimeType = preferredMimeTypes.find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = supportedMimeType
        ? new MediaRecorder(stream, { mimeType: supportedMimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.start(250);
      setIsRecording(true);
      setRecordingTime(0);
      setRecordedBlob(null);
      setRecordedUrl(null);
      setPreviewProgress(0);
      setPreviewCurrentTime(0);
      setPreviewDuration(0);
    } catch (error) {
      console.error("Talent recording start failed:", error);
      toast({ title: "Microphone access denied", description: "Please allow microphone access.", variant: "destructive" });
    }
  };

  const stopTalentRecording = async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    setIsRecording(false);
    await new Promise<void>(resolve => {
      recorder.onstop = () => resolve();
      recorder.stop();
    });
    mediaStreamRef.current?.getTracks().forEach(t => t.stop());
    mediaStreamRef.current = null;
    mediaRecorderRef.current = null;
    const mimeType = audioChunksRef.current[0]?.type || 'audio/webm';
    const blob = new Blob(audioChunksRef.current, { type: mimeType });
    audioChunksRef.current = [];
    setRecordedBlob(blob);
    setRecordedUrl(URL.createObjectURL(blob));
  };

  const cancelTalentRecording = () => {
    mediaRecorderRef.current?.stop();
    mediaStreamRef.current?.getTracks().forEach(t => t.stop());
    mediaRecorderRef.current = null;
    mediaStreamRef.current = null;
    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordingTime(0);
    setRecordedBlob(null);
    if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    setRecordedUrl(null);
    setPreviewProgress(0);
    setIsPreviewPlaying(false);
  };

  const togglePreviewPlay = () => {
    if (!previewAudioRef.current || !recordedUrl) return;
    if (isPreviewPlaying) {
      previewAudioRef.current.pause();
      setIsPreviewPlaying(false);
    } else {
      previewAudioRef.current.play();
      setIsPreviewPlaying(true);
    }
  };

  const handleUploadTalent = async () => {
    if (!user?.id) {
      toast({ title: "Login required", description: "Please log in to upload talent.", variant: "destructive" });
      return;
    }

    if (!recordedBlob || recordedBlob.size === 0) {
      toast({ title: "No valid recording", description: "Please record your voice before uploading.", variant: "destructive" });
      return;
    }

    if (!uploadLanguage) {
      toast({ title: "Select a language", variant: "destructive" });
      return;
    }

    if (!uploadCategory) {
      toast({ title: "Select a category", variant: "destructive" });
      return;
    }

    setUploading(true);

    try {
      const extension = recordedBlob.type.includes("mp4") ? "mp4" : "webm";
      const normalizedBlob = recordedBlob.type
        ? recordedBlob
        : new Blob([recordedBlob], { type: "audio/webm" });
      const filePath = `${user.id}/talents/talent_${Date.now()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("chat_media")
        .upload(filePath, normalizedBlob, {
          contentType: normalizedBlob.type || "audio/webm",
          upsert: false,
        });

      if (uploadError) {
        console.error("Talent storage upload failed:", { uploadError, filePath, userId: user.id });
        toast({ title: "Storage upload failed", description: uploadError.message, variant: "destructive" });
        return;
      }

      const { data: urlData } = supabase.storage.from("chat_media").getPublicUrl(filePath);
      const publicUrl = urlData?.publicUrl;

      if (!publicUrl) {
        console.error("Talent public URL generation failed:", { filePath, userId: user.id });
        toast({ title: "Failed to get file URL", description: "Upload succeeded but URL generation failed.", variant: "destructive" });
        return;
      }

      const durationSeconds = Math.max(1, Math.round(previewDuration || recordingTime));
      const insertPayload = {
        user_id: user.id,
        audio_url: publicUrl,
        language: uploadLanguage,
        category: uploadCategory,
        title: uploadTitle.trim() || `${uploadCategory} in ${uploadLanguage}`,
        duration_sec: durationSeconds,
        is_private: uploadVisibility === "private",
      };

      const { error: insertError } = await supabase.from("talent_uploads").insert(insertPayload);

      if (insertError) {
        console.error("Talent DB insert failed:", { insertError, insertPayload });
        toast({ title: "Failed to save talent", description: insertError.message, variant: "destructive" });
        return;
      }

      toast({ title: "Talent uploaded!", description: "Your recording is now live." });
      setShowUploadModal(false);
      cancelTalentRecording();
      setUploadTitle("");
      setUploadLanguage("");
      setUploadCategory("");
      window.location.reload();
    } catch (error: any) {
      console.error("Talent upload error:", error);
      toast({ title: "Upload failed", description: error?.message || "Unexpected upload error", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };
  const togglePlay = async (id: string) => {
    if (playingId === id) {
      // Pause current
      const audio = audioElementsRef.current.get(id);
      if (audio) audio.pause();
      setPlayingId(null);
    } else {
      // Stop any currently playing
      if (playingId) {
        const prevAudio = audioElementsRef.current.get(playingId);
        if (prevAudio) { prevAudio.pause(); prevAudio.currentTime = 0; }
      }
      setPlayingId(id);
      // Fetch audio URL and play
      const { data: talent } = await supabase.from("talent_uploads").select("audio_url").eq("id", id).single();
      if (talent?.audio_url) {
        let audio = audioElementsRef.current.get(id);
        if (!audio) {
          audio = new Audio(talent.audio_url);
          audioElementsRef.current.set(id, audio);
          audio.onloadedmetadata = () => {
            if (audio!.duration && isFinite(audio!.duration)) {
              setAudioDuration(prev => ({ ...prev, [id]: audio!.duration }));
            }
          };
          audio.ontimeupdate = () => {
            if (audio!.duration) {
              setAudioProgress(prev => ({ ...prev, [id]: (audio!.currentTime / audio!.duration) * 100 }));
              setAudioCurrentTime(prev => ({ ...prev, [id]: audio!.currentTime }));
            }
          };
          audio.onended = () => {
            setPlayingId(null);
            setAudioProgress(prev => ({ ...prev, [id]: 0 }));
            setAudioCurrentTime(prev => ({ ...prev, [id]: 0 }));
          };
        }
        audio.play().catch(() => {});
      }
      // Increment plays_count in DB on first play per session
      if (!playedIds.has(id)) {
        setPlayedIds((prev) => new Set(prev).add(id));
        setPosts((prev) => prev.map((p) => p.id === id ? { ...p, plays: p.plays + 1 } : p));
        await supabase
          .from("talent_uploads")
          .update({ plays_count: posts.find((p) => p.id === id)!.plays + 1 })
          .eq("id", id);
      }
    }
  };
  const toggleLike = (id: string) => {
    setPosts(posts.map((post) => {
      if (post.id === id) {
        return {
          ...post,
          isLiked: !post.isLiked,
          likes: post.isLiked ? post.likes - 1 : post.likes + 1
        };
      }
      return post;
    }));
  };
  const toggleFan = (id: string) => {
    setPosts(posts.map((post) => {
      if (post.id === id) {
        return {
          ...post,
          isFan: !post.isFan
        };
      }
      return post;
    }));
  };
  const canRecord = uploadLanguage && uploadCategory;

  const handleHide = async (id: string) => {
    setHiddenIds((prev) => new Set(prev).add(id));
    toast({ title: "Hidden", description: "This talent has been hidden from your feed." });
    // Persist to DB
    if (user?.id) {
      const newArr = [...hiddenIds, id];
      await supabase.from("profiles").update({ hidden_talents: newArr } as any).eq("id", user.id);
    }
  };

  const handleUnhide = async (id: string) => {
    setHiddenIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    toast({ title: "Unhidden", description: "This talent is visible in your feed again." });
    // Persist to DB
    if (user?.id) {
      const newArr = [...hiddenIds].filter((h) => h !== id);
      await supabase.from("profiles").update({ hidden_talents: newArr } as any).eq("id", user.id);
    }
  };

  const handleDeletePermanent = async (id: string) => {
    const { error } = await supabase.from("talent_uploads").delete().eq("id", id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    setPosts((prev) => prev.filter((p) => p.id !== id));
    setHiddenIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    toast({ title: "Deleted", description: "Talent post permanently deleted." });
  };

  const handleDeleteHidden = async (id: string) => {
    const post = posts.find((p) => p.id === id);
    const isOwn = post?.user_id === user?.id;
    if (isOwn) {
      await handleDeletePermanent(id);
    } else {
      await handleUnhide(id);
    }
  };

  const hiddenPosts = posts.filter((p) => hiddenIds.has(p.id));

  const handleAddToPlaylist = (postId: string, category: string) => {
    setPlaylist((prev) => {
      const next = { ...prev };
      if (!next[category]) next[category] = new Set();
      if (next[category].has(postId)) {
        next[category] = new Set([...next[category]].filter((id) => id !== postId));
        if (next[category].size === 0) delete next[category];
      } else {
        next[category] = new Set([...next[category], postId]);
      }
      return next;
    });
    toast({ title: "Playlist updated" });
  };

  const isInPlaylist = (postId: string) => {
    return Object.values(playlist).some((set) => set.has(postId));
  };

  const handleRemoveFromPlaylist = (postId: string, category: string) => {
    setPlaylist((prev) => {
      const next = { ...prev };
      if (next[category]) {
        next[category] = new Set([...next[category]].filter((id) => id !== postId));
        if (next[category].size === 0) delete next[category];
      }
      return { ...next };
    });
    toast({ title: "Removed from playlist" });
  };

  const getPlaylistPosts = () => {
    const ids = new Set<string>();
    Object.values(playlist).forEach((set) => set.forEach((id) => ids.add(id)));
    return posts.filter((p) => ids.has(p.id));
  };

  const totalPlaylistCount = Object.values(playlist).reduce((sum, set) => sum + set.size, 0);

  const handleDelete = async (id: string, isOwn: boolean) => {
    if (isOwn) {
      await handleDeletePermanent(id);
    } else {
      await handleHide(id);
    }
  };

  const handleReport = (id: string) => {
    toast({ title: "Reported", description: "Thank you for reporting. We'll review this content." });
  };

  const handleCopyLink = async (post: TalentPost) => {
    const shareUrl = `${window.location.origin}/talent?id=${post.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${post.username} - ${post.category}`, text: post.title, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast({ title: "Link copied!", description: "Share link copied to clipboard." });
      }
      setPosts((prev) => prev.map((p) => p.id === post.id ? { ...p, shares: p.shares + 1 } : p));
    } catch (err) {}
  };

  const handleShareToFriend = (post: TalentPost, friendName: string) => {
    setPosts((prev) => prev.map((p) => p.id === post.id ? { ...p, shares: p.shares + 1 } : p));
    setSharePickerPostId(null);
    toast({ title: `Shared with ${friendName}`, description: `"${post.title}" sent to their chat.` });
  };

  const handleSendComment = (postId: string) => {
    if (!commentText.trim()) return;
    const username = profile?.username || "You";
    setComments((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] || []), { user: username, text: commentText.trim(), replies: [] }]
    }));
    setCommentText("");
    setCommentOpenId(null);
  };

  const handleSendReply = (postId: string, commentIdx: number) => {
    if (!replyText.trim()) return;
    const username = profile?.username || "You";
    setComments((prev) => {
      const postComments = [...(prev[postId] || [])];
      postComments[commentIdx] = {
        ...postComments[commentIdx],
        replies: [...postComments[commentIdx].replies, { user: username, text: replyText.trim() }]
      };
      return { ...prev, [postId]: postComments };
    });
    setReplyText("");
    setReplyingTo(null);
  };

  const filteredPosts = posts.filter((post) => !hiddenIds.has(post.id)).filter((post) => !post.isPrivate || post.username === (profile?.username || "You")).filter((post) => selectedLanguage === "All" || post.language === selectedLanguage).filter((post) => selectedCategory === "All" || post.category === selectedCategory).sort((a, b) => sortBy === "popular" ? b.likes - a.likes : 0);
  return <div className="min-h-screen bg-background pb-24">
      <AppHeader streakDays={profile?.streak_count ?? 1} level={profile?.level ?? 1} showLogout />

      <main className="px-4 pt-4">
        {/* Page Title */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-muted transition-colors">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Mic className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Talent</h1>
              
            </div>
          </div>
          <Button onClick={() => setShowUploadModal(true)} size="sm" className="bg-primary text-primary-foreground text-[10px] h-7 px-2">
            <Upload className="w-3 h-3 mr-1" />
            Show your talent
          </Button>
        </div>

        {/* Horizontal Category Filter Bar */}
        <div className="mb-4 -mx-4 px-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((cat) => <button key={cat} onClick={() => setSelectedCategory(cat)} className={cn("px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all", selectedCategory === cat ? "bg-primary text-primary-foreground" : "glass-button text-foreground hover:bg-muted")}>
                {cat}
              </button>)}
          </div>
        </div>

        {/* Language & Sort Filters */}
        <div className="flex gap-2 mb-4 items-center">
          <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
            <SelectTrigger className="w-[120px] glass-button border-border h-9 text-sm">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang) => <SelectItem key={lang} value={lang}>{lang}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as "recent" | "popular")}>
            <SelectTrigger className="w-[120px] glass-button border-border h-9 text-sm">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="popular">Most Liked</SelectItem>
              <SelectItem value="commented">Most Commented</SelectItem>
              <SelectItem value="shared">Most Shared</SelectItem>
              <SelectItem value="fans">Most Fans</SelectItem>
            </SelectContent>
          </Select>

          <button
          onClick={() => setShowMyTalents(true)}
          className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center hover:bg-primary/30 transition-colors shrink-0"
          title="My Talents">

            <FolderOpen className="w-4 h-4 text-primary" />
          </button>

          <button
          onClick={() => {setPlaylistTab("playlist");setShowPlaylistModal(true);}}
          className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center hover:bg-primary/30 transition-colors shrink-0 relative"
          title="Playlist & Hidden">

            <ListMusic className="w-4 h-4 text-primary" />
          </button>
        </div>

        {/* Talent Cards - COMPACT */}
        <div className="space-y-2">
          {filteredPosts.length === 0 ?
        <div className="flex flex-col items-center justify-center py-16">
              <Mic className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">No talents yet</p>
              <p className="text-xs text-muted-foreground mt-1">Be the first to share your talent!</p>
            </div> :
        filteredPosts.map((post) => <div key={post.id} className="glass-card p-2.5">
              <div className="flex items-start gap-2.5">
                {/* Avatar - Smaller */}
                <button
                  className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0"
                  onClick={() => setProfilePopupUser({
                    id: post.user_id,
                    name: post.username,
                    avatar: post.avatar,
                    level: 1,
                    isOnline: false,
                    followersCount: 0,
                    followingCount: 0,
                  })}
                >
                  {post.avatar ? <img src={post.avatar} alt={post.username} className="w-full h-full rounded-full object-cover" /> : <span className="text-sm">{post.username[0].toUpperCase()}</span>}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <button
                      className="font-semibold text-foreground text-sm hover:underline"
                      onClick={() => setProfilePopupUser({
                        id: post.user_id,
                        name: post.username,
                        avatar: post.avatar,
                        level: 1,
                        isOnline: false,
                        followersCount: 0,
                        followingCount: 0,
                      })}
                    >
                      {post.username}
                    </button>
                    <span className="text-[9px] text-primary bg-primary/20 px-1.5 py-0.5 rounded-full font-medium">
                      {post.category}
                    </span>
                    <span className="text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                      {post.language}
                    </span>
                    {post.isPrivate && <span className="text-[9px] text-amber-500/90 bg-amber-500/10 px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><Lock className="w-2.5 h-2.5" />Private</span>}
                    {/* 3-dot menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="ml-auto p-1 rounded-full hover:bg-muted transition-colors">
                          <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="min-w-[140px]">
                        <DropdownMenuItem onClick={() => setProfilePopupUser({
                          id: post.user_id,
                          name: post.username,
                          avatar: post.avatar,
                          level: 1,
                          isOnline: false,
                          followersCount: 0,
                          followingCount: 0,
                        })}>
                          <Eye className="w-4 h-4 mr-2" /> View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAddToPlaylist(post.id, post.category)}>
                          {isInPlaylist(post.id) ? <Check className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                          {isInPlaylist(post.id) ? "Saved" : "Save"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleHide(post.id)}>
                          <EyeOff className="w-4 h-4 mr-2" /> Hide
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(post.id, post.username === (profile?.username || "You"))} className="text-destructive focus:text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" /> {post.username === (profile?.username || "You") ? "Delete" : "Remove from feed"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleReport(post.id)}>
                          <Flag className="w-4 h-4 mr-2" /> Report
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1.5 truncate">{post.title}</p>

                  {/* Compact Audio Player */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <button onClick={() => togglePlay(post.id)} className={cn("w-7 h-7 rounded-full flex items-center justify-center transition-all", playingId === post.id ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-muted/80")}>
                      {playingId === post.id ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                    </button>
                    <div className="flex-1 cursor-pointer" onClick={(e) => handleSeek(e, post.id)}>
                      <div className="h-1 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all duration-100" style={{ width: `${audioProgress[post.id] || 0}%` }} />
                      </div>
                    </div>
                    <span className="text-[9px] text-muted-foreground tabular-nums">
                      {playingId === post.id && audioCurrentTime[post.id] != null
                        ? `${Math.floor(audioCurrentTime[post.id] / 60)}:${Math.floor(audioCurrentTime[post.id] % 60).toString().padStart(2, '0')} / `
                        : ""}
                      {audioDuration[post.id] && isFinite(audioDuration[post.id])
                        ? `${Math.floor(audioDuration[post.id] / 60)}:${Math.floor(audioDuration[post.id] % 60).toString().padStart(2, '0')}`
                        : post.duration}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <button onClick={() => toggleLike(post.id)} className="flex items-center gap-1 text-xs">
                      <Heart className={cn("w-3.5 h-3.5 transition-colors", post.isLiked ? "fill-destructive text-destructive" : "text-muted-foreground")} />
                      <span className={post.isLiked ? "text-destructive" : "text-muted-foreground"}>
                        {post.likes}
                      </span>
                    </button>

                    {/* Tip Button */}
                    <button
                  onClick={async () => {
                    if (!profile?.id) return;
                    if ((profile.coins ?? 0) < 5) {
                      toast({ title: "Not enough coins", description: "You need at least 5 coins to tip.", variant: "destructive" });
                      return;
                    }
                    // Find talent creator's user_id
                    const { data: talent } = await supabase.
                    from("talent_uploads").
                    select("user_id").
                    eq("id", post.id).
                    single();
                    if (!talent || talent.user_id === profile.id) {
                      toast({ title: "Can't tip yourself" });
                      return;
                    }
                    const { error } = await supabase.rpc("transfer_coins", {
                      p_sender_id: profile.id,
                      p_receiver_id: talent.user_id,
                      p_amount: 5
                    });
                    if (!error) {
                      toast({ title: `💰 Tipped ${post.username}!`, description: "-5 coins" });
                      if (navigator.vibrate) navigator.vibrate(15);
                    } else {
                      toast({ title: "Tip failed", variant: "destructive" });
                    }
                  }}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-[hsl(45,100%,50%)] transition-colors">

                      <Coins className="w-3.5 h-3.5" />
                      <span>Tip</span>
                    </button>

                    <button onClick={() => setCommentOpenId(commentOpenId === post.id ? null : post.id)} className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MessageCircle className={cn("w-3.5 h-3.5", commentOpenId === post.id && "text-primary")} />
                      <span>{comments[post.id]?.length || 0}</span>
                    </button>

                    <Popover open={sharePickerPostId === post.id} onOpenChange={(open) => setSharePickerPostId(open ? post.id : null)}>
                      <PopoverTrigger asChild>
                        <button className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Share2 className="w-3.5 h-3.5" />
                          <span>{post.shares}</span>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56 p-2" align="center">
                        <button
                      onClick={() => {handleCopyLink(post);setSharePickerPostId(null);}}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-muted/50">

                          <Link className="w-4 h-4 text-muted-foreground" />
                          <span>Copy Public Link</span>
                        </button>
                        <div className="border-t border-border my-1" />
                        <p className="px-3 py-1 text-xs text-muted-foreground font-medium">Send to Friend</p>
                        <ScrollArea className="max-h-40">
                          {shareFriends.map((friend) =>
                      <button
                        key={friend.id}
                        onClick={() => handleShareToFriend(post, friend.name)}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-muted/50">

                              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">
                                {friend.name[0]}
                              </div>
                              <span>{friend.name}</span>
                            </button>
                      )}
                        </ScrollArea>
                      </PopoverContent>
                    </Popover>

                    <button onClick={() => toggleFan(post.id)} className={cn("flex items-center gap-1 text-xs", post.isFan ? "text-primary" : "text-muted-foreground")}>
                      <Star className={cn("w-3.5 h-3.5", post.isFan && "fill-primary")} />
                      <span>{post.isFan ? "Fan" : "Become Fan"}</span>
                    </button>

                  </div>

                  {/* Comment Section */}
                  {commentOpenId === post.id &&
              <div className="mt-2 space-y-1.5">
                      {(comments[post.id] || []).map((c, i) =>
                <div key={i} className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="font-semibold text-foreground">{c.user}</span>
                            <span className="text-muted-foreground flex-1">{c.text}</span>
                            <button
                      onClick={() => setReplyingTo(replyingTo?.postId === post.id && replyingTo?.commentIdx === i ? null : { postId: post.id, commentIdx: i })}
                      className="text-muted-foreground hover:text-primary p-0.5">

                              <Reply className="w-3 h-3" />
                            </button>
                          </div>
                          {/* Replies */}
                          {c.replies.map((r, ri) =>
                  <div key={ri} className="flex gap-1.5 text-xs ml-5 text-muted-foreground">
                              <span className="font-semibold text-foreground">{r.user}</span>
                              <span>{r.text}</span>
                            </div>
                  )}
                          {/* Reply input */}
                          {replyingTo?.postId === post.id && replyingTo?.commentIdx === i &&
                  <div className="flex gap-1.5 ml-5">
                              <MentionInput
                      value={replyText}
                      onChange={setReplyText}
                      placeholder={`Reply to ${c.user}...`}
                      className="h-6 text-xs"
                      autoFocus
                      onKeyDown={(e) => {if (e.key === "Enter" && !e.defaultPrevented) handleSendReply(post.id, i);}}
                      users={mentionUsers} />

                              <Button size="sm" className="h-6 w-6 p-0" onClick={() => handleSendReply(post.id, i)}>
                                <Send className="w-3 h-3" />
                              </Button>
                            </div>
                  }
                        </div>
                )}
                      <div className="flex gap-1.5">
                        <MentionInput
                    value={commentText}
                    onChange={setCommentText}
                    placeholder="Write a comment..."
                    className="h-7 text-xs"
                    onKeyDown={(e) => {if (e.key === "Enter" && !e.defaultPrevented) handleSendComment(post.id);}}
                    users={mentionUsers} />

                        <Button size="sm" className="h-7 w-7 p-0" onClick={() => handleSendComment(post.id)}>
                          <Send className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
              }
                </div>
              </div>
            </div>)}
        </div>

        {filteredPosts.length === 0



      }

        {/* Explore Rooms Button - Footer */}
        <div className="mt-8 pb-4">
          <Button onClick={() => navigate("/rooms")} variant="outline" className="w-full py-6 border-primary/50 text-primary hover:bg-primary/10">
            <Users className="w-5 h-5 mr-2" />
            Explore Rooms
          </Button>
        </div>
      </main>

      {/* Upload Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="glass-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground text-xl">Record Your Talent</DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
              <Mic className="w-10 h-10 text-primary" />
            </div>
            <p className="text-foreground text-lg mb-1">Recording Feature</p>
            <p className="text-muted-foreground text-sm mb-4">Max 2 minutes audio recording</p>
            
            {/* Language Selection - Required */}
            <div className="text-left mb-3">
              <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">
                Language *
              </label>
              <Select value={uploadLanguage} onValueChange={setUploadLanguage}>
                <SelectTrigger className="w-full glass-button border-border">
                  <SelectValue placeholder="Select Language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.filter((l) => l !== "All").map((lang) => <SelectItem key={lang} value={lang.toLowerCase()}>{lang}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Category Selection - Required */}
            <div className="text-left mb-4">
              <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">
                Category *
              </label>
              <Select value={uploadCategory} onValueChange={setUploadCategory}>
                <SelectTrigger className="w-full glass-button border-border">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.filter((c) => c !== "All").map((cat) => <SelectItem key={cat} value={cat.toLowerCase()}>{cat}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Visibility Selection */}
            <div className="text-left mb-4">
              <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">
                Visibility *
              </label>
              <div className="flex gap-2">
                <button
                onClick={() => setUploadVisibility("public")}
                className={cn("flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all border", uploadVisibility === "public" ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border hover:bg-muted/80")}>

                  <Globe className="w-4 h-4" />
                  Public
                </button>
                <button
                onClick={() => setUploadVisibility("private")}
                className={cn("flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all border", uploadVisibility === "private" ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border hover:bg-muted/80")}>

                  <Lock className="w-4 h-4" />
                  Private
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                {uploadVisibility === "public" ? "Everyone can see this talent" : "Only you can see this talent"}
              </p>
            </div>

            {/* Title */}
            <div className="text-left mb-3">
              <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">Title (optional)</label>
              <Input
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="Give your talent a title..."
                maxLength={100}
                className="glass-button border-border"
              />
            </div>

            {/* Recording Controls */}
            {!recordedBlob ? (
              <div className="space-y-3">
                {isRecording ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center animate-pulse">
                      <Mic className="w-8 h-8 text-destructive" />
                    </div>
                    <p className="text-sm font-medium text-foreground">Recording... {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}</p>
                    <p className="text-[10px] text-muted-foreground">Max 2:00</p>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-destructive rounded-full transition-all" style={{ width: `${(recordingTime / 120) * 100}%` }} />
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" size="sm" onClick={cancelTalentRecording}>
                        <X className="w-3.5 h-3.5 mr-1" /> Cancel
                      </Button>
                      <Button size="sm" onClick={stopTalentRecording} className="bg-primary text-primary-foreground">
                        <Pause className="w-3.5 h-3.5 mr-1" /> Stop
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    className="w-full bg-primary text-primary-foreground"
                    disabled={!canRecord}
                    onClick={startTalentRecording}
                  >
                    <Mic className="w-4 h-4 mr-2" />
                    {canRecord ? "Start Recording" : "Select Language & Category"}
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {/* Preview recorded audio */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                  <button onClick={togglePreviewPlay} className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground shrink-0">
                    {isPreviewPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                  </button>
                  <div className="flex-1">
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all duration-100" style={{ width: `${previewProgress}%` }} />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1 tabular-nums">
                      {Math.floor(previewCurrentTime / 60)}:{Math.floor(previewCurrentTime % 60).toString().padStart(2, '0')} / {Math.floor((previewDuration || recordingTime) / 60)}:{Math.floor((previewDuration || recordingTime) % 60).toString().padStart(2, '0')}
                    </p>
                  </div>
                </div>
                {recordedUrl && (
                  <audio
                    ref={previewAudioRef}
                    src={recordedUrl}
                    onLoadedMetadata={() => {
                      const a = previewAudioRef.current;
                      if (a && a.duration && isFinite(a.duration)) setPreviewDuration(a.duration);
                    }}
                    onTimeUpdate={() => {
                      const a = previewAudioRef.current;
                      if (a && a.duration) {
                        setPreviewProgress((a.currentTime / a.duration) * 100);
                        setPreviewCurrentTime(a.currentTime);
                      }
                    }}
                    onEnded={() => { setIsPreviewPlaying(false); setPreviewProgress(0); setPreviewCurrentTime(0); }}
                    className="hidden"
                  />
                )}
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={cancelTalentRecording}>
                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Discard
                  </Button>
                  <Button className="flex-1 bg-primary text-primary-foreground" onClick={handleUploadTalent} disabled={uploading}>
                    <Upload className="w-3.5 h-3.5 mr-1" />
                    {uploading ? "Uploading..." : "Save & Upload"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* My Talents Modal */}
      <Dialog open={showMyTalents} onOpenChange={setShowMyTalents}>
        <DialogContent className="glass-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground text-lg flex items-center gap-2">
              My Talents
              <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {posts.filter((p) => p.username === (profile?.username || "You")).length} total
              </span>
            </DialogTitle>
            {/* Counts row */}
            <div className="flex gap-2 mt-1">
              <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                <Globe className="w-2.5 h-2.5 inline mr-0.5" />
                {posts.filter((p) => p.username === (profile?.username || "You") && !p.isPrivate).length} Public
              </span>
              <span className="text-[10px] text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                <Lock className="w-2.5 h-2.5 inline mr-0.5" />
                {posts.filter((p) => p.username === (profile?.username || "You") && p.isPrivate).length} Private
              </span>
            </div>
          </DialogHeader>
          <div className="space-y-3">
            {/* Visibility filter */}
            <div className="flex gap-2 pb-1">
              {(["all", "public", "private"] as const).map((v) =>
            <button
              key={v}
              onClick={() => setMyTalentVisibility(v)}
              className={cn("flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all", myTalentVisibility === v ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80")}>

                  {v === "private" && <Lock className="w-3 h-3" />}
                  {v === "public" && <Globe className="w-3 h-3" />}
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
            )}
            </div>
            {/* Category filter */}
            <div className="flex gap-2 flex-wrap pb-1">
              {categories.map((cat) =>
            <button
              key={cat}
              onClick={() => setMyTalentFilter(cat)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                myTalentFilter === cat ?
                "bg-primary text-primary-foreground" :
                "bg-muted text-muted-foreground hover:bg-muted/80"
              )}>

                  {cat}
                </button>
            )}
            </div>
            {/* Talent list */}
            <ScrollArea className="max-h-[50vh]">
              <div className="space-y-2">
                {posts.
              filter((p) => p.username === (profile?.username || "You")).
              filter((p) => myTalentFilter === "All" || p.category === myTalentFilter).
              filter((p) => myTalentVisibility === "all" || (myTalentVisibility === "public" ? !p.isPrivate : p.isPrivate)).
              length === 0 ?
              <div className="text-center py-8">
                    <Mic className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No talents found</p>
                    <p className="text-xs text-muted-foreground mt-1">Upload your first talent to see it here!</p>
                  </div> :

              posts.
              filter((p) => p.username === (profile?.username || "You")).
              filter((p) => myTalentFilter === "All" || p.category === myTalentFilter).
              filter((p) => myTalentVisibility === "all" || (myTalentVisibility === "public" ? !p.isPrivate : p.isPrivate)).
              map((post) =>
              <button
                key={post.id}
                onClick={() => {setShowMyTalents(false);navigate(`/talent?id=${post.id}`);}}
                className="w-full flex items-center gap-3 p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-left">

                        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                          <Mic className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <p className="text-sm font-medium text-foreground truncate">{post.title}</p>
                            {post.isPrivate && <Lock className="w-3 h-3 text-muted-foreground shrink-0" />}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-primary bg-primary/20 px-1.5 py-0.5 rounded-full">{post.category}</span>
                            <span className="text-[10px] text-muted-foreground">{post.language}</span>
                            {post.isPrivate && <span className="text-[10px] text-amber-500/90 bg-amber-500/10 px-1.5 py-0.5 rounded-full flex items-center gap-0.5"><Lock className="w-2.5 h-2.5" />Private</span>}
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                              <Heart className="w-2.5 h-2.5" /> {post.likes}
                            </span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                              <Play className="w-2.5 h-2.5" /> {post.plays}
                            </span>
                          </div>
                        </div>
                        <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="text-xs text-muted-foreground">{post.duration}</span>
                      </button>
              )
              }
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Playlist & Hidden Modal */}
      <Dialog open={showPlaylistModal} onOpenChange={setShowPlaylistModal}>
        <DialogContent className="glass-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground text-lg flex items-center gap-2">
              <ListMusic className="w-5 h-5 text-primary" />
              My Collection
              <span className="ml-auto text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {totalPlaylistCount + hiddenPosts.length} total
              </span>
            </DialogTitle>
          </DialogHeader>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-muted rounded-lg mb-3">
            <button
            onClick={() => setPlaylistTab("playlist")}
            className={cn("flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all", playlistTab === "playlist" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>

              Playlist ({totalPlaylistCount})
            </button>
            <button
            onClick={() => setPlaylistTab("hidden")}
            className={cn("flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all", playlistTab === "hidden" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>

              Hidden ({hiddenPosts.length})
            </button>
          </div>

          {playlistTab === "playlist" &&
        <>
              {/* Category filter */}
              <div className="flex gap-2 flex-wrap pb-1">
                {["All", ...Object.keys(playlist)].filter((v, i, a) => a.indexOf(v) === i).map((cat) =>
            <button
              key={cat}
              onClick={() => setPlaylistFilter(cat)}
              className={cn("px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all", playlistFilter === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80")}>

                    {cat} {cat !== "All" && `(${playlist[cat]?.size || 0})`}
                  </button>
            )}
              </div>
              {/* Language filter */}
              <Select value={playlistLangFilter} onValueChange={setPlaylistLangFilter}>
                <SelectTrigger className="w-full h-8 text-xs border-border bg-muted/50">
                  <SelectValue placeholder="Filter by language" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-[200]">
                  {["All", ...languages.filter((l) => l !== "All")].map((lang) =>
              <SelectItem key={lang} value={lang}>{lang === "All" ? "All Languages" : lang}</SelectItem>
              )}
                </SelectContent>
              </Select>
              <ScrollArea className="max-h-[45vh]">
                <div className="space-y-2">
                  {getPlaylistPosts().
              filter((p) => playlistFilter === "All" || playlist[playlistFilter]?.has(p.id)).
              filter((p) => playlistLangFilter === "All" || p.language === playlistLangFilter).
              length === 0 ?
              <div className="text-center py-8">
                      <ListMusic className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No saved talents</p>
                      <p className="text-xs text-muted-foreground mt-1">Tap + on talents to save them here</p>
                    </div> :

              getPlaylistPosts().
              filter((p) => playlistFilter === "All" || playlist[playlistFilter]?.has(p.id)).
              filter((p) => playlistLangFilter === "All" || p.language === playlistLangFilter).
              map((post) =>
              <div key={post.id} className="rounded-xl bg-muted/50 p-3 space-y-2">
                        {/* Header */}
                        <div className="flex items-start gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                            <span className="text-sm font-semibold">{post.username[0].toUpperCase()}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-foreground text-sm">{post.username}</span>
                              <span className="text-[9px] text-primary bg-primary/20 px-1.5 py-0.5 rounded-full font-medium">{post.category}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{post.title}</p>
                          </div>
                        </div>
                        {/* Play bar + action */}
                        <div className="flex items-center gap-1">
                          <button onClick={() => togglePlay(post.id)} className={cn("w-6 h-6 rounded-full flex items-center justify-center transition-all shrink-0", playingId === post.id ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-muted/80")}>
                            {playingId === post.id ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
                          </button>
                          <div className="flex-1 h-0.5 bg-border rounded-full overflow-hidden cursor-pointer" onClick={(e) => handleSeek(e, post.id)}>
                            <div className="h-full bg-primary rounded-full transition-all duration-100" style={{ width: `${audioProgress[post.id] || 0}%` }} />
                          </div>
                          <span className="text-[8px] text-muted-foreground shrink-0 tabular-nums">
                            {playingId === post.id && audioCurrentTime[post.id] != null
                              ? `${Math.floor(audioCurrentTime[post.id] / 60)}:${Math.floor(audioCurrentTime[post.id] % 60).toString().padStart(2, '0')} / `
                              : ""}
                            {audioDuration[post.id] && isFinite(audioDuration[post.id])
                              ? `${Math.floor(audioDuration[post.id] / 60)}:${Math.floor(audioDuration[post.id] % 60).toString().padStart(2, '0')}`
                              : post.duration}
                          </span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-0.5 rounded-full hover:bg-muted transition-colors shrink-0">
                                <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="min-w-[140px] bg-popover border-border z-[200]">
                              <DropdownMenuItem onClick={() => handleHide(post.id)}>
                                <EyeOff className="w-4 h-4 mr-2" /> Hide
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleRemoveFromPlaylist(post.id, post.category)}>
                                <X className="w-4 h-4 mr-2" /> Remove
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(post.id, post.username === (profile?.username || "You"))} className="text-destructive focus:text-destructive">
                                <Trash2 className="w-4 h-4 mr-2" /> {post.username === (profile?.username || "You") ? "Delete" : "Remove from feed"}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleReport(post.id)}>
                                <Flag className="w-4 h-4 mr-2" /> Report
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        {/* Actions row */}
                        <div className="flex items-center justify-around pt-2 border-t border-border">
                          <button onClick={() => toggleLike(post.id)} className="flex flex-col items-center gap-0.5">
                            <Heart className={cn("w-4 h-4", post.isLiked ? "fill-destructive text-destructive" : "text-muted-foreground")} />
                            <span className={cn("text-[9px]", post.isLiked ? "text-destructive" : "text-muted-foreground")}>{post.likes}</span>
                          </button>
                          <button className="flex flex-col items-center gap-0.5">
                            <ThumbsDown className="w-4 h-4 text-muted-foreground" />
                            <span className="text-[9px] text-muted-foreground">Dislike</span>
                          </button>
                          <button onClick={() => handleCopyLink(post)} className="flex flex-col items-center gap-0.5">
                            <Share2 className="w-4 h-4 text-muted-foreground" />
                            <span className="text-[9px] text-muted-foreground">{post.shares}</span>
                          </button>
                          <button onClick={() => toggleFan(post.id)} className="flex flex-col items-center gap-0.5">
                            <Star className={cn("w-4 h-4", post.isFan ? "fill-primary text-primary" : "text-muted-foreground")} />
                            <span className={cn("text-[9px]", post.isFan ? "text-primary" : "text-muted-foreground")}>{post.isFan ? "Fan" : "Be Fan"}</span>
                          </button>
                        </div>
                      </div>
              )
              }
                </div>
              </ScrollArea>
            </>
        }

          {playlistTab === "hidden" &&
        <ScrollArea className="max-h-[50vh]">
              <div className="space-y-2">
                {hiddenPosts.length === 0 ?
            <div className="text-center py-8">
                    <Eye className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No hidden talents</p>
                    <p className="text-xs text-muted-foreground mt-1">Talents you hide will appear here</p>
                  </div> :

            hiddenPosts.map((post) =>
            <div key={post.id} className="rounded-xl bg-muted/50 p-3 space-y-2">
                      {/* Header */}
                      <div className="flex items-start gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <span className="text-sm font-semibold">{post.username[0].toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-foreground text-sm">{post.username}</span>
                            <span className="text-[9px] text-primary bg-primary/20 px-1.5 py-0.5 rounded-full font-medium">{post.category}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{post.title}</p>
                        </div>
                      </div>
                      {/* Play bar + action */}
                      <div className="flex items-center gap-1">
                        <button onClick={() => togglePlay(post.id)} className={cn("w-6 h-6 rounded-full flex items-center justify-center transition-all shrink-0", playingId === post.id ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-muted/80")}>
                          {playingId === post.id ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
                        </button>
                        <div className="flex-1 h-0.5 bg-border rounded-full overflow-hidden cursor-pointer" onClick={(e) => handleSeek(e, post.id)}>
                          <div className="h-full bg-primary rounded-full transition-all duration-100" style={{ width: `${audioProgress[post.id] || 0}%` }} />
                        </div>
                        <span className="text-[8px] text-muted-foreground shrink-0 tabular-nums">
                          {playingId === post.id && audioCurrentTime[post.id] != null
                            ? `${Math.floor(audioCurrentTime[post.id] / 60)}:${Math.floor(audioCurrentTime[post.id] % 60).toString().padStart(2, '0')} / `
                            : ""}
                          {audioDuration[post.id] && isFinite(audioDuration[post.id])
                            ? `${Math.floor(audioDuration[post.id] / 60)}:${Math.floor(audioDuration[post.id] % 60).toString().padStart(2, '0')}`
                            : post.duration}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-0.5 rounded-full hover:bg-muted transition-colors shrink-0">
                              <MoreVertical className="w-3.5 h-3.5 text-muted-foreground" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="min-w-[130px] bg-popover border-border z-[200]">
                            <DropdownMenuItem onClick={() => handleUnhide(post.id)}>
                              <Eye className="w-4 h-4 mr-2" /> Unhide
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {handleUnhide(post.id);handleAddToPlaylist(post.id, post.category);}}>
                              <Plus className="w-4 h-4 mr-2" /> Save
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteHidden(post.id)} className="text-destructive focus:text-destructive">
                              <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleReport(post.id)}>
                              <Flag className="w-4 h-4 mr-2" /> Report
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      {/* Actions row */}
                      <div className="flex items-center justify-around pt-2 border-t border-border">
                        <button onClick={() => toggleLike(post.id)} className="flex flex-col items-center gap-0.5">
                          <Heart className={cn("w-4 h-4", post.isLiked ? "fill-destructive text-destructive" : "text-muted-foreground")} />
                          <span className={cn("text-[9px]", post.isLiked ? "text-destructive" : "text-muted-foreground")}>{post.likes}</span>
                        </button>
                        <button className="flex flex-col items-center gap-0.5">
                          <ThumbsDown className="w-4 h-4 text-muted-foreground" />
                          <span className="text-[9px] text-muted-foreground">Dislike</span>
                        </button>
                        <button onClick={() => handleCopyLink(post)} className="flex flex-col items-center gap-0.5">
                          <Share2 className="w-4 h-4 text-muted-foreground" />
                          <span className="text-[9px] text-muted-foreground">{post.shares}</span>
                        </button>
                        <button onClick={() => toggleFan(post.id)} className="flex flex-col items-center gap-0.5">
                          <Star className={cn("w-4 h-4", post.isFan ? "fill-primary text-primary" : "text-muted-foreground")} />
                          <span className={cn("text-[9px]", post.isFan ? "text-primary" : "text-muted-foreground")}>{post.isFan ? "Fan" : "Be Fan"}</span>
                        </button>
                      </div>
                    </div>
            )
            }
              </div>
            </ScrollArea>
        }
        </DialogContent>
      </Dialog>

      {/* Talent Preview Popup */}
      {(() => {
      const previewPost = posts.find((p) => p.id === previewPostId);
      if (!previewPost) return null;
      return (
        <Dialog open={!!previewPostId} onOpenChange={(open) => {if (!open) setPreviewPostId(null);}}>
            <DialogContent className="glass-card border-border max-w-xs p-4">
              <div className="flex items-start gap-3 pr-6">
                <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <span className="text-base font-semibold">{previewPost.username[0].toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-foreground text-sm">{previewPost.username}</span>
                    <span className="text-[9px] text-primary bg-primary/20 px-1.5 py-0.5 rounded-full font-medium">{previewPost.category}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{previewPost.title}</p>
                </div>
              </div>

              {/* Audio Player + Action Menu */}
              <div className="flex items-center gap-1 mt-2">
                <button onClick={() => togglePlay(previewPost.id)} className={cn("w-6 h-6 rounded-full flex items-center justify-center transition-all shrink-0", playingId === previewPost.id ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-muted/80")}>
                  {playingId === previewPost.id ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
                </button>
                <div className="flex-1 h-0.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all duration-100" style={{ width: `${audioProgress[previewPost.id] || 0}%` }} />
                </div>
                <span className="text-[8px] text-muted-foreground shrink-0 tabular-nums">
                  {playingId === previewPost.id && audioCurrentTime[previewPost.id] != null
                    ? `${Math.floor(audioCurrentTime[previewPost.id] / 60)}:${Math.floor(audioCurrentTime[previewPost.id] % 60).toString().padStart(2, '0')} / `
                    : ""}
                  {audioDuration[previewPost.id] && isFinite(audioDuration[previewPost.id])
                    ? `${Math.floor(audioDuration[previewPost.id] / 60)}:${Math.floor(audioDuration[previewPost.id] % 60).toString().padStart(2, '0')}`
                    : previewPost.duration}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1 rounded-full hover:bg-muted transition-colors shrink-0">
                      <MoreVertical className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-[140px] bg-popover border-border z-[200]">
                    {hiddenIds.has(previewPost.id) ?
                  <DropdownMenuItem onClick={() => handleUnhide(previewPost.id)}>
                        <Eye className="w-4 h-4 mr-2" /> Unhide
                      </DropdownMenuItem> :

                  <DropdownMenuItem onClick={() => handleHide(previewPost.id)}>
                        <EyeOff className="w-4 h-4 mr-2" /> Hide
                      </DropdownMenuItem>
                  }
                    <DropdownMenuItem onClick={() => {handleRemoveFromPlaylist(previewPost.id, previewPost.category);setPreviewPostId(null);}}>
                      <X className="w-4 h-4 mr-2" /> Remove
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {handleDelete(previewPost.id, previewPost.username === (profile?.username || "You"));setPreviewPostId(null);}} className="text-destructive focus:text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" /> {previewPost.username === (profile?.username || "You") ? "Delete" : "Remove from feed"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleReport(previewPost.id)}>
                      <Flag className="w-4 h-4 mr-2" /> Report
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Actions Row */}
              <div className="flex items-center justify-around mt-3 pt-3 border-t border-border">
                <button onClick={() => toggleLike(previewPost.id)} className="flex flex-col items-center gap-1">
                  <Heart className={cn("w-5 h-5 transition-colors", previewPost.isLiked ? "fill-destructive text-destructive" : "text-muted-foreground")} />
                  <span className={cn("text-[10px]", previewPost.isLiked ? "text-destructive" : "text-muted-foreground")}>{previewPost.likes}</span>
                </button>
                <button className="flex flex-col items-center gap-1">
                  <ThumbsDown className="w-5 h-5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">Dislike</span>
                </button>
                <button onClick={() => {handleCopyLink(previewPost);}} className="flex flex-col items-center gap-1">
                  <Share2 className="w-5 h-5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">{previewPost.shares}</span>
                </button>
                <button onClick={() => toggleFan(previewPost.id)} className="flex flex-col items-center gap-1">
                  <Star className={cn("w-5 h-5", previewPost.isFan ? "fill-primary text-primary" : "text-muted-foreground")} />
                  <span className={cn("text-[10px]", previewPost.isFan ? "text-primary" : "text-muted-foreground")}>{previewPost.isFan ? "Fan" : "Be Fan"}</span>
                </button>
              </div>
            </DialogContent>
          </Dialog>);

    })()}

      <BottomNav />

      {profilePopupUser && (
        <UserProfilePopup
          open={!!profilePopupUser}
          onOpenChange={(open) => !open && setProfilePopupUser(null)}
          user={profilePopupUser}
          myName={profile?.username || "You"}
        />
      )}
    </div>;
}
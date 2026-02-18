import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Plus, Lock, Globe, Copy, Check, Crown, ArrowLeft } from "lucide-react";
import { BottomNav } from "@/components/layout/BottomNav";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Room {
  id: string;
  room_code: string;
  title: string;
  is_private: boolean;
  host_id: string;
  host_username?: string;
  host_avatar?: string | null;
  max_members: number;
  member_count?: number;
}

// Mock data for demo
const generateRoomCode = (): string => {
  return String(Math.floor(10000000 + Math.random() * 90000000));
};

export default function Rooms() {
  const { profile } = useProfile();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [roomTitle, setRoomTitle] = useState("");
  const [roomType, setRoomType] = useState<"public" | "private">("public");
  const [roomLanguage, setRoomLanguage] = useState("English");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loadingRooms, setLoadingRooms] = useState(true);

  const isPremium = profile?.is_premium || false;

  // Fetch rooms from DB
  useEffect(() => {
    const fetchRooms = async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching rooms:", error);
        setLoadingRooms(false);
        return;
      }

      if (data && data.length > 0) {
        // Fetch host profiles
        const hostIds = [...new Set(data.map((r) => r.host_id))];
        const { data: hostProfiles } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .in("id", hostIds);
        const hostMap = new Map(hostProfiles?.map((p) => [p.id, p]) ?? []);

        // Fetch member counts
        const roomIds = data.map((r) => r.id);
        const { data: members } = await supabase
          .from("room_members")
          .select("room_id")
          .in("room_id", roomIds);

        const countMap = new Map<string, number>();
        members?.forEach((m) => {
          countMap.set(m.room_id, (countMap.get(m.room_id) ?? 0) + 1);
        });

        setRooms(
          data.map((r) => ({
            ...r,
            host_username: hostMap.get(r.host_id)?.username ?? "Unknown",
            host_avatar: hostMap.get(r.host_id)?.avatar_url ?? null,
            member_count: countMap.get(r.id) ?? 0,
          }))
        );
      }

      setLoadingRooms(false);
    };

    fetchRooms();
  }, []);

  const handleCreateRoom = async () => {
    if (!roomTitle.trim()) {
      toast({ title: "Error", description: "Please enter a room title" });
      return;
    }
    if (!user) return;

    if (roomType === "private" && !isPremium) {
      toast({ title: "Premium Required", description: "Private rooms are available for Premium users only" });
      return;
    }

    const newCode = generateRoomCode();

    // Insert room
    const { data: newRoom, error } = await supabase
      .from("rooms")
      .insert({
        room_code: newCode,
        title: roomTitle.trim(),
        is_private: roomType === "private",
        language: roomLanguage,
        host_id: user.id,
      })
      .select()
      .single();

    if (error || !newRoom) {
      toast({ title: "Error", description: "Failed to create room" });
      return;
    }

    // Auto-join as member
    await supabase.from("room_members").insert({ room_id: newRoom.id, user_id: user.id });

    navigator.clipboard.writeText(newCode);
    toast({ title: "Room Created!", description: `Room ID: ${newCode} (copied). Share to invite others.` });

    setShowCreateModal(false);
    setRoomTitle("");
    setRoomType("public");
    setRoomLanguage("English");

    // Navigate to discussion
    navigate(`/room/${newCode}`);
  };

  const handleJoinRoom = async () => {
    if (!joinRoomId.trim() || !user) {
      toast({ title: "Error", description: "Please enter a Room ID" });
      return;
    }

    const { data: room, error } = await supabase
      .from("rooms")
      .select("*")
      .eq("room_code", joinRoomId.trim())
      .single();

    if (error || !room) {
      toast({ title: "Not Found", description: "No room found with that ID" });
      return;
    }

    // Join as member (upsert to avoid duplicate)
    await supabase.from("room_members").upsert({ room_id: room.id, user_id: user.id }, { onConflict: "room_id,user_id" });

    setShowJoinModal(false);
    setJoinRoomId("");
    navigate(`/room/${room.room_code}`);
  };

  const handleCopyRoomId = (roomCode: string) => {
    navigator.clipboard.writeText(roomCode);
    setCopiedId(roomCode);
    toast({ title: "Copied!", description: "Room ID copied to clipboard" });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleEnterRoom = async (room: Room) => {
    if (room.is_private && !isPremium) {
      toast({ title: "Premium Required", description: "Private rooms are available for Premium users only" });
      return;
    }
    if (!user) return;

    // Join as member
    await supabase.from("room_members").upsert({ room_id: room.id, user_id: user.id }, { onConflict: "room_id,user_id" });
    navigate(`/room/${room.room_code}`);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader
        streakDays={profile?.streak_count ?? 1}
        level={profile?.level ?? 1}
        showLogout
      />

      <main className="px-4 pt-4">
        {/* Back Button */}
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-full hover:bg-muted transition-colors mb-2">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>

        {/* Page Title */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Rooms</h1>
              <p className="text-sm text-muted-foreground">Join group discussions</p>
            </div>
          </div>
          <div className="flex gap-1.5">
            <Button
              onClick={() => setShowJoinModal(true)}
              variant="outline"
              size="sm"
              className="border-primary/50 text-primary text-xs h-8 px-2.5"
            >
              Join by ID
            </Button>
            <Button
              onClick={() => setShowCreateModal(true)}
              size="sm"
              className="bg-primary text-primary-foreground text-xs h-8 px-2.5"
            >
              <Plus className="w-3.5 h-3.5 mr-0.5" />
              Create
            </Button>
          </div>
        </div>

        {/* Room Type Tabs & Language Filter */}
        <div className="flex gap-2 mb-6">
          <button className="py-1.5 px-3 rounded-lg bg-primary/20 text-primary font-medium text-xs flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5" />
            Public
          </button>
          <button 
            className={cn(
              "py-1.5 px-3 rounded-lg font-medium text-xs glass-button flex items-center gap-1.5",
              !isPremium && "opacity-60"
            )}
          >
            <Lock className="w-3.5 h-3.5" />
            Private
            {!isPremium && <Crown className="w-3 h-3 text-[hsl(var(--ef-streak))]" />}
          </button>
          
          {/* Language Filter */}
          <Select defaultValue="All">
            <SelectTrigger className="flex-1 glass-button border-border h-8 text-xs">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Languages</SelectItem>
              <SelectItem value="English">English</SelectItem>
              <SelectItem value="Hindi">Hindi</SelectItem>
              <SelectItem value="Telugu">Telugu</SelectItem>
              <SelectItem value="Kannada">Kannada</SelectItem>
              <SelectItem value="Tamil">Tamil</SelectItem>
              <SelectItem value="Malayalam">Malayalam</SelectItem>
              <SelectItem value="Bengali">Bengali</SelectItem>
              <SelectItem value="Marathi">Marathi</SelectItem>
              <SelectItem value="Gujarati">Gujarati</SelectItem>
              <SelectItem value="Punjabi">Punjabi</SelectItem>
              <SelectItem value="Odia">Odia</SelectItem>
              <SelectItem value="Urdu">Urdu</SelectItem>
              <SelectItem value="Arabic">Arabic</SelectItem>
              <SelectItem value="Spanish">Spanish</SelectItem>
              <SelectItem value="French">French</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Active Rooms List */}
        <div className="space-y-3">
          {rooms.map((room) => (
            <div 
              key={room.id} 
              className={cn(
                "glass-card p-4 transition-all",
                room.is_private && !isPremium && "opacity-60"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {room.is_private ? (
                    <Lock className="w-4 h-4 text-[hsl(var(--ef-streak))]" />
                  ) : (
                    <Globe className="w-4 h-4 text-primary" />
                  )}
                  <h3 className="font-semibold text-foreground">{room.title}</h3>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Users className="w-3.5 h-3.5" />
                  <span>{room.member_count ?? 0}/{room.max_members}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                    {room.host_avatar ? (
                      <img src={room.host_avatar} alt={room.host_username} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-xs">{(room.host_username ?? "U")[0]}</span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">Host: {room.host_username ?? "Unknown"}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyRoomId(room.room_code)}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                    title="Copy Room ID"
                  >
                    {copiedId === room.room_code ? (
                      <Check className="w-4 h-4 text-primary" />
                    ) : (
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                  <Button
                    onClick={() => handleEnterRoom(room)}
                    size="sm"
                    className={cn(
                      "h-8",
                      room.is_private && !isPremium 
                        ? "bg-muted text-muted-foreground" 
                        : "bg-primary text-primary-foreground"
                    )}
                    disabled={(room.member_count ?? 0) >= room.max_members}
                  >
                    {(room.member_count ?? 0) >= room.max_members ? "Full" : "Enter"}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {rooms.length === 0 && (
          <div className="text-center py-16">
            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No active rooms</p>
            <p className="text-sm text-muted-foreground">Be the first to create one!</p>
          </div>
        )}
      </main>

      {/* Create Room Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="glass-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground text-xl">Create a Room</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Room Title</label>
              <Input
                value={roomTitle}
                onChange={(e) => setRoomTitle(e.target.value)}
                placeholder="Enter room title..."
                className="glass-button border-border"
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Language</label>
              <Select value={roomLanguage} onValueChange={setRoomLanguage}>
                <SelectTrigger className="glass-button border-border">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Hindi">Hindi</SelectItem>
                  <SelectItem value="Telugu">Telugu</SelectItem>
                  <SelectItem value="Kannada">Kannada</SelectItem>
                  <SelectItem value="Tamil">Tamil</SelectItem>
                  <SelectItem value="Malayalam">Malayalam</SelectItem>
                  <SelectItem value="Bengali">Bengali</SelectItem>
                  <SelectItem value="Marathi">Marathi</SelectItem>
                  <SelectItem value="Gujarati">Gujarati</SelectItem>
                  <SelectItem value="Punjabi">Punjabi</SelectItem>
                  <SelectItem value="Arabic">Arabic</SelectItem>
                  <SelectItem value="Spanish">Spanish</SelectItem>
                  <SelectItem value="French">French</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Room Type</label>
              <Select value={roomType} onValueChange={(v) => setRoomType(v as "public" | "private")}>
                <SelectTrigger className="glass-button border-border">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      <span>Public - Open to everyone</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="private" disabled={!isPremium}>
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      <span>Private - Invite only</span>
                      {!isPremium && <Crown className="w-3 h-3 text-[hsl(var(--ef-streak))]" />}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {!isPremium && (
                <p className="text-xs text-[hsl(var(--ef-streak))] mt-2">
                  Private rooms require Premium membership
                </p>
              )}
            </div>

            <Button 
              onClick={handleCreateRoom}
              className="w-full bg-primary text-primary-foreground"
            >
              Create Room
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Join Room Modal */}
      <Dialog open={showJoinModal} onOpenChange={setShowJoinModal}>
        <DialogContent className="glass-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground text-xl">Join a Room</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Room ID or User ID</label>
              <Input
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
                placeholder="Enter Room ID or User ID..."
                className="glass-button border-border"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Enter an 8-digit Room ID (e.g., 48291037) or a User ID to join their room
              </p>
            </div>

            <Button 
              onClick={handleJoinRoom}
              className="w-full bg-primary text-primary-foreground"
            >
              Join Room
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}

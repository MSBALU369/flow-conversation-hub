import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Mic, DoorOpen, Eye, EyeOff, Trash2, Search,
  Loader2, CheckCircle2, Play, Pause, Square,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type EntityType = "talents" | "rooms";

interface TalentRow {
  id: string;
  title: string | null;
  user_id: string;
  language: string;
  created_at: string;
  is_private: boolean;
  audio_url: string;
  duration_sec: number | null;
}

interface RoomRow {
  id: string;
  title: string;
  host_id: string;
  language: string;
  created_at: string;
  is_private: boolean;
}

export function GlobalControlsPanel() {
  const { toast } = useToast();
  const [activeEntity, setActiveEntity] = useState<EntityType>("talents");
  const [talents, setTalents] = useState<TalentRow[]>([]);
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    action: string;
    entityType: EntityType;
    entityId: string;
    entityName: string;
  }>({ open: false, action: "", entityType: "talents", entityId: "", entityName: "" });

  const fetchEntities = async () => {
    setLoading(true);
    const [talentsRes, roomsRes] = await Promise.all([
      supabase.from("talent_uploads").select("id, title, user_id, language, created_at, is_private, audio_url, duration_sec").order("created_at", { ascending: false }).limit(200),
      supabase.from("rooms").select("id, title, host_id, language, created_at, is_private").order("created_at", { ascending: false }).limit(200),
    ]);
    setTalents((talentsRes.data as TalentRow[]) || []);
    setRooms((roomsRes.data as RoomRow[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchEntities(); }, []);

  // Audio player
  const playTalent = (talent: TalentRow) => {
    if (playingId === talent.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(talent.audio_url);
    audio.onended = () => setPlayingId(null);
    audio.play();
    audioRef.current = audio;
    setPlayingId(talent.id);
  };

  const stopAudio = () => {
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.currentTime = 0;
    setPlayingId(null);
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => { audioRef.current?.pause(); };
  }, []);

  const handleDeleteTalent = async (id: string) => {
    setActionLoading(id);
    stopAudio();
    const { error } = await supabase.from("talent_uploads").delete().eq("id", id);
    if (error) {
      toast({ title: "❌ Delete Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "✅ Talent Permanently Deleted" });
      setTalents(prev => prev.filter(t => t.id !== id));
    }
    setActionLoading(null);
  };

  const handleToggleTalentVisibility = async (id: string, currentPrivate: boolean) => {
    setActionLoading(id);
    const { error } = await supabase.from("talent_uploads").update({ is_private: !currentPrivate }).eq("id", id);
    if (error) {
      toast({ title: "❌ Update Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: currentPrivate ? "👁 Talent Made Public" : "🙈 Talent Hidden" });
      setTalents(prev => prev.map(t => t.id === id ? { ...t, is_private: !currentPrivate } : t));
    }
    setActionLoading(null);
  };

  const handleDeleteRoom = async (id: string) => {
    setActionLoading(id);
    await supabase.from("room_messages").delete().eq("room_id", id);
    await supabase.from("room_members").delete().eq("room_id", id);
    const { error } = await supabase.from("rooms").delete().eq("id", id);
    if (error) {
      toast({ title: "❌ Delete Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "✅ Room Permanently Deleted" });
      setRooms(prev => prev.filter(r => r.id !== id));
    }
    setActionLoading(null);
  };

  const handleToggleRoomVisibility = async (id: string, currentPrivate: boolean) => {
    setActionLoading(id);
    const { error } = await supabase.from("rooms").update({ is_private: !currentPrivate }).eq("id", id);
    if (error) {
      toast({ title: "❌ Update Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: currentPrivate ? "👁 Room Made Public" : "🔒 Room Made Private" });
      setRooms(prev => prev.map(r => r.id === id ? { ...r, is_private: !currentPrivate } : r));
    }
    setActionLoading(null);
  };

  const confirmAction = () => {
    const { action, entityType, entityId } = confirmModal;
    if (entityType === "talents") {
      if (action === "delete") handleDeleteTalent(entityId);
      else if (action === "hide") {
        const talent = talents.find(t => t.id === entityId);
        if (talent) handleToggleTalentVisibility(entityId, talent.is_private);
      }
    } else {
      if (action === "delete") handleDeleteRoom(entityId);
      else if (action === "hide") {
        const room = rooms.find(r => r.id === entityId);
        if (room) handleToggleRoomVisibility(entityId, room.is_private);
      }
    }
    setConfirmModal({ ...confirmModal, open: false });
  };

  const q = search.toLowerCase();
  const filteredTalents = talents.filter(t =>
    (t.title || "").toLowerCase().includes(q) || t.language.toLowerCase().includes(q)
  );
  const filteredRooms = rooms.filter(r =>
    r.title.toLowerCase().includes(q) || r.language.toLowerCase().includes(q)
  );

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold flex items-center gap-1.5">
        <Eye className="w-4 h-4 text-primary" /> Global Entity Controls
      </h3>
      <p className="text-[10px] text-muted-foreground">
        Listen, Hide, or Delete any Talent or Room permanently from the database.
      </p>

      {/* Entity Tabs */}
      <div className="flex gap-2">
        {[
          { key: "talents" as EntityType, label: "Talents", icon: Mic, count: talents.length },
          { key: "rooms" as EntityType, label: "Rooms", icon: DoorOpen, count: rooms.length },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => { setActiveEntity(tab.key); stopAudio(); }}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 p-2.5 rounded-lg border transition-all text-xs font-medium",
              activeEntity === tab.key
                ? "bg-primary/10 border-primary/30 text-primary"
                : "bg-muted/30 border-border text-muted-foreground hover:bg-muted/50"
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input
          placeholder="Search by title or language..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 h-8 text-xs bg-muted/50 border-border"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-2 max-h-[40vh] overflow-y-auto">
          {activeEntity === "talents" ? (
            filteredTalents.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle2 className="w-6 h-6 text-primary/40 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">No talents found</p>
              </div>
            ) : (
              filteredTalents.map(t => (
                <Card key={t.id} className="overflow-hidden">
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Mic className="w-3 h-3 text-muted-foreground shrink-0" />
                          <span className="text-xs font-medium truncate">{t.title || "Untitled"}</span>
                          {t.is_private && (
                            <Badge variant="outline" className="text-[8px] px-1 py-0 h-4">Hidden</Badge>
                          )}
                        </div>
                        <p className="text-[9px] text-muted-foreground">
                          {t.language} • {new Date(t.created_at).toLocaleDateString()}
                          {t.duration_sec ? ` • ${t.duration_sec}s` : ""}
                        </p>
                      </div>
                    </div>
                    {/* Actions row: Play, Hide, Delete */}
                    <div className="flex gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn("h-7 text-[9px] flex-1 gap-1", playingId === t.id && "bg-primary/10 text-primary border-primary/30")}
                        onClick={() => playTalent(t)}
                        disabled={actionLoading === t.id}
                      >
                        {playingId === t.id ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                        {playingId === t.id ? "Pause" : "Listen"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[9px] flex-1 gap-1"
                        title={t.is_private ? "Make Public" : "Hide"}
                        disabled={actionLoading === t.id}
                        onClick={() => setConfirmModal({
                          open: true, action: "hide", entityType: "talents",
                          entityId: t.id, entityName: t.title || "Untitled",
                        })}
                      >
                        {t.is_private ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        {t.is_private ? "Unhide" : "Hide"}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-7 text-[9px] flex-1 gap-1"
                        title="Delete permanently"
                        disabled={actionLoading === t.id}
                        onClick={() => setConfirmModal({
                          open: true, action: "delete", entityType: "talents",
                          entityId: t.id, entityName: t.title || "Untitled",
                        })}
                      >
                        {actionLoading === t.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )
          ) : (
            filteredRooms.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle2 className="w-6 h-6 text-primary/40 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">No rooms found</p>
              </div>
            ) : (
              filteredRooms.map(r => (
                <Card key={r.id} className="overflow-hidden">
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <DoorOpen className="w-3 h-3 text-muted-foreground shrink-0" />
                          <span className="text-xs font-medium truncate">{r.title}</span>
                          {r.is_private && (
                            <Badge variant="outline" className="text-[8px] px-1 py-0 h-4">Private</Badge>
                          )}
                        </div>
                        <p className="text-[9px] text-muted-foreground">
                          {r.language} • {new Date(r.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-[9px] flex-1 gap-1"
                        title={r.is_private ? "Make Public" : "Make Private"}
                        disabled={actionLoading === r.id}
                        onClick={() => setConfirmModal({
                          open: true, action: "hide", entityType: "rooms",
                          entityId: r.id, entityName: r.title,
                        })}
                      >
                        {r.is_private ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        {r.is_private ? "Unhide" : "Hide"}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-7 text-[9px] flex-1 gap-1"
                        title="Delete permanently"
                        disabled={actionLoading === r.id}
                        onClick={() => setConfirmModal({
                          open: true, action: "delete", entityType: "rooms",
                          entityId: r.id, entityName: r.title,
                        })}
                      >
                        {actionLoading === r.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      <Dialog open={confirmModal.open} onOpenChange={open => setConfirmModal({ ...confirmModal, open })}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-sm">
              {confirmModal.action === "delete" ? "⚠️ Permanent Delete" : "Toggle Visibility"} — {confirmModal.entityName}
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            {confirmModal.action === "delete"
              ? `This will PERMANENTLY delete this ${confirmModal.entityType === "talents" ? "talent" : "room"} from the database. This cannot be undone.`
              : `Toggle the visibility of this ${confirmModal.entityType === "talents" ? "talent" : "room"}? This change is immediate.`}
          </p>
          <div className="flex gap-2 justify-end mt-2">
            <Button variant="outline" size="sm" className="text-xs" onClick={() => setConfirmModal({ ...confirmModal, open: false })}>
              Cancel
            </Button>
            <Button
              variant={confirmModal.action === "delete" ? "destructive" : "default"}
              size="sm"
              className="text-xs"
              onClick={confirmAction}
            >
              {confirmModal.action === "delete" ? "Delete Forever" : "Confirm"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

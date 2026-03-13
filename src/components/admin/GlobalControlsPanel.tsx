import { useState, useEffect } from "react";
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
  Loader2, CheckCircle2, X,
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
      supabase.from("talent_uploads").select("id, title, user_id, language, created_at, is_private").order("created_at", { ascending: false }).limit(100),
      supabase.from("rooms").select("id, title, host_id, language, created_at, is_private").order("created_at", { ascending: false }).limit(100),
    ]);
    setTalents((talentsRes.data as TalentRow[]) || []);
    setRooms((roomsRes.data as RoomRow[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchEntities(); }, []);

  const handleDeleteTalent = async (id: string) => {
    await supabase.from("talent_uploads").delete().eq("id", id);
    toast({ title: "✅ Talent Deleted" });
    fetchEntities();
  };

  const handleToggleTalentVisibility = async (id: string, currentPrivate: boolean) => {
    await supabase.from("talent_uploads").update({ is_private: !currentPrivate }).eq("id", id);
    toast({ title: currentPrivate ? "👁 Talent Made Public" : "🙈 Talent Hidden" });
    fetchEntities();
  };

  const handleDeleteRoom = async (id: string) => {
    await supabase.from("room_members").delete().eq("room_id", id);
    await supabase.from("rooms").delete().eq("id", id);
    toast({ title: "✅ Room Deleted" });
    fetchEntities();
  };

  const handleToggleRoomVisibility = async (id: string, currentPrivate: boolean) => {
    await supabase.from("rooms").update({ is_private: !currentPrivate }).eq("id", id);
    toast({ title: currentPrivate ? "👁 Room Made Public" : "🔒 Room Made Private" });
    fetchEntities();
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
        Hide or delete any Talent, Room directly from the dashboard.
      </p>

      {/* Entity Tabs */}
      <div className="flex gap-2">
        {[
          { key: "talents" as EntityType, label: "Talents", icon: Mic, count: talents.length },
          { key: "rooms" as EntityType, label: "Rooms", icon: DoorOpen, count: rooms.length },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveEntity(tab.key)}
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
                  <CardContent className="p-3 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Mic className="w-3 h-3 text-muted-foreground shrink-0" />
                        <span className="text-xs font-medium truncate">{t.title || "Untitled"}</span>
                        {t.is_private && (
                          <Badge variant="outline" className="text-[8px] px-1 py-0 h-4">Private</Badge>
                        )}
                      </div>
                      <p className="text-[9px] text-muted-foreground">
                        {t.language} • {new Date(t.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 w-6 p-0"
                        title={t.is_private ? "Make Public" : "Hide"}
                        onClick={() => setConfirmModal({
                          open: true, action: "hide", entityType: "talents",
                          entityId: t.id, entityName: t.title || "Untitled",
                        })}
                      >
                        {t.is_private ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-6 w-6 p-0"
                        title="Delete"
                        onClick={() => setConfirmModal({
                          open: true, action: "delete", entityType: "talents",
                          entityId: t.id, entityName: t.title || "Untitled",
                        })}
                      >
                        <Trash2 className="w-3 h-3" />
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
                  <CardContent className="p-3 flex items-center justify-between gap-2">
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
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 w-6 p-0"
                        title={r.is_private ? "Make Public" : "Make Private"}
                        onClick={() => setConfirmModal({
                          open: true, action: "hide", entityType: "rooms",
                          entityId: r.id, entityName: r.title,
                        })}
                      >
                        {r.is_private ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-6 w-6 p-0"
                        title="Delete"
                        onClick={() => setConfirmModal({
                          open: true, action: "delete", entityType: "rooms",
                          entityId: r.id, entityName: r.title,
                        })}
                      >
                        <Trash2 className="w-3 h-3" />
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
              {confirmModal.action === "delete" ? "Delete" : "Toggle Visibility"} — {confirmModal.entityName}
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            {confirmModal.action === "delete"
              ? `Are you sure you want to permanently delete this ${confirmModal.entityType === "talents" ? "talent" : "room"}? This cannot be undone.`
              : `Toggle the visibility of this ${confirmModal.entityType === "talents" ? "talent" : "room"}?`}
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
              {confirmModal.action === "delete" ? "Delete" : "Confirm"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

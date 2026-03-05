import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, UserPlus, Phone, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface ConnectionRequest {
  id: string;
  sender_id: string;
  request_type: string;
  status: string;
  created_at: string;
  sender?: {
    username: string | null;
    avatar_url: string | null;
    level: number | null;
  };
}

export default function Requests() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    const fetchRequests = async () => {
      const { data } = await supabase
        .from("connection_requests")
        .select("*")
        .eq("receiver_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (data && data.length > 0) {
        const senderIds = [...new Set(data.map((r: any) => r.sender_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, avatar_url, level")
          .in("id", senderIds);

        const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
        setRequests(
          data.map((r: any) => ({
            ...r,
            sender: profileMap.get(r.sender_id) || undefined,
          }))
        );
      } else {
        setRequests([]);
      }
      setLoading(false);
    };
    fetchRequests();
  }, [user?.id]);

  const handleAction = async (requestId: string, newStatus: "accepted" | "rejected", senderId?: string) => {
    setActionLoading(requestId);
    await supabase
      .from("connection_requests")
      .update({ status: newStatus })
      .eq("id", requestId);

    // If accepted follow request, create bidirectional friendships
    if (newStatus === "accepted" && senderId && user?.id) {
      const req = requests.find(r => r.id === requestId);
      if (req?.request_type === "follow") {
        // Create both directions
        await supabase.from("friendships").upsert(
          { user_id: senderId, friend_id: user.id, status: "accepted" },
          { onConflict: "user_id,friend_id" }
        );
        await supabase.from("friendships").upsert(
          { user_id: user.id, friend_id: senderId, status: "accepted" },
          { onConflict: "user_id,friend_id" }
        );
        // Send notification to sender
        const { data: myProf } = await supabase.from("profiles").select("username").eq("id", user.id).single();
        await supabase.from("notifications").insert({
          user_id: senderId,
          from_user_id: user.id,
          type: "follow_accepted",
          title: `${myProf?.username || "Someone"} accepted your follow request`,
          message: "You are now following each other!",
          is_read: false,
        });
      }
    }

    setRequests((prev) => prev.filter((r) => r.id !== requestId));
    toast({
      title: newStatus === "accepted" ? "Request Accepted" : "Request Rejected",
      description: newStatus === "accepted" ? "You are now following each other!" : "You rejected the request.",
    });
    setActionLoading(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-xl border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-full hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">📬 Requests</h1>
      </div>

      <div className="px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm">No pending requests</p>
          </div>
        ) : (
          requests.map((req) => (
            <div
              key={req.id}
              className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card"
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-muted flex-shrink-0 flex items-center justify-center overflow-hidden">
                {req.sender?.avatar_url ? (
                  <img src={req.sender.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm">👤</span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {req.sender?.username || "User"}
                </p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {req.request_type === "follow" ? (
                    <><UserPlus className="w-3 h-3" /> Follow Request</>
                  ) : (
                    <><Phone className="w-3 h-3" /> Call Request</>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  className="h-8 px-3 text-xs bg-[hsl(142,71%,45%)] hover:bg-[hsl(142,71%,40%)] text-white"
                  disabled={actionLoading === req.id}
                  onClick={() => handleAction(req.id, "accepted", req.sender_id)}
                >
                  <Check className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-3 text-xs border-destructive/30 text-destructive hover:bg-destructive/10"
                  disabled={actionLoading === req.id}
                  onClick={() => handleAction(req.id, "rejected")}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

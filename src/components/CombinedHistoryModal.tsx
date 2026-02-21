import { useEffect, useState, useCallback } from "react";
import { Clock, PhoneIncoming, PhoneOutgoing, PhoneMissed, Users, Phone, ChevronDown, ChevronUp, UserPlus, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CallHistoryItem {
  id: string;
  partner_name: string;
  duration: number;
  status: "incoming" | "outgoing" | "missed" | "completed";
  created_at: string;
}

interface PartnerProfile {
  id: string;
  username: string;
  avatar_url: string | null;
  level: number | null;
}

interface CombinedHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CombinedHistoryModal({ open, onOpenChange }: CombinedHistoryModalProps) {
  const [callHistory, setCallHistory] = useState<CallHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [partnerProfiles, setPartnerProfiles] = useState<Record<string, PartnerProfile>>({});
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [followLoading, setFollowLoading] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: calls } = await supabase
        .from("call_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      const items = (calls as unknown as CallHistoryItem[]) || [];
      setCallHistory(items);

      // Fetch partner profiles by username
      const uniqueNames = [...new Set(items.map(c => c.partner_name))].filter(Boolean);
      if (uniqueNames.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, avatar_url, level")
          .in("username", uniqueNames);
        if (profiles) {
          const map: Record<string, PartnerProfile> = {};
          profiles.forEach(p => { if (p.username) map[p.username] = p as PartnerProfile; });
          setPartnerProfiles(map);
        }
      }

      // Fetch existing friendships
      const { data: friendships } = await supabase
        .from("friendships")
        .select("friend_id")
        .eq("user_id", user.id);
      if (friendships) {
        setFollowingIds(new Set(friendships.map(f => f.friend_id)));
      }
    } catch (err) {
      console.error("Error fetching history:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchHistory();
      setExpandedUser(null);
    }
  }, [open, fetchHistory]);

  const handleFollow = async (partnerId: string) => {
    setFollowLoading(partnerId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("friendships").insert({ user_id: user.id, friend_id: partnerId, status: "accepted" });
      setFollowingIds(prev => new Set(prev).add(partnerId));
    } catch (err) {
      console.error("Follow error:", err);
    } finally {
      setFollowLoading(null);
    }
  };

  const handleProfileClick = (partnerId: string) => {
    onOpenChange(false);
    navigate(`/user/${partnerId}`);
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "incoming": return <PhoneIncoming className="w-3.5 h-3.5" />;
      case "missed": return <PhoneMissed className="w-3.5 h-3.5" />;
      default: return <PhoneOutgoing className="w-3.5 h-3.5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "incoming": return { bg: "bg-green-500/15", text: "text-green-500", icon: "text-green-500" };
      case "missed": return { bg: "bg-destructive/15", text: "text-destructive", icon: "text-destructive" };
      default: return { bg: "bg-blue-500/15", text: "text-blue-500", icon: "text-blue-500" };
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "incoming": return "Incoming";
      case "missed": return "Missed";
      default: return "Outgoing";
    }
  };

  const groupedCalls = callHistory.reduce<Record<string, CallHistoryItem[]>>((acc, item) => {
    if (!acc[item.partner_name]) acc[item.partner_name] = [];
    acc[item.partner_name].push(item);
    return acc;
  }, {});

  const uniqueMembers = Object.keys(groupedCalls).length;

  const getTotalDuration = (calls: CallHistoryItem[]) =>
    calls.reduce((sum, c) => sum + c.duration, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Clock className="w-5 h-5 text-primary" />
            Call History
          </DialogTitle>
        </DialogHeader>

        {!loading && callHistory.length > 0 && (
          <div className="flex items-center justify-center gap-2 py-2 rounded-xl bg-muted/60">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">{uniqueMembers}</span>
            <span className="text-xs text-muted-foreground">Total Talking Members</span>
          </div>
        )}

        <div className="max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : callHistory.length === 0 ? (
            <div className="text-center py-8">
              <Phone className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground text-sm">No calls yet</p>
              <p className="text-muted-foreground/70 text-xs mt-1">Start speaking to see your history here</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {Object.entries(groupedCalls).map(([name, calls]) => {
                const isExpanded = expandedUser === name;
                const lastCall = calls[0];
                const lastColors = getStatusColor(lastCall.status);
                const partner = partnerProfiles[name];
                const isFollowing = partner ? followingIds.has(partner.id) : false;

                return (
                  <li key={name}>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted hover:bg-muted/80 transition-colors">
                      {/* Avatar – clickable to profile */}
                      <button
                        onClick={() => partner && handleProfileClick(partner.id)}
                        className="shrink-0"
                        disabled={!partner}
                      >
                        <Avatar className="w-10 h-10">
                          {partner?.avatar_url ? (
                            <AvatarImage src={partner.avatar_url} alt={name} />
                          ) : null}
                          <AvatarFallback className={`${lastColors.bg} ${lastColors.icon}`}>
                            {getStatusIcon(lastCall.status)}
                          </AvatarFallback>
                        </Avatar>
                      </button>

                      {/* Name & stats – clickable to profile */}
                      <button
                        onClick={() => partner && handleProfileClick(partner.id)}
                        className="flex-1 min-w-0 text-left"
                        disabled={!partner}
                      >
                        <p className="text-sm font-medium text-foreground truncate">{name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {calls.length} call{calls.length > 1 ? "s" : ""} · {formatDuration(getTotalDuration(calls))} total
                        </p>
                      </button>

                      {/* Follow button */}
                      {partner && (
                        <Button
                          size="sm"
                          variant={isFollowing ? "secondary" : "default"}
                          className="h-7 px-2.5 text-xs gap-1"
                          disabled={isFollowing || followLoading === partner.id}
                          onClick={(e) => { e.stopPropagation(); handleFollow(partner.id); }}
                        >
                          {isFollowing ? <Check className="w-3 h-3" /> : <UserPlus className="w-3 h-3" />}
                          {isFollowing ? "Following" : "Follow"}
                        </Button>
                      )}

                      {/* Expand toggle */}
                      <button onClick={() => setExpandedUser(isExpanded ? null : name)} className="text-muted-foreground p-1">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                    {isExpanded && (
                      <ul className="mt-1 ml-6 space-y-1 border-l-2 border-border pl-3">
                        {calls.map((item) => {
                          const colors = getStatusColor(item.status);
                          return (
                            <li key={item.id} className="flex items-center gap-2 py-2 px-2 rounded-lg bg-background/60">
                              <span className={`${colors.icon}`}>{getStatusIcon(item.status)}</span>
                              <div className="flex-1 min-w-0">
                                <p className={`text-[11px] font-medium ${colors.text}`}>{getStatusLabel(item.status)}</p>
                                <p className="text-[10px] text-muted-foreground">
                                  {format(new Date(item.created_at), "MMM d, yyyy · h:mm a")}
                                </p>
                              </div>
                              <span className="text-xs font-semibold text-foreground">{formatDuration(item.duration)}</span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

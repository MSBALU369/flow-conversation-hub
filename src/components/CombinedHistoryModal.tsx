import { useEffect, useState, useCallback } from "react";
import { Clock, PhoneIncoming, PhoneOutgoing, PhoneMissed, Users, Phone, ChevronDown, ChevronUp, UserPlus, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, isToday, differenceInMinutes, differenceInHours } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CallHistoryRow {
  id: string;
  user_id: string;       // caller
  partner_id: string | null; // receiver
  partner_name: string;
  duration: number;
  status: string;
  created_at: string;
}

interface DisplayCall {
  id: string;
  partner_name: string;
  partner_user_id: string | null; // the other person's ID
  duration: number;
  direction: "outgoing" | "incoming" | "missed";
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
  const [displayCalls, setDisplayCalls] = useState<DisplayCall[]>([]);
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

      // Fetch all call_history where I'm caller (user_id) or receiver (partner_id)
      const { data: calls } = await supabase
        .from("call_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      const rows = (calls as unknown as CallHistoryRow[]) || [];

      // Transform into display calls with direction
      const transformed: DisplayCall[] = rows.map(row => {
        const isCaller = row.user_id === user.id;
        const isMissed = row.status === "missed" || row.status === "missed_outgoing" || row.status === "missed_incoming";
        
        return {
          id: row.id,
          partner_name: isCaller ? row.partner_name : row.partner_name, // We'll resolve below
          partner_user_id: isCaller ? row.partner_id : row.user_id,
          duration: row.duration,
          direction: isMissed ? "missed" : (isCaller ? "outgoing" : "incoming"),
          created_at: row.created_at,
        };
      });

      // For records where current user is the receiver, we need the caller's name
      const callerIds = rows.filter(r => r.user_id !== user.id).map(r => r.user_id);
      let callerNameMap: Record<string, string> = {};
      if (callerIds.length > 0) {
        const { data: callerProfiles } = await supabase
          .from("profiles")
          .select("id, username")
          .in("id", [...new Set(callerIds)]);
        if (callerProfiles) {
          callerProfiles.forEach(p => { callerNameMap[p.id] = p.username || "User"; });
        }
      }

      // Fix partner names for incoming calls
      const finalCalls = transformed.map((call, i) => {
        const row = rows[i];
        if (row.user_id !== user.id) {
          // I'm the receiver — partner is the caller
          return { ...call, partner_name: callerNameMap[row.user_id] || row.partner_name };
        }
        return call;
      });

      setDisplayCalls(finalCalls);

      // Fetch partner profiles by partner_user_id
      const partnerIds = [...new Set(finalCalls.map(c => c.partner_user_id).filter(Boolean))] as string[];
      if (partnerIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, username, avatar_url, level")
          .in("id", partnerIds);
        if (profiles) {
          const map: Record<string, PartnerProfile> = {};
          profiles.forEach(p => { map[p.id] = p as PartnerProfile; });
          // Also map by username for grouping lookup
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
      const { sendFollowNotification } = await import("@/lib/followNotification");
      sendFollowNotification(user.id, partnerId);
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

  const getStatusIcon = (direction: string) => {
    switch (direction) {
      case "incoming": return <PhoneIncoming className="w-3.5 h-3.5" />;
      case "missed": return <PhoneMissed className="w-3.5 h-3.5" />;
      default: return <PhoneOutgoing className="w-3.5 h-3.5" />;
    }
  };

  const getStatusColor = (direction: string) => {
    switch (direction) {
      case "incoming": return { bg: "bg-green-500/15", text: "text-green-500", icon: "text-green-500" };
      case "missed": return { bg: "bg-destructive/15", text: "text-destructive", icon: "text-destructive" };
      default: return { bg: "bg-blue-500/15", text: "text-blue-500", icon: "text-blue-500" };
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    if (!isToday(date)) return format(date, "MMM d, yyyy · h:mm a");
    const mins = differenceInMinutes(new Date(), date);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = differenceInHours(new Date(), date);
    return `${hours}h ago`;
  };

  const getStatusLabel = (direction: string) => {
    switch (direction) {
      case "incoming": return "Incoming";
      case "missed": return "Missed";
      default: return "Outgoing";
    }
  };

  // Group by partner name
  const groupedCalls = displayCalls.reduce<Record<string, DisplayCall[]>>((acc, item) => {
    if (!acc[item.partner_name]) acc[item.partner_name] = [];
    acc[item.partner_name].push(item);
    return acc;
  }, {});

  const uniqueMembers = Object.keys(groupedCalls).length;

  const getTotalDuration = (calls: DisplayCall[]) =>
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

        {!loading && displayCalls.length > 0 && (
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
          ) : displayCalls.length === 0 ? (
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
                const lastColors = getStatusColor(lastCall.direction);
                const partner = lastCall.partner_user_id ? (partnerProfiles[lastCall.partner_user_id] || partnerProfiles[name]) : partnerProfiles[name];
                const isFollowing = partner ? followingIds.has(partner.id) : false;

                return (
                  <li key={name}>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted hover:bg-muted/80 transition-colors">
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
                            {getStatusIcon(lastCall.direction)}
                          </AvatarFallback>
                        </Avatar>
                      </button>

                      <button
                        onClick={() => partner && handleProfileClick(partner.id)}
                        className="flex-1 min-w-0 text-left"
                        disabled={!partner}
                      >
                        <p className="text-sm font-medium text-foreground">{name}</p>
                        <p className="text-[9px] text-muted-foreground whitespace-nowrap overflow-hidden">
                          {format(new Date(lastCall.created_at), "EEE, MMM d · h:mm a")} · <span className="text-foreground font-medium">{formatDuration(lastCall.duration)} ({formatTimeAgo(lastCall.created_at)})</span>
                        </p>
                        <p className="text-[9px] text-muted-foreground">Total calls ({calls.length})</p>
                      </button>

                      <div className="flex flex-col items-center gap-1 shrink-0">
                        {partner && (
                          <Button
                            size="sm"
                            variant={isFollowing ? "secondary" : "default"}
                            className="h-6 px-1.5 text-[10px] gap-0.5"
                            disabled={isFollowing || followLoading === partner.id}
                            onClick={(e) => { e.stopPropagation(); handleFollow(partner.id); }}
                          >
                            {isFollowing ? <Check className="w-2.5 h-2.5" /> : <UserPlus className="w-2.5 h-2.5" />}
                            {isFollowing ? "Following" : "Follow"}
                          </Button>
                        )}
                        <button onClick={() => setExpandedUser(isExpanded ? null : name)} className="text-muted-foreground p-0.5">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-1 ml-6 border-l-2 border-border pl-3">
                        <div className="flex items-center gap-3 py-1.5 px-2 text-[10px] text-muted-foreground">
                          <span>Total: {calls.length} call{calls.length > 1 ? "s" : ""}</span>
                          <span>·</span>
                          <span>{formatDuration(getTotalDuration(calls))} total duration</span>
                        </div>
                        <ul className="space-y-1">
                        {calls.map((item) => {
                          const colors = getStatusColor(item.direction);
                          return (
                            <li key={item.id} className="flex items-center gap-2 py-2 px-2 rounded-lg bg-background/60">
                              <span className={`${colors.icon}`}>{getStatusIcon(item.direction)}</span>
                              <div className="flex-1 min-w-0">
                                <p className={`text-[11px] font-medium ${colors.text}`}>{getStatusLabel(item.direction)}</p>
                                <p className="text-[10px] text-muted-foreground">
                                  {format(new Date(item.created_at), "EEEE, MMM d, yyyy · h:mm a")}
                                </p>
                              </div>
                              <span className="text-xs font-semibold text-foreground">{formatDuration(item.duration)} ({formatTimeAgo(item.created_at)})</span>
                            </li>
                          );
                        })}
                        </ul>
                      </div>
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

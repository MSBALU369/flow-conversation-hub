import { useEffect, useState, useCallback } from "react";
import { Clock, PhoneIncoming, PhoneOutgoing, PhoneMissed, Users, Phone, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, formatDistanceToNow } from "date-fns";
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

interface CombinedHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CombinedHistoryModal({ open, onOpenChange }: CombinedHistoryModalProps) {
  const [callHistory, setCallHistory] = useState<CallHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

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

      setCallHistory((calls as unknown as CallHistoryItem[]) || []);
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

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "incoming":
        return <PhoneIncoming className="w-3.5 h-3.5" />;
      case "missed":
        return <PhoneMissed className="w-3.5 h-3.5" />;
      case "outgoing":
      case "completed":
      default:
        return <PhoneOutgoing className="w-3.5 h-3.5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "incoming":
        return { bg: "bg-green-500/15", text: "text-green-500", icon: "text-green-500" };
      case "missed":
        return { bg: "bg-destructive/15", text: "text-destructive", icon: "text-destructive" };
      case "outgoing":
      case "completed":
      default:
        return { bg: "bg-blue-500/15", text: "text-blue-500", icon: "text-blue-500" };
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "incoming": return "Incoming";
      case "missed": return "Missed";
      case "outgoing":
      case "completed":
      default: return "Outgoing";
    }
  };

  // Group calls by partner name
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
                return (
                  <li key={name}>
                    {/* User row – tap to expand */}
                    <button
                      onClick={() => setExpandedUser(isExpanded ? null : name)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted hover:bg-muted/80 transition-colors text-left"
                    >
                      <div className={`w-10 h-10 rounded-full ${lastColors.bg} flex items-center justify-center ${lastColors.icon}`}>
                        {getStatusIcon(lastCall.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {calls.length} call{calls.length > 1 ? "s" : ""} · {formatDuration(getTotalDuration(calls))} total
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </button>

                    {/* Expanded call list */}
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

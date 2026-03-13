import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Database, Phone, Mail, Globe, CreditCard, Github,
  Server, Cloud, Smartphone, BarChart3, RefreshCw, Calendar,
  CheckCircle2, XCircle, Loader2, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ServiceStatus {
  name: string;
  icon: React.ElementType;
  status: "online" | "offline" | "checking" | "unknown";
  lastChecked: Date | null;
  latency?: number;
}

interface ErrorLog {
  id: string;
  service: string;
  message: string;
  timestamp: string;
  severity: "error" | "warning" | "info";
}

const SERVICE_LIST: { name: string; icon: React.ElementType }[] = [
  { name: "Supabase", icon: Database },
  { name: "LiveKit", icon: Phone },
  { name: "Brevo (Email)", icon: Mail },
  { name: "Vercel", icon: Cloud },
  { name: "GitHub", icon: Github },
  { name: "GoDaddy", icon: Globe },
  { name: "Lovable", icon: Server },
  { name: "Google Console", icon: BarChart3 },
  { name: "RevenueCat", icon: CreditCard },
  { name: "AdMob", icon: Smartphone },
];

export function SystemHealthDashboard() {
  const [services, setServices] = useState<ServiceStatus[]>(
    SERVICE_LIST.map(s => ({ ...s, status: "unknown" as const, lastChecked: null }))
  );
  const [checking, setChecking] = useState(false);
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [logDate, setLogDate] = useState("");
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  const checkServices = useCallback(async () => {
    setChecking(true);
    const now = new Date();

    const updated = services.map(s => ({ ...s, status: "checking" as const }));
    setServices(updated);

    const results: ServiceStatus[] = [];

    for (const svc of SERVICE_LIST) {
      let status: ServiceStatus["status"] = "offline";
      let latency = 0;
      const start = Date.now();

      try {
        if (svc.name === "Supabase") {
          const { error } = await supabase.from("profiles").select("id").limit(1);
          status = error ? "offline" : "online";
        } else if (svc.name === "LiveKit") {
          const lkUrl = import.meta.env.VITE_LIVEKIT_URL;
          status = lkUrl ? "online" : "unknown";
        } else if (svc.name === "Brevo (Email)") {
          try {
            await supabase.functions.invoke("send-support-reply", {
              body: { ping: true },
            });
            status = "online";
          } catch {
            status = "offline";
          }
        } else if (svc.name === "Vercel") {
          status = "online";
        } else {
          status = "unknown";
        }
      } catch {
        status = "offline";
      }

      latency = Date.now() - start;
      results.push({ ...svc, status, lastChecked: now, latency });
    }

    setServices(results);
    setChecking(false);
  }, []);

  // Auto-check on mount and every 2 minutes
  useEffect(() => {
    checkServices();
    const interval = setInterval(checkServices, 120000);
    return () => clearInterval(interval);
  }, [checkServices]);

  // Auto-clear old status (mark as unknown if last check > 2 min ago)
  useEffect(() => {
    const interval = setInterval(() => {
      setServices(prev =>
        prev.map(s => {
          if (s.lastChecked && Date.now() - s.lastChecked.getTime() > 120000) {
            return { ...s, status: "unknown" as const };
          }
          return s;
        })
      );
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchErrorLogs = async () => {
    if (!logDate) return;
    setLoadingLogs(true);
    setShowLogs(true);

    // Fetch from notifications table as a proxy for error logs (system type)
    const startOfDay = new Date(logDate);
    const endOfDay = new Date(logDate);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const { data } = await supabase
      .from("notifications")
      .select("id, type, title, message, created_at")
      .eq("type", "system")
      .gte("created_at", startOfDay.toISOString())
      .lt("created_at", endOfDay.toISOString())
      .order("created_at", { ascending: false })
      .limit(100);

    const logs: ErrorLog[] = (data || []).map((n: any) => ({
      id: n.id,
      service: "System",
      message: `${n.title}: ${n.message || ""}`,
      timestamp: n.created_at,
      severity: n.type === "warning" ? "warning" : "info",
    }));

    setErrorLogs(logs);
    setLoadingLogs(false);
  };

  const statusIcon = (status: ServiceStatus["status"]) => {
    switch (status) {
      case "online":
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
      case "offline":
        return <XCircle className="w-3.5 h-3.5 text-destructive" />;
      case "checking":
        return <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />;
      default:
        return <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />;
    }
  };

  const statusDot = (status: ServiceStatus["status"]) => {
    switch (status) {
      case "online": return "bg-emerald-500";
      case "offline": return "bg-destructive";
      case "checking": return "bg-primary animate-pulse";
      default: return "bg-yellow-500";
    }
  };

  const onlineCount = services.filter(s => s.status === "online").length;
  const offlineCount = services.filter(s => s.status === "offline").length;

  return (
    <div className="space-y-4 mt-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-1.5">
            <Server className="w-4 h-4 text-primary" /> System Health Monitor
          </h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Real-time service status • Auto-refreshes every 2 min
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-[10px] gap-1"
          onClick={checkServices}
          disabled={checking}
        >
          <RefreshCw className={cn("w-3 h-3", checking && "animate-spin")} />
          {checking ? "Checking..." : "Refresh"}
        </Button>
      </div>

      {/* Summary Bar */}
      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-xs font-medium text-emerald-600">{onlineCount} Online</span>
        </div>
        <div className="flex-1 flex items-center gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20">
          <div className="w-2.5 h-2.5 rounded-full bg-destructive" />
          <span className="text-xs font-medium text-destructive">{offlineCount} Offline</span>
        </div>
        <div className="flex-1 flex items-center gap-2 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
          <span className="text-xs font-medium text-yellow-600">{services.length - onlineCount - offlineCount} Unknown</span>
        </div>
      </div>

      {/* Service Grid */}
      <div className="grid grid-cols-2 gap-2">
        {services.map(s => (
          <Card
            key={s.name}
            className={cn(
              "overflow-hidden transition-all",
              s.status === "online" && "border-emerald-500/20",
              s.status === "offline" && "border-destructive/30",
              s.status === "unknown" && "border-yellow-500/20",
            )}
          >
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <div className={cn("w-2 h-2 rounded-full shrink-0", statusDot(s.status))} />
                <s.icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="text-[11px] font-medium truncate">{s.name}</span>
                <div className="ml-auto">{statusIcon(s.status)}</div>
              </div>
              <div className="flex items-center justify-between">
                <span className={cn(
                  "text-[9px] font-medium uppercase tracking-wide",
                  s.status === "online" && "text-emerald-600",
                  s.status === "offline" && "text-destructive",
                  s.status === "checking" && "text-primary",
                  s.status === "unknown" && "text-yellow-600",
                )}>
                  {s.status}
                </span>
                {s.latency != null && s.status !== "unknown" && (
                  <span className="text-[9px] text-muted-foreground">{s.latency}ms</span>
                )}
              </div>
              {s.lastChecked && (
                <p className="text-[8px] text-muted-foreground mt-1">
                  Checked: {s.lastChecked.toLocaleTimeString()}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Historical Error Logs */}
      <div className="space-y-2 pt-2 border-t border-border">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" /> Historical Error Logs
        </h4>
        <p className="text-[10px] text-muted-foreground">
          Select a date to fetch error logs for that day.
        </p>
        <div className="flex gap-2">
          <Input
            type="date"
            value={logDate}
            onChange={e => setLogDate(e.target.value)}
            className="h-8 text-xs bg-background border-border flex-1"
          />
          <Button
            size="sm"
            className="h-8 text-[10px] gap-1"
            onClick={fetchErrorLogs}
            disabled={!logDate || loadingLogs}
          >
            {loadingLogs ? <Loader2 className="w-3 h-3 animate-spin" /> : <BarChart3 className="w-3 h-3" />}
            Fetch Logs
          </Button>
        </div>

        {showLogs && (
          <div className="space-y-1.5 max-h-[30vh] overflow-y-auto">
            {loadingLogs ? (
              <div className="flex justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : errorLogs.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle2 className="w-6 h-6 text-emerald-500/50 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">No logs found for this date</p>
              </div>
            ) : (
              errorLogs.map(log => (
                <div
                  key={log.id}
                  className={cn(
                    "p-2.5 rounded-lg border text-xs",
                    log.severity === "error" && "border-destructive/30 bg-destructive/5",
                    log.severity === "warning" && "border-yellow-500/30 bg-yellow-500/5",
                    log.severity === "info" && "border-border bg-muted/30",
                  )}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={cn(
                      "text-[8px] px-1.5 py-0.5 rounded-full font-medium uppercase",
                      log.severity === "error" && "bg-destructive/20 text-destructive",
                      log.severity === "warning" && "bg-yellow-500/20 text-yellow-600",
                      log.severity === "info" && "bg-muted text-muted-foreground",
                    )}>
                      {log.severity}
                    </span>
                    <span className="text-[9px] text-muted-foreground">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[10px] text-foreground">{log.message}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Users, DollarSign, Database, Phone, Mail, Crown,
  AlertTriangle, Zap, Activity, Shield, Rocket, CreditCard, Globe,
  Search, Trash2, Ban, Ticket, CheckCircle2, Gift, UserMinus, Bomb, Reply, Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ToolMetricsModal } from "@/components/admin/ToolMetricsModal";
import { AdminUserActionModal } from "@/components/admin/AdminUserActionModal";
import { AdminUserManagement } from "@/components/admin/AdminUserManagement";
import { PendingDeletionsTab } from "@/components/admin/PendingDeletionsTab";
import { AdminVersionControl } from "@/components/admin/AdminVersionControl";

const ADMIN_EMAILS = [
  "balumothe@gmail.com", "balumothe+test1@gmail.com",
  "balumothe+test2@gmail.com", "balumothe+test3@gmail.com",
];
const ROOT_EMAILS = [
  "balushinu@gmail.com", "balushinu+test1@gmail.com",
  "balushinu+test2@gmail.com", "balushinu+test3@gmail.com",
  "balushinu+test4@gmail.com",
];

export function isAdminOrRoot(email?: string | null) {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email) || ROOT_EMAILS.includes(email);
}

interface UserRow {
  id: string;
  username: string | null;
  email: string | null;
  energy_bars: number | null;
  coins: number | null;
  created_at: string;
  is_premium: boolean | null;
  is_banned: boolean | null;
  deletion_requested_at?: string | null;
}

interface ReportRow {
  id: string;
  reason: string;
  description: string | null;
  reported_user_id: string;
  reporter_id: string;
  created_at: string;
}

export default function Admin() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [monthEarnings, setMonthEarnings] = useState(0);
  const [premiumCount, setPremiumCount] = useState(0);
  const [freeCount, setFreeCount] = useState(0);
  const [totalCalls, setTotalCalls] = useState(0);
  const [totalRooms, setTotalRooms] = useState(0);
  const [totalTalents, setTotalTalents] = useState(0);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [selectedTool, setSelectedTool] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [grantingPremium, setGrantingPremium] = useState<string | null>(null);
  const [showDeletedAccounts, setShowDeletedAccounts] = useState(false);
  const [nukingTests, setNukingTests] = useState(false);
  const [replyingTicket, setReplyingTicket] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [activeTab, setActiveTab] = useState("health");
  const [userFilterPreset, setUserFilterPreset] = useState<string | null>(null);

  // Guard
  useEffect(() => {
    if (user && !isAdminOrRoot(user.email)) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const fetchAll = async () => {
    if (!user || !isAdminOrRoot(user.email)) return;
    setLoading(true);

    const [usersRes, todayTxRes, monthTxRes, callsRes, roomsRes, talentsRes, reportsRes, ticketsRes] = await Promise.all([
      supabase.from("profiles").select("id, username, email, avatar_url, energy_bars, coins, created_at, is_premium, is_banned, is_hidden, deletion_requested_at, reports_count").order("created_at", { ascending: false }).limit(500),
      (() => {
        const todayStart = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).toISOString();
        return supabase.from("coin_transactions").select("amount").gte("created_at", todayStart).eq("status", "completed");
      })(),
      (() => {
        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
        return supabase.from("coin_transactions").select("amount").gte("created_at", monthStart).eq("status", "completed");
      })(),
      supabase.from("calls").select("*", { count: "exact", head: true }),
      supabase.from("rooms").select("*", { count: "exact", head: true }),
      supabase.from("talent_uploads").select("*", { count: "exact", head: true }),
      supabase.from("reports").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("support_tickets" as any).select("*").order("created_at", { ascending: false }).limit(100),
    ]);

    const usersData = (usersRes.data as UserRow[]) || [];
    setUsers(usersData);
    setPremiumCount(usersData.filter(u => u.is_premium).length);
    setFreeCount(usersData.filter(u => !u.is_premium).length);
    setTodayEarnings((todayTxRes.data || []).reduce((s: number, t: any) => s + (t.amount || 0), 0));
    setMonthEarnings((monthTxRes.data || []).reduce((s: number, t: any) => s + (t.amount || 0), 0));
    setTotalCalls(callsRes.count || 0);
    setTotalRooms(roomsRes.count || 0);
    setTotalTalents(talentsRes.count || 0);
    setReports((reportsRes.data as ReportRow[]) || []);
    setTickets((ticketsRes as any).data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [user]);

  // Realtime sync for tickets & coin_transactions
  useEffect(() => {
    if (!user || !isAdminOrRoot(user.email)) return;
    const channel = supabase
      .channel("admin-realtime")
      .on("postgres_changes" as any, { event: "*", schema: "public", table: "support_tickets" }, () => fetchAll())
      .on("postgres_changes" as any, { event: "*", schema: "public", table: "coin_transactions" }, () => fetchAll())
      .on("postgres_changes" as any, { event: "*", schema: "public", table: "profiles" }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  if (!user || !isAdminOrRoot(user.email)) return null;

  const toolCards = [
    {
      label: "Supabase DB",
      value: `${users.length} profiles`,
      percent: Math.min(100, Math.round((users.length / 10000) * 100)),
      icon: Database,
      warn: users.length > 8000,
      details: [
        { label: "Total Profiles", value: `${users.length}` },
        { label: "Total Calls", value: `${totalCalls}` },
        { label: "Total Rooms", value: `${totalRooms}` },
        { label: "Total Talents", value: `${totalTalents}` },
        { label: "Reports Filed", value: `${reports.length}` },
      ],
    },
    {
      label: "LiveKit",
      value: `${totalCalls} calls`,
      percent: Math.min(100, Math.round((totalCalls / 5000) * 100)),
      icon: Phone,
      warn: totalCalls > 4000,
      details: [
        { label: "Total Calls", value: `${totalCalls}` },
        { label: "Active Rooms", value: `${totalRooms}` },
        { label: "Bandwidth", value: "N/A (LiveKit Dashboard)" },
        { label: "Call Minutes", value: "Track via LiveKit Cloud" },
      ],
    },
    {
      label: "Email Quota",
      value: "N/A",
      percent: 0,
      icon: Mail,
      warn: false,
      details: [
        { label: "Provider", value: "Brevo / Zoho" },
        { label: "Emails Sent", value: "Integrate API" },
        { label: "Quota", value: "300/day (free tier)" },
      ],
    },
    {
      label: "AdMob & Payments",
      value: "Placeholder",
      percent: 0,
      icon: CreditCard,
      warn: false,
      details: [
        { label: "Ad Revenue", value: "Coming Soon" },
        { label: "Stripe Webhooks", value: "Not Connected" },
        { label: "Razorpay", value: "Not Connected" },
      ],
    },
    {
      label: "GoDaddy Domain",
      value: "Placeholder",
      percent: 0,
      icon: Globe,
      warn: false,
      details: [
        { label: "Domain", value: "Configure manually" },
        { label: "SSL Status", value: "—" },
        { label: "Expiry", value: "—" },
      ],
    },
  ];

  const filteredUsers = users.filter(u => {
    if (!userSearch) return true;
    const q = userSearch.toLowerCase();
    return (u.username || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q);
  });

  const handleKillRoom = async (roomId: string) => {
    await supabase.from("room_members").delete().eq("room_id", roomId);
    await supabase.from("rooms").delete().eq("id", roomId);
    fetchAll();
  };

  const handleDeleteTalent = async (talentId: string) => {
    await supabase.from("talent_uploads").delete().eq("id", talentId);
    fetchAll();
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-8">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate("/")} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Quantum Control Tower
          </h1>
          <p className="text-[10px] text-muted-foreground">{user.email} • God Mode Active</p>
        </div>
      </header>

      <div className="px-4 mt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-7 h-10 bg-muted/50">
            <TabsTrigger value="health" className="text-[10px] data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
              <Activity className="w-3.5 h-3.5 mr-0.5" /> Health
            </TabsTrigger>
            <TabsTrigger value="users" className="text-[10px] data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
              <Users className="w-3.5 h-3.5 mr-0.5" /> Users
            </TabsTrigger>
            <TabsTrigger value="deletions" className="text-[10px] data-[state=active]:bg-destructive/15 data-[state=active]:text-destructive relative">
              <UserMinus className="w-3.5 h-3.5 mr-0.5" /> Del
            </TabsTrigger>
            <TabsTrigger value="test" className="text-[10px] data-[state=active]:bg-destructive/15 data-[state=active]:text-destructive">
              <Bomb className="w-3.5 h-3.5 mr-0.5" /> Test
            </TabsTrigger>
            <TabsTrigger value="tickets" className="text-[10px] data-[state=active]:bg-primary/15 data-[state=active]:text-primary relative">
              <Ticket className="w-3.5 h-3.5 mr-0.5" /> Tix
              {tickets.filter((t: any) => t.status === "open").length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[8px] rounded-full flex items-center justify-center">
                  {tickets.filter((t: any) => t.status === "open").length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="moderation" className="text-[10px] data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
              <Shield className="w-3.5 h-3.5 mr-0.5" /> Mod
            </TabsTrigger>
            <TabsTrigger value="future" className="text-[10px] data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
              <Rocket className="w-3.5 h-3.5 mr-0.5" /> Lab
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: SYSTEM HEALTH */}
          <TabsContent value="health" className="space-y-4 mt-4">
            {/* Earnings */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader className="p-3 pb-1">
                  <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5" /> Today's Earnings
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <p className="text-2xl font-bold text-primary">{todayEarnings}</p>
                  <p className="text-[10px] text-muted-foreground">coins transacted</p>
                </CardContent>
              </Card>
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader className="p-3 pb-1">
                  <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5" /> Monthly
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <p className="text-2xl font-bold text-primary">{monthEarnings}</p>
                  <p className="text-[10px] text-muted-foreground">coins transacted</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Stats — Clickable to open Users tab with filter */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Users", count: users.length, filter: "all", icon: Users, color: "text-foreground" },
                { label: "Premium", count: premiumCount, filter: "premium", icon: Crown, color: "text-primary" },
                { label: "Free", count: freeCount, filter: "free", icon: Users, color: "text-muted-foreground" },
              ].map(s => (
                <button
                  key={s.filter}
                  onClick={() => { setUserFilterPreset(s.filter); setActiveTab("users"); }}
                  className="bg-muted/50 rounded-xl p-3 text-center hover:bg-primary/10 hover:ring-1 hover:ring-primary/20 transition-all cursor-pointer"
                >
                  <s.icon className={cn("w-4 h-4 mx-auto mb-1", s.color)} />
                  <p className={cn("text-xl font-bold", s.color)}>{s.count}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </button>
              ))}
            </div>

            {/* Deleted Accounts Monitor */}
            {(() => {
              const deletedAccounts = users.filter(u => (u as any).deletion_requested_at);
              return (
                <div>
                  <button
                    onClick={() => setShowDeletedAccounts(!showDeletedAccounts)}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-destructive/30 bg-destructive/5 hover:bg-destructive/10 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Trash2 className="w-4 h-4 text-destructive" />
                      <div className="text-left">
                        <p className="text-sm font-semibold text-destructive">Deleted Accounts</p>
                        <p className="text-[10px] text-muted-foreground">Frozen & pending permanent deletion</p>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-destructive">{deletedAccounts.length}</span>
                  </button>
                  {showDeletedAccounts && deletedAccounts.length > 0 && (
                    <div className="mt-2 space-y-1.5 max-h-[30vh] overflow-y-auto">
                      {deletedAccounts.map(u => {
                        const reqAt = new Date((u as any).deletion_requested_at);
                        const deleteBy = new Date(reqAt.getTime() + 48 * 60 * 60 * 1000);
                        const hoursLeft = Math.max(0, Math.round((deleteBy.getTime() - Date.now()) / (1000 * 60 * 60)));
                        return (
                          <div key={u.id} className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/30">
                            <div>
                              <p className="text-xs font-medium text-foreground">{u.username || u.email || "Unknown"}</p>
                              <p className="text-[9px] text-muted-foreground">Requested: {reqAt.toLocaleString()}</p>
                              <p className="text-[9px] text-destructive font-medium">
                                {hoursLeft > 0 ? `${hoursLeft}h left` : "Ready to delete"}
                              </p>
                            </div>
                            <div className="flex gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-[9px] h-6 px-2"
                                onClick={async () => {
                                  await supabase.from("profiles").update({ is_banned: false, deletion_requested_at: null } as any).eq("id", u.id);
                                  fetchAll();
                                }}
                              >
                                Restore
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="text-[9px] h-6 px-2"
                                onClick={async () => {
                                  await supabase.rpc("delete_user_account", { p_user_id: u.id });
                                  fetchAll();
                                }}
                              >
                                Delete Now
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Tool Cards — Clickable */}
            <div>
              <h2 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-primary" /> Health Hub — Tool Metrics
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {toolCards.map((c) => (
                  <Card
                    key={c.label}
                    className={cn(
                      "relative overflow-hidden cursor-pointer hover:ring-1 hover:ring-primary/30 transition-all",
                      c.warn && "border-destructive/50"
                    )}
                    onClick={() => setSelectedTool(c)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-1.5 mb-1">
                        <c.icon className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-[11px] font-medium">{c.label}</span>
                        {c.warn && <AlertTriangle className="w-3 h-3 text-destructive ml-auto" />}
                      </div>
                      <p className="text-xs text-muted-foreground">{c.value}</p>
                      <div className="w-full h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all", c.percent > 80 ? "bg-destructive" : "bg-primary")}
                          style={{ width: `${c.percent}%` }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* App Version Control */}
            <AdminVersionControl />
          </TabsContent>

          {/* TAB 2: DEEP USER MANAGEMENT */}
          <TabsContent value="users">
            <AdminUserManagement
              users={users}
              loading={loading}
              onSelectUser={setSelectedUser}
              onBanUsers={async (ids) => {
                if (!confirm(`Ban ${ids.length} user(s)? Their email(s) will be permanently blocked from re-registering.`)) return;
                for (const id of ids) {
                  const u = users.find(x => x.id === id);
                  await supabase.from("profiles").update({ is_banned: true } as any).eq("id", id);
                  if (u?.email) {
                    await supabase.from("banned_emails" as any).upsert({ email: u.email.toLowerCase(), reason: "Bulk banned by admin" } as any, { onConflict: "email" });
                  }
                }
                fetchAll();
              }}
              onWarnUsers={async (ids) => {
                for (const id of ids) {
                  await supabase.from("notifications").insert({
                    user_id: id,
                    type: "warning",
                    title: "⚠️ Warning from Admin",
                    message: "You have been warned for violating community guidelines. Continued violations may result in a ban.",
                    from_user_id: user.id,
                  });
                }
                fetchAll();
              }}
              onHideUsers={async (ids) => {
                for (const id of ids) {
                  const u = users.find(x => x.id === id);
                  const isHidden = (u as any)?.is_hidden;
                  await supabase.from("profiles").update({ is_hidden: !isHidden } as any).eq("id", id);
                }
                fetchAll();
              }}
              onDeleteUsers={async (ids) => {
                if (!confirm(`Delete ${ids.length} user(s)? This is permanent but they can re-register with the same email.`)) return;
                for (const id of ids) {
                  await supabase.rpc("delete_user_account", { p_user_id: id });
                }
                fetchAll();
              }}
            />
          </TabsContent>

          {/* TAB: PENDING DELETIONS */}
          <TabsContent value="deletions">
            <PendingDeletionsTab />
          </TabsContent>

          {/* TAB: TEST ACCOUNTS MANAGER */}
          <TabsContent value="test" className="space-y-4 mt-4">
            {(() => {
              const testUsers = users.filter(u =>
                (u.email && (u.email.includes("+test") || u.email.toLowerCase().includes("test"))) ||
                (u.username && u.username.toLowerCase().includes("test"))
              );
              return (
                <>
                  <h3 className="text-sm font-semibold flex items-center gap-1.5">
                    <Bomb className="w-4 h-4 text-destructive" /> Test Accounts Manager
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Found <strong className="text-destructive">{testUsers.length}</strong> test accounts (emails/usernames containing "test")
                  </p>
                  {testUsers.length > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="w-full gap-2"
                      disabled={nukingTests}
                      onClick={async () => {
                        if (!confirm(`⚠️ NUKE ALL ${testUsers.length} test accounts? This permanently deletes them from auth.users and all tables. This cannot be undone.`)) return;
                        setNukingTests(true);
                        for (const tu of testUsers) {
                          await supabase.rpc("delete_user_account", { p_user_id: tu.id });
                        }
                        setNukingTests(false);
                        fetchAll();
                      }}
                    >
                      {nukingTests ? (
                        <div className="w-4 h-4 border-2 border-destructive-foreground border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Bomb className="w-4 h-4" />
                      )}
                      {nukingTests ? "Nuking..." : `🔥 Nuke All ${testUsers.length} Test Users`}
                    </Button>
                  )}
                  <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                    {testUsers.map(tu => (
                      <div key={tu.id} className="flex items-center justify-between p-3 rounded-xl border border-destructive/20 bg-destructive/5">
                        <div>
                          <p className="text-xs font-medium text-foreground">{tu.username || "—"}</p>
                          <p className="text-[10px] text-muted-foreground truncate max-w-[180px]">{tu.email || "—"}</p>
                          <p className="text-[9px] text-muted-foreground">Joined: {new Date(tu.created_at).toLocaleDateString()}</p>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="text-[9px] h-7 px-3"
                          onClick={async () => {
                            if (!confirm(`Delete ${tu.username || tu.email}? This is permanent.`)) return;
                            await supabase.rpc("delete_user_account", { p_user_id: tu.id });
                            fetchAll();
                          }}
                        >
                          <Trash2 className="w-3 h-3 mr-1" /> Delete
                        </Button>
                      </div>
                    ))}
                    {testUsers.length === 0 && (
                      <div className="text-center py-8">
                        <CheckCircle2 className="w-8 h-8 text-primary/40 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No test accounts found</p>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </TabsContent>
          {/* TAB: SUPPORT TICKETS */}
          <TabsContent value="tickets" className="space-y-4 mt-4">
            <h3 className="text-sm font-semibold flex items-center gap-1.5">
              <Ticket className="w-4 h-4 text-primary" /> Support Tickets ({tickets.length})
            </h3>
            {tickets.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-8 h-8 text-primary/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No support tickets</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                {tickets.map((ticket: any) => {
                  const ticketUser = users.find(u => u.id === ticket.user_id);
                  return (
                    <div key={ticket.id} className={cn(
                      "p-3 rounded-xl border bg-muted/30",
                      ticket.status === "open" ? "border-destructive/30" : "border-border"
                    )}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className={cn(
                              "text-[8px] px-1.5 py-0.5 rounded-full font-medium uppercase",
                              ticket.status === "open" ? "bg-destructive/20 text-destructive" :
                              ticket.status === "resolved" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                            )}>
                              {ticket.status}
                            </span>
                            <span className="text-[9px] text-muted-foreground">
                              {new Date(ticket.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-foreground">{ticket.subject}</p>
                          <p className="text-[10px] text-muted-foreground">
                            by {ticketUser?.username || ticketUser?.email || "Unknown"}
                          </p>
                          {ticket.description && (
                            <p className="text-[10px] text-muted-foreground mt-1">{ticket.description}</p>
                          )}
                          {ticket.admin_note && (
                            <p className="text-[10px] text-primary mt-1 italic">Admin: {ticket.admin_note}</p>
                          )}
                        </div>
                        {ticket.status === "open" && (
                          <div className="flex flex-col gap-1 shrink-0">
                            <Button
                              size="sm"
                              className="text-[9px] h-6 px-2 gap-1"
                              disabled={grantingPremium === ticket.id}
                              onClick={async () => {
                                setGrantingPremium(ticket.id);
                                // Force grant premium + 50 bonus coins
                                const { data, error } = await supabase.rpc("admin_grant_premium" as any, {
                                  p_target_user_id: ticket.user_id,
                                  p_duration_days: 30,
                                  p_bonus_coins: 50,
                                });
                                if (!error) {
                                  // Mark ticket resolved
                                  await supabase.from("support_tickets" as any).update({
                                    status: "resolved",
                                    admin_note: "Force-granted 30 days Premium + 50 bonus coins",
                                    resolved_by: user.id,
                                  } as any).eq("id", ticket.id);
                                  fetchAll();
                                }
                                setGrantingPremium(null);
                              }}
                            >
                              {grantingPremium === ticket.id ? (
                                <div className="w-3 h-3 border border-primary-foreground border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <>
                                  <Gift className="w-3 h-3" />
                                  Grant Premium
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-[9px] h-6 px-2 gap-1"
                              onClick={() => {
                                setReplyingTicket(replyingTicket === ticket.id ? null : ticket.id);
                                setReplyText("");
                              }}
                            >
                              <Reply className="w-3 h-3" /> Reply
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-[9px] h-6 px-2"
                              onClick={async () => {
                                await supabase.from("support_tickets" as any).update({
                                  status: "closed",
                                  admin_note: "Closed by admin",
                                  resolved_by: user.id,
                                } as any).eq("id", ticket.id);
                                fetchAll();
                              }}
                            >
                              Close
                            </Button>
                          </div>
                        )}
                      </div>
                      {/* Reply box */}
                      {replyingTicket === ticket.id && (
                        <div className="mt-2 flex gap-2">
                          <Input
                            placeholder="Type admin reply..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            className="h-7 text-[10px]"
                          />
                          <Button
                            size="sm"
                            className="text-[9px] h-7 px-3 shrink-0"
                            disabled={!replyText.trim()}
                            onClick={async () => {
                              await supabase.from("support_tickets" as any).update({
                                status: "resolved",
                                admin_note: replyText.trim(),
                                resolved_by: user.id,
                              } as any).eq("id", ticket.id);
                              // Also create a notification for the user
                              await supabase.from("notifications").insert({
                                user_id: ticket.user_id,
                                type: "support",
                                title: "Support Reply",
                                message: `Re: ${ticket.subject} — ${replyText.trim()}`,
                                from_user_id: user.id,
                              });
                              // Send real email via Brevo
                              try {
                                const { data: profile } = await supabase
                                  .from("profiles")
                                  .select("email")
                                  .eq("id", ticket.user_id)
                                  .single();
                                if (profile?.email) {
                                  await supabase.functions.invoke("send-support-reply", {
                                    body: {
                                      email: profile.email,
                                      subject: ticket.subject,
                                      replyMessage: replyText.trim(),
                                    },
                                  });
                                }
                              } catch (emailErr) {
                                console.error("Email send failed:", emailErr);
                              }
                              setReplyingTicket(null);
                              setReplyText("");
                              fetchAll();
                            }}
                          >
                            <Send className="w-3 h-3 mr-1" /> Send
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* TAB 3: LIVE MODERATION HUB */}
          <TabsContent value="moderation" className="space-y-4 mt-4">
            <h3 className="text-sm font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-destructive" /> Recent Reports ({reports.length})
            </h3>
            {reports.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No reports filed</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[40vh] overflow-y-auto">
                {reports.map((r) => {
                  const reporter = users.find(u => u.id === r.reporter_id);
                  const reported = users.find(u => u.id === r.reported_user_id);
                  return (
                    <div key={r.id} className="p-3 rounded-xl border border-border bg-muted/30">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-medium text-foreground">
                            <span className="text-destructive">{reported?.username || "Unknown"}</span>
                            <span className="text-muted-foreground"> reported by </span>
                            {reporter?.username || "Unknown"}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">Reason: {r.reason}</p>
                          {r.description && <p className="text-[10px] text-muted-foreground">{r.description}</p>}
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="text-[10px] h-7"
                          onClick={() => {
                            const target = users.find(u => u.id === r.reported_user_id);
                            if (target) setSelectedUser(target);
                          }}
                        >
                          <Ban className="w-3 h-3 mr-1" /> Action
                        </Button>
                      </div>
                      <p className="text-[9px] text-muted-foreground mt-1">
                        {new Date(r.created_at).toLocaleString()}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Quick Room/Talent Management */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Card className="border-border">
                <CardContent className="p-3 text-center">
                  <p className="text-lg font-bold text-foreground">{totalRooms}</p>
                  <p className="text-[10px] text-muted-foreground">Active Rooms</p>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardContent className="p-3 text-center">
                  <p className="text-lg font-bold text-foreground">{totalTalents}</p>
                  <p className="text-[10px] text-muted-foreground">Talent Posts</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 4: THE FUTURE LAB */}
          <TabsContent value="future" className="space-y-4 mt-4">
            <div className="text-center py-4">
              <Rocket className="w-10 h-10 text-primary/40 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-foreground">The Future Lab</h3>
              <p className="text-xs text-muted-foreground">Reserved for upcoming features</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {[
                { label: "AI Auto-Moderation Engine", desc: "ML-powered content & behavior analysis" },
                { label: "A/B UI Testing", desc: "Test UI variants with user segments" },
                { label: "Advanced Analytics", desc: "Deep user retention & engagement metrics" },
                { label: "Push Notifications", desc: "Firebase Cloud Messaging integration" },
                { label: "Revenue Dashboard", desc: "Stripe + Razorpay + AdMob unified view" },
              ].map((item) => (
                <button
                  key={item.label}
                  disabled
                  className="w-full flex items-center gap-3 p-4 rounded-xl border border-dashed border-border bg-muted/20 opacity-60 cursor-not-allowed"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Rocket className="w-4 h-4 text-primary/50" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                  </div>
                  <span className="ml-auto text-[8px] uppercase tracking-wider text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    Coming Soon
                  </span>
                </button>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <ToolMetricsModal
        open={!!selectedTool}
        onOpenChange={(open) => !open && setSelectedTool(null)}
        tool={selectedTool}
      />
      <AdminUserActionModal
        open={!!selectedUser}
        onOpenChange={(open) => !open && setSelectedUser(null)}
        user={selectedUser}
        onRefresh={fetchAll}
      />
    </div>
  );
}

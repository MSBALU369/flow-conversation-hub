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
  Search, Trash2, Ban,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ToolMetricsModal } from "@/components/admin/ToolMetricsModal";
import { AdminUserActionModal } from "@/components/admin/AdminUserActionModal";

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

  // Guard
  useEffect(() => {
    if (user && !isAdminOrRoot(user.email)) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const fetchAll = async () => {
    if (!user || !isAdminOrRoot(user.email)) return;
    setLoading(true);

    const [usersRes, todayTxRes, monthTxRes, callsRes, roomsRes, talentsRes, reportsRes] = await Promise.all([
      supabase.from("profiles").select("id, username, email, energy_bars, coins, created_at, is_premium, is_banned").order("created_at", { ascending: false }).limit(500),
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
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [user]);

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
        <Tabs defaultValue="health" className="w-full">
          <TabsList className="w-full grid grid-cols-4 h-10 bg-muted/50">
            <TabsTrigger value="health" className="text-[10px] data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
              <Activity className="w-3.5 h-3.5 mr-1" /> Health
            </TabsTrigger>
            <TabsTrigger value="users" className="text-[10px] data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
              <Users className="w-3.5 h-3.5 mr-1" /> Users
            </TabsTrigger>
            <TabsTrigger value="moderation" className="text-[10px] data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
              <Shield className="w-3.5 h-3.5 mr-1" /> Mod
            </TabsTrigger>
            <TabsTrigger value="future" className="text-[10px] data-[state=active]:bg-primary/15 data-[state=active]:text-primary">
              <Rocket className="w-3.5 h-3.5 mr-1" /> Lab
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

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-muted/50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-foreground">{users.length}</p>
                <p className="text-[10px] text-muted-foreground">Users</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-foreground">{premiumCount}</p>
                <p className="text-[10px] text-muted-foreground">Premium</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-3 text-center">
                <p className="text-xl font-bold text-foreground">{freeCount}</p>
                <p className="text-[10px] text-muted-foreground">Free</p>
              </div>
            </div>

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
          </TabsContent>

          {/* TAB 2: DEEP USER MANAGEMENT */}
          <TabsContent value="users" className="space-y-4 mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users by name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="pl-9 h-9 text-sm bg-muted border-border"
              />
            </div>

            <p className="text-xs text-muted-foreground">
              {filteredUsers.length} users found • Click a row for actions
            </p>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="max-h-[50vh] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[10px]">Name</TableHead>
                        <TableHead className="text-[10px]">Email</TableHead>
                        <TableHead className="text-[10px]">⚡</TableHead>
                        <TableHead className="text-[10px]">🪙</TableHead>
                        <TableHead className="text-[10px]">Status</TableHead>
                        <TableHead className="text-[10px]">Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((u) => (
                        <TableRow
                          key={u.id}
                          className="cursor-pointer hover:bg-primary/5 transition-colors"
                          onClick={() => setSelectedUser(u)}
                        >
                          <TableCell className="text-xs font-medium py-2">{u.username || "—"}</TableCell>
                          <TableCell className="text-[10px] text-muted-foreground py-2 max-w-[100px] truncate">{u.email || "—"}</TableCell>
                          <TableCell className="text-xs py-2">{u.energy_bars ?? 0}/7</TableCell>
                          <TableCell className="text-xs py-2">{u.coins ?? 0}</TableCell>
                          <TableCell className="py-2">
                            {u.is_banned ? (
                              <span className="text-[9px] bg-destructive/20 text-destructive px-1.5 py-0.5 rounded font-medium">BANNED</span>
                            ) : u.is_premium ? (
                              <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-medium">PREMIUM</span>
                            ) : (
                              <span className="text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">FREE</span>
                            )}
                          </TableCell>
                          <TableCell className="text-[10px] text-muted-foreground py-2">
                            {new Date(u.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
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

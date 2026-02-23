import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft, Users, DollarSign, Database, Phone, Mail, Crown, AlertTriangle, Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
}

export default function Admin() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [monthEarnings, setMonthEarnings] = useState(0);
  const [premiumCount, setPremiumCount] = useState(0);
  const [freeCount, setFreeCount] = useState(0);
  const [totalCalls, setTotalCalls] = useState(0);

  // Guard
  useEffect(() => {
    if (user && !isAdminOrRoot(user.email)) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  // Fetch data
  useEffect(() => {
    if (!user || !isAdminOrRoot(user.email)) return;

    const fetchAll = async () => {
      setLoading(true);

      // Users
      const { data: usersData } = await supabase
        .from("profiles")
        .select("id, username, email, energy_bars, coins, created_at, is_premium")
        .order("created_at", { ascending: false })
        .limit(200);
      setUsers((usersData as UserRow[]) || []);

      const premium = (usersData || []).filter((u: any) => u.is_premium).length;
      setPremiumCount(premium);
      setFreeCount((usersData || []).length - premium);

      // Earnings from coin_transactions
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const { data: todayTx } = await supabase
        .from("coin_transactions")
        .select("amount")
        .gte("created_at", todayStart)
        .eq("status", "completed");
      setTodayEarnings((todayTx || []).reduce((s: number, t: any) => s + (t.amount || 0), 0));

      const { data: monthTx } = await supabase
        .from("coin_transactions")
        .select("amount")
        .gte("created_at", monthStart)
        .eq("status", "completed");
      setMonthEarnings((monthTx || []).reduce((s: number, t: any) => s + (t.amount || 0), 0));

      // Total calls
      const { count } = await supabase
        .from("calls")
        .select("*", { count: "exact", head: true });
      setTotalCalls(count || 0);

      setLoading(false);
    };

    fetchAll();
  }, [user]);

  if (!user || !isAdminOrRoot(user.email)) return null;

  const usageCards = [
    {
      label: "Supabase DB",
      value: `${users.length} rows (profiles)`,
      percent: Math.min(100, Math.round((users.length / 10000) * 100)),
      icon: Database,
      warn: users.length > 8000,
    },
    {
      label: "LiveKit Calls",
      value: `${totalCalls} total calls`,
      percent: Math.min(100, Math.round((totalCalls / 5000) * 100)),
      icon: Phone,
      warn: totalCalls > 4000,
    },
    {
      label: "Email Quota",
      value: "Tracking N/A",
      percent: 0,
      icon: Mail,
      warn: false,
    },
    {
      label: "Free vs Premium",
      value: `${freeCount} free / ${premiumCount} premium`,
      percent: users.length > 0 ? Math.round((premiumCount / users.length) * 100) : 0,
      icon: Crown,
      warn: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground pb-8">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate("/")} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-bold">Quantum Control Tower</h1>
          <p className="text-[10px] text-muted-foreground">Admin Dashboard • {user.email}</p>
        </div>
      </header>

      <div className="px-4 space-y-5 mt-4">
        {/* Earnings Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="p-3 pb-1">
              <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5" /> Today
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
                <DollarSign className="w-3.5 h-3.5" /> This Month
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <p className="text-2xl font-bold text-primary">{monthEarnings}</p>
              <p className="text-[10px] text-muted-foreground">coins transacted</p>
            </CardContent>
          </Card>
        </div>

        {/* Tool Usage / Health Hub */}
        <div>
          <h2 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-primary" /> Health Hub — Usage Monitoring
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {usageCards.map((c) => (
              <Card key={c.label} className={cn("relative overflow-hidden", c.warn && "border-destructive/50")}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <c.icon className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-[11px] font-medium">{c.label}</span>
                    {c.warn && <AlertTriangle className="w-3 h-3 text-destructive ml-auto" />}
                  </div>
                  <p className="text-xs text-muted-foreground">{c.value}</p>
                  <div className="w-full h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        c.percent > 80 ? "bg-destructive" : "bg-primary"
                      )}
                      style={{ width: `${c.percent}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* User Table */}
        <div>
          <h2 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-primary" /> All Users ({users.length})
          </h2>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[10px]">Name</TableHead>
                    <TableHead className="text-[10px]">Email</TableHead>
                    <TableHead className="text-[10px]">Energy</TableHead>
                    <TableHead className="text-[10px]">Coins</TableHead>
                    <TableHead className="text-[10px]">Joined</TableHead>
                    <TableHead className="text-[10px]">Insights</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="text-xs font-medium py-2">{u.username || "—"}</TableCell>
                      <TableCell className="text-[10px] text-muted-foreground py-2 max-w-[120px] truncate">{u.email || "—"}</TableCell>
                      <TableCell className="text-xs py-2">{u.energy_bars ?? 0}/7</TableCell>
                      <TableCell className="text-xs py-2">🪙 {u.coins ?? 0}</TableCell>
                      <TableCell className="text-[10px] text-muted-foreground py-2">
                        {new Date(u.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-[10px] text-muted-foreground py-2 italic">Coming Soon</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

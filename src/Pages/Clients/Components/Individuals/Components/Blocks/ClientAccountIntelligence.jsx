/* eslint-disable react/prop-types */
import { useMemo, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  Activity,
  TrendingUp,
  Banknote,
  PieChart as PieIcon,
  Gauge,
  RefreshCw,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  CreditCard,
  HeartPulse,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  Legend,
  Brush,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { cn } from "@/lib/utils";
import IntelligenceCRBPanel from "./IntelligenceCRBPanel";

const C = {
  primary: "hsl(var(--primary))",
  grid: "hsl(var(--border))",
  axis: "hsl(var(--muted-foreground))",
  text: "hsl(var(--foreground))",
  deposit: "#16a34a",
  withdraw: "#ef4444",
  net: "#0ea5e9",
  balance: "#8b5cf6",
  frozen: "#f59e0b",
  arrears: "#ef4444",
  exposure: "#3b82f6",
};

const PIE_COLORS = ["#16a34a", "#f59e0b", "#3b82f6", "#ef4444", "#8b5cf6", "#64748b"];

const fmt = (v) => Intl.NumberFormat("en-UG").format(v ?? 0);
const fmtCurrency = (v) => `UGX ${fmt(v)}`;


/* ─── helpers ── */
function Tip({ active, label, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover p-2 text-popover-foreground shadow-sm text-xs">
      {label && <div className="mb-1 font-medium">{label}</div>}
      <div className="space-y-0.5">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-sm" style={{ background: p.color }} />
              {p.name}
            </span>
            <span className="tabular-nums font-medium">{fmt(p.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Kpi({ title, value, hint, icon, children, className }) {
  return (
    <Card className={cn("shadow-sm", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <span className="text-muted-foreground">{icon}</span>
        </div>
      </CardHeader>
      <CardContent>
        {children ?? (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Health gauge — SVG semicircle ── */
function HealthGauge({ score = 0, label = "" }) {
  const r            = 80;
  const circumference = Math.PI * r;
  const clamped      = Math.max(0, Math.min(100, score));
  const offset       = circumference * (1 - clamped / 100);
  const color =
    score >= 80 ? "#16a34a" :
    score >= 60 ? "#2563eb" :
    score >= 40 ? "#d97706" :
    "#dc2626";
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 110" className="w-44">
        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="hsl(var(--muted))" strokeWidth={14} strokeLinecap="round" />
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none" stroke={color} strokeWidth={14} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.7s ease" }}
        />
        <text x={100} y={86} textAnchor="middle" fontSize={30} fontWeight="bold" fill={color}>{score}</text>
        <text x={100} y={103} textAnchor="middle" fontSize={12} fill="hsl(var(--muted-foreground))">{label}</text>
      </svg>
      <div className="flex justify-between w-44 -mt-1 px-3">
        <span className="text-[11px] text-muted-foreground">0</span>
        <span className="text-[11px] text-muted-foreground">100</span>
      </div>
    </div>
  );
}

/* ── Single rated percentage bar ── */
function RatingBar({ label, value = 0, weight, hint }) {
  const color =
    value >= 80 ? "bg-green-500" :
    value >= 60 ? "bg-blue-500" :
    value >= 40 ? "bg-amber-500" :
    "bg-red-500";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">{label}</span>
        <div className="flex items-center gap-2">
          {weight && <span className="text-[10px] text-muted-foreground">{weight}% weight</span>}
          <span className={`text-sm font-bold ${value >= 80 ? "text-green-600" : value >= 60 ? "text-blue-600" : value >= 40 ? "text-amber-600" : "text-red-600"}`}>
            {value}%
          </span>
        </div>
      </div>
      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-700`}
          style={{ width: `${value}%` }}
        />
      </div>
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function AccountsTable({ accounts = [] }) {
  const totalBalance = accounts.reduce((s, a) => s + (a.balance ?? 0), 0);
  const totalFrozen  = accounts.reduce((s, a) => s + (a.frozen  ?? 0), 0);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-muted-foreground text-xs">
            <th className="px-3 py-2 text-left font-medium">Product</th>
            <th className="px-3 py-2 text-right font-medium">Balance</th>
            <th className="px-3 py-2 text-right font-medium">Frozen</th>
            <th className="px-3 py-2 text-right font-medium">Available</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((a, i) => {
            const available = (a.balance ?? 0) - (a.frozen ?? 0);
            return (
              <tr key={i} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                <td className="px-3 py-2 text-xs font-medium">{a.product_name}</td>
                <td className="px-3 py-2 text-right tabular-nums text-xs">{fmt(a.balance)}</td>
                <td className="px-3 py-2 text-right tabular-nums text-xs text-amber-600">{fmt(a.frozen)}</td>
                <td className={`px-3 py-2 text-right tabular-nums text-xs font-semibold ${available < 0 ? "text-red-600" : "text-emerald-700"}`}>
                  {fmt(available)}
                </td>
              </tr>
            );
          })}
          {!accounts.length && (
            <tr>
              <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground text-sm">
                No active accounts.
              </td>
            </tr>
          )}
        </tbody>
        {accounts.length > 0 && (
          <tfoot>
            <tr className="border-t bg-muted/20 text-xs font-semibold">
              <td className="px-3 py-2 text-muted-foreground">Total</td>
              <td className="px-3 py-2 text-right tabular-nums">{fmt(totalBalance)}</td>
              <td className="px-3 py-2 text-right tabular-nums text-amber-600">{fmt(totalFrozen)}</td>
              <td className={`px-3 py-2 text-right tabular-nums ${(totalBalance - totalFrozen) < 0 ? "text-red-600" : "text-emerald-700"}`}>
                {fmt(totalBalance - totalFrozen)}
              </td>
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}


/* ── Main Component ── */
export default function ClientAccountIntelligence({ clientId, windowDays = 90 }) {
  const axios = useAxiosPrivate();
  const [activeSection, setActiveSection] = useState("analytics");

  const { data, error, isLoading, isFetched, isFetching, refetch } = useQuery({
    queryKey: ["client-intelligence-adv", clientId, windowDays],
    queryFn: async () => {
      const res = await axios.get(`/analytics/client`, {
        params: { client_id: clientId, window_days: windowDays },
      });
      return res.data?.data ?? res.data;
    },
    enabled: !!clientId,
    staleTime: 60_000,
    retry: (c, e) => {
      const s = e?.response?.status;
      if (s && s >= 400 && s < 500 && s !== 429) return false;
      return c < 2;
    },
  });

  const {
    kpis = {},
    series = {},
    accounts = [],
    loans = {},
    alerts = [],
    shares = {},
    internal_transfers = {},
    health_meter: health = {},
  } = data || {};

  const netCumulative = useMemo(() => {
    let run = 0;
    return (series.dates || []).map((d, i) => {
      run += series.net?.[i] || 0;
      return { date: d, Net: run };
    });
  }, [series]);

  const flowDaily = useMemo(() => {
    return (series.dates || []).map((d, i) => ({
      date: d,
      Deposits: series.deposit?.[i] || 0,
      Withdrawals: series.withdrawal?.[i] || 0,
    }));
  }, [series]);

  const exposureBar = useMemo(() => {
    const e = kpis.exposure || {};
    return [{
      name: "Now",
      Exposure: e.exposure_total || 0,
      Arrears: e.arrears || 0,
      DueToday: e.due_today || 0,
      Future: e.future_due || 0,
      Penalties: e.penalties_due || 0,
    }];
  }, [kpis]);

  const loanStatus = loans.by_status || [];
  const productMix = loans.product_mix || [];
  const lx = kpis.exposure || {};

  if (!clientId) return null;

  return (
    <div className="space-y-4 p-1">
      {/* Section switcher */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          <button
            onClick={() => setActiveSection("analytics")}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
              activeSection === "analytics"
                ? "bg-background shadow text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveSection("crb")}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
              activeSection === "crb"
                ? "bg-background shadow text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            CRB Reports
          </button>
        </div>

        {activeSection === "analytics" && (
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? (
              <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Refreshing</>
            ) : (
              <><RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh</>
            )}
          </Button>
        )}
      </div>

      {/* ── CRB Section ── */}
      {activeSection === "crb" && <IntelligenceCRBPanel entityType={0} />}

      {/* ── Analytics Section ── */}
      {activeSection === "analytics" && (
        <>
          {isLoading && !isFetched ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="shadow-sm">
                  <CardHeader><Skeleton className="h-4 w-24" /></CardHeader>
                  <CardContent><Skeleton className="h-8 w-20" /></CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <Card className="border-destructive/30">
              <CardHeader>
                <CardTitle className="text-destructive text-base">Analytics unavailable</CardTitle>
                <CardDescription>
                  {error?.response?.data?.messages?.[0] ?? error?.message ?? "Failed to load"}
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button size="sm" onClick={() => refetch()} disabled={isFetching}>Retry</Button>
              </CardFooter>
            </Card>
          ) : (
            <>
              {/* KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                <Kpi
                  title="Open Accounts"
                  value={kpis?.accounts?.accounts_open ?? 0}
                  hint="Active savings accounts"
                  icon={<Banknote className="h-4 w-4" />}
                />
                <Kpi
                  title="Total Balance"
                  value={fmtCurrency(kpis?.accounts?.total_balance ?? 0)}
                  hint={`Frozen: ${fmtCurrency(kpis?.accounts?.total_frozen ?? 0)}`}
                  icon={<TrendingUp className="h-4 w-4" />}
                  className="border-blue-200 dark:border-blue-800"
                />
                <Kpi
                  title="Open Loans"
                  value={kpis?.open_loans ?? 0}
                  hint={`${kpis?.times_borrowed ?? 0} total loans taken`}
                  icon={<CreditCard className="h-4 w-4" />}
                  className="border-violet-200 dark:border-violet-800"
                />
                <Kpi
                  title="Loan Exposure"
                  value={fmtCurrency(kpis?.exposure?.exposure_total ?? 0)}
                  hint={`Arrears: ${fmtCurrency(kpis?.exposure?.arrears ?? 0)}`}
                  icon={<Gauge className="h-4 w-4" />}
                  className="border-amber-200 dark:border-amber-800"
                />
                <Kpi
                  title="Approval Rate"
                  value={`${kpis?.approval_rate_all ?? 0}%`}
                  hint={`Window: ${kpis?.approval_rate_win ?? 0}%`}
                  icon={<TrendingUp className="h-4 w-4" />}
                />
                <Kpi
                  title="Fixed Deposits"
                  value={fmtCurrency(kpis?.accounts?.fixed_deposits ?? 0)}
                  hint="Locked savings"
                  icon={<Activity className="h-4 w-4" />}
                />
                <Kpi
                  title="DPD (Avg / Max)"
                  value={`${lx?.avg_dpd ?? 0} / ${lx?.max_dpd ?? 0}`}
                  hint={`Arrears ratio: ${((lx?.arrears_ratio ?? 0) * 100).toFixed(1)}%`}
                  icon={<AlertTriangle className="h-4 w-4" />}
                  className={(lx?.avg_dpd ?? 0) > 30 ? "border-red-200 dark:border-red-800" : ""}
                />
                <Kpi
                  title="CRB Checks"
                  value={kpis?.crb_checks ?? 0}
                  hint="Credit bureau enquiries"
                  icon={<ShieldCheck className="h-4 w-4" />}
                />
              </div>

              {/* Health Meter */}
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <HeartPulse className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-sm font-semibold">Client Health Meter</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Composite score across on-time payments, savings culture, portfolio quality &amp; repayment activity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row items-center gap-8">
                    <HealthGauge score={health?.score ?? 0} label={health?.label ?? "—"} />
                    <div className="flex-1 w-full space-y-4">
                      <RatingBar
                        label="On-time Payment Rate"
                        value={health?.on_time_rate ?? 0}
                        weight={40}
                        hint={`${health?.paid_on_time ?? 0} of ${health?.total_past_due ?? 0} past-due schedules paid on time · ${health?.missed_payments ?? 0} missed`}
                      />
                      <RatingBar
                        label="Savings Culture"
                        value={health?.savings_culture ?? 0}
                        weight={25}
                        hint="% of active months with at least one deposit"
                      />
                      <RatingBar
                        label="Portfolio Quality"
                        value={health?.portfolio_quality ?? 0}
                        weight={20}
                        hint="100% minus arrears ratio — how much of outstanding is current"
                      />
                      <RatingBar
                        label="Repayment Activity"
                        value={health?.repayment_activity ?? 0}
                        weight={15}
                        hint="Repayments made in the selected window vs current exposure"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Exposure & DPD */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Loan Exposure Snapshot</CardTitle>
                    <CardDescription className="text-xs">Exposure vs Arrears / Due / Penalties</CardDescription>
                  </CardHeader>
                  <CardContent className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={exposureBar}>
                        <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
                        <XAxis dataKey="name" tick={{ fill: C.axis, fontSize: 11 }} />
                        <YAxis tick={{ fill: C.axis, fontSize: 11 }} />
                        <RTooltip content={<Tip />} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Bar radius={[4, 4, 0, 0]} dataKey="Exposure" fill={C.exposure} />
                        <Bar radius={[4, 4, 0, 0]} dataKey="Arrears" fill={C.arrears} />
                        <Bar radius={[4, 4, 0, 0]} dataKey="DueToday" fill={C.frozen} />
                        <Bar radius={[4, 4, 0, 0]} dataKey="Future" fill={C.net} />
                        <Bar radius={[4, 4, 0, 0]} dataKey="Penalties" fill="#dc2626" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Window Repayments</CardTitle>
                    <CardDescription className="text-xs">Principal / Interest / Penalty collected in window</CardDescription>
                  </CardHeader>
                  <CardContent className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[kpis?.window_paid || {}]}>
                        <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
                        <XAxis dataKey={() => "Window"} tick={{ fill: C.axis, fontSize: 11 }} />
                        <YAxis tick={{ fill: C.axis, fontSize: 11 }} />
                        <RTooltip content={<Tip />} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="principal" name="Principal" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="interest" name="Interest" fill="#16a34a" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="penalty" name="Penalty" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="monitoring" name="Monitoring" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Cash flow */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Cumulative Net Flow</CardTitle>
                    <CardDescription className="text-xs">Deposits − Withdrawals over time</CardDescription>
                  </CardHeader>
                  <CardContent className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={netCumulative}>
                        <defs>
                          <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={C.net} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={C.net} stopOpacity={0.04} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
                        <XAxis dataKey="date" tick={{ fill: C.axis, fontSize: 10 }} />
                        <YAxis tick={{ fill: C.axis, fontSize: 10 }} />
                        <RTooltip content={<Tip />} />
                        <Area type="monotone" dataKey="Net" stroke={C.net} strokeWidth={2} fill="url(#netGrad)" activeDot={{ r: 4 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Daily Deposits vs Withdrawals</CardTitle>
                    <CardDescription className="text-xs">Activity mix (zoomable)</CardDescription>
                  </CardHeader>
                  <CardContent className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={flowDaily}>
                        <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
                        <XAxis dataKey="date" tick={{ fill: C.axis, fontSize: 10 }} />
                        <YAxis tick={{ fill: C.axis, fontSize: 10 }} />
                        <RTooltip content={<Tip />} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="Deposits" fill={C.deposit} radius={[3, 3, 0, 0]} />
                        <Bar dataKey="Withdrawals" fill={C.withdraw} radius={[3, 3, 0, 0]} />
                        <Brush dataKey="date" height={18} stroke={C.axis} travellerWidth={6} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Loans + Accounts + Signals */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <Card className="lg:col-span-5 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Loan Status</CardTitle>
                    <CardDescription className="text-xs">All-time distribution</CardDescription>
                  </CardHeader>
                  <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <RTooltip />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Pie data={loanStatus} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={3}>
                          {loanStatus.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-7 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Loan Product Mix</CardTitle>
                    <CardDescription className="text-xs">Applications by product type</CardDescription>
                  </CardHeader>
                  <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={productMix}>
                        <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
                        <XAxis dataKey="name" tick={{ fill: C.axis, fontSize: 11 }} />
                        <YAxis tick={{ fill: C.axis, fontSize: 11 }} allowDecimals={false} />
                        <RTooltip content={<Tip />} />
                        <Bar dataKey="value" name="Applications" fill={C.primary} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <Card className="lg:col-span-7 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Open Accounts</CardTitle>
                    <CardDescription className="text-xs">Current balances</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AccountsTable accounts={accounts} />
                  </CardContent>
                </Card>

                <Card className="lg:col-span-5 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Signals &amp; Alerts</CardTitle>
                    <CardDescription className="text-xs">Watch list</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {!alerts?.length && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        No active alerts.
                      </div>
                    )}
                    {alerts?.map((a, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-lg border p-2.5 bg-amber-50 border-amber-200">
                        <AlertTriangle className={cn("h-4 w-4 shrink-0", a.includes("30 DPD") ? "text-destructive" : "text-amber-600")} />
                        <span className="text-xs font-medium">{a}</span>
                      </div>
                    ))}
                    <div className="text-xs text-muted-foreground pt-2 border-t">
                      <p>Shares: {fmt(shares?.count || 0)} ops · {fmt(shares?.units || 0)} units</p>
                      <p>Internal transfers: {fmt(internal_transfers?.count || 0)} ops · {fmtCurrency(internal_transfers?.sum || 0)}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

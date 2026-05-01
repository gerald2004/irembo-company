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

function AccountsTable({ accounts = [] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-muted-foreground text-xs">
            <th className="px-3 py-2 text-left font-medium">Account No</th>
            <th className="px-3 py-2 text-left font-medium">Product</th>
            <th className="px-3 py-2 text-right font-medium">Balance</th>
            <th className="px-3 py-2 text-right font-medium">Frozen</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((a, i) => (
            <tr key={i} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
              <td className="px-3 py-2 font-mono text-xs">{a.account_no}</td>
              <td className="px-3 py-2">{a.product_name}</td>
              <td className="px-3 py-2 text-right tabular-nums">{fmt(a.balance)}</td>
              <td className="px-3 py-2 text-right tabular-nums text-amber-600">{fmt(a.frozen)}</td>
            </tr>
          ))}
          {!accounts.length && (
            <tr>
              <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground text-sm">
                No active accounts.
              </td>
            </tr>
          )}
        </tbody>
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
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className={cn("shadow-sm", i < 4 ? "" : "col-span-2")}>
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
              <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
                <Kpi title="Accounts Open" value={kpis?.accounts?.accounts_open ?? 0} icon={<Banknote className="h-4 w-4" />} />
                <Kpi
                  title="Total Balance"
                  value={fmtCurrency(kpis?.accounts?.total_balance ?? 0)}
                  hint="All savings"
                  icon={<TrendingUp className="h-4 w-4" />}
                />
                <Kpi
                  title="Frozen"
                  value={fmtCurrency(kpis?.accounts?.total_frozen ?? 0)}
                  hint={`Fixed: ${fmtCurrency(kpis?.accounts?.fixed_deposits ?? 0)}`}
                  icon={<Activity className="h-4 w-4" />}
                />
                <Kpi
                  title="Open Loans"
                  value={kpis?.open_loans ?? 0}
                  hint="Active exposure"
                  icon={<Gauge className="h-4 w-4" />}
                />
                <Kpi
                  title="Times Borrowed"
                  value={kpis?.times_borrowed ?? 0}
                  icon={<PieIcon className="h-4 w-4" />}
                />
                <Kpi
                  title="Approval Rate"
                  value={`${kpis?.approval_rate_all ?? 0}%`}
                  hint={`Window: ${kpis?.approval_rate_win ?? 0}%`}
                  icon={<TrendingUp className="h-4 w-4" />}
                />
              </div>

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
                    <CardTitle className="text-sm font-semibold">DPD &amp; Window Repayments</CardTitle>
                    <CardDescription className="text-xs">Avg / Max DPD and repayment mix</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div className="bg-muted/40 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground">Avg DPD</p>
                        <p className="text-xl font-bold">{lx?.avg_dpd ?? 0}</p>
                      </div>
                      <div className="bg-muted/40 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground">Max DPD</p>
                        <p className="text-xl font-bold">{lx?.max_dpd ?? 0}</p>
                      </div>
                      <div className="bg-muted/40 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground">Arrears Ratio</p>
                        <p className="text-xl font-bold">{((lx?.arrears_ratio ?? 0) * 100).toFixed(1)}%</p>
                      </div>
                    </div>
                    <div className="h-32">
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
                    </div>
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

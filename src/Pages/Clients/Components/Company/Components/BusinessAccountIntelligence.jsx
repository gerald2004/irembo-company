/* eslint-disable react/prop-types */
import { useMemo, useState } from "react";
import {
  Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity, TrendingUp, Banknote, Gauge, PieChart as PieIcon,
  RefreshCw, Loader2, CheckCircle2, AlertTriangle, Brain,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, Legend, Brush,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { cn } from "@/lib/utils";
import IntelligenceCRBPanel from "../../Individuals/Components/Blocks/IntelligenceCRBPanel";

const C = {
  primary: "hsl(var(--primary))",
  grid:    "hsl(var(--border))",
  axis:    "hsl(var(--muted-foreground))",
  deposit:  "#16a34a",
  withdraw: "#ef4444",
  net:      "#0ea5e9",
  exposure: "#3b82f6",
  arrears:  "#ef4444",
  frozen:   "#f59e0b",
};
const PIE_COLORS = ["#16a34a", "#f59e0b", "#3b82f6", "#ef4444", "#8b5cf6", "#64748b"];

const fmt          = (v) => Intl.NumberFormat("en-UG").format(v ?? 0);
const fmtCurrency  = (v) => `UGX ${fmt(v)}`;

function Tip({ active, label, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover p-2 text-popover-foreground shadow-sm text-xs">
      {label && <div className="mb-1 font-medium">{label}</div>}
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
  );
}

function Kpi({ title, value, hint, icon }) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <span className="text-muted-foreground">{icon}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export default function BusinessAccountIntelligence({ clientId, companyRegNo, windowDays = 90 }) {
  const axios = useAxiosPrivate();
  const [activeSection, setActiveSection] = useState("analytics");

  const { data, error, isLoading, isFetched, isFetching, refetch } = useQuery({
    queryKey: ["business-intelligence", clientId, windowDays],
    queryFn: async () => {
      const res = await axios.get("/analytics/client", {
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
  } = data || {};

  const netCumulative = useMemo(() => {
    let run = 0;
    return (series.dates || []).map((d, i) => {
      run += series.net?.[i] || 0;
      return { date: d, Net: run };
    });
  }, [series]);

  const flowDaily = useMemo(() => (series.dates || []).map((d, i) => ({
    date: d,
    Deposits: series.deposit?.[i] || 0,
    Withdrawals: series.withdrawal?.[i] || 0,
  })), [series]);

  const loanStatus  = loans.by_status  || [];
  const productMix  = loans.product_mix || [];
  const lx          = kpis.exposure    || {};

  if (!clientId) return null;

  return (
    <div className="space-y-4 p-1">
      {/* Section switcher */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {[
            { id: "analytics", label: "Analytics" },
            { id: "crb",       label: "CRB Checks" },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={cn(
                "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
                activeSection === s.id
                  ? "bg-background shadow text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        {activeSection === "analytics" && (
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            {isFetching
              ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> Refreshing</>
              : <><RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh</>}
          </Button>
        )}
      </div>

      {/* ── CRB Section ── */}
      {activeSection === "crb" && (
        <IntelligenceCRBPanel
          entityType={1}
          prefillCompanyReg={companyRegNo}
        />
      )}

      {/* ── Analytics Section ── */}
      {activeSection === "analytics" && (
        <>
          {isLoading && !isFetched ? (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-28 rounded-xl" />
              ))}
            </div>
          ) : error ? (
            <Card className="border-destructive/30">
              <CardHeader>
                <CardTitle className="text-destructive text-base flex items-center gap-2">
                  <Brain className="w-4 h-4" /> Analytics unavailable
                </CardTitle>
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
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                <Kpi title="Accounts" value={kpis?.accounts?.accounts_open ?? 0} icon={<Banknote className="h-4 w-4" />} />
                <Kpi title="Total Balance" value={fmtCurrency(kpis?.accounts?.total_balance ?? 0)} icon={<TrendingUp className="h-4 w-4" />} />
                <Kpi title="Frozen" value={fmtCurrency(kpis?.accounts?.total_frozen ?? 0)} icon={<Activity className="h-4 w-4" />} />
                <Kpi title="Open Loans" value={kpis?.open_loans ?? 0} icon={<Gauge className="h-4 w-4" />} />
                <Kpi title="Approval Rate" value={`${kpis?.approval_rate_all ?? 0}%`} icon={<PieIcon className="h-4 w-4" />} />
              </div>

              {/* Exposure row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Exposure",   value: lx.exposure_total, color: "text-blue-600"  },
                  { label: "Arrears",    value: lx.arrears,        color: "text-red-600"   },
                  { label: "Avg DPD",    value: lx.avg_dpd,        color: "text-amber-600" },
                ].map((item) => (
                  <div key={item.label} className="bg-muted/40 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className={cn("text-lg font-bold", item.color)}>
                      {item.label === "Avg DPD" ? (item.value ?? 0) : fmtCurrency(item.value ?? 0)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Cumulative Net Flow</CardTitle>
                    <CardDescription className="text-xs">Deposits − Withdrawals over {windowDays}d</CardDescription>
                  </CardHeader>
                  <CardContent className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={netCumulative}>
                        <defs>
                          <linearGradient id="bizNetGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={C.net} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={C.net} stopOpacity={0.04} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
                        <XAxis dataKey="date" tick={{ fill: C.axis, fontSize: 10 }} />
                        <YAxis tick={{ fill: C.axis, fontSize: 10 }} />
                        <RTooltip content={<Tip />} />
                        <Area type="monotone" dataKey="Net" stroke={C.net} strokeWidth={2} fill="url(#bizNetGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Daily Activity</CardTitle>
                    <CardDescription className="text-xs">Deposits vs Withdrawals</CardDescription>
                  </CardHeader>
                  <CardContent className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={flowDaily}>
                        <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
                        <XAxis dataKey="date" tick={{ fill: C.axis, fontSize: 10 }} />
                        <YAxis tick={{ fill: C.axis, fontSize: 10 }} />
                        <RTooltip content={<Tip />} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Bar dataKey="Deposits"    fill={C.deposit}  radius={[3, 3, 0, 0]} />
                        <Bar dataKey="Withdrawals" fill={C.withdraw} radius={[3, 3, 0, 0]} />
                        <Brush dataKey="date" height={16} stroke={C.axis} travellerWidth={5} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Loan mix + Alerts */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <Card className="lg:col-span-5 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Loan Status</CardTitle>
                  </CardHeader>
                  <CardContent className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <RTooltip />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Pie data={loanStatus} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} paddingAngle={3}>
                          {loanStatus.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-7 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Loan Product Mix</CardTitle>
                  </CardHeader>
                  <CardContent className="h-56">
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

              {/* Alerts */}
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Signals &amp; Alerts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {!alerts?.length ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" /> No active alerts.
                    </div>
                  ) : alerts.map((a, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg border p-2.5 bg-amber-50 border-amber-200">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                      <span className="text-xs font-medium">{a}</span>
                    </div>
                  ))}

                  {/* Accounts table */}
                  {accounts.length > 0 && (
                    <div className="overflow-x-auto mt-3 border rounded-md">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-muted-foreground text-xs">
                            <th className="px-3 py-2 text-left">Account No</th>
                            <th className="px-3 py-2 text-left">Product</th>
                            <th className="px-3 py-2 text-right">Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {accounts.map((a, i) => (
                            <tr key={i} className="border-b last:border-0 hover:bg-muted/30">
                              <td className="px-3 py-2 font-mono text-xs">{a.account_no}</td>
                              <td className="px-3 py-2">{a.product_name}</td>
                              <td className="px-3 py-2 text-right tabular-nums">{fmt(a.balance)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}

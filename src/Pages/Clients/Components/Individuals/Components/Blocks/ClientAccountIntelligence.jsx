/* eslint-disable react/prop-types */
import { useMemo, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Activity,
  TrendingUp,
  Banknote,
  FileText,
  PieChart as PieIcon,
  Gauge,
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
import { useQuery, useMutation } from "@tanstack/react-query";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { cn } from "@/lib/utils";

/* shadcn-aware palette */
const C = {
  primary: "hsl(var(--primary))",
  grid: "hsl(var(--border))",
  axis: "hsl(var(--muted-foreground))",
  text: "hsl(var(--foreground))",
  deposit: "hsl(var(--green-foreground, 142 72% 35%))",
  withdraw: "hsl(var(--red-foreground,   0 84% 60%))",
  net: "hsl(var(--sky-foreground, 199 89% 48%))",
  balance: "hsl(var(--violet-foreground, 262 83% 58%))",
  frozen: "hsl(var(--amber-foreground, 37 92% 50%))",
  arrears: "hsl(0 84% 60%)",
  exposure: "hsl(217 91% 60%)",
};
const fmt = (v) => Intl.NumberFormat().format(v ?? 0);

/* API */
async function fetchClientIntel(axios, clientId, windowDays) {
  const res = await axios.get(`/analytics/client`, {
    params: { client_id: clientId, window_days: windowDays },
  });
  return res.data?.data ?? res.data;
}
async function runCrb(axios, clientId) {
  const res = await axios.post(`/crb/report`, { client_id: clientId });
  return res.data?.data ?? res.data;
}

/* Tooltip */
function Tip({ active, label, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover p-2 text-popover-foreground shadow-sm text-xs">
      {label && <div className="mb-1 font-medium">{label}</div>}
      <div className="space-y-0.5">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2">
              <span
                className="inline-block h-2 w-2 rounded-sm"
                style={{ background: p.color }}
              />
              {p.name}
            </span>
            <span className="tabular-nums">{fmt(p.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Simple table */
function AccountsTable({ accounts = [] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-muted-foreground">
          <tr className="border-b">
            <th className="px-3 py-2 text-left">Account No</th>
            <th className="px-3 py-2 text-left">Product</th>
            <th className="px-3 py-2 text-right">Balance</th>
            <th className="px-3 py-2 text-right">Frozen</th>
          </tr>
        </thead>
        <tbody>
          {accounts.map((a) => (
            <tr key={a.account_id} className="border-b last:border-0">
              <td className="px-3 py-2">{a.account_no}</td>
              <td className="px-3 py-2">{a.product_name}</td>
              <td className="px-3 py-2 text-right">{fmt(a.balance)}</td>
              <td className="px-3 py-2 text-right">{fmt(a.frozen)}</td>
            </tr>
          ))}
          {!accounts.length && (
            <tr>
              <td className="px-3 py-3 text-muted-foreground" colSpan={4}>
                No active accounts.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/* KPI */
function Kpi({ title, value, hint, icon, children }) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          <span className="text-muted-foreground">{icon}</span>
        </div>
        {hint && <CardDescription>{hint}</CardDescription>}
      </CardHeader>
      <CardContent>
        {children ?? <div className="text-2xl font-bold">{value}</div>}
      </CardContent>
    </Card>
  );
}

export default function ClientAccountIntelligence({
  clientId,
  windowDays = 90,
}) {
  const axios = useAxiosPrivate();
  const [pieColors] = useState([
    "#16a34a",
    "#f59e0b",
    "#3b82f6",
    "#ef4444",
    "#8b5cf6",
    "#64748b",
  ]);

  const { data, error, isLoading, isFetched, isFetching, refetch } = useQuery({
    queryKey: ["client-intelligence-adv", clientId, windowDays],
    queryFn: () => fetchClientIntel(axios, clientId, windowDays),
    enabled: !!clientId,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: (c, e) => {
      const s = e?.response?.status;
      if (s && s >= 400 && s < 500 && s !== 429) return false;
      return c < 2;
    },
  });

  const crbMutation = useMutation({
    mutationFn: () => runCrb(axios, clientId),
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
  const name = data?.client?.name;

  // derived charts
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

  // eslint-disable-next-line no-unused-vars
  const balancesBars = useMemo(() => {
    return accounts.map((a) => ({
      name: a.account_no,
      Balance: a.balance,
      Frozen: a.frozen,
    }));
  }, [accounts]);

  const exposureBar = useMemo(() => {
    const e = kpis.exposure || {};
    return [
      {
        name: "Now",
        Exposure: e.exposure_total || 0,
        Arrears: e.arrears || 0,
        DueToday: e.due_today || 0,
        Future: e.future_due || 0,
        Penalties: e.penalties_due || 0,
      },
    ];
  }, [kpis]);

  // ui flow
  if (!clientId) {
    return (
      <Card className="shadow-sm border-amber-200">
        <CardHeader>
          <CardTitle>Client MIS Analytics</CardTitle>
          <CardDescription>
            Provide a valid client ID to load analytics.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Example: {"<ClientAccountIntelligence clientId={123} />"}
          </p>
        </CardContent>
      </Card>
    );
  }
  if (isLoading && !isFetched) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card
            key={i}
            className={cn(
              "shadow-sm",
              i < 4 ? "lg:col-span-3" : "lg:col-span-6"
            )}
          >
            <CardHeader>
              <CardTitle className="h-5 w-1/2 bg-muted rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-24 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  if (error) {
    const msg =
      error?.response?.data?.messages ||
      error?.response?.data?.message ||
      error?.message ||
      "Failed to load analytics";
    return (
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">
            Unable to load client analytics
          </CardTitle>
          <CardDescription>{String(msg)}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? "Retrying..." : "Retry"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const lx = kpis.exposure || {};
  const loanStatus = loans.by_status || [];
  const productMix = loans.product_mix || [];

  return (
    <div className="space-y-4">
      {/* Header + actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            {name || "Client"}
          </h2>
          <p className="text-sm text-muted-foreground">
            Window: last {windowDays} days • Last activity:{" "}
            {kpis?.last_active || "—"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching ? "Refreshing…" : "Refresh"}
          </Button>
          <Button
            onClick={() => crbMutation.mutate()}
            disabled={crbMutation.isPending}
          >
            <FileText className="h-4 w-4 mr-1" />{" "}
            {crbMutation.isPending ? "Running…" : "Run CRB Report"}
          </Button>
        </div>
      </div>

      {/* KPIs — Accounts + Loans */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Kpi
          title="Accounts Open"
          value={kpis?.accounts?.accounts_open ?? 0}
          icon={<Banknote className="h-4 w-4" />}
        />
        <Kpi
          title="Total Balance"
          value={fmt(kpis?.accounts?.total_balance ?? 0)}
          hint="All savings"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <Kpi
          title="Frozen / Fixed"
          value={`${fmt(kpis?.accounts?.total_frozen ?? 0)} / ${fmt(
            kpis?.accounts?.fixed_deposits ?? 0
          )}`}
          hint="Locked / FD"
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
          hint="Total disbursed"
          icon={<PieIcon className="h-4 w-4" />}
        />
        <Kpi
          title="Approval Rate"
          value={`${kpis?.approval_rate_all ?? 0}%`}
          hint={`Window: ${kpis?.approval_rate_win ?? 0}%`}
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      {/* Loan exposure & DPD panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Card className="lg:col-span-6 shadow-sm">
          <CardHeader>
            <CardTitle>Loan Exposure Snapshot</CardTitle>
            <CardDescription>
              Exposure vs Arrears / Due / Penalties
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <div
              className="h-full w-full text-[13px]"
              style={{ fontFamily: "inherit", color: C.text }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={exposureBar}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: C.axis }}
                    axisLine={{ stroke: C.grid }}
                    tickLine={{ stroke: C.grid }}
                  />
                  <YAxis
                    tick={{ fill: C.axis }}
                    axisLine={{ stroke: C.grid }}
                    tickLine={{ stroke: C.grid }}
                  />
                  <RTooltip content={<Tip />} />
                  <Legend />
                  <Bar
                    radius={[6, 6, 0, 0]}
                    dataKey="Exposure"
                    fill={C.exposure}
                  />
                  <Bar
                    radius={[6, 6, 0, 0]}
                    dataKey="Arrears"
                    fill={C.arrears}
                  />
                  <Bar
                    radius={[6, 6, 0, 0]}
                    dataKey="DueToday"
                    fill="hsl(37 92% 50%)"
                  />
                  <Bar
                    radius={[6, 6, 0, 0]}
                    dataKey="Future"
                    fill="hsl(199 89% 48%)"
                  />
                  <Bar
                    radius={[6, 6, 0, 0]}
                    dataKey="Penalties"
                    fill="hsl(0 72% 45%)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-6 shadow-sm">
          <CardHeader>
            <CardTitle>DPD & Window Repayments</CardTitle>
            <CardDescription>
              Avg / Max DPD and last {windowDays} days mix
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-3">
              <div>
                <div className="text-sm text-muted-foreground">Avg DPD</div>
                <div className="text-2xl font-semibold">{lx?.avg_dpd ?? 0}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Max DPD</div>
                <div className="text-2xl font-semibold">{lx?.max_dpd ?? 0}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">
                  Arrears Ratio
                </div>
                <div className="text-2xl font-semibold">
                  {((lx?.arrears_ratio ?? 0) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[kpis?.window_paid || {}]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
                  <XAxis
                    dataKey={() => "Window"}
                    tick={{ fill: C.axis }}
                    axisLine={{ stroke: C.grid }}
                    tickLine={{ stroke: C.grid }}
                  />
                  <YAxis
                    tick={{ fill: C.axis }}
                    axisLine={{ stroke: C.grid }}
                    tickLine={{ stroke: C.grid }}
                  />
                  <RTooltip content={<Tip />} />
                  <Legend />
                  <Bar
                    dataKey="principal"
                    name="Principal"
                    fill="hsl(217 91% 60%)"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="interest"
                    name="Interest"
                    fill="hsl(142 72% 35%)"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="penalty"
                    name="Penalty"
                    fill="hsl(0 84% 60%)"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="monitoring"
                    name="Monitoring"
                    fill="hsl(37 92% 50%)"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cash flow & activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Card className="lg:col-span-6 shadow-sm">
          <CardHeader>
            <CardTitle>Cumulative Net Flow</CardTitle>
            <CardDescription>Deposits − Withdrawals over time</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <div
              className="h-full w-full text-[13px]"
              style={{ fontFamily: "inherit", color: C.text }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={netCumulative}>
                  <defs>
                    <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.net} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={C.net} stopOpacity={0.06} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: C.axis }}
                    axisLine={{ stroke: C.grid }}
                    tickLine={{ stroke: C.grid }}
                  />
                  <YAxis
                    tick={{ fill: C.axis }}
                    axisLine={{ stroke: C.grid }}
                    tickLine={{ stroke: C.grid }}
                  />
                  <RTooltip content={<Tip />} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="Net"
                    stroke={C.net}
                    strokeWidth={2}
                    fill="url(#netGrad)"
                    activeDot={{ r: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-6 shadow-sm">
          <CardHeader>
            <CardTitle>Daily Deposits vs Withdrawals</CardTitle>
            <CardDescription>Activity mix (zoomable)</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <div
              className="h-full w-full text-[13px]"
              style={{ fontFamily: "inherit", color: C.text }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={flowDaily}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: C.axis }}
                    axisLine={{ stroke: C.grid }}
                    tickLine={{ stroke: C.grid }}
                  />
                  <YAxis
                    tick={{ fill: C.axis }}
                    axisLine={{ stroke: C.grid }}
                    tickLine={{ stroke: C.grid }}
                  />
                  <RTooltip content={<Tip />} />
                  <Legend />
                  <Bar
                    dataKey="Deposits"
                    fill={C.deposit}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="Withdrawals"
                    fill={C.withdraw}
                    radius={[4, 4, 0, 0]}
                  />
                  <Brush
                    dataKey="date"
                    height={20}
                    stroke={C.axis}
                    travellerWidth={8}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loans: status & product mix + accounts table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Card className="lg:col-span-5 shadow-sm">
          <CardHeader>
            <CardTitle>Loan Status (All Time)</CardTitle>
            <CardDescription>Distribution of applications</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <RTooltip />
                <Legend />
                <Pie
                  data={loanStatus}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {loanStatus.map((_, i) => (
                    <Cell key={i} fill={pieColors[i % pieColors.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-7 shadow-sm">
          <CardHeader>
            <CardTitle>Loan Product Mix</CardTitle>
            <CardDescription>By count (all time)</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productMix}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: C.axis }}
                  axisLine={{ stroke: C.grid }}
                  tickLine={{ stroke: C.grid }}
                />
                <YAxis
                  tick={{ fill: C.axis }}
                  axisLine={{ stroke: C.grid }}
                  tickLine={{ stroke: C.grid }}
                  allowDecimals={false}
                />
                <RTooltip content={<Tip />} />
                <Legend />
                <Bar
                  dataKey="value"
                  name="Applications"
                  fill={C.primary}
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Accounts table + Signals */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <Card className="lg:col-span-7 shadow-sm">
          <CardHeader>
            <CardTitle>Accounts</CardTitle>
            <CardDescription>Open accounts with balances</CardDescription>
          </CardHeader>
          <CardContent>
            <AccountsTable accounts={accounts} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-5 shadow-sm">
          <CardHeader>
            <CardTitle>Signals</CardTitle>
            <CardDescription>What to watch</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!alerts?.length && (
              <p className="text-sm text-muted-foreground">No active alerts.</p>
            )}
            {alerts?.map((a, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle
                    className={cn(
                      "h-4 w-4",
                      a.includes("30 DPD") && "text-destructive"
                    )}
                  />
                  <span className="text-sm font-medium">{a}</span>
                </div>
              </div>
            ))}
            <div className="text-xs text-muted-foreground">
              Shares: {fmt(shares?.count || 0)} ops / {fmt(shares?.units || 0)}{" "}
              units • Internal transfers: {fmt(internal_transfers?.count || 0)}{" "}
              ops / {fmt(internal_transfers?.sum || 0)}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* eslint-disable react/prop-types */
import { useMemo } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  Activity,
  CalendarClock,
  TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
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

/* =========================
   shadcn-aware palette (auto light/dark)
   ========================= */
const C = {
  principal: "hsl(var(--primary))", // brand primary
  interest: "hsl(var(--green-foreground, 142 72% 29%))",
  monitoring: "hsl(var(--amber-foreground, 37 92% 50%))",
  penalty: "hsl(var(--destructive))",
  due: "hsl(var(--violet-foreground, 262 83% 58%))",
  paid: "hsl(var(--sky-foreground, 199 89% 48%))",
  grid: "hsl(var(--border))",
  axis: "hsl(var(--muted-foreground))",
  text: "hsl(var(--foreground))",
  mutedText: "hsl(var(--muted-foreground))",
};

/* Format helper */
const fmt = (v) => Intl.NumberFormat().format(v ?? 0);

/* API call */
async function fetchLoanIntel(axios, loanId, windowDays) {
  const res = await axios.get(`/analytics/loans`, {
    params: { loan_application_id: loanId, window_days: windowDays },
  });
  return res.data?.data ?? res.data;
}

/* Custom tooltip (shared) */
function Tip({ active, label, payload, currency = "" }) {
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
            <span className="tabular-nums">
              {currency}
              {fmt(p.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* KPI Card helper */
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

export default function LoanIntelligenceDashboard({ loanId, windowDays = 90 }) {
  /* Hooks at top (stable order) */
  const axiosPrivate = useAxiosPrivate();

  const { data, error, isLoading, isFetching, isFetched, refetch } = useQuery({
    queryKey: ["loan-intelligence", loanId, windowDays],
    queryFn: () => fetchLoanIntel(axiosPrivate, loanId, windowDays),
    enabled: !!loanId,
    retry: (failureCount, err) => {
      const s = err?.response?.status;
      if (s && s >= 400 && s < 500 && s !== 429) return false;
      return failureCount < 2;
    },
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });

  /* Derivations */
  const { kpis = {}, series = {}, alerts = [] } = data || {};
  const risk = Math.round(kpis?.risk_score || 0);
  const riskTone =
    risk >= 75
      ? "text-destructive"
      : risk >= 50
      ? "text-yellow-600"
      : "text-primary";

  const balanceSeries = useMemo(() => {
    let runningDue = 0,
      runningPaid = 0;
    const out = [];
    (series.dates || []).forEach((d, i) => {
      const due =
        (series.principal?.[i] || 0) +
        (series.interest?.[i] || 0) +
        (series.monitoring?.[i] || 0) +
        (series.penalty?.[i] || 0);
      const paid = series.total?.[i] || 0;
      runningDue += due;
      runningPaid += paid;
      out.push({ date: d, Total_Due: runningDue, Total_Paid: runningPaid });
    });
    return out;
  }, [series]);

  const stacked = useMemo(() => {
    return (series.dates || []).map((d, i) => ({
      date: d,
      Paid_Principal: series.principal?.[i] || 0,
      Paid_Interest: series.interest?.[i] || 0,
      Paid_Monitoring: series.monitoring?.[i] || 0,
      Paid_Penalty: series.penalty?.[i] || 0,
      Total: series.total?.[i] || 0,
    }));
  }, [series]);

  /* Early returns AFTER hooks */
  if (!loanId) {
    return (
      <Card className="shadow-sm border-amber-200">
        <CardHeader>
          <CardTitle>Loan Intelligence</CardTitle>
          <CardDescription>
            Provide a valid loan ID to load analytics.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Example: {"<LoanIntelligenceDashboard loanId={1234} />"}
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
            Unable to load intelligence
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

  /* ---------- Normal render ---------- */
  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi
          title="Risk Score"
          value={risk}
          hint="0 (low) → 100 (high)"
          icon={<Activity className="h-4 w-4" />}
        >
          <div className={cn("text-2xl font-bold", riskTone)}>{risk}</div>
          <Progress value={risk} className="h-2 mt-2" />
        </Kpi>
        <Kpi
          title="Days Past Due"
          value={`${kpis?.dpd?.current ?? 0} days`}
          hint={`Max ${kpis?.dpd?.max ?? 0} days`}
          icon={<AlertTriangle className="h-4 w-4" />}
        />
        <Kpi
          title="Next Due Date"
          value={kpis?.next_due_date || "—"}
          hint="Upcoming schedule"
          icon={<CalendarClock className="h-4 w-4" />}
        />
        <Kpi
          title="Total Outstanding"
          value={fmt(kpis?.exposure?.total_due || 0)}
          hint="Exposure"
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      {/* Exposure + Trajectory */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Exposure breakdown (stacked) */}
        <Card className="lg:col-span-6 shadow-sm">
          <CardHeader>
            <CardTitle>Exposure breakdown</CardTitle>
            <CardDescription>
              Principal • Interest • Monitoring • Penalties
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <div
              className="h-full w-full text-[13px]"
              style={{ fontFamily: "inherit", color: C.text }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[kpis?.exposure || {}]}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.grid} />
                  <XAxis
                    dataKey={() => "Current"}
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
                    dataKey="principal_due"
                    name="Principal"
                    stackId="a"
                    fill={C.principal}
                  />
                  <Bar
                    radius={[6, 6, 0, 0]}
                    dataKey="interest_due"
                    name="Interest"
                    stackId="a"
                    fill={C.interest}
                  />
                  <Bar
                    radius={[6, 6, 0, 0]}
                    dataKey="monitoring_due"
                    name="Monitoring"
                    stackId="a"
                    fill={C.monitoring}
                  />
                  <Bar
                    radius={[6, 6, 0, 0]}
                    dataKey="penalties_due"
                    name="Penalties"
                    stackId="a"
                    fill={C.penalty}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Cumulative Due vs Paid (areas) */}
        <Card className="lg:col-span-6 shadow-sm">
          <CardHeader>
            <CardTitle>Cumulative Due vs Paid</CardTitle>
            <CardDescription>Payoff trajectory</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <div
              className="h-full w-full text-[13px]"
              style={{ fontFamily: "inherit", color: C.text }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={balanceSeries}>
                  <defs>
                    <linearGradient id="dueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.due} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={C.due} stopOpacity={0.06} />
                    </linearGradient>
                    <linearGradient id="paidGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.paid} stopOpacity={0.4} />
                      <stop
                        offset="95%"
                        stopColor={C.paid}
                        stopOpacity={0.06}
                      />
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
                    dataKey="Total_Due"
                    name="Total Due"
                    stroke={C.due}
                    strokeWidth={2}
                    fill="url(#dueGrad)"
                    activeDot={{ r: 4 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="Total_Paid"
                    name="Total Paid"
                    stroke={C.paid}
                    strokeWidth={2}
                    fill="url(#paidGrad)"
                    activeDot={{ r: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Repayment mix over time (stacked + brush) */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Repayment mix (window)</CardTitle>
          <CardDescription>
            Principal • Interest • Monitoring • Penalty
          </CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <div
            className="h-full w-full text-[13px]"
            style={{ fontFamily: "inherit", color: C.text }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stacked}>
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
                  radius={[4, 4, 0, 0]}
                  dataKey="Paid_Principal"
                  name="Principal"
                  stackId="p"
                  fill={C.principal}
                />
                <Bar
                  radius={[4, 4, 0, 0]}
                  dataKey="Paid_Interest"
                  name="Interest"
                  stackId="p"
                  fill={C.interest}
                />
                <Bar
                  radius={[4, 4, 0, 0]}
                  dataKey="Paid_Monitoring"
                  name="Monitoring"
                  stackId="p"
                  fill={C.monitoring}
                />
                <Bar
                  radius={[4, 4, 0, 0]}
                  dataKey="Paid_Penalty"
                  name="Penalty"
                  stackId="p"
                  fill={C.penalty}
                />
                {/* Interactive range selector */}
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

      {/* Alerts */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Alerts</CardTitle>
          <CardDescription>Events to watch</CardDescription>
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
                    a.includes("high") && "text-destructive"
                  )}
                />
                <span className="text-sm font-medium">{a}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          {isFetching ? "Refreshing…" : "Refresh"}
        </Button>
      </div>
    </div>
  );
}

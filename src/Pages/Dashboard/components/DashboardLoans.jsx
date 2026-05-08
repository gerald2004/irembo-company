/* eslint-disable react/prop-types */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  CreditCard, Clock, AlertTriangle, CheckCircle, TrendingUp,
  TrendingDown, ShieldAlert, Users, Activity,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from "recharts";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import useBranchFilter from "@/MiddleWares/Hooks/useBranchFilter";
import StatCard from "./StatCard";

const fmt    = (n)  => (n != null ? Number(n).toLocaleString() : "—");
const fmtPct = (n)  => (n != null ? `${Number(n).toFixed(2)}%` : "—");

const PIE_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

function PARBanner({ label, value, amount, variant = "default" }) {
  const colors = {
    danger: "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-900/10 dark:border-rose-800 dark:text-rose-300",
    warn:   "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/10 dark:border-amber-800 dark:text-amber-300",
    ok:     "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/10 dark:border-emerald-800 dark:text-emerald-300",
  };
  const cls = variant === "danger" ? colors.danger : variant === "warn" ? colors.warn : colors.ok;
  return (
    <div className={`rounded-xl px-5 py-3 border flex items-center justify-between ${cls}`}>
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs opacity-75">{fmt(amount)}</p>
      </div>
      <span className="text-2xl font-bold tabular-nums">{fmtPct(value)}</span>
    </div>
  );
}

const DashboardLoans = ({ startDate, endDate }) => {
  const axiosPrivate = useAxiosPrivate();
  const navigate     = useNavigate();
  const { branchKey, branchParams } = useBranchFilter();

  const { data = {}, isLoading } = useQuery({
    queryKey: ["dashboard-loans-data", startDate, endDate, branchKey],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (startDate) params.set("startDate", startDate);
        if (endDate)   params.set("endDate",   endDate);
        if (branchParams.branchId != null) params.set("branchId", branchParams.branchId);
        const res = await axiosPrivate.get(`/dashboards/loans?${params}`);
        return res.data.data ?? {};
      } catch (err) {
        if (err?.response?.status === 401) navigate("/", { replace: true });
      }
    },
    enabled: !!startDate && !!endDate,
  });

  const summary  = data?.portfolio_summary ?? {};
  const risk     = data?.risk_metrics ?? {};
  const aging    = data?.aging_buckets ?? [];
  const dueToday = data?.due_today ?? {};
  const missed   = data?.missed_installments ?? [];
  const risky    = data?.top_risky_loans ?? [];
  const byProd   = data?.by_product ?? [];
  const monthly  = data?.monthly_trend ?? [];
  const gender   = data?.gender_breakdown ?? {};
  const chartPie = data?.chart_data?.pie ?? [];

  const par30Variant = (risk.par_30 ?? 0) > 10 ? "danger" : (risk.par_30 ?? 0) > 5 ? "warn" : "ok";
  const par90Variant = (risk.par_90 ?? 0) > 5  ? "danger" : (risk.par_90 ?? 0) > 2  ? "warn" : "ok";
  const nplVariant   = (risk.npl_ratio ?? 0) > 5 ? "danger" : (risk.npl_ratio ?? 0) > 2 ? "warn" : "ok";

  const genderPie = [
    { name: "Male", value: gender.male?.count ?? 0 },
    { name: "Female", value: gender.female?.count ?? 0 },
    { name: "Group", value: gender.group?.count ?? 0 },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">

      {/* ── Portfolio Summary ─────────────────────────────────────────────── */}
      <section>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Portfolio Summary</p>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[108px] rounded-xl" />) : (
            <>
              <StatCard
                label="Gross Portfolio"
                value={fmt(summary.gross_portfolio)}
                subtitle={`${fmt(summary.active_count)} active loans`}
                icon={CreditCard}
                colorClass="text-sky-600 dark:text-sky-400"
                bgClass="bg-sky-100 dark:bg-sky-900/30"
              />
              <StatCard
                label="Pending Approval"
                value={fmt(summary.pending_count)}
                subtitle="Awaiting disbursement"
                icon={Clock}
                colorClass="text-amber-600 dark:text-amber-400"
                bgClass="bg-amber-100 dark:bg-amber-900/30"
              />
              <StatCard
                label="Settled Loans"
                value={fmt(summary.settled_count)}
                subtitle="Fully repaid"
                icon={CheckCircle}
                colorClass="text-emerald-600 dark:text-emerald-400"
                bgClass="bg-emerald-100 dark:bg-emerald-900/30"
              />
              <StatCard
                label="Rejected"
                value={fmt(summary.rejected_count)}
                subtitle="Declined applications"
                icon={TrendingDown}
                colorClass="text-rose-600 dark:text-rose-400"
                bgClass="bg-rose-100 dark:bg-rose-900/30"
              />
            </>
          )}
        </div>
      </section>

      {/* ── Risk Metrics ──────────────────────────────────────────────────── */}
      {!isLoading && (
        <section>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Risk Metrics</p>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
            <PARBanner label="PAR > 30 Days" value={risk.par_30} amount={risk.par_30_amount} variant={par30Variant} />
            <PARBanner label="PAR > 90 Days" value={risk.par_90} amount={risk.par_90_amount} variant={par90Variant} />
            <PARBanner label="NPL Ratio"     value={risk.npl_ratio} amount={risk.npl_amount} variant={nplVariant} />
          </div>

          {/* Collection Efficiency */}
          {risk.collection_efficiency != null && (
            <div className="mt-3 rounded-xl border px-5 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-indigo-500" /> Collection Efficiency
                </p>
                <p className="text-xs text-muted-foreground">
                  Collected {fmt(risk.actual_collections)} of {fmt(risk.expected_collections)} expected this month
                </p>
              </div>
              <span className={`text-2xl font-bold tabular-nums ${(risk.collection_efficiency ?? 0) >= 80 ? "text-emerald-600 dark:text-emerald-400" : (risk.collection_efficiency ?? 0) >= 60 ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400"}`}>
                {fmtPct(risk.collection_efficiency)}
              </span>
            </div>
          )}
        </section>
      )}

      {/* ── Aging Buckets ─────────────────────────────────────────────────── */}
      {!isLoading && aging.length > 0 && (
        <section>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Aging Analysis</p>
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
            {aging.map((b) => (
              <Card key={b.label} className="shadow-sm text-center">
                <CardContent className="p-3">
                  <p className="text-xs font-medium text-muted-foreground">{b.label}</p>
                  <p className="text-xl font-bold tabular-nums mt-1">{b.count}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">{fmt(b.amount)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* ── Due Today + Monthly Trend ─────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-7">
        {isLoading ? (
          <>
            <Skeleton className="lg:col-span-3 h-[300px] rounded-xl" />
            <Skeleton className="lg:col-span-4 h-[300px] rounded-xl" />
          </>
        ) : (
          <>
            {/* Due today summary */}
            <Card className="lg:col-span-3 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-500" /> Due Today
                </CardTitle>
                <p className="text-xs text-muted-foreground">{dueToday.count ?? 0} installments · {fmt(dueToday.total_amount)}</p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto max-h-[220px] overflow-y-auto">
                  {(dueToday.items ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">No installments due today</p>
                  ) : (
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b text-muted-foreground">
                          <th className="text-left pb-1.5 font-medium">Client</th>
                          <th className="text-right pb-1.5 font-medium">Total Due</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dueToday.items.map((d, i) => (
                          <tr key={i} className="border-b last:border-0">
                            <td className="py-1.5">
                              <p className="font-medium">{d.client_name}</p>
                              <p className="text-muted-foreground font-mono">{d.loan_code}</p>
                            </td>
                            <td className="py-1.5 text-right tabular-nums font-semibold text-amber-600 dark:text-amber-400">
                              {fmt(d.total_due)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Monthly disbursement vs collections */}
            <Card className="lg:col-span-4 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Disbursements vs Collections</CardTitle>
                <p className="text-xs text-muted-foreground">Monthly trend this year</p>
              </CardHeader>
              <CardContent className="pl-1">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={monthly} margin={{ left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} tickFormatter={(v) => v?.slice(5)} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => (v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v)} />
                    <Tooltip formatter={(v) => Number(v).toLocaleString()} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="disbursed_amount" name="Disbursed" fill="hsl(var(--chart-1))" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="collections_amount" name="Collected" fill="hsl(var(--chart-2))" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* ── Product Distribution + Gender Pie ────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-7">
        {isLoading ? (
          <>
            <Skeleton className="lg:col-span-4 h-[280px] rounded-xl" />
            <Skeleton className="lg:col-span-3 h-[280px] rounded-xl" />
          </>
        ) : (
          <>
            <Card className="lg:col-span-4 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Loan Product Distribution</CardTitle>
                <p className="text-xs text-muted-foreground">Active loans per product</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2.5">
                  {byProd.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No product data available</p>
                  ) : byProd.map((p) => {
                    const total = summary.active_count || 1;
                    const pct = Math.round((p.active_count / total) * 100);
                    return (
                      <div key={p.product_id} className="space-y-1">
                        <div className="flex items-center justify-between text-xs gap-2">
                          <span className="truncate font-medium">{p.product_name}</span>
                          <div className="flex items-center gap-3 shrink-0 tabular-nums">
                            <span className="text-muted-foreground">{pct}%</span>
                            <span className="font-semibold">{fmt(p.active_amount)}</span>
                            <Badge variant="outline" className="text-[10px]">{p.active_count} active</Badge>
                          </div>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-sky-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Gender / type pie */}
            <Card className="lg:col-span-3 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Borrower Breakdown</CardTitle>
                <p className="text-xs text-muted-foreground">Active loans by borrower type</p>
              </CardHeader>
              <CardContent>
                {genderPie.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie data={genderPie} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                          {genderPie.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => [v, "Count"]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-2 space-y-1">
                      {[
                        { label: "Male",   count: gender.male?.count ?? 0,   amount: gender.male?.amount ?? 0 },
                        { label: "Female", count: gender.female?.count ?? 0, amount: gender.female?.amount ?? 0 },
                        { label: "Group",  count: gender.group?.count ?? 0,  amount: gender.group?.amount ?? 0 },
                      ].filter(d => d.count > 0).map((d, i) => (
                        <div key={d.label} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className="h-2.5 w-2.5 rounded-sm" style={{ background: PIE_COLORS[i] }} />
                            <span>{d.label}</span>
                          </div>
                          <span className="tabular-nums text-muted-foreground">{d.count} · {fmt(d.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* ── Missed Installments (last 30 days) ───────────────────────────── */}
      {!isLoading && missed.length > 0 && (
        <Card className="shadow-sm border-amber-200 dark:border-amber-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" /> Missed Installments (Last 30 Days)
            </CardTitle>
            <p className="text-xs text-muted-foreground">{missed.length} overdue schedules</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="text-left pb-2 font-medium">Loan</th>
                    <th className="text-left pb-2 font-medium">Client</th>
                    <th className="text-right pb-2 font-medium">Days Late</th>
                    <th className="text-right pb-2 font-medium">Outstanding</th>
                    <th className="text-right pb-2 font-medium">Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {missed.slice(0, 10).map((m, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-1.5 font-mono text-xs">{m.loan_code}</td>
                      <td className="py-1.5">{m.client_name}</td>
                      <td className="py-1.5 text-right">
                        <Badge variant={m.days_overdue > 15 ? "destructive" : "secondary"} className="text-xs">
                          {m.days_overdue}d
                        </Badge>
                      </td>
                      <td className="py-1.5 text-right tabular-nums font-semibold text-rose-600 dark:text-rose-400">
                        {fmt(m.outstanding)}
                      </td>
                      <td className="py-1.5 text-right text-muted-foreground text-xs">{m.due_date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Top Risky Loans ───────────────────────────────────────────────── */}
      {!isLoading && risky.length > 0 && (
        <Card className="shadow-sm border-rose-200 dark:border-rose-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-rose-500" /> Top High-Risk Loans
            </CardTitle>
            <p className="text-xs text-muted-foreground">Highest overdue exposure</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {risky.map((r, i) => (
                <div key={i} className="flex items-center justify-between gap-4 py-1.5 border-b last:border-0 text-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono text-muted-foreground shrink-0">{i + 1}</span>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{r.client_name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{r.loan_code}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold tabular-nums text-rose-600 dark:text-rose-400">{fmt(r.outstanding)}</p>
                    <p className="text-xs text-muted-foreground">of {fmt(r.loan_amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Portfolio Status Pie ──────────────────────────────────────────── */}
      {!isLoading && chartPie.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Portfolio Status Distribution</CardTitle>
              <p className="text-xs text-muted-foreground">Active vs overdue vs pending vs settled</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={chartPie} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {chartPie.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [v, "Count"]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                {chartPie.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2 text-xs">
                    <div className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span>{d.name}: <span className="font-semibold">{d.value}</span></span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Aging bar chart */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Aging Buckets — Exposure</CardTitle>
              <p className="text-xs text-muted-foreground">Overdue amount by bucket</p>
            </CardHeader>
            <CardContent className="pl-1">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={aging} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => (v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v)} />
                  <Tooltip formatter={(v) => Number(v).toLocaleString()} />
                  <Bar dataKey="amount" name="Overdue Amount" fill="hsl(var(--chart-2))" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Products count table */}
      {!isLoading && byProd.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" /> Product Summary Table
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="text-left pb-2 font-medium">Product</th>
                    <th className="text-left pb-2 font-medium">Type</th>
                    <th className="text-right pb-2 font-medium">Active</th>
                    <th className="text-right pb-2 font-medium">Active Amount</th>
                    <th className="text-right pb-2 font-medium">Pending</th>
                    <th className="text-right pb-2 font-medium">Settled</th>
                  </tr>
                </thead>
                <tbody>
                  {byProd.map((p) => (
                    <tr key={p.product_id} className="border-b last:border-0">
                      <td className="py-2 font-medium">{p.product_name}</td>
                      <td className="py-2"><Badge variant="outline" className="text-xs capitalize">{p.product_type?.replace("_", " ")}</Badge></td>
                      <td className="py-2 text-right tabular-nums text-sky-600 dark:text-sky-400 font-semibold">{p.active_count}</td>
                      <td className="py-2 text-right tabular-nums">{fmt(p.active_amount)}</td>
                      <td className="py-2 text-right tabular-nums text-amber-600 dark:text-amber-400">{p.pending_count}</td>
                      <td className="py-2 text-right tabular-nums text-emerald-600 dark:text-emerald-400">{p.settled_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardLoans;

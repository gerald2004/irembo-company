/* eslint-disable react/prop-types */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp, TrendingDown, Users, CreditCard, PiggyBank, Building2,
  AlertTriangle, Droplets, Clock, UserX, Bell, ShieldAlert, CheckCircle,
} from "lucide-react";
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import useBranchFilter from "@/MiddleWares/Hooks/useBranchFilter";
import StatCard from "./StatCard";

const fmt = (n) => (n != null ? Number(n).toLocaleString() : "—");
const fmtPct = (n) => (n != null ? `${Number(n).toFixed(2)}%` : "—");
const chg = (v) => (v != null ? `${v > 0 ? "+" : ""}${Number(v).toFixed(1)}%` : null);

function RiskBadge({ value, thresholds = [5, 10] }) {
  const color =
    value > thresholds[1] ? "text-rose-600 dark:text-rose-400"
    : value > thresholds[0] ? "text-amber-600 dark:text-amber-400"
    : "text-emerald-600 dark:text-emerald-400";
  return <p className={`text-2xl font-bold tabular-nums ${color}`}>{fmtPct(value)}</p>;
}

const DashboardOverview = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const { branchKey, branchParams } = useBranchFilter();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard-overview-data", branchKey],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get("/dashboards/overview", { params: branchParams });
        return res.data.data;
      } catch (err) {
        if (err?.response?.status === 401) navigate("/", { replace: true });
        throw err;
      }
    },
  });

  const kpis    = data?.kpis ?? {};
  const ops     = data?.today_operations ?? {};
  const charts  = data?.charts ?? {};
  const widgets = data?.widgets ?? {};
  const fy      = data?.fiscal_year;

  const dailyTrend     = charts.daily_transactions ?? [];
  const portfolioGrowth = charts.portfolio_growth ?? [];
  const incExpTrend    = charts.income_vs_expenses ?? [];
  const branchCmp      = charts.branch_comparison ?? [];

  const loansDue       = widgets.loans_due_today ?? {};
  const pending        = widgets.pending_approvals ?? {};
  const aml            = widgets.aml_alerts ?? {};
  const dormant        = widgets.dormant_accounts ?? {};
  const dayStatus      = widgets.day_status;

  if (isError) return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
      Failed to load overview data — please refresh the page.
    </div>
  );

  return (
    <div className="space-y-6">

      {/* ── Today's Operations ───────────────────────────────────────────── */}
      <section>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Today&apos;s Operations
        </p>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[108px] rounded-xl" />)
          ) : (
            <>
              <StatCard
                label="Deposits Today"
                value={fmt(ops.deposits?.amount)}
                subtitle={`${ops.deposits?.count ?? 0} txns${chg(ops.deposits?.change_pct) ? ` · ${chg(ops.deposits?.change_pct)} vs yesterday` : ""}`}
                icon={TrendingUp}
                colorClass="text-emerald-600 dark:text-emerald-400"
                bgClass="bg-emerald-100 dark:bg-emerald-900/30"
              />
              <StatCard
                label="Withdrawals Today"
                value={fmt(ops.withdrawals?.amount)}
                subtitle={`${ops.withdrawals?.count ?? 0} txns${chg(ops.withdrawals?.change_pct) ? ` · ${chg(ops.withdrawals?.change_pct)} vs yesterday` : ""}`}
                icon={TrendingDown}
                colorClass="text-rose-600 dark:text-rose-400"
                bgClass="bg-rose-100 dark:bg-rose-900/30"
              />
              <StatCard
                label="Loan Collections Today"
                value={fmt(ops.collections?.amount)}
                subtitle={`${ops.collections?.count ?? 0} txns${chg(ops.collections?.change_pct) ? ` · ${chg(ops.collections?.change_pct)} vs yesterday` : ""}`}
                icon={CreditCard}
                colorClass="text-sky-600 dark:text-sky-400"
                bgClass="bg-sky-100 dark:bg-sky-900/30"
              />
              <Card className="border shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <p className="text-sm font-medium text-muted-foreground">Net Income Today</p>
                      <p className={`text-xl font-bold tabular-nums ${(ops.net_income?.amount ?? 0) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                        {fmt(ops.net_income?.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {fmt(ops.net_income?.income)} in &middot; {fmt(ops.net_income?.expenses)} out
                      </p>
                    </div>
                    <div className="p-2.5 rounded-xl shrink-0 bg-indigo-100 dark:bg-indigo-900/30">
                      <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </section>

      {/* ── Portfolio KPIs ────────────────────────────────────────────────── */}
      <section>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Portfolio Overview
        </p>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[108px] rounded-xl" />)
          ) : (
            <>
              <StatCard
                label="Total Members"
                value={fmt(kpis.total_members)}
                subtitle={`${fmt(kpis.new_members_today)} new today${chg(kpis.members_change_pct) ? ` · ${chg(kpis.members_change_pct)}` : ""}`}
                icon={Users}
                colorClass="text-violet-600 dark:text-violet-400"
                bgClass="bg-violet-100 dark:bg-violet-900/30"
              />
              <StatCard
                label="Active Borrowers"
                value={fmt(kpis.active_borrowers)}
                subtitle="Currently disbursed"
                icon={CreditCard}
                colorClass="text-sky-600 dark:text-sky-400"
                bgClass="bg-sky-100 dark:bg-sky-900/30"
              />
              <StatCard
                label="Gross Loan Portfolio"
                value={fmt(kpis.gross_loan_portfolio)}
                subtitle="Total outstanding"
                icon={Building2}
                colorClass="text-indigo-600 dark:text-indigo-400"
                bgClass="bg-indigo-100 dark:bg-indigo-900/30"
              />
              <StatCard
                label="Total Savings"
                value={fmt(kpis.total_savings)}
                subtitle="Member deposits balance"
                icon={PiggyBank}
                colorClass="text-emerald-600 dark:text-emerald-400"
                bgClass="bg-emerald-100 dark:bg-emerald-900/30"
              />
            </>
          )}
        </div>
      </section>

      {/* ── Risk Indicators ───────────────────────────────────────────────── */}
      <section>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Risk Indicators
        </p>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[108px] rounded-xl" />)
          ) : (
            <>
              <Card className="border shadow-sm">
                <CardContent className="p-5 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">PAR &gt; 30</p>
                    <RiskBadge value={kpis.par_30} thresholds={[5, 10]} />
                    <p className="text-xs text-muted-foreground mt-0.5">Portfolio at risk</p>
                  </div>
                  <AlertTriangle className={`h-5 w-5 mt-1 shrink-0 ${kpis.par_30 > 10 ? "text-rose-500" : kpis.par_30 > 5 ? "text-amber-500" : "text-emerald-500"}`} />
                </CardContent>
              </Card>
              <Card className="border shadow-sm">
                <CardContent className="p-5 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">NPL Ratio</p>
                    <RiskBadge value={kpis.npl_ratio} thresholds={[2, 5]} />
                    <p className="text-xs text-muted-foreground mt-0.5">Non-performing loans</p>
                  </div>
                  <ShieldAlert className="h-5 w-5 mt-1 shrink-0 text-muted-foreground" />
                </CardContent>
              </Card>
              <Card className="border shadow-sm">
                <CardContent className="p-5 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Liquidity Ratio</p>
                    <p className={`text-2xl font-bold tabular-nums ${(kpis.liquidity_ratio ?? 100) < 20 ? "text-rose-600 dark:text-rose-400" : (kpis.liquidity_ratio ?? 100) < 40 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                      {fmtPct(kpis.liquidity_ratio)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">Liquid / total savings</p>
                  </div>
                  <Droplets className="h-5 w-5 mt-1 shrink-0 text-muted-foreground" />
                </CardContent>
              </Card>
              <StatCard
                label="Liquid Assets"
                value={fmt(kpis.liquid_assets)}
                subtitle="Cash + bank combined"
                icon={PiggyBank}
                colorClass="text-teal-600 dark:text-teal-400"
                bgClass="bg-teal-100 dark:bg-teal-900/30"
              />
            </>
          )}
        </div>
      </section>

      {/* ── 7-Day Trend + Widgets ─────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-7">
        {isLoading ? (
          <>
            <Skeleton className="lg:col-span-4 h-[300px] rounded-xl" />
            <Skeleton className="lg:col-span-3 h-[300px] rounded-xl" />
          </>
        ) : (
          <>
            <Card className="lg:col-span-4 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">7-Day Transaction Trend</CardTitle>
                <p className="text-xs text-muted-foreground">Daily deposits, withdrawals &amp; collections</p>
              </CardHeader>
              <CardContent className="pl-1">
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart data={dailyTrend} margin={{ left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v?.slice(5)} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => (v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v)} />
                    <Tooltip formatter={(v) => Number(v).toLocaleString()} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="deposits" name="Deposits" fill="hsl(var(--chart-1))" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="withdrawals" name="Withdrawals" fill="hsl(var(--chart-2))" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="collections" name="Collections" fill="hsl(var(--chart-3))" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Widgets stack */}
            <div className="lg:col-span-3 space-y-3">
              {/* Day status */}
              {dayStatus && (
                <div className={`rounded-xl px-4 py-3 flex items-center justify-between border ${dayStatus.is_open ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800" : "bg-slate-50 border-slate-200 dark:bg-slate-900/10 dark:border-slate-700"}`}>
                  <div className="flex items-center gap-2">
                    <CheckCircle className={`h-4 w-4 ${dayStatus.is_open ? "text-emerald-500" : "text-slate-400"}`} />
                    <div>
                      <p className="text-sm font-semibold">Day {dayStatus.is_open ? "Open" : "Closed"}</p>
                      <p className="text-xs text-muted-foreground">{dayStatus.business_date}</p>
                    </div>
                  </div>
                  <Badge variant={dayStatus.is_open ? "default" : "secondary"}>
                    {dayStatus.is_open ? "Operational" : "Closed"}
                  </Badge>
                </div>
              )}

              {/* Loans due today */}
              <Card className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-amber-500" /> Loans Due Today
                    </p>
                    <Badge variant="outline">{loansDue.count ?? 0} loans</Badge>
                  </div>
                  <p className="text-lg font-bold tabular-nums text-amber-600 dark:text-amber-400">
                    {fmt(loansDue.total_amount)}
                  </p>
                  <div className="mt-2 space-y-1 max-h-[72px] overflow-y-auto">
                    {(loansDue.items ?? []).slice(0, 3).map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-xs gap-2">
                        <span className="truncate text-muted-foreground">{item.client_name}</span>
                        <span className="tabular-nums font-medium shrink-0">{fmt(item.amount_due)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Counters row */}
              <div className="grid grid-cols-3 gap-3">
                <Card className="shadow-sm">
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-muted-foreground">Pending</p>
                    <p className="text-xl font-bold tabular-nums text-amber-600 dark:text-amber-400">{pending.count ?? 0}</p>
                    <p className="text-[10px] text-muted-foreground">Approvals</p>
                  </CardContent>
                </Card>
                <Card className="shadow-sm">
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-0.5"><Bell className="h-3 w-3" /> AML</p>
                    <p className="text-xl font-bold tabular-nums text-rose-600 dark:text-rose-400">{aml.open_count ?? 0}</p>
                    <p className="text-[10px] text-muted-foreground">Open alerts</p>
                  </CardContent>
                </Card>
                <Card className="shadow-sm">
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-0.5"><UserX className="h-3 w-3" /> Dormant</p>
                    <p className="text-xl font-bold tabular-nums">{fmt(dormant.count)}</p>
                    <p className="text-[10px] text-muted-foreground">{dormant.threshold_days ?? 90}+ days</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── 12-Month Portfolio Growth ─────────────────────────────────────── */}
      {!isLoading && portfolioGrowth.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">12-Month Portfolio Growth</CardTitle>
            <p className="text-xs text-muted-foreground">Gross loan portfolio vs total savings</p>
          </CardHeader>
          <CardContent className="pl-1">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={portfolioGrowth}>
                <defs>
                  <linearGradient id="gLoans" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gSavings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => (v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v)} />
                <Tooltip formatter={(v) => Number(v).toLocaleString()} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="loans" name="Loan Portfolio" stroke="hsl(var(--chart-1))" fill="url(#gLoans)" strokeWidth={2} />
                <Area type="monotone" dataKey="savings" name="Total Savings" stroke="hsl(var(--chart-2))" fill="url(#gSavings)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* ── Income vs Expenses (6-month) ──────────────────────────────────── */}
      {!isLoading && incExpTrend.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">6-Month Income vs Expenses</CardTitle>
            <p className="text-xs text-muted-foreground">Monthly revenue and expenditure</p>
          </CardHeader>
          <CardContent className="pl-1">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={incExpTrend} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => (v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v)} />
                <Tooltip formatter={(v) => Number(v).toLocaleString()} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="income" name="Income" fill="hsl(var(--chart-1))" radius={[2, 2, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="hsl(var(--chart-2))" radius={[2, 2, 0, 0]} />
                <Bar dataKey="profit" name="Profit" fill="hsl(var(--chart-3))" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* ── Loans Due Today Detail ────────────────────────────────────────── */}
      {!isLoading && (loansDue.items?.length ?? 0) > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Loans Due Today — Detail</CardTitle>
            <p className="text-xs text-muted-foreground">
              {loansDue.count} installment{loansDue.count !== 1 ? "s" : ""} totalling {fmt(loansDue.total_amount)}
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="text-left pb-2 font-medium">Loan Code</th>
                    <th className="text-left pb-2 font-medium">Client</th>
                    <th className="text-right pb-2 font-medium">Amount Due</th>
                    <th className="text-right pb-2 font-medium">Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {loansDue.items.slice(0, 10).map((item, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2 font-mono text-xs">{item.loan_code}</td>
                      <td className="py-2">{item.client_name}</td>
                      <td className="py-2 text-right tabular-nums font-semibold text-amber-600 dark:text-amber-400">
                        {fmt(item.amount_due)}
                      </td>
                      <td className="py-2 text-right text-muted-foreground text-xs">{item.due_date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Pending Approvals ─────────────────────────────────────────────── */}
      {!isLoading && (pending.items?.length ?? 0) > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Pending Loan Approvals</CardTitle>
            <p className="text-xs text-muted-foreground">{pending.count} applications awaiting approval</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pending.items.slice(0, 8).map((item, i) => (
                <div key={i} className="flex items-center justify-between gap-4 py-1 border-b last:border-0 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{item.client_name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{item.loan_code}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold tabular-nums">{fmt(item.amount)}</p>
                    <p className="text-xs text-muted-foreground">{item.applied_date?.slice(0, 10)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Branch Comparison ─────────────────────────────────────────────── */}
      {!isLoading && branchCmp.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Branch Comparison</CardTitle>
            <p className="text-xs text-muted-foreground">Loans, savings &amp; members per branch</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {branchCmp.map((b) => (
                <div key={b.branch_id} className="flex items-center gap-4 py-1.5 border-b last:border-0 text-sm">
                  <span className="font-medium truncate min-w-[120px]">{b.branch_name}</span>
                  <div className="flex gap-5 text-xs tabular-nums ml-auto shrink-0">
                    <span><span className="text-sky-600 dark:text-sky-400 font-semibold">{fmt(b.loans)}</span> <span className="text-muted-foreground">loans</span></span>
                    <span><span className="text-emerald-600 dark:text-emerald-400 font-semibold">{fmt(b.savings)}</span> <span className="text-muted-foreground">savings</span></span>
                    <span><span className="text-violet-600 dark:text-violet-400 font-semibold">{b.members}</span> <span className="text-muted-foreground">members</span></span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AML Open Alerts */}
      {!isLoading && (aml.alerts?.length ?? 0) > 0 && (
        <Card className="shadow-sm border-rose-200 dark:border-rose-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Bell className="h-4 w-4 text-rose-500" /> Open AML Alerts
            </CardTitle>
            <p className="text-xs text-muted-foreground">{aml.open_count} alerts requiring review</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {aml.alerts.slice(0, 5).map((a, i) => (
                <div key={i} className="flex items-center justify-between gap-3 py-1 border-b last:border-0 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">{a.created_at?.slice(0, 10)}</p>
                  </div>
                  <Badge variant="destructive">Score: {a.score}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {fy && !isLoading && (
        <p className="text-xs text-muted-foreground text-center">
          Fiscal Year: {fy.start} — {fy.end}
        </p>
      )}
    </div>
  );
};

export default DashboardOverview;

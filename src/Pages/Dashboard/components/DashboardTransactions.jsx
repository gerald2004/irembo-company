/* eslint-disable react/prop-types */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp, TrendingDown, Scale, Wallet, Building2, FileText,
  Clock, CheckCircle, RotateCcw,
} from "lucide-react";
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import StatCard from "./StatCard";

const fmt  = (n)  => (n != null ? Number(n).toLocaleString() : "—");
const fmtPct = (n) => (n != null ? `${Number(n).toFixed(1)}%` : "—");

function BreakdownBar({ items = [], colorClass = "bg-sky-500" }) {
  if (!items.length)
    return <p className="text-sm text-muted-foreground py-4 text-center">No data available.</p>;
  const max = Math.max(...items.map((i) => i.amount ?? i.balance ?? 0));
  return (
    <div className="space-y-2.5">
      {items.slice(0, 8).map((item, i) => {
        const val = item.amount ?? item.balance ?? 0;
        return (
          <div key={i} className="space-y-1">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="truncate font-medium">{item.account ?? item.sub_group ?? item.type}</span>
              <div className="flex items-center gap-3 shrink-0 tabular-nums">
                {item.pct != null && <span className="text-muted-foreground">{fmtPct(item.pct)}</span>}
                <span className="font-semibold">{fmt(val)}</span>
              </div>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${max > 0 ? (val / max) * 100 : 0}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

const DashboardTransactions = ({ startDate, endDate }) => {
  const axiosPrivate = useAxiosPrivate();
  const navigate     = useNavigate();

  const { data = {}, isLoading } = useQuery({
    queryKey: ["dashboard-transactions-data", startDate, endDate],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (startDate) params.set("startDate", startDate);
        if (endDate)   params.set("endDate",   endDate);
        const res = await axiosPrivate.get(`/dashboards/transactions?${params}`);
        return res.data.data ?? {};
      } catch (err) {
        if (err?.response?.status === 401) navigate("/", { replace: true });
      }
    },
    enabled: !!startDate && !!endDate,
  });

  const period      = data?.period ?? {};
  const bs          = data?.balance_sheet ?? {};
  const perf        = data?.period_performance ?? {};
  const revenue     = data?.revenue_breakdown ?? [];
  const expenses    = data?.expense_breakdown ?? [];
  const cashflow    = data?.cashflow_trend ?? [];
  const balances    = data?.account_balances ?? [];
  const journals    = data?.journal_activity ?? {};
  const largeJe     = data?.large_transactions ?? [];
  const recentJe    = data?.recent_journals ?? [];

  return (
    <div className="space-y-6">

      {period.start && !isLoading && (
        <p className="text-xs text-muted-foreground">
          Period: {period.start} — {period.end}
          {period.granularity && <span className="ml-2 capitalize text-muted-foreground/70">({period.granularity})</span>}
        </p>
      )}

      {/* ── Balance Sheet Summary ─────────────────────────────────────────── */}
      <section>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Balance Sheet</p>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[108px] rounded-xl" />) : (
            <>
              <StatCard
                label="Total Assets"
                value={fmt(bs.total_assets)}
                subtitle="Balance sheet total"
                icon={Scale}
                colorClass="text-indigo-600 dark:text-indigo-400"
                bgClass="bg-indigo-100 dark:bg-indigo-900/30"
              />
              <StatCard
                label="Total Liabilities"
                value={fmt(bs.total_liabilities)}
                subtitle="Outstanding obligations"
                icon={TrendingDown}
                colorClass="text-rose-600 dark:text-rose-400"
                bgClass="bg-rose-100 dark:bg-rose-900/30"
              />
              <StatCard
                label="Equity"
                value={fmt(bs.equity)}
                subtitle="Assets minus liabilities"
                icon={TrendingUp}
                colorClass="text-emerald-600 dark:text-emerald-400"
                bgClass="bg-emerald-100 dark:bg-emerald-900/30"
              />
              <Card className="border shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Balance Check</p>
                      <p className={`text-base font-bold ${bs.is_balanced ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                        {bs.is_balanced ? "✓ Balanced" : "⚠ Out of balance"}
                      </p>
                      <p className="text-xs text-muted-foreground">Assets = Liab + Equity</p>
                    </div>
                    <CheckCircle className={`h-5 w-5 mt-1 ${bs.is_balanced ? "text-emerald-500" : "text-rose-500"}`} />
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </section>

      {/* ── Period Performance ────────────────────────────────────────────── */}
      <section>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Period Performance</p>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[108px] rounded-xl" />) : (
            <>
              <StatCard
                label="Total Income"
                value={fmt(perf.total_income)}
                subtitle="Revenue this period"
                icon={TrendingUp}
                colorClass="text-emerald-600 dark:text-emerald-400"
                bgClass="bg-emerald-100 dark:bg-emerald-900/30"
              />
              <StatCard
                label="Total Expenses"
                value={fmt(perf.total_expenses)}
                subtitle="Expenditure this period"
                icon={TrendingDown}
                colorClass="text-rose-600 dark:text-rose-400"
                bgClass="bg-rose-100 dark:bg-rose-900/30"
              />
              <Card className="border shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Net Profit</p>
                      <p className={`text-2xl font-bold tabular-nums ${(perf.net_profit ?? 0) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                        {fmt(perf.net_profit)}
                      </p>
                      <p className="text-xs text-muted-foreground">Income minus expenses</p>
                    </div>
                    <Building2 className="h-5 w-5 mt-1 shrink-0 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Profit Margin</p>
                      <p className={`text-2xl font-bold tabular-nums ${(perf.profit_margin_pct ?? 0) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                        {fmtPct(perf.profit_margin_pct)}
                      </p>
                      <p className="text-xs text-muted-foreground">Net profit / income</p>
                    </div>
                    <Wallet className="h-5 w-5 mt-1 shrink-0 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </section>

      {/* ── Journal Activity KPIs ─────────────────────────────────────────── */}
      <section>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Journal Activity</p>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          {isLoading ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[80px] rounded-xl" />) : (
            <>
              <Card className="shadow-sm">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Journal Entries</p>
                    <p className="text-2xl font-bold tabular-nums">{fmt(journals.total)}</p>
                  </div>
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Pending Journals</p>
                    <p className="text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400">{fmt(journals.pending)}</p>
                  </div>
                  <Clock className="h-6 w-6 text-amber-500" />
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Unposted Journals</p>
                    <p className="text-2xl font-bold tabular-nums text-rose-600 dark:text-rose-400">{fmt(journals.unposted)}</p>
                  </div>
                  <RotateCcw className="h-6 w-6 text-rose-500" />
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </section>

      {/* ── Cashflow Trend + Revenue Breakdown ───────────────────────────── */}
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
                <CardTitle className="text-base font-semibold">Cashflow Trend</CardTitle>
                <p className="text-xs text-muted-foreground">Deposits, withdrawals, income &amp; expenses over time</p>
              </CardHeader>
              <CardContent className="pl-1">
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={cashflow}>
                    <defs>
                      <linearGradient id="cfDep" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="cfWit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => (v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v)} />
                    <Tooltip formatter={(v) => Number(v).toLocaleString()} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="deposits" name="Deposits" stroke="hsl(var(--chart-1))" fill="url(#cfDep)" strokeWidth={2} />
                    <Area type="monotone" dataKey="withdrawals" name="Withdrawals" stroke="hsl(var(--chart-2))" fill="url(#cfWit)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="lg:col-span-3 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Revenue Breakdown</CardTitle>
                <p className="text-xs text-muted-foreground">Income by account</p>
              </CardHeader>
              <CardContent>
                <BreakdownBar items={revenue} colorClass="bg-emerald-500" />
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* ── Expense Breakdown + Account Balances ─────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {isLoading ? (
          <>
            <Skeleton className="h-[280px] rounded-xl" />
            <Skeleton className="h-[280px] rounded-xl" />
          </>
        ) : (
          <>
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Expense Breakdown</CardTitle>
                <p className="text-xs text-muted-foreground">Expenditure by account</p>
              </CardHeader>
              <CardContent>
                <BreakdownBar items={expenses} colorClass="bg-rose-500" />
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Account Balances by Group</CardTitle>
                <p className="text-xs text-muted-foreground">Sub-group balance summary</p>
              </CardHeader>
              <CardContent>
                <BreakdownBar
                  items={balances.slice(0, 8).map((b) => ({
                    account: b.sub_group ?? b.type,
                    balance: Math.abs(b.balance),
                  }))}
                  colorClass="bg-indigo-500"
                />
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* ── Large Transactions ────────────────────────────────────────────── */}
      {!isLoading && largeJe.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Large Transactions</CardTitle>
            <p className="text-xs text-muted-foreground">Top 10 by amount this period</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="text-left pb-2 font-medium">Code</th>
                    <th className="text-left pb-2 font-medium">Description</th>
                    <th className="text-left pb-2 font-medium">Module</th>
                    <th className="text-right pb-2 font-medium">Amount</th>
                    <th className="text-right pb-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {largeJe.map((j, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2 font-mono text-xs">{j.code}</td>
                      <td className="py-2 text-muted-foreground max-w-[200px] truncate">{j.description}</td>
                      <td className="py-2">
                        <Badge variant="outline" className="text-xs capitalize">{j.module}</Badge>
                      </td>
                      <td className="py-2 text-right tabular-nums font-semibold">{fmt(j.amount)}</td>
                      <td className="py-2 text-right text-muted-foreground text-xs">{j.date?.slice(0, 10)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Recent Journal Entries ────────────────────────────────────────── */}
      {!isLoading && recentJe.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Recent Journal Entries</CardTitle>
            <p className="text-xs text-muted-foreground">Last 20 entries</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="text-left pb-2 font-medium">Code</th>
                    <th className="text-left pb-2 font-medium">Description</th>
                    <th className="text-left pb-2 font-medium">Status</th>
                    <th className="text-right pb-2 font-medium">Amount</th>
                    <th className="text-right pb-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentJe.map((j, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-2 font-mono text-xs">
                        {j.code}
                        {j.is_reversal && <span className="ml-1 text-rose-500 text-[10px]">REV</span>}
                      </td>
                      <td className="py-2 text-muted-foreground max-w-[200px] truncate">{j.description}</td>
                      <td className="py-2">
                        <Badge
                          variant={j.status === "completed" ? "default" : j.status === "pending" ? "secondary" : "outline"}
                          className="text-xs capitalize"
                        >
                          {j.status}
                        </Badge>
                      </td>
                      <td className="py-2 text-right tabular-nums font-semibold">{fmt(j.amount)}</td>
                      <td className="py-2 text-right text-muted-foreground text-xs">{j.date?.slice(0, 10)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Account Balances Bar Chart ────────────────────────────────────── */}
      {!isLoading && balances.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Account Group Balances</CardTitle>
            <p className="text-xs text-muted-foreground">Debit vs credit by account sub-group</p>
          </CardHeader>
          <CardContent className="pl-1">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={balances.slice(0, 12)} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="sub_group" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => (v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v)} />
                <Tooltip formatter={(v) => Number(v).toLocaleString()} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="debit" name="Debit" fill="hsl(var(--chart-1))" radius={[2, 2, 0, 0]} />
                <Bar dataKey="credit" name="Credit" fill="hsl(var(--chart-2))" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardTransactions;

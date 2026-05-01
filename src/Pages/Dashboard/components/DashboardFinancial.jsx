import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Scale, Wallet, Building2, TrendingUp, TrendingDown,
  Layers, AlertTriangle, PercentIcon, CreditCard, PiggyBank,
} from "lucide-react";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import StatCard from "./StatCard";
import { IncomeExpenses } from "./others/IncomeExpenses";

const fmt = (n) => (n != null ? Number(n).toLocaleString() : "—");
const fmtPct = (n) => (n != null ? `${Number(n).toFixed(2)}%` : "—");

function BreakdownList({ items = [], colorClass = "bg-primary" }) {
  if (!items.length) return (
    <p className="text-sm text-muted-foreground py-4 text-center">No data available.</p>
  );
  const max = Math.max(...items.map((i) => i.amount));
  return (
    <div className="space-y-2.5">
      {items.map((item) => (
        <div key={item.account} className="space-y-1">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="truncate font-medium">{item.account}</span>
            <div className="flex items-center gap-2 shrink-0 tabular-nums">
              <span className="text-muted-foreground">{fmtPct(item.pct)}</span>
              <span className="font-semibold">{fmt(item.amount)}</span>
            </div>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full ${colorClass}`}
              style={{ width: `${max > 0 ? (item.amount / max) * 100 : 0}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

const DashboardFinancial = ({ startDate, endDate }) => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();

  const { data = {}, isLoading } = useQuery({
    queryKey: ["dashboard-financial-data", startDate, endDate],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (startDate) params.set("startDate", startDate);
        if (endDate)   params.set("endDate",   endDate);
        const res = await axiosPrivate.get(`/dashboards/financial-position?${params}`);
        return res.data.data ?? {};
      } catch (error) {
        if (error?.response?.status === 401) navigate("/", { replace: true });
      }
    },
    enabled: !!startDate && !!endDate,
  });

  const balance = data?.balance_summary ?? {};
  const cash = data?.cash_position ?? {};
  const portfolios = data?.portfolios ?? {};
  const perf = data?.period_performance ?? {};
  const trend = (data?.performance_trend ?? []).map((d) => ({
    period: d.month,
    income: d.income,
    expenses: d.expenses,
  }));
  const revenue = data?.revenue_breakdown ?? [];
  const expenses = data?.expense_breakdown ?? [];
  const period = data?.period;

  return (
    <div className="space-y-6">

      {/* Period label */}
      {!isLoading && period && (
        <p className="text-xs text-muted-foreground">
          Reporting period: {period.start} — {period.end}
        </p>
      )}

      {/* Balance summary + cash position */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[108px] rounded-xl" />)
        ) : (
          <>
            <StatCard
              label="Total Assets"
              value={fmt(balance?.total_assets)}
              subtitle="Balance sheet total"
              icon={Layers}
              colorClass="text-indigo-600 dark:text-indigo-400"
              bgClass="bg-indigo-100 dark:bg-indigo-900/30"
            />
            <StatCard
              label="Total Liabilities"
              value={fmt(balance?.total_liabilities)}
              subtitle="Obligations outstanding"
              icon={Scale}
              colorClass="text-rose-600 dark:text-rose-400"
              bgClass="bg-rose-100 dark:bg-rose-900/30"
            />
            <StatCard
              label="Equity"
              value={fmt(balance?.equity)}
              subtitle="Net worth (assets − liabilities)"
              icon={TrendingUp}
              colorClass="text-emerald-600 dark:text-emerald-400"
              bgClass="bg-emerald-100 dark:bg-emerald-900/30"
            />
            <StatCard
              label="Cash on Hand"
              value={fmt(cash?.cash_on_hand)}
              subtitle="Physical cash"
              icon={Wallet}
              colorClass="text-amber-600 dark:text-amber-400"
              bgClass="bg-amber-100 dark:bg-amber-900/30"
            />
            <StatCard
              label="Bank Balance"
              value={fmt(cash?.bank_balance)}
              subtitle="Bank accounts total"
              icon={Building2}
              colorClass="text-sky-600 dark:text-sky-400"
              bgClass="bg-sky-100 dark:bg-sky-900/30"
            />
            <StatCard
              label="Total Liquid"
              value={fmt(cash?.total_liquid)}
              subtitle="Cash + bank combined"
              icon={PiggyBank}
              colorClass="text-violet-600 dark:text-violet-400"
              bgClass="bg-violet-100 dark:bg-violet-900/30"
            />
          </>
        )}
      </div>

      {/* Portfolio metrics */}
      {isLoading ? (
        <Skeleton className="h-[140px] rounded-xl" />
      ) : (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Portfolio Overview</CardTitle>
            <p className="text-xs text-muted-foreground">Loan and savings portfolio at a glance</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">Loan Portfolio</p>
                <p className="text-base font-bold tabular-nums text-sky-700 dark:text-sky-300">
                  {fmt(portfolios?.loan_portfolio)}
                </p>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">Overdue Portfolio</p>
                <p className="text-base font-bold tabular-nums text-rose-700 dark:text-rose-300">
                  {fmt(portfolios?.overdue_portfolio)}
                </p>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">Savings Deposits</p>
                <p className="text-base font-bold tabular-nums text-emerald-700 dark:text-emerald-300">
                  {fmt(portfolios?.savings_deposits)}
                </p>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">Active Accounts</p>
                <p className="text-base font-bold tabular-nums">
                  {fmt(portfolios?.accounts_count)}
                </p>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">Loan-to-Savings Ratio</p>
                <p className={`text-base font-bold tabular-nums ${
                  (portfolios?.loan_to_savings_ratio ?? 0) * 100 > 90
                    ? "text-rose-700 dark:text-rose-300"
                    : "text-amber-700 dark:text-amber-300"
                }`}>
                  {portfolios?.loan_to_savings_ratio != null
                    ? `${(Number(portfolios.loan_to_savings_ratio) * 100).toFixed(2)}%`
                    : "—"}
                </p>
              </div>
            </div>
            {/* Frozen vs available savings mini-row */}
            {(portfolios?.frozen_savings != null || portfolios?.available_savings != null) && (
              <div className="mt-4 pt-4 border-t flex flex-wrap gap-6 text-xs text-muted-foreground">
                <span>
                  Frozen savings:{" "}
                  <span className="font-semibold text-foreground">{fmt(portfolios?.frozen_savings)}</span>
                </span>
                <span>
                  Available savings:{" "}
                  <span className="font-semibold text-foreground">{fmt(portfolios?.available_savings)}</span>
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Period performance stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[108px] rounded-xl" />)
        ) : (
          <>
            <StatCard
              label="Period Income"
              value={fmt(perf?.total_income)}
              subtitle="Revenue this period"
              icon={TrendingUp}
              colorClass="text-emerald-600 dark:text-emerald-400"
              bgClass="bg-emerald-100 dark:bg-emerald-900/30"
            />
            <StatCard
              label="Period Expenses"
              value={fmt(perf?.total_expenses)}
              subtitle="Total outflows"
              icon={TrendingDown}
              colorClass="text-rose-600 dark:text-rose-400"
              bgClass="bg-rose-100 dark:bg-rose-900/30"
            />
            {/* Net profit — custom card for sign-aware colour */}
            <Card className="border shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <p className="text-sm font-medium text-muted-foreground">Net Profit</p>
                    <p className={`text-2xl font-bold tabular-nums tracking-tight ${
                      (perf?.net_profit ?? 0) >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}>
                      {fmt(perf?.net_profit)}
                    </p>
                    <p className="text-xs text-muted-foreground">Income minus expenses</p>
                  </div>
                  <div className={`p-2.5 rounded-xl shrink-0 ${
                    (perf?.net_profit ?? 0) >= 0
                      ? "bg-emerald-100 dark:bg-emerald-900/30"
                      : "bg-rose-100 dark:bg-rose-900/30"
                  }`}>
                    <CreditCard className={`h-5 w-5 ${
                      (perf?.net_profit ?? 0) >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`} />
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Profit margin */}
            <Card className="border shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <p className="text-sm font-medium text-muted-foreground">Profit Margin</p>
                    <p className={`text-2xl font-bold tabular-nums tracking-tight ${
                      (perf?.profit_margin_pct ?? 0) >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}>
                      {perf?.profit_margin_pct != null
                        ? `${Number(perf.profit_margin_pct).toFixed(1)}%`
                        : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">Net profit / income</p>
                  </div>
                  <div className="p-2.5 rounded-xl shrink-0 bg-slate-100 dark:bg-slate-900/30">
                    <PercentIcon className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Revenue + Expense breakdowns */}
      <div className="grid gap-4 lg:grid-cols-2">
        {isLoading ? (
          <>
            <Skeleton className="h-[360px] rounded-xl" />
            <Skeleton className="h-[360px] rounded-xl" />
          </>
        ) : (
          <>
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Revenue Breakdown</CardTitle>
                <p className="text-xs text-muted-foreground">Income sources this period</p>
              </CardHeader>
              <CardContent>
                <BreakdownList items={revenue} colorClass="bg-emerald-500" />
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Expense Breakdown</CardTitle>
                <p className="text-xs text-muted-foreground">Expenditure categories this period</p>
              </CardHeader>
              <CardContent className="max-h-[380px] overflow-y-auto pr-1">
                <BreakdownList items={expenses} colorClass="bg-rose-500" />
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Performance trend */}
      {isLoading ? (
        <Skeleton className="h-[300px] rounded-xl" />
      ) : (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Income vs Expenses Trend</CardTitle>
            <p className="text-xs text-muted-foreground">Monthly performance over the fiscal year</p>
          </CardHeader>
          <CardContent className="pl-2">
            <IncomeExpenses monthlyData={trend} />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardFinancial;

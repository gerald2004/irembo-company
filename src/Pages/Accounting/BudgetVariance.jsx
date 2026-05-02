/* eslint-disable react/prop-types */
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { useState, useMemo } from "react";
import { Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend,
} from "recharts";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const fmt = (n) => new Intl.NumberFormat("en-UG", { maximumFractionDigits: 0 }).format(n ?? 0);

function VarianceBadge({ variance, pct }) {
  if (variance == null) return <span className="text-muted-foreground text-xs">—</span>;
  if (variance >= 0) return (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-600">
      <TrendingUp size={11} /> {fmt(variance)} ({pct != null ? `${pct}%` : "—"})
    </span>
  );
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-medium text-red-600">
      <TrendingDown size={11} /> {fmt(Math.abs(variance))} ({pct != null ? `${Math.abs(pct)}%` : "—"})
    </span>
  );
}

function SummaryCard({ label, budgeted, actual, variance, accent }) {
  return (
    <div className={`rounded-lg border bg-card p-4 border-l-4 ${accent}`}>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <div className="grid grid-cols-3 gap-2 mt-2">
        <div><p className="text-[10px] text-muted-foreground">Budgeted</p><p className="text-sm font-bold tabular-nums">{fmt(budgeted)}</p></div>
        <div><p className="text-[10px] text-muted-foreground">Actual</p><p className="text-sm font-bold tabular-nums">{fmt(actual)}</p></div>
        <div><p className="text-[10px] text-muted-foreground">Variance</p>
          <p className={`text-sm font-bold tabular-nums ${variance >= 0 ? "text-emerald-600" : "text-red-600"}`}>{fmt(Math.abs(variance))}</p>
        </div>
      </div>
    </div>
  );
}

export default function BudgetVariance() {
  const { budgetId } = useParams();
  const axios = useAxiosPrivate();
  const [viewMonth, setViewMonth] = useState("all");
  const [activeType, setActiveType] = useState("Income");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["budget-variance", budgetId],
    queryFn: async () => {
      const res = await axios.get(`accounting/budgets/${budgetId}/variance`);
      return res.data?.data;
    },
  });

  const budget   = data?.budget;
  const accounts = data?.accounts ?? [];
  const summary  = data?.summary ?? {};

  const filtered = useMemo(() =>
    accounts.filter(a => a.account_type === activeType), [accounts, activeType]);

  // Chart data: monthly totals (budgeted vs actual) for all accounts of active type
  const chartData = useMemo(() => MONTHS.map((m, mi) => {
    const mo = mi + 1;
    const budgeted = filtered.reduce((s, a) => s + (a.months[mo]?.budgeted ?? 0), 0);
    const actual   = filtered.reduce((s, a) => s + (a.months[mo]?.actual   ?? 0), 0);
    return { month: m, Budgeted: budgeted, Actual: actual };
  }), [filtered]);

  const getMonthData = (acc) => {
    if (viewMonth === "all") return acc.totals;
    const m = parseInt(viewMonth);
    return acc.months[m] ?? { budgeted: 0, actual: 0, variance: 0, variance_pct: null };
  };

  if (isLoading) return <div className="flex items-center justify-center py-24"><Loader2 className="animate-spin" /></div>;
  if (isError || !budget) return <div className="py-10 text-center text-muted-foreground">Variance data unavailable.</div>;

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink to="/dashboard">Home</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink to="/budgets">Budgets</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink to={`/budgets/${budgetId}`}>{budget.budget_name}</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Variance Report</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-1 space-y-4 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h5 className="text-2xl font-bold tracking-tight">Budget Variance — {budget.budget_year}</h5>
            <p className="text-sm text-muted-foreground">{budget.budget_name} · Budgeted vs Actual</p>
          </div>
          <Select value={viewMonth} onValueChange={setViewMonth}>
            <SelectTrigger className="w-36 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Full Year</SelectItem>
              {MONTHS.map((m, mi) => <SelectItem key={mi} value={String(mi + 1)}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SummaryCard label="Income" budgeted={summary.income?.budgeted ?? 0} actual={summary.income?.actual ?? 0} variance={summary.income?.variance ?? 0} accent="border-l-emerald-500" />
          <SummaryCard label="Expenses" budgeted={summary.expenses?.budgeted ?? 0} actual={summary.expenses?.actual ?? 0} variance={summary.expenses?.variance ?? 0} accent="border-l-red-500" />
        </div>

        {/* Chart */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold">Monthly Trend — {activeType}</p>
            <div className="flex items-center gap-1 bg-muted rounded p-0.5">
              {["Income","Expenses"].map(t => (
                <button key={t} onClick={() => setActiveType(t)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${activeType === t ? "bg-background shadow" : "text-muted-foreground"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v >= 1e6 ? `${(v/1e6).toFixed(1)}M` : v >= 1e3 ? `${(v/1e3).toFixed(0)}K` : v} />
                <Tooltip formatter={(v) => fmt(v)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Budgeted" fill={activeType === 'Income' ? "#86efac" : "#fca5a5"} radius={[3,3,0,0]} />
                <Bar dataKey="Actual"   fill={activeType === 'Income' ? "#16a34a" : "#dc2626"} radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tab toggle */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1 w-fit">
          {["Income","Expenses"].map(t => (
            <button key={t} onClick={() => setActiveType(t)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeType === t ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Variance table */}
        <div className="border rounded-lg overflow-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-3 py-2.5 text-left font-semibold">Account</th>
                <th className="px-3 py-2.5 text-right font-semibold">Budgeted</th>
                <th className="px-3 py-2.5 text-right font-semibold">Actual</th>
                <th className="px-3 py-2.5 text-right font-semibold">Variance</th>
                <th className="px-3 py-2.5 text-center font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No data for this period.</td></tr>
              )}
              {filtered.map(acc => {
                const d = getMonthData(acc);
                const isOver = d.variance < 0;
                return (
                  <tr key={acc.account_id} className="border-b hover:bg-muted/20">
                    <td className="px-3 py-2">
                      <p className="font-medium">{acc.account_title}</p>
                      <p className="text-[10px] text-muted-foreground">{acc.account_code} · {acc.sub_group}</p>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{fmt(d.budgeted)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{fmt(d.actual)}</td>
                    <td className="px-3 py-2 text-right">
                      <VarianceBadge variance={d.variance} pct={d.variance_pct} />
                    </td>
                    <td className="px-3 py-2 text-center">
                      {d.budgeted === 0 && d.actual === 0 ? (
                        <Badge variant="outline" className="text-[10px]">No Data</Badge>
                      ) : isOver ? (
                        <Badge variant="destructive" className="text-[10px]">{activeType === 'Income' ? 'Under Target' : 'Over Budget'}</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] bg-emerald-100 text-emerald-700">{activeType === 'Income' ? 'On/Above Target' : 'Under Budget'}</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

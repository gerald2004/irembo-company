/* eslint-disable react/prop-types */
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import LoanGeneralReportQuery from "../Queries/LoanGeneralReportQuery";
import { useState, useCallback } from "react";
import { TrendingUp, BarChart3, DollarSign, AlertTriangle } from "lucide-react";

const fmt = (v) =>
  new Intl.NumberFormat("en-UG", { maximumFractionDigits: 0 }).format(v ?? 0);

const KpiCard = ({ title, value, sub, icon: Icon, color = "text-foreground", bg = "bg-muted/30" }) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-muted-foreground font-medium">{title}</p>
          <p className={`text-xl font-bold mt-0.5 ${color}`}>{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
        <div className={`rounded-lg p-2 ${bg} shrink-0`}>
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

const PERIOD_OPTIONS = [
  { value: "monthly", label: "Monthly" },
  { value: "weekly",  label: "Weekly" },
  { value: "daily",   label: "Daily" },
];

const LoanPeriodicRepaymentReport = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();

  const [periodType, setPeriodType] = useState("monthly");
  const [filters, setFilters] = useState({ startDate: "", endDate: "", branch_id: "" });

  // Merge incoming filter changes without wiping periodType
  const handleFilterChange = useCallback(
    (incoming) => setFilters((prev) => ({ ...prev, ...incoming })),
    []
  );

  const { data: raw = {}, isLoading, isRefetching, isError, refetch } = useQuery({
    queryKey: ["loan-repayment-periodic", filters, periodType],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get("reports/loans/repayment-periodic", {
          params: {
            startDate:   filters.startDate   || undefined,
            endDate:     filters.endDate     || undefined,
            period_type: periodType,
            branch_id:   filters.branch_id   || undefined,
          },
        });
        return res?.data?.data ?? {};
      } catch (error) {
        if (error?.response?.status === 401)
          navigate("/", { state: { from: location }, replace: true });
        throw error;
      }
    },
    placeholderData: (prev) => prev,
  });

  const periods = Array.isArray(raw?.periods) ? raw.periods : [];
  const totals  = raw?.totals ?? {};
  const loading = isLoading || isRefetching;

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink to="/dashboard">Home</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink to="/loans-reports">Loans Reports</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Periodic Repayments</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-5 p-0 pt-2">
          <h5 className="text-2xl font-bold tracking-tight">Periodic Loan Repayment Report</h5>

          <LoanGeneralReportQuery
            show={{ officer: false, product: true }}
            onFilterChange={handleFilterChange}
            isRefetching={isRefetching}
            refetch={refetch}
            data={[]}
            tableRef={null}
            filters={filters}
            colSpan={0}
            title="Periodic Loan Repayment Report"
            totals={{}}
            mode={{ format: "A4-L", orientation: "L" }}
          />

          {/* Period type toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Group by:</span>
            <div className="flex gap-1">
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPeriodType(opt.value)}
                  className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
                    periodType === opt.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-border hover:bg-muted"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
              </div>
              <Skeleton className="h-64 rounded-xl" />
            </div>
          ) : isError ? (
            <p className="text-sm text-red-600">Failed to load repayment data. Please try again.</p>
          ) : periods.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              No repayment transactions found. Select a date range and click Apply.
            </div>
          ) : (
            <>
              {/* KPI summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <KpiCard
                  title="Total Collected"
                  value={fmt(totals.total_collected)}
                  sub={`${totals.periods_count ?? periods.length} ${periodType} periods`}
                  icon={TrendingUp}
                  color="text-green-600"
                  bg="bg-green-50 dark:bg-green-900/20"
                />
                <KpiCard
                  title="Principal Collected"
                  value={fmt(totals.principal_collected)}
                  sub="principal repaid"
                  icon={BarChart3}
                  color="text-blue-600"
                  bg="bg-blue-50 dark:bg-blue-900/20"
                />
                <KpiCard
                  title="Interest Collected"
                  value={fmt(totals.interest_collected)}
                  sub="interest income received"
                  icon={DollarSign}
                  color="text-violet-600"
                  bg="bg-violet-50 dark:bg-violet-900/20"
                />
                <KpiCard
                  title="Penalty Collected"
                  value={fmt(totals.penalty_collected)}
                  sub={`${totals.transactions_count ?? 0} total transactions`}
                  icon={AlertTriangle}
                  color="text-amber-600"
                  bg="bg-amber-50 dark:bg-amber-900/20"
                />
              </div>

              {/* Breakdown table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h6 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {periodType.charAt(0).toUpperCase() + periodType.slice(1)} Breakdown
                  </h6>
                  <Badge variant="outline" className="text-xs">{periods.length} periods</Badge>
                </div>
                <div className="rounded-lg border overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">Period</th>
                        <th className="px-3 py-2 text-right font-medium">Principal</th>
                        <th className="px-3 py-2 text-right font-medium">Interest</th>
                        <th className="px-3 py-2 text-right font-medium">Penalty</th>
                        <th className="px-3 py-2 text-right font-medium">Total</th>
                        <th className="px-3 py-2 text-right font-medium">Txns</th>
                        <th className="px-3 py-2 text-right font-medium">Loans</th>
                      </tr>
                    </thead>
                    <tbody>
                      {periods.map((p) => (
                        <tr key={p.period_key} className="border-t hover:bg-muted/20">
                          <td className="px-3 py-2 font-medium">{p.period_label}</td>
                          <td className="px-3 py-2 text-right">{fmt(p.principal_collected)}</td>
                          <td className="px-3 py-2 text-right">{fmt(p.interest_collected)}</td>
                          <td className={`px-3 py-2 text-right ${Number(p.penalty_collected) > 0 ? "text-amber-600" : ""}`}>
                            {fmt(p.penalty_collected)}
                          </td>
                          <td className="px-3 py-2 text-right font-semibold text-green-700">
                            {fmt(p.total_collected)}
                          </td>
                          <td className="px-3 py-2 text-right text-muted-foreground">{p.transactions_count}</td>
                          <td className="px-3 py-2 text-right text-muted-foreground">{p.loans_count}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t bg-muted/30">
                      <tr>
                        <td className="px-3 py-2 font-semibold">Totals</td>
                        <td className="px-3 py-2 text-right font-semibold">{fmt(totals.principal_collected)}</td>
                        <td className="px-3 py-2 text-right font-semibold">{fmt(totals.interest_collected)}</td>
                        <td className="px-3 py-2 text-right font-semibold">{fmt(totals.penalty_collected)}</td>
                        <td className="px-3 py-2 text-right font-bold text-green-700">{fmt(totals.total_collected)}</td>
                        <td className="px-3 py-2 text-right font-semibold">{totals.transactions_count}</td>
                        <td className="px-3 py-2" />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Trend bar chart */}
              {periods.length > 1 && (() => {
                const maxVal = periods.reduce((m, p) => Math.max(m, Number(p.total_collected) || 0), 1);
                return (
                  <div className="space-y-2">
                    <h6 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Collection Trend</h6>
                    <div className="rounded-lg border p-4">
                      <div className="flex items-end gap-1" style={{ height: "80px" }}>
                        {periods.map((p) => {
                          const pct = Math.max(((Number(p.total_collected) || 0) / maxVal) * 100, 1);
                          return (
                            <div
                              key={p.period_key}
                              className="flex-1 rounded-t bg-emerald-500 hover:bg-emerald-600 transition-colors cursor-default"
                              style={{ height: `${pct}%` }}
                              title={`${p.period_label}: ${fmt(p.total_collected)}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default LoanPeriodicRepaymentReport;

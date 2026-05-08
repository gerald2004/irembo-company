/* eslint-disable react/prop-types */
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import useBranchFilter from "@/MiddleWares/Hooks/useBranchFilter";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import LoanGeneralReportQuery from "../Queries/LoanGeneralReportQuery";
import { useState } from "react";
import {
  TrendingUp, TrendingDown, AlertTriangle, ShieldAlert,
  BarChart3, Layers, Building2,
} from "lucide-react";

const fmt = (v) =>
  new Intl.NumberFormat("en-UG", { maximumFractionDigits: 0 }).format(v ?? 0);

const PAR_COLORS = {
  PAR1:   { bar: "bg-yellow-400", badge: "bg-yellow-50 text-yellow-800 border-yellow-200" },
  PAR30:  { bar: "bg-orange-400", badge: "bg-orange-50 text-orange-800 border-orange-200" },
  PAR60:  { bar: "bg-red-400",    badge: "bg-red-50 text-red-800 border-red-200" },
  PAR90:  { bar: "bg-red-600",    badge: "bg-red-100 text-red-900 border-red-300" },
  PAR180: { bar: "bg-rose-800",   badge: "bg-rose-100 text-rose-900 border-rose-300" },
};

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

const LoansPortfolioReportSummary = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const { branchKey } = useBranchFilter();
  const [filters, setFilters] = useState({ startDate: "", endDate: "", branch_id: String(branchKey ?? "") });

  const { data: raw = {}, isLoading, isRefetching, isError } = useQuery({
    queryKey: ["portfolio-loans-summary", filters],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get("reports/loans/portfolio-summary", {
          params: {
            branch_id: filters.branch_id || undefined,
            startDate: filters.startDate || undefined,
            endDate:   filters.endDate   || undefined,
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

  const s       = raw?.summary    ?? {};
  const parTiers = raw?.par_tiers  ?? {};
  const byProduct = raw?.by_product ?? [];
  const byBranch  = raw?.by_branch  ?? [];

  const loading = isLoading || isRefetching;

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink to="/dashboard">Home</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink to="/loans-reports">Loans Reports</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Portfolio Summary</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-5 p-0 pt-2">
          <h5 className="text-2xl font-bold tracking-tight">Loan Portfolio Summary</h5>

          <LoanGeneralReportQuery
            show={{ officer: false }}
            onFilterChange={setFilters}
            isRefetching={isRefetching}
            data={[]}
            tableRef={null}
            filters={filters}
            colSpan={0}
            title="Portfolio Summary"
            totals={{}}
            mode={{ format: "A4-L", orientation: "L" }}
          />

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
            </div>
          ) : isError ? (
            <p className="text-sm text-red-600">Failed to load portfolio summary.</p>
          ) : (
            <>
              {/* Core KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <KpiCard
                  title="Active Loans"
                  value={fmt(s.active_loans_count)}
                  sub="currently disbursed"
                  icon={TrendingUp}
                  color="text-blue-600"
                  bg="bg-blue-50 dark:bg-blue-900/20"
                />
                <KpiCard
                  title="Total Disbursed"
                  value={fmt(s.total_disbursed_amount)}
                  sub="principal at disbursement"
                  icon={BarChart3}
                  color="text-violet-600"
                  bg="bg-violet-50 dark:bg-violet-900/20"
                />
                <KpiCard
                  title="Outstanding Principal"
                  value={fmt(s.total_outstanding_principal)}
                  sub={`+ Interest: ${fmt(s.total_outstanding_interest)}`}
                  icon={Layers}
                  color="text-emerald-600"
                  bg="bg-emerald-50 dark:bg-emerald-900/20"
                />
                <KpiCard
                  title="Total Outstanding"
                  value={fmt(s.total_outstanding_total)}
                  sub="principal + interest"
                  icon={Layers}
                  color="text-teal-600"
                  bg="bg-teal-50 dark:bg-teal-900/20"
                />
                <KpiCard
                  title="Overdue Principal"
                  value={fmt(s.total_overdue_principal)}
                  sub="past-due unpaid"
                  icon={AlertTriangle}
                  color="text-amber-600"
                  bg="bg-amber-50 dark:bg-amber-900/20"
                />
                <KpiCard
                  title="Portfolio At Risk"
                  value={`${s.portfolio_at_risk ?? 0}%`}
                  sub="overdue / outstanding"
                  icon={ShieldAlert}
                  color={s.portfolio_at_risk > 10 ? "text-red-600" : s.portfolio_at_risk > 5 ? "text-amber-600" : "text-green-600"}
                  bg={s.portfolio_at_risk > 10 ? "bg-red-50 dark:bg-red-900/20" : "bg-green-50 dark:bg-green-900/20"}
                />
                {s.new_loans_in_period > 0 && (
                  <KpiCard
                    title="New Loans (Period)"
                    value={fmt(s.new_loans_in_period)}
                    sub={`disbursed: ${fmt(s.new_loans_amount)}`}
                    icon={TrendingUp}
                    color="text-indigo-600"
                    bg="bg-indigo-50 dark:bg-indigo-900/20"
                  />
                )}
                {s.collection_rate !== null && s.collection_rate !== undefined && (
                  <KpiCard
                    title="Collection Rate"
                    value={`${s.collection_rate}%`}
                    sub="collected / due in period"
                    icon={s.collection_rate >= 90 ? TrendingUp : TrendingDown}
                    color={s.collection_rate >= 90 ? "text-green-600" : s.collection_rate >= 70 ? "text-amber-600" : "text-red-600"}
                    bg="bg-muted/30"
                  />
                )}
              </div>

              {/* PAR Tiers */}
              {Object.keys(parTiers).length > 0 && (
                <div className="space-y-3">
                  <h6 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Portfolio At Risk — Tiers</h6>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {Object.entries(parTiers).map(([key, tier]) => {
                      const c = PAR_COLORS[key] ?? { bar: "bg-gray-400", badge: "bg-gray-50 text-gray-800 border-gray-200" };
                      return (
                        <Card key={key}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold">{key}</span>
                              <span className={`text-xs rounded-full border px-2 py-0.5 font-medium ${c.badge}`}>
                                {tier.par_percent}%
                              </span>
                            </div>
                            <p className="text-sm font-bold">{fmt(tier.overdue_principal)}</p>
                            <p className="text-xs text-muted-foreground">{tier.loans_count} loans</p>
                            <div className="mt-2 h-1.5 rounded-full bg-muted">
                              <div
                                className={`h-1.5 rounded-full ${c.bar}`}
                                style={{ width: `${Math.min(tier.par_percent, 100)}%` }}
                              />
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* By Product */}
              {byProduct.length > 0 && (
                <div className="space-y-2">
                  <h6 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Breakdown by Product</h6>
                  <div className="rounded-lg border overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">Product</th>
                          <th className="px-3 py-2 text-right font-medium">Loans</th>
                          <th className="px-3 py-2 text-right font-medium">Disbursed</th>
                          <th className="px-3 py-2 text-right font-medium">Outstanding</th>
                          <th className="px-3 py-2 text-right font-medium">Overdue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {byProduct.map((p) => (
                          <tr key={p.product_id} className="border-t hover:bg-muted/20">
                            <td className="px-3 py-2 font-medium">{p.product}</td>
                            <td className="px-3 py-2 text-right">{p.loans_count}</td>
                            <td className="px-3 py-2 text-right">{fmt(p.total_disbursed)}</td>
                            <td className="px-3 py-2 text-right">{fmt(p.outstanding)}</td>
                            <td className={`px-3 py-2 text-right font-medium ${p.overdue > 0 ? "text-red-600" : "text-green-600"}`}>
                              {fmt(p.overdue)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* By Branch */}
              {byBranch.length > 0 && (
                <div className="space-y-2">
                  <h6 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" /> Breakdown by Branch
                  </h6>
                  <div className="rounded-lg border overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">Branch</th>
                          <th className="px-3 py-2 text-right font-medium">Loans</th>
                          <th className="px-3 py-2 text-right font-medium">Total Disbursed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {byBranch.map((b) => (
                          <tr key={b.branch_id} className="border-t hover:bg-muted/20">
                            <td className="px-3 py-2 font-medium">{b.branch_name}</td>
                            <td className="px-3 py-2 text-right">{b.loans_count}</td>
                            <td className="px-3 py-2 text-right">{fmt(b.total_disbursed)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default LoansPortfolioReportSummary;

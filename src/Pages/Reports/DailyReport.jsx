import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DailyReportQuery from "./Components/Blocks/Queries/DailyReportQuery";
import { useState } from "react";
import {
  ArrowDownToLine, ArrowUpFromLine, TrendingUp, TrendingDown,
  Users, FileText, Wallet, AlertTriangle, RefreshCw,
  DollarSign, Landmark, ArrowLeftRight,
} from "lucide-react";

const fmt = (v) =>
  new Intl.NumberFormat("en-UG", { maximumFractionDigits: 0 }).format(v ?? 0);

const Kpi = ({ title, value, sub, icon: Icon, color = "text-foreground", bg = "bg-muted/30" }) => (
  <Card className="overflow-hidden">
    <CardContent className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground font-medium truncate">{title}</p>
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

const Section = ({ title, children }) => (
  <div className="space-y-3">
    <h6 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</h6>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">{children}</div>
  </div>
);

const DailyReport = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ date: "", branch_id: "" });

  const { data: r = {}, isRefetching, refetch, isLoading } = useQuery({
    queryKey: ["daily-report", filters],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get("reports/daily-report", {
          params: { date: filters.date || undefined, branch_id: filters.branch_id || undefined },
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

  const net = r?.net_cash_position ?? 0;

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink to="/dashboard">Home</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Daily Reports</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-5 p-0 pt-2">
          <div className="flex items-center justify-between">
            <h5 className="text-2xl font-bold tracking-tight">Daily Report</h5>
            {isRefetching && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Refreshing…
              </div>
            )}
          </div>

          <DailyReportQuery onFilterChange={setFilters} isRefetching={isRefetching} refetch={refetch} />

          {!isLoading && (
            <>
              {/* Net position banner */}
              <div className={`flex items-center justify-between rounded-xl border px-5 py-3 ${net >= 0 ? "bg-green-50 border-green-200 dark:bg-green-950/30" : "bg-red-50 border-red-200 dark:bg-red-950/30"}`}>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Net Cash Position for {r.date || "today"}</p>
                  <p className={`text-2xl font-bold ${net >= 0 ? "text-green-700" : "text-red-700"}`}>
                    {net >= 0 ? "+" : ""}{fmt(net)}
                  </p>
                </div>
                <div className={`rounded-full p-3 ${net >= 0 ? "bg-green-100 dark:bg-green-900/40" : "bg-red-100 dark:bg-red-900/40"}`}>
                  {net >= 0
                    ? <TrendingUp className="w-5 h-5 text-green-600" />
                    : <TrendingDown className="w-5 h-5 text-red-600" />}
                </div>
              </div>

              {/* Savings & Withdrawals */}
              <Section title="Savings Activity">
                <Kpi
                  title="Deposits"
                  value={fmt(r.deposits?.total)}
                  sub={`${r.deposits?.count ?? 0} transactions`}
                  icon={ArrowDownToLine}
                  color="text-green-600"
                  bg="bg-green-50 dark:bg-green-900/20"
                />
                <Kpi
                  title="Withdrawals"
                  value={fmt(r.withdrawals?.total)}
                  sub={`${r.withdrawals?.count ?? 0} transactions • charges: ${fmt(r.withdrawals?.total_charges)}`}
                  icon={ArrowUpFromLine}
                  color="text-red-500"
                  bg="bg-red-50 dark:bg-red-900/20"
                />
                <Kpi
                  title="Total Savings Balance"
                  value={fmt(r.savings_balance_snapshot)}
                  sub="all active accounts (snapshot)"
                  icon={Wallet}
                  color="text-blue-600"
                  bg="bg-blue-50 dark:bg-blue-900/20"
                />
              </Section>

              {/* Loans */}
              <Section title="Loan Activity">
                <Kpi
                  title="Loans Disbursed"
                  value={fmt(r.loans_disbursed?.total)}
                  sub={`${r.loans_disbursed?.count ?? 0} loans disbursed`}
                  icon={ArrowDownToLine}
                  color="text-violet-600"
                  bg="bg-violet-50 dark:bg-violet-900/20"
                />
                <Kpi
                  title="Repayments Collected"
                  value={fmt(r.loan_repayments?.total)}
                  sub={`P: ${fmt(r.loan_repayments?.principal)} • I: ${fmt(r.loan_repayments?.interest)} • Pen: ${fmt(r.loan_repayments?.penalty)}`}
                  icon={DollarSign}
                  color="text-emerald-600"
                  bg="bg-emerald-50 dark:bg-emerald-900/20"
                />
                <Kpi
                  title="Active Loans"
                  value={fmt(r.active_loans_snapshot?.count)}
                  sub="currently disbursed"
                  icon={TrendingUp}
                  color="text-blue-600"
                  bg="bg-blue-50 dark:bg-blue-900/20"
                />
                <Kpi
                  title="Overdue Loans"
                  value={fmt(r.overdue_loans?.count)}
                  sub={`overdue amount: ${fmt(r.overdue_loans?.total_overdue)}`}
                  icon={AlertTriangle}
                  color="text-amber-600"
                  bg="bg-amber-50 dark:bg-amber-900/20"
                />
              </Section>

              {/* Applications & Clients */}
              <Section title="Applications & Clients">
                <Card>
                  <CardHeader className="pb-1 pt-3 px-4">
                    <CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" /> Loan Applications
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-3 space-y-1">
                    <p className="text-xl font-bold">{r.loan_applications?.count ?? 0}</p>
                    <div className="flex flex-wrap gap-1">
                      {r.loan_applications?.pending > 0 && (
                        <Badge variant="outline" className="text-xs">Pending: {r.loan_applications.pending}</Badge>
                      )}
                      {r.loan_applications?.approved > 0 && (
                        <Badge variant="secondary" className="text-xs">Approved: {r.loan_applications.approved}</Badge>
                      )}
                      {r.loan_applications?.disbursed > 0 && (
                        <Badge className="text-xs">Disbursed: {r.loan_applications.disbursed}</Badge>
                      )}
                      {r.loan_applications?.rejected > 0 && (
                        <Badge variant="destructive" className="text-xs">Rejected: {r.loan_applications.rejected}</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-1 pt-3 px-4">
                    <CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> New Clients
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-3 space-y-1">
                    <p className="text-xl font-bold">{r.new_clients?.count ?? 0}</p>
                    <div className="flex flex-wrap gap-1">
                      {r.new_clients?.individual > 0 && (
                        <Badge variant="outline" className="text-xs">Individual: {r.new_clients.individual}</Badge>
                      )}
                      {r.new_clients?.group > 0 && (
                        <Badge variant="outline" className="text-xs">Group: {r.new_clients.group}</Badge>
                      )}
                      {r.new_clients?.company > 0 && (
                        <Badge variant="outline" className="text-xs">Company: {r.new_clients.company}</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Section>

              {/* Income, Expenses, Transfers */}
              <Section title="Financial Operations">
                <Kpi
                  title="Incomes"
                  value={fmt(r.incomes?.total)}
                  sub={`${r.incomes?.count ?? 0} income entries`}
                  icon={TrendingUp}
                  color="text-green-600"
                  bg="bg-green-50 dark:bg-green-900/20"
                />
                <Kpi
                  title="Expenses"
                  value={fmt(r.expenses?.total)}
                  sub={`${r.expenses?.count ?? 0} vendor bills paid`}
                  icon={TrendingDown}
                  color="text-red-500"
                  bg="bg-red-50 dark:bg-red-900/20"
                />
                <Kpi
                  title="Internal Transfers"
                  value={fmt(r.internal_transfers?.total)}
                  sub={`${r.internal_transfers?.count ?? 0} transfers`}
                  icon={ArrowLeftRight}
                  color="text-slate-600"
                  bg="bg-slate-50 dark:bg-slate-900/20"
                />
              </Section>

              {/* Journal Summary */}
              <Section title="Journal Summary">
                <Kpi
                  title="Total Debits"
                  value={fmt(r.journal_summary?.total_debit)}
                  sub={`${r.journal_summary?.entries_count ?? 0} journal entries`}
                  icon={Landmark}
                  color="text-blue-600"
                  bg="bg-blue-50 dark:bg-blue-900/20"
                />
                <Kpi
                  title="Total Credits"
                  value={fmt(r.journal_summary?.total_credit)}
                  sub="credit side total"
                  icon={Landmark}
                  color="text-purple-600"
                  bg="bg-purple-50 dark:bg-purple-900/20"
                />
              </Section>

              {/* Deposits breakdown */}
              {(r.deposits?.cash > 0 || r.deposits?.mobile_money > 0 || r.deposits?.bank > 0) && (
                <Section title="Deposit Methods">
                  <Kpi title="Cash Deposits" value={fmt(r.deposits?.cash)} icon={DollarSign} color="text-green-600" bg="bg-green-50 dark:bg-green-900/20" />
                  <Kpi title="Mobile Money" value={fmt(r.deposits?.mobile_money)} icon={Wallet} color="text-yellow-600" bg="bg-yellow-50 dark:bg-yellow-900/20" />
                  <Kpi title="Bank Transfer" value={fmt(r.deposits?.bank)} icon={Landmark} color="text-blue-600" bg="bg-blue-50 dark:bg-blue-900/20" />
                </Section>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default DailyReport;

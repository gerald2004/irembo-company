import { useState } from "react";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import ReportFilterBar from "../Queries/ReportFilterBar";

const fmtMoney = (v) =>
  new Intl.NumberFormat("en-UG", { maximumFractionDigits: 0 }).format(v ?? 0);

const LineRow = ({ label, amount, bold, indent, negative }) => (
  <div className={`flex justify-between py-1 px-2 ${indent ? "pl-6" : ""} ${bold ? "font-semibold" : ""} ${negative ? "text-red-600" : ""}`}>
    <span className="text-sm">{label}</span>
    <span className="text-sm tabular-nums">
      {negative && amount > 0 ? `(${fmtMoney(amount)})` : fmtMoney(amount)}
    </span>
  </div>
);

const SectionHeader = ({ title }) => (
  <div className="bg-muted px-2 py-1.5 rounded mt-3">
    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{title}</p>
  </div>
);

const ComprehensiveIncomeReport = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    startDate: "", endDate: "", branch_id: "", status: "all",
  });

  const { data, isLoading, isRefetching, isError } = useQuery({
    queryKey: ["comprehensive-income", filters],
    queryFn: async ({ signal }) => {
      try {
        const res = await axiosPrivate.get("reports/accounting/comprehensive-income", {
          params: { startDate: filters.startDate, endDate: filters.endDate, branch_id: filters.branch_id },
          signal,
        });
        return res?.data?.data ?? null;
      } catch (err) {
        if (err?.response?.status === 401) navigate("/", { replace: true });
        throw err;
      }
    },
    placeholderData: (prev) => prev,
  });

  const revenue  = data?.revenue     ?? {};
  const expenses = data?.expenses    ?? {};
  const net      = data?.net         ?? {};
  const ops      = data?.operational ?? {};
  const period   = data?.period      ?? {};

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink to="/dashboard">Home</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink to="/accounting-reports">Accounting Reports</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Comprehensive Income</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-1 space-y-4 pt-2">
        <h5 className="text-2xl font-bold tracking-tight">Comprehensive Income Statement</h5>

        <ReportFilterBar
          onApply={setFilters}
          isLoading={isRefetching}
          showStatus={false}
          exportDisabled
        />

        {isError && (
          <p className="text-sm text-destructive">Failed to load report. Please try again.</p>
        )}

        {isLoading && !data && (
          <p className="text-sm text-muted-foreground animate-pulse">Loading comprehensive income…</p>
        )}

        {data && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl">

            {/* REVENUE */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  Revenue
                  {period.start_date && (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      {period.start_date} → {period.end_date}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-0 p-3">
                <SectionHeader title="Account Income" />
                {(revenue.income_accounts ?? []).map((r, i) => (
                  <LineRow key={i} label={r.account} amount={r.amount} indent />
                ))}
                {(revenue.income_accounts ?? []).length === 0 && (
                  <p className="text-xs text-muted-foreground pl-2 py-1">No income accounts</p>
                )}
                <LineRow label="Total Account Income" amount={revenue.total_account_income} bold />

                <SectionHeader title="Loan Income" />
                <LineRow label="Loan Interest Received" amount={revenue.loan_interest_income} indent />
                <LineRow label="Loan Penalty / Late Fees" amount={revenue.loan_penalty_income} indent />

                <Separator className="my-2" />
                <LineRow label="Gross Operating Income" amount={revenue.gross_operating_income} bold />
              </CardContent>
            </Card>

            {/* EXPENSES */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Expenses &amp; Net Income</CardTitle>
              </CardHeader>
              <CardContent className="space-y-0 p-3">
                <SectionHeader title="Operating Expenses" />
                {(expenses.expense_accounts ?? []).map((r, i) => (
                  <LineRow key={i} label={r.account} amount={r.amount} indent negative />
                ))}
                {(expenses.expense_accounts ?? []).length === 0 && (
                  <p className="text-xs text-muted-foreground pl-2 py-1">No expense accounts</p>
                )}
                <LineRow label="Total Expenses" amount={expenses.total_expenses} bold negative />

                <SectionHeader title="Distributions" />
                <LineRow label="Dividend Outflow" amount={expenses.dividend_outflow} indent negative />

                <Separator className="my-2" />
                <LineRow label="Total Deductions" amount={expenses.total_deductions} bold negative />

                <Separator className="my-2" />
                <LineRow label="Net Operating Income" amount={net.net_operating_income} bold />
                <LineRow label="Net Income (after dividends)" amount={net.net_income} bold />
              </CardContent>
            </Card>

            {/* OPERATIONAL METRICS */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Operational Metrics</CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: "Principal Collected", value: ops.principal_collected },
                    { label: "Total Deposits",      value: ops.total_deposits },
                    { label: "Gross Income",        value: revenue.gross_operating_income },
                    { label: "Net Income",          value: net.net_income },
                  ].map((m) => (
                    <div key={m.label} className="rounded border p-3 space-y-1">
                      <p className="text-xs text-muted-foreground">{m.label}</p>
                      <p className="text-base font-bold">{fmtMoney(m.value)}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </>
  );
};

export default ComprehensiveIncomeReport;

import { useState } from "react";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import IncomeStatementTable from "../../Tables/Accounting/IncomeStatementTable";
import ReportFilterBar from "../Queries/ReportFilterBar";

const IncomeStatement = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    startDate: "", endDate: "", branch_id: "", status: "all",
  });

  const { data = {}, isLoading, isRefetching, isError } = useQuery({
    queryKey: ["income-statement", filters],
    queryFn: async ({ signal }) => {
      try {
        const res = await axiosPrivate.get("reports/accounting/income-statement", {
          params: { startDate: filters.startDate, endDate: filters.endDate, branch_id: filters.branch_id },
          signal,
        });
        return res?.data?.data ?? {};
      } catch (err) {
        if (err?.response?.status === 401) navigate("/", { replace: true });
        throw err;
      }
    },
    placeholderData: (prev) => prev,
  });

  const stmt = data?.income_statement ?? {};
  const stmtTotals = data?.totals ?? {};

  const exportHeaders = ["Section", "Account", "Code", "Amount"];
  const exportRows = [
    ...(stmt.income ?? []).map((r) => ["Income", r.title ?? "", r.code ?? "", r.amount ?? 0]),
    ["", "TOTAL INCOME", "", stmtTotals.total_income ?? 0],
    ...(stmt.expenses ?? []).map((r) => ["Expenses", r.title ?? "", r.code ?? "", r.amount ?? 0]),
    ["", "TOTAL EXPENSES", "", stmtTotals.total_expenses ?? 0],
    ["", "NET INCOME", "", stmtTotals.net_income ?? 0],
  ];

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink to="/dashboard">Home</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink to="/accounting-reports">Accounting Reports</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Income Statement</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-1 space-y-4 pt-2">
        <h5 className="text-2xl font-bold tracking-tight">Income Statement</h5>

        <ReportFilterBar
          onApply={setFilters}
          isLoading={isRefetching}
          showStatus={false}
          exportTitle="Income Statement"
          exportFilename="income_statement"
          exportHeaders={exportHeaders}
          exportRows={exportRows}
          exportDisabled={exportRows.length === 0}
        />

        {isError && (
          <p className="text-sm text-destructive">Failed to load report. Please try again.</p>
        )}

        {isLoading && !data?.income_statement && (
          <p className="text-sm text-muted-foreground animate-pulse">Loading income statement…</p>
        )}

        <IncomeStatementTable data={data} />
      </div>
    </>
  );
};

export default IncomeStatement;

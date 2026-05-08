import { useState } from "react";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import useBranchFilter from "@/MiddleWares/Hooks/useBranchFilter";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import BalanceSheetTable from "../../Tables/Accounting/BalanceSheetTable";
import ReportFilterBar from "../Queries/ReportFilterBar";

const BalanceSheet = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();

  const { branchKey } = useBranchFilter();
  const [filters, setFilters] = useState({
    startDate: "", endDate: "", branch_id: String(branchKey ?? ""), status: "all",
  });

  const { data = {}, isLoading, isRefetching, isError } = useQuery({
    queryKey: ["balance-sheet", filters],
    queryFn: async ({ signal }) => {
      try {
        const res = await axiosPrivate.get("reports/accounting/balance-sheet", {
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

  const bs = data?.balance_sheet ?? {};
  const totals = data?.totals ?? {};

  const exportHeaders = ["Section", "Code", "Title", "Sub Group", "Balance"];
  const exportRows = [
    ...(bs.assets ?? []).map((r) => ["Assets", r.code ?? "", r.title ?? "", r.sub_group?.title ?? "", r.balance ?? 0]),
    ["Assets", "", "TOTAL ASSETS", "", totals.total_assets ?? 0],
    ...(bs.liabilities ?? []).map((r) => ["Liabilities", r.code ?? "", r.title ?? "", r.sub_group?.title ?? "", r.balance ?? 0]),
    ...(bs.equity ?? []).map((r) => ["Equity", r.code ?? "", r.title ?? "", r.sub_group?.title ?? "", r.balance ?? 0]),
    ["Equity", "", "YTD Profit/Loss", "", totals.net_income ?? 0],
    ["", "", "TOTAL LIABILITIES + EQUITY", "", (totals.total_liabilities ?? 0) + (totals.net_income ?? 0)],
  ];

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink to="/dashboard">Home</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink to="/accounting-reports">Accounting Reports</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Balance Sheet</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-1 space-y-4 pt-2">
        <h5 className="text-2xl font-bold tracking-tight">Balance Sheet</h5>

        <ReportFilterBar
          onApply={setFilters}
          isLoading={isRefetching}
          showStatus={false}
          exportTitle="Balance Sheet"
          exportFilename="balance_sheet"
          exportHeaders={exportHeaders}
          exportRows={exportRows}
          exportDisabled={exportRows.length === 0}
        />

        {isError && (
          <p className="text-sm text-destructive">Failed to load report. Please try again.</p>
        )}

        {isLoading && !data?.balance_sheet && (
          <p className="text-sm text-muted-foreground animate-pulse">Loading balance sheet…</p>
        )}

        <BalanceSheetTable
          balanceSheet={data?.balance_sheet ?? {}}
          totals={data?.totals ?? {}}
        />
      </div>
    </>
  );
};

export default BalanceSheet;

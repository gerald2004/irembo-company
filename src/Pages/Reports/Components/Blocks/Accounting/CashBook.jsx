import { useState } from "react";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import useBranchFilter from "@/MiddleWares/Hooks/useBranchFilter";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import CashbookTable from "../../Tables/Accounting/CashbookTable";
import ReportFilterBar from "../Queries/ReportFilterBar";

const CashBook = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();

  const { branchKey } = useBranchFilter();
  const [filters, setFilters] = useState({
    startDate: "", endDate: "", branch_id: String(branchKey ?? ""), status: "all",
  });

  const { data = {}, isLoading, isRefetching, isError } = useQuery({
    queryKey: ["cashbook", filters],
    queryFn: async ({ signal }) => {
      try {
        const res = await axiosPrivate.get("reports/accounting/cashbook", {
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

  const cashRows  = data?.cash  ?? [];
  const bankRows  = data?.bank  ?? [];
  const totals    = data?.totals ?? {};

  const exportHeaders = ["Type", "Date", "Description", "Debit", "Credit", "Balance"];
  const exportRows = [
    ...cashRows.map((r) => [
      "Cash", r.date ?? "", r.description ?? "",
      parseFloat(r.debit   || 0).toFixed(2),
      parseFloat(r.credit  || 0).toFixed(2),
      parseFloat(r.balance || 0).toFixed(2),
    ]),
    ...bankRows.map((r) => [
      "Bank", r.date ?? "", r.description ?? "",
      parseFloat(r.debit   || 0).toFixed(2),
      parseFloat(r.credit  || 0).toFixed(2),
      parseFloat(r.balance || 0).toFixed(2),
    ]),
  ];

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink to="/dashboard">Home</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink to="/accounting-reports">Accounting Reports</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Cash Book</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-1 space-y-4 pt-2">
        <h5 className="text-2xl font-bold tracking-tight">Cash Book</h5>

        <ReportFilterBar
          onApply={setFilters}
          isLoading={isRefetching}
          showStatus={false}
          exportTitle="Cash Book"
          exportFilename="cash-book"
          exportHeaders={exportHeaders}
          exportRows={exportRows}
          exportDisabled={!cashRows.length && !bankRows.length}
        />

        {isError && (
          <p className="text-sm text-destructive">Failed to load report. Please try again.</p>
        )}

        {isLoading && !cashRows.length && (
          <p className="text-sm text-muted-foreground animate-pulse">Loading cash book…</p>
        )}

        <CashbookTable data={data} />
      </div>
    </>
  );
};

export default CashBook;

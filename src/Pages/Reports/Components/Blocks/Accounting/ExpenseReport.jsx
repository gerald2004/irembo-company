import { useRef, useState } from "react";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import useBranchFilter from "@/MiddleWares/Hooks/useBranchFilter";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import DatatableReport from "@/Pages/Components/DatatableReport";
import ReportFilterBar from "../Queries/ReportFilterBar";

const ExpenseReport = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const tableRef = useRef(null);

  const { branchKey } = useBranchFilter();
  const [filters, setFilters] = useState({
    startDate: "", endDate: "", branch_id: String(branchKey ?? ""), status: "completed",
  });

  const { data = [], isLoading, refetch, isRefetching, isError } = useQuery({
    queryKey: ["expenses-sheet", filters],
    queryFn: async ({ signal }) => {
      try {
        const res = await axiosPrivate.get("/reports/accounting/expenses", {
          params: { startDate: filters.startDate, endDate: filters.endDate, branch_id: filters.branch_id, status: filters.status },
          signal,
        });
        return res?.data?.data ?? [];
      } catch (err) {
        if (err?.response?.status === 401) navigate("/", { replace: true });
        throw err;
      }
    },
    placeholderData: (prev) => prev,
  });

  const rows = Array.isArray(data) ? data : [];
  const total = rows.reduce((s, r) => s + (parseFloat(r?.total) || 0), 0);

  const columns = [
    {
      accessorKey: "account",
      header: "Expense Account",
      cell: ({ row }) => <p className="text-sm font-medium">{row.original.account}</p>,
    },
    {
      accessorKey: "total",
      header: "Net Expense",
      cell: ({ row }) => (
        <p className="text-xs tabular-nums text-red-600 font-semibold">
          {row.original.total ? parseFloat(row.original.total).toLocaleString() : "0"}
        </p>
      ),
    },
    {
      accessorKey: "debits",
      header: "Debits",
      cell: ({ row }) => (
        <p className="text-xs tabular-nums text-muted-foreground">
          {row.original.debits ? parseFloat(row.original.debits).toLocaleString() : "0"}
        </p>
      ),
    },
    {
      accessorKey: "credits",
      header: "Credits",
      cell: ({ row }) => (
        <p className="text-xs tabular-nums text-muted-foreground">
          {row.original.credits ? parseFloat(row.original.credits).toLocaleString() : "0"}
        </p>
      ),
    },
  ];

  const exportHeaders = ["Expense Account", "Net Expense", "Debits", "Credits"];
  const exportRows = rows.map((r) => [
    r.account,
    parseFloat(r.total || 0).toFixed(2),
    parseFloat(r.debits || 0).toFixed(2),
    parseFloat(r.credits || 0).toFixed(2),
  ]);

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink to="/dashboard">Home</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink to="/accounting-reports">Accounting Reports</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Expense Summary</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-1 space-y-4 pt-2">
        <h5 className="text-2xl font-bold tracking-tight">Expense Summary Report</h5>

        <ReportFilterBar
          onApply={setFilters}
          isLoading={isRefetching}
          showStatus
          exportTitle="Expense Summary Report"
          exportFilename="expense-summary"
          exportHeaders={exportHeaders}
          exportRows={exportRows}
          exportDisabled={!rows.length}
        />

        <DatatableReport
          ref={tableRef}
          columns={columns}
          data={rows}
          fetchData={refetch}
          isLoading={isLoading}
          isRefetching={isRefetching}
          isError={isError}
          colSpan={1}
          totalDebit={total}
        />
      </div>
    </>
  );
};

export default ExpenseReport;

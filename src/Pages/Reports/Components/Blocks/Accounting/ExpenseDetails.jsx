import { useRef, useState } from "react";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import DatatableReport from "@/Pages/Components/DatatableReport";
import ReportFilterBar from "../Queries/ReportFilterBar";
import { formatDateTimestamp } from "@/lib/utils";

const ExpenseDetails = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const tableRef = useRef(null);

  const [filters, setFilters] = useState({
    startDate: "", endDate: "", branch_id: "", status: "completed",
  });

  const { data = {}, isLoading, refetch, isRefetching, isError } = useQuery({
    queryKey: ["expenses-detailed", filters],
    queryFn: async ({ signal }) => {
      try {
        const res = await axiosPrivate.get("reports/accounting/expenses-detailed", {
          params: { startDate: filters.startDate, endDate: filters.endDate, branch_id: filters.branch_id, status: filters.status },
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

  const rows = Array.isArray(data?.expenses) ? data.expenses : [];
  const total = data?.total ?? 0;

  const columns = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => <p className="text-xs">{formatDateTimestamp(row.original.date)}</p>,
    },
    {
      accessorKey: "branch",
      header: "Branch",
      cell: ({ row }) => <p className="text-xs font-medium">{row.original.branch || "—"}</p>,
    },
    {
      accessorKey: "account",
      header: "Account",
      cell: ({ row }) => <p className="text-xs">{row.original.account}</p>,
    },
    {
      accessorKey: "description",
      header: "Vendor / Description",
      cell: ({ row }) => (
        <p className="text-xs max-w-md truncate">{row.original.description}</p>
      ),
    },
    {
      accessorKey: "recorded_by",
      header: "Recorded By",
      cell: ({ row }) => <p className="text-xs">{row.original.recorded_by || "—"}</p>,
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => (
        <p className="text-xs tabular-nums text-red-600 font-semibold">
          {row.original.amount ? parseFloat(row.original.amount).toLocaleString() : "0"}
        </p>
      ),
    },
  ];

  const exportHeaders = ["Date", "Branch", "Account", "Description", "Recorded By", "Amount"];
  const exportRows = rows.map((r) => [
    r.date, r.branch || "", r.account, r.description, r.recorded_by || "", parseFloat(r.amount || 0).toFixed(2),
  ]);

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink to="/dashboard">Home</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink to="/accounting-reports">Accounting Reports</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Expense Detailed</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-1 space-y-4 pt-2">
        <h5 className="text-2xl font-bold tracking-tight">Expense Detailed Report</h5>

        <ReportFilterBar
          onApply={setFilters}
          isLoading={isRefetching}
          showStatus
          exportTitle="Expense Detailed Report"
          exportFilename="expense-detailed"
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
          colSpan={5}
          totalDebit={total}
        />
      </div>
    </>
  );
};

export default ExpenseDetails;

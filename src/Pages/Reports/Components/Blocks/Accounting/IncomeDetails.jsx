import { useRef, useState } from "react";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import useBranchFilter from "@/MiddleWares/Hooks/useBranchFilter";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import DatatableReport from "@/Pages/Components/DatatableReport";
import ReportFilterBar from "../Queries/ReportFilterBar";
import { formatDateTimestamp } from "@/lib/utils";

const IncomeDetails = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const tableRef = useRef(null);

  const { branchKey } = useBranchFilter();
  const [filters, setFilters] = useState({
    startDate: "", endDate: "", branch_id: String(branchKey ?? ""), status: "completed",
  });

  const { data = {}, isLoading, refetch, isRefetching, isError } = useQuery({
    queryKey: ["incomes-detailed", filters],
    queryFn: async ({ signal }) => {
      try {
        const res = await axiosPrivate.get("reports/accounting/incomes-detailed", {
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

  const rows = Array.isArray(data?.income) ? data.income : [];
  const total = data?.total ?? 0;

  const columns = [
    {
      accessorKey: "journal_entry_id",
      header: "Ref",
      cell: ({ row }) => row.original.journal_entry_id ? (
        <Link to={`/journal-entries/${row.original.journal_entry_id}`}>
          <Badge variant="secondary" className="text-xs font-mono cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
            #{row.original.journal_entry_id}
          </Badge>
        </Link>
      ) : <span className="text-xs text-muted-foreground">—</span>,
    },
    {
      accessorKey: "account",
      header: "Account",
      cell: ({ row }) => <p className="text-xs font-medium">{row.original.account}</p>,
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => <p className="text-xs">{formatDateTimestamp(row.original.date)}</p>,
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => <p className="text-xs">{row.original.description}</p>,
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => (
        <p className="text-xs tabular-nums text-green-700 font-semibold">
          {row.original.amount ? parseFloat(row.original.amount).toLocaleString() : "0"}
        </p>
      ),
    },
  ];

  const exportHeaders = ["Ref", "Account", "Date", "Description", "Amount"];
  const exportRows = rows.map((r) => [
    r.journal_entry_id ? `#${r.journal_entry_id}` : "", r.account, r.date, r.description, parseFloat(r.amount || 0).toFixed(2),
  ]);

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink to="/dashboard">Home</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink to="/accounting-reports">Accounting Reports</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Income Detailed</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-1 space-y-4 pt-2">
        <h5 className="text-2xl font-bold tracking-tight">Income Detailed Report</h5>

        <ReportFilterBar
          onApply={setFilters}
          isLoading={isRefetching}
          showStatus
          exportTitle="Income Detailed Report"
          exportFilename="income-detailed"
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
          colSpan={3}
          totalDebit={total}
        />
      </div>
    </>
  );
};

export default IncomeDetails;

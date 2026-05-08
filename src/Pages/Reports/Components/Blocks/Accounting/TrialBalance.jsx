import { useRef, useState } from "react";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import useBranchFilter from "@/MiddleWares/Hooks/useBranchFilter";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import DatatableReport from "@/Pages/Components/DatatableReport";
import ReportFilterBar from "../Queries/ReportFilterBar";

const TrialBalance = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const tableRef = useRef(null);

  const { branchKey } = useBranchFilter();
  const [filters, setFilters] = useState({
    startDate: "", endDate: "", branch_id: String(branchKey ?? ""), status: "completed",
  });

  const { data = {}, isLoading, refetch, isRefetching, isError } = useQuery({
    queryKey: ["trial-balance", filters],
    queryFn: async ({ signal }) => {
      try {
        const res = await axiosPrivate.get("reports/accounting/trial-balance", {
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

  const rows = data?.trial_balance ?? [];
  const totalDebit  = data?.total_debit  ?? 0;
  const totalCredit = data?.total_credit ?? 0;

  const columns = [
    {
      accessorKey: "account_title",
      header: "Account",
      cell: ({ row }) => (
        <Link to={`/ledgers/accounts/${row.original.account_id}`} className="hover:underline text-primary text-xs">
          [{row.original.account_code}] {row.original.account_title}
        </Link>
      ),
    },
    {
      accessorKey: "debit",
      header: "Debit",
      cell: ({ row }) => (
        <p className="text-xs tabular-nums">
          {row.original.debit ? parseFloat(row.original.debit).toLocaleString() : "0"}
        </p>
      ),
    },
    {
      accessorKey: "credit",
      header: "Credit",
      cell: ({ row }) => (
        <p className="text-xs tabular-nums">
          {row.original.credit ? parseFloat(row.original.credit).toLocaleString() : "0"}
        </p>
      ),
    },
  ];

  const exportHeaders = ["Account Code", "Account Title", "Debit", "Credit"];
  const exportRows = rows.map((r) => [
    r.account_code,
    r.account_title,
    r.debit ? parseFloat(r.debit).toFixed(2) : "0.00",
    r.credit ? parseFloat(r.credit).toFixed(2) : "0.00",
  ]);

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink to="/dashboard">Home</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink to="/accounting-reports">Accounting Reports</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Trial Balance</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-1 space-y-4 pt-2">
        <h5 className="text-2xl font-bold tracking-tight">Trial Balance</h5>

        <ReportFilterBar
          onApply={setFilters}
          isLoading={isRefetching}
          showStatus
          exportTitle="Trial Balance"
          exportFilename="trial-balance"
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
          colSpan={2}
          totalDebit={totalDebit}
          totalCredit={totalCredit}
        />
      </div>
    </>
  );
};

export default TrialBalance;

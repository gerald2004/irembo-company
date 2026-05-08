import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import useBranchFilter from "@/MiddleWares/Hooks/useBranchFilter";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useLocation } from "react-router-dom";
import DatatableReportTwo from "@/Pages/Components/DatatableReportTwo";
import { formatDateTimestamp } from "@/lib/utils";
import { useMemo, useState, useRef } from "react";
import LoanMaturityQuery from "../Queries/LoanMaturityQuery";

/** Helpers **/
const nf = new Intl.NumberFormat("en-UG", { maximumFractionDigits: 0 });
const fmtMoney = (v) => {
  const n = Number(v ?? 0);
  return nf.format(isFinite(n) ? n : 0);
};
const fmtDate = (v) => (v ? formatDateTimestamp(v) : "—");

const LoansMaturityReport = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const location = useLocation();
  const tableRef = useRef(null);

  // 🚫 No start/end dates here anymore
  const { branchKey } = useBranchFilter();
  const [filters, setFilters] = useState({
    branch_id: String(branchKey ?? ""),
    user_id: "",
    days: 30, // default window
  });

  const {
    data = [],
    isLoading,
    refetch,
    isRefetching,
    isError,
  } = useQuery({
    queryKey: ["loans-maturity", filters],
    queryFn: async ({ signal }) => {
      const url = `reports/loans/loans-maturity`;
      try {
        const response = await axiosPrivate.get(url, {
          params: {
            branch_id: filters.branch_id || undefined,
            user_id: filters.user_id || undefined,
            days:
              filters.days === "" || filters.days === undefined
                ? undefined
                : Number(filters.days),
          },
          signal,
        });
        const payload = response?.data?.data;
        if (Array.isArray(payload)) return payload; // legacy shape
        if (payload?.loans && Array.isArray(payload.loans))
          return payload.loans;
        return [];
      } catch (error) {
        if (error?.response?.status === 401) {
          navigate("/", { state: { from: location }, replace: true });
          return [];
        }
        throw error;
      }
    },
    placeholderData: (prev) => prev,
    staleTime: 60_000,
  });

  const rows = Array.isArray(data) ? data : [];

  /* KPIs */
  const count_loans = rows.length;
  const total_due = rows.reduce((s, r) => s + (Number(r?.total_due) || 0), 0);
  const due_in_7 = rows
    .filter((r) => {
      const d = Number(r?.days_to_due);
      return Number.isFinite(d) && d >= 0 && d <= 7;
    })
    .reduce((s, r) => s + (Number(r?.total_due) || 0), 0);

  /* Columns */
  const columns = useMemo(
    () => [
      {
        accessorKey: "account_no",
        header: "Account Number",
        cell: ({ row }) => (
          <div className="min-w-0">
            <Link
              to={`/clients/${
                row.original.client_type === "individual"
                  ? "individual"
                  : "group"
              }/${row.original.account_id}`}
              className="text-xs block truncate max-w-[160px] underline underline-offset-2 hover:opacity-80"
              title={row.original.account_no}
            >
              {row.original.account_no || row.original.account}
            </Link>
          </div>
        ),
      },
      {
        accessorKey: "client",
        header: "Client Name",
        cell: ({ row }) => (
          <div className="min-w-0">
            <Link
              to={`/clients/${
                row.original.client_type === "individual"
                  ? "individual"
                  : "group"
              }/${row.original.account_id}`}
              className="text-xs block truncate max-w-[200px] underline underline-offset-2 hover:opacity-80"
              title={row.original.client}
            >
              {row.original.client}
            </Link>
          </div>
        ),
      },
      {
        accessorKey: "loan_code",
        header: "Loan Number",
        cell: ({ row }) => (
          <div className="min-w-0">
            <Link
              to={`/loans/${row.original.loan_id}`}
              className="text-xs block truncate max-w-[160px] underline underline-offset-2 hover:opacity-80"
              title={row.original.loan_code || row.original.code}
            >
              {row.original.loan_code || row.original.code}
            </Link>
          </div>
        ),
      },
      {
        accessorKey: "product",
        header: "Product",
        cell: ({ row }) => (
          <p
            className="text-xs block max-w-[180px] truncate"
            title={row?.original.product}
          >
            {row?.original.product}
          </p>
        ),
      },
      {
        accessorKey: "responsible_user",
        header: "Loan Officer",
        cell: ({ row }) => (
          <p className="text-xs block max-w-[180px] truncate">
            {row?.original.responsible_user || "—"}
          </p>
        ),
      },
      {
        accessorKey: "next_due_date",
        header: "Next Due Date",
        cell: ({ row }) => (
          <p className="text-xs">{fmtDate(row.original.next_due_date)}</p>
        ),
      },
      {
        accessorKey: "days_to_due",
        header: "Days to Due",
        cell: ({ row }) => (
          <p className="text-xs tabular-nums">{row.original.days_to_due}</p>
        ),
      },
      {
        accessorKey: "principal_due",
        header: "Principal Due",
        cell: ({ row }) => (
          <p className="text-xs tabular-nums whitespace-nowrap">
            {fmtMoney(row.original.principal_due)}
          </p>
        ),
      },
      {
        accessorKey: "interest_due",
        header: "Interest Due",
        cell: ({ row }) => (
          <p className="text-xs tabular-nums whitespace-nowrap">
            {fmtMoney(row.original.interest_due)}
          </p>
        ),
      },
      {
        accessorKey: "penalty_due",
        header: "Penalty Due",
        cell: ({ row }) => (
          <p className="text-xs tabular-nums whitespace-nowrap">
            {fmtMoney(row.original.penalty_due)}
          </p>
        ),
      },
      {
        accessorKey: "total_due",
        header: "Total Due",
        cell: ({ row }) => (
          <p className="text-xs tabular-nums whitespace-nowrap font-semibold">
            {fmtMoney(row.original.total_due)}
          </p>
        ),
      },
      {
        accessorKey: "final_maturity",
        header: "Final Maturity",
        cell: ({ row }) => (
          <p className="text-xs">{fmtDate(row.original.final_maturity)}</p>
        ),
      },
    ],
    []
  );

  /* Filter handlers */
  const handleFilterChange = (patch) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    refetch();
  };

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden">
      <div className="flex flex-col min-w-0 px-2 md:px-4">
        <Breadcrumb className="mb-3">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink to="/dashboard">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink to="/loans-reports">Loans Reports</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Loans Maturity Report</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h5 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight">
            Loans Maturity Report
          </h5>

          {/* New toolbar (no dates) */}
          <LoanMaturityQuery
            onFilterChange={handleFilterChange}
            isRefetching={isRefetching}
            data={rows}
            tableRef={tableRef}
            filters={filters}
            title="Loans Maturity Report"
            totals={{
              count_loans,
              total_due,
              due_in_7,
            }}
            colSpan={6}
            mode={{ format: "A4-L", orientation: "L" }}
          />
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mt-2">
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Loans in View</p>
            <p className="text-base md:text-lg font-semibold tabular-nums">
              {fmtMoney(count_loans)}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Total Due</p>
            <p className="text-base md:text-lg font-semibold tabular-nums">
              {fmtMoney(total_due)}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Due in 7 Days</p>
            <p className="text-base md:text-lg font-semibold tabular-nums">
              {fmtMoney(due_in_7)}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="relative -mx-2 md:mx-0 mt-3">
          <div className="w-full max-w-full overflow-x-auto px-2 md:px-0">
            <div className="w-full">
              <DatatableReportTwo
                ref={tableRef}
                className="w-full"
                columns={columns}
                data={rows}
                fetchData={refetch}
                isLoading={isLoading}
                isRefetching={isRefetching}
                isError={isError}
                colSpan={0}
                summaryFields={{ count_loans, total_due, due_in_7 }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoansMaturityReport;

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useLocation } from "react-router-dom";
import DatatableReportTwo from "@/Pages/Components/DatatableReportTwo";
import LoanGeneralReportQuery from "../Queries/LoanGeneralReportQuery";
import { useMemo, useRef, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Helpers **/
const nf = new Intl.NumberFormat("en-UG", { maximumFractionDigits: 0 });
const fmtMoney = (v) => {
  const n = Number(v ?? 0);
  return nf.format(Number.isFinite(n) ? n : 0);
};
const fmtDate = (v) => {
  if (!v) return "—";
  try {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v);
    return d.toLocaleString(); // if you prefer YYYY-MM-DD, swap to v.slice(0,10)
  } catch {
    return String(v);
  }
};

const LoansDisbursementsReport = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const location = useLocation();
  const tableRef = useRef(null);

  // Filters (date range handled by LoanGeneralReportQuery)
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    branch_id: "",
    user_id: "",
    status: "", // optional: active|overdue|reversed|... (leave blank = all)
  });

  const {
    data = { rows: [], totals: { amount: 0, count: 0 }, group_totals: {} },
    isLoading,
    isRefetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["loan-disbursements", filters],
    queryFn: async ({ signal }) => {
      const url = `reports/loans/loans-disbursements`;
      try {
        const res = await axiosPrivate.get(url, {
          params: {
            startDate: filters.startDate || undefined,
            endDate: filters.endDate || undefined,
            branch_id: filters.branch_id || undefined,
            user_id: filters.user_id || undefined,
            status: filters.status || undefined,
          },
          signal,
        });

        // Expected backend shape:
        // { data: { rows, totals:{amount,count}, group_totals:{...}, filters:{...} } }
        const payload = res?.data?.data;
        if (!payload)
          return {
            rows: [],
            totals: { amount: 0, count: 0 },
            group_totals: {},
          };

        // Backward compat if someone returns array directly:
        if (Array.isArray(payload)) {
          return {
            rows: payload,
            totals: {
              amount: payload.reduce((s, r) => s + (Number(r?.amount) || 0), 0),
              count: payload.length,
            },
            group_totals: {},
          };
        }

        const rows = Array.isArray(payload.rows) ? payload.rows : [];
        const totals = payload.totals ?? { amount: 0, count: rows.length };
        const group_totals = payload.group_totals ?? {};
        return { rows, totals, group_totals };
      } catch (error) {
        if (error?.response?.status === 401) {
          navigate("/", { state: { from: location }, replace: true });
          return {
            rows: [],
            totals: { amount: 0, count: 0 },
            group_totals: {},
          };
        }
        throw error;
      }
    },
    keepPreviousData: true,
    staleTime: 60_000,
  });

  const rows = Array.isArray(data?.rows) ? data.rows : [];
  const totalAmount = Number(data?.totals?.amount || 0);
  const totalCount = Number(data?.totals?.count || rows.length);

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
              {row.original.account_no || "—"}
            </Link>
          </div>
        ),
      },
      {
        accessorKey: "client",
        header: "Client",
        cell: ({ row }) => (
          <p
            className="text-xs block max-w-[200px] truncate"
            title={row.original.client}
          >
            {row.original.client || "—"}
          </p>
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
              title={row.original.loan_code}
            >
              {row.original.loan_code || "—"}
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
            title={row.original.product}
          >
            {row.original.product || "—"}
          </p>
        ),
      },
      {
        accessorKey: "officer",
        header: "Loan Officer",
        cell: ({ row }) => (
          <p
            className="text-xs block max-w-[180px] truncate"
            title={row.original.officer}
          >
            {row.original.officer || "—"}
          </p>
        ),
      },
      {
        accessorKey: "amount",
        header: "Amount",
        cell: ({ row }) => (
          <p className="text-xs tabular-nums whitespace-nowrap font-semibold">
            {fmtMoney(row.original.amount)}
          </p>
        ),
      },
      {
        accessorKey: "disbursed_at",
        header: "Disbursed At",
        cell: ({ row }) => (
          <p className="text-xs">{fmtDate(row.original.disbursed_at)}</p>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <p className="text-xs">{row.original.status || "—"}</p>
        ),
      },
    ],
    []
  );

  const handleFilterChange = (partial) => {
    setFilters((prev) => ({ ...prev, ...partial }));
    refetch();
  };

  const setStatus = (val) => {
    setFilters((prev) => ({ ...prev, status: val === "all" ? "" : val }));
    refetch();
  };

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden">
      <div className="flex flex-col min-w-0 px-2 md:px-4">
        {/* Breadcrumbs */}
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
              <BreadcrumbPage>Loan Disbursements</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header + quick status filter */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h5 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight">
            Loan Disbursements Report
          </h5>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Status:</span>
            <Select value={filters.status || "all"} onValueChange={setStatus}>
              <SelectTrigger className="h-8 w-40">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="reversed">Reversed</SelectItem>
                {/* Add your real statuses here */}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Shared query bar (dates, branch, user) + export */}
        <LoanGeneralReportQuery
          onFilterChange={handleFilterChange}
          isRefetching={isRefetching}
          refetch={refetch}
          data={rows}
          tableRef={tableRef}
          filters={filters}
          colSpan={6}
          mode={{ format: "A4-L", orientation: "L" }}
          totals={{
            total_count: totalCount,
            total_amount: totalAmount,
          }}
          title="Loan Disbursements Report"
        />

        {/* KPI strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mt-2">
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Total Disbursements</p>
            <p className="text-base md:text-lg font-semibold tabular-nums">
              {fmtMoney(totalCount)}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Total Amount</p>
            <p className="text-base md:text-lg font-semibold tabular-nums">
              {fmtMoney(totalAmount)}
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
                summaryFields={{
                  total_count: totalCount,
                  total_amount: totalAmount,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoansDisbursementsReport;

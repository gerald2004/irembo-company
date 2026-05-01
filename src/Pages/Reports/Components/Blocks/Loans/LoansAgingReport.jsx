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
import { formatDateTimestamp } from "@/lib/utils";
import LoanGeneralReportQuery from "../Queries/LoanGeneralReportQuery";
import { useMemo, useState, useRef } from "react";

/** ---- Helpers ---- */
const nf = new Intl.NumberFormat("en-UG", { maximumFractionDigits: 0 });
const fmtMoney = (v) => {
  const n = Number(v ?? 0);
  return nf.format(isFinite(n) ? n : 0);
};
const fmtDate = (v) => (v ? formatDateTimestamp(v) : "—");

const LoansAgingReport = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const location = useLocation();
  const tableRef = useRef(null);

  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    branch_id: "",
    user_id: "",
  });

  const {
    data = [],
    isLoading,
    refetch,
    isRefetching,
    isError,
  } = useQuery({
    queryKey: ["aging-loans", filters],
    queryFn: async ({ signal }) => {
      const fetchURL = `reports/loans/aging-loans`;
      try {
        const response = await axiosPrivate.get(fetchURL, {
          params: {
            startDate: filters.startDate || undefined,
            endDate: filters.endDate || undefined,
            branch_id: filters.branch_id || undefined,
            user_id: filters.user_id || undefined,
          },
          signal,
        });
        return response?.data?.data ?? [];
      } catch (error) {
        if (error?.response?.status === 401) {
          navigate("/", { state: { from: location }, replace: true });
        }
        throw error;
      }
    },
    placeholderData: (prev) => prev,
    staleTime: 60_000,
  });

  // Totals
  const total_overdue = (Array.isArray(data) ? data : []).reduce(
    (sum, r) => sum + (Number(r?.total_overdue) || 0),
    0
  );
  const age_zero = data.reduce((s, r) => s + (Number(r?.age_zero) || 0), 0);
  const age_one = data.reduce((s, r) => s + (Number(r?.age_one) || 0), 0);
  const age_two = data.reduce((s, r) => s + (Number(r?.age_two) || 0), 0);
  const age_three = data.reduce((s, r) => s + (Number(r?.age_three) || 0), 0);
  const age_four = data.reduce((s, r) => s + (Number(r?.age_four) || 0), 0);
  const age_five = data.reduce((s, r) => s + (Number(r?.age_five) || 0), 0);
  const age_six = data.reduce((s, r) => s + (Number(r?.age_six) || 0), 0);
  const age_seven = data.reduce((s, r) => s + (Number(r?.age_seven) || 0), 0);

  // Columns (truncate long text to avoid stretching)
  const columns = useMemo(
    () => [
      {
        accessorKey: "account",
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
              title={row.original.account}
            >
              {row.original.account}
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
        accessorKey: "code",
        header: "Loan Number",
        cell: ({ row }) => (
          <div className="min-w-0">
            <Link
              to={`/loans/${row.original.loan_id}`}
              className="text-xs block truncate max-w-[160px] underline underline-offset-2 hover:opacity-80"
              title={row.original.code}
            >
              {row.original.code}
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
        accessorKey: "last_payment_date",
        header: "Last Payment Date",
        cell: ({ row }) => (
          <p className="text-xs">
            {fmtDate(row.original.last_payment_date) || "No Payment Made"}
          </p>
        ),
      },
      {
        accessorKey: "first_overdue_date",
        header: "First Overdue Date",
        cell: ({ row }) => (
          <p className="text-xs">{fmtDate(row.original.first_overdue_date)}</p>
        ),
      },
      {
        accessorKey: "total_overdue",
        header: "Amount Due",
        cell: ({ row }) => (
          <p className="text-xs tabular-nums whitespace-nowrap">
            {fmtMoney(row.original.total_overdue)}
          </p>
        ),
      },
      {
        accessorKey: "age_zero",
        header: "1–30",
        cell: ({ row }) => (
          <p className="text-xs tabular-nums whitespace-nowrap">
            {fmtMoney(row.original.age_zero)}
          </p>
        ),
      },
      {
        accessorKey: "age_one",
        header: "31–60",
        cell: ({ row }) => (
          <p className="text-xs tabular-nums whitespace-nowrap">
            {fmtMoney(row.original.age_one)}
          </p>
        ),
      },
      {
        accessorKey: "age_two",
        header: "61–90",
        cell: ({ row }) => (
          <p className="text-xs tabular-nums whitespace-nowrap">
            {fmtMoney(row.original.age_two)}
          </p>
        ),
      },
      {
        accessorKey: "age_three",
        header: "91–120",
        cell: ({ row }) => (
          <p className="text-xs tabular-nums whitespace-nowrap">
            {fmtMoney(row.original.age_three)}
          </p>
        ),
      },
      {
        accessorKey: "age_four",
        header: "121–150",
        cell: ({ row }) => (
          <p className="text-xs tabular-nums whitespace-nowrap">
            {fmtMoney(row.original.age_four)}
          </p>
        ),
      },
      {
        accessorKey: "age_five",
        header: "151–180",
        cell: ({ row }) => (
          <p className="text-xs tabular-nums whitespace-nowrap">
            {fmtMoney(row.original.age_five)}
          </p>
        ),
      },
      {
        accessorKey: "age_six",
        header: "181–210",
        cell: ({ row }) => (
          <p className="text-xs tabular-nums whitespace-nowrap">
            {fmtMoney(row.original.age_six)}
          </p>
        ),
      },
      {
        accessorKey: "age_seven",
        header: ">210",
        cell: ({ row }) => (
          <p className="text-xs tabular-nums whitespace-nowrap">
            {fmtMoney(row.original.age_seven)}
          </p>
        ),
      },
    ],
    []
  );

  const handleFilterChange = (data) => {
    setFilters(data);
    refetch();
  };

  return (
    // Outer frame: prevent bleed
    <div className="w-full max-w-[100vw] overflow-x-hidden">
      {/* The min-w-0 on flex container is critical */}
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
              <BreadcrumbPage>Aging Loans Reports</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center justify-between">
          <h5 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight">
            Aging Loans Report
          </h5>
        </div>

        <LoanGeneralReportQuery
          onFilterChange={handleFilterChange}
          isRefetching={isRefetching}
          refetch={refetch}
          data={data}
          tableRef={tableRef}
          filters={filters}
          colSpan={6}
          mode={{ format: "A4-L", orientation: "L" }}
          totals={{
            total_overdue,
            age_zero,
            age_one,
            age_two,
            age_three,
            age_four,
            age_five,
            age_six,
            age_seven,
          }}
          title="Aging Loans Report"
        />

        {/* KPI strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mt-2">
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Total Overdue</p>
            <p className="text-base md:text-lg font-semibold tabular-nums">
              {fmtMoney(total_overdue)}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">1–30 days</p>
            <p className="text-base md:text-lg font-semibold tabular-nums">
              {fmtMoney(age_zero)}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">31–60 days</p>
            <p className="text-base md:text-lg font-semibold tabular-nums">
              {fmtMoney(age_one)}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">61–90 days</p>
            <p className="text-base md:text-lg font-semibold tabular-nums">
              {fmtMoney(age_two)}
            </p>
          </div>
        </div>

        {/* Table area: negative margins cancel small-screen padding;
            scroller keeps content inside frame */}
        <div className="relative -mx-2 md:mx-0 mt-3">
          <div className="w-full max-w-full overflow-x-auto px-2 md:px-0">
            <div className="w-full">
              <DatatableReportTwo
                ref={tableRef}
                className="w-full" // if your component supports it
                columns={columns}
                data={Array.isArray(data) ? data : []}
                fetchData={refetch}
                isLoading={isLoading}
                isRefetching={isRefetching}
                isError={isError}
                colSpan={0}
                summaryFields={{
                  total_overdue,
                  age_zero,
                  age_one,
                  age_two,
                  age_three,
                  age_four,
                  age_five,
                  age_six,
                  age_seven,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoansAgingReport;

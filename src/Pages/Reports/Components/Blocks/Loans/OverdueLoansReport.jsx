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
import DatatableReport from "@/Pages/Components/DatatableReport";
import { formatDateTimestamp } from "@/lib/utils";
import LoanGeneralReportQuery from "../Queries/LoanGeneralReportQuery";
import { useMemo, useState, useRef } from "react";

/* ------- helpers ------- */
const nf = new Intl.NumberFormat("en-UG", { maximumFractionDigits: 0 });
const fmtMoney = (v) => {
  const n = Number(v ?? 0);
  return nf.format(Number.isFinite(n) ? n : 0);
};
const fmtDate = (v) => (v ? formatDateTimestamp(v) : "—");

const OverdueLoansReport = () => {
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
    queryKey: ["overdue-loans", filters],
    queryFn: async ({ signal }) => {
      const fetchURL = `reports/loans/overdue-loans`;
      try {
        const res = await axiosPrivate.get(fetchURL, {
          params: {
            startDate: filters.startDate || undefined,
            endDate: filters.endDate || undefined,
            branch_id: filters.branch_id || undefined,
            user_id: filters.user_id || undefined,
          },
          signal,
        });
        return res?.data?.data ?? [];
      } catch (error) {
        if (error?.response?.status === 401) {
          navigate("/", { state: { from: location }, replace: true });
        }
        throw error;
      }
    },
    keepPreviousData: true,
    staleTime: 60_000,
  });

  const safeData = Array.isArray(data) ? data : [];

  const totalAmountDisbursed = safeData.reduce(
    (sum, loan) => sum + (Number(loan.amount_disbursed) || 0),
    0
  );
  const totalAmountDue = safeData.reduce(
    (sum, loan) => sum + (Number(loan.overdue_amount) || 0),
    0
  );

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
        accessorKey: "contact",
        header: "Client Contact",
        cell: ({ row }) => (
          <p
            className="text-xs block truncate max-w-[160px]"
            title={row.original.contact}
          >
            {row.original.contact}
          </p>
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
        accessorKey: "interest_rate",
        header: "Interest Rate",
        cell: ({ row }) => (
          <p className="text-xs tabular-nums whitespace-nowrap">
            {Number(row.original.interest_rate || 0)}%
          </p>
        ),
      },
      {
        accessorKey: "product",
        header: "Product",
        cell: ({ row }) => (
          <p
            className="text-xs block truncate max-w-[180px]"
            title={row?.original.product}
          >
            {row?.original.product}
          </p>
        ),
      },
      {
        accessorKey: "tenure",
        header: "Tenure",
        cell: ({ row }) => (
          <p
            className="text-xs block truncate max-w-[140px]"
            title={row.original.tenure}
          >
            {row.original.tenure}
          </p>
        ),
      },
      {
        accessorKey: "disbursement_date",
        header: "Date Of Disbursement",
        cell: ({ row }) => (
          <p className="text-xs">{fmtDate(row.original.disbursement_date)}</p>
        ),
      },
      {
        accessorKey: "overdue_date",
        header: "Overdue Date",
        cell: ({ row }) => (
          <p className="text-xs">{fmtDate(row.original.overdue_date)}</p>
        ),
      },
      {
        accessorKey: "amount_disbursed",
        header: "Amount Disbursed",
        cell: ({ row }) => (
          <p className="text-xs tabular-nums whitespace-nowrap">
            {fmtMoney(row.original.amount_disbursed)}
          </p>
        ),
      },
      {
        accessorKey: "overdue_amount",
        header: "Amount Overdue",
        cell: ({ row }) => (
          <p className="text-xs tabular-nums whitespace-nowrap">
            {fmtMoney(row.original.overdue_amount)}
          </p>
        ),
      },
      {
        accessorKey: "days_overdue",
        header: "Days Overdue",
        cell: ({ row }) => (
          <p className="text-xs tabular-nums whitespace-nowrap">
            {Number(row.original.days_overdue || 0)} days
          </p>
        ),
      },
    ],
    []
  );

  const handleFilterChange = (next) => {
    setFilters(next);
    refetch();
  };

  return (
    <>
      <Breadcrumb>
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
            <BreadcrumbPage>Overdue Loans Reports</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page frame: prevent bleed on small screens */}
      <div className="w-full max-w-[100vw] overflow-x-hidden">
        <div className="flex flex-col min-w-0">
          <div className="border-b" />
          <div className="flex-1 space-y-4 p-0 pt-2 min-w-0">
            <div className="flex items-center justify-between">
              <h5 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight">
                Overdue Loans Report
              </h5>
            </div>

            <LoanGeneralReportQuery
              onFilterChange={handleFilterChange}
              isRefetching={isRefetching}
              refetch={refetch}
              data={safeData}
              tableRef={tableRef}
              filters={filters}
              colSpan={9}
              mode={{ format: "A4-L", orientation: "L" }}
              totals={{
                totalAmountDisbursed,
                totalAmountDue,
              }}
              title="Overdue Loans Report"
            />

            {/* Table wrapper: scroller only when needed (no page bleed) */}
            <div className="relative -mx-2 md:mx-0">
              <div className="w-full max-w-full overflow-x-auto px-2 md:px-0">
                <div className="w-full">
                  <DatatableReport
                    ref={tableRef}
                    className="w-full" // if your component supports className
                    columns={columns}
                    data={safeData}
                    fetchData={refetch}
                    isLoading={isLoading}
                    isRefetching={isRefetching}
                    isError={isError}
                    colSpan={3}
                    totalDebit={totalAmountDisbursed}
                    totalCredit={totalAmountDue}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OverdueLoansReport;

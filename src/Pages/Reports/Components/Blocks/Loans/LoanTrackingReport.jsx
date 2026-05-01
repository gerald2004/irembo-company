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
import { Link, useNavigate } from "react-router-dom";
import DatatableReport from "@/Pages/Components/DatatableReport";
import { formatDateTimestamp } from "@/lib/utils";
import LoanGeneralReportQuery from "../Queries/LoanGeneralReportQuery";
import { useState, useRef, useMemo } from "react";
import { Progress } from "@/components/ui/progress";

const fmtMoney = (v) =>
  new Intl.NumberFormat("en-UG", { maximumFractionDigits: 0 }).format(v ?? 0);

const LoanTrackingReport = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const tableRef = useRef(null);

  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    branch_id: "",
    user_id: "",
  });

  const { data = [], isLoading, refetch, isRefetching, isError } = useQuery({
    queryKey: ["loan-tracking", filters],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get("reports/loans/loan-tracking", {
          params: {
            startDate: filters.startDate,
            endDate: filters.endDate,
            branch_id: filters.branch_id,
          },
        });
        return res?.data?.data ?? [];
      } catch (error) {
        if (error?.response?.status === 401)
          navigate("/", { state: { from: location }, replace: true });
        throw error;
      }
    },
    placeholderData: (prev) => prev,
  });

  const totalDisbursed = useMemo(() => data.reduce((s, r) => s + (r.amount_disbursed ?? 0), 0), [data]);
  const totalPrincipalPaid = useMemo(() => data.reduce((s, r) => s + (r.principal_paid ?? 0), 0), [data]);

  const columns = [
    {
      accessorKey: "account",
      header: "Account",
      cell: ({ row }) => (
        <Link to={`/clients/individual/${row.original.account_id}`} className="text-xs">
          {row.original.account}
        </Link>
      ),
    },
    {
      accessorKey: "client",
      header: "Client",
      cell: ({ row }) => <p className="text-xs capitalize">{row.original.client}</p>,
    },
    {
      accessorKey: "code",
      header: "Loan No.",
      cell: ({ row }) => (
        <Link to={`/loans/${row.original.loan_id}`} className="text-xs">
          {row.original.code}
        </Link>
      ),
    },
    {
      accessorKey: "product",
      header: "Product",
      cell: ({ row }) => <p className="text-xs">{row.original.product}</p>,
    },
    {
      accessorKey: "amount_disbursed",
      header: "Disbursed",
      cell: ({ row }) => <p className="text-xs">{fmtMoney(row.original.amount_disbursed)}</p>,
    },
    {
      accessorKey: "installments_paid",
      header: "Installments",
      cell: ({ row }) => (
        <p className="text-xs">
          {row.original.installments_paid}/{row.original.total_installments}
        </p>
      ),
    },
    {
      accessorKey: "progress_pct",
      header: "Progress",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Progress value={row.original.progress_pct ?? 0} className="h-2 w-20" />
          <span className="text-xs">{(row.original.progress_pct ?? 0).toFixed(0)}%</span>
        </div>
      ),
    },
    {
      accessorKey: "principal_paid",
      header: "Principal Paid",
      cell: ({ row }) => <p className="text-xs">{fmtMoney(row.original.principal_paid)}</p>,
    },
    {
      accessorKey: "interest_paid",
      header: "Interest Paid",
      cell: ({ row }) => <p className="text-xs">{fmtMoney(row.original.interest_paid)}</p>,
    },
    {
      accessorKey: "outstanding_balance",
      header: "Outstanding",
      cell: ({ row }) => (
        <p className="text-xs font-medium">{fmtMoney(row.original.outstanding_balance)}</p>
      ),
    },
    {
      accessorKey: "next_payment_date",
      header: "Next Payment",
      cell: ({ row }) => (
        <p className="text-xs">{formatDateTimestamp(row.original.next_payment_date)}</p>
      ),
    },
  ];

  const handleFilterChange = (data) => {
    setFilters(data);
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
            <BreadcrumbPage>Loan Tracking</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <h5 className="text-2xl font-bold tracking-tight">Loan Tracking Report</h5>
          <LoanGeneralReportQuery show={{ product: true, status: true }}
            onFilterChange={handleFilterChange}
            isRefetching={isRefetching}
            refetch={refetch}
            data={data}
            tableRef={tableRef}
            filters={filters}
            colSpan={3}
            mode={{ format: "A4-L", orientation: "L" }}
            totals={{
              totalAmountDisbursed: totalDisbursed,
              totalAmountDue: totalPrincipalPaid,
            }}
            title="Loan Tracking Report"
          />
          <div className="max-w-[1200px]">
            <DatatableReport
              ref={tableRef}
              columns={columns}
              data={data ?? []}
              fetchData={refetch}
              isLoading={isLoading}
              isRefetching={isRefetching}
              isError={isError}
              colSpan={11}
              totalDebit={totalDisbursed}
              totalCredit={totalPrincipalPaid}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default LoanTrackingReport;

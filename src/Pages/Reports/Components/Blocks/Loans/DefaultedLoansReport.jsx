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
import { Link, useNavigate } from "react-router-dom";
import DatatableReport from "@/Pages/Components/DatatableReport";
import { formatDateTimestamp } from "@/lib/utils";
import LoanGeneralReportQuery from "../Queries/LoanGeneralReportQuery";
import { useState, useRef, useMemo } from "react";
import { Badge } from "@/components/ui/badge";

const fmtMoney = (v) =>
  new Intl.NumberFormat("en-UG", { maximumFractionDigits: 0 }).format(v ?? 0);

const classColor = { Substandard: "secondary", Doubtful: "outline", Loss: "destructive" };

const DefaultedLoansReport = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const tableRef = useRef(null);

  const { branchKey } = useBranchFilter();
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    branch_id: String(branchKey ?? ""),
    min_dpd: "90",
  });

  const { data = [], isLoading, refetch, isRefetching, isError } = useQuery({
    queryKey: ["defaulted-loans", filters],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get("reports/loans/defaulted-loans", {
          params: {
            startDate: filters.startDate,
            endDate: filters.endDate,
            branch_id: filters.branch_id,
            min_dpd: filters.min_dpd,
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

  const totalOutstanding = useMemo(
    () => data.reduce((s, r) => s + (r.outstanding_balance ?? 0), 0),
    [data]
  );

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
      cell: ({ row }) => (
        <p className="text-xs capitalize">{row.original.client}</p>
      ),
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
      accessorKey: "outstanding_balance",
      header: "Outstanding",
      cell: ({ row }) => (
        <p className="text-xs">{fmtMoney(row.original.outstanding_balance)}</p>
      ),
    },
    {
      accessorKey: "days_past_due",
      header: "DPD",
      cell: ({ row }) => (
        <p className="text-xs font-semibold text-red-600">{row.original.days_past_due}</p>
      ),
    },
    {
      accessorKey: "classification",
      header: "Classification",
      cell: ({ row }) => (
        <Badge variant={classColor[row.original.classification] ?? "secondary"}>
          {row.original.classification}
        </Badge>
      ),
    },
    {
      accessorKey: "disbursement_date",
      header: "Disbursed",
      cell: ({ row }) => (
        <p className="text-xs">{formatDateTimestamp(row.original.disbursement_date)}</p>
      ),
    },
    {
      accessorKey: "guarantors",
      header: "Guarantors",
      cell: ({ row }) => (
        <p className="text-xs">
          {(row.original.guarantors ?? []).map((g) => g.guarantor_name).join(", ") || "—"}
        </p>
      ),
    },
  ];

  const handleFilterChange = (data) => {
    setFilters(data);
    refetch();
  };

  const fmt = (n) => new Intl.NumberFormat("en-UG", { maximumFractionDigits: 0 }).format(n ?? 0);

  const KPI = ({ label, value, sub, accent = "bg-blue-500" }) => (
    <div className={`rounded-xl border bg-card shadow-sm overflow-hidden`}>
      <div className={`h-1 ${accent}`} />
      <div className="p-4">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold mt-1">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </div>
    </div>
  );

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
            <BreadcrumbPage>Defaulted Loans</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <h5 className="text-2xl font-bold tracking-tight">Defaulted Loans Report</h5>
          <LoanGeneralReportQuery
            onFilterChange={handleFilterChange}
            isRefetching={isRefetching}
            refetch={refetch}
            data={data}
            tableRef={tableRef}
            filters={filters}
            colSpan={3}
            mode={{ format: "A4-L", orientation: "L" }}
            totals={{ totalAmountDisbursed: totalOutstanding }}
            title="Defaulted Loans Report"
          />
          {/* KPI Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KPI label="Defaulted Loans" value={data?.length ?? 0} sub="Total defaults" accent="bg-red-500" />
            <KPI label="Total Overdue" value={`UGX ${fmt(data?.reduce((s,l)=>s+(l.overdue_amount??0),0))}`} sub="Amount overdue" accent="bg-rose-500" />
            <KPI label="Total Outstanding" value={`UGX ${fmt(data?.reduce((s,l)=>s+(l.remaining_balance??0),0))}`} sub="Remaining balance" accent="bg-orange-500" />
            <KPI label="Avg Days Overdue" value={`${Math.round(data?.reduce((s,l)=>s+(l.days_overdue??0),0)/(data?.length||1))} days`} sub="Average default period" accent="bg-amber-500" />
          </div>
          <div className="overflow-x-auto max-w-[1200px]">
            <DatatableReport
              ref={tableRef}
              columns={columns}
              data={data ?? []}
              fetchData={refetch}
              isLoading={isLoading}
              isRefetching={isRefetching}
              isError={isError}
              colSpan={9}
              totalDebit={totalOutstanding}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default DefaultedLoansReport;

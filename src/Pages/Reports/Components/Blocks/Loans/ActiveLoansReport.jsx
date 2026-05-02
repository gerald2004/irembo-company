import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import DatatableReport from "@/Pages/Components/DatatableReport";
import { formatDateTimestamp } from "@/lib/utils";
import LoanGeneralReportQuery from "../Queries/LoanGeneralReportQuery";
import { useState, useRef, useMemo } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { CreditCard, Wallet, TrendingUp, BarChart3 } from "lucide-react";
import ReportKpi from "@/Pages/Reports/Components/ReportKpi";

const fmt = (n) => new Intl.NumberFormat("en-UG", { maximumFractionDigits: 0 }).format(n ?? 0);

const ActiveLoansReport = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const tableRef = useRef(null);

  const [filters, setFilters] = useState({ startDate: "", endDate: "", branch_id: "", user_id: "" });
  const [consolidated, setConsolidated] = useState(false);

  const { data = [], isLoading, refetch, isRefetching, isError } = useQuery({
    queryKey: ["active-loans", filters],
    queryFn: async () => {
      try {
        const response = await axiosPrivate.get("reports/loans/active-loans", {
          params: {
            startDate: filters.startDate,
            endDate:   filters.endDate,
            branch_id: filters.branch_id,
            user_id:   filters.user_id,
          },
        });
        return response?.data?.data ?? [];
      } catch (error) {
        if (error?.response?.status === 401)
          navigate("/", { state: { from: location }, replace: true });
        throw error;
      }
    },
    placeholderData: (prev) => prev,
  });

  // Consolidated: group by account_id, sum amounts
  const displayData = useMemo(() => {
    if (!consolidated) return data;
    const map = new Map();
    for (const row of data) {
      const key = row.account_id;
      if (!map.has(key)) {
        map.set(key, {
          account_id:      row.account_id,
          account:         row.account,
          client:          row.client,
          client_type:     row.client_type,
          loan_count:      0,
          amount_disbursed:0,
          amount_due:      0,
        });
      }
      const g = map.get(key);
      g.loan_count      += 1;
      g.amount_disbursed += row.amount_disbursed ?? 0;
      g.amount_due       += row.amount_due       ?? 0;
    }
    return Array.from(map.values());
  }, [data, consolidated]);

  const totalDisbursed   = useMemo(() => displayData.reduce((s, r) => s + (r.amount_disbursed ?? 0), 0), [displayData]);
  const totalOutstanding = useMemo(() => displayData.reduce((s, r) => s + (r.amount_due       ?? 0), 0), [displayData]);

  const individualColumns = [
    {
      accessorKey: "account",
      header: "Account Number",
      cell: ({ row }) => (
        <Link to={`/clients/${row.original.client_type === "individual" ? "individual" : "group"}/${row.original.account_id}`} className="capitalize text-xs">
          {row.original.account}
        </Link>
      ),
    },
    {
      accessorKey: "client",
      header: "Client Name",
      cell: ({ row }) => (
        <Link to={`/clients/${row.original.client_type === "individual" ? "individual" : "group"}/${row.original.account_id}`} className="capitalize text-xs">
          {row.original.client}
        </Link>
      ),
    },
    {
      accessorKey: "code",
      header: "Loan Number",
      cell: ({ row }) => (
        <Link to={`/loans/${row.original.loan_id}`} className="capitalize text-xs">
          {row.original.code}
        </Link>
      ),
    },
    {
      accessorKey: "amount_disbursed",
      header: "Amount Disbursed",
      cell: ({ row }) => (
        <p className="text-xs text-right">{fmt(row.original.amount_disbursed)}</p>
      ),
    },
    {
      accessorKey: "amount_due",
      header: "Amount Due",
      cell: ({ row }) => (
        <p className="text-xs text-right">{fmt(row.original.amount_due)}</p>
      ),
    },
    {
      accessorKey: "interest_rate",
      header: "Interest Rate",
      cell: ({ row }) => <p className="text-xs">{row.original.interest_rate}%</p>,
    },
    {
      accessorKey: "product",
      header: "Product",
      cell: ({ row }) => <p className="text-xs">{row.original.product}</p>,
    },
    {
      accessorKey: "tenure",
      header: "Tenure",
      cell: ({ row }) => <p className="text-xs">{row.original.tenure}</p>,
    },
    {
      accessorKey: "disbursement_date",
      header: "Date Of Disbursement",
      cell: ({ row }) => <p className="text-xs">{formatDateTimestamp(row.original.disbursement_date)}</p>,
    },
    {
      accessorKey: "disbursement_timestamp",
      header: "Timestamp",
      cell: ({ row }) => <p className="text-xs">{formatDateTimestamp(row.original.disbursement_timestamp)}</p>,
    },
    {
      accessorKey: "next_repayment_date",
      header: "Next Repayment Date",
      cell: ({ row }) => <p className="text-xs">{formatDateTimestamp(row.original.next_repayment_date)}</p>,
    },
    {
      accessorKey: "next_repayment_amount",
      header: "Next Repayment Amount",
      cell: ({ row }) => <p className="text-xs text-right">{fmt(row.original.next_repayment_amount)}</p>,
    },
  ];

  // 12 cols, footer covers cols 4-12 (9 cells), label colSpan=3
  const individualFooter = [
    { value: totalDisbursed },   // col 4
    { value: totalOutstanding }, // col 5
    { empty: true },             // col 6
    { empty: true },             // col 7
    { empty: true },             // col 8
    { empty: true },             // col 9
    { empty: true },             // col 10
    { empty: true },             // col 11
    { empty: true },             // col 12
  ];

  const consolidatedColumns = [
    {
      accessorKey: "account",
      header: "Account Number",
      cell: ({ row }) => (
        <Link to={`/clients/${row.original.client_type === "individual" ? "individual" : "group"}/${row.original.account_id}`} className="capitalize text-xs">
          {row.original.account}
        </Link>
      ),
    },
    {
      accessorKey: "client",
      header: "Client Name",
      cell: ({ row }) => (
        <Link to={`/clients/${row.original.client_type === "individual" ? "individual" : "group"}/${row.original.account_id}`} className="capitalize text-xs">
          {row.original.client}
        </Link>
      ),
    },
    {
      accessorKey: "loan_count",
      header: "Active Loans",
      cell: ({ row }) => <p className="text-xs font-semibold text-center">{row.original.loan_count}</p>,
    },
    {
      accessorKey: "amount_disbursed",
      header: "Total Disbursed",
      cell: ({ row }) => <p className="text-xs text-right">{fmt(row.original.amount_disbursed)}</p>,
    },
    {
      accessorKey: "amount_due",
      header: "Total Outstanding",
      cell: ({ row }) => <p className="text-xs font-medium text-right">{fmt(row.original.amount_due)}</p>,
    },
  ];

  // 5 cols, footer covers cols 3-5 (3 cells), label colSpan=2
  const consolidatedFooter = [
    { empty: true },             // col 3: loan_count
    { value: totalDisbursed },   // col 4
    { value: totalOutstanding }, // col 5
  ];

  const columns     = consolidated ? consolidatedColumns : individualColumns;
  const footerCells = consolidated ? consolidatedFooter  : individualFooter;

  const handleFilterChange = (f) => { setFilters(f); refetch(); };

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink to="/dashboard">Home</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink to="/loans-reports">Loans Reports</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Active Loans Reports</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h5 className="text-2xl font-bold tracking-tight">Active Loans Report</h5>
            <div className="flex items-center gap-2">
              <Label htmlFor="toggle-active" className="text-xs text-muted-foreground">Per Loan</Label>
              <Switch id="toggle-active" checked={consolidated} onCheckedChange={setConsolidated} />
              <Label htmlFor="toggle-active" className="text-xs font-medium">Per Client</Label>
            </div>
          </div>
          <LoanGeneralReportQuery
            show={{ product: true }}
            onFilterChange={handleFilterChange}
            isRefetching={isRefetching}
            refetch={refetch}
            data={data}
            tableRef={tableRef}
            filters={filters}
            colSpan={3}
            mode={{ format: "A4-L", orientation: "L" }}
            totals={{ totalAmountDisbursed: totalDisbursed, totalAmountDue: totalOutstanding }}
            title="Active Loans Report"
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <ReportKpi label="Active Loans"       value={data.length}                     hint={`${displayData.length} clients`}                                                accent="bg-emerald-500" icon={<CreditCard size={16} />} />
            <ReportKpi label="Total Loan Balance" value={`UGX ${fmt(totalOutstanding)}`}  hint="Outstanding principal"                                                          accent="bg-blue-600"   icon={<Wallet size={16} />} />
            <ReportKpi label="Total Disbursed"    value={`UGX ${fmt(totalDisbursed)}`}    hint="Original principal"                                                             accent="bg-violet-500" icon={<TrendingUp size={16} />} />
            <ReportKpi label="Collection Rate"    value={`${totalDisbursed > 0 ? (((totalDisbursed - totalOutstanding) / totalDisbursed) * 100).toFixed(1) : 0}%`} hint="Of principal recovered" accent="bg-amber-500" icon={<BarChart3 size={16} />} />
          </div>
          <div className="max-w-[1200px]">
            <DatatableReport
              ref={tableRef}
              columns={columns}
              data={displayData}
              fetchData={refetch}
              isLoading={isLoading}
              isRefetching={isRefetching}
              isError={isError}
              footerCells={footerCells}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default ActiveLoansReport;

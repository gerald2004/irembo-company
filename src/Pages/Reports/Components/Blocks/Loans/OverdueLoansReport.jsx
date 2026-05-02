import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useLocation } from "react-router-dom";
import DatatableReport from "@/Pages/Components/DatatableReport";
import { formatDateTimestamp } from "@/lib/utils";
import LoanGeneralReportQuery from "../Queries/LoanGeneralReportQuery";
import { useMemo, useState, useRef } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Wallet, Clock, TrendingUp } from "lucide-react";
import ReportKpi from "@/Pages/Reports/Components/ReportKpi";

const nf = new Intl.NumberFormat("en-UG", { maximumFractionDigits: 0 });
const fmtMoney = (v) => { const n = Number(v ?? 0); return nf.format(Number.isFinite(n) ? n : 0); };
const fmtDate  = (v) => (v ? formatDateTimestamp(v) : "—");

const OverdueLoansReport = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate     = useNavigate();
  const location     = useLocation();
  const tableRef     = useRef(null);

  const [filters, setFilters] = useState({ startDate: "", endDate: "", branch_id: "", user_id: "" });
  const [consolidated, setConsolidated] = useState(false);

  const { data = [], isLoading, refetch, isRefetching, isError } = useQuery({
    queryKey: ["overdue-loans", filters],
    queryFn: async ({ signal }) => {
      try {
        const res = await axiosPrivate.get("reports/loans/overdue-loans", {
          params: {
            startDate: filters.startDate || undefined,
            endDate:   filters.endDate   || undefined,
            branch_id: filters.branch_id || undefined,
            user_id:   filters.user_id   || undefined,
          },
          signal,
        });
        return res?.data?.data ?? [];
      } catch (error) {
        if (error?.response?.status === 401)
          navigate("/", { state: { from: location }, replace: true });
        throw error;
      }
    },
    placeholderData: (prev) => prev,
    staleTime: 60_000,
  });

  const safeData = Array.isArray(data) ? data : [];

  // Consolidated: group by account_id, sum amounts, take max days overdue
  const displayData = useMemo(() => {
    if (!consolidated) return safeData;
    const map = new Map();
    for (const row of safeData) {
      const key = row.account_id;
      if (!map.has(key)) {
        map.set(key, {
          account_id:      row.account_id,
          account:         row.account,
          client:          row.client,
          client_type:     row.client_type,
          contact:         row.contact,
          loan_count:      0,
          amount_disbursed:0,
          overdue_amount:  0,
          max_days_overdue:0,
        });
      }
      const g = map.get(key);
      g.loan_count       += 1;
      g.amount_disbursed  += row.amount_disbursed ?? 0;
      g.overdue_amount    += row.overdue_amount   ?? 0;
      g.max_days_overdue   = Math.max(g.max_days_overdue, row.days_overdue ?? 0);
    }
    return Array.from(map.values());
  }, [safeData, consolidated]);

  const totalDisbursed = useMemo(() => displayData.reduce((s, r) => s + (r.amount_disbursed ?? 0), 0), [displayData]);
  const totalOverdue   = useMemo(() => displayData.reduce((s, r) => s + (r.overdue_amount   ?? 0), 0), [displayData]);

  const individualColumns = useMemo(() => [
    {
      accessorKey: "account",
      header: "Account Number",
      cell: ({ row }) => (
        <Link to={`/clients/${row.original.client_type === "individual" ? "individual" : "group"}/${row.original.account_id}`}
          className="text-xs block truncate max-w-[160px] underline underline-offset-2">
          {row.original.account}
        </Link>
      ),
    },
    {
      accessorKey: "client",
      header: "Client Name",
      cell: ({ row }) => (
        <Link to={`/clients/${row.original.client_type === "individual" ? "individual" : "group"}/${row.original.account_id}`}
          className="text-xs block truncate max-w-[200px] underline underline-offset-2">
          {row.original.client}
        </Link>
      ),
    },
    {
      accessorKey: "contact",
      header: "Contact",
      cell: ({ row }) => <p className="text-xs truncate max-w-[160px]">{row.original.contact}</p>,
    },
    {
      accessorKey: "code",
      header: "Loan Number",
      cell: ({ row }) => (
        <Link to={`/loans/${row.original.loan_id}`} className="text-xs underline underline-offset-2">
          {row.original.code}
        </Link>
      ),
    },
    {
      accessorKey: "interest_rate",
      header: "Rate",
      cell: ({ row }) => <p className="text-xs tabular-nums">{Number(row.original.interest_rate || 0)}%</p>,
    },
    {
      accessorKey: "product",
      header: "Product",
      cell: ({ row }) => <p className="text-xs truncate max-w-[180px]">{row.original.product}</p>,
    },
    {
      accessorKey: "tenure",
      header: "Tenure",
      cell: ({ row }) => <p className="text-xs truncate max-w-[140px]">{row.original.tenure}</p>,
    },
    {
      accessorKey: "disbursement_date",
      header: "Disbursed On",
      cell: ({ row }) => <p className="text-xs">{fmtDate(row.original.disbursement_date)}</p>,
    },
    {
      accessorKey: "overdue_date",
      header: "Overdue Date",
      cell: ({ row }) => <p className="text-xs">{fmtDate(row.original.overdue_date)}</p>,
    },
    {
      accessorKey: "amount_disbursed",
      header: "Amount Disbursed",
      cell: ({ row }) => <p className="text-xs tabular-nums text-right">{fmtMoney(row.original.amount_disbursed)}</p>,
    },
    {
      accessorKey: "overdue_amount",
      header: "Amount Overdue",
      cell: ({ row }) => (
        <p className="text-xs tabular-nums text-right text-red-600 font-medium">{fmtMoney(row.original.overdue_amount)}</p>
      ),
    },
    {
      accessorKey: "days_overdue",
      header: "Days Overdue",
      cell: ({ row }) => (
        <p className={`text-xs tabular-nums text-center font-semibold ${row.original.days_overdue > 30 ? "text-red-600" : "text-orange-600"}`}>
          {row.original.days_overdue}d
        </p>
      ),
    },
  ], []);

  // 12 cols, footer covers cols 4-12 (9 cells), label colSpan=3
  const individualFooter = [
    { empty: true },                                         // col 4: code
    { empty: true },                                         // col 5: rate
    { empty: true },                                         // col 6: product
    { empty: true },                                         // col 7: tenure
    { empty: true },                                         // col 8: disbursement_date
    { empty: true },                                         // col 9: overdue_date
    { value: totalDisbursed },                               // col 10: amount_disbursed
    { value: totalOverdue, className: "text-red-600" },      // col 11: overdue_amount
    { empty: true },                                         // col 12: days_overdue
  ];

  const consolidatedColumns = [
    {
      accessorKey: "account",
      header: "Account Number",
      cell: ({ row }) => (
        <Link to={`/clients/${row.original.client_type === "individual" ? "individual" : "group"}/${row.original.account_id}`}
          className="text-xs underline underline-offset-2">
          {row.original.account}
        </Link>
      ),
    },
    {
      accessorKey: "client",
      header: "Client Name",
      cell: ({ row }) => (
        <Link to={`/clients/${row.original.client_type === "individual" ? "individual" : "group"}/${row.original.account_id}`}
          className="text-xs underline underline-offset-2">
          {row.original.client}
        </Link>
      ),
    },
    {
      accessorKey: "contact",
      header: "Contact",
      cell: ({ row }) => <p className="text-xs">{row.original.contact}</p>,
    },
    {
      accessorKey: "loan_count",
      header: "Overdue Loans",
      cell: ({ row }) => (
        <p className="text-xs font-semibold text-center text-red-600">{row.original.loan_count}</p>
      ),
    },
    {
      accessorKey: "amount_disbursed",
      header: "Total Disbursed",
      cell: ({ row }) => <p className="text-xs text-right tabular-nums">{fmtMoney(row.original.amount_disbursed)}</p>,
    },
    {
      accessorKey: "overdue_amount",
      header: "Total Overdue",
      cell: ({ row }) => (
        <p className="text-xs text-right tabular-nums text-red-600 font-medium">{fmtMoney(row.original.overdue_amount)}</p>
      ),
    },
    {
      accessorKey: "max_days_overdue",
      header: "Max Days Overdue",
      cell: ({ row }) => (
        <p className={`text-xs text-center font-semibold ${row.original.max_days_overdue > 30 ? "text-red-600" : "text-orange-600"}`}>
          {row.original.max_days_overdue}d
        </p>
      ),
    },
  ];

  // 7 cols, footer covers cols 4-7 (4 cells), label colSpan=3
  const consolidatedFooter = [
    { empty: true },                                    // col 4: loan_count
    { value: totalDisbursed },                          // col 5: amount_disbursed
    { value: totalOverdue, className: "text-red-600" }, // col 6: overdue_amount
    { empty: true },                                    // col 7: max_days_overdue
  ];

  const columns     = consolidated ? consolidatedColumns : individualColumns;
  const footerCells = consolidated ? consolidatedFooter  : individualFooter;

  const handleFilterChange = (next) => { setFilters(next); refetch(); };

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink to="/dashboard">Home</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink to="/loans-reports">Loans Reports</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Overdue Loans Reports</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="w-full max-w-[100vw] overflow-x-hidden">
        <div className="flex flex-col min-w-0">
          <div className="border-b" />
          <div className="flex-1 space-y-4 p-0 pt-2 min-w-0">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h5 className="text-2xl font-bold tracking-tight">Overdue Loans Report</h5>
              <div className="flex items-center gap-2">
                <Label htmlFor="toggle-overdue" className="text-xs text-muted-foreground">Per Loan</Label>
                <Switch id="toggle-overdue" checked={consolidated} onCheckedChange={setConsolidated} />
                <Label htmlFor="toggle-overdue" className="text-xs font-medium">Per Client</Label>
              </div>
            </div>

            <LoanGeneralReportQuery
              show={{ product: true }}
              onFilterChange={handleFilterChange}
              isRefetching={isRefetching}
              refetch={refetch}
              data={safeData}
              tableRef={tableRef}
              filters={filters}
              colSpan={9}
              mode={{ format: "A4-L", orientation: "L" }}
              totals={{ totalAmountDisbursed: totalDisbursed, totalAmountDue: totalOverdue }}
              title="Overdue Loans Report"
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <ReportKpi label="Total Overdue Amount" value={`UGX ${fmtMoney(totalOverdue)}`}  hint={`${safeData.length} overdue loans`}    accent="bg-red-500"    icon={<AlertTriangle size={16} />} />
              <ReportKpi label="Avg Days Overdue"     value={`${Math.round(safeData.reduce((s,l)=>s+(l.days_overdue??0),0)/(safeData.length||1))}d`} hint="Days past due" accent="bg-orange-500" icon={<Clock size={16} />} />
              <ReportKpi label="Total Loan Balance"   value={`UGX ${fmtMoney(totalDisbursed)}`} hint="Across overdue loans"                  accent="bg-amber-500"  icon={<Wallet size={16} />} />
              <ReportKpi label="Loans at Risk"        value={safeData.length}                   hint="Requiring immediate attention"         accent="bg-rose-500"   icon={<TrendingUp size={16} />} />
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
      </div>
    </>
  );
};

export default OverdueLoansReport;

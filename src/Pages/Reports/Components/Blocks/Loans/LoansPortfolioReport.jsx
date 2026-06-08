import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import useBranchFilter from "@/MiddleWares/Hooks/useBranchFilter";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import DatatableReport from "@/Pages/Components/DatatableReport";
import LoanGeneralReportQuery from "../Queries/LoanGeneralReportQuery";
import { useState, useRef, useMemo } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Wallet, TrendingUp, AlertTriangle } from "lucide-react";
import ReportKpi from "@/Pages/Reports/Components/ReportKpi";

const fmt = (v) => new Intl.NumberFormat("en-UG", { maximumFractionDigits: 0 }).format(v ?? 0);

const parVariant = (pct) => {
  if (pct > 20) return "destructive";
  if (pct > 10) return "outline";
  return "secondary";
};

const LoansPortfolioReport = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const tableRef = useRef(null);

  const { branchKey } = useBranchFilter();
  const [filters, setFilters] = useState({ startDate: "", endDate: "", branch_id: String(branchKey ?? ""), user_id: "" });
  const [consolidated, setConsolidated] = useState(false);

  const { data = [], isLoading, refetch, isRefetching, isError } = useQuery({
    queryKey: ["portfolio-loans", filters],
    queryFn: async () => {
      try {
        const response = await axiosPrivate.get("reports/loans/portfolio", {
          params: {
            branch_id:   filters.branch_id,
            user_id:     filters.user_id,
            client_type: filters.client_type,
            group_id:    filters.group_id,
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

  // Consolidated: group by account_id, sum principals, recalculate PAR
  const displayData = useMemo(() => {
    if (!consolidated) return data;
    const map = new Map();
    for (const row of data) {
      const key = row.account_id;
      if (!map.has(key)) {
        map.set(key, {
          account_id:            row.account_id,
          account:               row.account,
          client:                row.client,
          client_type:           row.client_type,
          loan_count:            0,
          disbursed_principal:   0,
          outstanding_principal: 0,
          overdue_principal:     0,
        });
      }
      const g = map.get(key);
      g.loan_count            += 1;
      g.disbursed_principal   += row.disbursed_principal   ?? 0;
      g.outstanding_principal += row.outstanding_principal ?? 0;
      g.overdue_principal     += row.overdue_principal     ?? 0;
    }
    return Array.from(map.values()).map((g) => ({
      ...g,
      portfolio_at_risk: g.disbursed_principal > 0
        ? Number(((g.overdue_principal / g.disbursed_principal) * 100).toFixed(1))
        : 0,
    }));
  }, [data, consolidated]);

  const totalDisbursed   = useMemo(() => displayData.reduce((s, r) => s + (r.disbursed_principal   ?? 0), 0), [displayData]);
  const totalOutstanding = useMemo(() => displayData.reduce((s, r) => s + (r.outstanding_principal ?? 0), 0), [displayData]);
  const totalOverdue     = useMemo(() => displayData.reduce((s, r) => s + (r.overdue_principal     ?? 0), 0), [displayData]);

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
      accessorKey: "product",
      header: "Product",
      cell: ({ row }) => <p className="capitalize text-xs">{row.original.product}</p>,
    },
    {
      accessorKey: "disbursed_principal",
      header: "Disbursed Principal",
      cell: ({ row }) => <p className="text-xs text-right">{fmt(row.original.disbursed_principal)}</p>,
    },
    {
      accessorKey: "outstanding_principal",
      header: "Outstanding Principal",
      cell: ({ row }) => <p className="text-xs text-right">{fmt(row.original.outstanding_principal)}</p>,
    },
    {
      accessorKey: "overdue_principal",
      header: "Overdue Principal",
      cell: ({ row }) => (
        <p className={`text-xs text-right font-medium ${row.original.overdue_principal > 0 ? "text-red-600" : "text-green-700"}`}>
          {fmt(row.original.overdue_principal)}
        </p>
      ),
    },
    {
      accessorKey: "portfolio_at_risk",
      header: "Portfolio At Risk",
      cell: ({ row }) => {
        const pct = row.original.portfolio_at_risk ?? 0;
        return <Badge variant={parVariant(pct)}>{pct.toFixed(1)}%</Badge>;
      },
    },
  ];

  // 8 cols, footer covers cols 3-8 (6 cells), label colSpan=2
  const individualFooter = [
    { empty: true },                                          // col 3: code
    { empty: true },                                          // col 4: product
    { value: totalDisbursed },                                // col 5: disbursed_principal
    { value: totalOutstanding },                              // col 6: outstanding_principal
    { value: totalOverdue, className: totalOverdue > 0 ? "text-red-600" : "" }, // col 7: overdue_principal
    { empty: true },                                          // col 8: portfolio_at_risk
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
      header: "Loans",
      cell: ({ row }) => <p className="text-xs text-center font-semibold">{row.original.loan_count}</p>,
    },
    {
      accessorKey: "disbursed_principal",
      header: "Total Disbursed",
      cell: ({ row }) => <p className="text-xs text-right">{fmt(row.original.disbursed_principal)}</p>,
    },
    {
      accessorKey: "outstanding_principal",
      header: "Outstanding",
      cell: ({ row }) => <p className="text-xs text-right">{fmt(row.original.outstanding_principal)}</p>,
    },
    {
      accessorKey: "overdue_principal",
      header: "Overdue",
      cell: ({ row }) => (
        <p className={`text-xs text-right font-medium ${row.original.overdue_principal > 0 ? "text-red-600" : "text-green-700"}`}>
          {fmt(row.original.overdue_principal)}
        </p>
      ),
    },
    {
      accessorKey: "portfolio_at_risk",
      header: "PAR%",
      cell: ({ row }) => {
        const pct = row.original.portfolio_at_risk ?? 0;
        return <Badge variant={parVariant(pct)}>{pct.toFixed(1)}%</Badge>;
      },
    },
  ];

  // 7 cols, footer covers cols 3-7 (5 cells), label colSpan=2
  const consolidatedFooter = [
    { empty: true },                                          // col 3: loan_count
    { value: totalDisbursed },                                // col 4: disbursed_principal
    { value: totalOutstanding },                              // col 5: outstanding_principal
    { value: totalOverdue, className: totalOverdue > 0 ? "text-red-600" : "" }, // col 6: overdue_principal
    { empty: true },                                          // col 7: portfolio_at_risk
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
          <BreadcrumbItem><BreadcrumbPage>Loans Portfolio Reports</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h5 className="text-2xl font-bold tracking-tight">Loans Portfolio Report</h5>
            <div className="flex items-center gap-2">
              <Label htmlFor="toggle-portfolio" className="text-xs text-muted-foreground">Per Loan</Label>
              <Switch id="toggle-portfolio" checked={consolidated} onCheckedChange={setConsolidated} />
              <Label htmlFor="toggle-portfolio" className="text-xs font-medium">Per Client</Label>
            </div>
          </div>
          <LoanGeneralReportQuery
            show={{ clientType: true, group: true }}
            onFilterChange={handleFilterChange}
            isRefetching={isRefetching}
            refetch={refetch}
            data={data}
            tableRef={tableRef}
            filters={filters}
            colSpan={4}
            mode={{ format: "A4-L", orientation: "L" }}
            totals={{ totalAmountDisbursed: totalDisbursed, totalAmountDue: totalOverdue }}
            title="Loans Portfolio Report"
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <ReportKpi label="Active Loans"        value={data.length}                      hint={`${displayData.length} clients`}                                              accent="bg-blue-500"   icon={<CreditCard size={16} />} />
            <ReportKpi label="Total Loan Balance"  value={`UGX ${fmt(totalOutstanding)}`}   hint="Outstanding principal"                                                        accent="bg-violet-600" icon={<Wallet size={16} />} />
            <ReportKpi label="Total Disbursed"     value={`UGX ${fmt(totalDisbursed)}`}     hint="Original principal"                                                           accent="bg-emerald-500" icon={<TrendingUp size={16} />} />
            <ReportKpi label="Portfolio at Risk"   value={`${totalDisbursed > 0 ? ((totalOverdue / totalDisbursed) * 100).toFixed(1) : 0}%`} hint="Overdue / Disbursed" accent="bg-red-500"    icon={<AlertTriangle size={16} />} />
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

export default LoansPortfolioReport;

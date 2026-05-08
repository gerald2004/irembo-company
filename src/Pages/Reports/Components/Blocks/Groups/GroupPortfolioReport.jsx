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

const fmtMoney = (v) =>
  new Intl.NumberFormat("en-UG", { maximumFractionDigits: 0 }).format(v ?? 0);

const parVariant = (pct) => {
  if (pct > 20) return "destructive";
  if (pct > 10) return "outline";
  return "secondary";
};

const GroupPortfolioReport = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const tableRef = useRef(null);

  const { branchKey } = useBranchFilter();
  const [filters, setFilters] = useState({ startDate: "", endDate: "", branch_id: String(branchKey ?? ""), group_id: "" });
  const [consolidated, setConsolidated] = useState(false);

  const { data = [], isLoading, refetch, isRefetching, isError } = useQuery({
    queryKey: ["group-portfolio-report", filters],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get("reports/loans/portfolio", {
          params: { ...filters, client_type: "group" },
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

  const displayData = useMemo(() => {
    if (!consolidated) return data;
    const map = new Map();
    for (const row of data) {
      const key = row.account_id;
      if (!map.has(key)) {
        map.set(key, {
          account_id:            row.account_id,
          client:                row.client,
          account:               row.account,
          disbursed_principal:   0,
          outstanding_principal: 0,
          overdue_principal:     0,
          loan_count:            0,
        });
      }
      const g = map.get(key);
      g.disbursed_principal   += row.disbursed_principal   ?? 0;
      g.outstanding_principal += row.outstanding_principal ?? 0;
      g.overdue_principal     += row.overdue_principal     ?? 0;
      g.loan_count            += 1;
    }
    // Recalculate PAR per group
    return Array.from(map.values()).map((g) => ({
      ...g,
      portfolio_at_risk: g.disbursed_principal > 0
        ? Number(((g.overdue_principal / g.disbursed_principal) * 100).toFixed(1))
        : 0,
    }));
  }, [data, consolidated]);

  const totalDisbursed    = useMemo(() => displayData.reduce((s, r) => s + (r.disbursed_principal   ?? 0), 0), [displayData]);
  const totalOutstanding  = useMemo(() => displayData.reduce((s, r) => s + (r.outstanding_principal ?? 0), 0), [displayData]);
  const totalOverdue      = useMemo(() => displayData.reduce((s, r) => s + (r.overdue_principal     ?? 0), 0), [displayData]);

  const individualColumns = [
    {
      accessorKey: "client",
      header: "Group Name",
      cell: ({ row }) => (
        <Link to={`/clients/group/${row.original.account_id}`} className="text-xs capitalize font-medium">
          {row.original.client}
        </Link>
      ),
    },
    {
      accessorKey: "code",
      header: "Loan No.",
      cell: ({ row }) => (
        <Link to={`/loans/${row.original.loan_id}`} className="text-xs font-mono text-primary">
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
      accessorKey: "disbursed_principal",
      header: "Disbursed",
      cell: ({ row }) => <p className="text-xs text-right">{fmtMoney(row.original.disbursed_principal)}</p>,
    },
    {
      accessorKey: "outstanding_principal",
      header: "Outstanding",
      cell: ({ row }) => <p className="text-xs text-right">{fmtMoney(row.original.outstanding_principal)}</p>,
    },
    {
      accessorKey: "overdue_principal",
      header: "Overdue",
      cell: ({ row }) => (
        <p className={`text-xs text-right font-medium ${row.original.overdue_principal > 0 ? "text-red-600" : "text-green-700"}`}>
          {fmtMoney(row.original.overdue_principal)}
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

  const consolidatedColumns = [
    {
      accessorKey: "client",
      header: "Group Name",
      cell: ({ row }) => (
        <Link to={`/clients/group/${row.original.account_id}`} className="text-xs capitalize font-medium">
          {row.original.client}
        </Link>
      ),
    },
    {
      accessorKey: "account",
      header: "Account No.",
      cell: ({ row }) => <p className="text-xs">{row.original.account}</p>,
    },
    {
      accessorKey: "loan_count",
      header: "Loans",
      cell: ({ row }) => <p className="text-xs text-center font-semibold">{row.original.loan_count}</p>,
    },
    {
      accessorKey: "disbursed_principal",
      header: "Total Disbursed",
      cell: ({ row }) => <p className="text-xs text-right">{fmtMoney(row.original.disbursed_principal)}</p>,
    },
    {
      accessorKey: "outstanding_principal",
      header: "Outstanding",
      cell: ({ row }) => <p className="text-xs text-right">{fmtMoney(row.original.outstanding_principal)}</p>,
    },
    {
      accessorKey: "overdue_principal",
      header: "Overdue",
      cell: ({ row }) => (
        <p className={`text-xs text-right font-medium ${row.original.overdue_principal > 0 ? "text-red-600" : "text-green-700"}`}>
          {fmtMoney(row.original.overdue_principal)}
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

  const columns = consolidated ? consolidatedColumns : individualColumns;

  const handleFilterChange = (f) => { setFilters(f); refetch(); };

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink to="/dashboard">Home</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink to="/group-reports">Group Reports</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Group Loan Portfolio</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h5 className="text-2xl font-bold tracking-tight">Group Loan Portfolio Report</h5>
            <div className="flex items-center gap-2">
              <Label htmlFor="toggle-port-cons" className="text-xs text-muted-foreground">Individual</Label>
              <Switch id="toggle-port-cons" checked={consolidated} onCheckedChange={setConsolidated} />
              <Label htmlFor="toggle-port-cons" className="text-xs font-medium">Consolidated</Label>
            </div>
          </div>
          <LoanGeneralReportQuery
            show={{ officer: false, group: true }}
            onFilterChange={handleFilterChange}
            isRefetching={isRefetching}
            refetch={refetch}
            data={data}
            tableRef={tableRef}
            filters={filters}
            colSpan={3}
            mode={{ format: "A4-L", orientation: "L" }}
            totals={{ totalAmountDisbursed: totalDisbursed, totalAmountDue: totalOutstanding }}
            title="Group Loan Portfolio Report"
          />
          <div className="max-w-[1200px]">
            <DatatableReport
              ref={tableRef}
              columns={columns}
              data={displayData}
              fetchData={refetch}
              isLoading={isLoading}
              isRefetching={isRefetching}
              isError={isError}
              footerCells={
                consolidated
                  ? [
                      { empty: true },
                      { value: totalDisbursed },
                      { value: totalOutstanding },
                      { value: totalOverdue, className: totalOverdue > 0 ? "text-red-600" : "" },
                      { empty: true },
                    ]
                  : [
                      { value: totalDisbursed },
                      { value: totalOutstanding },
                      { value: totalOverdue, className: totalOverdue > 0 ? "text-red-600" : "" },
                      { empty: true },
                    ]
              }
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default GroupPortfolioReport;

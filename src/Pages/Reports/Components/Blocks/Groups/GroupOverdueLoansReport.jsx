import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import useBranchFilter from "@/MiddleWares/Hooks/useBranchFilter";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import DatatableReport from "@/Pages/Components/DatatableReport";
import { formatDateTimestamp } from "@/lib/utils";
import LoanGeneralReportQuery from "../Queries/LoanGeneralReportQuery";
import { useState, useRef, useMemo } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const fmtMoney = (v) =>
  new Intl.NumberFormat("en-UG", { maximumFractionDigits: 0 }).format(v ?? 0);

const GroupOverdueLoansReport = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const tableRef = useRef(null);

  const { branchKey } = useBranchFilter();
  const [filters, setFilters] = useState({ startDate: "", endDate: "", branch_id: String(branchKey ?? ""), group_id: "" });
  const [consolidated, setConsolidated] = useState(false);

  const { data = [], isLoading, refetch, isRefetching, isError } = useQuery({
    queryKey: ["group-overdue-loans-report", filters],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get("reports/loans/overdue-loans", {
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
          account_id:      row.account_id,
          client:          row.client,
          account:         row.account,
          amount_disbursed: 0,
          overdue_amount:   0,
          loan_count:       0,
          max_days_overdue: 0,
        });
      }
      const g = map.get(key);
      g.amount_disbursed  += row.amount_disbursed ?? 0;
      g.overdue_amount    += row.overdue_amount   ?? 0;
      g.loan_count        += 1;
      g.max_days_overdue   = Math.max(g.max_days_overdue, row.days_overdue ?? 0);
    }
    return Array.from(map.values());
  }, [data, consolidated]);

  const totalDisbursed = useMemo(() => displayData.reduce((s, r) => s + (r.amount_disbursed ?? 0), 0), [displayData]);
  const totalOverdue   = useMemo(() => displayData.reduce((s, r) => s + (r.overdue_amount   ?? 0), 0), [displayData]);

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
      accessorKey: "amount_disbursed",
      header: "Disbursed",
      cell: ({ row }) => <p className="text-xs text-right">{fmtMoney(row.original.amount_disbursed)}</p>,
    },
    {
      accessorKey: "overdue_amount",
      header: "Overdue Amount",
      cell: ({ row }) => (
        <p className="text-xs font-medium text-right text-red-600">{fmtMoney(row.original.overdue_amount)}</p>
      ),
    },
    {
      accessorKey: "days_overdue",
      header: "Days Overdue",
      cell: ({ row }) => (
        <p className={`text-xs font-semibold text-center ${row.original.days_overdue > 30 ? "text-red-600" : "text-orange-600"}`}>
          {row.original.days_overdue}d
        </p>
      ),
    },
    {
      accessorKey: "overdue_date",
      header: "First Overdue",
      cell: ({ row }) => <p className="text-xs">{formatDateTimestamp(row.original.overdue_date)}</p>,
    },
    {
      accessorKey: "disbursement_date",
      header: "Disbursed On",
      cell: ({ row }) => <p className="text-xs">{formatDateTimestamp(row.original.disbursement_date)}</p>,
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
      header: "Overdue Loans",
      cell: ({ row }) => (
        <p className="text-xs font-semibold text-center text-red-600">{row.original.loan_count}</p>
      ),
    },
    {
      accessorKey: "amount_disbursed",
      header: "Total Disbursed",
      cell: ({ row }) => <p className="text-xs text-right">{fmtMoney(row.original.amount_disbursed)}</p>,
    },
    {
      accessorKey: "overdue_amount",
      header: "Total Overdue",
      cell: ({ row }) => (
        <p className="text-xs font-medium text-right text-red-600">{fmtMoney(row.original.overdue_amount)}</p>
      ),
    },
    {
      accessorKey: "max_days_overdue",
      header: "Max Days Overdue",
      cell: ({ row }) => (
        <p className="text-xs font-semibold text-center text-red-600">{row.original.max_days_overdue}d</p>
      ),
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
          <BreadcrumbItem><BreadcrumbPage>Overdue Group Loans</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h5 className="text-2xl font-bold tracking-tight">Overdue Group Loans Report</h5>
            <div className="flex items-center gap-2">
              <Label htmlFor="toggle-overdue-cons" className="text-xs text-muted-foreground">Individual</Label>
              <Switch id="toggle-overdue-cons" checked={consolidated} onCheckedChange={setConsolidated} />
              <Label htmlFor="toggle-overdue-cons" className="text-xs font-medium">Consolidated</Label>
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
            totals={{ totalAmountDisbursed: totalDisbursed, totalAmountDue: totalOverdue }}
            title="Overdue Group Loans Report"
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
                      { value: totalOverdue, className: "text-red-600" },
                      { empty: true },
                    ]
                  : [
                      { value: totalDisbursed },
                      { value: totalOverdue, className: "text-red-600" },
                      { empty: true },
                      { empty: true },
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

export default GroupOverdueLoansReport;

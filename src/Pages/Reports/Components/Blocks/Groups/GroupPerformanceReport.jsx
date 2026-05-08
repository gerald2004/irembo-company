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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const fmtMoney = (v) =>
  new Intl.NumberFormat("en-UG", { maximumFractionDigits: 0 }).format(v ?? 0);

const parColor = (pct) => {
  if (pct > 20) return "destructive";
  if (pct > 10) return "outline";
  return "secondary";
};

const GroupPerformanceReport = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const tableRef = useRef(null);

  const { branchKey } = useBranchFilter();
  const [filters, setFilters] = useState({ startDate: "", endDate: "", branch_id: String(branchKey ?? "") });

  const { data = [], isLoading, refetch, isRefetching, isError } = useQuery({
    queryKey: ["group-performance-report", filters],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get("reports/groups/performance", { params: filters });
        return res?.data?.data ?? [];
      } catch (error) {
        if (error?.response?.status === 401)
          navigate("/", { state: { from: location }, replace: true });
        throw error;
      }
    },
    placeholderData: (prev) => prev,
  });

  // Totals — cols 4–11 (8 footer cells, label spans cols 1–3)
  const totalDisbursed    = useMemo(() => data.reduce((s, r) => s + (r.total_disbursed ?? 0), 0), [data]);
  const totalOutstanding  = useMemo(() => data.reduce((s, r) => s + (r.total_outstanding ?? 0), 0), [data]);
  const totalRepaid       = useMemo(() => data.reduce((s, r) => s + (r.total_repaid ?? 0), 0), [data]);
  const totalInterest     = useMemo(() => data.reduce((s, r) => s + (r.total_interest_earned ?? 0), 0), [data]);
  const totalOverdue      = useMemo(() => data.reduce((s, r) => s + (r.overdue_loans ?? 0), 0), [data]);
  const totalGroupSavings = useMemo(() => data.reduce((s, r) => s + (r.total_savings ?? 0), 0), [data]);

  const columns = [
    {
      accessorKey: "group_name",
      header: "Group",
      cell: ({ row }) => (
        <Link to={`/clients/group/${row.original.group_id}`} className="text-xs capitalize font-medium">
          {row.original.group_name}
        </Link>
      ),
    },
    {
      accessorKey: "member_count",
      header: "Members",
      cell: ({ row }) => <p className="text-xs text-center">{row.original.member_count}</p>,
    },
    {
      accessorKey: "total_loans_issued",
      header: "Loans Issued",
      cell: ({ row }) => <p className="text-xs text-center">{row.original.total_loans_issued}</p>,
    },
    {
      accessorKey: "total_disbursed",
      header: "Total Disbursed",
      cell: ({ row }) => <p className="text-xs text-right">{fmtMoney(row.original.total_disbursed)}</p>,
    },
    {
      accessorKey: "total_outstanding",
      header: "Outstanding",
      cell: ({ row }) => <p className="text-xs text-right">{fmtMoney(row.original.total_outstanding)}</p>,
    },
    {
      accessorKey: "total_repaid",
      header: "Total Repaid",
      cell: ({ row }) => <p className="text-xs text-right">{fmtMoney(row.original.total_repaid)}</p>,
    },
    {
      accessorKey: "total_interest_earned",
      header: "Interest Earned",
      cell: ({ row }) => <p className="text-xs text-green-700 text-right">{fmtMoney(row.original.total_interest_earned)}</p>,
    },
    {
      accessorKey: "repayment_rate_pct",
      header: "Repayment Rate",
      cell: ({ row }) => {
        const pct = row.original.repayment_rate_pct ?? 0;
        return (
          <div className="flex items-center gap-2">
            <Progress value={Math.min(pct, 100)} className="h-2 w-16" />
            <span className="text-xs">{pct.toFixed(1)}%</span>
          </div>
        );
      },
    },
    {
      accessorKey: "overdue_loans",
      header: "Overdue",
      cell: ({ row }) => (
        <p className={`text-xs font-semibold text-center ${row.original.overdue_loans > 0 ? "text-red-600" : "text-green-700"}`}>
          {row.original.overdue_loans}
        </p>
      ),
    },
    {
      accessorKey: "par_pct",
      header: "PAR%",
      cell: ({ row }) => {
        const pct = row.original.par_pct ?? 0;
        return <Badge variant={parColor(pct)}>{pct.toFixed(1)}%</Badge>;
      },
    },
    {
      accessorKey: "total_savings",
      header: "Group Savings",
      cell: ({ row }) => <p className="text-xs text-right">{fmtMoney(row.original.total_savings)}</p>,
    },
  ];

  const handleFilterChange = (f) => { setFilters(f); refetch(); };

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink to="/dashboard">Home</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink to="/group-reports">Group Reports</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Group Performance</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <h5 className="text-2xl font-bold tracking-tight">Group Performance Report</h5>
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
            title="Group Performance Report"
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
              footerCells={[
                { value: totalDisbursed },
                { value: totalOutstanding },
                { value: totalRepaid },
                { value: totalInterest, className: "text-green-700" },
                { empty: true },
                { value: totalOverdue, isCount: true, className: totalOverdue > 0 ? "text-red-600" : "" },
                { empty: true },
                { value: totalGroupSavings },
              ]}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default GroupPerformanceReport;

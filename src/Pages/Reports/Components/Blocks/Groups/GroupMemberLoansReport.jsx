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
import { Badge } from "@/components/ui/badge";

const fmtMoney = (v) =>
  new Intl.NumberFormat("en-UG", { maximumFractionDigits: 0 }).format(v ?? 0);

const GroupMemberLoansReport = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const tableRef = useRef(null);

  const [filters, setFilters] = useState({ startDate: "", endDate: "", branch_id: "", group_id: "" });
  const [consolidated, setConsolidated] = useState(false);

  const { data = [], isLoading, refetch, isRefetching, isError } = useQuery({
    queryKey: ["group-member-loans-report", filters],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get("reports/groups/member-loans", { params: filters });
        return res?.data?.data ?? [];
      } catch (error) {
        if (error?.response?.status === 401)
          navigate("/", { state: { from: location }, replace: true });
        throw error;
      }
    },
    placeholderData: (prev) => prev,
  });

  // Consolidated view: group by member_id, sum loan totals
  const displayData = useMemo(() => {
    if (!consolidated) return data;
    const map = new Map();
    for (const row of data) {
      const key = row.member_id;
      if (!map.has(key)) {
        map.set(key, {
          member_id:        row.member_id,
          member_name:      row.member_name,
          account:          row.account,
          group_name:       row.group_name,
          group_id:         row.group_id,
          member_role:      row.member_role,
          loan_count:       0,
          amount_disbursed: 0,
          remaining_balance:0,
        });
      }
      const g = map.get(key);
      g.loan_count        += 1;
      g.amount_disbursed  += row.amount_disbursed   ?? 0;
      g.remaining_balance += row.remaining_balance  ?? 0;
    }
    return Array.from(map.values());
  }, [data, consolidated]);

  const totalDisbursed   = useMemo(() => displayData.reduce((s, r) => s + (r.amount_disbursed   ?? 0), 0), [displayData]);
  const totalOutstanding = useMemo(() => displayData.reduce((s, r) => s + (r.remaining_balance  ?? 0), 0), [displayData]);

  const individualColumns = [
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
      accessorKey: "member_name",
      header: "Member Name",
      cell: ({ row }) => (
        <Link to={`/clients/individual/${row.original.member_id}`} className="text-xs capitalize">
          {row.original.member_name}
        </Link>
      ),
    },
    {
      accessorKey: "member_role",
      header: "Role",
      cell: ({ row }) => (
        <Badge variant={row.original.member_role === "chairperson" ? "default" : "secondary"} className="text-xs">
          {row.original.member_role ?? "member"}
        </Badge>
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
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.status === "disbursed" ? "default" : "secondary"} className="text-xs">
          {row.original.status}
        </Badge>
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
      accessorKey: "remaining_balance",
      header: "Outstanding",
      cell: ({ row }) => (
        <p className="text-xs font-medium text-right">{fmtMoney(row.original.remaining_balance)}</p>
      ),
    },
    {
      accessorKey: "interest_rate",
      header: "Rate",
      cell: ({ row }) => <p className="text-xs text-center">{row.original.interest_rate}%</p>,
    },
    {
      accessorKey: "disbursement_date",
      header: "Disbursed On",
      cell: ({ row }) => <p className="text-xs">{formatDateTimestamp(row.original.disbursement_date)}</p>,
    },
    {
      accessorKey: "next_repayment_date",
      header: "Next Repayment",
      cell: ({ row }) => <p className="text-xs">{formatDateTimestamp(row.original.next_repayment_date)}</p>,
    },
    {
      accessorKey: "next_repayment_amount",
      header: "Next Amount",
      cell: ({ row }) => <p className="text-xs text-right">{fmtMoney(row.original.next_repayment_amount)}</p>,
    },
  ];

  // 12 cols: footerCells = 6 (covering cols 7-12), label colSpan = 6
  const individualFooter = [
    { value: totalDisbursed },         // col 7: amount_disbursed
    { value: totalOutstanding },       // col 8: remaining_balance
    { empty: true },                   // col 9: interest_rate
    { empty: true },                   // col 10: disbursement_date
    { empty: true },                   // col 11: next_repayment_date
    { empty: true },                   // col 12: next_repayment_amount
  ];

  const consolidatedColumns = [
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
      accessorKey: "member_name",
      header: "Member Name",
      cell: ({ row }) => (
        <Link to={`/clients/individual/${row.original.member_id}`} className="text-xs capitalize">
          {row.original.member_name}
        </Link>
      ),
    },
    {
      accessorKey: "account",
      header: "Account No.",
      cell: ({ row }) => <p className="text-xs">{row.original.account}</p>,
    },
    {
      accessorKey: "member_role",
      header: "Role",
      cell: ({ row }) => (
        <Badge variant={row.original.member_role === "chairperson" ? "default" : "secondary"} className="text-xs">
          {row.original.member_role ?? "member"}
        </Badge>
      ),
    },
    {
      accessorKey: "loan_count",
      header: "Loans",
      cell: ({ row }) => <p className="text-xs text-center font-semibold">{row.original.loan_count}</p>,
    },
    {
      accessorKey: "amount_disbursed",
      header: "Total Disbursed",
      cell: ({ row }) => <p className="text-xs text-right">{fmtMoney(row.original.amount_disbursed)}</p>,
    },
    {
      accessorKey: "remaining_balance",
      header: "Total Outstanding",
      cell: ({ row }) => (
        <p className="text-xs font-medium text-right">{fmtMoney(row.original.remaining_balance)}</p>
      ),
    },
  ];

  // 7 cols: footerCells = 3 (covering cols 5-7), label colSpan = 4
  const consolidatedFooter = [
    { empty: true },             // col 5: loan_count
    { value: totalDisbursed },   // col 6: amount_disbursed
    { value: totalOutstanding }, // col 7: remaining_balance
  ];

  const columns     = consolidated ? consolidatedColumns     : individualColumns;
  const footerCells = consolidated ? consolidatedFooter      : individualFooter;

  const handleFilterChange = (f) => { setFilters(f); refetch(); };

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink to="/dashboard">Home</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink to="/group-reports">Group Reports</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Member Loans</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h5 className="text-2xl font-bold tracking-tight">Group Member Loans Report</h5>
            <div className="flex items-center gap-2">
              <Label htmlFor="toggle-memloans" className="text-xs text-muted-foreground">Individual</Label>
              <Switch id="toggle-memloans" checked={consolidated} onCheckedChange={setConsolidated} />
              <Label htmlFor="toggle-memloans" className="text-xs font-medium">Per Member</Label>
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
            title="Group Member Loans Report"
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
              footerCells={footerCells}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default GroupMemberLoansReport;

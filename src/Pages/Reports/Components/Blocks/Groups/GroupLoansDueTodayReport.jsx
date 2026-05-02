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

const fmtMoney = (v) =>
  new Intl.NumberFormat("en-UG", { maximumFractionDigits: 0 }).format(v ?? 0);

const GroupLoansDueTodayReport = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const tableRef = useRef(null);

  const [filters, setFilters] = useState({ branch_id: "", group_id: "" });
  const [consolidated, setConsolidated] = useState(false);

  const { data = [], isLoading, refetch, isRefetching, isError } = useQuery({
    queryKey: ["group-loans-due-today-report", filters],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get("reports/groups/loans-due-today", { params: filters });
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
          account_id:    row.account_id,
          group_name:    row.group_name,
          account:       row.account,
          loan_count:    0,
          due_principal: 0,
          due_interest:  0,
          due_penalties: 0,
          due_total:     0,
        });
      }
      const g = map.get(key);
      g.loan_count    += 1;
      g.due_principal += row.due_principal ?? 0;
      g.due_interest  += row.due_interest  ?? 0;
      g.due_penalties += row.due_penalties ?? 0;
      g.due_total     += row.due_total     ?? 0;
    }
    return Array.from(map.values());
  }, [data, consolidated]);

  const totalPrincipal = useMemo(() => displayData.reduce((s, r) => s + (r.due_principal ?? 0), 0), [displayData]);
  const totalInterest  = useMemo(() => displayData.reduce((s, r) => s + (r.due_interest  ?? 0), 0), [displayData]);
  const totalDue       = useMemo(() => displayData.reduce((s, r) => s + (r.due_total     ?? 0), 0), [displayData]);

  const individualColumns = [
    {
      accessorKey: "group_name",
      header: "Group Name",
      cell: ({ row }) => (
        <Link to={`/clients/group/${row.original.account_id}`} className="text-xs capitalize font-medium">
          {row.original.group_name}
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
      header: "Loan Amount",
      cell: ({ row }) => <p className="text-xs text-right">{fmtMoney(row.original.amount_disbursed)}</p>,
    },
    {
      accessorKey: "due_principal",
      header: "Due Principal",
      cell: ({ row }) => <p className="text-xs text-right">{fmtMoney(row.original.due_principal)}</p>,
    },
    {
      accessorKey: "due_interest",
      header: "Due Interest",
      cell: ({ row }) => (
        <p className="text-xs text-right text-green-700">{fmtMoney(row.original.due_interest)}</p>
      ),
    },
    {
      accessorKey: "due_penalties",
      header: "Penalties",
      cell: ({ row }) => (
        <p className="text-xs text-right text-amber-600">{fmtMoney(row.original.due_penalties)}</p>
      ),
    },
    {
      accessorKey: "due_total",
      header: "Total Due",
      cell: ({ row }) => (
        <p className="text-xs text-right font-semibold">{fmtMoney(row.original.due_total)}</p>
      ),
    },
    {
      accessorKey: "disbursement_date",
      header: "Disbursed On",
      cell: ({ row }) => <p className="text-xs">{formatDateTimestamp(row.original.disbursement_date)}</p>,
    },
  ];

  const consolidatedColumns = [
    {
      accessorKey: "group_name",
      header: "Group Name",
      cell: ({ row }) => (
        <Link to={`/clients/group/${row.original.account_id}`} className="text-xs capitalize font-medium">
          {row.original.group_name}
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
      header: "Loans Due",
      cell: ({ row }) => <p className="text-xs text-center font-semibold">{row.original.loan_count}</p>,
    },
    {
      accessorKey: "due_principal",
      header: "Due Principal",
      cell: ({ row }) => <p className="text-xs text-right">{fmtMoney(row.original.due_principal)}</p>,
    },
    {
      accessorKey: "due_interest",
      header: "Due Interest",
      cell: ({ row }) => (
        <p className="text-xs text-right text-green-700">{fmtMoney(row.original.due_interest)}</p>
      ),
    },
    {
      accessorKey: "due_penalties",
      header: "Penalties",
      cell: ({ row }) => (
        <p className="text-xs text-right text-amber-600">{fmtMoney(row.original.due_penalties)}</p>
      ),
    },
    {
      accessorKey: "due_total",
      header: "Total Due",
      cell: ({ row }) => (
        <p className="text-xs text-right font-semibold">{fmtMoney(row.original.due_total)}</p>
      ),
    },
  ];

  const columns = consolidated ? consolidatedColumns : individualColumns;

  const handleFilterChange = (f) => { setFilters((prev) => ({ ...prev, ...f })); refetch(); };

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink to="/dashboard">Home</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink to="/group-reports">Group Reports</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Loans Due Today</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h5 className="text-2xl font-bold tracking-tight">Group Loans Due Today</h5>
            <div className="flex items-center gap-2">
              <Label htmlFor="toggle-due-cons" className="text-xs text-muted-foreground">Individual</Label>
              <Switch id="toggle-due-cons" checked={consolidated} onCheckedChange={setConsolidated} />
              <Label htmlFor="toggle-due-cons" className="text-xs font-medium">Consolidated</Label>
            </div>
          </div>
          <LoanGeneralReportQuery
            show={{ officer: false, group: true, date: false }}
            onFilterChange={handleFilterChange}
            isRefetching={isRefetching}
            refetch={refetch}
            data={data}
            tableRef={tableRef}
            filters={filters}
            colSpan={2}
            mode={{ format: "A4-L", orientation: "L" }}
            totals={{ totalAmountDisbursed: totalPrincipal, totalAmountDue: totalDue }}
            title="Group Loans Due Today"
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
                      { value: totalPrincipal },
                      { value: totalInterest, className: "text-green-700" },
                      { empty: true },
                      { value: totalDue, className: "font-bold" },
                    ]
                  : [
                      { empty: true },
                      { value: totalPrincipal },
                      { value: totalInterest, className: "text-green-700" },
                      { empty: true },
                      { value: totalDue, className: "font-bold" },
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

export default GroupLoansDueTodayReport;

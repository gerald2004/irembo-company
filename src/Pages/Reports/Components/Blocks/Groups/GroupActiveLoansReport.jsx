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

const GroupActiveLoansReport = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const tableRef = useRef(null);

  const [filters, setFilters] = useState({ startDate: "", endDate: "", branch_id: "", group_id: "" });
  const [consolidated, setConsolidated] = useState(false);

  const { data = [], isLoading, refetch, isRefetching, isError } = useQuery({
    queryKey: ["group-active-loans-report", filters],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get("reports/loans/active-loans", {
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

  // Consolidated view: group by account_id, sum amounts
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
          amount_due:       0,
          loan_count:       0,
        });
      }
      const g = map.get(key);
      g.amount_disbursed += row.amount_disbursed ?? 0;
      g.amount_due       += row.amount_due       ?? 0;
      g.loan_count       += 1;
    }
    return Array.from(map.values());
  }, [data, consolidated]);

  const totalDisbursed   = useMemo(() => displayData.reduce((s, r) => s + (r.amount_disbursed ?? 0), 0), [displayData]);
  const totalOutstanding = useMemo(() => displayData.reduce((s, r) => s + (r.amount_due       ?? 0), 0), [displayData]);

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
      accessorKey: "amount_due",
      header: "Outstanding",
      cell: ({ row }) => <p className="text-xs font-medium text-right">{fmtMoney(row.original.amount_due)}</p>,
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
      header: "Active Loans",
      cell: ({ row }) => <p className="text-xs text-center font-semibold">{row.original.loan_count}</p>,
    },
    {
      accessorKey: "amount_disbursed",
      header: "Total Disbursed",
      cell: ({ row }) => <p className="text-xs text-right">{fmtMoney(row.original.amount_disbursed)}</p>,
    },
    {
      accessorKey: "amount_due",
      header: "Total Outstanding",
      cell: ({ row }) => <p className="text-xs font-medium text-right">{fmtMoney(row.original.amount_due)}</p>,
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
          <BreadcrumbItem><BreadcrumbPage>Active Group Loans</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h5 className="text-2xl font-bold tracking-tight">Active Group Loans Report</h5>
            <div className="flex items-center gap-2">
              <Label htmlFor="toggle-consolidated" className="text-xs text-muted-foreground">
                Individual
              </Label>
              <Switch
                id="toggle-consolidated"
                checked={consolidated}
                onCheckedChange={setConsolidated}
              />
              <Label htmlFor="toggle-consolidated" className="text-xs font-medium">
                Consolidated
              </Label>
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
            title="Active Group Loans Report"
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
                      { value: totalDisbursed },
                      { value: totalOutstanding },
                    ]
                  : [
                      { value: totalDisbursed },
                      { value: totalOutstanding },
                      { empty: true },
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

export default GroupActiveLoansReport;

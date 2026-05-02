import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import DatatableReport from "@/Pages/Components/DatatableReport";
import LoanGeneralReportQuery from "../Queries/LoanGeneralReportQuery";
import { useState, useRef, useMemo } from "react";

const fmtMoney = (v) =>
  new Intl.NumberFormat("en-UG", { maximumFractionDigits: 0 }).format(v ?? 0);

const GroupSavingsReport = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const tableRef = useRef(null);

  const [filters, setFilters] = useState({ startDate: "", endDate: "", branch_id: "" });

  const { data = [], isLoading, refetch, isRefetching, isError } = useQuery({
    queryKey: ["group-savings-report", filters],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get("reports/groups/savings", { params: filters });
        return res?.data?.data ?? [];
      } catch (error) {
        if (error?.response?.status === 401)
          navigate("/", { state: { from: location }, replace: true });
        throw error;
      }
    },
    placeholderData: (prev) => prev,
  });

  // Totals for all 5 numeric columns (cols 3–7)
  const totalSavings     = useMemo(() => data.reduce((s, r) => s + (r.total_savings ?? 0), 0), [data]);
  const totalFrozen      = useMemo(() => data.reduce((s, r) => s + (r.total_frozen ?? 0), 0), [data]);
  const totalDeposits    = useMemo(() => data.reduce((s, r) => s + (r.deposits_in_period ?? 0), 0), [data]);
  const totalWithdrawals = useMemo(() => data.reduce((s, r) => s + (r.withdrawals_in_period ?? 0), 0), [data]);
  const totalNet         = useMemo(() => totalDeposits - totalWithdrawals, [totalDeposits, totalWithdrawals]);

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
      accessorKey: "total_savings",
      header: "Total Savings Balance",
      cell: ({ row }) => <p className="text-xs text-right">{fmtMoney(row.original.total_savings)}</p>,
    },
    {
      accessorKey: "total_frozen",
      header: "Frozen / Compulsory",
      cell: ({ row }) => <p className="text-xs text-right">{fmtMoney(row.original.total_frozen)}</p>,
    },
    {
      accessorKey: "deposits_in_period",
      header: "Deposits (Period)",
      cell: ({ row }) => (
        <p className="text-xs text-green-700 font-medium text-right">{fmtMoney(row.original.deposits_in_period)}</p>
      ),
    },
    {
      accessorKey: "withdrawals_in_period",
      header: "Withdrawals (Period)",
      cell: ({ row }) => (
        <p className="text-xs text-red-600 text-right">{fmtMoney(row.original.withdrawals_in_period)}</p>
      ),
    },
    {
      accessorKey: "net_savings_movement",
      header: "Net Movement",
      cell: ({ row }) => {
        const net = row.original.net_savings_movement ?? 0;
        return (
          <p className={`text-xs font-semibold text-right ${net >= 0 ? "text-green-700" : "text-red-600"}`}>
            {net >= 0 ? "+" : ""}{fmtMoney(Math.abs(net))}
          </p>
        );
      },
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
          <BreadcrumbItem><BreadcrumbPage>Group Savings</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <h5 className="text-2xl font-bold tracking-tight">Group Savings Report</h5>
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
            totals={{ totalAmountDisbursed: totalSavings, totalAmountDue: totalDeposits }}
            title="Group Savings Report"
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
                { value: totalSavings },
                { value: totalFrozen },
                { value: totalDeposits, className: "text-green-700" },
                { value: totalWithdrawals, className: "text-red-600" },
                { value: totalNet, className: totalNet >= 0 ? "text-green-700" : "text-red-600" },
              ]}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default GroupSavingsReport;

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import DatatableReport from "@/Pages/Components/DatatableReport";
import LoanGeneralReportQuery from "../Queries/LoanGeneralReportQuery";
import { useState, useRef } from "react";
import { formatDateTimestamp } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const WithdrawsReport = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const tableRef = useRef(null);

  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    branch_id: "",
    user_id: "",
  });
  const {
    data = [],
    isLoading,
    refetch,
    isRefetching,
    isError,
  } = useQuery({
    queryKey: ["withdraws-reports", filters],
    queryFn: async () => {
      const controller = new AbortController();
      const fetchURL = `reports/savings/withdraws`;
      try {
        const response = await axiosPrivate.get(fetchURL, {
          params: {
            startDate: filters.startDate,
            endDate: filters.endDate,
            branch_id: filters.branch_id,
            user_id: filters.user_id,
          },
          signal: controller.signal,
        });
        return response?.data?.data ?? [];
      } catch (error) {
        if (error?.response?.status === 401) {
          navigate("/", { state: { from: location }, replace: true });
        }
        throw error;
      }
    },
    placeholderData: (prev) => prev,
  });

  const columns = [
    {
      accessorKey: "account",
      header: "Account Number",
      cell: ({ row }) => (
        <Link
          to={`/clients/${
            row.original.client_type === "individual" ? "individual" : "group"
          }/${row.original.client_id}`}
          className="capitalize text-xs"
        >
          {" "}
          {row.original.account}
        </Link>
      ),
    },
    {
      accessorKey: "client",
      header: "Client Name",
      cell: ({ row }) => (
        <Link
          to={`/clients/${
            row.original.client_type === "individual" ? "individual" : "group"
          }/${row.original.client_id}`}
          className="capitalize text-xs"
        >
          {" "}
          {row.original.client}
        </Link>
      ),
    },
    {
      accessorKey: "code",
      header: "Deposit Number",
      cell: ({ row }) => (
        <p className="capitalize text-xs">{row.original.code}</p>
      ),
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => (
        <p className="capitalize text-xs">
          {parseFloat(row.original.amount).toLocaleString()}
        </p>
      ),
    },

    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge className="capitalize text-xs">{row.original.status}</Badge>
      ),
    },
    {
      accessorKey: "method",
      header: "Method",
      cell: ({ row }) => (
        <Badge className="capitalize text-xs">{row.original.method}</Badge>
      ),
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => (
        <p className="capitalize text-xs">
          {formatDateTimestamp(row.original.timestamp)}
        </p>
      ),
    },
    {
      accessorKey: "handled_by",
      header: "Handled By",
      cell: ({ row }) => (
        <p className="capitalize text-xs">{row.original.handled_by}</p>
      ),
    },
    {
      accessorKey: "narrative",
      header: "Narrative",
      cell: ({ row }) => (
        <p className="capitalize text-xs">{row?.original.narrative}</p>
      ),
    },
  ];
  const handleFilterChange = (filterData) => {
    setFilters(filterData);
    refetch();
  };

  const fmt = (n) => new Intl.NumberFormat("en-UG", { maximumFractionDigits: 0 }).format(n ?? 0);
  const rows = data?.data ?? [];
  const meta = data?.meta ?? {};
  const avgWithdrawal = rows.length ? (meta.total_withdrawn ?? 0) / rows.length : 0;

  const KPI = ({ label, value, sub, accent = "bg-blue-500" }) => (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className={`h-1 ${accent}`} />
      <div className="p-4">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold mt-1">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </div>
    </div>
  );

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="/dashboard">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink to="/savings-reports">Savings Reports</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Withdrawals</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="space-y-4 pt-2">
        <h5 className="text-2xl font-bold tracking-tight">Withdrawals Report</h5>

        <LoanGeneralReportQuery show={{ method: true }}
          onFilterChange={handleFilterChange}
          isRefetching={isRefetching}
          data={rows}
          tableRef={tableRef}
          filters={filters}
          colSpan={3}
          mode={{ format: "A4-L", orientation: "L" }}
          totals={{ totalDebit: meta.total_withdrawn }}
          title="Withdrawals Report"
        />

        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPI label="Total Withdrawn"   value={`UGX ${fmt(meta.total_withdrawn)}`}  sub={`${meta.count ?? rows.length} transactions`} accent="bg-amber-500" />
          <KPI label="Charges Collected" value={`UGX ${fmt(meta.total_charges)}`}    sub="Processing fees"                             accent="bg-red-500" />
          <KPI label="Avg Withdrawal"    value={`UGX ${fmt(avgWithdrawal)}`}          sub="Per transaction"                             accent="bg-blue-500" />
          <KPI label="Net Outflow"       value={`UGX ${fmt((meta.total_withdrawn ?? 0) + (meta.total_charges ?? 0))}`} sub="Withdrawn + charges" accent="bg-rose-500" />
        </div>

        <div className="overflow-x-auto">
          <DatatableReport
            ref={tableRef}
            columns={columns}
            data={rows}
            fetchData={refetch}
            isLoading={isLoading}
            isRefetching={isRefetching}
            isError={isError}
            colSpan={6}
            totalDebit={meta.total_withdrawn}
          />
        </div>
      </div>
    </>
  );
};

export default WithdrawsReport;

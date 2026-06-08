import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import useBranchFilter from "@/MiddleWares/Hooks/useBranchFilter";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import DatatableReport from "@/Pages/Components/DatatableReport";
import LoanGeneralReportQuery from "../Queries/LoanGeneralReportQuery";
import { useState, useRef } from "react";
import { formatDateTimestamp } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight, LayoutList, BarChart3 } from "lucide-react";

const nf  = new Intl.NumberFormat("en-UG", { maximumFractionDigits: 0 });
const fmt = (v) => nf.format(Number(v ?? 0));

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

// ── Detail table columns ──────────────────────────────────────────────────────
const detailColumns = [
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => (
      <Badge
        className={`text-xs capitalize ${
          row.original.type === "deposit"
            ? "bg-emerald-100 text-emerald-800"
            : "bg-amber-100 text-amber-800"
        }`}
        variant="outline"
      >
        {row.original.type}
      </Badge>
    ),
  },
  {
    accessorKey: "client",
    header: "Client",
    cell: ({ row }) => (
      <Link
        to={`/clients/${row.original.client_type === "individual" ? "individual" : "group"}/${row.original.client_id}`}
        className="capitalize text-xs text-primary hover:underline"
      >
        {row.original.client}
      </Link>
    ),
  },
  {
    accessorKey: "account",
    header: "Account",
    cell: ({ row }) => <p className="text-xs">{row.original.account}</p>,
  },
  {
    accessorKey: "home_branch_name",
    header: "Home Branch",
    cell: ({ row }) => (
      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
        {row.original.home_branch_name}
      </Badge>
    ),
  },
  {
    accessorKey: "transaction_branch_name",
    header: "Txn Branch",
    cell: ({ row }) => (
      <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
        {row.original.transaction_branch_name}
      </Badge>
    ),
  },
  {
    accessorKey: "amount",
    header: "Amount (UGX)",
    cell: ({ row }) => (
      <p className="text-xs text-right font-medium">{fmt(row.original.amount)}</p>
    ),
  },
  {
    accessorKey: "method",
    header: "Method",
    cell: ({ row }) => (
      <Badge variant="outline" className="text-xs capitalize">{row.original.method}</Badge>
    ),
  },
  {
    accessorKey: "handled_by",
    header: "Teller",
    cell: ({ row }) => <p className="text-xs capitalize">{row.original.handled_by}</p>,
  },
  {
    accessorKey: "timestamp",
    header: "Date",
    cell: ({ row }) => (
      <p className="text-xs">{formatDateTimestamp(row.original.timestamp)}</p>
    ),
  },
  {
    accessorKey: "code",
    header: "Ref",
    cell: ({ row }) => <p className="text-xs text-muted-foreground">{row.original.code}</p>,
  },
];

// ── Summary by branch-pair table columns ─────────────────────────────────────
const pairColumns = [
  {
    accessorKey: "home_branch_name",
    header: "Client's Home Branch",
    cell: ({ row }) => (
      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
        {row.original.home_branch_name}
      </Badge>
    ),
  },
  {
    accessorKey: "transaction_branch_name",
    header: "Processed At Branch",
    cell: ({ row }) => (
      <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
        {row.original.transaction_branch_name}
      </Badge>
    ),
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => (
      <Badge
        className={`text-xs capitalize ${
          row.original.type === "deposit"
            ? "bg-emerald-100 text-emerald-800"
            : "bg-amber-100 text-amber-800"
        }`}
        variant="outline"
      >
        {row.original.type}
      </Badge>
    ),
  },
  {
    accessorKey: "count",
    header: "# Transactions",
    cell: ({ row }) => <p className="text-xs text-center">{row.original.count}</p>,
  },
  {
    accessorKey: "total_amount",
    header: "Total Amount (UGX)",
    cell: ({ row }) => (
      <p className="text-xs text-right font-medium">{fmt(row.original.total_amount)}</p>
    ),
  },
  {
    accessorKey: "total_charges",
    header: "Charges (UGX)",
    cell: ({ row }) => (
      <p className="text-xs text-right">{fmt(row.original.total_charges)}</p>
    ),
  },
];

// ── Summary by teller table columns ──────────────────────────────────────────
const tellerColumns = [
  {
    accessorKey: "handled_by",
    header: "Teller",
    cell: ({ row }) => <p className="text-xs capitalize">{row.original.handled_by}</p>,
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => (
      <Badge
        className={`text-xs capitalize ${
          row.original.type === "deposit"
            ? "bg-emerald-100 text-emerald-800"
            : "bg-amber-100 text-amber-800"
        }`}
        variant="outline"
      >
        {row.original.type}
      </Badge>
    ),
  },
  {
    accessorKey: "count",
    header: "# Transactions",
    cell: ({ row }) => <p className="text-xs text-center">{row.original.count}</p>,
  },
  {
    accessorKey: "total_amount",
    header: "Total Amount (UGX)",
    cell: ({ row }) => (
      <p className="text-xs text-right font-medium">{fmt(row.original.total_amount)}</p>
    ),
  },
];

// ── Main component ────────────────────────────────────────────────────────────
const CrossBranchTransactionsReport = () => {
  const axiosPrivate  = useAxiosPrivate();
  const navigate      = useNavigate();
  const tableRef      = useRef(null);
  const { branchKey } = useBranchFilter();

  const [view,    setView]    = useState("detail");   // detail | summary
  const [txnType, setTxnType] = useState("both");     // deposit | withdrawal | both
  const [filters, setFilters] = useState({
    startDate: "",
    endDate:   "",
    branch_id: String(branchKey ?? ""),
    user_id:   "",
  });

  const {
    data: response = {},
    isLoading,
    refetch,
    isRefetching,
    isError,
  } = useQuery({
    queryKey: ["cross-branch-report", filters, view, txnType],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get("reports/accounts/cross-branch", {
          params: {
            view,
            type:      txnType,
            startDate: filters.startDate,
            endDate:   filters.endDate,
            branch_id: filters.branch_id,
            user_id:   filters.user_id,
          },
        });
        return res?.data?.data ?? {};
      } catch (error) {
        if (error?.response?.status === 401) {
          navigate("/", { state: { from: location }, replace: true });
        }
        throw error;
      }
    },
    placeholderData: (prev) => prev,
  });

  const meta       = response?.meta   ?? {};
  const detailRows = Array.isArray(response?.data) ? response.data : [];
  const pairRows   = response?.data?.by_branch_pair ?? [];
  const tellerRows = response?.data?.by_teller      ?? [];

  const handleFilterChange = (filterData) => {
    setFilters(filterData);
    refetch();
  };

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="/dashboard">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink to="/account-reports">Account Reports</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Cross-Branch Transactions</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="space-y-4 pt-2">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h5 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <ArrowLeftRight className="w-6 h-6 text-orange-500" />
              Cross-Branch Transactions
            </h5>
            <p className="text-sm text-muted-foreground mt-1">
              Deposits &amp; withdrawals processed at a branch different from the client&apos;s home branch
            </p>
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border p-1 bg-muted/40">
              <Button
                size="sm"
                variant={view === "detail" ? "default" : "ghost"}
                className="h-7 gap-1 text-xs"
                onClick={() => setView("detail")}
              >
                <LayoutList className="w-3 h-3" /> Detail
              </Button>
              <Button
                size="sm"
                variant={view === "summary" ? "default" : "ghost"}
                className="h-7 gap-1 text-xs"
                onClick={() => setView("summary")}
              >
                <BarChart3 className="w-3 h-3" /> Summary
              </Button>
            </div>

            {/* Type toggle */}
            <div className="flex items-center gap-1 rounded-lg border p-1 bg-muted/40">
              {[
                { key: "both",       label: "All" },
                { key: "deposit",    label: "Deposits" },
                { key: "withdrawal", label: "Withdrawals" },
              ].map(({ key, label }) => (
                <Button
                  key={key}
                  size="sm"
                  variant={txnType === key ? "default" : "ghost"}
                  className="h-7 text-xs"
                  onClick={() => setTxnType(key)}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <LoanGeneralReportQuery
          onFilterChange={handleFilterChange}
          isRefetching={isRefetching}
          data={view === "detail" ? detailRows : pairRows}
          tableRef={tableRef}
          filters={filters}
          colSpan={3}
          mode={{ format: "A4-L", orientation: "L" }}
          totals={{ totalDebit: meta.total_deposited, totalCredit: meta.total_withdrawn }}
          title="Cross-Branch Transactions Report"
        />

        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPI
            label="Cross-Branch Deposits"
            value={`UGX ${fmt(meta.total_deposited)}`}
            sub={`${meta.deposit_count ?? 0} transactions`}
            accent="bg-emerald-500"
          />
          <KPI
            label="Cross-Branch Withdrawals"
            value={`UGX ${fmt(meta.total_withdrawn)}`}
            sub={`${meta.withdrawal_count ?? 0} transactions`}
            accent="bg-amber-500"
          />
          <KPI
            label="Total Volume"
            value={`UGX ${fmt((meta.total_deposited ?? 0) + (meta.total_withdrawn ?? 0))}`}
            sub={`${meta.count ?? 0} total transactions`}
            accent="bg-blue-500"
          />
          <KPI
            label="Charges on Withdrawals"
            value={`UGX ${fmt(meta.total_charges)}`}
            sub="Cross-branch processing fees"
            accent="bg-rose-500"
          />
        </div>

        {/* Tables */}
        {view === "detail" ? (
          <div className="overflow-x-auto">
            <DatatableReport
              ref={tableRef}
              columns={detailColumns}
              data={detailRows}
              fetchData={refetch}
              isLoading={isLoading}
              isRefetching={isRefetching}
              isError={isError}
              colSpan={detailColumns.length}
            />
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h6 className="text-sm font-semibold mb-2">By Branch Pair</h6>
              <p className="text-xs text-muted-foreground mb-3">
                Each row shows volume of cross-branch activity between a client&apos;s home branch and the branch that processed the transaction.
              </p>
              <div className="overflow-x-auto">
                <DatatableReport
                  columns={pairColumns}
                  data={pairRows}
                  fetchData={refetch}
                  isLoading={isLoading}
                  isRefetching={isRefetching}
                  isError={isError}
                  colSpan={pairColumns.length}
                />
              </div>
            </div>

            <div>
              <h6 className="text-sm font-semibold mb-2">By Teller</h6>
              <p className="text-xs text-muted-foreground mb-3">
                Shows which staff members processed transactions for clients outside their home branch.
              </p>
              <div className="overflow-x-auto">
                <DatatableReport
                  columns={tellerColumns}
                  data={tellerRows}
                  fetchData={refetch}
                  isLoading={isLoading}
                  isRefetching={isRefetching}
                  isError={isError}
                  colSpan={tellerColumns.length}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CrossBranchTransactionsReport;

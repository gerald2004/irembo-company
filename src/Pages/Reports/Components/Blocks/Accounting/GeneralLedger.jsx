import { useRef, useState } from "react";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AccountCombobox } from "@/Pages/Components/AccountCombobox";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import DatatableReport from "@/Pages/Components/DatatableReport";
import ReportFilterBar from "../Queries/ReportFilterBar";
import { formatDateTimestamp } from "@/lib/utils";
import { Link } from "react-router-dom";
import { TrendingUp, TrendingDown, Minus, BookOpen, ArrowUpRight, ArrowDownRight, Hash } from "lucide-react";

const nf = new Intl.NumberFormat("en-UG", { maximumFractionDigits: 2 });
const fmt = (v) => nf.format(Number(v ?? 0));

const KpiCard = ({ label, value, icon: Icon, trend }) => {
  const isPositive = trend === "up";
  const isNegative = trend === "down";
  return (
    <div className="rounded-lg border bg-card p-4 space-y-1 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        {Icon && (
          <div className={`rounded-md p-1.5 ${isPositive ? "bg-emerald-50 text-emerald-600" : isNegative ? "bg-red-50 text-red-600" : "bg-muted text-muted-foreground"}`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
        )}
      </div>
      <p className={`text-lg font-bold tabular-nums tracking-tight ${isPositive ? "text-emerald-700" : isNegative ? "text-red-600" : ""}`}>
        {value}
      </p>
    </div>
  );
};

const accountTypeBadgeClass = (type) => {
  switch ((type || "").toLowerCase()) {
    case "assets":      return "bg-blue-100 text-blue-800 border-blue-300";
    case "liabilities": return "bg-orange-100 text-orange-800 border-orange-300";
    case "equity":      return "bg-purple-100 text-purple-800 border-purple-300";
    case "income":      return "bg-emerald-100 text-emerald-800 border-emerald-300";
    case "expenses":    return "bg-red-100 text-red-700 border-red-300";
    default:            return "bg-slate-100 text-slate-600 border-slate-300";
  }
};

const GeneralLedger = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const tableRef = useRef(null);

  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [filters, setFilters] = useState({
    startDate: "", endDate: "", branch_id: "", status: "completed",
  });

  const { data = {}, isLoading, refetch, isRefetching, isError } = useQuery({
    queryKey: ["general-ledger-statement", selectedAccountId, filters],
    queryFn: async ({ signal }) => {
      if (!selectedAccountId) return {};
      const res = await axiosPrivate.get(
        `/reports/accounting/general-ledger/${selectedAccountId}`,
        {
          params: {
            startDate: filters.startDate,
            endDate:   filters.endDate,
            branch_id: filters.branch_id,
            status:    filters.status,
          },
          signal,
        }
      );
      return res?.data?.data ?? {};
    },
    placeholderData: (prev) => prev,
    enabled: !!selectedAccountId,
  });

  const { data: accountsData, isLoading: isLoadingAccounts, isError: isErrorAccounts,
    refetch: refetchAccounts, isRefetching: isRefetchingAccounts } = useQuery({
    queryKey: ["account-votes"],
    queryFn: async () => {
      const res = await axiosPrivate.get("/settings/accounts/account");
      return res.data.data.accounts;
    },
  });

  const account  = data?.account  ?? null;
  const summary  = data?.summary  ?? null;
  const entries  = Array.isArray(data?.entries) ? data.entries : [];

  const columns = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => <p className="text-xs whitespace-nowrap">{formatDateTimestamp(row.original.date)}</p>,
    },
    {
      accessorKey: "code",
      header: "JE Ref",
      cell: ({ row }) => (
        <Link to={`/journal-entries/${row.original.code}`}>
          <Badge variant="secondary" className="text-xs font-mono cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
            #{row.original.code}
          </Badge>
        </Link>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => <p className="text-xs max-w-[280px] truncate" title={row.original.description}>{row.original.description || "—"}</p>,
    },
    {
      accessorKey: "debit",
      header: "Debit",
      cell: ({ row }) => (
        <p className={`text-xs tabular-nums text-right ${row.original.debit ? "text-rose-700 font-medium" : "text-muted-foreground"}`}>
          {row.original.debit ? fmt(row.original.debit) : "—"}
        </p>
      ),
    },
    {
      accessorKey: "credit",
      header: "Credit",
      cell: ({ row }) => (
        <p className={`text-xs tabular-nums text-right ${row.original.credit ? "text-emerald-700 font-medium" : "text-muted-foreground"}`}>
          {row.original.credit ? fmt(row.original.credit) : "—"}
        </p>
      ),
    },
    {
      accessorKey: "balance",
      header: "Running Balance",
      cell: ({ row }) => (
        <p className="text-xs tabular-nums text-right font-semibold">
          {fmt(row.original.balance)}
        </p>
      ),
    },
  ];

  const exportHeaders = ["Date", "Ref", "Description", "Debit", "Credit", "Running Balance"];
  const exportRows = entries.map((r) => [
    r.date, `#${r.code}`, r.description,
    parseFloat(r.debit  || 0).toFixed(2),
    parseFloat(r.credit || 0).toFixed(2),
    parseFloat(r.balance || 0).toFixed(2),
  ]);

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink to="/dashboard">Home</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink to="/accounting-reports">Accounting Reports</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>General Ledger</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-1 space-y-4 pt-2">
        <h5 className="text-2xl font-bold tracking-tight">General Ledger</h5>

        <ReportFilterBar
          onApply={setFilters}
          isLoading={isRefetching}
          showStatus
          extra={
            <div className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground">Account</Label>
              <AccountCombobox
                selectedAccount={selectedAccountId}
                onAccountSelect={(v) => setSelectedAccountId(parseInt(v))}
                accountsData={accountsData}
                isLoading={isLoadingAccounts}
                isError={isErrorAccounts}
                refetch={refetchAccounts}
                isRefetching={isRefetchingAccounts}
              />
            </div>
          }
          exportTitle={`General Ledger — ${account?.title ?? ""}`}
          exportFilename="general-ledger"
          exportHeaders={exportHeaders}
          exportRows={exportRows}
          exportDisabled={!entries.length}
        />

        {!selectedAccountId && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">Select an account above to view its ledger.</p>
          </div>
        )}

        {selectedAccountId && !isLoading && account && (
          <>
            {/* ── Account header ────────────────────────────────────────────── */}
            <div className="rounded-lg border bg-muted/30 px-4 py-3 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold leading-tight truncate">{account.title}</p>
                {account.sub_group && (
                  <p className="text-xs text-muted-foreground">{account.sub_group}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge variant="outline" className="font-mono text-xs">{account.code}</Badge>
                <Badge variant="outline" className={`capitalize text-xs ${accountTypeBadgeClass(account.type)}`}>
                  {account.type}
                </Badge>
              </div>
            </div>

            {/* ── KPI cards ─────────────────────────────────────────────────── */}
            {summary && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <KpiCard
                  label="Opening Balance"
                  value={fmt(summary.opening_balance)}
                  icon={Minus}
                />
                <KpiCard
                  label="Total Debits"
                  value={fmt(summary.total_debit)}
                  icon={ArrowDownRight}
                  trend="down"
                />
                <KpiCard
                  label="Total Credits"
                  value={fmt(summary.total_credit)}
                  icon={ArrowUpRight}
                  trend="up"
                />
                <KpiCard
                  label="Net Movement"
                  value={fmt(summary.net_movement)}
                  icon={summary.net_movement >= 0 ? TrendingUp : TrendingDown}
                  trend={summary.net_movement >= 0 ? "up" : "down"}
                />
                <KpiCard
                  label="Closing Balance"
                  value={fmt(summary.closing_balance)}
                  icon={summary.closing_balance >= 0 ? TrendingUp : TrendingDown}
                  trend={summary.closing_balance >= 0 ? "up" : "down"}
                />
                <KpiCard
                  label="Entries"
                  value={summary.entry_count}
                  icon={Hash}
                />
              </div>
            )}

            {/* ── Table ─────────────────────────────────────────────────────── */}
            <DatatableReport
              ref={tableRef}
              columns={columns}
              data={entries}
              fetchData={refetch}
              isLoading={isLoading}
              isRefetching={isRefetching}
              isError={isError}
              colSpan={3}
              totalDebit={summary?.total_debit}
              totalCredit={summary?.total_credit}
            />
          </>
        )}

        {selectedAccountId && isLoading && (
          <div className="space-y-2 py-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-8 bg-muted animate-pulse rounded" />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default GeneralLedger;

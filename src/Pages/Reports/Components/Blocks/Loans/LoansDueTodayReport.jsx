import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import useBranchFilter from "@/MiddleWares/Hooks/useBranchFilter";
import useAuth from "@/MiddleWares/Hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import DatatableReport from "@/Pages/Components/DatatableReport";
import { formatDateTimestamp, prepareDataForExport } from "@/lib/utils";
import ReportKpi from "@/Pages/Reports/Components/ReportKpi";
import { useBranches } from "@/Queries/Settings/branches";
import { useUsers } from "@/Queries/Settings/users";
import { useState, useRef, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import fileDownload from "js-file-download";
import {
  Clock, CreditCard, Banknote, ShieldAlert, AlertCircle, TrendingDown,
  FileText, FileSpreadsheet, RefreshCw, RotateCcw, SlidersHorizontal,
} from "lucide-react";

const fmt = (n) => new Intl.NumberFormat("en-UG", { maximumFractionDigits: 0 }).format(n ?? 0);
const toParam = (v) => (v === "all" ? "" : (v ?? ""));

const Sel = ({ label, value, onValue, placeholder, children, width = "w-36" }) => (
  <div className="space-y-1.5 min-w-0">
    <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
    <Select value={value} onValueChange={onValue}>
      <SelectTrigger className={`h-8 ${width} text-xs`}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>{children}</SelectContent>
    </Select>
  </div>
);

const GuarantorCell = ({ guarantors }) => {
  if (!guarantors?.length) return <span className="text-xs text-muted-foreground">None</span>;
  return (
    <div className="flex flex-col gap-1.5 min-w-[160px]">
      {guarantors.map((g, i) => (
        <div key={i} className="text-xs">
          <p className="font-medium capitalize">{g.name}</p>
          {g.contact && <p className="text-muted-foreground">{g.contact}</p>}
          {g.account && <p className="text-muted-foreground font-mono text-[10px]">{g.account}</p>}
          <div className="flex gap-1 mt-0.5 flex-wrap">
            {g.type  && <Badge variant="outline"    className="text-[10px] px-1 py-0 h-4 capitalize">{g.type}</Badge>}
            {g.amount > 0 && <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">{fmt(g.amount)}</Badge>}
          </div>
        </div>
      ))}
    </div>
  );
};

const LoansDueTodayReport = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate     = useNavigate();
  const tableRef     = useRef(null);
  const { auth }     = useAuth();

  const { branchKey }   = useBranchFilter();
  const { data: branches = [] } = useBranches();
  const { data: users    = [] } = useUsers();

  const isSacco  = auth?.user?.data_privilege === "sacco";
  const isBranch = auth?.user?.data_privilege === "branch";

  const [selectedBranch,  setSelectedBranch]  = useState(branchKey != null ? String(branchKey) : "all");
  const [selectedUser,    setSelectedUser]    = useState("all");
  const [selectedProduct, setSelectedProduct] = useState("all");

  const { data: loanProducts = [] } = useQuery({
    queryKey: ["loan-products"],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get("/settings/loans/products");
        return res?.data?.data?.loan_products ?? [];
      } catch { return []; }
    },
    staleTime: 5 * 60 * 1000,
  });

  const filteredUsers = isSacco
    ? users.filter((u) => selectedBranch === "all" || String(u.branch_id) === String(selectedBranch))
    : users.filter((u) => String(u.branch_id) === String(auth?.user?.branch_id));

  const [filters, setFilters] = useState({
    branch_id:  toParam(branchKey != null ? String(branchKey) : "all"),
    user_id:    "",
    product_id: "",
  });

  const buildParams = () => ({
    branch_id:  toParam(selectedBranch),
    user_id:    toParam(selectedUser),
    product_id: toParam(selectedProduct),
  });

  const { data: raw = {}, isLoading, refetch, isRefetching, isError } = useQuery({
    queryKey: ["loans-due-today", filters],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get("reports/loans/loans-due-today", { params: filters });
        return res?.data?.data ?? {};
      } catch (err) {
        if (err?.response?.status === 401)
          navigate("/", { state: { from: location }, replace: true });
        throw err;
      }
    },
    placeholderData: (prev) => prev,
  });

  const rows    = raw?.rows    ?? [];
  const summary = raw?.summary ?? {};

  const totalDue         = useMemo(() => rows.reduce((s, r) => s + (r.total_due_today    ?? 0), 0), [rows]);
  const totalPrincipal   = useMemo(() => rows.reduce((s, r) => s + (r.principal_due      ?? 0), 0), [rows]);
  const totalInterest    = useMemo(() => rows.reduce((s, r) => s + (r.interest_due       ?? 0), 0), [rows]);
  const totalPenalties   = useMemo(() => rows.reduce((s, r) => s + (r.penalty_due        ?? 0), 0), [rows]);
  const totalOutstanding = useMemo(() => rows.reduce((s, r) => s + (r.loan_outstanding   ?? 0), 0), [rows]);

  const doReset = () => {
    setSelectedBranch("all"); setSelectedUser("all"); setSelectedProduct("all");
    const p = { branch_id: "", user_id: "", product_id: "" };
    setFilters(p);
  };

  const [isDownloading, setIsDownloading] = useState(false);
  const onDownload = async (type) => {
    if (!tableRef?.current) return;
    const exportData = prepareDataForExport(tableRef.current, rows);
    const payload = {
      data: exportData,
      totals: { totalAmountDue: totalDue },
      colspan: 3,
      mode: { format: "A4-L", orientation: "L" },
      dates: { start_date: summary.as_of_date, end_date: summary.as_of_date },
      title: "Loans Due Today Report",
    };
    try {
      setIsDownloading(true);
      const res = await axiosPrivate.post(
        type === "pdf" ? "/export/general/pdf" : "/export/general/excel",
        { data: payload },
        { responseType: "blob" }
      );
      fileDownload(res.data, `loans_due_today_${summary.as_of_date}.${type === "pdf" ? "pdf" : "xlsx"}`);
      toast({ title: "Download successful", variant: "success" });
    } catch {
      toast({ title: "Download failed", variant: "destructive" });
    } finally {
      setIsDownloading(false);
    }
  };

  const columns = [
    {
      accessorKey: "code",
      header: "Loan No.",
      cell: ({ row }) => (
        <Link to={`/loans/${row.original.loan_id}`} className="text-xs text-primary hover:underline font-mono whitespace-nowrap">
          {row.original.code}
        </Link>
      ),
    },
    {
      accessorKey: "client",
      header: "Client",
      cell: ({ row }) => (
        <Link
          to={`/clients/${row.original.client_type === "individual" ? "individual" : "group"}/${row.original.account_id}`}
          className="text-xs text-primary hover:underline capitalize"
        >
          <p className="font-medium">{row.original.client}</p>
          <p className="text-muted-foreground font-mono">{row.original.account}</p>
        </Link>
      ),
    },
    {
      accessorKey: "contact",
      header: "Contact",
      cell: ({ row }) => <p className="text-xs">{row.original.contact || "—"}</p>,
    },
    {
      accessorKey: "product",
      header: "Product",
      cell: ({ row }) => (
        <div className="text-xs">
          <p>{row.original.product || "—"}</p>
          {row.original.tenure && <p className="text-muted-foreground">{row.original.tenure}</p>}
        </div>
      ),
    },
    {
      accessorKey: "amount_disbursed",
      header: "Disbursed",
      cell: ({ row }) => <p className="text-xs text-right tabular-nums">{fmt(row.original.amount_disbursed)}</p>,
    },
    {
      accessorKey: "principal_due",
      header: "Principal",
      cell: ({ row }) => <p className="text-xs text-right tabular-nums font-medium">{fmt(row.original.principal_due)}</p>,
    },
    {
      accessorKey: "interest_due",
      header: "Interest",
      cell: ({ row }) => (
        <p className="text-xs text-right tabular-nums text-amber-700 dark:text-amber-400">
          {fmt(row.original.interest_due)}
        </p>
      ),
    },
    {
      accessorKey: "penalty_due",
      header: "Penalties",
      cell: ({ row }) => (
        <p className={`text-xs text-right tabular-nums ${row.original.penalty_due > 0 ? "text-rose-600 dark:text-rose-400 font-medium" : "text-muted-foreground"}`}>
          {fmt(row.original.penalty_due)}
        </p>
      ),
    },
    {
      accessorKey: "total_due_today",
      header: "Total Due Today",
      cell: ({ row }) => (
        <p className="text-xs text-right tabular-nums font-bold text-rose-700 dark:text-rose-400">
          {fmt(row.original.total_due_today)}
        </p>
      ),
    },
    {
      accessorKey: "loan_outstanding",
      header: "Loan Balance",
      cell: ({ row }) => <p className="text-xs text-right tabular-nums text-muted-foreground">{fmt(row.original.loan_outstanding)}</p>,
    },
    {
      accessorKey: "disbursement_date",
      header: "Disbursed On",
      cell: ({ row }) => <p className="text-xs whitespace-nowrap">{formatDateTimestamp(row.original.disbursement_date)}</p>,
    },
    {
      accessorKey: "branch",
      header: "Branch",
      cell: ({ row }) => <p className="text-xs">{row.original.branch || "—"}</p>,
    },
    {
      accessorKey: "officer",
      header: "Officer",
      cell: ({ row }) => <p className="text-xs capitalize">{row.original.officer || "—"}</p>,
    },
    {
      accessorKey: "guarantors",
      header: "Guarantors",
      cell: ({ row }) => <GuarantorCell guarantors={row.original.guarantors} />,
    },
  ];

  const footerCells = [
    { empty: true },             // code
    { empty: true },             // client
    { empty: true },             // contact
    { empty: true },             // product
    { empty: true },             // disbursed
    { value: totalPrincipal },   // principal
    { value: totalInterest },    // interest
    { value: totalPenalties },   // penalties
    { value: totalDue },         // total due today
    { value: totalOutstanding }, // loan balance
    { empty: true },             // disbursed on
    { empty: true },             // branch
    { empty: true },             // officer
    { empty: true },             // guarantors
  ];

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink to="/dashboard">Home</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink to="/loans-reports">Loans Reports</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Loans Due Today</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">

          <div>
            <h5 className="text-2xl font-bold tracking-tight">Loans Due Today</h5>
            {summary.as_of_date && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Installments due on <span className="font-medium">{summary.as_of_date}</span>
                {" — "}{summary.loan_count ?? 0} loans &middot; {summary.unique_clients ?? 0} clients
              </p>
            )}
          </div>

          {/* ── Filter bar (no date range) ─────────────────────────────── */}
          <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-muted/40 border-b">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">Filters</span>
              </div>
              <Button size="sm" variant="ghost" className="h-6 text-xs px-2 text-muted-foreground" type="button"
                onClick={doReset} disabled={isRefetching}>
                <RotateCcw className="w-3 h-3 mr-1" /> Reset
              </Button>
            </div>
            <div className="flex flex-wrap items-end gap-3 p-4">

              {isSacco && (
                <Sel label="Branch" value={selectedBranch} placeholder="All Branches" width="w-36"
                  onValue={(v) => { setSelectedBranch(v); setSelectedUser("all"); }}>
                  <SelectItem value="all">All Branches</SelectItem>
                  {branches.map((b) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                </Sel>
              )}

              {(isSacco || isBranch) && (
                <Sel label="Officer" value={selectedUser} placeholder="All Officers" width="w-40"
                  onValue={setSelectedUser}>
                  <SelectItem value="all">All Officers</SelectItem>
                  {filteredUsers.map((u) => (
                    <SelectItem key={u.user_id} value={String(u.user_id)}>
                      {u.user_firstname} {u.user_lastname}
                    </SelectItem>
                  ))}
                </Sel>
              )}

              <Sel label="Loan Product" value={selectedProduct} placeholder="All Products" width="w-40"
                onValue={setSelectedProduct}>
                <SelectItem value="all">All Products</SelectItem>
                {loanProducts.map((p) => (
                  <SelectItem key={p.loan_product_id ?? p.id} value={String(p.loan_product_id ?? p.id)}>
                    {p.loan_product_title ?? p.title}
                  </SelectItem>
                ))}
              </Sel>

              <div className="ml-auto flex items-end gap-2 flex-wrap">
                <Button size="sm" className="h-8" type="button" disabled={isRefetching}
                  onClick={() => { setFilters(buildParams()); refetch(); }}>
                  {isRefetching && <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                  {isRefetching ? "Loading…" : "Apply"}
                </Button>
                <Separator orientation="vertical" className="h-8" />
                <Button size="sm" variant="outline" className="h-8" type="button"
                  onClick={() => onDownload("pdf")} disabled={isDownloading || !rows.length}>
                  <FileText className="w-3.5 h-3.5 mr-1.5" /> PDF
                </Button>
                <Button size="sm" variant="outline" className="h-8" type="button"
                  onClick={() => onDownload("xlsx")} disabled={isDownloading || !rows.length}>
                  <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" /> Excel
                </Button>
              </div>
            </div>
          </div>

          {/* ── KPI cards ────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <ReportKpi
              label="Total Due Today"
              value={`UGX ${fmt(summary.total_due_today ?? totalDue)}`}
              hint={`${summary.loan_count ?? rows.length} installments`}
              accent="bg-rose-600"
              icon={<Clock size={16} />}
            />
            <ReportKpi
              label="Loan Balance"
              value={`UGX ${fmt(summary.total_outstanding ?? totalOutstanding)}`}
              hint="Total outstanding"
              accent="bg-slate-600"
              icon={<CreditCard size={16} />}
            />
            <ReportKpi
              label="Principal Due"
              value={`UGX ${fmt(summary.total_principal ?? totalPrincipal)}`}
              hint="Principal component"
              accent="bg-blue-600"
              icon={<Banknote size={16} />}
            />
            <ReportKpi
              label="Interest Due"
              value={`UGX ${fmt(summary.total_interest ?? totalInterest)}`}
              hint="Interest component"
              accent="bg-amber-500"
              icon={<TrendingDown size={16} />}
            />
            <ReportKpi
              label="Penalties Due"
              value={`UGX ${fmt(summary.total_penalties ?? totalPenalties)}`}
              hint="Penalty charges"
              accent={totalPenalties > 0 ? "bg-rose-500" : "bg-emerald-500"}
              icon={<AlertCircle size={16} />}
            />
            <ReportKpi
              label="With Guarantors"
              value={String(summary.loans_with_guarantors ?? rows.filter(r => r.guarantors?.length > 0).length)}
              hint={`of ${summary.loan_count ?? rows.length} loans`}
              accent="bg-violet-600"
              icon={<ShieldAlert size={16} />}
            />
          </div>

          {/* ── Main table ───────────────────────────────────────────────── */}
          <div className="max-w-[1600px]">
            <DatatableReport
              ref={tableRef}
              columns={columns}
              data={rows}
              fetchData={refetch}
              isLoading={isLoading}
              isRefetching={isRefetching}
              isError={isError}
              footerCells={footerCells}
            />
          </div>

          {/* ── Guarantor contact panel ───────────────────────────────────── */}
          {!isLoading && !isError && rows.some(r => r.guarantors?.length > 0) && (
            <div className="space-y-2 pt-2">
              <h6 className="text-sm font-semibold flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-violet-600" />
                Guarantor Contact Sheet — Today&apos;s Due Loans
              </h6>
              <div className="rounded-lg border overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Loan No.</th>
                      <th className="px-3 py-2 text-left font-medium">Borrower</th>
                      <th className="px-3 py-2 text-left font-medium">Borrower Contact</th>
                      <th className="px-3 py-2 text-left font-medium">Guarantor</th>
                      <th className="px-3 py-2 text-left font-medium">Guarantor Contact</th>
                      <th className="px-3 py-2 text-left font-medium">Guarantor Account</th>
                      <th className="px-3 py-2 text-right font-medium">Guaranteed</th>
                      <th className="px-3 py-2 text-right font-medium">Due Today</th>
                      <th className="px-3 py-2 text-center font-medium">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows
                      .filter(r => r.guarantors?.length > 0)
                      .flatMap(r =>
                        r.guarantors.map((g, gi) => (
                          <tr key={`${r.loan_id}-${gi}`} className="border-t hover:bg-muted/20">
                            <td className="px-3 py-2 font-mono">
                              {gi === 0
                                ? <Link to={`/loans/${r.loan_id}`} className="text-primary hover:underline">{r.code}</Link>
                                : <span className="text-muted-foreground pl-2">↳</span>}
                            </td>
                            <td className="px-3 py-2 capitalize">{gi === 0 ? r.client : ""}</td>
                            <td className="px-3 py-2">{gi === 0 ? (r.contact || "—") : ""}</td>
                            <td className="px-3 py-2 font-medium capitalize">{g.name}</td>
                            <td className="px-3 py-2">{g.contact || "—"}</td>
                            <td className="px-3 py-2 font-mono">{g.account || "—"}</td>
                            <td className="px-3 py-2 text-right tabular-nums">{fmt(g.amount)}</td>
                            <td className="px-3 py-2 text-right tabular-nums font-semibold text-rose-600">
                              {gi === 0 ? fmt(r.total_due_today) : ""}
                            </td>
                            <td className="px-3 py-2 text-center">
                              {g.type && <Badge variant="outline" className="text-[10px] px-1.5 capitalize">{g.type}</Badge>}
                            </td>
                          </tr>
                        ))
                      )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!isLoading && !isError && rows.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
              <Clock className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm font-medium text-muted-foreground">No installments due today</p>
              <p className="text-xs text-muted-foreground">All loans are on schedule for this date.</p>
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default LoansDueTodayReport;

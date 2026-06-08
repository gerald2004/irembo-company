import { useState, useMemo, useRef } from "react";
import { format } from "date-fns";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { DatePicker } from "@/components/ui/date-picker";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import useBranchFilter from "@/MiddleWares/Hooks/useBranchFilter";
import { useBranches } from "@/Queries/Settings/branches";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import DatatableReport from "@/Pages/Components/DatatableReport";
import { formatDateTimestamp } from "@/lib/utils";
import {
  FileText, BookOpen, ArrowRightLeft, Users,
  BookmarkPlus, Bookmark, Trash2, Play, ChevronDown, CheckSquare,
  Square, SlidersHorizontal, BarChart3, Tag, Sun, Moon, Type,
} from "lucide-react";

const nf = new Intl.NumberFormat("en-UG", { maximumFractionDigits: 2 });
const fmt = (v) => nf.format(Number(v ?? 0));

// ── Field definitions ─────────────────────────────────────────────────────────
const FIELD_META = {
  // Journal Entry
  transaction_code: { label: "Transaction Code",  cell: (v) => <code className="text-xs font-mono">{v ?? "—"}</code> },
  description:      { label: "Description",        cell: (v) => <p className="text-xs max-w-[220px] truncate">{v ?? "—"}</p> },
  transaction_date: { label: "Transaction Date",   cell: (v) => <p className="text-xs whitespace-nowrap">{v ? formatDateTimestamp(v) : "—"}</p> },
  value_date:       { label: "Value Date",         cell: (v) => <p className="text-xs whitespace-nowrap">{v ? formatDateTimestamp(v) : "—"}</p> },
  status:           { label: "Entry Status",       cell: (v) => {
    const colors = { completed: "bg-green-100 text-green-800", approved: "bg-blue-100 text-blue-800", reversed: "bg-red-100 text-red-800", pending: "bg-yellow-100 text-yellow-800", draft: "bg-gray-100 text-gray-700", rejected: "bg-red-200 text-red-900" };
    return <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${colors[v] ?? "bg-muted text-muted-foreground"}`}>{v ?? "—"}</span>;
  }},
  source_module:    { label: "Source Module",      cell: (v) => <Badge variant="secondary" className="text-xs capitalize">{v ?? "—"}</Badge> },
  total_amount:     { label: "Entry Amount",       cell: (v) => <p className="text-xs tabular-nums text-right font-medium">{fmt(v)}</p>, align: "right" },
  is_reversal:      { label: "Is Reversal",        cell: (v) => Number(v) === 1 ? <Badge variant="destructive" className="text-xs">Reversal</Badge> : <p className="text-xs text-muted-foreground">—</p> },
  // Account
  account_title:    { label: "Account Name",       cell: (v) => <p className="text-xs font-medium">{v ?? "—"}</p> },
  account_code:     { label: "Account Code",       cell: (v) => <code className="text-xs font-mono">{v ?? "—"}</code> },
  account_type:     { label: "Account Type",       cell: (v) => {
    const colors = { asset: "bg-blue-100 text-blue-800", liability: "bg-orange-100 text-orange-800", equity: "bg-violet-100 text-violet-800", income: "bg-green-100 text-green-800", expense: "bg-red-100 text-red-800" };
    return <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${colors[v] ?? "bg-muted text-muted-foreground"}`}>{v ?? "—"}</span>;
  }},
  account_sub_group:{ label: "Sub-Group",          cell: (v) => <p className="text-xs">{v ?? "—"}</p> },
  account_group:    { label: "Account Group",      cell: (v) => <p className="text-xs font-medium">{v ?? "—"}</p> },
  // Line Detail
  debit_amount:     { label: "Debit",              cell: (v) => <p className={`text-xs tabular-nums text-right ${Number(v) > 0 ? "text-red-600 font-medium" : "text-muted-foreground"}`}>{fmt(v)}</p>, align: "right" },
  credit_amount:    { label: "Credit",             cell: (v) => <p className={`text-xs tabular-nums text-right ${Number(v) > 0 ? "text-green-700 font-medium" : "text-muted-foreground"}`}>{fmt(v)}</p>, align: "right" },
  net_amount:       { label: "Net (Cr − Dr)",      cell: (v) => <p className={`text-xs tabular-nums text-right font-semibold ${Number(v) >= 0 ? "text-green-700" : "text-red-600"}`}>{fmt(v)}</p>, align: "right" },
  memo:             { label: "Line Memo",          cell: (v) => <p className="text-xs truncate max-w-[180px]">{v ?? "—"}</p> },
  // Branch & Staff
  branch:           { label: "Branch",             cell: (v) => <p className="text-xs">{v ?? "—"}</p> },
  created_by:       { label: "Created By",         cell: (v) => <p className="text-xs">{v || "—"}</p> },
};

const FIELD_GROUPS = [
  {
    title: "Journal Entry",
    icon: FileText,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    fields: ["transaction_code", "description", "transaction_date", "value_date", "status", "source_module", "total_amount", "is_reversal"],
  },
  {
    title: "Account Info",
    icon: BookOpen,
    color: "text-violet-600",
    bg: "bg-violet-50 dark:bg-violet-900/20",
    fields: ["account_title", "account_code", "account_type", "account_sub_group", "account_group"],
  },
  {
    title: "Line Amounts",
    icon: ArrowRightLeft,
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    fields: ["debit_amount", "credit_amount", "net_amount", "memo"],
  },
  {
    title: "Branch & Staff",
    icon: Users,
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    fields: ["branch", "created_by"],
  },
];

const DEFAULT_FIELDS = ["transaction_code", "description", "transaction_date", "account_title", "account_type", "debit_amount", "credit_amount", "branch"];

const DEFAULT_FILTERS = {
  startDate: "", endDate: "", branch_id: "", status: "", account_type: "", source_module: "",
};

const statusOptions = [
  { value: "completed", label: "Completed" },
  { value: "approved",  label: "Approved" },
  { value: "reversed",  label: "Reversed" },
  { value: "pending",   label: "Pending" },
  { value: "draft",     label: "Draft" },
  { value: "rejected",  label: "Rejected" },
];

const accountTypeOptions = [
  { value: "asset",     label: "Asset" },
  { value: "liability", label: "Liability" },
  { value: "equity",    label: "Equity" },
  { value: "income",    label: "Income" },
  { value: "expense",   label: "Expense" },
];

const sourceModuleOptions = [
  { value: "loan",     label: "Loans" },
  { value: "savings",  label: "Savings / Deposits" },
  { value: "withdraw", label: "Withdrawals" },
  { value: "general",  label: "General / Manual" },
  { value: "expense",  label: "Expenses" },
  { value: "income",   label: "External Income" },
  { value: "transfer", label: "Transfers" },
  { value: "payroll",  label: "Payroll" },
];

// ── Component ─────────────────────────────────────────────────────────────────
const AccountingCustomReportBuilder = () => {
  const axiosPrivate  = useAxiosPrivate();
  const navigate      = useNavigate();
  const queryClient   = useQueryClient();
  const tableRef      = useRef(null);
  const { branchKey } = useBranchFilter();
  const { branches, isLoading: branchesLoading } = useBranches();

  const [selectedFields, setSelectedFields] = useState(DEFAULT_FIELDS);
  const [filters, setFilters]               = useState({ ...DEFAULT_FILTERS, branch_id: String(branchKey ?? "") });
  const [activeParams, setActiveParams]     = useState(null);
  const [templateName, setTemplateName]     = useState("");
  const [isShared, setIsShared]             = useState(false);
  const [showSaveForm, setShowSaveForm]     = useState(false);
  const [deleteId, setDeleteId]             = useState(null);
  const [displayFont, setDisplayFont]       = useState("normal");
  const [displayDark, setDisplayDark]       = useState(false);

  // ── Saved templates ───────────────────────────────────────────────────────
  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ["custom-report-templates-accounting"],
    queryFn: async () => {
      const res = await axiosPrivate.get("/reports/templates", { params: { entity: "accounting" } });
      return res?.data?.data ?? [];
    },
  });

  // ── Generate report ───────────────────────────────────────────────────────
  const { data: reportData = {}, isLoading, isRefetching, isError } = useQuery({
    queryKey: ["custom-accounting-report", activeParams],
    queryFn: async ({ signal }) => {
      try {
        const res = await axiosPrivate.get("/reports/accounting/custom", {
          params: {
            ...activeParams,
            "fields[]": activeParams?.fields,
            fields: undefined,
          },
          signal,
        });
        return res?.data?.data ?? {};
      } catch (err) {
        if (err?.response?.status === 401) navigate("/", { replace: true });
        throw err;
      }
    },
    enabled: !!activeParams,
    placeholderData: (prev) => prev,
  });

  // ── Save template ─────────────────────────────────────────────────────────
  const saveTemplate = useMutation({
    mutationFn: async (payload) => {
      const res = await axiosPrivate.post("/reports/templates", payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["custom-report-templates-accounting"]);
      setShowSaveForm(false);
      setTemplateName("");
      setIsShared(false);
    },
  });

  // ── Delete template ───────────────────────────────────────────────────────
  const deleteTemplate = useMutation({
    mutationFn: async (id) => {
      await axiosPrivate.delete("/reports/templates", { data: { id } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["custom-report-templates-accounting"]);
      setDeleteId(null);
    },
  });

  // ── Field toggle helpers ──────────────────────────────────────────────────
  const toggleField = (key) =>
    setSelectedFields((prev) =>
      prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]
    );

  const toggleGroup = (groupFields) => {
    const allSelected = groupFields.every((f) => selectedFields.includes(f));
    if (allSelected) {
      setSelectedFields((prev) => prev.filter((f) => !groupFields.includes(f)));
    } else {
      setSelectedFields((prev) => [...new Set([...prev, ...groupFields])]);
    }
  };

  const selectAll  = () => setSelectedFields(Object.keys(FIELD_META));
  const selectNone = () => setSelectedFields([]);

  const loadTemplate = (template) => {
    setSelectedFields(template.fields ?? DEFAULT_FIELDS);
    setFilters({ ...DEFAULT_FILTERS, ...(template.filters ?? {}) });
    setActiveParams(null);
  };

  const handleGenerate = () => {
    if (!selectedFields.length) return;
    setActiveParams({ fields: selectedFields, ...filters });
  };

  // ── Table columns ─────────────────────────────────────────────────────────
  const columns = useMemo(
    () =>
      selectedFields
        .filter((f) => FIELD_META[f])
        .map((f) => ({
          accessorKey: f,
          header: FIELD_META[f].label,
          cell: ({ row }) => FIELD_META[f].cell(row.original[f]),
        })),
    [selectedFields]
  );

  const rows = Array.isArray(reportData?.rows) ? reportData.rows : [];

  const exportHeaders = selectedFields.map((f) => FIELD_META[f]?.label ?? f);
  const exportRows    = rows.map((r) =>
    selectedFields.map((f) => {
      const v = r[f];
      return v == null ? "" : typeof v === "number" ? v.toFixed(2) : String(v);
    })
  );

  const showBranchFilter = !branchKey;

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink to="/dashboard">Home</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink to="/accounting-reports">Accounting Reports</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Custom Report Builder</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-1 space-y-5 pt-2">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h5 className="text-2xl font-bold tracking-tight">Accounting Custom Report Builder</h5>
            <p className="text-sm text-muted-foreground">
              Select any combination of journal entry fields, apply filters, and generate your report.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Bookmark className="w-3.5 h-3.5" />
                  Saved Templates
                  {templates.length > 0 && (
                    <Badge variant="secondary" className="text-xs px-1.5 py-0 ml-0.5">{templates.length}</Badge>
                  )}
                  <ChevronDown className="w-3 h-3 ml-0.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72 p-0">
                {templatesLoading ? (
                  <p className="text-xs text-muted-foreground p-3">Loading…</p>
                ) : templates.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-3">No saved templates yet.</p>
                ) : (
                  <div className="divide-y max-h-80 overflow-y-auto">
                    {templates.map((t) => (
                      <div key={t.id} className="flex items-center justify-between px-3 py-2.5 hover:bg-muted/50">
                        <button className="flex-1 text-left" onClick={() => loadTemplate(t)}>
                          <p className="text-xs font-medium leading-tight">{t.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {t.fields.length} fields
                            {t.is_shared && <span className="ml-1.5 text-primary">· shared</span>}
                          </p>
                        </button>
                        {t.is_mine && (
                          <Button variant="ghost" size="icon" className="w-6 h-6 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(t.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </PopoverContent>
            </Popover>

            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setShowSaveForm((v) => !v)}>
              <BookmarkPlus className="w-3.5 h-3.5" />
              Save as Template
            </Button>
          </div>
        </div>

        {/* ── Save template form ───────────────────────────────────────────── */}
        {showSaveForm && (
          <div className="rounded-lg border bg-muted/30 p-4 flex flex-wrap items-end gap-3">
            <div className="space-y-1 flex-1 min-w-[180px]">
              <Label className="text-xs">Template Name</Label>
              <Input
                placeholder="e.g. Monthly expense lines"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="flex items-center gap-2 pb-0.5">
              <Checkbox id="acc-is-shared" checked={isShared} onCheckedChange={setIsShared} />
              <Label htmlFor="acc-is-shared" className="text-xs cursor-pointer">Share with team</Label>
            </div>
            <div className="flex gap-2 pb-0.5">
              <Button
                size="sm"
                disabled={!templateName.trim() || saveTemplate.isPending}
                onClick={() =>
                  saveTemplate.mutate({
                    name: templateName.trim(),
                    entity: "accounting",
                    fields: selectedFields,
                    filters,
                    is_shared: isShared,
                  })
                }
              >
                {saveTemplate.isPending ? "Saving…" : "Save"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowSaveForm(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {/* ── Field selector ───────────────────────────────────────────────── */}
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-semibold">Select Fields</span>
              <Badge variant="secondary" className="text-xs">{selectedFields.length} selected</Badge>
            </div>
            <div className="flex gap-2">
              <button className="text-xs text-primary hover:underline" onClick={selectAll}>All</button>
              <span className="text-xs text-muted-foreground">/</span>
              <button className="text-xs text-muted-foreground hover:underline" onClick={selectNone}>None</button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 divide-x divide-y">
            {FIELD_GROUPS.map((group) => {
              const Icon = group.icon;
              const allChecked  = group.fields.every((f) => selectedFields.includes(f));
              const someChecked = group.fields.some((f) => selectedFields.includes(f));
              return (
                <div key={group.title} className="p-4 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <div className={`rounded p-1 ${group.bg} ${group.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-foreground">{group.title}</span>
                    <button className="ml-auto" onClick={() => toggleGroup(group.fields)} title={allChecked ? "Deselect all" : "Select all"}>
                      {allChecked ? (
                        <CheckSquare className="w-3.5 h-3.5 text-primary" />
                      ) : someChecked ? (
                        <CheckSquare className="w-3.5 h-3.5 text-primary/50" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {group.fields.map((f) => (
                      <div key={f} className="flex items-center gap-2">
                        <Checkbox id={`acc-${f}`} checked={selectedFields.includes(f)} onCheckedChange={() => toggleField(f)} />
                        <Label htmlFor={`acc-${f}`} className="text-xs cursor-pointer leading-none">
                          {FIELD_META[f]?.label ?? f}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Filters ──────────────────────────────────────────────────────── */}
        <div className="rounded-lg border bg-card shadow-sm p-4 space-y-4">
          <p className="text-sm font-semibold">Filters</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Date range */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Date From</Label>
              <DatePicker
                selectedDate={filters.startDate ? new Date(filters.startDate) : undefined}
                onChange={(d) => setFilters((p) => ({ ...p, startDate: format(d, "yyyy-MM-dd") }))}
                endYear={new Date().getFullYear() + 1}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Date To</Label>
              <DatePicker
                selectedDate={filters.endDate ? new Date(filters.endDate) : undefined}
                onChange={(d) => setFilters((p) => ({ ...p, endDate: format(d, "yyyy-MM-dd") }))}
                endYear={new Date().getFullYear() + 1}
              />
            </div>

            {/* Entry Status */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Entry Status</Label>
              <Select value={filters.status || "_all"} onValueChange={(v) => setFilters((p) => ({ ...p, status: v === "_all" ? "" : v }))}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All statuses" /></SelectTrigger>
                <SelectContent>
                  {[{ value: "_all", label: "All Statuses" }, ...statusOptions].map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Account Type */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Account Type</Label>
              <Select value={filters.account_type || "_all"} onValueChange={(v) => setFilters((p) => ({ ...p, account_type: v === "_all" ? "" : v }))}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All types" /></SelectTrigger>
                <SelectContent>
                  {[{ value: "_all", label: "All Types" }, ...accountTypeOptions].map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Source Module */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Source Module</Label>
              <Select value={filters.source_module || "_all"} onValueChange={(v) => setFilters((p) => ({ ...p, source_module: v === "_all" ? "" : v }))}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All modules" /></SelectTrigger>
                <SelectContent>
                  {[{ value: "_all", label: "All Modules" }, ...sourceModuleOptions].map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Branch */}
            {showBranchFilter && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Branch</Label>
                <Select value={filters.branch_id || "_all"} onValueChange={(v) => setFilters((p) => ({ ...p, branch_id: v === "_all" ? "" : v }))}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All branches" /></SelectTrigger>
                  <SelectContent>
                    {[{ branch_id: "_all", branch_name: "All Branches" }, ...(branches ?? [])].map((b) => (
                      <SelectItem key={b.branch_id} value={String(b.branch_id)}>{b.branch_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              className="text-xs text-muted-foreground hover:text-foreground hover:underline"
              onClick={() => setFilters({ ...DEFAULT_FILTERS, branch_id: String(branchKey ?? "") })}
            >
              Reset filters
            </button>
          </div>
        </div>

        {/* ── Display options ───────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-card shadow-sm px-4 py-3">
          <div className="flex items-center gap-2">
            <Type className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Font</span>
            <div className="flex gap-1">
              {[
                { key: "compact", label: "Compact" },
                { key: "normal",  label: "Normal"  },
                { key: "large",   label: "Large"   },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setDisplayFont(opt.key)}
                  className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                    displayFont === opt.key
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-border hover:bg-muted"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {displayDark ? <Moon className="w-3.5 h-3.5 text-muted-foreground" /> : <Sun className="w-3.5 h-3.5 text-muted-foreground" />}
            <span className="text-xs font-medium text-muted-foreground">Theme</span>
            <div className="flex gap-1">
              {[
                { key: false, label: "Light" },
                { key: true,  label: "Dark"  },
              ].map((opt) => (
                <button
                  key={String(opt.key)}
                  type="button"
                  onClick={() => setDisplayDark(opt.key)}
                  className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                    displayDark === opt.key
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-border hover:bg-muted"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Generate action ───────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={handleGenerate} disabled={!selectedFields.length || isLoading || isRefetching} className="gap-2">
            <Play className="w-3.5 h-3.5" />
            {isLoading || isRefetching ? "Generating…" : "Generate Report"}
          </Button>

          {selectedFields.length === 0 && (
            <p className="text-xs text-destructive">Select at least one field to generate a report.</p>
          )}

          {activeParams && !isLoading && !isRefetching && reportData?.count !== undefined && (
            <Badge variant="outline" className="text-xs">
              {reportData.count} {reportData.count === 1 ? "row" : "rows"}
            </Badge>
          )}

          {activeParams && !isLoading && !isRefetching && reportData?.count >= 10000 && (
            <p className="text-xs text-amber-600">Result is capped at 10,000 rows — apply date or account-type filters to narrow the range.</p>
          )}
        </div>

        <Separator />

        {/* ── Results table ─────────────────────────────────────────────────── */}
        {activeParams ? (
          <div
            className={`
              ${displayFont === "compact" ? "[&_td]:!py-1 [&_td]:!text-[10px] [&_th]:!text-[10px]" : ""}
              ${displayFont === "large"   ? "[&_td]:!py-3 [&_td]:!text-sm   [&_th]:!text-sm"        : ""}
              ${displayDark ? "dark" : ""}
            `}
          >
            <DatatableReport
              ref={tableRef}
              columns={columns}
              data={rows}
              fetchData={() => setActiveParams({ ...activeParams })}
              isLoading={isLoading}
              isRefetching={isRefetching}
              isError={isError}
              colSpan={Math.max(columns.length - 1, 1)}
              exportTitle="Accounting Custom Report"
              exportFilename="accounting-custom-report"
              exportHeaders={exportHeaders}
              exportRows={exportRows}
              exportDisabled={!rows.length}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg bg-muted/20">
            <Tag className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              Select fields, set filters, then click <strong>Generate Report</strong>.
            </p>
            <p className="text-xs text-muted-foreground mt-1">Each row is one journal entry debit/credit line.</p>
          </div>
        )}
      </div>

      {/* ── Delete confirmation ───────────────────────────────────────────── */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete template?</AlertDialogTitle>
            <AlertDialogDescription>This template will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTemplate.mutate(deleteId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AccountingCustomReportBuilder;

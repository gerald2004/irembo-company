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
import { DatePicker } from "@/components/ui/date-picker";
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
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import useBranchFilter from "@/MiddleWares/Hooks/useBranchFilter";
import { useBranches } from "@/Queries/Settings/branches";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import DatatableReport from "@/Pages/Components/DatatableReport";
import { formatDateTimestamp } from "@/lib/utils";
import {
  FileText, User, ArrowDownToLine, Users, BarChart3, AlertTriangle,
  BookmarkPlus, Bookmark, Trash2, Play, ChevronDown, CheckSquare,
  Square, SlidersHorizontal, ShieldCheck, CalendarClock,
  Sun, Moon, Type,
} from "lucide-react";

// ── Number formatter ──────────────────────────────────────────────────────────
const nf = new Intl.NumberFormat("en-UG", { maximumFractionDigits: 2 });
const fmt = (v) => nf.format(Number(v ?? 0));

// ── Field definitions (label + cell renderer) ────────────────────────────────
const FIELD_META = {
  // Loan Info
  loan_code:             { label: "Loan Code",            cell: (v) => <code className="text-xs font-mono">{v}</code> },
  loan_status:           { label: "Loan Status",          cell: (v) => <Badge variant="outline" className="text-xs capitalize">{v}</Badge> },
  applied_amount:        { label: "Applied Amount",       cell: (v) => <p className="text-xs tabular-nums text-right">{fmt(v)}</p>, align: "right" },
  application_date:      { label: "Application Date",     cell: (v) => <p className="text-xs whitespace-nowrap">{formatDateTimestamp(v)}</p> },
  penalties_accrued:     { label: "Penalties Accrued",    cell: (v) => <p className={`text-xs tabular-nums text-right ${Number(v) > 0 ? "text-amber-600" : ""}`}>{fmt(v)}</p>, align: "right" },
  flag_off_status:       { label: "Flag-Off Status",      cell: (v) => v && v !== "none" ? <Badge variant="destructive" className="text-xs capitalize">{v}</Badge> : <p className="text-xs text-muted-foreground">—</p> },
  flag_off_date:         { label: "Flag-Off Date",        cell: (v) => <p className="text-xs whitespace-nowrap">{v ? formatDateTimestamp(v) : "—"}</p> },
  // Client
  client_name:           { label: "Client Name",          cell: (v) => <p className="text-xs font-medium">{v}</p> },
  client_account:        { label: "Account No.",          cell: (v) => <code className="text-xs font-mono">{v}</code> },
  client_contact:        { label: "Phone",                cell: (v) => <p className="text-xs">{v || "—"}</p> },
  client_type:           { label: "Client Type",          cell: (v) => <Badge variant="secondary" className="text-xs capitalize">{v}</Badge> },
  client_gender:         { label: "Gender",               cell: (v) => <p className="text-xs capitalize">{v || "—"}</p> },
  client_email:          { label: "Email",                cell: (v) => <p className="text-xs truncate max-w-[160px]">{v || "—"}</p> },
  client_id_number:      { label: "ID Number",            cell: (v) => <p className="text-xs font-mono">{v || "—"}</p> },
  client_dob:            { label: "Date of Birth",        cell: (v) => <p className="text-xs whitespace-nowrap">{v ? formatDateTimestamp(v) : "—"}</p> },
  client_address:        { label: "Address",              cell: (v) => <p className="text-xs truncate max-w-[180px]">{v || "—"}</p> },
  client_employment:     { label: "Employment",           cell: (v) => <p className="text-xs capitalize">{v || "—"}</p> },
  client_marital_status: { label: "Marital Status",       cell: (v) => <p className="text-xs capitalize">{v || "—"}</p> },
  client_gross_income:   { label: "Est. Gross Income",    cell: (v) => <p className="text-xs tabular-nums text-right">{fmt(v)}</p>, align: "right" },
  // Disbursement
  disbursed_amount:      { label: "Disbursed Amount",     cell: (v) => <p className="text-xs tabular-nums text-right font-medium">{fmt(v)}</p>, align: "right" },
  disbursement_date:     { label: "Disbursement Date",    cell: (v) => <p className="text-xs whitespace-nowrap">{formatDateTimestamp(v)}</p> },
  interest_rate:         { label: "Rate %",               cell: (v) => <p className="text-xs tabular-nums text-right">{v}%</p>, align: "right" },
  tenure:                { label: "Tenure",               cell: (v) => <p className="text-xs">{v}</p> },
  // Staff & Product
  product:               { label: "Loan Product",         cell: (v) => <p className="text-xs font-medium">{v}</p> },
  branch:                { label: "Branch",               cell: (v) => <p className="text-xs">{v || "—"}</p> },
  officer:               { label: "Loan Officer",         cell: (v) => <p className="text-xs">{v || "—"}</p> },
  // Guarantors
  guarantor_names:       { label: "Guarantor Names",      cell: (v) => <p className="text-xs truncate max-w-[200px]">{v || "—"}</p> },
  guarantor_count:       { label: "Guarantors #",         cell: (v) => <p className="text-xs tabular-nums text-center font-medium">{v ?? 0}</p> },
  guarantor_total_amount:{ label: "Guaranteed Amount",    cell: (v) => <p className="text-xs tabular-nums text-right">{fmt(v)}</p>, align: "right" },
  guarantor_contacts:    { label: "Guarantor Contacts",   cell: (v) => <p className="text-xs truncate max-w-[180px]">{v || "—"}</p> },
  // Outstanding
  outstanding_principal: { label: "O/S Principal",        cell: (v) => <p className="text-xs tabular-nums text-right">{fmt(v)}</p>, align: "right" },
  outstanding_interest:  { label: "O/S Interest",         cell: (v) => <p className="text-xs tabular-nums text-right">{fmt(v)}</p>, align: "right" },
  outstanding_penalties: { label: "Penalties O/S",        cell: (v) => <p className="text-xs tabular-nums text-right">{fmt(v)}</p>, align: "right" },
  outstanding_monitoring:{ label: "Monitoring Fee O/S",   cell: (v) => <p className="text-xs tabular-nums text-right">{fmt(v)}</p>, align: "right" },
  total_outstanding:     { label: "Total Outstanding",    cell: (v) => <p className="text-xs tabular-nums text-right font-semibold">{fmt(v)}</p>, align: "right" },
  // Installments
  total_installments:    { label: "Total Installments",   cell: (v) => <p className="text-xs tabular-nums text-center">{v ?? 0}</p> },
  paid_installments:     { label: "Paid Installments",    cell: (v) => <p className="text-xs tabular-nums text-center text-green-700 font-medium">{v ?? 0}</p> },
  next_due_date:         { label: "Next Due Date",        cell: (v) => <p className={`text-xs whitespace-nowrap ${v && new Date(v) < new Date() ? "text-red-600 font-medium" : ""}`}>{v ? formatDateTimestamp(v) : "—"}</p> },
  // Risk & Arrears
  overdue_amount:        { label: "Overdue Amount",       cell: (v) => <p className={`text-xs tabular-nums text-right font-medium ${Number(v) > 0 ? "text-red-600" : "text-muted-foreground"}`}>{fmt(v)}</p>, align: "right" },
  dpd:                   { label: "DPD",                  cell: (v) => <p className={`text-xs tabular-nums text-right font-medium ${Number(v) > 0 ? "text-orange-600" : ""}`}>{v ?? 0}</p>, align: "right" },
  missed_count:          { label: "Missed Inst.",         cell: (v) => <p className="text-xs tabular-nums text-right">{v ?? 0}</p>, align: "right" },
  aging_bucket:          { label: "Aging Bucket",        cell: (v) => {
    const colors = { "Current": "bg-green-100 text-green-800", "PAR 1-30": "bg-yellow-100 text-yellow-800", "PAR 31-60": "bg-orange-100 text-orange-800", "PAR 61-90": "bg-red-100 text-red-800", "PAR 91-180": "bg-red-200 text-red-900", "PAR 180+": "bg-red-300 text-red-900 font-bold" };
    return <span className={`text-xs px-2 py-0.5 rounded-full ${colors[v] ?? "bg-muted text-muted-foreground"}`}>{v ?? "—"}</span>;
  }},
};

// ── Field groups ──────────────────────────────────────────────────────────────
const FIELD_GROUPS = [
  {
    title: "Loan Info",
    icon: FileText,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    fields: ["loan_code", "loan_status", "applied_amount", "application_date", "penalties_accrued", "flag_off_status", "flag_off_date"],
  },
  {
    title: "Client",
    icon: User,
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    fields: ["client_name", "client_account", "client_contact", "client_type", "client_gender", "client_email", "client_id_number", "client_dob", "client_address", "client_employment", "client_marital_status", "client_gross_income"],
  },
  {
    title: "Disbursement",
    icon: ArrowDownToLine,
    color: "text-cyan-600",
    bg: "bg-cyan-50 dark:bg-cyan-900/20",
    fields: ["disbursed_amount", "disbursement_date", "interest_rate", "tenure"],
  },
  {
    title: "Staff & Product",
    icon: Users,
    color: "text-violet-600",
    bg: "bg-violet-50 dark:bg-violet-900/20",
    fields: ["product", "branch", "officer"],
  },
  {
    title: "Guarantors",
    icon: ShieldCheck,
    color: "text-teal-600",
    bg: "bg-teal-50 dark:bg-teal-900/20",
    fields: ["guarantor_names", "guarantor_count", "guarantor_total_amount", "guarantor_contacts"],
  },
  {
    title: "Outstanding",
    icon: BarChart3,
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    fields: ["outstanding_principal", "outstanding_interest", "outstanding_penalties", "outstanding_monitoring", "total_outstanding"],
  },
  {
    title: "Installments",
    icon: CalendarClock,
    color: "text-sky-600",
    bg: "bg-sky-50 dark:bg-sky-900/20",
    fields: ["total_installments", "paid_installments", "next_due_date"],
  },
  {
    title: "Risk & Arrears",
    icon: AlertTriangle,
    color: "text-red-600",
    bg: "bg-red-50 dark:bg-red-900/20",
    fields: ["overdue_amount", "dpd", "missed_count", "aging_bucket"],
  },
];

const DEFAULT_FIELDS = ["loan_code", "client_name", "client_contact", "loan_status", "disbursed_amount", "disbursement_date", "tenure", "product", "officer"];

const DEFAULT_FILTERS = {
  startDate: "", endDate: "", date_field: "disbursement", branch_id: "", status: "",
  product_id: "", officer_id: "", min_dpd: "",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const statusOptions = [
  { value: "disbursed",  label: "Active / Disbursed" },
  { value: "settled",    label: "Settled" },
  { value: "paid_off",   label: "Paid Off" },
  { value: "writternoff",label: "Written Off" },
  { value: "rejected",   label: "Rejected" },
];

// ── Component ─────────────────────────────────────────────────────────────────
const CustomReportBuilder = () => {
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
  const [displayFont, setDisplayFont]       = useState("normal");   // "compact" | "normal" | "large"
  const [displayDark, setDisplayDark]       = useState(false);

  // ── Fetch helpers (products, officers, templates) ─────────────────────────
  const { data: products = [] } = useQuery({
    queryKey: ["loan-products-list"],
    queryFn: async () => {
      const res = await axiosPrivate.get("/settings/loans/products");
      return res?.data?.data?.loan_products ?? [];
    },
  });

  const { data: officers = [] } = useQuery({
    queryKey: ["sacco-users-list"],
    queryFn: async () => {
      const res = await axiosPrivate.get("/sacco/users");
      return res?.data?.data?.users ?? res?.data?.data ?? [];
    },
  });

  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ["custom-report-templates"],
    queryFn: async () => {
      const res = await axiosPrivate.get("/reports/templates");
      return res?.data?.data ?? [];
    },
  });

  // ── Generate report ───────────────────────────────────────────────────────
  const { data: reportData = {}, isLoading, isRefetching, isError } = useQuery({
    queryKey: ["custom-loan-report", activeParams],
    queryFn: async ({ signal }) => {
      try {
        const res = await axiosPrivate.get("/reports/loans/custom", {
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

  // ── Save template mutation ────────────────────────────────────────────────
  const saveTemplate = useMutation({
    mutationFn: async (payload) => {
      const res = await axiosPrivate.post("/reports/templates", payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["custom-report-templates"]);
      setShowSaveForm(false);
      setTemplateName("");
      setIsShared(false);
    },
  });

  // ── Delete template mutation ──────────────────────────────────────────────
  const deleteTemplate = useMutation({
    mutationFn: async (id) => {
      await axiosPrivate.delete("/reports/templates", { data: { id } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["custom-report-templates"]);
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

  // ── Load a saved template ─────────────────────────────────────────────────
  const loadTemplate = (template) => {
    setSelectedFields(template.fields ?? DEFAULT_FIELDS);
    setFilters({ ...DEFAULT_FILTERS, ...(template.filters ?? {}) });
    setActiveParams(null);
  };

  // ── Generate ──────────────────────────────────────────────────────────────
  const handleGenerate = () => {
    if (!selectedFields.length) return;
    setActiveParams({ fields: selectedFields, ...filters });
  };

  // ── Dynamic table columns ─────────────────────────────────────────────────
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

  // ── Export data ───────────────────────────────────────────────────────────
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
          <BreadcrumbItem><BreadcrumbLink to="/loans-reports">Loans Reports</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Custom Report Builder</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-1 space-y-5 pt-2">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h5 className="text-2xl font-bold tracking-tight">Custom Report Builder</h5>
            <p className="text-sm text-muted-foreground">Pick any combination of fields, apply filters, and generate your report.</p>
          </div>

          {/* Saved templates picker */}
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
                  <p className="text-xs text-muted-foreground p-3">No saved templates yet. Build a report and save it.</p>
                ) : (
                  <div className="divide-y max-h-80 overflow-y-auto">
                    {templates.map((t) => (
                      <div key={t.id} className="flex items-center justify-between px-3 py-2.5 hover:bg-muted/50">
                        <button
                          className="flex-1 text-left"
                          onClick={() => loadTemplate(t)}
                        >
                          <p className="text-xs font-medium leading-tight">{t.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {t.fields.length} fields
                            {t.is_shared && <span className="ml-1.5 text-primary">· shared</span>}
                            {!t.is_mine && <span className="ml-1.5 text-muted-foreground">· team</span>}
                          </p>
                        </button>
                        {t.is_mine && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-6 h-6 shrink-0 text-muted-foreground hover:text-destructive"
                            onClick={() => setDeleteId(t.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </PopoverContent>
            </Popover>

            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setShowSaveForm((v) => !v)}
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
              Save as Template
            </Button>
          </div>
        </div>

        {/* ── Save template inline form ────────────────────────────────────── */}
        {showSaveForm && (
          <div className="rounded-lg border bg-muted/30 p-4 flex flex-wrap items-end gap-3">
            <div className="space-y-1 flex-1 min-w-[180px]">
              <Label className="text-xs">Template Name</Label>
              <Input
                placeholder="e.g. Monthly overdue summary"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="flex items-center gap-2 pb-0.5">
              <Checkbox
                id="is-shared"
                checked={isShared}
                onCheckedChange={setIsShared}
              />
              <Label htmlFor="is-shared" className="text-xs cursor-pointer">Share with team</Label>
            </div>
            <div className="flex gap-2 pb-0.5">
              <Button
                size="sm"
                disabled={!templateName.trim() || saveTemplate.isPending}
                onClick={() =>
                  saveTemplate.mutate({
                    name: templateName.trim(),
                    entity: "loans",
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 divide-x divide-y">
            {FIELD_GROUPS.map((group) => {
              const Icon = group.icon;
              const allChecked = group.fields.every((f) => selectedFields.includes(f));
              const someChecked = group.fields.some((f) => selectedFields.includes(f));
              return (
                <div key={group.title} className="p-4 space-y-2.5">
                  {/* Group header */}
                  <div className="flex items-center gap-2">
                    <div className={`rounded p-1 ${group.bg} ${group.color}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-foreground">{group.title}</span>
                    <button
                      className="ml-auto"
                      onClick={() => toggleGroup(group.fields)}
                      title={allChecked ? "Deselect all" : "Select all"}
                    >
                      {allChecked ? (
                        <CheckSquare className="w-3.5 h-3.5 text-primary" />
                      ) : someChecked ? (
                        <CheckSquare className="w-3.5 h-3.5 text-primary/50" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                  {/* Field checkboxes */}
                  <div className="space-y-1.5">
                    {group.fields.map((f) => (
                      <div key={f} className="flex items-center gap-2">
                        <Checkbox
                          id={f}
                          checked={selectedFields.includes(f)}
                          onCheckedChange={() => toggleField(f)}
                        />
                        <Label htmlFor={f} className="text-xs cursor-pointer leading-none">
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
            {/* Date field type */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Date Filter By</Label>
              <Select
                value={filters.date_field || "disbursement"}
                onValueChange={(v) => setFilters((p) => ({ ...p, date_field: v }))}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    { value: "disbursement", label: "Disbursement Date" },
                    { value: "application",  label: "Application Date"  },
                  ].map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date range */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                {filters.date_field === "application" ? "Application" : "Disbursement"} From
              </Label>
              <DatePicker
                selectedDate={filters.startDate ? new Date(filters.startDate) : undefined}
                onChange={(d) => setFilters((p) => ({ ...p, startDate: format(d, "yyyy-MM-dd") }))}
                endYear={new Date().getFullYear() + 1}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                {filters.date_field === "application" ? "Application" : "Disbursement"} To
              </Label>
              <DatePicker
                selectedDate={filters.endDate ? new Date(filters.endDate) : undefined}
                onChange={(d) => setFilters((p) => ({ ...p, endDate: format(d, "yyyy-MM-dd") }))}
                endYear={new Date().getFullYear() + 1}
              />
            </div>

            {/* Loan status */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Loan Status</Label>
              <Select
                value={filters.status || "_all"}
                onValueChange={(v) => setFilters((p) => ({ ...p, status: v === "_all" ? "" : v }))}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  {[{ value: "_all", label: "All Statuses" }, ...statusOptions].map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Product */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Loan Product</Label>
              <Select
                value={filters.product_id || "_all"}
                onValueChange={(v) => setFilters((p) => ({ ...p, product_id: v === "_all" ? "" : v }))}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All products" />
                </SelectTrigger>
                <SelectContent>
                  {[{ loan_product_id: "_all", loan_product_title: "All Products" }, ...products].map((p) => (
                    <SelectItem key={p.loan_product_id} value={String(p.loan_product_id)}>
                      {p.loan_product_title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Branch (sacco-level only) */}
            {showBranchFilter && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Branch</Label>
                <Select
                  value={filters.branch_id || "_all"}
                  onValueChange={(v) => setFilters((p) => ({ ...p, branch_id: v === "_all" ? "" : v }))}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="All branches" />
                  </SelectTrigger>
                  <SelectContent>
                    {[{ branch_id: "_all", branch_name: "All Branches" }, ...(branches ?? [])].map((b) => (
                      <SelectItem key={b.branch_id} value={String(b.branch_id)}>
                        {b.branch_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Officer */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Loan Officer</Label>
              <Select
                value={filters.officer_id || "_all"}
                onValueChange={(v) => setFilters((p) => ({ ...p, officer_id: v === "_all" ? "" : v }))}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All officers" />
                </SelectTrigger>
                <SelectContent>
                  {[{ user_id: "_all", user_firstname: "All Officers", user_lastname: "" }, ...officers].map((u) => (
                    <SelectItem key={u.user_id} value={String(u.user_id)}>
                      {u.user_firstname} {u.user_lastname}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Min DPD */}
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Min DPD (days overdue)</Label>
              <Input
                type="number"
                min="0"
                placeholder="e.g. 30"
                value={filters.min_dpd}
                onChange={(e) => setFilters((p) => ({ ...p, min_dpd: e.target.value }))}
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* Reset filters */}
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
                { key: false, label: "Light", icon: Sun  },
                { key: true,  label: "Dark",  icon: Moon },
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

        {/* ── Generate action row ───────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={handleGenerate}
            disabled={!selectedFields.length || isLoading || isRefetching}
            className="gap-2"
          >
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
              exportTitle="Custom Loan Report"
              exportFilename="custom-loan-report"
              exportHeaders={exportHeaders}
              exportRows={exportRows}
              exportDisabled={!rows.length}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg bg-muted/20">
            <BarChart3 className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              Select your fields, set filters, then click <strong>Generate Report</strong>.
            </p>
          </div>
        )}
      </div>

      {/* ── Delete confirmation dialog ────────────────────────────────────── */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete template?</AlertDialogTitle>
            <AlertDialogDescription>
              This template will be permanently removed. This cannot be undone.
            </AlertDialogDescription>
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

export default CustomReportBuilder;

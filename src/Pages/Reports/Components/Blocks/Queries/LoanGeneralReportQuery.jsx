/* eslint-disable react/prop-types */
/**
 * LoanGeneralReportQuery — comprehensive per-report filter bar.
 *
 * show prop controls which filters appear (all default false unless noted):
 *   officer         {bool}   — officer/teller (default: TRUE for sacco & branch users)
 *   product         {bool}   — loan product selector
 *   status          {bool}   — generic status (pass statusOptions with it)
 *   method          {bool}   — transaction method (cash/mobile/bank/cheque)
 *   clientStatus    {bool}   — client status (active/inactive/suspended)
 *   clientType      {bool}   — client type (individual/group)
 *   gender          {bool}   — gender (male/female/other)
 *   group           {bool}   — group client selector
 *   savingsProduct  {bool}   — savings account product
 *   attendanceStatus{bool}   — staff attendance status
 *   minDpd          {bool}   — min days past due (number input, for defaulted loans)
 *
 * Backward-compat props:
 *   showProductFilter  → same as show.product
 *   showStatusFilter   → same as show.status (uses DEFAULT_LOAN_STATUSES)
 */
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Controller, useForm } from "react-hook-form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CalendarDateRangePicker } from "@/components/date-range-picker";
import { toast } from "@/hooks/use-toast";
import fileDownload from "js-file-download";
import { FileText, FileSpreadsheet, RefreshCw, RotateCcw, SlidersHorizontal } from "lucide-react";
import { formatDateTimestamp, getValidDate, prepareDataForExport } from "@/lib/utils";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import useAuth from "@/MiddleWares/Hooks/useAuth";
import { useBranches } from "@/Queries/Settings/branches";
import { useUsers } from "@/Queries/Settings/users";
import { useQuery } from "@tanstack/react-query";
import { Separator } from "@/components/ui/separator";

const toParam = (v) => (v === "all" ? "" : (v ?? ""));

/* ─── Static option lists ─────────────────────────────────────────────────── */

const METHOD_OPTIONS = [
  { value: "cash",   label: "Cash" },
  { value: "mobile", label: "Mobile Money" },
  { value: "bank",   label: "Bank Transfer" },
  { value: "cheque", label: "Cheque" },
];

const CLIENT_STATUS_OPTIONS = [
  { value: "active",    label: "Active" },
  { value: "inactive",  label: "Inactive" },
  { value: "suspended", label: "Suspended" },
];

const CLIENT_TYPE_OPTIONS = [
  { value: "individual", label: "Individual" },
  { value: "group",      label: "Group" },
];

const GENDER_OPTIONS = [
  { value: "male",   label: "Male" },
  { value: "female", label: "Female" },
  { value: "other",  label: "Other" },
];

const ATTENDANCE_STATUS_OPTIONS = [
  { value: "present",  label: "Present" },
  { value: "absent",   label: "Absent" },
  { value: "late",     label: "Late" },
  { value: "half_day", label: "Half Day" },
  { value: "on_leave", label: "On Leave" },
];

const DEFAULT_LOAN_STATUSES = [
  { value: "pending",    label: "Pending" },
  { value: "processed",  label: "Processed" },
  { value: "approved",   label: "Approved" },
  { value: "disbursed",  label: "Disbursed" },
  { value: "paid_off",   label: "Paid Off" },
  { value: "settled",    label: "Settled" },
  { value: "overdue",    label: "Overdue" },
  { value: "defaulted",  label: "Defaulted" },
  { value: "rejected",   label: "Rejected" },
  { value: "writternoff",label: "Written Off" },
];

/* ─── Tiny reusable Select wrapper ───────────────────────────────────────── */
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

/* ─── Main component ─────────────────────────────────────────────────────── */
const LoanGeneralReportQuery = ({
  show = {},
  statusOptions,
  showProductFilter,
  showStatusFilter,
  onFilterChange,
  isRefetching,
  data,
  tableRef,
  filters,
  title,
  totals,
  colSpan,
  mode,
}) => {
  // Merge legacy props
  const cfg = {
    officer:          show.officer !== false,
    product:          show.product      ?? showProductFilter ?? false,
    status:           show.status       ?? showStatusFilter  ?? false,
    method:           show.method       ?? false,
    clientStatus:     show.clientStatus ?? false,
    clientType:       show.clientType   ?? false,
    gender:           show.gender       ?? false,
    group:            show.group        ?? false,
    savingsProduct:   show.savingsProduct ?? false,
    attendanceStatus: show.attendanceStatus ?? false,
    minDpd:           show.minDpd       ?? false,
  };

  const resolvedStatusOptions = statusOptions ?? (cfg.status ? DEFAULT_LOAN_STATUSES : []);

  const { auth }     = useAuth();
  const axiosPrivate = useAxiosPrivate();
  const { control, handleSubmit, reset } = useForm();

  const isSacco  = auth?.user?.data_privilege === "sacco";
  const isBranch = auth?.user?.data_privilege === "branch";

  const fiscalStart = auth?.fiscalYear?.start_date
    ? new Date(auth.fiscalYear.start_date)
    : new Date(new Date().getFullYear(), 0, 1);

  const [dateRange,             setDateRange]             = useState({ from: fiscalStart, to: new Date() });
  const [selectedBranch,        setSelectedBranch]        = useState("all");
  const [selectedUser,          setSelectedUser]          = useState("all");
  const [selectedProduct,       setSelectedProduct]       = useState("all");
  const [selectedStatus,        setSelectedStatus]        = useState("all");
  const [selectedMethod,        setSelectedMethod]        = useState("all");
  const [selectedClientStatus,  setSelectedClientStatus]  = useState("all");
  const [selectedClientType,    setSelectedClientType]    = useState("all");
  const [selectedGender,        setSelectedGender]        = useState("all");
  const [selectedGroup,         setSelectedGroup]         = useState("all");
  const [selectedSavingsProd,   setSelectedSavingsProd]   = useState("all");
  const [selectedAttStatus,     setSelectedAttStatus]     = useState("all");
  const [minDpd,                setMinDpd]                = useState("");

  const { data: branches      = [] } = useBranches();
  const { data: users         = [] } = useUsers();

  const { data: loanProducts  = [] } = useQuery({
    enabled: cfg.product,
    queryKey: ["loan-products"],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get("/settings/loans/products");
        return res?.data?.data?.loan_products ?? [];
      } catch { return []; }
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: savingsProducts = [] } = useQuery({
    enabled: cfg.savingsProduct,
    queryKey: ["savings-products-filter"],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get("/settings/savings/accounts");
        return res?.data?.data?.savings_products ?? res?.data?.data ?? [];
      } catch { return []; }
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: groups = [] } = useQuery({
    enabled: cfg.group,
    queryKey: ["groups-for-filter"],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get("/clients/groups");
        return res?.data?.data?.clients ?? [];
      } catch { return []; }
    },
    staleTime: 5 * 60 * 1000,
  });

  const filteredUsers = isSacco
    ? users.filter((u) => selectedBranch === "all" || String(u.branch_id) === String(selectedBranch))
    : users.filter((u) => String(u.branch_id) === String(auth?.user?.branch_id));

  const buildParams = () => ({
    startDate:  dateRange.from.toLocaleDateString("en-CA"),
    endDate:    dateRange.to.toLocaleDateString("en-CA"),
    branch_id:  toParam(selectedBranch),
    ...(cfg.officer           ? { user_id:           toParam(selectedUser)           } : {}),
    ...(cfg.product           ? { product_id:        toParam(selectedProduct)        } : {}),
    ...(cfg.status && selectedStatus        !== "all" ? { status:            selectedStatus                } : {}),
    ...(cfg.method && selectedMethod        !== "all" ? { method:            selectedMethod                } : {}),
    ...(cfg.clientStatus && selectedClientStatus !== "all" ? { client_status: selectedClientStatus         } : {}),
    ...(cfg.clientType   && selectedClientType   !== "all" ? { client_type:   selectedClientType           } : {}),
    ...(cfg.gender       && selectedGender       !== "all" ? { gender:        selectedGender               } : {}),
    ...(cfg.group                             ? { group_id:         toParam(selectedGroup)          } : {}),
    ...(cfg.savingsProduct && selectedSavingsProd !== "all" ? { savings_product_id: selectedSavingsProd    } : {}),
    ...(cfg.attendanceStatus && selectedAttStatus !== "all" ? { attendance_status:  selectedAttStatus      } : {}),
    ...(cfg.minDpd && minDpd ? { min_dpd: minDpd } : {}),
  });

  // Auto-apply fiscal year range on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { onFilterChange(buildParams()); }, []);

  const doReset = () => {
    setSelectedBranch("all");        setSelectedUser("all");
    setSelectedProduct("all");       setSelectedStatus("all");
    setSelectedMethod("all");        setSelectedClientStatus("all");
    setSelectedClientType("all");    setSelectedGender("all");
    setSelectedGroup("all");         setSelectedSavingsProd("all");
    setSelectedAttStatus("all");     setMinDpd("");
    setDateRange({ from: fiscalStart, to: new Date() });
    onFilterChange({
      startDate: fiscalStart.toLocaleDateString("en-CA"),
      endDate:   new Date().toLocaleDateString("en-CA"),
      branch_id: "",
    });
    reset();
  };

  const [isDownloading, setIsDownloading] = useState(false);

  const onDownload = async (type) => {
    if (!tableRef?.current) {
      toast({ title: "Table not ready", variant: "destructive", description: "Cannot find the table instance." });
      return;
    }
    const exportData  = prepareDataForExport(tableRef.current, data);
    const dataDownload = {
      data: exportData, totals, colspan: colSpan, mode,
      dates: {
        start_date: formatDateTimestamp(getValidDate(filters?.startDate, auth?.fiscalYear?.start_date)),
        end_date:   formatDateTimestamp(getValidDate(filters?.endDate,   new Date())),
      },
      title,
    };
    try {
      setIsDownloading(true);
      const res = await axiosPrivate.post(
        type === "pdf" ? "/export/general/pdf" : "/export/general/excel",
        { data: dataDownload },
        { responseType: "blob" }
      );
      fileDownload(res.data, `${title}_${Math.round(+new Date()/1000)}.${type === "pdf" ? "pdf" : "xlsx"}`);
      toast({ title: "Download successful", variant: "success" });
    } catch {
      toast({ title: "Download failed", variant: "destructive" });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(() => onFilterChange(buildParams()))}>
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 py-2 bg-muted/40 border-b">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">Filters</span>
          </div>
          <Button size="sm" variant="ghost" className="h-6 text-xs px-2 text-muted-foreground" type="button"
            onClick={doReset} disabled={isRefetching}>
            <RotateCcw className="w-3 h-3 mr-1" /> Reset all
          </Button>
        </div>

        {/* ── Filter row ── */}
        <div className="flex flex-wrap items-end gap-3 p-4">

          {/* Date Range — always shown */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Date Range</Label>
            <CalendarDateRangePicker
              defaultValue={dateRange}
              onChange={(r) => r?.from && r?.to && setDateRange({ from: new Date(r.from), to: new Date(r.to) })}
            />
          </div>

          {/* Branch — sacco only */}
          {isSacco && (
            <Controller name="branch_id" control={control} render={({ field }) => (
              <Sel label="Branch" value={selectedBranch} placeholder="All Branches" width="w-36"
                onValue={(v) => { field.onChange(v); setSelectedBranch(v); setSelectedUser("all"); }}>
                <SelectItem value="all">All Branches</SelectItem>
                {branches.map((b) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
              </Sel>
            )} />
          )}

          {/* Officer / Teller */}
          {cfg.officer && (isSacco || isBranch) && (
            <Controller name="user_id" control={control} render={({ field }) => (
              <Sel label="Officer / Teller" value={selectedUser} placeholder="All Officers" width="w-40"
                onValue={(v) => { field.onChange(v); setSelectedUser(v); }}>
                <SelectItem value="all">All Officers</SelectItem>
                {filteredUsers.map((u) => (
                  <SelectItem key={u.user_id} value={String(u.user_id)}>
                    {u.user_firstname} {u.user_lastname}
                  </SelectItem>
                ))}
              </Sel>
            )} />
          )}

          {/* Loan Product */}
          {cfg.product && (
            <Controller name="product_id" control={control} render={({ field }) => (
              <Sel label="Loan Product" value={selectedProduct} placeholder="All Products" width="w-40"
                onValue={(v) => { field.onChange(v); setSelectedProduct(v); }}>
                <SelectItem value="all">All Products</SelectItem>
                {loanProducts.map((p) => (
                  <SelectItem key={p.loan_product_id ?? p.id} value={String(p.loan_product_id ?? p.id)}>
                    {p.loan_product_title ?? p.title}
                  </SelectItem>
                ))}
              </Sel>
            )} />
          )}

          {/* Savings Product */}
          {cfg.savingsProduct && (
            <Controller name="savings_product_id" control={control} render={({ field }) => (
              <Sel label="Account Type" value={selectedSavingsProd} placeholder="All Types" width="w-40"
                onValue={(v) => { field.onChange(v); setSelectedSavingsProd(v); }}>
                <SelectItem value="all">All Types</SelectItem>
                {savingsProducts.map((p) => (
                  <SelectItem key={p.product_id ?? p.id} value={String(p.product_id ?? p.id)}>
                    {p.product_name ?? p.product_title ?? p.title}
                  </SelectItem>
                ))}
              </Sel>
            )} />
          )}

          {/* Status */}
          {cfg.status && resolvedStatusOptions.length > 0 && (
            <Sel label="Status" value={selectedStatus} placeholder="All Statuses" width="w-36" onValue={setSelectedStatus}>
              <SelectItem value="all">All Statuses</SelectItem>
              {resolvedStatusOptions.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </Sel>
          )}

          {/* Transaction Method */}
          {cfg.method && (
            <Sel label="Method" value={selectedMethod} placeholder="All Methods" width="w-36" onValue={setSelectedMethod}>
              <SelectItem value="all">All Methods</SelectItem>
              {METHOD_OPTIONS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
            </Sel>
          )}

          {/* Client Status */}
          {cfg.clientStatus && (
            <Sel label="Client Status" value={selectedClientStatus} placeholder="All Statuses" width="w-32" onValue={setSelectedClientStatus}>
              <SelectItem value="all">All Statuses</SelectItem>
              {CLIENT_STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </Sel>
          )}

          {/* Client Type */}
          {cfg.clientType && (
            <Sel label="Client Type" value={selectedClientType} placeholder="All Types" width="w-32" onValue={setSelectedClientType}>
              <SelectItem value="all">All Types</SelectItem>
              {CLIENT_TYPE_OPTIONS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </Sel>
          )}

          {/* Gender */}
          {cfg.gender && (
            <Sel label="Gender" value={selectedGender} placeholder="All Genders" width="w-28" onValue={setSelectedGender}>
              <SelectItem value="all">All Genders</SelectItem>
              {GENDER_OPTIONS.map((g) => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
            </Sel>
          )}

          {/* Group */}
          {cfg.group && (
            <Controller name="group_id" control={control} render={({ field }) => (
              <Sel label="Group" value={selectedGroup} placeholder="All Groups" width="w-44"
                onValue={(v) => { field.onChange(v); setSelectedGroup(v); }}>
                <SelectItem value="all">All Groups</SelectItem>
                {groups.map((g) => (
                  <SelectItem key={g.client_id} value={String(g.client_id)}>
                    {g.client_group_name}
                  </SelectItem>
                ))}
              </Sel>
            )} />
          )}

          {/* Attendance Status */}
          {cfg.attendanceStatus && (
            <Sel label="Attendance" value={selectedAttStatus} placeholder="All Statuses" width="w-32" onValue={setSelectedAttStatus}>
              <SelectItem value="all">All Statuses</SelectItem>
              {ATTENDANCE_STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </Sel>
          )}

          {/* Min Days Past Due */}
          {cfg.minDpd && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Min Days Overdue</Label>
              <Input
                type="number"
                min={0}
                className="h-8 w-28 text-xs"
                placeholder="e.g. 90"
                value={minDpd}
                onChange={(e) => setMinDpd(e.target.value)}
              />
            </div>
          )}

          {/* ── Action buttons — push right ── */}
          <div className="ml-auto flex items-end gap-2 flex-wrap">
            <Button size="sm" className="h-8" type="submit" disabled={isRefetching}>
              {isRefetching && <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              {isRefetching ? "Loading…" : "Apply"}
            </Button>
            <Separator orientation="vertical" className="h-8" />
            <Button size="sm" variant="outline" className="h-8" type="button"
              onClick={() => onDownload("pdf")} disabled={isDownloading || !data?.length}>
              <FileText className="w-3.5 h-3.5 mr-1.5" /> PDF
            </Button>
            <Button size="sm" variant="outline" className="h-8" type="button"
              onClick={() => onDownload("xlsx")} disabled={isDownloading || !data?.length}>
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" /> Excel
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default LoanGeneralReportQuery;

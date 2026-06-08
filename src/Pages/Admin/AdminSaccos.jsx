import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Building2, Search, Loader2, AlertCircle, ArrowLeft,
  Users, CreditCard, Wallet, TrendingUp, Upload,
  CheckCircle2, XCircle, Activity,
  MessageSquare, Mail, Bell, Smartphone, Globe,
  Shield, ToggleLeft, ToggleRight, ChevronLeft, ChevronRight,
  Banknote, Phone, Database, UserPlus, X, BarChart2, Edit2, Settings,
  RotateCcw, FileText, FileSpreadsheet,
} from "lucide-react";
import fileDownload from "js-file-download";
import jsPDF from "jspdf";
import "jspdf-autotable";
import useAdminAxios from "@/MiddleWares/Hooks/useAdminAxios";
import { DatePickerField } from "@/components/ui/date-picker";

const fmt = (n) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
  : n >= 1_000   ? `${(n / 1_000).toFixed(1)}K`
  : String(n ?? 0);

const BASE_URL = import.meta.env.VITE_BASE_URL ?? "http://localhost:8081";
const saccoLogoUrl = (logo) => {
  if (!logo) return null;
  if (logo.startsWith("http")) return logo;
  if (logo.startsWith("/")) return `${BASE_URL}${logo}`;
  return logo;
};

const fmtCur = (n) => Number(n ?? 0).toLocaleString("en-UG");
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-UG", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const fmtDateTime = (d) => d ? new Date(d).toLocaleString("en-UG", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

// ── Shared ────────────────────────────────────────────────────────────────────

function StatusBadge({ v }) {
  const on = v === "active" || v === "Active" || v === "yes" || v === "enabled";
  return on
    ? <span className="flex items-center gap-1 text-emerald-400 text-xs"><CheckCircle2 className="w-3 h-3" /> Active</span>
    : <span className="flex items-center gap-1 text-gray-500 text-xs"><XCircle className="w-3 h-3" /> Inactive</span>;
}

function Toggle({ value, onValue, offValue, onChange, disabled }) {
  const on = onValue
    ? value === onValue
    : (value === "active" || value === "Active" || value === "yes" || value === "enabled" || value === "open");
  return (
    <button
      onClick={() => onChange(on ? (offValue ?? "inactive") : (onValue ?? "active"))}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-40 ${on ? "bg-indigo-600" : "bg-gray-700"}`}
    >
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${on ? "translate-x-5" : "translate-x-1"}`} />
    </button>
  );
}

function Pager({ page, total, perPage, onPage }) {
  const pages = Math.ceil(total / perPage);
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 dark:border-gray-800">
      <span className="text-xs text-gray-500">{total} total · page {page} of {pages}</span>
      <div className="flex gap-1">
        <button disabled={page <= 1} onClick={() => onPage(page - 1)} className="p-1 rounded text-gray-500 hover:text-gray-900 dark:hover:text-white disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
        <button disabled={page >= pages} onClick={() => onPage(page + 1)} className="p-1 rounded text-gray-500 hover:text-gray-900 dark:hover:text-white disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
      </div>
    </div>
  );
}

function TabLoader() {
  return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>;
}


function TabError({ msg, onRetry }) {
  return (
    <div className="flex gap-3 items-start text-red-400 bg-red-900/20 border border-red-800/30 rounded-lg p-4">
      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
      <div>
        <p className="text-sm">{msg}</p>
        {onRetry && <button onClick={onRetry} className="text-xs text-indigo-400 hover:text-indigo-300 mt-1">Retry</button>}
      </div>
    </div>
  );
}

function ClientPhoto({ src, name, size = "md" }) {
  const url = src
    ? src.startsWith("http") ? src : `${BASE_URL}${src.startsWith("/") ? src : "/" + src}`
    : null;
  const initials = (name ?? "?").split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";
  const cls = size === "sm" ? "w-7 h-7 text-[10px]" : "w-9 h-9 text-xs";
  return url ? (
    <img src={url} alt="" className={`${cls} rounded-full object-cover shrink-0 border border-gray-700`} onError={(e) => { e.target.style.display = "none"; }} />
  ) : (
    <div className={`${cls} rounded-full bg-indigo-600/30 flex items-center justify-center shrink-0 border border-indigo-800/40`}>
      <span className="text-indigo-300 font-semibold">{initials}</span>
    </div>
  );
}

const SMS_STATUS = { Y: { label: "Sent", cls: "text-emerald-400" }, F: { label: "Failed", cls: "text-red-400" }, N: { label: "Pending", cls: "text-gray-500" }, Q: { label: "Queued", cls: "text-amber-400" }, B: { label: "Bounced", cls: "text-orange-400" } };

// ── Tab: Loans ─────────────────────────────────────────────────────────────────

const LOAN_STATUS_COLORS = {
  pending:          "bg-yellow-900/40 text-yellow-400",
  first_review:     "bg-yellow-900/30 text-yellow-300",
  approved:         "bg-blue-900/40 text-blue-400",
  disbursed:        "bg-emerald-900/40 text-emerald-400",
  paid_off:         "bg-gray-700 text-gray-400",
  rejected:         "bg-red-900/40 text-red-400",
  writternoff:      "bg-orange-900/40 text-orange-400",
  cancelled:        "bg-gray-800 text-gray-500",
};

const SCHED_STATUS = { paid: "text-emerald-400", partial: "text-amber-400", notpaid: "text-gray-500" };
const SCHED_ACTIVITY = { overdue: "bg-red-900/30 border-red-800/30", due: "" };

function LoanDetailPanel({ saccoId, loanId, onClose }) {
  const api = useAdminAxios();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [view,    setView]    = useState("schedule"); // schedule | repayments

  useEffect(() => {
    api.get(`/admin/saccos/${saccoId}/loans`, { params: { loan_id: loanId } })
      .then((r) => setData(r.data?.data))
      .catch((e) => setError(e?.response?.data?.messages?.[0] ?? "Failed to load loan detail"))
      .finally(() => setLoading(false));
  }, [loanId]); // eslint-disable-line

  if (loading) return <tr><td colSpan={7}><div className="py-6 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-indigo-400" /></div></td></tr>;
  if (error)   return <tr><td colSpan={7}><div className="p-4"><TabError msg={error} /></div></td></tr>;

  const { loan, schedule = [], repayments = [], summary = {} } = data ?? {};
  const overdueSch = schedule.filter((s) => s.activity_status === "overdue" && s.payment_status !== "paid");

  return (
    <tr>
      <td colSpan={7} className="bg-gray-50 dark:bg-gray-800/60 border-b border-indigo-900/30 px-0 py-0">
        <div className="p-5 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-0.5">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{loan?.product_name ?? "Loan"} · <span className="font-mono text-indigo-400">{loan?.loan_application_code}</span></p>
              <p className="text-xs text-gray-500">{loan?.product_type} · {loan?.interest_rate}% rate · {loan?.loan_application_tenure_period}m tenure</p>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-900 dark:hover:text-white"><X className="w-4 h-4" /></button>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Disbursed",    v: `UGX ${fmtCur(loan?.disbursed_amount ?? loan?.loan_application_amount)}`, cls: "text-indigo-400" },
              { label: "Outstanding",  v: `UGX ${fmtCur(summary.outstanding ?? 0)}`,    cls: summary.outstanding > 0 ? "text-amber-400" : "text-emerald-400" },
              { label: "Total Paid",   v: `UGX ${fmtCur(summary.total_paid ?? 0)}`,     cls: "text-emerald-400" },
              { label: "Overdue",      v: overdueSch.length > 0 ? `${overdueSch.length} installments` : "None", cls: overdueSch.length > 0 ? "text-red-400" : "text-gray-500" },
            ].map(({ label, v, cls }) => (
              <div key={label} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2.5">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</p>
                <p className={`text-sm font-semibold mt-0.5 ${cls}`}>{v}</p>
              </div>
            ))}
          </div>

          {summary.next_due_date && (
            <p className="text-xs text-gray-500">Next due: <span className="text-gray-300 font-medium">{fmtDate(summary.next_due_date)}</span> · <span className="text-amber-400">UGX {fmtCur(summary.next_due_amount)}</span></p>
          )}

          {/* Sub-tab toggle */}
          <div className="flex gap-1">
            {[["schedule", "Schedule"], ["repayments", `Repayments (${repayments.length})`]].map(([v, l]) => (
              <button key={v} onClick={() => setView(v)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${view === v ? "bg-indigo-600 border-indigo-600 text-white" : "border-gray-300 dark:border-gray-700 text-gray-500 hover:text-gray-900 dark:hover:text-white"}`}>
                {l}
              </button>
            ))}
          </div>

          {view === "schedule" && (
            <div className="overflow-auto rounded-lg border border-gray-200 dark:border-gray-700">
              <table className="w-full text-xs min-w-[580px]">
                <thead className="text-[10px] uppercase tracking-wide text-gray-500 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-4 py-2 text-left">#</th>
                    <th className="px-4 py-2 text-left">Due Date</th>
                    <th className="px-4 py-2 text-right">Principal</th>
                    <th className="px-4 py-2 text-right">Interest</th>
                    <th className="px-4 py-2 text-right">Total</th>
                    <th className="px-4 py-2 text-right">Paid</th>
                    <th className="px-4 py-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700/60">
                  {schedule.map((s) => (
                    <tr key={s.period} className={`${SCHED_ACTIVITY[s.activity_status] ?? ""} transition-colors`}>
                      <td className="px-4 py-2 text-gray-500">{s.period}</td>
                      <td className="px-4 py-2 text-gray-300">{fmtDate(s.due_date)}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-gray-300">{fmtCur(s.principal)}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-gray-500">{fmtCur(s.interest)}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-gray-900 dark:text-white font-medium">{fmtCur(s.total_due)}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-emerald-400">{fmtCur(s.amount_paid)}</td>
                      <td className="px-4 py-2 text-center">
                        <span className={`font-medium ${SCHED_STATUS[s.payment_status] ?? "text-gray-500"}`}>{s.payment_status}</span>
                        {s.activity_status === "overdue" && s.payment_status !== "paid" && <span className="ml-1 text-red-400">(overdue)</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {view === "repayments" && (
            repayments.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No repayments recorded yet.</p>
            ) : (
              <div className="overflow-auto rounded-lg border border-gray-200 dark:border-gray-700">
                <table className="w-full text-xs min-w-[500px]">
                  <thead className="text-[10px] uppercase tracking-wide text-gray-500 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <th className="px-4 py-2 text-left">Code</th>
                      <th className="px-4 py-2 text-right">Amount</th>
                      <th className="px-4 py-2 text-left">Narrative</th>
                      <th className="px-4 py-2 text-left">By</th>
                      <th className="px-4 py-2 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700/60">
                    {repayments.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-800/20">
                        <td className="px-4 py-2 font-mono text-indigo-400">{r.code || "—"}</td>
                        <td className="px-4 py-2 text-right tabular-nums text-gray-900 dark:text-white font-medium">UGX {fmtCur(r.amount)}</td>
                        <td className="px-4 py-2 text-gray-500 truncate max-w-[160px]">{r.narrative || "—"}</td>
                        <td className="px-4 py-2 text-gray-500">{r.processed_by?.trim() || "—"}</td>
                        <td className="px-4 py-2 text-right text-gray-500">{fmtDateTime(r.date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </td>
    </tr>
  );
}

function LoansTab({ saccoId }) {
  const api = useAdminAxios();
  const [data,     setData]     = useState(null);
  const [page,     setPage]     = useState(1);
  const [status,   setStatus]   = useState("");
  const [search,   setSearch]   = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo,   setDateTo]   = useState("");
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [expanded, setExpanded] = useState(null);

  const load = useCallback((p, s, q, df, dt) => {
    setLoading(true);
    setExpanded(null);
    api.get(`/admin/saccos/${saccoId}/loans`, { params: { page: p, status: s, q, date_from: df, date_to: dt } })
      .then((r) => { setData(r.data?.data); setPage(p); })
      .catch((e) => setError(e?.response?.data?.messages?.[0] ?? "Failed to load loans"))
      .finally(() => setLoading(false));
  }, [saccoId]); // eslint-disable-line

  useEffect(() => { load(1, "", "", "", ""); }, []); // eslint-disable-line

  const STATUSES = ["", "pending", "disbursed", "paid_off", "rejected", "approved", "writternoff"];

  const toggleRow = (loanId) => setExpanded((e) => (e === loanId ? null : loanId));
  const applyFilters = () => load(1, status, search, dateFrom, dateTo);
  const clearFilters = () => { setSearch(""); setDateFrom(""); setDateTo(""); load(1, status, "", "", ""); };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            placeholder="Search client or loan code…"
            className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <DatePickerField value={dateFrom} onChange={setDateFrom} clearable />
        <DatePickerField value={dateTo} onChange={setDateTo} clearable />
        <button onClick={applyFilters} className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg">Filter</button>
        {(search || dateFrom || dateTo) && (
          <button onClick={clearFilters} className="text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white px-2 py-2">Clear</button>
        )}
      </div>
      <div className="flex gap-1 flex-wrap">
        {STATUSES.map((s) => (
          <button key={s} onClick={() => { setStatus(s); load(1, s, search, dateFrom, dateTo); }}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${status === s ? "bg-indigo-600 border-indigo-600 text-white" : "border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"}`}>
            {s || "All"}
          </button>
        ))}
      </div>

      {error && <TabError msg={error} onRetry={() => load(page, status, search)} />}

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {loading ? <TabLoader /> : !data?.loans?.length ? (
          <div className="py-12 text-center"><CreditCard className="w-8 h-8 text-gray-700 mx-auto mb-2" /><p className="text-sm text-gray-500">No loans found.</p></div>
        ) : (
          <>
            <div className="overflow-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead className="text-xs text-gray-500 uppercase tracking-wide border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="px-5 py-3 text-left">Client</th>
                    <th className="px-5 py-3 text-left">Loan Code</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                    <th className="px-5 py-3 text-right">Outstanding</th>
                    <th className="px-5 py-3 text-center">Rate</th>
                    <th className="px-5 py-3 text-center">Status</th>
                    <th className="px-5 py-3 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800/60">
                  {data.loans.map((l) => [
                    <tr key={l.loan_id} onClick={() => toggleRow(l.loan_id)}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/30 cursor-pointer transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <ClientPhoto src={l.client_photo} name={l.client_name} size="sm" />
                          <div>
                            <p className="text-sm text-gray-900 dark:text-white font-medium">{l.client_name || "—"}</p>
                            <p className="text-xs text-gray-500">{l.client_phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <p className="font-mono text-xs text-indigo-400">{l.loan_code}</p>
                        {l.product_name && <p className="text-[11px] text-gray-500 mt-0.5">{l.product_name}</p>}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums text-gray-900 dark:text-white">{l.currency} {fmtCur(l.amount)}</td>
                      <td className="px-5 py-3 text-right tabular-nums">
                        {l.status === "disbursed"
                          ? <span className={l.after_disbursement === "overdue" ? "text-red-400 font-medium" : "text-amber-400"}>{fmtCur(l.outstanding_balance)}</span>
                          : <span className="text-gray-600">—</span>}
                      </td>
                      <td className="px-5 py-3 text-center text-xs text-gray-500">{l.interest_rate ? `${l.interest_rate}%` : "—"}</td>
                      <td className="px-5 py-3 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${LOAN_STATUS_COLORS[l.status] ?? "bg-gray-100 dark:bg-gray-800 text-gray-600"}`}>
                          {l.status}{l.after_disbursement === "overdue" ? " ⚠" : ""}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right text-xs text-gray-500">{fmtDate(l.date)}</td>
                    </tr>,
                    expanded === l.loan_id && (
                      <LoanDetailPanel key={`detail-${l.loan_id}`} saccoId={saccoId} loanId={l.loan_id} onClose={() => setExpanded(null)} />
                    ),
                  ])}
                </tbody>
              </table>
            </div>
            <Pager page={page} total={data.total} perPage={25} onPage={(p) => load(p, status, search, dateFrom, dateTo)} />
          </>
        )}
      </div>
    </div>
  );
}

// ── Tab: Transactions ──────────────────────────────────────────────────────────

const TXN_COLORS = {
  deposit:        "bg-emerald-900/30 text-emerald-400",
  withdraw:       "bg-red-900/30 text-red-400",
  loan_repayment: "bg-blue-900/30 text-blue-400",
};

function TransactionsTab({ saccoId }) {
  const api = useAdminAxios();
  const [data,     setData]     = useState(null);
  const [page,     setPage]     = useState(1);
  const [type,     setType]     = useState("");
  const [search,   setSearch]   = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo,   setDateTo]   = useState("");
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [expanded, setExpanded] = useState(null);

  const load = useCallback((p, t, q, df, dt) => {
    setLoading(true);
    api.get(`/admin/saccos/${saccoId}/transactions`, { params: { page: p, type: t, q, date_from: df, date_to: dt } })
      .then((r) => { setData(r.data?.data); setPage(p); })
      .catch((e) => setError(e?.response?.data?.messages?.[0] ?? "Failed to load transactions"))
      .finally(() => setLoading(false));
  }, [saccoId]); // eslint-disable-line

  useEffect(() => { load(1, "", "", "", ""); }, []); // eslint-disable-line

  const applyFilters = () => load(1, type, search, dateFrom, dateTo);
  const clearFilters = () => { setSearch(""); setDateFrom(""); setDateTo(""); setType(""); load(1, "", "", "", ""); };

  return (
    <div className="space-y-4">
      {/* Filters row */}
      <div className="flex gap-2 flex-wrap items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            placeholder="Search client or code…"
            className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <DatePickerField value={dateFrom} onChange={setDateFrom} clearable />
        <DatePickerField value={dateTo} onChange={setDateTo} clearable />
        <button onClick={applyFilters} className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg">Filter</button>
        {(search || dateFrom || dateTo || type) && (
          <button onClick={clearFilters} className="text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white px-2 py-2">Clear</button>
        )}
      </div>

      {/* Type chips */}
      <div className="flex gap-1 flex-wrap">
        {[["", "All"], ["deposit", "Deposits"], ["withdraw", "Withdrawals"], ["loan", "Repayments"]].map(([v, l]) => (
          <button key={v} onClick={() => { setType(v); load(1, v, search, dateFrom, dateTo); }}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${type === v ? "bg-indigo-600 border-indigo-600 text-white" : "border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"}`}>
            {l}
          </button>
        ))}
      </div>

      {error && <TabError msg={error} onRetry={() => applyFilters()} />}

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {loading ? <TabLoader /> : !data?.transactions?.length ? (
          <div className="py-12 text-center"><Activity className="w-8 h-8 text-gray-700 mx-auto mb-2" /><p className="text-sm text-gray-500">No transactions found.</p></div>
        ) : (
          <>
            <div className="overflow-auto">
              <table className="w-full text-sm min-w-[580px]">
                <thead className="text-xs text-gray-500 uppercase tracking-wide border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="px-5 py-3 text-left">Client</th>
                    <th className="px-5 py-3 text-left">Type</th>
                    <th className="px-5 py-3 text-left">Code</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                    <th className="px-5 py-3 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800/60">
                  {data.transactions.map((t, i) => [
                    <tr key={`${t.type}-${t.id ?? i}`}
                      onClick={() => setExpanded((e) => (e === i ? null : i))}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors cursor-pointer">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <ClientPhoto src={t.client_photo} name={t.client_name} size="sm" />
                          <span className="text-sm text-gray-900 dark:text-white">{t.client_name || "—"}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${TXN_COLORS[t.type] ?? "bg-gray-100 dark:bg-gray-800 text-gray-600"}`}>
                          {(t.type ?? "").replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-gray-500">{t.code || "—"}</td>
                      <td className="px-5 py-3 text-right tabular-nums text-gray-900 dark:text-white font-medium">UGX {fmtCur(t.amount)}</td>
                      <td className="px-5 py-3 text-right text-xs text-gray-500">{fmtDateTime(t.txn_date)}</td>
                    </tr>,
                    expanded === i && t.notes && (
                      <tr key={`note-${i}`}>
                        <td colSpan={5} className="px-5 py-2 bg-gray-50 dark:bg-gray-800/40 text-xs text-gray-500 italic border-b border-gray-200 dark:border-gray-800/50">
                          {t.notes}
                        </td>
                      </tr>
                    ),
                  ])}
                </tbody>
              </table>
            </div>
            <Pager page={page} total={data.total} perPage={30} onPage={(p) => load(p, type, search, dateFrom, dateTo)} />
          </>
        )}
      </div>
    </div>
  );
}

// ── Tab: Audit Log ─────────────────────────────────────────────────────────────

function AuditTab({ saccoId }) {
  const api = useAdminAxios();
  const [data,     setData]     = useState(null);
  const [page,     setPage]     = useState(1);
  const [search,   setSearch]   = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo,   setDateTo]   = useState("");
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

  const load = useCallback((p, q, df, dt) => {
    setLoading(true);
    api.get(`/admin/saccos/${saccoId}/audit`, { params: { page: p, q, date_from: df, date_to: dt } })
      .then((r) => { setData(r.data?.data); setPage(p); })
      .catch((e) => setError(e?.response?.data?.messages?.[0] ?? "Failed to load audit log"))
      .finally(() => setLoading(false));
  }, [saccoId]); // eslint-disable-line

  useEffect(() => { load(1, "", "", ""); }, []); // eslint-disable-line

  const applyFilters = () => load(1, search, dateFrom, dateTo);
  const clearFilters = () => { setSearch(""); setDateFrom(""); setDateTo(""); load(1, "", "", ""); };

  const ACTION_COLOR = { POST: "text-emerald-400", DELETE: "text-red-400", PUT: "text-amber-400", GET: "text-sky-400" };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            placeholder="Search action or user…"
            className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <DatePickerField value={dateFrom} onChange={setDateFrom} clearable />
        <DatePickerField value={dateTo} onChange={setDateTo} clearable />
        <button onClick={applyFilters} className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg">Filter</button>
        {(search || dateFrom || dateTo) && (
          <button onClick={clearFilters} className="text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white px-2 py-2">Clear</button>
        )}
      </div>

    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      {error && <div className="p-4"><TabError msg={error} onRetry={() => load(page, search, dateFrom, dateTo)} /></div>}
      {loading ? <TabLoader /> : !data?.logs?.length ? (
        <div className="py-12 text-center"><Shield className="w-8 h-8 text-gray-700 mx-auto mb-2" /><p className="text-sm text-gray-500">No audit logs.</p></div>
      ) : (
        <>
          <div className="divide-y divide-gray-200 dark:divide-gray-800/60">
            {data.logs.map((log) => (
              <div key={log.audit_id} className="px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-mono font-bold ${ACTION_COLOR[log.action_type] ?? "text-gray-600 dark:text-gray-400"}`}>{log.action_type}</span>
                      {log.table && <span className="text-xs text-gray-600 font-mono">{log.table}</span>}
                    </div>
                    <p className="text-sm text-gray-900 dark:text-white mt-0.5 truncate">{log.description || "—"}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-500">{log.user_name}</span>
                      {log.ip && <span className="text-xs text-gray-600">{log.ip}</span>}
                      {log.browser && <span className="text-xs text-gray-600">{log.browser} · {log.platform}</span>}
                    </div>
                  </div>
                  <span className="text-xs text-gray-600 whitespace-nowrap shrink-0">{fmtDateTime(log.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
          <Pager page={page} total={data.total} perPage={30} onPage={(p) => load(p, search, dateFrom, dateTo)} />
        </>
      )}
    </div>
    </div>
  );
}

// ── Tab: Floats ────────────────────────────────────────────────────────────────

function FloatCard({ icon: Icon, label, available, reserved, extra }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4 text-indigo-400" />
        <p className="text-sm font-semibold text-gray-900 dark:text-white">{label}</p>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Available</span>
          <span className="text-emerald-400 font-medium tabular-nums">{available}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Reserved</span>
          <span className="text-amber-400 tabular-nums">{reserved}</span>
        </div>
        {extra?.map(([k, v]) => (
          <div key={k} className="flex justify-between text-sm">
            <span className="text-gray-500">{k}</span>
            <span className="text-gray-300 tabular-nums">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FloatsTab({ saccoId }) {
  const api = useAdminAxios();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    api.get(`/admin/saccos/${saccoId}/floats`)
      .then((r) => setData(r.data?.data))
      .catch((e) => setError(e?.response?.data?.messages?.[0] ?? "Failed to load floats"))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  if (loading) return <TabLoader />;
  if (error)   return <TabError msg={error} />;

  const hasAnything = data?.sms?.length || data?.mobile_money?.length || data?.crb || data?.bank;

  return (
    <div className="space-y-6">
      {!hasAnything && (
        <div className="py-12 text-center bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <Database className="w-8 h-8 text-gray-700 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No float accounts configured for this SACCO.</p>
        </div>
      )}

      {data?.sms?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2"><MessageSquare className="w-3.5 h-3.5" /> SMS Floats</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {data.sms.map((s) => (
              <FloatCard key={s.account_id} icon={MessageSquare} label={s.name || "SMS Wallet"}
                available={`${fmtCur(s.available_sms)} SMS`}
                reserved={`${fmtCur(s.reserved_sms)} SMS`}
                extra={s.billing_type === "postpaid" ? [
                  ["Credit limit", fmtCur(s.credit_limit)],
                  ["Current due", fmtCur(s.current_due)],
                ] : [["Charge / SMS", `UGX ${s.charge_per_sms}`]]}
              />
            ))}
          </div>
        </div>
      )}

      {data?.mobile_money?.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> Mobile Money Floats</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {data.mobile_money.map((m) => (
              <FloatCard key={m.channel_id} icon={Phone} label={`${m.provider} Float`}
                available={`UGX ${fmtCur(m.available_float)}`}
                reserved={`UGX ${fmtCur(m.reserved_float)}`}
              />
            ))}
          </div>
        </div>
      )}

      {data?.crb && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2"><Shield className="w-3.5 h-3.5" /> CRB Float</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <FloatCard icon={Shield} label="CRB Account"
              available={`UGX ${fmtCur(data.crb.available_balance)}`}
              reserved={`UGX ${fmtCur(data.crb.reserved_balance)}`}
            />
          </div>
        </div>
      )}

      {data?.bank && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2"><Banknote className="w-3.5 h-3.5" /> Bank Float</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <FloatCard icon={Banknote} label="Bank Account"
              available={`UGX ${fmtCur(data.bank.available_float)}`}
              reserved={`UGX ${fmtCur(data.bank.reserved_float)}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab: Settings ─────────────────────────────────────────────────────────────

const YN  = { onVal: "yes",    offVal: "no"       };
const AI  = { onVal: "active", offVal: "inactive" };
const OL  = { onVal: "open",   offVal: "locked"   };

const SETTINGS_GROUPS = [
  {
    label: "System Status",
    icon: Building2,
    fields: [
      { key: "sacco_status",        label: "SACCO Active",   hint: "Whether this SACCO is active on the platform", ...AI },
      { key: "sacco_system_status", label: "System Open",    hint: "Unlocks all system access; set to locked for maintenance", ...OL },
    ],
  },
  {
    label: "Communication",
    icon: MessageSquare,
    fields: [
      { key: "sacco_sms_status",    label: "SMS Notifications",   hint: "Send SMS to clients for transactions", ...YN },
      { key: "sacco_email_status",  label: "Email Notifications", hint: "Send email alerts to clients", ...YN },
      { key: "sacco_loan_alerts",   label: "Loan SMS Alerts",     hint: "SMS alerts for loan due dates", ...YN },
    ],
  },
  {
    label: "Loan Settings",
    icon: CreditCard,
    fields: [
      { key: "sacco_loan_penalties",   label: "Loan Penalties", hint: "Auto-charge penalties on overdue loans", ...YN },
      { key: "sacco_loan_auto_charge", label: "Auto Charge",    hint: "Automatically charge loan repayments", ...YN },
    ],
  },
  {
    label: "Digital Access",
    icon: Globe,
    fields: [
      { key: "sacco_client_portal_login", label: "Client Portal Login", hint: "Allow clients to log into the web portal", ...YN },
    ],
  },
  {
    label: "Staff Mobile App",
    icon: Smartphone,
    fields: [
      { key: "sacco_staff_mobile_app",    label: "Staff App Enabled",        hint: "Enable the staff mobile app for this SACCO", ...YN },
      { key: "sacco_mobile_app_login",    label: "Mobile App Login",         hint: "Allow staff to authenticate via mobile app", ...YN },
      { key: "app_deposits",              label: "Individual Deposits",      hint: "Enable deposits via mobile app", ...YN },
      { key: "app_withdrawals",           label: "Individual Withdrawals",   hint: "Enable withdrawals via mobile app", ...YN },
      { key: "app_group_deposits",        label: "Group Deposits",           hint: "Group deposits via mobile app", ...YN },
      { key: "app_group_withdrawals",     label: "Group Withdrawals",        hint: "Group withdrawals via mobile app", ...YN },
      { key: "app_joint_deposits",        label: "Joint Account Deposits",   hint: "Joint account deposits via mobile app", ...YN },
      { key: "app_joint_withdrawals",     label: "Joint Account Withdrawals",hint: "Joint account withdrawals via mobile app", ...YN },
      { key: "app_company_deposits",      label: "Company Deposits",         hint: "Company deposits via mobile app", ...YN },
      { key: "app_company_withdrawals",   label: "Company Withdrawals",      hint: "Company withdrawals via mobile app", ...YN },
      { key: "app_loan_applications",     label: "Loan Applications",        hint: "Submit loan applications via mobile app", ...YN },
      { key: "app_new_client",            label: "New Client Registration",  hint: "Register new individual clients via mobile app", ...YN },
      { key: "app_group_registration",    label: "Group Registration",       hint: "Register new groups via mobile app", ...YN },
      { key: "app_joint_registration",    label: "Joint Account Registration",hint: "Register joint accounts via mobile app", ...YN },
      { key: "app_company_registration",  label: "Company Registration",     hint: "Register companies via mobile app", ...YN },
      { key: "app_show_balance",          label: "Show Balance",             hint: "Show account balance in mobile app", ...YN },
      { key: "app_loan_calculator",       label: "Loan Calculator",          hint: "Show loan calculator in mobile app", ...YN },
    ],
  },
];

function SettingsTab({ saccoId }) {
  const api = useAdminAxios();
  const [info,       setInfo]      = useState(null);
  const [settings,   setSettings]  = useState(null);
  const [loading,    setLoading]   = useState(true);
  const [saving,     setSaving]    = useState({});
  const [infoSaving, setInfoSaving]= useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [infoForm,   setInfoForm]  = useState(null);
  const [infoEdit,   setInfoEdit]  = useState(false);
  const [error,      setError]     = useState("");
  const [infoError,  setInfoError] = useState("");

  useEffect(() => {
    api.get(`/admin/saccos/${saccoId}/settings`)
      .then((r) => {
        setInfo(r.data?.data?.info);
        setSettings(r.data?.data?.settings);
        setInfoForm(r.data?.data?.info);
      })
      .catch((e) => setError(e?.response?.data?.messages?.[0] ?? "Failed to load settings"))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  const toggle = async (key, onVal, offVal) => {
    const cur    = settings[key];
    const newVal = cur === onVal ? offVal : onVal;
    setSaving((s) => ({ ...s, [key]: true }));
    try {
      const res = await api.put(`/admin/saccos/${saccoId}/settings`, { [key]: newVal });
      setSettings(res.data?.data?.settings ?? { ...settings, [key]: newVal });
    } catch (e) {
      setError(e?.response?.data?.messages?.[0] ?? "Update failed");
    } finally {
      setSaving((s) => { const n = { ...s }; delete n[key]; return n; });
    }
  };

  const saveInfo = async (e) => {
    e.preventDefault();
    setInfoSaving(true); setInfoError("");
    try {
      const res = await api.put(`/admin/saccos/${saccoId}/settings`, infoForm);
      setInfo(res.data?.data?.info ?? infoForm);
      setInfoEdit(false);
    } catch (err) {
      setInfoError(err?.response?.data?.messages?.[0] ?? "Save failed");
    } finally { setInfoSaving(false); }
  };

  const uploadLogo = async (file) => {
    if (!file) return;
    setLogoUploading(true);
    const fd = new FormData();
    fd.append("logo", file);
    try {
      const res = await api.post(`/admin/saccos/${saccoId}/logo`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const newLogo = res.data?.data?.logo_url;
      setInfo((prev) => ({ ...prev, sacco_logo: newLogo }));
    } catch (err) {
      setError(err?.response?.data?.messages?.[0] ?? "Logo upload failed");
    } finally { setLogoUploading(false); }
  };

  if (loading) return <TabLoader />;
  if (error && !settings) return <TabError msg={error} />;

  const IF = (key) => ({ value: infoForm?.[key] ?? "", onChange: (e) => setInfoForm((f) => ({ ...f, [key]: e.target.value })) });

  return (
    <div className="space-y-6">
      {error && <TabError msg={error} />}

      {/* Basic Info */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-200 dark:border-gray-800">
          <Building2 className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Basic Information</h3>
          <button onClick={() => { setInfoEdit((v) => !v); setInfoError(""); }}
            className="ml-auto text-xs text-indigo-400 hover:text-indigo-300">
            {infoEdit ? "Cancel" : "Edit"}
          </button>
        </div>

        {/* Logo */}
        <div className="flex items-center gap-4 px-5 py-4 border-b border-gray-200 dark:border-gray-800">
          {info?.sacco_logo
            ? <img src={saccoLogoUrl(info.sacco_logo)} alt="Logo" className="w-16 h-16 rounded-xl object-cover border border-gray-700" />
            : <div className="w-16 h-16 rounded-xl bg-indigo-600/20 flex items-center justify-center border border-gray-700"><Building2 className="w-7 h-7 text-indigo-400" /></div>
          }
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">SACCO Logo</p>
            <label className={`flex items-center gap-1.5 text-xs text-indigo-400 cursor-pointer hover:text-indigo-300 ${logoUploading ? "opacity-50 pointer-events-none" : ""}`}>
              {logoUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {logoUploading ? "Uploading…" : "Upload new logo"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadLogo(e.target.files?.[0])} />
            </label>
            <p className="text-[11px] text-gray-500 mt-0.5">JPG, PNG, WEBP — max 2 MB</p>
          </div>
        </div>

        {infoEdit ? (
          <form onSubmit={saveInfo} className="p-5 space-y-4">
            {infoError && <p className="text-xs text-red-400">{infoError}</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: "SACCO Name",           key: "sacco_name" },
                { label: "Short Name",            key: "sacco_short_name" },
                { label: "Contact",               key: "sacco_contact" },
                { label: "Email(s)",              key: "sacco_emails" },
                { label: "Extra Email(s)",         key: "sacco_extra_emails" },
                { label: "Location",              key: "sacco_location" },
                { label: "Registration Date",     key: "sacco_registration_date", type: "date" },
              ].map(({ label, key, type = "text" }) => (
                <div key={key}>
                  <label className="block text-[11px] text-gray-500 mb-1">{label}</label>
                  <input type={type} {...IF(key)}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={infoSaving}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50">
                {infoSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save
              </button>
              <button type="button" onClick={() => { setInfoEdit(false); setInfoForm(info); }}
                className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white px-4 py-2 rounded-lg">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-gray-800">
            {[
              { label: "SACCO Name",       val: info?.sacco_name },
              { label: "Short Name",       val: info?.sacco_short_name },
              { label: "Contact",          val: info?.sacco_contact },
              { label: "Email",            val: info?.sacco_emails },
              { label: "Location",         val: info?.sacco_location },
              { label: "Registered",       val: info?.sacco_registration_date ? fmtDate(info.sacco_registration_date) : "—" },
            ].map(({ label, val }) => (
              <div key={label} className="px-5 py-3">
                <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-0.5">{label}</p>
                <p className="text-sm text-gray-900 dark:text-white">{val || "—"}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Toggle groups */}
      {settings && SETTINGS_GROUPS.map(({ label, icon: Icon, fields }) => (
        <div key={label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-200 dark:border-gray-800">
            <Icon className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{label}</h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-800/50">
            {fields.map(({ key, label: fl, hint, onVal, offVal }) => {
              const val = settings[key];
              const on  = val === onVal;
              return (
                <div key={key} className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <p className="text-sm text-gray-900 dark:text-white">{fl}</p>
                    {hint && <p className="text-xs text-gray-500 mt-0.5">{hint}</p>}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-xs ${on ? "text-emerald-400" : "text-gray-600"}`}>{on ? "On" : "Off"}</span>
                    <Toggle value={val} onValue={onVal} offValue={offVal} onChange={() => toggle(key, onVal, offVal)} disabled={!!saving[key]} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Tab: Notifications ─────────────────────────────────────────────────────────

function NotificationsTab({ saccoId }) {
  const api = useAdminAxios();
  const [triggers, setTriggers] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState({});
  const [seeding,  setSeeding]  = useState(false);
  const [error,    setError]    = useState("");

  useEffect(() => {
    api.get(`/admin/saccos/${saccoId}/notifications`)
      .then((r) => setTriggers(r.data?.data?.triggers ?? []))
      .catch((e) => setError(e?.response?.data?.messages?.[0] ?? "Failed to load triggers"))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  const seedDefaults = async () => {
    setSeeding(true);
    try {
      const res = await api.post(`/admin/saccos/${saccoId}/notifications`, { action: "seed_defaults" });
      setTriggers(res.data?.data?.triggers ?? []);
    } catch (e) {
      setError(e?.response?.data?.messages?.[0] ?? "Seeding failed");
    } finally { setSeeding(false); }
  };

  const toggle = async (trigger) => {
    const newStatus = trigger.status === "Active" ? "Inactive" : "Active";
    setSaving((s) => ({ ...s, [trigger.trigger_id]: true }));
    try {
      const res = await api.put(`/admin/saccos/${saccoId}/notifications`, {
        trigger_id: trigger.trigger_id,
        status: newStatus,
      });
      setTriggers(res.data?.data?.triggers ?? []);
    } catch (e) {
      setError(e?.response?.data?.messages?.[0] ?? "Update failed");
    } finally {
      setSaving((s) => { const n = { ...s }; delete n[trigger.trigger_id]; return n; });
    }
  };

  if (loading) return <TabLoader />;

  return (
    <div className="space-y-4">
      {error && <TabError msg={error} />}

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-200 dark:border-gray-800">
          <Bell className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notification Triggers</h3>
          <span className="ml-auto text-xs text-gray-500 mr-3">{triggers.length} triggers</span>
          <button onClick={seedDefaults} disabled={seeding}
            className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 border border-indigo-900/50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
            {seeding ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
            Seed Defaults
          </button>
        </div>

        {triggers.length === 0 ? (
          <div className="py-12 text-center">
            <Bell className="w-8 h-8 text-gray-700 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No notification triggers configured.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-800/50">
            {triggers.map((t) => (
              <div key={t.trigger_id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-sm text-gray-900 dark:text-white">{t.trigger_name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-mono text-gray-600">{t.trigger_identifier}</span>
                    {t.description && <span className="text-xs text-gray-500">· {t.description}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs ${t.status === "Active" ? "text-emerald-400" : "text-gray-600"}`}>{t.status}</span>
                  <button
                    onClick={() => toggle(t)}
                    disabled={!!saving[t.trigger_id]}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-40 ${t.status === "Active" ? "bg-indigo-600" : "bg-gray-700"}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${t.status === "Active" ? "translate-x-5" : "translate-x-1"}`} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tab: Staff ────────────────────────────────────────────────────────────────

function StaffTab({ saccoId }) {
  const api = useAdminAxios();
  const [data,     setData]     = useState(null);
  const [page,     setPage]     = useState(1);
  const [q,        setQ]        = useState("");
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [formErr,  setFormErr]  = useState("");
  const [addedPin, setAddedPin] = useState(null);
  const [form,     setForm]     = useState({
    firstname:"", lastname:"", email:"", contact:"", gender:"Male",
    job_title:"", department:"", role_id:"", branch_id:"", password:"", data_privilege:"branch",
  });

  const load = useCallback((p, search) => {
    setLoading(true);
    api.get(`/admin/saccos/${saccoId}/staff`, { params: { page: p, q: search } })
      .then((r) => { setData(r.data?.data); setPage(p); })
      .catch((e) => setError(e?.response?.data?.messages?.[0] ?? "Failed to load staff"))
      .finally(() => setLoading(false));
  }, [saccoId]); // eslint-disable-line

  useEffect(() => { load(1, ""); }, []); // eslint-disable-line

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true); setFormErr("");
    try {
      const res = await api.post(`/admin/saccos/${saccoId}/staff`, form);
      setAddedPin({ pin: res.data?.data?.temp_pin, email: form.email });
      setShowForm(false);
      setForm({ firstname:"",lastname:"",email:"",contact:"",gender:"Male",job_title:"",department:"",role_id:"",branch_id:"",password:"",data_privilege:"branch" });
      load(1, q);
    } catch (err) {
      const msg = err?.response?.data?.messages;
      setFormErr(Array.isArray(msg) ? msg.join(" ") : (msg ?? "Failed to create staff"));
    } finally { setSaving(false); }
  };

  const roles    = data?.roles    ?? [];
  const branches = data?.branches ?? [];

  return (
    <div className="space-y-4">
      {addedPin && (
        <div className="bg-green-900/20 border border-green-700/40 rounded-xl p-4 flex gap-3 items-start">
          <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-green-300">Staff onboarded — {addedPin.email}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Temp PIN: <span className="font-mono text-gray-900 dark:text-white">{addedPin.pin}</span> · Share securely; staff must change on first login.</p>
          </div>
          <button onClick={() => setAddedPin(null)} className="ml-auto text-gray-600 hover:text-gray-600 dark:text-gray-400 shrink-0"><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load(1, q)}
            placeholder="Search staff…"
            className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <UserPlus className="w-4 h-4" /> Add Staff
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2"><UserPlus className="w-4 h-4 text-indigo-400" /> New Staff Member</h3>
          {formErr && <p className="text-xs text-red-400 bg-red-900/20 border border-red-800/30 rounded px-3 py-2">{formErr}</p>}
          <div className="grid grid-cols-2 gap-3">
            {[["First Name *","firstname"],["Last Name *","lastname"],["Email *","email"],["Contact","contact"],["Job Title","job_title"],["Department","department"]].map(([label,key]) => (
              <div key={key}>
                <label className="block text-xs text-gray-500 mb-1">{label}</label>
                <input value={form[key]} onChange={(e) => setForm(f => ({...f,[key]:e.target.value}))}
                  className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            ))}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Role *</label>
              <select value={form.role_id} onChange={(e) => setForm(f => ({...f,role_id:e.target.value}))}
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Select role…</option>
                {roles.map(r => <option key={r.role_id} value={r.role_id}>{r.role_title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Branch *</label>
              <select value={form.branch_id} onChange={(e) => setForm(f => ({...f,branch_id:e.target.value}))}
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Select branch…</option>
                {branches.map(b => <option key={b.branch_id} value={b.branch_id}>{b.branch_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Gender</label>
              <select value={form.gender} onChange={(e) => setForm(f => ({...f,gender:e.target.value}))}
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="Male">Male</option><option value="Female">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Data Privilege</label>
              <select value={form.data_privilege} onChange={(e) => setForm(f => ({...f,data_privilege:e.target.value}))}
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="branch">Branch</option><option value="sacco">SACCO</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Password *</label>
              <input type="password" value={form.password} onChange={(e) => setForm(f => ({...f,password:e.target.value}))}
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? "Saving…" : "Create Staff"}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg text-sm transition-colors">Cancel</button>
          </div>
        </form>
      )}

      {error && <TabError msg={error} onRetry={() => load(page, q)} />}

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {loading ? <TabLoader /> : !data?.staff?.length ? (
          <div className="py-12 text-center"><Users className="w-8 h-8 text-gray-700 mx-auto mb-2" /><p className="text-sm text-gray-500">No staff found.</p></div>
        ) : (
          <>
            <div className="overflow-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead className="text-xs text-gray-500 uppercase tracking-wide border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="px-5 py-3 text-left">Name</th>
                    <th className="px-5 py-3 text-left">Contact</th>
                    <th className="px-5 py-3 text-left">Role</th>
                    <th className="px-5 py-3 text-left">Branch</th>
                    <th className="px-5 py-3 text-center">Status</th>
                    <th className="px-5 py-3 text-center">Login</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800/60">
                  {data.staff.map((u) => (
                    <tr key={u.user_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-5 py-3">
                        <p className="text-sm text-gray-900 dark:text-white">{u.name}</p>
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-600 dark:text-gray-400">{u.contact || "—"}</td>
                      <td className="px-5 py-3 text-xs text-gray-300">{u.role || "—"}</td>
                      <td className="px-5 py-3 text-xs text-gray-600 dark:text-gray-400">{u.branch || "—"}</td>
                      <td className="px-5 py-3 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${u.status === "active" ? "bg-emerald-900/40 text-emerald-400" : "bg-gray-100 dark:bg-gray-800 text-gray-500"}`}>{u.status}</span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={`text-xs ${u.can_login === "yes" ? "text-emerald-400" : "text-gray-600"}`}>{u.can_login === "yes" ? "Yes" : "No"}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager page={page} total={data.total} perPage={25} onPage={(p) => load(p, q)} />
          </>
        )}
      </div>
    </div>
  );
}

// ── Tab: Clients ──────────────────────────────────────────────────────────────

const CLIENT_TYPE_COLORS = {
  individual:   "bg-sky-900/40 text-sky-400",
  group:        "bg-purple-900/40 text-purple-400",
  company:      "bg-amber-900/40 text-amber-400",
  joint_account:"bg-teal-900/40 text-teal-400",
};

function ClientsTab({ saccoId }) {
  const api = useAdminAxios();
  const [data,     setData]     = useState(null);
  const [page,     setPage]     = useState(1);
  const [search,   setSearch]   = useState("");
  const [type,     setType]     = useState("");
  const [status,   setStatus]   = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo,   setDateTo]   = useState("");
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

  const load = useCallback((p, q, t, s, df, dt) => {
    setLoading(true);
    api.get(`/admin/saccos/${saccoId}/clients`, { params: { page: p, q, type: t, status: s, date_from: df, date_to: dt } })
      .then((r) => { setData(r.data?.data); setPage(p); })
      .catch((e) => setError(e?.response?.data?.messages?.[0] ?? "Failed to load clients"))
      .finally(() => setLoading(false));
  }, [saccoId]); // eslint-disable-line

  useEffect(() => { load(1, "", "", "", "", ""); }, []); // eslint-disable-line

  const apply    = () => load(1, search, type, status, dateFrom, dateTo);
  const clearAll = () => { setSearch(""); setDateFrom(""); setDateTo(""); load(1, "", type, status, "", ""); };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && apply()}
            placeholder="Name, phone, or account #…"
            className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <select value={type} onChange={(e) => { setType(e.target.value); load(1, search, e.target.value, status, dateFrom, dateTo); }}
          className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">All types</option>
          <option value="individual">Individual</option>
          <option value="group">Group</option>
          <option value="company">Company</option>
          <option value="joint_account">Joint Account</option>
        </select>
        <select value={status} onChange={(e) => { setStatus(e.target.value); load(1, search, type, e.target.value, dateFrom, dateTo); }}
          className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <DatePickerField value={dateFrom} onChange={setDateFrom} clearable />
        <DatePickerField value={dateTo} onChange={setDateTo} clearable />
        <button onClick={apply} className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg">Filter</button>
        {(search || dateFrom || dateTo) && (
          <button onClick={clearAll} className="text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white px-2 py-2">Clear</button>
        )}
      </div>

      {error && <TabError msg={error} onRetry={() => apply()} />}

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {loading ? <TabLoader /> : !data?.clients?.length ? (
          <div className="py-12 text-center"><Users className="w-8 h-8 text-gray-700 mx-auto mb-2" /><p className="text-sm text-gray-500">No clients found.</p></div>
        ) : (
          <>
            <div className="overflow-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead className="text-xs text-gray-500 uppercase tracking-wide border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="px-5 py-3 text-left">Client</th>
                    <th className="px-5 py-3 text-left">Account #</th>
                    <th className="px-5 py-3 text-left">Type</th>
                    <th className="px-5 py-3 text-right">Savings</th>
                    <th className="px-5 py-3 text-center">Loans</th>
                    <th className="px-5 py-3 text-center">Status</th>
                    <th className="px-5 py-3 text-right">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800/60">
                  {data.clients.map((c) => (
                    <tr key={c.client_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <ClientPhoto src={c.photo} name={c.name} size="sm" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{c.name}</p>
                            <p className="text-xs text-gray-500">{c.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-gray-500">{c.account_no || "—"}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${CLIENT_TYPE_COLORS[c.type] ?? "bg-gray-100 dark:bg-gray-800 text-gray-600"}`}>
                          {(c.type ?? "").replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums text-gray-300">
                        {c.total_balance > 0 ? `UGX ${fmtCur(c.total_balance)}` : <span className="text-gray-600">—</span>}
                      </td>
                      <td className="px-5 py-3 text-center text-xs">
                        {c.active_loans > 0
                          ? <span className="text-amber-400 font-medium">{c.active_loans} active</span>
                          : <span className="text-gray-600">—</span>}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={`text-xs ${c.status === "active" ? "text-emerald-400" : "text-gray-500"}`}>{c.status}</span>
                      </td>
                      <td className="px-5 py-3 text-right text-xs text-gray-500">{fmtDate(c.date_joined)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager page={page} total={data.total} perPage={25} onPage={(p) => load(p, search, type, status, dateFrom, dateTo)} />
          </>
        )}
      </div>
    </div>
  );
}

// ── Tab: Messaging (SMS + Emails + USSD) ──────────────────────────────────────

function MessagingTab({ saccoId }) {
  const api = useAdminAxios();
  const [section,     setSection]     = useState("sms");
  const [accounts,    setAccounts]    = useState(null);
  const [smsLog,      setSmsLog]      = useState(null);
  const [emailLog,    setEmailLog]    = useState(null);
  const [smsLogP,     setSmsLogP]     = useState(1);
  const [emlLogP,     setEmlLogP]     = useState(1);
  const [smsSearch,   setSmsSearch]   = useState("");
  const [smsDateFrom, setSmsDateFrom] = useState("");
  const [smsDateTo,   setSmsDateTo]   = useState("");
  const [emlSearch,   setEmlSearch]   = useState("");
  const [emlDateFrom, setEmlDateFrom] = useState("");
  const [emlDateTo,   setEmlDateTo]   = useState("");
  const [editing,     setEditing]     = useState(null);  // account id being edited
  const [topUpId,     setTopUpId]     = useState(null);  // account id for top-up form
  const [topUpUnits,  setTopUpUnits]  = useState("");
  const [topUpNotes,  setTopUpNotes]  = useState("");
  const [txId,        setTxId]        = useState(null);  // account id whose tx history is open
  const [floatTx,     setFloatTx]     = useState({});    // { [accountId]: { rows, total, loading } }
  const [saving,      setSaving]      = useState(false);
  const [editForm,    setEditForm]    = useState({});
  const [error,       setError]       = useState("");
  const [loadingA,    setLoadingA]    = useState(true);
  const [loadingS,    setLoadingS]    = useState(false);
  const [loadingE,    setLoadingE]    = useState(false);
  const [smsStatus,   setSmsStatus]   = useState("");
  const [emlStatus,   setEmlStatus]   = useState("");
  const [selectedSms, setSelectedSms] = useState(new Set());
  const [selectedEml, setSelectedEml] = useState(new Set());
  const [resendingSms, setResendingSms] = useState(false);
  const [resendingEml, setResendingEml] = useState(false);
  const [exportingSmsLog, setExportingSmsLog] = useState(false);

  useEffect(() => {
    api.get(`/admin/saccos/${saccoId}/sms`)
      .then((r) => setAccounts(r.data?.data))
      .catch((e) => setError(e?.response?.data?.messages?.[0] ?? "Failed to load SMS accounts"))
      .finally(() => setLoadingA(false));
  }, []); // eslint-disable-line

  const loadSmsLog = useCallback((p, q, df, dt, st) => {
    setLoadingS(true);
    api.get(`/admin/saccos/${saccoId}/sms-log`, { params: { page: p, q, date_from: df, date_to: dt, status: st ?? "" } })
      .then((r) => { setSmsLog(r.data?.data); setSmsLogP(p); setSelectedSms(new Set()); })
      .catch((e) => setError(e?.response?.data?.messages?.[0] ?? "Failed to load SMS log"))
      .finally(() => setLoadingS(false));
  }, [saccoId]); // eslint-disable-line

  const loadEmailLog = useCallback((p, q, df, dt, st) => {
    setLoadingE(true);
    api.get(`/admin/saccos/${saccoId}/email-log`, { params: { page: p, q, date_from: df, date_to: dt, status: st ?? "" } })
      .then((r) => { setEmailLog(r.data?.data); setEmlLogP(p); setSelectedEml(new Set()); })
      .catch((e) => setError(e?.response?.data?.messages?.[0] ?? "Failed to load email log"))
      .finally(() => setLoadingE(false));
  }, [saccoId]); // eslint-disable-line

  const resendSms = async (ids) => {
    setResendingSms(true);
    try {
      await api.post(`/admin/saccos/${saccoId}/sms-log`, { ids: Array.from(ids) });
      loadSmsLog(smsLogP, smsSearch, smsDateFrom, smsDateTo, smsStatus);
    } catch (e) {
      setError(e?.response?.data?.messages?.[0] ?? "Resend failed");
    } finally { setResendingSms(false); }
  };

  const exportSmsLog = (type) => {
    const logs = smsLog?.logs ?? [];
    if (!logs.length) return;
    setExportingSmsLog(true);
    const headers = ["Recipient", "Phone", "Message", "Status", "Date"];
    const rows = logs.map(s => [
      s.client_name?.trim() || "—",
      s.phone || "—",
      s.message ?? s.preview ?? "—",
      SMS_STATUS[s.status]?.label ?? s.status ?? "—",
      fmtDateTime(s.timestamp),
    ]);
    const ts = Math.round(+new Date() / 1000);
    try {
      if (type === "pdf") {
        const doc = new jsPDF({ orientation: "landscape", format: "a4" });
        doc.setFontSize(14);
        doc.text("SMS Log", 14, 15);
        if (smsDateFrom || smsDateTo)
          doc.setFontSize(9).text(`Period: ${smsDateFrom || "—"}  →  ${smsDateTo || "—"}`, 14, 22);
        doc.autoTable({
          startY: (smsDateFrom || smsDateTo) ? 26 : 20,
          head: [headers],
          body: rows,
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: "bold" },
          alternateRowStyles: { fillColor: [245, 245, 250] },
          columnStyles: { 2: { cellWidth: 100 } },
        });
        doc.save(`SMS_Log_${ts}.pdf`);
      } else {
        // CSV (opens in Excel)
        const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
        const csv = [headers.map(escape).join(","), ...rows.map(r => r.map(escape).join(","))].join("\r\n");
        fileDownload(new Blob([csv], { type: "text/csv;charset=utf-8;" }), `SMS_Log_${ts}.csv`);
      }
    } catch {
      setError("Export failed. Please try again.");
    } finally {
      setExportingSmsLog(false);
    }
  };

  const resendEmails = async (ids) => {
    setResendingEml(true);
    try {
      await api.post(`/admin/saccos/${saccoId}/email-log`, { ids: Array.from(ids) });
      loadEmailLog(emlLogP, emlSearch, emlDateFrom, emlDateTo, emlStatus);
    } catch (e) {
      setError(e?.response?.data?.messages?.[0] ?? "Resend failed");
    } finally { setResendingEml(false); }
  };

  const loadFloatTx = useCallback(async (accountId, page = 1) => {
    setFloatTx(prev => ({ ...prev, [accountId]: { ...(prev[accountId] ?? {}), loading: true } }));
    try {
      const r = await api.get(`/admin/saccos/${saccoId}/sms/${accountId}`, { params: { page } });
      const d = r.data?.data ?? {};
      setFloatTx(prev => ({ ...prev, [accountId]: { rows: d.transactions ?? [], total: d.total ?? 0, page: d.page ?? 1, loading: false } }));
    } catch {
      setFloatTx(prev => ({ ...prev, [accountId]: { ...(prev[accountId] ?? {}), loading: false, error: true } }));
    }
  }, [saccoId]); // eslint-disable-line

  const handleSection = (s) => {
    setSection(s);
    if (s === "sms-log"   && !smsLog)   loadSmsLog(1, "", "", "", "");
    if (s === "email-log" && !emailLog) loadEmailLog(1, "", "", "", "");
  };

  const toggleTx = (id) => {
    if (txId === id) { setTxId(null); return; }
    setTxId(id);
    if (!floatTx[id]?.rows) loadFloatTx(id, 1);
  };

  const saveAccount = async (id) => {
    setSaving(true);
    try {
      const res = await api.put(`/admin/saccos/${saccoId}/sms/${id}`, editForm);
      const updated = res.data?.data?.account ?? {};
      setAccounts(d => ({ ...d, sms_accounts: (d.sms_accounts ?? []).map(a => a.id === id ? { ...a, ...updated } : a) }));
      setEditing(null);
    } catch (e) {
      setError(e?.response?.data?.messages?.[0] ?? "Update failed");
    } finally { setSaving(false); }
  };

  const toggleActive = async (a) => {
    setSaving(true);
    try {
      const res = await api.put(`/admin/saccos/${saccoId}/sms/${a.id}`, { is_active: a.is_active ? 0 : 1 });
      const updated = res.data?.data?.account ?? {};
      setAccounts(d => ({ ...d, sms_accounts: (d.sms_accounts ?? []).map(x => x.id === a.id ? { ...x, ...updated } : x) }));
    } catch (e) {
      setError(e?.response?.data?.messages?.[0] ?? "Update failed");
    } finally { setSaving(false); }
  };

  const doTopUp = async (id) => {
    const units = parseInt(topUpUnits, 10);
    if (!units || units <= 0) { setError("Enter a valid number of SMS units"); return; }
    setSaving(true);
    try {
      const res = await api.post(`/admin/saccos/${saccoId}/sms/${id}`, { units, notes: topUpNotes });
      const d = res.data?.data ?? {};
      setAccounts(prev => ({
        ...prev,
        sms_accounts: (prev?.sms_accounts ?? []).map(a => a.id === id
          ? { ...a, available_sms: d.available_sms ?? a.available_sms, reserved_sms: d.reserved_sms ?? a.reserved_sms }
          : a
        ),
      }));
      setTopUpId(null); setTopUpUnits(""); setTopUpNotes("");
      // refresh tx history if open
      if (txId === id) loadFloatTx(id, 1);
    } catch (e) {
      setError(e?.response?.data?.messages?.[0] ?? "Top-up failed");
    } finally { setSaving(false); }
  };

  const SECTIONS = [
    { id: "sms",       label: "SMS Accounts" },
    { id: "sms-log",   label: "SMS Log" },
    { id: "email-log", label: "Email Log" },
    { id: "ussd",      label: "USSD Sessions" },
  ];

  return (
    <div className="space-y-5">
      {error && <TabError msg={error} />}

      {/* Section tabs */}
      <div className="flex gap-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-1 w-fit">
        {SECTIONS.map(({ id, label }) => (
          <button key={id} onClick={() => handleSection(id)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${section === id ? "bg-indigo-600 text-white" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── SMS Accounts ── */}
      {section === "sms" && (
        loadingA ? <TabLoader /> : (
          <div className="space-y-4">
            {accounts === null || (accounts?.sms_accounts ?? []).length === 0 ? (
              <div className="py-12 text-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl">
                <MessageSquare className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                <p className="text-sm text-gray-500">{accounts === null ? "Could not load SMS accounts." : "No SMS accounts configured."}</p>
              </div>
            ) : (accounts.sms_accounts ?? []).map((a) => (
              <div key={a.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">

                {/* Card header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-600/15">
                      <MessageSquare className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{a.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{a.billing_type} · UGX {fmtCur(a.charge_per_sms)}/SMS
                        {a.credit_limit > 0 && <span className="ml-2">Limit: UGX {fmt(a.credit_limit)}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${a.is_active ? "bg-emerald-900/30 text-emerald-400" : "bg-gray-800 text-gray-500"}`}>
                      {a.is_active ? "Active" : "Inactive"}
                    </span>
                    <Toggle value={a.is_active ? "active" : "inactive"} onChange={() => toggleActive(a)} disabled={saving} />
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-gray-800">
                  <div className="px-5 py-4 text-center">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Available</p>
                    <p className={`text-xl font-bold tabular-nums ${a.available_sms > 100 ? "text-emerald-400" : a.available_sms > 0 ? "text-amber-400" : "text-red-400"}`}>
                      {Number(a.available_sms).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-gray-600 mt-0.5">SMS units</p>
                  </div>
                  <div className="px-5 py-4 text-center">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Reserved</p>
                    <p className="text-xl font-bold tabular-nums text-gray-400">{Number(a.reserved_sms ?? 0).toLocaleString()}</p>
                    <p className="text-[10px] text-gray-600 mt-0.5">SMS units</p>
                  </div>
                  <div className="px-5 py-4 text-center">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Total Sent</p>
                    <p className="text-xl font-bold tabular-nums text-gray-300">{Number(a.total_sms_sent ?? 0).toLocaleString()}</p>
                    <p className="text-[10px] text-gray-600 mt-0.5">all time</p>
                  </div>
                </div>

                {/* Postpaid due row */}
                {a.billing_type === "postpaid" && (
                  <div className="px-5 py-3 bg-amber-900/10 border-t border-amber-900/20 flex items-center justify-between text-xs">
                    <span className="text-amber-400 font-medium">Outstanding Due: UGX {fmtCur(a.current_due ?? 0)}</span>
                    {a.due_date && <span className="text-gray-500">Due date: {fmtDate(a.due_date)}</span>}
                  </div>
                )}

                {/* Action bar */}
                <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2 flex-wrap">
                  <button onClick={() => { setTopUpId(topUpId === a.id ? null : a.id); setTopUpUnits(""); setTopUpNotes(""); setEditing(null); }}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${topUpId === a.id ? "bg-emerald-600 text-white" : "bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50"}`}>
                    + Top Up Float
                  </button>
                  <button onClick={() => { setEditing(editing === a.id ? null : a.id); setEditForm({ name: a.name, billing_type: a.billing_type, charge_per_sms: a.charge_per_sms, credit_limit: a.credit_limit }); setTopUpId(null); }}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${editing === a.id ? "bg-indigo-600 text-white" : "border border-gray-300 dark:border-gray-700 text-gray-500 hover:text-gray-900 dark:hover:text-white"}`}>
                    Edit
                  </button>
                  <button onClick={() => toggleTx(a.id)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ml-auto ${txId === a.id ? "bg-gray-700 text-white" : "text-gray-500 hover:text-gray-900 dark:hover:text-white"}`}>
                    {txId === a.id ? "Hide History" : "Float History"}
                  </button>
                </div>

                {/* Top-up form */}
                {topUpId === a.id && (
                  <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 space-y-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Top Up SMS Float</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">SMS Units</label>
                        <input type="number" min="1" value={topUpUnits} onChange={(e) => setTopUpUnits(e.target.value)}
                          placeholder="e.g. 1000"
                          className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        {topUpUnits > 0 && a.charge_per_sms > 0 && (
                          <p className="text-[10px] text-emerald-400 mt-1">Cost: UGX {fmtCur(parseInt(topUpUnits,10) * a.charge_per_sms)}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Notes (optional)</label>
                        <input value={topUpNotes} onChange={(e) => setTopUpNotes(e.target.value)}
                          placeholder="Reason or reference…"
                          className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => doTopUp(a.id)} disabled={saving || !topUpUnits}
                        className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-medium px-4 py-2 rounded-lg flex items-center gap-1.5">
                        {saving && <Loader2 className="w-3 h-3 animate-spin" />} Confirm Top Up
                      </button>
                      <button onClick={() => setTopUpId(null)} className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-lg text-xs">Cancel</button>
                    </div>
                  </div>
                )}

                {/* Edit form */}
                {editing === a.id && (
                  <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 space-y-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Edit Account</p>
                    <div className="grid grid-cols-2 gap-3">
                      {[["Name","name","text"],["Charge / SMS (UGX)","charge_per_sms","number"],["Credit Limit (UGX)","credit_limit","number"]].map(([label,key,type]) => (
                        <div key={key}>
                          <label className="block text-xs text-gray-500 mb-1">{label}</label>
                          <input type={type} value={editForm[key] ?? ""} onChange={(e) => setEditForm(f => ({...f,[key]:e.target.value}))}
                            className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                      ))}
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Billing Type</label>
                        <select value={editForm.billing_type ?? ""} onChange={(e) => setEditForm(f => ({...f,billing_type:e.target.value}))}
                          className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                          <option value="prepaid">Prepaid</option>
                          <option value="postpaid">Postpaid</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => saveAccount(a.id)} disabled={saving}
                        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium px-4 py-2 rounded-lg flex items-center gap-1.5">
                        {saving && <Loader2 className="w-3 h-3 animate-spin" />} Save Changes
                      </button>
                      <button onClick={() => setEditing(null)} className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-lg text-xs">Cancel</button>
                    </div>
                  </div>
                )}

                {/* Float transaction history */}
                {txId === a.id && (
                  <div className="border-t border-gray-100 dark:border-gray-800">
                    {floatTx[a.id]?.loading ? (
                      <div className="py-6"><TabLoader /></div>
                    ) : floatTx[a.id]?.error ? (
                      <p className="text-xs text-red-400 px-5 py-4">Failed to load transactions.</p>
                    ) : !floatTx[a.id]?.rows?.length ? (
                      <p className="text-xs text-gray-500 px-5 py-6 text-center">No float transactions yet.</p>
                    ) : (
                      <>
                        <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Float Transaction History</p>
                          <span className="text-xs text-gray-600">{floatTx[a.id]?.total ?? 0} total</span>
                        </div>
                        <div className="overflow-auto">
                          <table className="w-full text-xs min-w-[520px]">
                            <thead className="text-[10px] text-gray-500 uppercase tracking-wide border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                              <tr>
                                <th className="px-5 py-2.5 text-left">Date</th>
                                <th className="px-5 py-2.5 text-center">Action</th>
                                <th className="px-5 py-2.5 text-right">Units</th>
                                <th className="px-5 py-2.5 text-right">Amount</th>
                                <th className="px-5 py-2.5 text-left">Notes</th>
                                <th className="px-5 py-2.5 text-left">By</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                              {floatTx[a.id].rows.map((t) => (
                                <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                                  <td className="px-5 py-2.5 text-gray-500 tabular-nums whitespace-nowrap">{fmtDateTime(t.created_at)}</td>
                                  <td className="px-5 py-2.5 text-center">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${t.action === "credit" ? "bg-emerald-900/30 text-emerald-400" : "bg-red-900/30 text-red-400"}`}>
                                      {t.action}
                                    </span>
                                  </td>
                                  <td className={`px-5 py-2.5 text-right tabular-nums font-medium ${t.action === "credit" ? "text-emerald-400" : "text-red-400"}`}>
                                    {t.action === "credit" ? "+" : "-"}{Number(t.sms_units).toLocaleString()}
                                  </td>
                                  <td className="px-5 py-2.5 text-right tabular-nums text-gray-400">UGX {fmtCur(t.amount)}</td>
                                  <td className="px-5 py-2.5 text-gray-500 max-w-[160px] truncate">{t.notes || "—"}</td>
                                  <td className="px-5 py-2.5 text-gray-500">{t.performed_by_name ?? "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {(floatTx[a.id]?.total ?? 0) > 20 && (
                          <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-1">
                            <button disabled={floatTx[a.id]?.page <= 1}
                              onClick={() => loadFloatTx(a.id, floatTx[a.id].page - 1)}
                              className="p-1 rounded text-gray-500 hover:text-white disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                            <span className="text-xs text-gray-500 px-2 self-center">p.{floatTx[a.id]?.page}</span>
                            <button disabled={floatTx[a.id]?.page * 20 >= floatTx[a.id]?.total}
                              onClick={() => loadFloatTx(a.id, floatTx[a.id].page + 1)}
                              className="p-1 rounded text-gray-500 hover:text-white disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

              </div>
            ))}
          </div>
        )
      )}

      {/* ── SMS Log ── */}
      {section === "sms-log" && (() => {
        const resendable = (smsLog?.logs ?? []).filter(s => ["N","F","B"].includes(s.status));
        const allResendableIds = new Set(resendable.map(s => s.id));
        const allSelected = allResendableIds.size > 0 && [...allResendableIds].every(id => selectedSms.has(id));
        const toggleAllSms = () => setSelectedSms(allSelected ? new Set() : new Set(allResendableIds));
        const toggleSms = (id) => setSelectedSms(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
        return (
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap items-center">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input value={smsSearch} onChange={(e) => setSmsSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && loadSmsLog(1, smsSearch, smsDateFrom, smsDateTo, smsStatus)}
                  placeholder="Search recipient or message…"
                  className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <select value={smsStatus} onChange={(e) => setSmsStatus(e.target.value)}
                className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">All statuses</option>
                {Object.entries(SMS_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <DatePickerField value={smsDateFrom} onChange={setSmsDateFrom} clearable />
              <DatePickerField value={smsDateTo} onChange={setSmsDateTo} clearable />
              <button onClick={() => loadSmsLog(1, smsSearch, smsDateFrom, smsDateTo, smsStatus)} className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg">Filter</button>
              {(smsSearch || smsDateFrom || smsDateTo || smsStatus) && (
                <button onClick={() => { setSmsSearch(""); setSmsDateFrom(""); setSmsDateTo(""); setSmsStatus(""); loadSmsLog(1, "", "", "", ""); }} className="text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white px-2 py-2">Clear</button>
              )}
              <div className="ml-auto flex gap-1.5">
                <button onClick={() => exportSmsLog("pdf")} disabled={exportingSmsLog || !smsLog?.logs?.length}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed">
                  {exportingSmsLog ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />} PDF
                </button>
                <button onClick={() => exportSmsLog("csv")} disabled={exportingSmsLog || !smsLog?.logs?.length}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed">
                  {exportingSmsLog ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />} Excel
                </button>
              </div>
            </div>

            {/* Selection action bar */}
            {selectedSms.size > 0 && (
              <div className="flex items-center gap-3 px-4 py-3 bg-indigo-600/10 border border-indigo-600/30 rounded-xl">
                <span className="text-sm text-indigo-400 font-medium">{selectedSms.size} selected</span>
                <button onClick={() => resendSms(selectedSms)} disabled={resendingSms}
                  className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg">
                  {resendingSms ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                  Resend {selectedSms.size}
                </button>
                <button onClick={() => setSelectedSms(new Set())} className="text-xs text-gray-500 hover:text-gray-300 ml-auto">Clear selection</button>
              </div>
            )}

            {smsLog?.stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Total",   v: smsLog.stats.total,   cls: "text-gray-300" },
                  { label: "Sent",    v: smsLog.stats.sent,    cls: "text-emerald-400" },
                  { label: "Failed",  v: smsLog.stats.failed,  cls: "text-red-400" },
                  { label: "Pending", v: smsLog.stats.pending, cls: "text-amber-400" },
                ].map(({ label, v, cls }) => (
                  <div key={label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</p>
                    <p className={`text-lg font-bold mt-0.5 ${cls}`}>{Number(v ?? 0).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              {loadingS ? <TabLoader /> : !smsLog?.logs?.length ? (
                <div className="py-12 text-center"><MessageSquare className="w-7 h-7 text-gray-700 mx-auto mb-2" /><p className="text-sm text-gray-500">No SMS log entries.</p></div>
              ) : (
                <>
                  <div className="overflow-auto">
                    <table className="w-full text-sm min-w-[600px]">
                      <thead className="text-xs text-gray-500 uppercase tracking-wide border-b border-gray-200 dark:border-gray-800">
                        <tr>
                          <th className="px-4 py-3 w-8">
                            <input type="checkbox" checked={allSelected} onChange={toggleAllSms}
                              className="rounded border-gray-600 bg-gray-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0" />
                          </th>
                          <th className="px-4 py-3 text-left">Recipient</th>
                          <th className="px-4 py-3 text-left">Message</th>
                          <th className="px-4 py-3 text-center">Status</th>
                          <th className="px-4 py-3 text-right">Date</th>
                          <th className="px-4 py-3 w-12"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-800/60">
                        {smsLog.logs.map((s) => {
                          const st = SMS_STATUS[s.status] ?? { label: s.status, cls: "text-gray-500" };
                          const canResend = ["N","F","B"].includes(s.status);
                          const isSel = selectedSms.has(s.id);
                          return (
                            <tr key={s.id} className={`hover:bg-gray-800/20 ${isSel ? "bg-indigo-600/5" : ""}`}>
                              <td className="px-4 py-3 w-8">
                                {canResend && (
                                  <input type="checkbox" checked={isSel} onChange={() => toggleSms(s.id)}
                                    className="rounded border-gray-600 bg-gray-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0" />
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2.5">
                                  <ClientPhoto src={s.client_photo} name={s.client_name} size="sm" />
                                  <div>
                                    <p className="text-sm text-gray-900 dark:text-white">{s.client_name?.trim() || "—"}</p>
                                    <p className="text-xs text-gray-500">{s.phone}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px] truncate">{s.preview}</td>
                              <td className="px-4 py-3 text-center text-xs font-medium">
                                <span className={st.cls}>{st.label}</span>
                              </td>
                              <td className="px-4 py-3 text-right text-xs text-gray-500 whitespace-nowrap">{fmtDateTime(s.timestamp)}</td>
                              <td className="px-4 py-3 w-12">
                                {canResend && (
                                  <button onClick={() => resendSms(new Set([s.id]))} disabled={resendingSms} title="Resend"
                                    className="p-1 rounded text-gray-500 hover:text-indigo-400 disabled:opacity-40">
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <Pager page={smsLogP} total={smsLog.total} perPage={30} onPage={(p) => loadSmsLog(p, smsSearch, smsDateFrom, smsDateTo, smsStatus)} />
                </>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── Email Log ── */}
      {section === "email-log" && (() => {
        const resendable = (emailLog?.logs ?? []).filter(e => ["N","F","B"].includes(e.status));
        const allResendableIds = new Set(resendable.map(e => e.id));
        const allSelected = allResendableIds.size > 0 && [...allResendableIds].every(id => selectedEml.has(id));
        const toggleAllEml = () => setSelectedEml(allSelected ? new Set() : new Set(allResendableIds));
        const toggleEml = (id) => setSelectedEml(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
        return (
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap items-center">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input value={emlSearch} onChange={(e) => setEmlSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && loadEmailLog(1, emlSearch, emlDateFrom, emlDateTo, emlStatus)}
                  placeholder="Search recipient or subject…"
                  className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg pl-9 pr-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <select value={emlStatus} onChange={(e) => setEmlStatus(e.target.value)}
                className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">All statuses</option>
                {Object.entries(SMS_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <DatePickerField value={emlDateFrom} onChange={setEmlDateFrom} clearable />
              <DatePickerField value={emlDateTo} onChange={setEmlDateTo} clearable />
              <button onClick={() => loadEmailLog(1, emlSearch, emlDateFrom, emlDateTo, emlStatus)} className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg">Filter</button>
              {(emlSearch || emlDateFrom || emlDateTo || emlStatus) && (
                <button onClick={() => { setEmlSearch(""); setEmlDateFrom(""); setEmlDateTo(""); setEmlStatus(""); loadEmailLog(1, "", "", "", ""); }} className="text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white px-2 py-2">Clear</button>
              )}
            </div>

            {/* Selection action bar */}
            {selectedEml.size > 0 && (
              <div className="flex items-center gap-3 px-4 py-3 bg-indigo-600/10 border border-indigo-600/30 rounded-xl">
                <span className="text-sm text-indigo-400 font-medium">{selectedEml.size} selected</span>
                <button onClick={() => resendEmails(selectedEml)} disabled={resendingEml}
                  className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg">
                  {resendingEml ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                  Resend {selectedEml.size}
                </button>
                <button onClick={() => setSelectedEml(new Set())} className="text-xs text-gray-500 hover:text-gray-300 ml-auto">Clear selection</button>
              </div>
            )}

            {emailLog?.stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Total",   v: emailLog.stats.total,   cls: "text-gray-300" },
                  { label: "Sent",    v: emailLog.stats.sent,    cls: "text-emerald-400" },
                  { label: "Failed",  v: emailLog.stats.failed,  cls: "text-red-400" },
                  { label: "Pending", v: emailLog.stats.pending, cls: "text-amber-400" },
                ].map(({ label, v, cls }) => (
                  <div key={label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</p>
                    <p className={`text-lg font-bold mt-0.5 ${cls}`}>{Number(v ?? 0).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              {loadingE ? <TabLoader /> : !emailLog?.logs?.length ? (
                <div className="py-12 text-center"><Mail className="w-7 h-7 text-gray-700 mx-auto mb-2" /><p className="text-sm text-gray-500">No email log entries.</p></div>
              ) : (
                <>
                  <div className="overflow-auto">
                    <table className="w-full text-sm min-w-[600px]">
                      <thead className="text-xs text-gray-500 uppercase tracking-wide border-b border-gray-200 dark:border-gray-800">
                        <tr>
                          <th className="px-4 py-3 w-8">
                            <input type="checkbox" checked={allSelected} onChange={toggleAllEml}
                              className="rounded border-gray-600 bg-gray-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0" />
                          </th>
                          <th className="px-4 py-3 text-left">Recipient</th>
                          <th className="px-4 py-3 text-left">Subject</th>
                          <th className="px-4 py-3 text-center">Status</th>
                          <th className="px-4 py-3 text-right">Date</th>
                          <th className="px-4 py-3 w-12"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-800/60">
                        {emailLog.logs.map((e) => {
                          const st = SMS_STATUS[e.status] ?? { label: e.status, cls: "text-gray-500" };
                          const canResend = ["N","F","B"].includes(e.status);
                          const isSel = selectedEml.has(e.id);
                          return (
                            <tr key={e.id} className={`hover:bg-gray-800/20 ${isSel ? "bg-indigo-600/5" : ""}`}>
                              <td className="px-4 py-3 w-8">
                                {canResend && (
                                  <input type="checkbox" checked={isSel} onChange={() => toggleEml(e.id)}
                                    className="rounded border-gray-600 bg-gray-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0" />
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2.5">
                                  <ClientPhoto src={e.client_photo} name={e.client_name} size="sm" />
                                  <div>
                                    <p className="text-sm text-gray-900 dark:text-white">{e.client_name?.trim() || "—"}</p>
                                    <p className="text-xs text-gray-500">{e.address}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-xs text-gray-300 max-w-[200px] truncate">{e.subject || "—"}</td>
                              <td className="px-4 py-3 text-center text-xs font-medium">
                                <span className={st.cls}>{st.label}</span>
                              </td>
                              <td className="px-4 py-3 text-right text-xs text-gray-500 whitespace-nowrap">{fmtDateTime(e.timestamp)}</td>
                              <td className="px-4 py-3 w-12">
                                {canResend && (
                                  <button onClick={() => resendEmails(new Set([e.id]))} disabled={resendingEml} title="Resend"
                                    className="p-1 rounded text-gray-500 hover:text-indigo-400 disabled:opacity-40">
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <Pager page={emlLogP} total={emailLog.total} perPage={30} onPage={(p) => loadEmailLog(p, emlSearch, emlDateFrom, emlDateTo, emlStatus)} />
                </>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── USSD Sessions ── */}
      {section === "ussd" && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          {loadingA ? <TabLoader /> : (accounts?.ussd_sessions_last_7days ?? []).length === 0 ? (
            <div className="py-12 text-center"><Globe className="w-7 h-7 text-gray-700 mx-auto mb-2" /><p className="text-sm text-gray-500">No USSD sessions recorded.</p></div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-xs text-gray-500 uppercase tracking-wide border-b border-gray-200 dark:border-gray-800">
                <tr><th className="px-5 py-3 text-left">Date</th><th className="px-5 py-3 text-right">Sessions</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800/60">
                {(accounts.ussd_sessions_last_7days ?? []).map((u) => (
                  <tr key={u.day} className="hover:bg-gray-800/20">
                    <td className="px-5 py-3 text-gray-300">{u.day}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-gray-900 dark:text-white font-medium">{Number(u.total).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}


// ── Tab: Reports ──────────────────────────────────────────────────────────────

function MiniBar({ value, max, color }) {
  const pct = max > 0 ? Math.round((Number(value) / max) * 100) : 0;
  return (
    <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function TrendChart({ title, icon: Icon, iconColor, rows, valueKey, barColor, fmtVal }) {
  if (!rows?.length) return null;
  const max = Math.max(1, ...rows.map(r => Number(r[valueKey])));
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
      <p className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Icon className={`w-4 h-4 ${iconColor}`} /> {title}
      </p>
      <div className="space-y-2">
        {rows.map((d) => (
          <div key={d.day} className="flex items-center gap-3 text-xs">
            <span className="text-gray-500 w-20 shrink-0 tabular-nums">{d.day}</span>
            <MiniBar value={d[valueKey]} max={max} color={barColor} />
            <span className="text-gray-400 tabular-nums w-20 text-right shrink-0">{fmtVal(d[valueKey])}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportsTab({ saccoId }) {
  const api = useAdminAxios();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [period,  setPeriod]  = useState("30");

  const load = useCallback((p) => {
    setLoading(true); setError("");
    api.get(`/admin/saccos/${saccoId}/reports`, { params: { period: p } })
      .then((r) => setData(r.data?.data))
      .catch((e) => setError(e?.response?.data?.messages?.[0] ?? "Failed to load reports"))
      .finally(() => setLoading(false));
  }, [saccoId]); // eslint-disable-line

  useEffect(() => { load("30"); }, []); // eslint-disable-line

  if (error) return <TabError msg={error} onRetry={() => load(period)} />;

  const d = data ?? {};
  const loanBkMax = Math.max(1, ...(d.loan_breakdown ?? []).map(l => Number(l.count)));
  const STATUS_CLR = { disbursed:"bg-emerald-500", pending:"bg-amber-500", approved:"bg-blue-500", paid_off:"bg-gray-500", rejected:"bg-red-500", writternoff:"bg-orange-500" };

  return (
    <div className="space-y-5">
      {/* Period picker */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-1">
          {[["7","7 days"],["30","30 days"],["90","90 days"],["365","1 year"]].map(([v, l]) => (
            <button key={v} onClick={() => { setPeriod(v); load(v); }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${period === v ? "bg-indigo-600 text-white" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"}`}>
              {l}
            </button>
          ))}
        </div>
        {!loading && <span className="text-xs text-gray-500">Period: last {d.period_days} days</span>}
      </div>

      {loading ? <TabLoader /> : (
        <>
          {/* Overdue alert */}
          {(d.overdue?.count ?? 0) > 0 && (
            <div className="flex items-start gap-3 bg-red-900/20 border border-red-800/30 rounded-xl px-5 py-3.5">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-red-400">
                  {d.overdue.count} overdue loan{d.overdue.count !== 1 ? "s" : ""}
                  {d.delinquency_rate > 0 && <span className="ml-2 text-xs font-normal text-red-300">({d.delinquency_rate}% delinquency rate)</span>}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 flex flex-wrap gap-3">
                  <span>Overdue amount: <span className="text-red-400">UGX {fmtCur(d.overdue.amount)}</span></span>
                  {d.outstanding > 0 && <span>Outstanding balance: <span className="text-amber-400">UGX {fmtCur(d.outstanding)}</span></span>}
                </p>
              </div>
            </div>
          )}

          {/* Row 1 — transaction KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Deposits",            v: `UGX ${fmt(d.deposits?.amount ?? 0)}`,        sub: `${d.deposits?.count ?? 0} transactions`,       color: "bg-emerald-600/15 text-emerald-400", icon: TrendingUp },
              { label: "Withdrawals",          v: `UGX ${fmt(d.withdrawals?.amount ?? 0)}`,     sub: `${d.withdrawals?.count ?? 0} transactions`,    color: "bg-red-600/15 text-red-400",         icon: Wallet },
              { label: "Loan Repayments",      v: `UGX ${fmt(d.repayments?.amount ?? 0)}`,      sub: `${d.repayments?.count ?? 0} transactions`,     color: "bg-blue-600/15 text-blue-400",       icon: CreditCard },
              { label: "Net Cash Flow",        v: `UGX ${fmt(Math.abs((d.deposits?.amount ?? 0) - (d.withdrawals?.amount ?? 0)))}`,
                sub: (d.deposits?.amount ?? 0) >= (d.withdrawals?.amount ?? 0) ? "net positive" : "net negative",
                color: (d.deposits?.amount ?? 0) >= (d.withdrawals?.amount ?? 0) ? "bg-emerald-600/15 text-emerald-400" : "bg-red-600/15 text-red-400", icon: Activity },
            ].map(({ label, v, sub, color, icon: Icon }) => (
              <div key={label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
                <div className="flex items-start justify-between">
                  <div><p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
                    <p className="text-base font-bold text-gray-900 dark:text-white mt-1">{v}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{sub}</p></div>
                  <div className={`p-2 rounded-lg ${color}`}><Icon className="w-4 h-4" /></div>
                </div>
              </div>
            ))}
          </div>

          {/* Row 2 — loan KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Loan Portfolio",    v: `UGX ${fmt(d.loans?.portfolio ?? 0)}`,      sub: `${d.loans?.total ?? 0} total loans`,           color: "bg-amber-600/15 text-amber-400",   icon: BarChart2 },
              { label: "Active (Disbursed)",v: `${d.loans?.active ?? 0}`,                  sub: `UGX ${fmt(d.loans?.portfolio ?? 0)} principal`, color: "bg-indigo-600/15 text-indigo-400", icon: CreditCard },
              { label: "Outstanding Balance",v:`UGX ${fmt(d.outstanding ?? 0)}`,           sub: "unpaid principal + interest",                  color: "bg-orange-600/15 text-orange-400", icon: AlertCircle },
              { label: "Avg Loan Size",     v: `UGX ${fmt(d.loans?.avg_loan_size ?? 0)}`,  sub: `${d.loans?.period_count ?? 0} issued this period`, color: "bg-teal-600/15 text-teal-400", icon: TrendingUp },
            ].map(({ label, v, sub, color, icon: Icon }) => (
              <div key={label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
                <div className="flex items-start justify-between">
                  <div><p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
                    <p className="text-base font-bold text-gray-900 dark:text-white mt-1">{v}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{sub}</p></div>
                  <div className={`p-2 rounded-lg ${color}`}><Icon className="w-4 h-4" /></div>
                </div>
              </div>
            ))}
          </div>

          {/* Row 3 — savings + clients + collection */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Savings",    v: `UGX ${fmt(d.savings?.total_savings ?? 0)}`, sub: `${d.savings?.accounts ?? 0} active accounts`,  color: "bg-purple-600/15 text-purple-400", icon: Wallet },
              { label: "All Clients",      v: `${d.client_stats?.total ?? 0}`,              sub: `${d.client_stats?.active ?? 0} active / ${d.client_stats?.inactive ?? 0} inactive`, color: "bg-sky-600/15 text-sky-400", icon: Users },
              { label: "New Clients",      v: `${d.new_clients ?? 0}`,                      sub: `in last ${d.period_days} days`,                 color: "bg-teal-600/15 text-teal-400",    icon: UserPlus },
              { label: "Collection Rate",  v: d.collection_rate !== null ? `${d.collection_rate}%` : "—",
                sub: `UGX ${fmt(d.month_collection?.collected ?? 0)} of ${fmt(d.month_collection?.expected ?? 0)} due`,
                color: (d.collection_rate ?? 0) >= 80 ? "bg-emerald-600/15 text-emerald-400" : "bg-red-600/15 text-red-400", icon: TrendingUp },
            ].map(({ label, v, sub, color, icon: Icon }) => (
              <div key={label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
                <div className="flex items-start justify-between">
                  <div><p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
                    <p className="text-base font-bold text-gray-900 dark:text-white mt-1">{v}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{sub}</p></div>
                  <div className={`p-2 rounded-lg ${color}`}><Icon className="w-4 h-4" /></div>
                </div>
              </div>
            ))}
          </div>

          {/* Loan status breakdown + Client types */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(d.loan_breakdown?.length ?? 0) > 0 && (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-400" /> Loan Status Breakdown
                </p>
                <div className="space-y-3">
                  {d.loan_breakdown.map((l) => (
                    <div key={l.status} className="flex items-center gap-3 text-xs">
                      <span className="text-gray-500 w-24 shrink-0 capitalize">{l.status.replace(/_/g," ")}</span>
                      <MiniBar value={l.count} max={loanBkMax} color={STATUS_CLR[l.status] ?? "bg-gray-500"} />
                      <span className="text-gray-400 w-6 text-right shrink-0 tabular-nums">{l.count}</span>
                      <span className="text-gray-600 w-20 text-right shrink-0 tabular-nums">{fmt(l.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-4">
              {/* Client types */}
              {d.client_stats && (
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-sky-400" /> Client Breakdown
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      { label: "Individual", v: d.client_stats.individual, color: "text-sky-400" },
                      { label: "Group",      v: d.client_stats.grp,        color: "text-purple-400" },
                      { label: "Company",    v: d.client_stats.company,    color: "text-amber-400" },
                      { label: "Joint",      v: d.client_stats.joint,      color: "text-teal-400" },
                    ].map(({ label, v, color }) => (
                      <div key={label} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-2">
                        <span className="text-gray-500">{label}</span>
                        <span className={`font-semibold tabular-nums ${color}`}>{Number(v ?? 0).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Staff activity */}
              {d.staff_activity && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Staff Activity (period)</p>
                  <div className="flex gap-4 text-xs">
                    <div><span className="text-gray-500">Active Staff </span><span className="text-indigo-400 font-semibold">{d.staff_activity.active_staff}</span></div>
                    <div><span className="text-gray-500">Actions </span><span className="text-gray-300 font-semibold">{Number(d.staff_activity.actions).toLocaleString()}</span></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Trend charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TrendChart title="Deposit Trend" icon={TrendingUp} iconColor="text-indigo-400"
              rows={d.deposit_trend} valueKey="amount" barColor="bg-indigo-500"
              fmtVal={(v) => `UGX ${fmt(v)}`} />
            <TrendChart title="Repayment Trend" icon={CreditCard} iconColor="text-blue-400"
              rows={d.repayment_trend} valueKey="amount" barColor="bg-blue-500"
              fmtVal={(v) => `UGX ${fmt(v)}`} />
          </div>

          <TrendChart title="New Client Registrations" icon={Users} iconColor="text-teal-400"
            rows={d.client_trend} valueKey="count" barColor="bg-teal-500"
            fmtVal={(v) => Number(v).toLocaleString()} />

          {/* Top borrowers */}
          {(d.top_borrowers?.length ?? 0) > 0 && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-200 dark:border-gray-800">
                <Users className="w-4 h-4 text-amber-400" />
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Top Borrowers (Active Loans)</p>
              </div>
              <table className="w-full text-sm">
                <thead className="text-xs text-gray-500 uppercase tracking-wide border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-5 py-2.5 text-left">Client</th>
                    <th className="px-5 py-2.5 text-center">Loans</th>
                    <th className="px-5 py-2.5 text-right">Total Principal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800/60">
                  {d.top_borrowers.map((b, i) => (
                    <tr key={b.client_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xs text-gray-600 w-4 tabular-nums">{i + 1}</span>
                          <ClientPhoto src={b.photo} name={b.name} size="sm" />
                          <span className="text-sm text-gray-900 dark:text-white font-medium">{b.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-center text-xs text-amber-400 font-medium">{b.loan_count}</td>
                      <td className="px-5 py-3 text-right tabular-nums text-gray-900 dark:text-white font-semibold">UGX {fmtCur(b.total_amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Tab: Mobile Config ────────────────────────────────────────────────────────

function MobileConfigTab({ saccoId }) {
  const api = useAdminAxios();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState({});
  const [error,   setError]   = useState("");

  useEffect(() => {
    api.get(`/admin/saccos/${saccoId}/mobile`)
      .then((r) => setData(r.data?.data))
      .catch((e) => setError(e?.response?.data?.messages?.[0] ?? "Failed to load mobile config"))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  const toggleFlag = async (key, current) => {
    const newVal = current === "active" || current === "yes" || current === "enabled" ? "inactive" : "active";
    setSaving(s => ({ ...s, [key]: true }));
    try {
      const res = await api.put(`/admin/saccos/${saccoId}/mobile`, { [key]: newVal });
      setData(res.data?.data);
    } catch (e) {
      setError(e?.response?.data?.messages?.[0] ?? "Update failed");
    } finally {
      setSaving(s => { const n = { ...s }; delete n[key]; return n; });
    }
  };

  if (loading) return <TabLoader />;
  if (error)   return <TabError msg={error} />;

  const flags    = data?.app_flags ?? {};
  const channels = data?.mobile_money_channels ?? [];

  const FLAG_LABELS = {
    sacco_staff_mobile_app: "Staff Mobile App",
    sacco_mobile_app_login: "Mobile App Login",
    app_deposits:           "Deposits",
    app_withdrawals:        "Withdrawals",
    app_group_deposits:     "Group Deposits",
    app_group_withdrawals:  "Group Withdrawals",
    app_loan_applications:  "Loan Applications",
    app_new_client:         "New Client Registration",
    app_show_balance:       "Show Balance",
    app_loan_calculator:    "Loan Calculator",
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-200 dark:border-gray-800">
          <Smartphone className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">App Feature Flags</h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-800/50">
          {Object.entries(FLAG_LABELS).map(([key, label]) => {
            const val = flags[key];
            const on  = val === "active" || val === "yes" || val === "enabled";
            return (
              <div key={key} className="flex items-center justify-between px-5 py-3.5">
                <p className="text-sm text-gray-900 dark:text-white">{label}</p>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs ${on ? "text-emerald-400" : "text-gray-600"}`}>{on ? "On" : "Off"}</span>
                  <Toggle value={val} onChange={() => toggleFlag(key, val)} disabled={!!saving[key]} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {channels.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-200 dark:border-gray-800">
            <Phone className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Mobile Money Channels</h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-800/50">
            {channels.map((ch) => (
              <div key={ch.channel_id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-sm text-gray-900 dark:text-white">{ch.provider}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Float: UGX {fmtCur(ch.available_float)}</p>
                </div>
                <span className={`text-xs ${ch.is_active ? "text-emerald-400" : "text-gray-500"}`}>{ch.is_active ? "Active" : "Inactive"}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


// ── Detail view ───────────────────────────────────────────────────────────────

const TABS = [
  { id: "overview",      label: "Overview",      icon: Building2 },
  { id: "loans",         label: "Loans",         icon: CreditCard },
  { id: "transactions",  label: "Transactions",  icon: Activity },
  { id: "audit",         label: "Audit Log",     icon: Shield },
  { id: "floats",        label: "Floats",        icon: Wallet },
  { id: "settings",      label: "Settings",      icon: ToggleRight },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "staff",         label: "Staff",         icon: Users },
  { id: "clients",       label: "Clients",       icon: Users },
  { id: "messaging",     label: "Messaging",     icon: MessageSquare },
  { id: "reports",       label: "Reports",       icon: BarChart2 },
  { id: "mobile",        label: "Mobile Config", icon: Smartphone },
];

function SaccoDetail({ id }) {
  const api = useAdminAxios();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [tab,     setTab]     = useState(() => {
    const t = searchParams.get("tab");
    return TABS.some((x) => x.id === t) ? t : "overview";
  });

  useEffect(() => {
    api.get(`/admin/saccos/${id}`)
      .then((r) => setData(r.data?.data))
      .catch((e) => setError(e?.response?.data?.messages?.[0] ?? "Failed to load SACCO"))
      .finally(() => setLoading(false));
  }, [id]); // eslint-disable-line

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-400" /></div>;
  if (error)   return <TabError msg={error} />;

  const { sacco, stats } = data ?? {};

  const STAT_CARDS = [
    { label: "Clients",        value: fmt(stats?.total_clients),                icon: Users,      color: "bg-sky-600/15 text-sky-400" },
    { label: "Staff",          value: fmt(stats?.total_staff),                  icon: Users,      color: "bg-teal-600/15 text-teal-400" },
    { label: "Active Loans",   value: fmt(stats?.active_loans),                 icon: CreditCard, color: "bg-amber-600/15 text-amber-400" },
    { label: "Pending Loans",  value: fmt(stats?.pending_loans),                icon: CreditCard, color: "bg-orange-600/15 text-orange-400" },
    { label: "Loan Portfolio", value: `UGX ${fmt(stats?.loan_portfolio ?? 0)}`, icon: TrendingUp, color: "bg-emerald-600/15 text-emerald-400" },
    { label: "Total Savings",  value: `UGX ${fmt(stats?.total_savings ?? 0)}`,  icon: Wallet,     color: "bg-purple-600/15 text-purple-400" },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <button onClick={() => navigate("/admin/saccos")} className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          {sacco?.sacco_logo
            ? <img src={saccoLogoUrl(sacco.sacco_logo)} alt="" className="w-10 h-10 rounded-full object-cover" />
            : <div className="w-10 h-10 rounded-full bg-indigo-600/30 flex items-center justify-center"><Building2 className="w-5 h-5 text-indigo-400" /></div>
          }
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{sacco?.sacco_name}</h1>
            <p className="text-xs text-gray-500">{sacco?.sacco_short_name} · {sacco?.sacco_location} · #{id}</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setTab("settings")}
            className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-colors border ${tab === "settings" ? "bg-indigo-600 border-indigo-600 text-white" : "border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-indigo-500"}`}
          >
            <Edit2 className="w-4 h-4" /> Edit SACCO
          </button>
          <button
            onClick={() => navigate(`/admin/onboard?tab=migrate&sacco_id=${id}&name=${encodeURIComponent(sacco?.sacco_name ?? "")}`)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Upload className="w-4 h-4" /> Migrate Data
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {TABS.map(({ id: tid, label, icon: Icon }) => (
          <button
            key={tid}
            onClick={() => setTab(tid)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              tab === tid ? "bg-indigo-600 text-white" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "overview" && (
        <div className="space-y-5">
          {/* Info + Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">SACCO Details</p>
              <div className="space-y-2.5">
                {[
                  { label: "Contact",    v: sacco?.sacco_contact },
                  { label: "Email",      v: sacco?.sacco_emails },
                  { label: "Location",   v: sacco?.sacco_location },
                  { label: "Registered", v: sacco?.sacco_registration_date ? fmtDate(sacco.sacco_registration_date) : null },
                ].filter(({ v }) => v).map(({ label, v }) => (
                  <div key={label} className="flex items-start gap-3">
                    <span className="text-[11px] text-gray-500 w-20 shrink-0 pt-0.5">{label}</span>
                    <span className="text-sm text-gray-900 dark:text-gray-300 break-all">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">System Status</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Status",        v: sacco?.sacco_status },
                  { label: "System",        v: sacco?.sacco_system_status },
                  { label: "SMS",           v: sacco?.sacco_sms_status },
                  { label: "Email",         v: sacco?.sacco_email_status },
                  { label: "Client Portal", v: sacco?.sacco_client_portal_login },
                  { label: "Staff App",     v: sacco?.sacco_staff_mobile_app },
                ].map(({ label, v }) => (
                  <div key={label} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-2 gap-2">
                    <span className="text-[11px] text-gray-500 truncate">{label}</span>
                    <StatusBadge v={v} />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {STAT_CARDS.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
                  </div>
                  <div className={`p-2 rounded-lg ${color}`}><Icon className="w-5 h-5" /></div>
                </div>
              </div>
            ))}
          </div>

          {/* Today */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Deposits Today</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">UGX {fmtCur(stats?.deposits_today)}</p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Collections Today</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">UGX {fmtCur(stats?.collections_today)}</p>
            </div>
          </div>

          {/* Quick navigation */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Quick Navigation</p>
            <div className="flex flex-wrap gap-2">
              {[
                { t: "clients",      label: "Clients",      cls: "bg-sky-900/30 text-sky-400 hover:bg-sky-900/50" },
                { t: "loans",        label: "Loans",        cls: "bg-amber-900/30 text-amber-400 hover:bg-amber-900/50" },
                { t: "transactions", label: "Transactions", cls: "bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50" },
                { t: "staff",        label: "Staff",        cls: "bg-teal-900/30 text-teal-400 hover:bg-teal-900/50" },
                { t: "reports",      label: "Reports",      cls: "bg-indigo-900/30 text-indigo-400 hover:bg-indigo-900/50" },
                { t: "messaging",    label: "Messaging",    cls: "bg-purple-900/30 text-purple-400 hover:bg-purple-900/50" },
                { t: "floats",       label: "Floats",       cls: "bg-blue-900/30 text-blue-400 hover:bg-blue-900/50" },
                { t: "settings",     label: "Settings",     cls: "bg-gray-800 text-gray-400 hover:bg-gray-700" },
              ].map(({ t, label, cls }) => (
                <button key={t} onClick={() => setTab(t)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${cls}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "loans"         && <LoansTab         saccoId={id} key={`loans-${id}`} />}
      {tab === "transactions"  && <TransactionsTab  saccoId={id} key={`txn-${id}`} />}
      {tab === "audit"         && <AuditTab         saccoId={id} key={`audit-${id}`} />}
      {tab === "floats"        && <FloatsTab        saccoId={id} key={`floats-${id}`} />}
      {tab === "settings"      && <SettingsTab      saccoId={id} key={`settings-${id}`} />}
      {tab === "notifications" && <NotificationsTab saccoId={id} key={`notif-${id}`} />}
      {tab === "staff"         && <StaffTab         saccoId={id} key={`staff-${id}`} />}
      {tab === "clients"       && <ClientsTab       saccoId={id} key={`clients-${id}`} />}
      {tab === "messaging"     && <MessagingTab     saccoId={id} key={`messaging-${id}`} />}
      {tab === "reports"       && <ReportsTab       saccoId={id} key={`reports-${id}`} />}
      {tab === "mobile"        && <MobileConfigTab  saccoId={id} key={`mobile-${id}`} />}
    </div>
  );
}

// ── List view ─────────────────────────────────────────────────────────────────

function SaccoList() {
  const api = useAdminAxios();
  const navigate = useNavigate();
  const [saccos,  setSaccos]  = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [search,  setSearch]  = useState("");
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  const load = useCallback((p, q) => {
    setLoading(true);
    api.get("/admin/saccos", { params: { page: p, per_page: 25, search: q } })
      .then((r) => { setSaccos(r.data?.data?.saccos ?? []); setTotal(r.data?.data?.total ?? 0); setPage(p); })
      .catch((e) => setError(e?.response?.data?.messages?.[0] ?? "Failed to load SACCOs"))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  useEffect(() => { load(1, ""); }, []); // eslint-disable-line

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">SACCOs</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} registered</p>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); load(1, search); }} className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or location…"
            className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg pl-9 pr-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>
        <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-colors">Search</button>
      </form>

      {error && <TabError msg={error} />}

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {loading ? <TabLoader /> : saccos.length === 0 ? (
          <div className="py-16 text-center"><Building2 className="w-8 h-8 text-gray-700 mx-auto mb-3" /><p className="text-sm text-gray-500">No SACCOs found.</p></div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="text-xs text-gray-500 uppercase tracking-wide border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-5 py-3 text-left">SACCO</th>
                  <th className="px-5 py-3 text-left">Location</th>
                  <th className="px-5 py-3 text-right">Clients</th>
                  <th className="px-5 py-3 text-right">Staff</th>
                  <th className="px-5 py-3 text-right">Active Loans</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-center w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800/60">
                {saccos.map((s) => (
                  <tr key={s.sacco_id} onClick={() => navigate(`/admin/saccos/${s.sacco_id}`)} className="hover:bg-gray-800/40 cursor-pointer transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="relative w-7 h-7 rounded-full bg-indigo-600/25 border border-gray-700/60 flex items-center justify-center shrink-0 overflow-hidden">
                          <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                          {s.sacco_logo && (
                            <img src={saccoLogoUrl(s.sacco_logo)} alt="" className="absolute inset-0 w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{s.sacco_name}</p>
                          <p className="text-xs text-gray-500">{s.sacco_short_name} · #{s.sacco_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400 text-xs">{s.sacco_location || "—"}</td>
                    <td className="px-5 py-3.5 text-right tabular-nums text-gray-300">{s.stats.clients.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-right tabular-nums text-gray-300">{s.stats.staff.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-right tabular-nums text-gray-300">{s.stats.active_loans.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${s.sacco_status === "active" ? "bg-emerald-900/40 text-emerald-400" : "bg-gray-100 dark:bg-gray-800 text-gray-500"}`}>{s.sacco_status}</span>
                    </td>
                    <td className="px-3 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => navigate(`/admin/saccos/${s.sacco_id}?tab=settings`)}
                        title="Edit SACCO settings"
                        className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-400 hover:bg-indigo-950/30 transition-colors"
                      >
                        <Settings className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {total > 25 && (
        <div className="flex justify-center gap-2">
          <button disabled={page <= 1} onClick={() => load(page - 1, search)} className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-40">← Prev</button>
          <span className="px-3 py-1.5 text-xs text-gray-500">Page {page}</span>
          <button disabled={saccos.length < 25} onClick={() => load(page + 1, search)} className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-40">Next →</button>
        </div>
      )}
    </div>
  );
}

export default function AdminSaccos() {
  const { id } = useParams();
  return id ? <SaccoDetail id={Number(id)} /> : <SaccoList />;
}

import { useEffect, useState, useCallback } from "react";
import {
  FileText, Plus, ChevronLeft, ChevronRight, Loader2, AlertCircle,
  Ban, Building2, Receipt, X, Send, Edit2, CheckCircle2, Star,
  Mail, Printer,
} from "lucide-react";
import useAdminAxios from "@/MiddleWares/Hooks/useAdminAxios";
import { DatePickerField } from "@/components/ui/date-picker";

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmtCur = (n, cur = "UGX") =>
  `${cur} ${Number(n ?? 0).toLocaleString("en-UG", { minimumFractionDigits: 0 })}`;

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-UG", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const isoDate = (d = new Date()) => d.toISOString().slice(0, 10);

// Given a billing cycle and a start date, compute { periodStart, periodEnd, dueDate }
function autoPeriod(cycle, from = new Date()) {
  const s = new Date(from);
  s.setDate(1);
  let e = new Date(s);
  if (cycle === "monthly")    { e.setMonth(e.getMonth() + 1);  e.setDate(0); }
  else if (cycle === "quarterly") { e.setMonth(e.getMonth() + 3); e.setDate(0); }
  else if (cycle === "annually")  { e.setFullYear(e.getFullYear() + 1); e.setDate(e.getDate() - 1); }
  else { e = new Date(s); }
  const due = new Date(e);
  due.setDate(due.getDate() + 14);
  return { periodStart: isoDate(s), periodEnd: isoDate(e), dueDate: isoDate(due) };
}

const STATUS_STYLES = {
  active:    "bg-emerald-900/40 text-emerald-400",
  draft:     "bg-gray-800 text-gray-400",
  suspended: "bg-amber-900/40 text-amber-400",
  expired:   "bg-orange-900/40 text-orange-400",
  cancelled: "bg-red-900/40 text-red-400",
};

const INVOICE_STATUS_STYLES = {
  pending:   "bg-amber-900/40 text-amber-400",
  paid:      "bg-emerald-900/40 text-emerald-400",
  overdue:   "bg-red-900/40 text-red-400",
  cancelled: "bg-gray-800 text-gray-500",
};

const TIER_COLORS = {
  freemium:     "text-teal-400",
  starter:      "text-gray-400",
  standard:     "text-sky-400",
  professional: "text-violet-400",
  enterprise:   "text-amber-400",
};

const TIER_ICONS = {
  freemium: "✦",
  starter: "●",
  standard: "◆",
  professional: "★",
  enterprise: "♛",
};

const ALL_FEATURES = [
  "Loan Management", "Savings & Deposits", "Mobile App", "SMS Notifications",
  "Email Notifications", "CRB Integration", "USSD Banking", "Reports & Analytics",
  "Multi-Branch", "Payroll Management", "Fixed Deposits", "Shares & Dividends",
  "Client Portal", "API Access", "Priority Support",
];

const TIER_OPTIONS    = ["freemium", "starter", "standard", "professional", "enterprise"];
const CYCLE_OPTIONS   = ["monthly", "quarterly", "annually", "once_off"];
const STATUS_OPTIONS  = ["draft", "active", "suspended", "expired", "cancelled"];
const FILTER_STATUSES = ["", "draft", "active", "suspended", "expired", "cancelled"];

// ── Shared UI ─────────────────────────────────────────────────────────────────

function Loader() {
  return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>;
}

function Err({ msg, onRetry }) {
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

function StatusBadge({ status, styles }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${(styles ?? STATUS_STYLES)[status] ?? "bg-gray-800 text-gray-400"}`}>
      {status?.replace(/_/g, " ")}
    </span>
  );
}

function FieldRow({ label, children }) {
  return (
    <div>
      <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">{label}</label>
      {children}
    </div>
  );
}

const INPUT_CLS = "w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 dark:[color-scheme:dark]";

// ── Features Picker ───────────────────────────────────────────────────────────

function FeaturesPicker({ value = [], onChange }) {
  const toggle = (f) => onChange(value.includes(f) ? value.filter((x) => x !== f) : [...value, f]);
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {ALL_FEATURES.map((f) => (
        <label key={f} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border cursor-pointer text-xs transition-colors ${value.includes(f) ? "border-indigo-500 bg-indigo-900/20 text-indigo-300" : "border-gray-300 dark:border-gray-700 text-gray-500 hover:text-gray-900 dark:hover:text-white"}`}>
          <input type="checkbox" checked={value.includes(f)} onChange={() => toggle(f)} className="sr-only" />
          {value.includes(f) && <CheckCircle2 className="w-3 h-3 shrink-0 text-indigo-400" />}
          {f}
        </label>
      ))}
    </div>
  );
}

// ── Create Contract Modal ─────────────────────────────────────────────────────

function ContractFormModal({ existing, onClose, onSaved }) {
  const api = useAdminAxios();
  const isEdit = !!existing;
  const [saccos, setSaccos] = useState([]);
  const [form, setForm] = useState(existing ? {
    plan_tier:     existing.plan_tier     ?? "standard",
    billing_cycle: existing.billing_cycle ?? "monthly",
    contract_fee:  existing.contract_fee  ?? 0,
    currency:      existing.currency      ?? "UGX",
    start_date:    existing.start_date    ? isoDate(new Date(existing.start_date)) : isoDate(),
    end_date:      existing.end_date      ? isoDate(new Date(existing.end_date))   : "",
    auto_renew:    existing.auto_renew    ?? 1,
    status:        existing.status        ?? "draft",
    features:      existing.features      ?? [],
    notes:         existing.notes         ?? "",
  } : {
    sacco_id: "", plan_tier: "standard", billing_cycle: "monthly",
    contract_fee: "", currency: "UGX",
    start_date: isoDate(), end_date: "", auto_renew: 1, status: "draft",
    features: [], notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");
  const [tab, setTab]       = useState("basic"); // basic | features

  useEffect(() => {
    if (!isEdit) {
      api.get("/admin/saccos").then((r) => setSaccos(r.data?.data?.saccos ?? [])).catch(() => {});
    }
  }, []); // eslint-disable-line

  // Auto-set fee=0 for freemium
  useEffect(() => {
    if (form.plan_tier === "freemium") setForm((p) => ({ ...p, contract_fee: 0 }));
  }, [form.plan_tier]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      const payload = {
        ...form,
        contract_fee: parseFloat(form.contract_fee) || 0,
        auto_renew:   parseInt(form.auto_renew),
        features:     form.features,
      };
      if (!isEdit) payload.sacco_id = parseInt(form.sacco_id);

      const res = isEdit
        ? await api.put(`/admin/contracts/${existing.id}`, payload)
        : await api.post("/admin/contracts", payload);

      onSaved(res.data?.data?.contract);
    } catch (e) {
      setError(e?.response?.data?.messages?.[0] ?? "Failed to save contract");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl w-full max-w-lg my-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{isEdit ? "Edit Contract" : "New Contract"}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900 dark:hover:text-white"><X className="w-4 h-4" /></button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4 pb-2">
          {["basic", "features"].map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`text-xs px-3 py-1.5 rounded-lg capitalize transition-colors ${tab === t ? "bg-indigo-600 text-white" : "text-gray-500 hover:text-gray-900 dark:hover:text-white"}`}>
              {t}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          {error && <Err msg={error} />}

          {tab === "basic" && (
            <>
              {!isEdit && (
                <FieldRow label="SACCO *">
                  <select required value={form.sacco_id} onChange={(e) => set("sacco_id", e.target.value)} className={INPUT_CLS}>
                    <option value="">Select SACCO…</option>
                    {saccos.map((s) => <option key={s.sacco_id} value={s.sacco_id}>{s.sacco_name}</option>)}
                  </select>
                </FieldRow>
              )}

              <div className="grid grid-cols-2 gap-3">
                <FieldRow label="Plan Tier">
                  <select value={form.plan_tier} onChange={(e) => set("plan_tier", e.target.value)} className={INPUT_CLS}>
                    {TIER_OPTIONS.map((t) => (
                      <option key={t} value={t} className="capitalize">{t}</option>
                    ))}
                  </select>
                </FieldRow>
                <FieldRow label="Billing Cycle">
                  <select value={form.billing_cycle} onChange={(e) => set("billing_cycle", e.target.value)} className={INPUT_CLS}>
                    {CYCLE_OPTIONS.map((c) => (
                      <option key={c} value={c} className="capitalize">{c.replace("_", " ")}</option>
                    ))}
                  </select>
                </FieldRow>
              </div>

              {form.plan_tier === "freemium" && (
                <div className="flex items-start gap-2 bg-teal-900/20 border border-teal-800/30 rounded-lg px-3 py-2.5 text-xs text-teal-400">
                  <Star className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  Freemium plan — contract fee set to 0. Invoices can still be generated for add-ons.
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <FieldRow label={`Contract Fee (${form.currency})`}>
                  <input type="number" min="0" step="0.01" value={form.contract_fee}
                    onChange={(e) => set("contract_fee", e.target.value)}
                    disabled={form.plan_tier === "freemium"}
                    placeholder="0.00" className={INPUT_CLS} />
                </FieldRow>
                <FieldRow label="Currency">
                  <input type="text" value={form.currency} onChange={(e) => set("currency", e.target.value.toUpperCase())} className={INPUT_CLS} />
                </FieldRow>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FieldRow label="Start Date *">
                  <DatePickerField value={form.start_date} onChange={(v) => set("start_date", v)} />
                </FieldRow>
                <FieldRow label="End Date">
                  <DatePickerField value={form.end_date} onChange={(v) => set("end_date", v)} />
                </FieldRow>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FieldRow label="Status">
                  <select value={form.status} onChange={(e) => set("status", e.target.value)} className={INPUT_CLS}>
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
                  </select>
                </FieldRow>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.auto_renew === 1}
                      onChange={(e) => set("auto_renew", e.target.checked ? 1 : 0)}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-100 dark:bg-gray-800 text-indigo-600" />
                    <span className="text-xs text-gray-500">Auto-renew</span>
                  </label>
                </div>
              </div>

              <FieldRow label="Notes">
                <textarea rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} className={`${INPUT_CLS} resize-none`} />
              </FieldRow>
            </>
          )}

          {tab === "features" && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">Select what's included in this contract plan.</p>
              <FeaturesPicker value={form.features} onChange={(v) => set("features", v)} />
              {form.features.length > 0 && (
                <p className="text-xs text-indigo-400">{form.features.length} feature{form.features.length !== 1 ? "s" : ""} selected</p>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm py-2 rounded-lg">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-sm py-2 rounded-lg disabled:opacity-50">
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Contract"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Invoice Modal ─────────────────────────────────────────────────────────────

function InvoiceModal({ contract, onClose, onCreated }) {
  const api = useAdminAxios();
  const auto = autoPeriod(contract.billing_cycle);
  const [form, setForm] = useState({
    amount:       contract.contract_fee ?? 0,
    period_start: auto.periodStart,
    period_end:   auto.periodEnd,
    due_date:     auto.dueDate,
    notes:        "",
  });
  const [lineItems, setLineItems] = useState(
    (contract.features ?? []).map((f) => ({ description: f, amount: "" }))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");
  const [tab, setTab]       = useState("details");

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const totalLineItems = lineItems.reduce((s, li) => s + (parseFloat(li.amount) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      const payload = {
        ...form,
        amount:     parseFloat(form.amount),
        line_items: lineItems.filter((li) => li.description).map((li) => ({
          description: li.description,
          amount:      parseFloat(li.amount) || 0,
        })),
      };
      const res = await api.post(`/admin/contracts/${contract.id}/billing`, payload);
      onCreated(res.data?.data?.invoice);
    } catch (e) {
      setError(e?.response?.data?.messages?.[0] ?? "Failed to create invoice");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl w-full max-w-lg my-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Generate Invoice</h2>
            <p className="text-xs text-gray-500 mt-0.5">{contract.sacco_name} · {contract.contract_number}</p>
          </div>
          <button onClick={onClose}><X className="w-4 h-4 text-gray-500 hover:text-gray-900 dark:hover:text-white" /></button>
        </div>

        <div className="flex gap-1 px-6 pt-4 pb-2">
          {["details", "line items"].map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`text-xs px-3 py-1.5 rounded-lg capitalize transition-colors ${tab === t ? "bg-indigo-600 text-white" : "text-gray-500 hover:text-gray-900 dark:hover:text-white"}`}>
              {t}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          {error && <Err msg={error} />}

          {tab === "details" && (
            <>
              <FieldRow label={`Amount (${contract.currency ?? "UGX"})`}>
                <input type="number" min="0" step="0.01" required value={form.amount}
                  onChange={(e) => set("amount", e.target.value)} className={INPUT_CLS} />
              </FieldRow>
              <div className="grid grid-cols-2 gap-3">
                <FieldRow label="Period Start *">
                  <DatePickerField value={form.period_start} onChange={(v) => set("period_start", v)} />
                </FieldRow>
                <FieldRow label="Period End *">
                  <DatePickerField value={form.period_end} onChange={(v) => set("period_end", v)} />
                </FieldRow>
              </div>
              <FieldRow label="Due Date *">
                <DatePickerField value={form.due_date} onChange={(v) => set("due_date", v)} />
              </FieldRow>
              <FieldRow label="Notes">
                <textarea rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} className={`${INPUT_CLS} resize-none`} />
              </FieldRow>
            </>
          )}

          {tab === "line items" && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500">Break down the invoice into line items (optional).</p>
              {lineItems.map((li, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input value={li.description} onChange={(e) => setLineItems((p) => p.map((x, j) => j === i ? { ...x, description: e.target.value } : x))}
                    placeholder="Description" className={`${INPUT_CLS} flex-1`} />
                  <input type="number" min="0" step="0.01" value={li.amount} onChange={(e) => setLineItems((p) => p.map((x, j) => j === i ? { ...x, amount: e.target.value } : x))}
                    placeholder="0.00" className={`${INPUT_CLS} w-28`} />
                  <button type="button" onClick={() => setLineItems((p) => p.filter((_, j) => j !== i))}
                    className="text-gray-500 hover:text-red-400 shrink-0"><X className="w-3.5 h-3.5" /></button>
                </div>
              ))}
              <button type="button" onClick={() => setLineItems((p) => [...p, { description: "", amount: "" }])}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                <Plus className="w-3 h-3" /> Add line item
              </button>
              {totalLineItems > 0 && (
                <div className="flex justify-between text-xs pt-2 border-t border-gray-200 dark:border-gray-800">
                  <span className="text-gray-500">Line items total</span>
                  <span className="text-white font-medium">{fmtCur(totalLineItems, contract.currency)}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-300 dark:border-gray-700 text-gray-500 hover:text-gray-900 dark:hover:text-white text-sm py-2 rounded-lg">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-sm py-2 rounded-lg disabled:opacity-50">
              {saving ? "Creating…" : "Create Invoice"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Contract Detail Panel ─────────────────────────────────────────────────────

function ContractDetail({ contractId, onBack }) {
  const api = useAdminAxios();
  const [data, setData]         = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [invTotal, setInvTotal] = useState(0);
  const [invPage, setInvPage]   = useState(1);
  const [loading, setLoading]   = useState(true);
  const [invLoading, setInvLoading] = useState(true);
  const [error, setError]       = useState("");
  const [showInvModal, setShowInvModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [sending, setSending]   = useState(null); // invoice id being emailed

  const loadDetail = useCallback(() => {
    setLoading(true);
    api.get(`/admin/contracts/${contractId}`)
      .then((r) => setData(r.data?.data))
      .catch((e) => setError(e?.response?.data?.messages?.[0] ?? "Failed to load contract"))
      .finally(() => setLoading(false));
  }, [contractId]); // eslint-disable-line

  const loadInvoices = useCallback((p) => {
    setInvLoading(true);
    api.get(`/admin/contracts/${contractId}/billing`, { params: { page: p } })
      .then((r) => { setInvoices(r.data?.data?.invoices ?? []); setInvTotal(r.data?.data?.total ?? 0); setInvPage(p); })
      .catch(() => {})
      .finally(() => setInvLoading(false));
  }, [contractId]); // eslint-disable-line

  useEffect(() => { loadDetail(); loadInvoices(1); }, []); // eslint-disable-line

  const markInvoice = async (invId, status) => {
    try {
      await api.put(`/admin/contracts/${contractId}/billing/${invId}`, { status });
      loadInvoices(invPage);
      loadDetail();
    } catch { /* ignore */ }
  };

  const printInvoice = (inv) => {
    const li = Array.isArray(inv.line_items) && inv.line_items.length
      ? inv.line_items
      : [{ description: "Service fee", amount: inv.amount }];

    const liRows = li.map((r) => `
      <tr>
        <td style="padding:6px 0;border-bottom:1px solid #ddd;font-size:13px">${r.description}</td>
        <td style="padding:6px 0;border-bottom:1px solid #ddd;font-size:13px;text-align:right;font-family:monospace">${fmtCur(r.amount, inv.currency)}</td>
      </tr>`).join("");

    const html = `<!DOCTYPE html><html><head><title>Invoice ${inv.invoice_number}</title>
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:Arial,sans-serif;color:#000;background:#fff;padding:24px;max-width:680px;margin:0 auto}
        @media print{body{padding:0}@page{margin:12mm}}
      </style></head><body>
      <div style="background:#000;color:#fff;padding:16px 20px;display:flex;justify-content:space-between;align-items:center">
        <div>
          <div style="font-size:18px;font-weight:800;letter-spacing:1px">${import.meta.env.VITE_APP_NAME ?? "Banking System"}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:11px;opacity:.7">TAX INVOICE</div>
          <div style="font-size:13px;font-weight:700;font-family:monospace">${inv.invoice_number}</div>
        </div>
      </div>

      <div style="display:flex;justify-content:space-between;margin-top:20px;gap:16px">
        <div>
          <div style="font-size:10px;color:#555;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Billed To</div>
          <div style="font-size:14px;font-weight:700">${data?.contract?.sacco_name ?? ""}</div>
          <div style="font-size:12px;color:#555;margin-top:2px">${data?.contract?.contract_number ?? ""}</div>
        </div>
        <div style="text-align:right">
          <table style="font-size:12px;color:#555;border-collapse:collapse">
            <tr><td style="padding:2px 8px 2px 0">Issue Date</td><td style="padding:2px 0;color:#000;font-weight:600">${fmtDate(inv.created_at ?? new Date())}</td></tr>
            <tr><td style="padding:2px 8px 2px 0">Due Date</td><td style="padding:2px 0;color:#000;font-weight:600">${fmtDate(inv.due_date)}</td></tr>
            <tr><td style="padding:2px 8px 2px 0">Period</td><td style="padding:2px 0;color:#000">${fmtDate(inv.period_start)} – ${fmtDate(inv.period_end)}</td></tr>
            <tr><td style="padding:2px 8px 2px 0">Status</td><td style="padding:2px 0;text-transform:capitalize;font-weight:600">${inv.status}</td></tr>
          </table>
        </div>
      </div>

      <table style="width:100%;border-collapse:collapse;margin-top:24px">
        <thead>
          <tr style="border-bottom:2px solid #000">
            <th style="text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:1px;padding-bottom:6px">Description</th>
            <th style="text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:1px;padding-bottom:6px">Amount</th>
          </tr>
        </thead>
        <tbody>${liRows}</tbody>
      </table>

      <div style="margin-top:16px;display:flex;justify-content:flex-end">
        <div style="border:2px solid #000;padding:12px 20px;text-align:right;min-width:200px">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#555">Total Due</div>
          <div style="font-size:22px;font-weight:800;font-family:monospace;margin-top:4px">${fmtCur(inv.amount, inv.currency)}</div>
        </div>
      </div>

      ${inv.notes ? `<div style="margin-top:20px;padding:10px 14px;border:1px solid #bbb;font-size:12px;color:#555"><strong>Notes:</strong> ${inv.notes}</div>` : ""}

      <div style="margin-top:32px;border-top:1px solid #bbb;padding-top:12px;text-align:center;font-size:10px;color:#888">
        This is a computer-generated invoice. · ${import.meta.env.VITE_APP_NAME ?? "Banking System"}
      </div>
    </body></html>`;

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 500);
  };

  const doSendInvoice = async (invId) => {
    setSending(invId);
    try {
      await api.post(`/admin/contracts/${contractId}/billing/${invId}/send`, {});
      alert("Invoice sent successfully.");
    } catch (e) {
      alert(e?.response?.data?.messages?.[0] ?? "Failed to send invoice.");
    } finally { setSending(null); }
  };

  if (loading) return <Loader />;
  if (error)   return <Err msg={error} onRetry={loadDetail} />;

  const { contract, billing_summary: bs } = data ?? {};
  const features = contract?.features ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-gray-500 hover:text-gray-900 dark:hover:text-white p-1 rounded transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate">{contract?.sacco_name}</h2>
          <p className="text-xs text-gray-500 font-mono">{contract?.contract_number}</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={contract?.status} styles={STATUS_STYLES} />
          <button onClick={() => setShowEditModal(true)}
            className="flex items-center gap-1.5 border border-gray-300 dark:border-gray-700 text-gray-500 hover:text-gray-900 dark:hover:text-white text-xs px-3 py-1.5 rounded-lg">
            <Edit2 className="w-3.5 h-3.5" /> Edit
          </button>
        </div>
      </div>

      {/* KPI row 1 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Plan",          value: <span className={`capitalize font-semibold ${TIER_COLORS[contract?.plan_tier] ?? "text-white"}`}>{TIER_ICONS[contract?.plan_tier] ?? "●"} {contract?.plan_tier}</span> },
          { label: "Billing Cycle", value: <span className="capitalize text-gray-900 dark:text-white">{contract?.billing_cycle?.replace("_", " ")}</span> },
          { label: "Contract Fee",  value: <span className="text-white">{contract?.plan_tier === "freemium" ? "Free" : fmtCur(contract?.contract_fee, contract?.currency)}</span> },
          { label: "Auto-Renew",    value: contract?.auto_renew ? <span className="text-emerald-400">Yes</span> : <span className="text-gray-500">No</span> },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3">
            <p className="text-xs text-gray-500">{label}</p>
            <div className="text-sm mt-0.5">{value}</div>
          </div>
        ))}
      </div>

      {/* KPI row 2 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Start Date",    value: fmtDate(contract?.start_date) },
          { label: "End Date",      value: fmtDate(contract?.end_date) },
          { label: "Total Billed",  value: fmtCur(bs?.total_billed,  contract?.currency) },
          { label: "Outstanding",   value: fmtCur(bs?.outstanding,   contract?.currency) },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-sm text-gray-900 dark:text-white mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* Billing summary pills */}
      {(bs?.total_pending > 0 || bs?.total_overdue > 0) && (
        <div className="flex gap-3 flex-wrap">
          {bs?.total_pending > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-900/20 border border-amber-800/30 rounded-lg px-3 py-2 text-xs">
              <span className="text-amber-400 font-medium">{fmtCur(bs.total_pending, contract?.currency)}</span>
              <span className="text-gray-500">pending</span>
            </div>
          )}
          {bs?.total_overdue > 0 && (
            <div className="flex items-center gap-1.5 bg-red-900/20 border border-red-800/30 rounded-lg px-3 py-2 text-xs">
              <span className="text-red-400 font-medium">{fmtCur(bs.total_overdue, contract?.currency)}</span>
              <span className="text-gray-500">overdue</span>
            </div>
          )}
        </div>
      )}

      {/* Features */}
      {features.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-5 py-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Included Features</p>
          <div className="flex flex-wrap gap-2">
            {features.map((f) => (
              <span key={f} className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-indigo-900/20 border border-indigo-800/30 text-indigo-300">
                <CheckCircle2 className="w-3 h-3" /> {f}
              </span>
            ))}
          </div>
        </div>
      )}

      {contract?.notes && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3">
          <p className="text-xs text-gray-500 mb-1">Notes</p>
          <p className="text-sm text-gray-300">{contract.notes}</p>
        </div>
      )}

      {/* Invoices */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Invoices</h3>
            <span className="text-xs text-gray-500">({bs?.invoice_count ?? 0})</span>
          </div>
          <button onClick={() => setShowInvModal(true)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1.5 rounded-lg transition-colors">
            <Plus className="w-3.5 h-3.5" /> Generate Invoice
          </button>
        </div>

        {invLoading ? <Loader /> : invoices.length === 0 ? (
          <div className="py-10 text-center">
            <Receipt className="w-7 h-7 text-gray-700 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No invoices yet.</p>
          </div>
        ) : (
          <>
            <div className="overflow-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead className="text-xs text-gray-500 uppercase tracking-wide border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-5 py-3 text-left">Invoice #</th>
                    <th className="px-5 py-3 text-left">Period</th>
                    <th className="px-5 py-3 text-right">Amount</th>
                    <th className="px-5 py-3 text-center">Due</th>
                    <th className="px-5 py-3 text-center">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800/60">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="px-5 py-3 font-mono text-xs text-indigo-400">{inv.invoice_number}</td>
                      <td className="px-5 py-3 text-xs text-gray-500">{fmtDate(inv.period_start)} – {fmtDate(inv.period_end)}</td>
                      <td className="px-5 py-3 text-right tabular-nums text-gray-900 dark:text-white font-medium">{fmtCur(inv.amount, inv.currency)}</td>
                      <td className="px-5 py-3 text-center text-xs text-gray-500">{fmtDate(inv.due_date)}</td>
                      <td className="px-5 py-3 text-center"><StatusBadge status={inv.status} styles={INVOICE_STATUS_STYLES} /></td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end items-center gap-1">
                          {/* Print */}
                          <button
                            onClick={() => printInvoice(inv)}
                            title="Print invoice"
                            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-100 px-2 py-1 rounded border border-gray-700 hover:border-gray-500 transition-colors">
                            <Printer className="w-3 h-3" />
                          </button>
                          {/* Send email */}
                          <button
                            onClick={() => doSendInvoice(inv.id)}
                            disabled={sending === inv.id}
                            title="Email invoice to SACCO"
                            className="flex items-center gap-1 text-xs text-sky-400 hover:text-sky-300 px-2 py-1 rounded border border-sky-900 hover:border-sky-700 transition-colors disabled:opacity-50">
                            {sending === inv.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}
                            Send
                          </button>
                          {inv.status === "pending" && (
                            <>
                              <button onClick={() => markInvoice(inv.id, "paid")}
                                className="text-xs text-emerald-400 hover:text-emerald-300 px-2 py-1 rounded border border-emerald-800 hover:border-emerald-600 transition-colors">
                                Paid
                              </button>
                              <button onClick={() => markInvoice(inv.id, "overdue")}
                                className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded border border-red-900 hover:border-red-700 transition-colors">
                                Overdue
                              </button>
                            </>
                          )}
                          {(inv.status === "pending" || inv.status === "overdue") && (
                            <button onClick={() => markInvoice(inv.id, "cancelled")} title="Cancel"
                              className="text-gray-500 hover:text-gray-300 p-1"><Ban className="w-3.5 h-3.5" /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager page={invPage} total={invTotal} perPage={25} onPage={loadInvoices} />
          </>
        )}
      </div>

      {showInvModal && (
        <InvoiceModal
          contract={contract}
          onClose={() => setShowInvModal(false)}
          onCreated={() => { setShowInvModal(false); loadInvoices(1); loadDetail(); }}
        />
      )}

      {showEditModal && (
        <ContractFormModal
          existing={contract}
          onClose={() => setShowEditModal(false)}
          onSaved={(c) => { setShowEditModal(false); setData((p) => ({ ...p, contract: c ?? p?.contract })); }}
        />
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminContracts() {
  const api = useAdminAxios();
  const [data, setData]           = useState(null);
  const [page, setPage]           = useState(1);
  const [filterStatus, setFilter] = useState("");
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected]   = useState(null);

  const load = useCallback((p, st) => {
    setLoading(true);
    api.get("/admin/contracts", { params: { page: p, status: st } })
      .then((r) => { setData(r.data?.data); setPage(p); })
      .catch((e) => setError(e?.response?.data?.messages?.[0] ?? "Failed to load contracts"))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  useEffect(() => { load(1, ""); }, []); // eslint-disable-line

  if (selected) {
    return <ContractDetail contractId={selected} onBack={() => { setSelected(null); load(page, filterStatus); }} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Contracts &amp; Billing</h1>
          <p className="text-sm text-gray-500 mt-0.5">Service agreements and invoicing for all SACCOs</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus className="w-4 h-4" /> New Contract
        </button>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap">
        {FILTER_STATUSES.map((s) => (
          <button key={s} onClick={() => { setFilter(s); load(1, s); }}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors capitalize ${filterStatus === s ? "bg-indigo-600 border-indigo-600 text-white" : "border-gray-300 dark:border-gray-700 text-gray-500 hover:text-gray-900 dark:hover:text-white"}`}>
            {s || "All"}
          </button>
        ))}
      </div>

      {error && <Err msg={error} onRetry={() => load(page, filterStatus)} />}

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        {loading ? <Loader /> : !data?.contracts?.length ? (
          <div className="py-16 text-center">
            <FileText className="w-8 h-8 text-gray-700 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No contracts found.</p>
          </div>
        ) : (
          <>
            <div className="overflow-auto">
              <table className="w-full text-sm min-w-[760px]">
                <thead className="text-xs text-gray-500 uppercase tracking-wide border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-5 py-3 text-left">SACCO</th>
                    <th className="px-5 py-3 text-left">Contract #</th>
                    <th className="px-5 py-3 text-left">Plan</th>
                    <th className="px-5 py-3 text-right">Fee</th>
                    <th className="px-5 py-3 text-center">Cycle</th>
                    <th className="px-5 py-3 text-center">Invoices</th>
                    <th className="px-5 py-3 text-right">Outstanding</th>
                    <th className="px-5 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800/60">
                  {data.contracts.map((c) => (
                    <tr key={c.id} onClick={() => setSelected(c.id)}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors cursor-pointer">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-indigo-600/30 flex items-center justify-center shrink-0">
                            <Building2 className="w-3 h-3 text-indigo-400" />
                          </div>
                          <span className="text-sm text-gray-900 dark:text-white truncate max-w-[160px]">{c.sacco_name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-gray-500">{c.contract_number}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs capitalize font-medium ${TIER_COLORS[c.plan_tier] ?? "text-gray-400"}`}>
                          {TIER_ICONS[c.plan_tier] ?? "●"} {c.plan_tier}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums text-gray-900 dark:text-white text-xs">
                        {c.plan_tier === "freemium" ? <span className="text-teal-400">Free</span> : fmtCur(c.contract_fee, c.currency)}
                      </td>
                      <td className="px-5 py-3 text-center text-xs text-gray-500 capitalize">{c.billing_cycle?.replace("_", " ")}</td>
                      <td className="px-5 py-3 text-center text-xs text-gray-500">{c.invoice_count ?? 0}</td>
                      <td className="px-5 py-3 text-right tabular-nums text-xs">
                        {Number(c.outstanding ?? 0) > 0
                          ? <span className="text-amber-400">{fmtCur(c.outstanding, c.currency)}</span>
                          : <span className="text-gray-600">—</span>}
                      </td>
                      <td className="px-5 py-3 text-center"><StatusBadge status={c.status} styles={STATUS_STYLES} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager page={page} total={data.total} perPage={20} onPage={(p) => load(p, filterStatus)} />
          </>
        )}
      </div>

      {showCreate && (
        <ContractFormModal
          onClose={() => setShowCreate(false)}
          onSaved={() => { setShowCreate(false); load(1, filterStatus); }}
        />
      )}
    </div>
  );
}

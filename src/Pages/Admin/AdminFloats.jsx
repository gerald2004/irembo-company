import { useEffect, useState, useCallback } from "react";
import {
  Wallet, MessageSquare, Mail, Shield, Banknote, Phone,
  ChevronLeft, ChevronRight, Loader2, AlertCircle, Upload,
  RefreshCw, History, X, Building2, Plus, Power, Trash2, Zap,
  Edit2, Receipt, CheckCircle2, TrendingDown, Printer, Send,
  CornerDownRight,
} from "lucide-react";
import useAdminAxios from "@/MiddleWares/Hooks/useAdminAxios";

// ── Helpers ───────────────────────────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_BASE_URL ?? "http://localhost:8081";
const saccoLogoUrl = (logo) => {
  if (!logo) return null;
  if (logo.startsWith("http")) return logo;
  if (logo.startsWith("/")) return `${BASE_URL}${logo}`;
  return `${BASE_URL}/${logo}`;
};

const fmtCur = (n) => Number(n ?? 0).toLocaleString("en-UG", { minimumFractionDigits: 0 });
const fmtDate = (d) =>
  d ? new Date(d).toLocaleString("en-UG", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

const ACTION_COLORS = {
  load: "text-emerald-400", use: "text-red-400", adjust: "text-amber-400",
  reserve: "text-sky-400", release: "text-violet-400", commit: "text-blue-400",
  debt: "text-rose-400", monthly_credit: "text-teal-400", increase: "text-emerald-400",
};

const FLOAT_TYPE_LABELS = { sms: "SMS", email: "Email", crb: "CRB", mobile: "Mobile Money", bank: "Bank", utility: "Utility" };

const UTILITY_TYPES = ["electricity", "water", "tv", "internet", "airtime", "other"];

function printReceipt(receipt, saccoName) {
  const isLoad     = (receipt.action ?? "load") === "load";
  const title      = isLoad ? "FLOAT LOAD RECEIPT" : "FLOAT LIQUIDATION RECEIPT";
  const actionWord = isLoad ? "Loaded" : "Liquidated";
  const sName      = receipt.sacco_name ?? saccoName ?? "SACCO";
  const typeLabel  = FLOAT_TYPE_LABELS[receipt.float_type] ?? receipt.float_type ?? "";
  const actioner   = receipt.actioned_by ?? receipt.loaded_by ?? "";
  const unitsLabel = receipt.float_type === "sms" ? "SMS units" : receipt.float_type === "email" ? "email units" : "units";
  const fmtAmt     = (n) => Number(n ?? 0).toLocaleString("en-UG", { minimumFractionDigits: 0 });
  const date       = receipt.created_at
    ? new Date(receipt.created_at).toLocaleString("en-UG", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "—";

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<title>${receipt.receipt_number}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,Helvetica,sans-serif;background:#f0f0f0;padding:32px 16px;color:#000}
.wrap{max-width:480px;margin:0 auto;background:#fff;border:1px solid #bbb;overflow:hidden}
.hd{background:#000;padding:20px 28px;text-align:center;color:#fff}
.hd .org{font-size:18px;font-weight:800;letter-spacing:-.3px}
.hd .sys{font-size:10px;opacity:.55;margin-top:3px;letter-spacing:.5px}
.body{padding:20px 28px 0}
.title{text-align:center;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#000;padding:12px 0 4px}
.rno{display:inline-block;border:1.5px solid #000;padding:3px 14px;font-size:12px;font-weight:700;letter-spacing:.5px;font-family:monospace}
.dtime{font-size:11px;color:#777;text-align:center;margin:6px 0 14px}
hr{border:none;border-top:1px dashed #bbb;margin:12px 0}
table{width:100%;border-collapse:collapse}
td{padding:6px 0;font-size:12px;vertical-align:top}
.key{color:#555;width:50%}
.val{font-weight:600;text-align:right;color:#000}
.amt-wrap{border:2px solid #000;padding:12px 16px;margin:12px 0 16px;display:flex;justify-content:space-between;align-items:center}
.amt-lbl{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#000}
.amt-val{font-size:22px;font-weight:800;color:#000}
.ft{border-top:1px dashed #bbb;padding:12px 28px;text-align:center;font-size:10px;color:#888;margin-top:16px}
@media print{body{padding:0;background:#fff}@page{margin:10mm}}
</style></head><body>
<div class="wrap">
  <div class="hd">
    <div class="org">${sName}</div>
    <div class="sys">${import.meta.env.VITE_APP_NAME ?? "Banking System"} &mdash; ADMIN</div>
  </div>
  <div class="body">
    <div style="text-align:center">
      <div class="title">${title}</div>
      <div><span class="rno">${receipt.receipt_number}</span></div>
      <div class="dtime">${date}</div>
    </div>
    <hr>
    <table>
      <tr><td class="key">Float Type</td><td class="val">${typeLabel}</td></tr>
      <tr><td class="key">Account</td><td class="val">${receipt.account_label ?? "—"}</td></tr>
      ${receipt.units != null ? `<tr><td class="key">Units ${actionWord}</td><td class="val">${fmtAmt(receipt.units)} ${unitsLabel}</td></tr>` : ""}
      ${receipt.notes ? `<tr><td class="key">Notes</td><td class="val" style="font-weight:400">${receipt.notes}</td></tr>` : ""}
    </table>
    <hr>
    <div class="amt-wrap">
      <span class="amt-lbl">Total Amount</span>
      <span class="amt-val">UGX ${fmtAmt(receipt.amount)}</span>
    </div>
    ${actioner ? `<table><tr><td class="key">Processed By</td><td class="val" style="font-weight:400">${actioner}</td></tr></table>` : ""}
  </div>
  <div class="ft">
    <div>Computer-generated receipt &mdash; no signature required.</div>
    <div style="margin-top:3px">&copy; ${new Date().getFullYear()} ${sName} &mdash; ${import.meta.env.VITE_APP_NAME ?? "Banking System"}</div>
  </div>
</div>
</body></html>`;

  const win = window.open("", "_blank", "width=540,height=740,scrollbars=yes");
  if (win) {
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 500);
  }
}

// ── Shared UI ─────────────────────────────────────────────────────────────────

function Loader() {
  return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>;
}

function Err({ msg, onRetry }) {
  return (
    <div className="flex gap-3 items-start text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg p-4">
      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
      <div>
        <p className="text-sm">{msg}</p>
        {onRetry && <button onClick={onRetry} className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 mt-1">Retry</button>}
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

// ── Float Card ────────────────────────────────────────────────────────────────

function FloatCard({ icon: Icon, label, lines, isActive = true, onLoad, onEdit, onLiquidate, onToggle, onDelete, onCarryForward, onInvoice, toggling, deleting }) {
  return (
    <div className={`bg-white dark:bg-gray-900 border rounded-xl p-3.5 transition-opacity ${isActive ? "border-gray-200 dark:border-gray-800" : "border-gray-300 dark:border-gray-700 opacity-60"}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-indigo-400" : "text-gray-500"}`} />
          <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{label}</p>
          {!isActive && <span className="text-[10px] text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded shrink-0">Off</span>}
        </div>
        <div className="flex items-center gap-0.5 shrink-0 ml-1">
          {onLoad && isActive && (
            <button onClick={onLoad} className="flex items-center gap-0.5 text-[11px] text-indigo-400 hover:text-indigo-300 px-1.5 py-1 rounded hover:bg-indigo-950/30">
              <Upload className="w-3 h-3" /> Load
            </button>
          )}
          {onCarryForward && (
            <button onClick={onCarryForward} className="flex items-center gap-0.5 text-[11px] text-teal-400 hover:text-teal-300 px-1.5 py-1 rounded hover:bg-teal-950/30" title="Balance Carried Forward">
              <CornerDownRight className="w-3 h-3" /> B/F
            </button>
          )}
          {onInvoice && (
            <button onClick={onInvoice} className="flex items-center gap-0.5 text-[11px] text-violet-400 hover:text-violet-300 px-1.5 py-1 rounded hover:bg-violet-950/30" title="Send SMS Invoice">
              <Send className="w-3 h-3" /> Invoice
            </button>
          )}
          {onEdit && (
            <button onClick={onEdit} className="p-1 rounded text-gray-500 hover:text-indigo-400" title="Edit">
              <Edit2 className="w-3 h-3" />
            </button>
          )}
          {onLiquidate && isActive && (
            <button onClick={onLiquidate} className="p-1 rounded text-amber-500 hover:bg-amber-900/20" title="Liquidate">
              <TrendingDown className="w-3 h-3" />
            </button>
          )}
          {onToggle && (
            <button onClick={onToggle} disabled={toggling}
              className={`p-1 rounded transition-colors ${isActive ? "text-amber-400 hover:bg-amber-900/20" : "text-emerald-400 hover:bg-emerald-900/20"}`}
              title={isActive ? "Disable" : "Enable"}>
              <Power className="w-3 h-3" />
            </button>
          )}
          {onDelete && (
            <button onClick={onDelete} disabled={deleting}
              className="p-1 rounded text-red-400 hover:bg-red-900/20" title="Delete">
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
      <div className="space-y-1.5">
        {lines.map(([k, v, color]) => (
          <div key={k} className="flex justify-between text-xs">
            <span className="text-gray-500">{k}</span>
            <span className={`tabular-nums font-medium ${color ?? "text-gray-400"}`}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Section Header ────────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, title, onAdd, addLabel }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
        <Icon className="w-3.5 h-3.5" /> {title}
      </p>
      {onAdd && (
        <button onClick={onAdd}
          className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 border border-indigo-300 dark:border-indigo-800/40 hover:border-indigo-500 dark:hover:border-indigo-600 px-2.5 py-1 rounded-lg transition-colors">
          <Plus className="w-3 h-3" /> {addLabel}
        </button>
      )}
    </div>
  );
}

// ── Load Float Modal ──────────────────────────────────────────────────────────

function LoadFloatModal({ saccoId, saccoName, floatData, preType, preAccountId, onClose, onLoaded }) {
  const api = useAdminAxios();
  const [type,      setType]      = useState(preType ?? "sms");
  const [accountId, setAccountId] = useState(preAccountId ? String(preAccountId) : "");
  const [amount,    setAmount]    = useState("");
  const [notes,     setNotes]     = useState("");
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState("");
  const [receipt,   setReceipt]   = useState(null);

  const accounts = {
    sms:     (floatData?.sms     ?? []).map((a)  => ({ account_id: a.account_id,  label: `${a.name} (${a.billing_type})` })),
    email:   (floatData?.email   ?? []).map((a)  => ({ account_id: a.account_id,  label: `${a.name} (${a.billing_type})` })),
    crb:     (floatData?.crb     ?? []).map((a)  => ({ account_id: a.account_id,  label: a.name })),
    mobile:  (floatData?.mobile  ?? []).map((ch) => ({ account_id: ch.channel_id, label: `${ch.provider} — UGX ${fmtCur(ch.available_float)} avail.` })),
    bank:    (floatData?.bank    ?? []).map((a)  => ({ account_id: a.account_id,  label: `${a.bank_name} — ${a.account_number}` })),
    utility: (floatData?.utility ?? []).map((a)  => ({ account_id: a.account_id,  label: `${a.name} (${a.utility_type})` })),
  };

  // Auto-select if exactly one account for this type
  useEffect(() => {
    const accs = accounts[type] ?? [];
    if (accs.length === 1) setAccountId(String(accs[0].account_id));
    else if (!preAccountId) setAccountId("");
  }, [type]); // eslint-disable-line

  const currentAccounts = accounts[type] ?? [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      const res = await api.post(`/admin/floats/${saccoId}/load`, {
        type, account_id: parseInt(accountId), amount: parseFloat(amount), notes: notes || undefined,
      });
      setReceipt(res.data?.data?.receipt ?? null);
      onLoaded();
    } catch (e) {
      setError(e?.response?.data?.messages?.[0] ?? "Failed to load float");
    } finally {
      setSaving(false);
    }
  };

  const isUnits = type === "sms" || type === "email";

  if (receipt) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl w-full max-w-sm">
          <div className="px-6 py-6 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Float Loaded Successfully</p>
            <p className="text-xs text-gray-500 mb-4">Receipt generated</p>
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-left space-y-2 mb-5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Receipt No.</span>
                <span className="font-mono font-medium text-indigo-400">{receipt.receipt_number}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Account</span>
                <span className="text-gray-300">{receipt.account_label}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Type</span>
                <span className="capitalize text-gray-300">{FLOAT_TYPE_LABELS[receipt.float_type]}</span>
              </div>
              {receipt.units != null && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Units</span>
                  <span className="tabular-nums text-emerald-400">{fmtCur(receipt.units)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Amount</span>
                <span className="tabular-nums text-emerald-400">UGX {fmtCur(receipt.amount)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Date</span>
                <span className="text-gray-400">{fmtDate(receipt.created_at)}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => printReceipt(receipt, saccoName)}
                className="flex-1 flex items-center justify-center gap-1.5 border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm py-2 rounded-lg">
                <Printer className="w-3.5 h-3.5" /> Print
              </button>
              <button onClick={onClose}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium py-2 rounded-lg">
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Load Float</h2>
          <button onClick={onClose}><X className="w-4 h-4 text-gray-500 hover:text-gray-900 dark:hover:text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && <Err msg={error} />}
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">Float Type</label>
            <div className="flex flex-wrap gap-1.5">
              {["sms", "email", "crb", "mobile", "bank", "utility"].map((t) => (
                <button key={t} type="button" onClick={() => setType(t)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg border capitalize transition-colors ${type === t ? "bg-indigo-600 border-indigo-600 text-white" : "border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"}`}>
                  {FLOAT_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>
          {currentAccounts.length > 1 ? (
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">Account</label>
              <select required value={accountId} onChange={(e) => setAccountId(e.target.value)}
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500">
                <option value="">Select account…</option>
                {currentAccounts.map((a) => (
                  <option key={a.account_id} value={a.account_id}>{a.label}</option>
                ))}
              </select>
            </div>
          ) : currentAccounts.length === 1 ? (
            <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{currentAccounts[0].label}</span>
            </div>
          ) : (
            <p className="text-xs text-amber-400 bg-amber-900/20 border border-amber-800/30 rounded-lg p-3">
              No {FLOAT_TYPE_LABELS[type]} accounts configured for this SACCO.
            </p>
          )}
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">
              {isUnits ? "Units" : "Amount (UGX)"}
            </label>
            <input type="number" min="1" step={isUnits ? "1" : "0.01"} required
              value={amount} onChange={(e) => setAmount(e.target.value)}
              placeholder={isUnits ? "e.g. 1000" : "e.g. 500000"}
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">Notes (optional)</label>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Monthly top-up"
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm py-2 rounded-lg">Cancel</button>
            <button type="submit" disabled={saving || !accountId || !amount}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-sm py-2 rounded-lg disabled:opacity-50">
              {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin inline mr-1" />Loading…</> : "Load Float"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Create SMS Account Modal ──────────────────────────────────────────────────

function CreateSmsAccountModal({ saccoId, onClose, onCreated }) {
  const api = useAdminAxios();
  const [name, setName]               = useState("Main SMS Wallet");
  const [billingType, setBillingType] = useState("prepaid");
  const [chargePerSms, setChargePerSms] = useState("100");
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      await api.post(`/admin/floats/${saccoId}/sms-accounts`, {
        name, billing_type: billingType, charge_per_sms: parseFloat(chargePerSms),
      });
      onCreated();
    } catch (err) {
      setError(err?.response?.data?.messages?.[0] ?? "Failed to create SMS account");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-400" /> Add SMS Account
          </h2>
          <button onClick={onClose}><X className="w-4 h-4 text-gray-500 hover:text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && <Err msg={error} />}
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">Billing Type</label>
            <div className="flex gap-2">
              {["prepaid", "postpaid"].map((t) => (
                <button key={t} type="button" onClick={() => setBillingType(t)}
                  className={`flex-1 text-xs py-1.5 rounded-lg border capitalize transition-colors ${billingType === t ? "bg-indigo-600 border-indigo-600 text-white" : "border-gray-300 dark:border-gray-700 text-gray-500 hover:text-white"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">Charge per SMS (UGX)</label>
            <input type="number" min="0" step="0.01" value={chargePerSms} onChange={(e) => setChargePerSms(e.target.value)}
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-white text-sm py-2 rounded-lg">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-sm py-2 rounded-lg disabled:opacity-50">
              {saving ? "Creating…" : "Create Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Create Email Account Modal ────────────────────────────────────────────────

function CreateEmailAccountModal({ saccoId, onClose, onCreated }) {
  const api = useAdminAxios();
  const [name, setName]                     = useState("Monthly Email Allowance");
  const [billingType, setBillingType]       = useState("monthly");
  const [monthlyAllowance, setMonthly]      = useState("250");
  const [chargePerEmail, setChargePerEmail] = useState("0");
  const [saving, setSaving]                 = useState(false);
  const [error, setError]                   = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      await api.post(`/admin/floats/${saccoId}/email-accounts`, {
        name, billing_type: billingType,
        monthly_allowance: parseInt(monthlyAllowance),
        charge_per_email: parseFloat(chargePerEmail),
      });
      onCreated();
    } catch (err) {
      setError(err?.response?.data?.messages?.[0] ?? "Failed to create email account");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Mail className="w-4 h-4 text-indigo-400" /> Add Email Account
          </h2>
          <button onClick={onClose}><X className="w-4 h-4 text-gray-500 hover:text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && <Err msg={error} />}
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">Billing Type</label>
            <div className="flex gap-2">
              {["monthly", "postpaid"].map((t) => (
                <button key={t} type="button" onClick={() => setBillingType(t)}
                  className={`flex-1 text-xs py-1.5 rounded-lg border capitalize transition-colors ${billingType === t ? "bg-indigo-600 border-indigo-600 text-white" : "border-gray-300 dark:border-gray-700 text-gray-500 hover:text-white"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          {billingType === "monthly" && (
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">Monthly Allowance (emails)</label>
              <input type="number" min="0" value={monthlyAllowance} onChange={(e) => setMonthly(e.target.value)}
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500" />
            </div>
          )}
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">Charge per Email (UGX)</label>
            <input type="number" min="0" step="0.01" value={chargePerEmail} onChange={(e) => setChargePerEmail(e.target.value)}
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-white text-sm py-2 rounded-lg">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-sm py-2 rounded-lg disabled:opacity-50">
              {saving ? "Creating…" : "Create Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Create CRB Account Modal ──────────────────────────────────────────────────

function CreateCrbAccountModal({ saccoId, onClose, onCreated }) {
  const api = useAdminAxios();
  const [name, setName]     = useState("CRB Wallet");
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      await api.post(`/admin/floats/${saccoId}/crb-accounts`, { name });
      onCreated();
    } catch (err) {
      setError(err?.response?.data?.messages?.[0] ?? "Failed to create CRB account");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-400" /> Add CRB Account
          </h2>
          <button onClick={onClose}><X className="w-4 h-4 text-gray-500 hover:text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && <Err msg={error} />}
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-white text-sm py-2 rounded-lg">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-sm py-2 rounded-lg disabled:opacity-50">
              {saving ? "Creating…" : "Create Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Create Mobile Channel Modal ───────────────────────────────────────────────

function CreateChannelModal({ saccoId, onClose, onCreated }) {
  const api = useAdminAxios();
  const [provider, setProvider] = useState("MTN");
  const [prefixes, setPrefixes] = useState("");
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      await api.post(`/admin/floats/${saccoId}/channels`, {
        provider,
        prefixes: prefixes.split(",").map((s) => s.trim()).filter(Boolean),
      });
      onCreated();
    } catch (err) {
      setError(err?.response?.data?.messages?.[0] ?? "Failed to create channel");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Phone className="w-4 h-4 text-indigo-400" /> Add Mobile Money Channel
          </h2>
          <button onClick={onClose}><X className="w-4 h-4 text-gray-500 hover:text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && <Err msg={error} />}
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">Provider</label>
            <div className="flex gap-2">
              {["MTN", "AIRTEL", "LYCA", "UTL"].map((p) => (
                <button key={p} type="button" onClick={() => setProvider(p)}
                  className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors ${provider === p ? "bg-indigo-600 border-indigo-600 text-white" : "border-gray-300 dark:border-gray-700 text-gray-500 hover:text-white"}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">Prefixes (comma-separated, optional)</label>
            <input type="text" value={prefixes} onChange={(e) => setPrefixes(e.target.value)} placeholder="e.g. 077, 078"
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-white text-sm py-2 rounded-lg">Cancel</button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-sm py-2 rounded-lg disabled:opacity-50">
              {saving ? "Creating…" : "Create Channel"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Create Bank Account Modal ─────────────────────────────────────────────────

function CreateBankAccountModal({ saccoId, onClose, onCreated }) {
  const api = useAdminAxios();
  const [bankName,    setBankName]    = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNum,  setAccountNum]  = useState("");
  const [currency,    setCurrency]    = useState("UGX");
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      await api.post(`/admin/floats/${saccoId}/bank-accounts`, {
        bank_name: bankName, account_name: accountName, account_number: accountNum, currency,
      });
      onCreated();
    } catch (err) {
      setError(err?.response?.data?.messages?.[0] ?? "Failed to create bank account");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Banknote className="w-4 h-4 text-indigo-400" /> Add Bank Account
          </h2>
          <button onClick={onClose}><X className="w-4 h-4 text-gray-500 hover:text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && <Err msg={error} />}
          {[
            ["Bank Name", bankName, setBankName, "e.g. ABC Banking Ltd", true],
            ["Account Name", accountName, setAccountName, "e.g. Float Account", false],
            ["Account Number", accountNum, setAccountNum, "e.g. 01234567890", true],
          ].map(([label, val, setter, ph, req]) => (
            <div key={label}>
              <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">{label}{req && " *"}</label>
              <input type="text" required={req} value={val} onChange={(e) => setter(e.target.value)} placeholder={ph}
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500" />
            </div>
          ))}
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">Currency</label>
            <div className="flex gap-2">
              {["UGX", "USD", "KES"].map((c) => (
                <button key={c} type="button" onClick={() => setCurrency(c)}
                  className={`flex-1 text-xs py-1.5 rounded-lg border transition-colors ${currency === c ? "bg-indigo-600 border-indigo-600 text-white" : "border-gray-300 dark:border-gray-700 text-gray-500 hover:text-white"}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-white text-sm py-2 rounded-lg">Cancel</button>
            <button type="submit" disabled={saving || !bankName || !accountNum}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-sm py-2 rounded-lg disabled:opacity-50">
              {saving ? "Creating…" : "Create Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Create Utility Account Modal ──────────────────────────────────────────────

function CreateUtilityAccountModal({ saccoId, onClose, onCreated }) {
  const api = useAdminAxios();
  const [name, setName]               = useState("");
  const [utilityType, setUtilityType] = useState("other");
  const [billingType, setBillingType] = useState("prepaid");
  const [feeType, setFeeType]         = useState("flat");
  const [feeValue, setFeeValue]       = useState("0");
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      await api.post(`/admin/floats/${saccoId}/utility-accounts`, {
        name, utility_type: utilityType, billing_type: billingType,
        fee_type: feeType, fee_value: parseFloat(feeValue),
      });
      onCreated();
    } catch (err) {
      setError(err?.response?.data?.messages?.[0] ?? "Failed to create utility account");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-400" /> Add Utility Account
          </h2>
          <button onClick={onClose}><X className="w-4 h-4 text-gray-500 hover:text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && <Err msg={error} />}
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">Name *</label>
            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. UMEME Electricity"
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">Type</label>
            <div className="grid grid-cols-3 gap-1.5">
              {UTILITY_TYPES.map((t) => (
                <button key={t} type="button" onClick={() => setUtilityType(t)}
                  className={`text-xs py-1.5 rounded-lg border capitalize transition-colors ${utilityType === t ? "bg-indigo-600 border-indigo-600 text-white" : "border-gray-300 dark:border-gray-700 text-gray-500 hover:text-white"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">Billing Type</label>
            <div className="flex gap-2">
              {["prepaid", "postpaid"].map((t) => (
                <button key={t} type="button" onClick={() => setBillingType(t)}
                  className={`flex-1 text-xs py-1.5 rounded-lg border capitalize transition-colors ${billingType === t ? "bg-indigo-600 border-indigo-600 text-white" : "border-gray-300 dark:border-gray-700 text-gray-500 hover:text-white"}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">Fee Type</label>
              <div className="flex gap-2">
                {["flat", "percent"].map((t) => (
                  <button key={t} type="button" onClick={() => setFeeType(t)}
                    className={`flex-1 text-xs py-1.5 rounded-lg border capitalize transition-colors ${feeType === t ? "bg-indigo-600 border-indigo-600 text-white" : "border-gray-300 dark:border-gray-700 text-gray-500 hover:text-white"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">Fee Value {feeType === "percent" ? "(%)" : "(UGX)"}</label>
              <input type="number" min="0" step="0.01" value={feeValue} onChange={(e) => setFeeValue(e.target.value)}
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500" />
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-white text-sm py-2 rounded-lg">Cancel</button>
            <button type="submit" disabled={saving || !name}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-sm py-2 rounded-lg disabled:opacity-50">
              {saving ? "Creating…" : "Create Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Edit SMS Account Modal ────────────────────────────────────────────────────

function EditSmsAccountModal({ saccoId, account, onClose, onSaved }) {
  const api = useAdminAxios();
  const [name,         setName]         = useState(account.name ?? "");
  const [chargePerSms, setChargePerSms] = useState(String(account.charge_per_sms ?? 0));
  const [creditLimit,  setCreditLimit]  = useState(String(account.credit_limit ?? ""));
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setError("");
    try {
      await api.put(`/admin/floats/${saccoId}/sms-accounts/${account.account_id}`, {
        name, charge_per_sms: parseFloat(chargePerSms),
        ...(account.billing_type === "postpaid" && creditLimit !== "" ? { credit_limit: parseFloat(creditLimit) } : {}),
      });
      onSaved();
    } catch (err) {
      setError(err?.response?.data?.messages?.[0] ?? "Failed to update");
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-400" /> Edit SMS Account
          </h2>
          <button onClick={onClose}><X className="w-4 h-4 text-gray-500 hover:text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          {error && <Err msg={error} />}
          <div>
            <label className="text-[11px] text-gray-500 block mb-1">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="text-[11px] text-gray-500 block mb-1">Charge per SMS (UGX)</label>
            <input type="number" min="0" step="0.01" value={chargePerSms} onChange={(e) => setChargePerSms(e.target.value)}
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500" />
          </div>
          {account.billing_type === "postpaid" && (
            <div>
              <label className="text-[11px] text-gray-500 block mb-1">Credit Limit (UGX)</label>
              <input type="number" min="0" step="0.01" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)}
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500" />
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm py-2 rounded-lg">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-sm py-2 rounded-lg disabled:opacity-50">
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Edit Email Account Modal ───────────────────────────────────────────────────

function EditEmailAccountModal({ saccoId, account, onClose, onSaved }) {
  const api = useAdminAxios();
  const [name,           setName]           = useState(account.name ?? "");
  const [chargePerEmail, setChargePerEmail] = useState(String(account.charge_per_email ?? 0));
  const [monthly,        setMonthly]        = useState(String(account.monthly_allowance ?? 250));
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setError("");
    try {
      await api.put(`/admin/floats/${saccoId}/email-accounts/${account.account_id}`, {
        name, charge_per_email: parseFloat(chargePerEmail),
        ...(account.billing_type === "monthly" ? { monthly_allowance: parseInt(monthly) } : {}),
      });
      onSaved();
    } catch (err) {
      setError(err?.response?.data?.messages?.[0] ?? "Failed to update");
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Mail className="w-4 h-4 text-indigo-400" /> Edit Email Account
          </h2>
          <button onClick={onClose}><X className="w-4 h-4 text-gray-500 hover:text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          {error && <Err msg={error} />}
          <div>
            <label className="text-[11px] text-gray-500 block mb-1">Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500" />
          </div>
          {account.billing_type === "monthly" && (
            <div>
              <label className="text-[11px] text-gray-500 block mb-1">Monthly Allowance (emails)</label>
              <input type="number" min="0" value={monthly} onChange={(e) => setMonthly(e.target.value)}
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500" />
            </div>
          )}
          <div>
            <label className="text-[11px] text-gray-500 block mb-1">Charge per Email (UGX)</label>
            <input type="number" min="0" step="0.01" value={chargePerEmail} onChange={(e) => setChargePerEmail(e.target.value)}
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm py-2 rounded-lg">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-sm py-2 rounded-lg disabled:opacity-50">
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Edit Channel Modal ────────────────────────────────────────────────────────

function EditChannelModal({ saccoId, channel, onClose, onSaved }) {
  const api = useAdminAxios();
  const [prefixes, setPrefixes] = useState((channel.prefixes ?? []).join(", "));
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setError("");
    try {
      await api.put(`/admin/floats/${saccoId}/channels/${channel.channel_id}`, {
        prefixes: prefixes.split(",").map((s) => s.trim()).filter(Boolean),
      });
      onSaved();
    } catch (err) {
      setError(err?.response?.data?.messages?.[0] ?? "Failed to update");
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Phone className="w-4 h-4 text-indigo-400" /> Edit {channel.provider} Channel
          </h2>
          <button onClick={onClose}><X className="w-4 h-4 text-gray-500 hover:text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          {error && <Err msg={error} />}
          <div>
            <label className="text-[11px] text-gray-500 block mb-1">Prefixes (comma-separated)</label>
            <input type="text" value={prefixes} onChange={(e) => setPrefixes(e.target.value)} placeholder="e.g. 077, 078"
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500" />
            <p className="text-[10px] text-gray-600 mt-1">Leave blank to accept all numbers</p>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm py-2 rounded-lg">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-sm py-2 rounded-lg disabled:opacity-50">
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Liquidate Mobile Modal ────────────────────────────────────────────────────

function LiquidateMobileModal({ saccoId, saccoName, channel, onClose, onDone }) {
  const api = useAdminAxios();
  const [amount,  setAmount]  = useState("");
  const [notes,   setNotes]   = useState("");
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");
  const [receipt, setReceipt] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setError("");
    try {
      const res = await api.post(`/admin/floats/${saccoId}/liquidate`, {
        channel_id: channel.channel_id,
        amount: parseFloat(amount),
        notes: notes || undefined,
      });
      setReceipt(res.data?.data?.receipt ?? null);
      onDone();
    } catch (err) {
      setError(err?.response?.data?.messages?.[0] ?? "Failed to liquidate");
    } finally { setSaving(false); }
  };

  if (receipt) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl w-full max-w-sm">
          <div className="px-6 py-6 text-center">
            <CheckCircle2 className="w-10 h-10 text-amber-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Liquidation Complete</p>
            <p className="text-xs text-gray-500 mb-4">Receipt generated</p>
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-left space-y-2 mb-5">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Receipt No.</span>
                <span className="font-mono font-medium text-amber-400">{receipt.receipt_number}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Channel</span>
                <span className="text-gray-300">{receipt.account_label}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Amount</span>
                <span className="tabular-nums text-amber-400">UGX {fmtCur(receipt.amount)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Date</span>
                <span className="text-gray-400">{fmtDate(receipt.created_at)}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => printReceipt(receipt, saccoName)}
                className="flex-1 flex items-center justify-center gap-1.5 border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm py-2 rounded-lg">
                <Printer className="w-3.5 h-3.5" /> Print
              </button>
              <button onClick={onClose}
                className="flex-1 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium py-2 rounded-lg">
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-amber-400" /> Liquidate {channel.provider} Float
          </h2>
          <button onClick={onClose}><X className="w-4 h-4 text-gray-500 hover:text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3">
          {error && <Err msg={error} />}
          <div className="bg-amber-900/20 border border-amber-800/30 rounded-lg px-4 py-3">
            <p className="text-[11px] text-gray-500 mb-0.5">Available float</p>
            <p className="text-sm font-bold text-amber-400">UGX {fmtCur(channel.available_float)}</p>
          </div>
          <div>
            <label className="text-[11px] text-gray-500 block mb-1">Amount to liquidate (UGX)</label>
            <input type="number" min="1" step="0.01" required
              value={amount} onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 500000"
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500" />
          </div>
          <div>
            <label className="text-[11px] text-gray-500 block mb-1">Notes (optional)</label>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. End-of-day withdrawal"
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500" />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm py-2 rounded-lg">Cancel</button>
            <button type="submit" disabled={saving || !amount}
              className="flex-1 bg-amber-600 hover:bg-amber-500 text-white text-sm py-2 rounded-lg disabled:opacity-50">
              {saving ? "Processing…" : "Liquidate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── SMS Carry-Forward Modal ───────────────────────────────────────────────────

// ── SMS Invoice Modal ─────────────────────────────────────────────────────────

function SmsInvoiceModal({ saccoId, saccoName, smsAccount, saccoEmails, onClose }) {
  const api = useAdminAxios();

  const defaultEmails = saccoEmails
    ? saccoEmails.split(",").map((e) => e.trim()).filter(Boolean).join(", ")
    : "";

  const now = new Date();
  const [periodLabel, setPeriodLabel] = useState(
    now.toLocaleString("default", { month: "long", year: "numeric" })
  );
  const [dateFrom, setDateFrom] = useState(
    new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  );
  const [dateTo, setDateTo]       = useState(now.toISOString().slice(0, 10));
  const [emails,  setEmails]       = useState(defaultEmails);
  const [note,    setNote]         = useState("");
  const [sending, setSending]      = useState(false);
  const [sent,    setSent]         = useState(false);
  const [error,   setError]        = useState("");
  const [preview, setPreview]      = useState(false);

  const emailList = emails.split(/[,\n]+/).map((e) => e.trim()).filter(Boolean);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!emailList.length) { setError("Enter at least one recipient email."); return; }
    setSending(true); setError("");
    try {
      await api.post(`/admin/floats/${saccoId}/sms-invoice/${smsAccount.account_id}`, {
        emails:       emailList,
        period_label: periodLabel,
        date_from:    dateFrom,
        date_to:      dateTo,
        note:         note,
      });
      setSent(true);
    } catch (err) {
      setError(err?.response?.data?.messages?.[0] ?? "Failed to send invoice.");
    } finally { setSending(false); }
  };

  const inputCls = "w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-violet-500";

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl w-full max-w-md my-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Send className="w-4 h-4 text-violet-400" /> SMS Invoice
          </h2>
          <button onClick={onClose}><X className="w-4 h-4 text-gray-500 hover:text-white" /></button>
        </div>

        {sent ? (
          <div className="px-6 py-10 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <p className="text-sm font-semibold text-gray-900 dark:text-white">Invoice sent successfully</p>
            <p className="text-xs text-gray-500">Sent to: {emailList.join(", ")}</p>
            <button onClick={onClose}
              className="mt-2 text-xs text-violet-400 hover:text-violet-300">Close</button>
          </div>
        ) : (
          <form onSubmit={handleSend} className="px-6 py-5 space-y-4">
            {error && <div className="flex gap-2 items-start text-red-400 bg-red-900/10 border border-red-800/30 rounded-lg p-3 text-xs"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />{error}</div>}

            {/* Account info */}
            <div className="bg-violet-900/20 border border-violet-800/30 rounded-lg px-4 py-3">
              <p className="text-[11px] text-gray-400 mb-0.5">Billing for</p>
              <p className="text-sm font-semibold text-violet-300">{saccoName}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{smsAccount.name} · {smsAccount.billing_type} · UGX {smsAccount.charge_per_sms}/SMS</p>
              <p className="text-[11px] mt-1">
                <span className="text-gray-500">Balance: </span>
                <span className="text-emerald-400 font-medium">{smsAccount.available_sms?.toLocaleString()} SMS</span>
                {smsAccount.current_due > 0 && (
                  <span className="text-red-400 font-medium ml-2">· UGX {Number(smsAccount.current_due).toLocaleString()} due</span>
                )}
              </p>
            </div>

            {/* Period */}
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">Period Label</label>
              <input type="text" value={periodLabel} onChange={(e) => setPeriodLabel(e.target.value)}
                placeholder="e.g. June 2026" className={inputCls} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">From</label>
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">To</label>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={inputCls} />
              </div>
            </div>

            {/* Recipients */}
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">Recipient Email(s) *</label>
              <textarea rows={2} value={emails} onChange={(e) => setEmails(e.target.value)}
                placeholder="email@sacco.com, another@sacco.com"
                className={`${inputCls} resize-none`} />
              <p className="text-[11px] text-gray-500 mt-1">Separate multiple emails with commas.</p>
            </div>

            {/* Note */}
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">Note (optional)</label>
              <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
                placeholder="Any additional message to include"
                className={inputCls} />
            </div>

            {/* Preview toggle */}
            <button type="button" onClick={() => setPreview((p) => !p)}
              className="text-[11px] text-violet-400 hover:text-violet-300 flex items-center gap-1">
              <Printer className="w-3 h-3" /> {preview ? "Hide" : "Show"} what will be included
            </button>
            {preview && (
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-xs text-gray-500 space-y-1 border border-gray-200 dark:border-gray-700">
                <p><span className="text-gray-900 dark:text-white font-medium">Period:</span> {periodLabel || "—"} ({dateFrom} → {dateTo})</p>
                <p><span className="text-gray-900 dark:text-white font-medium">To:</span> {emailList.length ? emailList.join(", ") : "—"}</p>
                <p><span className="text-gray-900 dark:text-white font-medium">Includes:</span> Last 50 SMS transactions, current balance &amp; amount due</p>
                {note && <p><span className="text-gray-900 dark:text-white font-medium">Note:</span> {note}</p>}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-white text-sm py-2 rounded-lg">Cancel</button>
              <button type="submit" disabled={sending || !emailList.length}
                className="flex-1 bg-violet-600 hover:bg-violet-500 text-white text-sm py-2 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2">
                {sending
                  ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sending…</>
                  : <><Send className="w-3.5 h-3.5" /> Send Invoice</>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function SmsCarryForwardModal({ saccoId, smsAccount, onClose, onSaved }) {
  const api = useAdminAxios();
  const [entryType,   setEntryType]   = useState("credit");
  const [units,       setUnits]       = useState("");
  const [debtAmount,  setDebtAmount]  = useState("");
  const [date,        setDate]        = useState(new Date().toISOString().slice(0, 10));
  const [notes,       setNotes]       = useState("SMS balance carried forward from previous period");
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState("");

  const isCredit = entryType === "credit";
  const canSubmit = isCredit ? !!units : !!debtAmount;
  const computedAmount = isCredit && units && smsAccount.charge_per_sms
    ? (parseInt(units, 10) * smsAccount.charge_per_sms).toLocaleString("en-UG")
    : null;

  const switchType = (type) => {
    setEntryType(type);
    setNotes(type === "debt"
      ? "Unpaid SMS balance carried forward from previous period"
      : "SMS balance carried forward from previous period");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      const payload = {
        entry_type:    entryType,
        charge_per_sms: smsAccount.charge_per_sms ?? 0,
        carry_date:    date,
        notes:         notes || "Balance carried forward from previous period",
        ...(isCredit
          ? { sms_units: parseInt(units, 10) }
          : { debt_amount: parseFloat(debtAmount) }),
      };
      await api.post(`/admin/floats/${saccoId}/sms-carry-forward/${smsAccount.account_id}`, payload);
      onSaved();
    } catch (err) {
      setError(err?.response?.data?.messages?.[0] ?? "Failed to record carry-forward");
    } finally { setSaving(false); }
  };

  const inputCls = "w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-teal-500";

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <CornerDownRight className="w-4 h-4 text-teal-400" /> SMS Balance Carried Forward
          </h2>
          <button onClick={onClose}><X className="w-4 h-4 text-gray-500 hover:text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && <Err msg={error} />}

          <div className="bg-teal-900/20 border border-teal-800/30 rounded-lg px-4 py-3">
            <p className="text-[11px] text-gray-400 mb-0.5">Account</p>
            <p className="text-sm font-semibold text-teal-300">{smsAccount.name}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Rate: UGX {smsAccount.charge_per_sms}/SMS · {smsAccount.billing_type}</p>
          </div>

          {/* Entry type toggle */}
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400 block mb-2">Entry Type</label>
            <div className="flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-700 text-sm">
              {[
                { value: "credit", label: "Credit (SMS units)" },
                { value: "debt",   label: "Unpaid / Debt (UGX)" },
              ].map(({ value, label }) => (
                <button key={value} type="button"
                  onClick={() => switchType(value)}
                  className={`flex-1 py-2 text-xs font-medium transition-colors ${entryType === value ? "bg-teal-600 text-white" : "bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {isCredit ? (
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">SMS Units to carry forward *</label>
              <input type="number" min="1" step="1" required
                value={units} onChange={(e) => setUnits(e.target.value)}
                placeholder="e.g. 4928"
                className={inputCls} />
              {computedAmount && (
                <p className="text-[11px] text-teal-400 mt-1">
                  Amount: UGX {computedAmount}
                </p>
              )}
            </div>
          ) : (
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">Unpaid Amount (UGX) *</label>
              <input type="number" min="1" step="0.01" required
                value={debtAmount} onChange={(e) => setDebtAmount(e.target.value)}
                placeholder="e.g. 25000"
                className={inputCls} />
              <p className="text-[11px] text-amber-400 mt-1">This amount will be added to the account&apos;s unpaid (current due) balance.</p>
            </div>
          )}

          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">As-of Date *</label>
            <input type="date" required
              value={date} onChange={(e) => setDate(e.target.value)}
              className={inputCls} />
          </div>

          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">Notes</label>
            <input type="text"
              value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Balance carried forward from previous period"
              className={inputCls} />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-white text-sm py-2 rounded-lg">Cancel</button>
            <button type="submit" disabled={saving || !canSubmit}
              className="flex-1 bg-teal-600 hover:bg-teal-500 text-white text-sm py-2 rounded-lg disabled:opacity-50">
              {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin inline mr-1" />Saving…</> : "Record B/F Entry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── SACCO Float Detail ────────────────────────────────────────────────────────

function SaccoFloatDetail({ saccoId, saccoName, onBack }) {
  const api = useAdminAxios();
  const [floatData, setFloatData] = useState(null);
  const [history,   setHistory]   = useState([]);
  const [histTotal, setHistTotal] = useState(0);
  const [histPage,  setHistPage]  = useState(1);
  const [histType,  setHistType]  = useState("");
  const [loading, setLoading]     = useState(true);
  const [histLoading, setHistLoading] = useState(true);
  const [error, setError]         = useState("");
  const [showLoad, setShowLoad]   = useState(null); // { type, accountId } | null
  const [modal, setModal]         = useState(null); // 'sms'|'email'|'crb'|'channel'|'bank'|'utility'
  const [editModal,      setEditModal]      = useState(null); // { type: 'sms'|'email'|'channel', account }
  const [liquidateModal, setLiquidateModal] = useState(null); // channel object | null
  const [carryForwardAcc, setCarryForwardAcc] = useState(null); // sms account object | null
  const [invoiceAcc,     setInvoiceAcc]      = useState(null); // sms account for invoice | null
  const [busyId, setBusyId]       = useState(null);
  const [receipts,    setReceipts]    = useState([]);
  const [rcptTotal,   setRcptTotal]   = useState(0);
  const [rcptPage,    setRcptPage]    = useState(1);
  const [rcptLoading, setRcptLoading] = useState(false);
  const [emailingId,  setEmailingId]  = useState(null);
  const [emailMsg,    setEmailMsg]    = useState(null); // { id, ok, text }

  const loadFloats = useCallback(() => {
    setLoading(true);
    api.get(`/admin/floats/${saccoId}`)
      .then((r) => setFloatData(r.data?.data))
      .catch((e) => setError(e?.response?.data?.messages?.[0] ?? "Failed to load floats"))
      .finally(() => setLoading(false));
  }, [saccoId]); // eslint-disable-line

  const loadHistory = useCallback((p, t) => {
    setHistLoading(true);
    api.get(`/admin/floats/${saccoId}/history`, { params: { page: p, type: t } })
      .then((r) => { setHistory(r.data?.data?.history ?? []); setHistTotal(r.data?.data?.total ?? 0); setHistPage(p); })
      .catch(() => {})
      .finally(() => setHistLoading(false));
  }, [saccoId]); // eslint-disable-line

  const loadReceipts = useCallback((p) => {
    setRcptLoading(true);
    api.get(`/admin/floats/${saccoId}/receipts`, { params: { page: p } })
      .then((r) => { setReceipts(r.data?.data?.receipts ?? []); setRcptTotal(r.data?.data?.total ?? 0); setRcptPage(p); })
      .catch(() => {})
      .finally(() => setRcptLoading(false));
  }, [saccoId]); // eslint-disable-line

  useEffect(() => { loadFloats(); loadHistory(1, ""); loadReceipts(1); }, []); // eslint-disable-line

  const makeToggle = (path) => async (id) => {
    setBusyId(id);
    try { await api.patch(`/admin/floats/${saccoId}/${path}/${id}`); loadFloats(); }
    catch (e) { alert(e?.response?.data?.messages?.[0] ?? "Failed"); }
    finally { setBusyId(null); }
  };

  const makeDelete = (path, label) => async (id, name) => {
    if (!confirm(`Delete ${name ?? label}? This cannot be undone.`)) return;
    setBusyId(id);
    try { await api.delete(`/admin/floats/${saccoId}/${path}/${id}`); loadFloats(); }
    catch (e) { alert(e?.response?.data?.messages?.[0] ?? "Failed"); }
    finally { setBusyId(null); }
  };

  const toggleChannel  = makeToggle("channels");
  const deleteChannel  = makeDelete("channels", "channel");
  const toggleBank     = makeToggle("bank-accounts");
  const deleteBank     = makeDelete("bank-accounts", "bank account");
  const toggleSms      = makeToggle("sms-accounts");
  const deleteSms      = makeDelete("sms-accounts", "SMS account");
  const toggleEmail    = makeToggle("email-accounts");
  const deleteEmail    = makeDelete("email-accounts", "email account");
  const toggleCrb      = makeToggle("crb-accounts");
  const deleteCrb      = makeDelete("crb-accounts", "CRB account");
  const toggleUtility  = makeToggle("utility-accounts");
  const deleteUtility  = makeDelete("utility-accounts", "utility account");

  const onCreated = () => { setModal(null); loadFloats(); };

  const emailReceiptFn = async (receiptId) => {
    setEmailingId(receiptId); setEmailMsg(null);
    try {
      const res = await api.post(`/admin/floats/${saccoId}/receipt-email/${receiptId}`);
      setEmailMsg({ id: receiptId, ok: true, text: res.data?.data?.message ?? "Sent" });
    } catch (e) {
      setEmailMsg({ id: receiptId, ok: false, text: e?.response?.data?.messages?.[0] ?? "Failed to send" });
    } finally { setEmailingId(null); }
  };

  if (loading) return <Loader />;
  if (error)   return <Err msg={error} onRetry={loadFloats} />;

  const { sms = [], email = [], mobile = [], crb = [], bank = [], utility = [], sacco: saccoInfo = {} } = floatData ?? {};

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-gray-500 hover:text-gray-900 dark:hover:text-white p-1 rounded transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{saccoName}</h2>
          <p className="text-xs text-gray-500">Float Management</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setShowLoad({})}
            className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 border border-indigo-800/40 hover:border-indigo-600 px-3 py-1.5 rounded-lg transition-colors">
            <Upload className="w-3 h-3" /> Load Float
          </button>
          <button onClick={loadFloats} className="text-gray-500 hover:text-gray-900 dark:hover:text-white p-1.5 rounded-lg transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SMS */}
      <div>
        <SectionHeader icon={MessageSquare} title="SMS" onAdd={() => setModal("sms")} addLabel="Add SMS Account" />
        {sms.length === 0 ? (
          <p className="text-xs text-gray-600 italic">No SMS accounts configured.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {sms.map((a) => (
              <FloatCard key={a.account_id} icon={MessageSquare} label={a.name || "SMS Wallet"}
                isActive={a.is_active}
                lines={[
                  ["Available", `${fmtCur(a.available_sms)} SMS`, "text-emerald-400"],
                  ["Reserved",  `${fmtCur(a.reserved_sms)} SMS`,  "text-amber-400"],
                  ...(a.billing_type === "postpaid"
                    ? [["Due", `UGX ${fmtCur(a.current_due)}`, "text-red-400"]]
                    : [["Rate", `UGX ${a.charge_per_sms}/SMS`]]),
                ]}
                onLoad={() => setShowLoad({ type: "sms", accountId: a.account_id })}
                onCarryForward={() => setCarryForwardAcc(a)}
                onInvoice={() => setInvoiceAcc(a)}
                onEdit={() => setEditModal({ type: "sms", account: a })}
                onToggle={() => toggleSms(a.account_id)}
                onDelete={() => deleteSms(a.account_id, a.name)}
                toggling={busyId === a.account_id}
                deleting={busyId === a.account_id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Email */}
      <div>
        <SectionHeader icon={Mail} title="Email" onAdd={() => setModal("email")} addLabel="Add Email Account" />
        {email.length === 0 ? (
          <p className="text-xs text-gray-600 italic">No email accounts configured.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {email.map((a) => (
              <FloatCard key={a.account_id} icon={Mail} label={a.name || "Email Wallet"}
                isActive={a.is_active}
                lines={[
                  ["Available", `${fmtCur(a.available_emails)} emails`, "text-emerald-400"],
                  ["Reserved",  `${fmtCur(a.reserved_emails)} emails`,  "text-amber-400"],
                  ...(a.billing_type === "monthly"
                    ? [["Allowance", `${fmtCur(a.monthly_allowance)}/mo`]]
                    : [["Rate", `UGX ${a.charge_per_email}/email`]]),
                ]}
                onLoad={() => setShowLoad({ type: "email", accountId: a.account_id })}
                onEdit={() => setEditModal({ type: "email", account: a })}
                onToggle={() => toggleEmail(a.account_id)}
                onDelete={() => deleteEmail(a.account_id, a.name)}
                toggling={busyId === a.account_id}
                deleting={busyId === a.account_id}
              />
            ))}
          </div>
        )}
      </div>

      {/* CRB */}
      <div>
        <SectionHeader icon={Shield} title="CRB" onAdd={() => setModal("crb")} addLabel="Add CRB Account" />
        {crb.length === 0 ? (
          <p className="text-xs text-gray-600 italic">No CRB accounts configured.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {crb.map((a) => (
              <FloatCard key={a.account_id} icon={Shield} label={a.name || "CRB Wallet"}
                isActive={a.is_active}
                lines={[
                  ["Available", `UGX ${fmtCur(a.available_balance)}`, "text-emerald-400"],
                  ["Reserved",  `UGX ${fmtCur(a.reserved_balance)}`,  "text-amber-400"],
                ]}
                onLoad={() => setShowLoad({ type: "crb", accountId: a.account_id })}
                onToggle={() => toggleCrb(a.account_id)}
                onDelete={() => deleteCrb(a.account_id, a.name)}
                toggling={busyId === a.account_id}
                deleting={busyId === a.account_id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Mobile Money */}
      <div>
        <SectionHeader icon={Phone} title="Mobile Money" onAdd={() => setModal("channel")} addLabel="Add Channel" />
        {mobile.length === 0 ? (
          <p className="text-xs text-gray-600 italic">No mobile money channels configured.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {mobile.map((ch) => (
              <FloatCard key={ch.channel_id} icon={Phone} label={`${ch.provider} Float`}
                isActive={ch.is_active}
                lines={[
                  ["Available", `UGX ${fmtCur(ch.available_float)}`, "text-emerald-400"],
                  ["Reserved",  `UGX ${fmtCur(ch.reserved_float)}`,  "text-amber-400"],
                  ...(ch.prefixes?.length ? [["Prefixes", ch.prefixes.join(", ")]] : []),
                ]}
                onLoad={() => setShowLoad({ type: "mobile", accountId: ch.channel_id })}
                onEdit={() => setEditModal({ type: "channel", account: ch })}
                onLiquidate={() => setLiquidateModal(ch)}
                onToggle={() => toggleChannel(ch.channel_id)}
                onDelete={() => deleteChannel(ch.channel_id, ch.provider)}
                toggling={busyId === ch.channel_id}
                deleting={busyId === ch.channel_id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bank */}
      <div>
        <SectionHeader icon={Banknote} title="Bank Accounts" onAdd={() => setModal("bank")} addLabel="Add Bank Account" />
        {bank.length === 0 ? (
          <p className="text-xs text-gray-600 italic">No bank accounts configured.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {bank.map((a) => (
              <FloatCard key={a.account_id} icon={Banknote} label={a.bank_name}
                isActive={a.is_active}
                lines={[
                  ["Account", a.account_number],
                  ["Name",    a.account_name ?? "—"],
                  ["Available", `${a.currency ?? "UGX"} ${fmtCur(a.available_float)}`, "text-emerald-400"],
                  ["Reserved",  `${a.currency ?? "UGX"} ${fmtCur(a.reserved_float)}`,  "text-amber-400"],
                ]}
                onLoad={() => setShowLoad({ type: "bank", accountId: a.account_id })}
                onToggle={() => toggleBank(a.account_id)}
                onDelete={() => deleteBank(a.account_id, a.bank_name)}
                toggling={busyId === a.account_id}
                deleting={busyId === a.account_id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Utility */}
      <div>
        <SectionHeader icon={Zap} title="Utility" onAdd={() => setModal("utility")} addLabel="Add Utility Account" />
        {utility.length === 0 ? (
          <p className="text-xs text-gray-600 italic">No utility accounts configured.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {utility.map((a) => (
              <FloatCard key={a.account_id} icon={Zap} label={a.name}
                isActive={a.is_active}
                lines={[
                  ["Type",      a.utility_type],
                  ["Available", `UGX ${fmtCur(a.available_balance)}`, "text-emerald-400"],
                  ["Reserved",  `UGX ${fmtCur(a.reserved_balance)}`,  "text-amber-400"],
                ]}
                onLoad={() => setShowLoad({ type: "utility", accountId: a.account_id })}
                onToggle={() => toggleUtility(a.account_id)}
                onDelete={() => deleteUtility(a.account_id, a.name)}
                toggling={busyId === a.account_id}
                deleting={busyId === a.account_id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Transaction history */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Transaction History</h3>
          </div>
          <div className="flex flex-wrap gap-1">
            {["", "sms", "email", "crb", "mobile", "bank", "utility"].map((t) => (
              <button key={t} onClick={() => { setHistType(t); loadHistory(1, t); }}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-colors capitalize ${histType === t ? "bg-indigo-600 border-indigo-600 text-white" : "border-gray-300 dark:border-gray-700 text-gray-500 hover:text-gray-900 dark:hover:text-white"}`}>
                {t ? FLOAT_TYPE_LABELS[t] : "All"}
              </button>
            ))}
          </div>
        </div>
        {histLoading ? <Loader /> : history.length === 0 ? (
          <div className="py-10 text-center">
            <History className="w-7 h-7 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No transactions yet.</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-200 dark:divide-gray-800/60">
              {history.map((tx, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 uppercase">{FLOAT_TYPE_LABELS[tx.type] ?? tx.type}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium capitalize ${ACTION_COLORS[tx.action] ?? "text-gray-600 dark:text-gray-400"}`}>{tx.action}</span>
                        <span className="text-xs text-gray-500">{tx.account}</span>
                      </div>
                      {tx.notes && <p className="text-xs text-gray-500 dark:text-gray-600 mt-0.5">{tx.notes}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    {tx.units != null && <p className="text-xs text-gray-500 dark:text-gray-300 tabular-nums">{fmtCur(tx.units)} units</p>}
                    <p className="text-xs text-gray-600 dark:text-gray-400 tabular-nums">UGX {fmtCur(tx.amount)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-600 mt-0.5">{fmtDate(tx.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
            <Pager page={histPage} total={histTotal} perPage={30} onPage={(p) => loadHistory(p, histType)} />
          </>
        )}
      </div>

      {/* Load Receipts */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Load Receipts</h3>
          </div>
          <button onClick={() => loadReceipts(1)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white p-1 rounded">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
        {rcptLoading ? <Loader /> : receipts.length === 0 ? (
          <div className="py-10 text-center">
            <Receipt className="w-7 h-7 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No receipts yet.</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-200 dark:divide-gray-800/60">
              {receipts.map((r) => (
                <div key={r.id} className="px-5 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`font-mono text-xs shrink-0 ${(r.action ?? "load") === "load" ? "text-indigo-400" : "text-amber-400"}`}>{r.receipt_number}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 shrink-0 capitalize">
                        {(r.action ?? "load") !== "load" ? "Liquidate · " : ""}{FLOAT_TYPE_LABELS[r.float_type] ?? r.float_type}
                      </span>
                      <span className="text-xs text-gray-500 truncate">{r.account_label}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-3">
                      <div className="text-right mr-2">
                        {r.units != null && <p className="text-xs text-gray-400 tabular-nums">{fmtCur(r.units)} units</p>}
                        <p className={`text-xs tabular-nums ${(r.action ?? "load") === "load" ? "text-emerald-400" : "text-amber-400"}`}>UGX {fmtCur(r.amount)}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-600">{fmtDate(r.created_at)}</p>
                      </div>
                      <button onClick={() => printReceipt(r, saccoName)} title="Print receipt"
                        className="p-1.5 rounded text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors">
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => emailReceiptFn(r.receipt_id)} title="Email to SACCO"
                        disabled={emailingId === r.receipt_id}
                        className="p-1.5 rounded text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors disabled:opacity-40">
                        {emailingId === r.receipt_id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  {emailMsg?.id === r.receipt_id && (
                    <p className={`text-[11px] mt-1 ${emailMsg.ok ? "text-emerald-400" : "text-red-400"}`}>{emailMsg.text}</p>
                  )}
                </div>
              ))}
            </div>
            <Pager page={rcptPage} total={rcptTotal} perPage={20} onPage={loadReceipts} />
          </>
        )}
      </div>

      {showLoad && (
        <LoadFloatModal saccoId={saccoId} saccoName={saccoName} floatData={floatData}
          preType={showLoad.type}
          preAccountId={showLoad.accountId}
          onClose={() => { setShowLoad(null); loadReceipts(1); }}
          onLoaded={() => { loadFloats(); loadHistory(1, histType); }} />
      )}
      {modal === "sms"     && <CreateSmsAccountModal     saccoId={saccoId} onClose={() => setModal(null)} onCreated={onCreated} />}
      {modal === "email"   && <CreateEmailAccountModal   saccoId={saccoId} onClose={() => setModal(null)} onCreated={onCreated} />}
      {modal === "crb"     && <CreateCrbAccountModal     saccoId={saccoId} onClose={() => setModal(null)} onCreated={onCreated} />}
      {modal === "channel" && <CreateChannelModal        saccoId={saccoId} onClose={() => setModal(null)} onCreated={onCreated} />}
      {modal === "bank"    && <CreateBankAccountModal    saccoId={saccoId} onClose={() => setModal(null)} onCreated={onCreated} />}
      {modal === "utility" && <CreateUtilityAccountModal saccoId={saccoId} onClose={() => setModal(null)} onCreated={onCreated} />}
      {editModal?.type === "sms"     && <EditSmsAccountModal   saccoId={saccoId} account={editModal.account} onClose={() => setEditModal(null)} onSaved={() => { setEditModal(null); loadFloats(); }} />}
      {editModal?.type === "email"   && <EditEmailAccountModal saccoId={saccoId} account={editModal.account} onClose={() => setEditModal(null)} onSaved={() => { setEditModal(null); loadFloats(); }} />}
      {editModal?.type === "channel" && <EditChannelModal      saccoId={saccoId} channel={editModal.account} onClose={() => setEditModal(null)} onSaved={() => { setEditModal(null); loadFloats(); }} />}
      {liquidateModal && (
        <LiquidateMobileModal
          saccoId={saccoId}
          saccoName={saccoName}
          channel={liquidateModal}
          onClose={() => { setLiquidateModal(null); loadReceipts(1); }}
          onDone={() => { loadFloats(); loadHistory(1, histType); }}
        />
      )}
      {carryForwardAcc && (
        <SmsCarryForwardModal
          saccoId={saccoId}
          smsAccount={carryForwardAcc}
          onClose={() => setCarryForwardAcc(null)}
          onSaved={() => { setCarryForwardAcc(null); loadFloats(); loadHistory(1, histType); }}
        />
      )}

      {invoiceAcc && (
        <SmsInvoiceModal
          saccoId={saccoId}
          saccoName={saccoName}
          smsAccount={invoiceAcc}
          saccoEmails={saccoInfo.sacco_emails ?? ""}
          onClose={() => setInvoiceAcc(null)}
        />
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminFloats() {
  const api = useAdminAxios();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [search, setSearch]   = useState("");
  const [selected, setSelected] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    api.get("/admin/floats")
      .then((r) => setData(r.data?.data))
      .catch((e) => setError(e?.response?.data?.messages?.[0] ?? "Failed to load float data"))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  useEffect(() => { load(); }, []); // eslint-disable-line

  if (selected) {
    const row = data?.saccos?.find((s) => s.sacco_id === selected);
    return (
      <SaccoFloatDetail
        saccoId={selected}
        saccoName={row?.sacco_name ?? "SACCO"}
        onBack={() => { setSelected(null); load(); }}
      />
    );
  }

  const saccos = (data?.saccos ?? []).filter((s) =>
    !search || s.sacco_name.toLowerCase().includes(search.toLowerCase())
  );

  const totals = data?.totals ?? {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Float Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Platform-wide float balances across all SACCOs</p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-700 px-3 py-1.5 rounded-lg transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { label: "SMS Units",       value: fmtCur(totals.total_sms_units),          icon: MessageSquare, color: "text-sky-600 dark:text-sky-400",     bg: "bg-sky-100 dark:bg-sky-900/20" },
            { label: "Email Units",     value: fmtCur(totals.total_email_units),         icon: Mail,          color: "text-violet-600 dark:text-violet-400",  bg: "bg-violet-100 dark:bg-violet-900/20" },
            { label: "CRB Balance",     value: `UGX ${fmtCur(totals.total_crb_balance)}`,     icon: Shield,  color: "text-amber-600 dark:text-amber-400",   bg: "bg-amber-100 dark:bg-amber-900/20" },
            { label: "Mobile Float",    value: `UGX ${fmtCur(totals.total_mobile_float)}`,    icon: Phone,   color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-900/20" },
            { label: "Utility Balance", value: `UGX ${fmtCur(totals.total_utility_balance)}`, icon: Zap,     color: "text-rose-600 dark:text-rose-400",    bg: "bg-rose-100 dark:bg-rose-900/20" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
                </div>
                <div className={`p-2 rounded-lg ${bg} ${color}`}><Icon className="w-4 h-4" /></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <Err msg={error} onRetry={load} />}

      <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
        placeholder="Search SACCOs…"
        className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-indigo-500 placeholder-gray-400 dark:placeholder-gray-600" />

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        {loading ? <Loader /> : !saccos.length ? (
          <div className="py-16 text-center">
            <Wallet className="w-8 h-8 text-gray-700 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No SACCOs found.</p>
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="text-xs text-gray-500 uppercase tracking-wide border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-5 py-3 text-left">SACCO</th>
                  <th className="px-5 py-3 text-right">SMS</th>
                  <th className="px-5 py-3 text-right">Email</th>
                  <th className="px-5 py-3 text-right">CRB</th>
                  <th className="px-5 py-3 text-right">Mobile</th>
                  <th className="px-5 py-3 text-right">Utility</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800/60">
                {saccos.map((s) => (
                  <tr key={s.sacco_id} onClick={() => setSelected(s.sacco_id)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors cursor-pointer">
                    <td className="px-5 py-2">
                      <div className="flex items-center gap-2">
                        <div className="relative w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-600/30 flex items-center justify-center shrink-0 overflow-hidden">
                          <Building2 className="w-3 h-3 text-indigo-500 dark:text-indigo-400" />
                          {s.sacco_logo && (
                            <img src={saccoLogoUrl(s.sacco_logo)} alt=""
                              className="absolute inset-0 w-full h-full object-cover"
                              onError={(e) => { e.currentTarget.style.display = "none"; }} />
                          )}
                        </div>
                        <span className="text-gray-900 dark:text-white truncate max-w-[200px]">{s.sacco_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-2 text-right tabular-nums">
                      <span className={s.sms_units > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400 dark:text-gray-600"}>{fmtCur(s.sms_units)}</span>
                    </td>
                    <td className="px-5 py-2 text-right tabular-nums">
                      <span className={s.email_units > 0 ? "text-violet-600 dark:text-violet-400" : "text-gray-400 dark:text-gray-600"}>{fmtCur(s.email_units)}</span>
                    </td>
                    <td className="px-5 py-2 text-right tabular-nums">
                      <span className={s.crb_balance > 0 ? "text-amber-600 dark:text-amber-400" : "text-gray-400 dark:text-gray-600"}>UGX {fmtCur(s.crb_balance)}</span>
                    </td>
                    <td className="px-5 py-2 text-right tabular-nums">
                      <span className={s.mm_float > 0 ? "text-sky-600 dark:text-sky-400" : "text-gray-400 dark:text-gray-600"}>UGX {fmtCur(s.mm_float)}</span>
                    </td>
                    <td className="px-5 py-2 text-right tabular-nums">
                      <span className={s.utility_balance > 0 ? "text-rose-600 dark:text-rose-400" : "text-gray-400 dark:text-gray-600"}>UGX {fmtCur(s.utility_balance)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

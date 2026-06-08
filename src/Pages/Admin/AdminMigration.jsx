import { useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Upload, FileArchive, CheckCircle2, AlertCircle,
  ArrowLeft, Loader2, RefreshCw, ChevronDown, ChevronUp,
  X, ShieldAlert, TriangleAlert,
} from "lucide-react";
import adminAxios from "@/Config/AdminAxios";

const SHEETS = [
  "01_chart_of_accounts",
  "02_fiscal_year",
  "03_sacco_defaults",
  "04_users",
  "05_tills",
  "06_clients_individual",
  "07_clients_group",
  "08_clients_group_members",
  "09_clients_company",
  "10_clients_joint",
  "11_loans",
  "12_group_loan_allocations",
  "13_account_statements",
];

function SheetResult({ name, result }) {
  const [open, setOpen] = useState(result?.errors?.length > 0);
  if (!result) return null;

  const hasErrors = result.errors?.length > 0;
  return (
    <div className={`border rounded-lg overflow-hidden ${hasErrors ? "border-red-800/50" : "border-gray-800"}`}>
      <button
        className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-gray-800/40 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3">
          {hasErrors
            ? <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            : <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />}
          <span className="text-sm font-medium text-white">{name.replace(/_/g, " ")}</span>
          <span className="text-xs text-gray-500 font-mono">
            {result.created != null && `+${result.created} created`}
            {result.skipped  != null && ` · ${result.skipped} skipped`}
            {result.updated  != null && ` · ${result.updated} updated`}
          </span>
        </div>
        {hasErrors && (open ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />)}
      </button>
      {open && hasErrors && (
        <div className="px-4 pb-3 space-y-1">
          {result.errors.map((e, i) => (
            <p key={i} className="text-xs text-red-300 bg-red-900/20 rounded px-2 py-1 font-mono">{e}</p>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminMigration() {
  const navigate   = useNavigate();
  const [params]   = useSearchParams();
  const saccoId    = params.get("sacco_id") || "";
  const saccoName  = params.get("name")     || "";

  const fileRef      = useRef(null);
  const [acknowledged, setAcknowledged] = useState(false);
  const [file, setFile]     = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,  setError]  = useState("");

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f?.name.endsWith(".zip")) { setFile(f); setError(""); }
    else setError("Only .zip files are accepted.");
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) { setFile(f); setError(""); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { setError("Please select a ZIP file."); return; }

    setLoading(true);
    setError("");
    setReport(null);

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await adminAxios.post("/migrations/full-setup", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setReport(res.data?.data ?? {});
    } catch (err) {
      const msg = err?.response?.data?.messages;
      const d   = err?.response?.data?.data;
      if (d) {
        setReport(d);
      } else {
        setError(Array.isArray(msg) ? msg.join(", ") : (msg ?? "Migration failed. Check the server."));
      }
    } finally {
      setLoading(false);
    }
  };

  const sheetKeys = report ? Object.keys(report.sheets ?? {}) : [];
  const totalErrors = report?.errors?.length ?? 0;
  const totalWarnings = report?.warnings?.length ?? 0;

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">Full Setup Migration</h1>
          <p className="text-sm text-gray-500">
            {saccoName
              ? <>Uploading for <span className="text-indigo-400 font-medium">{saccoName}</span> (#{saccoId})</>
              : "Upload a ZIP containing CSV sheets for the active SACCO"}
          </p>
        </div>
      </div>

      {/* Danger warning */}
      {!report && (
        <div className="border border-red-800/60 bg-red-900/20 rounded-xl p-5 space-y-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-400">Do not tamper with this migration</p>
              <p className="text-xs text-red-300/80 mt-1 leading-relaxed">
                This process will permanently write data (clients, accounts, loans, schedules, allocations)
                into the live database for the selected SACCO. It <strong>cannot be undone</strong> once submitted.
                Incorrect or duplicate data will corrupt balances, schedules, and audit trails.
                Only upload a fully validated ZIP prepared by a certified data analyst.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <input
              id="ack"
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="rounded border-red-700 bg-red-900/40 text-red-500 focus:ring-red-600"
            />
            <label htmlFor="ack" className="text-red-300 cursor-pointer select-none">
              I understand this action is irreversible and the data has been verified
            </label>
          </div>
          {!acknowledged && (
            <div className="flex items-center gap-1.5 text-xs text-amber-400">
              <TriangleAlert className="w-3.5 h-3.5 shrink-0" />
              Acknowledge the warning above to enable the upload form
            </div>
          )}
        </div>
      )}

      {/* Upload form */}
      {!report && acknowledged && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-700 hover:border-indigo-500 rounded-xl p-10 text-center cursor-pointer transition-colors"
          >
            <input
              type="file"
              accept=".zip"
              ref={fileRef}
              className="hidden"
              onChange={handleFileChange}
            />
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileArchive className="w-6 h-6 text-indigo-400" />
                <div className="text-left">
                  <p className="text-sm font-medium text-white">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="ml-2 text-gray-600 hover:text-red-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div>
                <Upload className="w-8 h-8 text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-400">Drop your <span className="text-white font-medium">.zip</span> file here, or click to browse</p>
                <p className="text-xs text-gray-600 mt-1">Max 20 MB · Must contain CSVs at root level</p>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-400 bg-red-900/20 border border-red-800/40 rounded-lg px-4 py-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Sheet reference */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Expected CSV files (all optional)</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {SHEETS.map((s) => (
                <p key={s} className="text-xs text-gray-500 font-mono">{s}.csv</p>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !file}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</> : <><Upload className="w-4 h-4" /> Run Migration</>}
          </button>
        </form>
      )}

      {/* Report */}
      {report && (
        <div className="space-y-4">
          {/* Summary banner */}
          <div className={`border rounded-xl p-4 flex items-start gap-3 ${totalErrors === 0 ? "bg-green-900/10 border-green-700/40" : "bg-amber-900/10 border-amber-700/40"}`}>
            {totalErrors === 0
              ? <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
              : <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />}
            <div>
              <p className={`font-semibold text-sm ${totalErrors === 0 ? "text-green-300" : "text-amber-300"}`}>
                {totalErrors === 0 ? "Migration completed successfully" : `Migration completed with ${totalErrors} error(s)`}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {sheetKeys.length} sheet(s) processed
                {totalWarnings > 0 && ` · ${totalWarnings} warning(s)`}
              </p>
            </div>
          </div>

          {/* Warnings */}
          {totalWarnings > 0 && (
            <div className="bg-amber-900/10 border border-amber-800/40 rounded-xl p-4 space-y-1">
              <p className="text-xs font-semibold text-amber-400 mb-2">Warnings</p>
              {report.warnings.map((w, i) => (
                <p key={i} className="text-xs text-amber-300">{w}</p>
              ))}
            </div>
          )}

          {/* Per-sheet results */}
          <div className="space-y-2">
            {sheetKeys.map((key) => (
              <SheetResult key={key} name={key} result={report.sheets[key]} />
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => { setReport(null); setFile(null); }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-gray-700 text-sm text-gray-400 hover:text-white hover:border-gray-600 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Run Another
            </button>
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import { useRef, useState } from "react";
import {
  Upload, FileArchive, CheckCircle2, AlertCircle, RefreshCw,
  ChevronDown, ChevronUp, X, Download,
} from "lucide-react";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";

const SHEETS = [
  { file: "01_chart_of_accounts.csv",     label: "Chart of Accounts",       note: "Account groups, sub-groups, GL accounts + opening balances" },
  { file: "02_fiscal_year.csv",           label: "Fiscal Year",             note: "Single row — skipped if an active fiscal year already exists" },
  { file: "03_sacco_defaults.csv",        label: "SACCO Defaults",          note: "Maps account codes to system default GL accounts" },
  { file: "04_users.csv",                 label: "Staff Users",             note: "Default password: Sacco@2024! · Default PIN: 1234" },
  { file: "05_tills.csv",                 label: "Transaction Tills",       note: "Links cashiers to their GL till accounts" },
  { file: "06_clients_individual.csv",    label: "Individual Clients",      note: "Includes next-of-kin and optional opening balance" },
  { file: "07_clients_group.csv",         label: "Group Clients",           note: "Group account entities" },
  { file: "08_clients_group_members.csv", label: "Group Members",           note: "Links members to groups — both must exist first" },
  { file: "09_clients_company.csv",       label: "Company Clients",         note: "Company accounts + registration details" },
  { file: "10_clients_joint.csv",         label: "Joint Account Clients",   note: "Up to 4 holders per account" },
  { file: "11_loans.csv",                 label: "Loans",                   note: "Auto-generates amortisation schedule with historical payments applied" },
  { file: "12_group_loan_allocations.csv",label: "Group Loan Allocations",  note: "Per-member allocations + proportional member schedules" },
  { file: "13_account_statements.csv",    label: "Account Statements",      note: "Historical ledger rows — display only, no journal re-posting" },
];

function SheetResult({ name, result }) {
  const [open, setOpen] = useState(result?.errors?.length > 0);
  if (!result) return null;
  const hasErrors = result.errors?.length > 0;

  return (
    <div className={`border rounded-lg overflow-hidden ${hasErrors ? "border-red-200" : "border-border"}`}>
      <button
        className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-muted/40 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3 min-w-0">
          {hasErrors
            ? <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            : <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
          <span className="text-sm font-medium truncate">{name.replace(/_/g, " ")}</span>
          <span className="text-xs text-muted-foreground font-mono shrink-0">
            {result.created != null && `+${result.created} created`}
            {result.skipped  != null && ` · ${result.skipped} skipped`}
            {result.updated  != null && ` · ${result.updated} updated`}
          </span>
        </div>
        {hasErrors && (open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />)}
      </button>
      {open && hasErrors && (
        <div className="px-4 pb-3 space-y-1">
          {result.errors.map((e, i) => (
            <p key={i} className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1 font-mono">{e}</p>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DataMigration() {
  const axios    = useAxiosPrivate();
  const fileRef  = useRef(null);

  const [file,   setFile]   = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,  setError]  = useState("");

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f?.name.endsWith(".zip")) { setFile(f); setError(""); }
    else setError("Only .zip files are accepted.");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { setError("Please select a ZIP file first."); return; }
    setLoading(true);
    setError("");
    setReport(null);

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await axios.post("/migrations/full-setup", form, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 300_000, // 5 min — large datasets can be slow
      });
      setReport(res.data?.data ?? {});
    } catch (err) {
      const d   = err?.response?.data?.data;
      const msg = err?.response?.data?.messages;
      if (d) {
        setReport(d);
      } else {
        setError(Array.isArray(msg) ? msg.join(", ") : (msg ?? "Migration failed. Please try again."));
      }
    } finally {
      setLoading(false);
    }
  };

  const sheetKeys     = report ? Object.keys(report.sheets ?? {}) : [];
  const totalErrors   = report?.errors?.length ?? 0;
  const totalWarnings = report?.warnings?.length ?? 0;

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink to="/dashboard">Home</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink to="/general-config">System Settings</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Data Migration</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="space-y-6 pt-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h5 className="text-2xl font-bold tracking-tight">Data Migration</h5>
            <p className="text-sm text-muted-foreground mt-1">
              Import historical data from your previous system via a single ZIP file.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open("https://docs.example.com/migration", "_blank")}
          >
            <Download className="w-4 h-4 mr-1.5" />
            Download Templates
          </Button>
        </div>

        {!report ? (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Upload panel */}
            <div className="lg:col-span-3 space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Drop zone */}
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-10 text-center cursor-pointer transition-colors"
                >
                  <input type="file" accept=".zip" ref={fileRef} className="hidden" onChange={(e) => { if (e.target.files[0]) { setFile(e.target.files[0]); setError(""); } }} />
                  {file ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileArchive className="w-6 h-6 text-primary" />
                      <div className="text-left">
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setFile(null); }}
                        className="ml-2 text-muted-foreground hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">
                        Drop your <span className="font-medium text-foreground">.zip</span> file here, or click to browse
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-1">Max 20 MB · CSVs must be at root of ZIP</p>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-4 py-3">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                <Button type="submit" disabled={loading || !file} className="w-full">
                  {loading
                    ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Processing (this may take a while)…</>
                    : <><Upload className="w-4 h-4 mr-2" /> Run Migration</>}
                </Button>
              </form>

              <Card className="border border-amber-200 bg-amber-50/50">
                <CardContent className="p-4 text-sm text-amber-800 space-y-1">
                  <p className="font-medium">Before you upload</p>
                  <ul className="text-xs space-y-0.5 list-disc list-inside text-amber-700">
                    <li>Migration is safe to re-run — duplicates are skipped automatically.</li>
                    <li>Numbers must not contain commas (e.g. use 1000000 not 1,000,000).</li>
                    <li>Opening balances in Sheet 01 must balance (Dr = Cr) or the journal is skipped.</li>
                    <li>Sheet 08 (group members) depends on sheets 06 and 07 existing first.</li>
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Sheet reference */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">CSV Files Reference</CardTitle>
                  <CardDescription className="text-xs">All sheets are optional — include only what you have.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  {SHEETS.map(({ file: f, label, note }) => (
                    <div key={f} className="border-b last:border-0 pb-2 last:pb-0">
                      <p className="text-xs font-medium font-mono text-foreground">{f}</p>
                      <p className="text-xs font-medium text-muted-foreground">{label}</p>
                      <p className="text-[11px] text-muted-foreground/70">{note}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          /* Report view */
          <div className="space-y-4 max-w-2xl">
            {/* Summary */}
            <div className={`border rounded-xl p-4 flex items-start gap-3 ${totalErrors === 0 ? "bg-emerald-50 border-emerald-200" : "bg-amber-50 border-amber-200"}`}>
              {totalErrors === 0
                ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                : <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />}
              <div>
                <p className={`font-semibold text-sm ${totalErrors === 0 ? "text-emerald-800" : "text-amber-800"}`}>
                  {totalErrors === 0 ? "Migration completed successfully" : `Migration completed with ${totalErrors} error(s)`}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {sheetKeys.length} sheet(s) processed
                  {totalWarnings > 0 && ` · ${totalWarnings} warning(s)`}
                </p>
              </div>
            </div>

            {/* Warnings */}
            {totalWarnings > 0 && (
              <Card className="border-amber-200 bg-amber-50/50">
                <CardContent className="p-4 space-y-1">
                  <p className="text-xs font-semibold text-amber-700 mb-2">Warnings</p>
                  {report.warnings.map((w, i) => (
                    <p key={i} className="text-xs text-amber-700">{w}</p>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Per-sheet */}
            <div className="space-y-2">
              {sheetKeys.map((key) => (
                <SheetResult key={key} name={key} result={report.sheets[key]} />
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => { setReport(null); setFile(null); }}>
                <RefreshCw className="w-4 h-4 mr-1.5" /> Run Another Migration
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

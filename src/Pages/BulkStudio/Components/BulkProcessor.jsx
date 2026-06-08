/* eslint-disable react/prop-types */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  CheckCircle2,
  XCircle,
  Loader2,
  FileUp,
  ShieldCheck,
  Play,
} from "lucide-react";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { useToast } from "@/hooks/use-toast";

function parseCSVText(text, numCols) {
  const lines = text.split("\n").filter((l) => l.trim());
  return lines.slice(1).map((line, i) => {
    const cells = line.split(",").map((c) => c.trim());
    while (cells.length < numCols) cells.push("");
    return { row: i + 2, cells };
  });
}

function ResultsTable({ results }) {
  return (
    <div className="border rounded-lg overflow-auto max-h-56">
      <table className="w-full text-xs">
        <thead className="bg-muted/50 border-b sticky top-0">
          <tr>
            <th className="px-2 py-1.5 text-left">Row</th>
            <th className="px-2 py-1.5 text-left">Identifier</th>
            <th className="px-2 py-1.5 text-center">Status</th>
            <th className="px-2 py-1.5 text-left">Detail</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <tr
              key={r.row}
              className={`border-b ${r.status === "failed" ? "bg-red-50/60 dark:bg-red-900/10" : ""}`}
            >
              <td className="px-2 py-1 text-muted-foreground">{r.row}</td>
              <td className="px-2 py-1 font-mono">
                {r.account || r.member_no || "—"}
              </td>
              <td className="px-2 py-1 text-center">
                {r.status === "success" ? (
                  <CheckCircle2 size={13} className="inline text-emerald-600" />
                ) : (
                  <XCircle size={13} className="inline text-red-600" />
                )}
              </td>
              <td
                className={`px-2 py-1 ${r.status === "failed" ? "text-red-600" : "text-muted-foreground"}`}
              >
                {r.error ||
                  (r.member_no
                    ? `Will register as ${r.member_no}`
                    : r.code
                      ? `Code: ${r.code}`
                      : "✓")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SummaryBadges({ data }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge className="bg-emerald-600 hover:bg-emerald-600 gap-1">
        <CheckCircle2 size={11} /> {data.success} ready
      </Badge>
      {data.failed > 0 && (
        <Badge variant="destructive" className="gap-1">
          <XCircle size={11} /> {data.failed} will fail
        </Badge>
      )}
      <span className="text-xs text-muted-foreground">{data.total} rows total</span>
    </div>
  );
}

export default function BulkProcessor({
  endpoint,
  csvColumns,
  sampleRows,
  submitLabel = "Process Batch",
}) {
  const axios = useAxiosPrivate();
  const { toast } = useToast();

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);

  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState(null); // dry-run result

  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null); // final committed result

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setValidation(null);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (ev) =>
      setPreview(parseCSVText(ev.target.result, csvColumns.length));
    reader.readAsText(f);
  };

  const downloadSample = () => {
    const header = csvColumns.join(",");
    const rows = sampleRows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([header + "\n" + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bulk_${endpoint.split("/").pop()}_sample.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sendRequest = async (action) => {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("pin", pin);
    fd.append("action", action);
    const res = await axios.post(endpoint, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data?.data;
  };

  const handleValidate = async (e) => {
    e.preventDefault();
    if (!file || !pin) return;
    setValidating(true);
    setValidation(null);
    try {
      const d = await sendRequest("validate");
      setValidation(d);
      if (d.failed === 0) {
        toast({
          title: "Validation passed",
          description: `All ${d.success} rows are ready to process.`,
        });
      } else {
        toast({
          title: "Validation found issues",
          description: `${d.failed} row${d.failed > 1 ? "s" : ""} will fail. Fix them before processing.`,
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Validation failed",
        description: err.response?.data?.messages?.[0] ?? "An error occurred",
        variant: "destructive",
      });
    } finally {
      setValidating(false);
    }
  };

  const handleProcess = async () => {
    if (!file || !pin) return;
    setProcessing(true);
    try {
      const d = await sendRequest("process");
      setResult(d);
      setValidation(null);
      toast({
        title: "Batch complete",
        description: `${d?.success ?? 0} succeeded · ${d?.failed ?? 0} failed`,
      });
    } catch (err) {
      toast({
        title: "Processing failed",
        description: err.response?.data?.messages?.[0] ?? "An error occurred",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview([]);
    setPin("");
    setValidation(null);
    setResult(null);
  };

  return (
    <div className="space-y-5">
      {/* Upload */}
      <div className="space-y-2">
        <Label>Upload CSV File</Label>
        <div className="flex items-center gap-3">
          <label className="flex-1 flex items-center gap-2 h-10 rounded-md border border-input bg-background px-3 cursor-pointer text-sm text-muted-foreground hover:bg-muted/40 transition-colors">
            <FileUp size={14} />
            {file ? (
              <span className="text-foreground truncate">{file.name}</span>
            ) : (
              <span>Choose CSV file…</span>
            )}
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFile}
            />
          </label>
          <Button variant="outline" type="button" size="sm" onClick={downloadSample}>
            <Download size={13} className="mr-1" /> Sample CSV
          </Button>
        </div>
      </div>

      {/* Preview */}
      {preview.length > 0 && !result && (
        <>
          <div className="border rounded-lg overflow-auto max-h-64">
            <table className="w-full text-xs">
              <thead className="bg-muted/50 border-b sticky top-0">
                <tr>
                  <th className="px-2 py-1.5 text-left text-muted-foreground">#</th>
                  {csvColumns.map((c) => (
                    <th key={c} className="px-2 py-1.5 text-left font-medium">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map(({ row, cells }) => (
                  <tr key={row} className="border-b hover:bg-muted/20">
                    <td className="px-2 py-1 text-muted-foreground">{row}</td>
                    {cells.map((c, i) => (
                      <td key={i} className="px-2 py-1">
                        {c || <span className="text-muted-foreground/50">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">{preview.length} rows ready</p>
        </>
      )}

      {/* PIN + Validate */}
      {preview.length > 0 && !result && (
        <form onSubmit={handleValidate} className="flex gap-3 items-end">
          <div className="space-y-1 flex-1 max-w-xs">
            <Label>Transaction PIN</Label>
            <div className="relative">
              <Input
                type={showPin ? "text" : "password"}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter your PIN"
                className="pr-16"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPin((p) => !p)}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 text-xs px-2"
              >
                {showPin ? "Hide" : "Show"}
              </Button>
            </div>
          </div>
          <Button
            type="submit"
            variant="outline"
            disabled={!pin || validating || processing}
          >
            {validating ? (
              <>
                <Loader2 size={13} className="mr-1 animate-spin" /> Validating…
              </>
            ) : (
              <>
                <ShieldCheck size={13} className="mr-1" /> Validate
              </>
            )}
          </Button>
        </form>
      )}

      {/* Validation results */}
      {validation && !result && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-muted-foreground" />
            <span className="text-sm font-medium">Validation preview — no changes made</span>
          </div>

          <SummaryBadges data={validation} />

          {validation.results?.length > 0 && (
            <ResultsTable results={validation.results} />
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleProcess}
              disabled={processing || validation.success === 0}
            >
              {processing ? (
                <>
                  <Loader2 size={13} className="mr-1 animate-spin" /> Processing…
                </>
              ) : (
                <>
                  <Play size={13} className="mr-1" />
                  {validation.failed > 0
                    ? `Process ${validation.success} valid rows`
                    : submitLabel}
                </>
              )}
            </Button>
            <Button variant="ghost" size="sm" onClick={reset}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Final results */}
      {result && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-emerald-600 hover:bg-emerald-600 gap-1">
              <CheckCircle2 size={11} /> {result.success} succeeded
            </Badge>
            {result.failed > 0 && (
              <Badge variant="destructive" className="gap-1">
                <XCircle size={11} /> {result.failed} failed
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {result.total} rows total
            </span>
          </div>

          {result.results?.length > 0 && <ResultsTable results={result.results} />}

          <Button variant="outline" size="sm" onClick={reset}>
            Process another batch
          </Button>
        </div>
      )}
    </div>
  );
}

/* eslint-disable react/prop-types */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CalendarDateRangePicker } from "@/components/date-range-picker";
import { FileText, FileSpreadsheet, RefreshCw, RotateCcw } from "lucide-react";
import { Label } from "@/components/ui/label";
import useAuth from "@/MiddleWares/Hooks/useAuth";
import useBranchFilter from "@/MiddleWares/Hooks/useBranchFilter";
import { useBranches } from "@/Queries/Settings/branches";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { toast } from "@/hooks/use-toast";
import fileDownload from "js-file-download";

/**
 * Reusable filter + export bar for accounting reports.
 *
 * Props:
 *  onApply(filters)   — called with { startDate, endDate, branch_id, status }
 *  isLoading          — disables Apply while fetching
 *  showStatus         — show JE status filter (default: true)
 *  extra              — ReactNode slot for additional filters
 *  exportTitle        — report title shown in PDF header
 *  exportFilename     — base filename for downloads
 *  exportHeaders      — string[] column headers
 *  exportRows         — (string|number)[][] rows  OR  object[] rows
 *  exportDisabled     — hide/disable export buttons (no data yet)
 */
const ReportFilterBar = ({
  onApply,
  isLoading     = false,
  showStatus    = true,
  extra,
  exportTitle   = "Report",
  exportFilename = "report",
  exportHeaders  = [],
  exportRows     = [],
  exportDisabled = false,
}) => {
  const { auth }       = useAuth();
  const axiosPrivate   = useAxiosPrivate();
  const { data: branches = [] } = useBranches();
  const { branchKey }  = useBranchFilter();

  const fiscalStart = auth?.fiscalYear?.start_date
    ? new Date(auth.fiscalYear.start_date)
    : new Date(new Date().getFullYear(), 0, 1);

  const [dateRange,     setDateRange]     = useState({ from: fiscalStart, to: new Date() });
  const [branch,        setBranch]        = useState(branchKey != null ? String(branchKey) : "all");
  const [status,        setStatus]        = useState("completed");
  const [isDownloading, setIsDownloading] = useState(false);

  const buildFilters = () => ({
    startDate: dateRange.from?.toLocaleDateString("en-CA") ?? "",
    endDate:   dateRange.to?.toLocaleDateString("en-CA")   ?? "",
    branch_id: branch === "all" ? "" : branch,
    status,
  });

  const handleApply = () => onApply(buildFilters());

  const handleReset = () => {
    setDateRange({ from: fiscalStart, to: new Date() });
    setBranch("all");
    setStatus("completed");
    onApply({
      startDate: fiscalStart.toLocaleDateString("en-CA"),
      endDate:   new Date().toLocaleDateString("en-CA"),
      branch_id: "",
      status:    "completed",
    });
  };

  // Convert exportRows (array-of-arrays OR array-of-objects) to array-of-objects
  // keyed by exportHeaders — required by the backend general export controllers.
  const buildRowObjects = () => {
    if (!exportRows.length || !exportHeaders.length) return [];
    if (Array.isArray(exportRows[0])) {
      return exportRows.map((row) =>
        Object.fromEntries(exportHeaders.map((h, i) => [h, row[i] ?? ""]))
      );
    }
    return exportRows;
  };

  // ── Backend PDF export ───────────────────────────────────────────────────────
  const handleExportPDF = async () => {
    if (!exportRows.length) return;
    const rows    = buildRowObjects();
    const dateStr = {
      start_date: dateRange.from?.toLocaleDateString("en-CA") ?? "",
      end_date:   dateRange.to?.toLocaleDateString("en-CA")   ?? "",
    };
    try {
      setIsDownloading(true);
      const res = await axiosPrivate.post(
        "/export/general/pdf",
        {
          data: {
            data:    { headers: exportHeaders, rows },
            totals:  {},
            colspan: 0,
            mode:    { format: "A4", orientation: exportHeaders.length > 6 ? "landscape" : "portrait" },
            dates:   dateStr,
            title:   exportTitle,
          },
        },
        { responseType: "blob" }
      );
      fileDownload(res.data, `${exportFilename}_${Date.now()}.pdf`);
    } catch {
      toast({ title: "PDF export failed", variant: "destructive" });
    } finally {
      setIsDownloading(false);
    }
  };

  // ── Backend Excel export ─────────────────────────────────────────────────────
  const handleExportExcel = async () => {
    if (!exportRows.length) return;
    const rows = buildRowObjects();
    try {
      setIsDownloading(true);
      const res = await axiosPrivate.post(
        "/export/general/excel",
        {
          data: {
            data:    { headers: exportHeaders, rows },
            totals:  {},
            colspan: 0,
          },
        },
        { responseType: "blob" }
      );
      fileDownload(res.data, `${exportFilename}_${Date.now()}.xlsx`);
    } catch {
      toast({ title: "Excel export failed", variant: "destructive" });
    } finally {
      setIsDownloading(false);
    }
  };

  // ── Client-side CSV (lightweight, no server round-trip) ──────────────────────
  const handleExportCSV = () => {
    if (!exportRows.length) return;
    const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows   = buildRowObjects();
    const csv    = [exportHeaders, ...rows.map((r) => exportHeaders.map((h) => escape(r[h])))].map((r) => r.join(",")).join("\n");
    const blob   = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url    = URL.createObjectURL(blob);
    const a      = document.createElement("a");
    a.href = url; a.download = `${exportFilename}_${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const isSacco  = auth?.user?.data_privilege === "sacco";
  const busy     = isLoading || isDownloading;

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-muted/30 p-3">
      {/* Date range */}
      <div className="space-y-1">
        <Label className="text-xs font-medium text-muted-foreground">Date Range</Label>
        <CalendarDateRangePicker
          defaultValue={dateRange}
          onChange={(r) => r?.from && r?.to && setDateRange({ from: new Date(r.from), to: new Date(r.to) })}
        />
      </div>

      {/* Branch — sacco users only */}
      {isSacco && branches.length > 0 && (
        <div className="space-y-1">
          <Label className="text-xs font-medium text-muted-foreground">Branch</Label>
          <Select value={branch} onValueChange={setBranch}>
            <SelectTrigger className="h-8 w-44 text-xs"><SelectValue placeholder="All Branches" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* JE status */}
      {showStatus && (
        <div className="space-y-1">
          <Label className="text-xs font-medium text-muted-foreground">Entry Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="all">All Entries</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Extra filters slot */}
      {extra && <div className="space-y-1">{extra}</div>}

      {/* Apply / Reset */}
      <div className="flex items-end gap-2">
        <Button size="sm" className="h-8" onClick={handleApply} disabled={busy}>
          {isLoading ? <RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" /> : null}
          {isLoading ? "Loading…" : "Apply"}
        </Button>
        <Button size="sm" variant="ghost" className="h-8" onClick={handleReset} disabled={busy}>
          <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
        </Button>
      </div>

      {/* Export buttons */}
      {!exportDisabled && exportHeaders.length > 0 && (
        <div className="ml-auto flex items-end gap-2">
          <Button size="sm" variant="outline" className="h-8" onClick={handleExportCSV} disabled={!exportRows.length || busy}>
            CSV
          </Button>
          <Button size="sm" variant="outline" className="h-8" onClick={handleExportExcel} disabled={!exportRows.length || busy}>
            {isDownloading
              ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              : <><FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" /> Excel</>}
          </Button>
          <Button size="sm" variant="outline" className="h-8" onClick={handleExportPDF} disabled={!exportRows.length || busy}>
            {isDownloading
              ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              : <><FileText className="w-3.5 h-3.5 mr-1.5" /> PDF</>}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ReportFilterBar;

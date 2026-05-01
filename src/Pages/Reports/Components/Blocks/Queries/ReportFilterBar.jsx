/* eslint-disable react/prop-types */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarDateRangePicker } from "@/components/date-range-picker";
import { FileText, FileSpreadsheet, RefreshCw, RotateCcw } from "lucide-react";
import { Label } from "@/components/ui/label";
import useAuth from "@/MiddleWares/Hooks/useAuth";
import { useBranches } from "@/Queries/Settings/branches";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Reusable filter + export bar for accounting reports.
 *
 * Props:
 *  onApply(filters)   — called with { startDate, endDate, branch_id, status }
 *  isLoading          — disables Apply while fetching
 *  showStatus         — show JE status filter (default: true)
 *  extra              — ReactNode slot for additional filters (account picker, till picker, etc.)
 *  exportTitle        — report title shown in PDF header
 *  exportFilename     — base filename for CSV / PDF
 *  exportHeaders      — string[] column headers for export
 *  exportRows         — string[][] rows for export
 *  exportDisabled     — hide/disable export buttons (no data yet)
 */
const ReportFilterBar = ({
  onApply,
  isLoading = false,
  showStatus = true,
  extra,
  exportTitle = "Report",
  exportFilename = "report",
  exportHeaders = [],
  exportRows = [],
  exportDisabled = false,
}) => {
  const { auth } = useAuth();
  const { data: branches = [] } = useBranches();

  const fiscalStart = auth?.fiscalYear?.start_date
    ? new Date(auth.fiscalYear.start_date)
    : new Date(new Date().getFullYear(), 0, 1);

  const [dateRange, setDateRange] = useState({ from: fiscalStart, to: new Date() });
  const [branch, setBranch] = useState("all");
  const [status, setStatus] = useState("completed");

  const buildFilters = () => ({
    startDate: dateRange.from?.toLocaleDateString("en-CA") ?? "",
    endDate: dateRange.to?.toLocaleDateString("en-CA") ?? "",
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
      endDate: new Date().toLocaleDateString("en-CA"),
      branch_id: "",
      status: "completed",
    });
  };

  // ── Client-side CSV ──────────────────────────────────────────────────────
  const handleExportCSV = () => {
    if (!exportRows.length) return;
    const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [exportHeaders, ...exportRows].map((r) => r.map(escape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${exportFilename}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Client-side PDF ──────────────────────────────────────────────────────
  const handleExportPDF = () => {
    if (!exportRows.length) return;
    const doc = new jsPDF({ orientation: exportHeaders.length > 6 ? "landscape" : "portrait" });
    const dateStr = `${dateRange.from?.toLocaleDateString()} – ${dateRange.to?.toLocaleDateString()}`;
    doc.setFontSize(14);
    doc.text(exportTitle, 14, 14);
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`Period: ${dateStr}`, 14, 21);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 26);
    autoTable(doc, {
      head: [exportHeaders],
      body: exportRows,
      startY: 31,
      styles: { fontSize: 7.5, cellPadding: 2 },
      headStyles: { fillColor: [30, 90, 168], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });
    doc.save(`${exportFilename}_${Date.now()}.pdf`);
  };

  const isSacco = auth?.user?.data_privilege === "sacco";

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
            <SelectTrigger className="h-8 w-44 text-xs">
              <SelectValue placeholder="All Branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={String(b.id)}>
                  {b.name}
                </SelectItem>
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
            <SelectTrigger className="h-8 w-40 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="all">All Entries</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Extra filters slot (account picker, till picker, etc.) */}
      {extra && <div className="space-y-1">{extra}</div>}

      {/* Action buttons */}
      <div className="flex items-end gap-2">
        <Button size="sm" className="h-8" onClick={handleApply} disabled={isLoading}>
          {isLoading ? <RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" /> : null}
          {isLoading ? "Loading…" : "Apply"}
        </Button>
        <Button size="sm" variant="ghost" className="h-8" onClick={handleReset} disabled={isLoading}>
          <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
        </Button>
      </div>

      {/* Export buttons — only when data is available */}
      {!exportDisabled && exportHeaders.length > 0 && (
        <div className="ml-auto flex items-end gap-2">
          <Button size="sm" variant="outline" className="h-8" onClick={handleExportCSV} disabled={!exportRows.length}>
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" /> CSV
          </Button>
          <Button size="sm" variant="outline" className="h-8" onClick={handleExportPDF} disabled={!exportRows.length}>
            <FileText className="w-3.5 h-3.5 mr-1.5" /> PDF
          </Button>
        </div>
      )}
    </div>
  );
};

export default ReportFilterBar;

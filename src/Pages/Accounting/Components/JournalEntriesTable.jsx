import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import {
  flexRender, getCoreRowModel, getPaginationRowModel,
  getSortedRowModel, useReactTable,
} from "@tanstack/react-table";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ChevronDown, RefreshCw, RotateCcw, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatDateTimestamp, hasPermission } from "@/lib/utils";
import JournalEntryDialog from "./Forms/JournalEntryDialog";
import { useDebounce } from "@/lib/utils";
import useAuth from "@/MiddleWares/Hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import fileDownload from "js-file-download";

const STATUS_BADGE = {
  completed: "bg-green-100 text-green-800 border-green-200",
  pending:   "bg-yellow-100 text-yellow-800 border-yellow-200",
  reversed:  "bg-gray-100 text-gray-600 border-gray-200",
};

const isReversible = (je) =>
  je.status !== "reversed" && !je.is_reversal && je.source_module === "manual";

export function JournalEntriesTable() {
  const navigate      = useNavigate();
  const axiosPrivate  = useAxiosPrivate();
  const queryClient   = useQueryClient();
  const { auth: { roles } } = useAuth();

  const [sorting,      setSorting]      = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pagination,   setPagination]   = useState({ pageIndex: 0, pageSize: 10 });
  const [isModalOpen,  setIsModalOpen]  = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedIds,  setSelectedIds]  = useState(new Set());
  const [viewJe,       setViewJe]       = useState(null);

  // PIN dialog: null | { mode: 'single', jeId, code } | { mode: 'bulk', jeIds: [] }
  const [pinDialog, setPinDialog] = useState(null);
  const [pin,       setPin]       = useState("");
  const [pinError,  setPinError]  = useState("");

  const debouncedFilter = useDebounce(globalFilter, 600);

  const { data = {}, isLoading, isRefetching, isError, refetch } = useQuery({
    queryKey: ["journal-entries-data", pagination.pageIndex, pagination.pageSize, debouncedFilter, sorting, statusFilter],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get("/serverside/journal-entries", {
          params: {
            start:        pagination.pageIndex * pagination.pageSize,
            size:         pagination.pageSize,
            globalFilter: debouncedFilter,
            sorting:      JSON.stringify(sorting || []),
            status:       statusFilter !== "all" ? statusFilter : undefined,
          },
        });
        return res.data.data ?? {};
      } catch (err) {
        if (err?.response?.status === 401) navigate("/", { replace: true });
        throw err;
      }
    },
    placeholderData: (prev) => prev,
  });

  const reverseSingle = useMutation({
    mutationFn: ({ jeId, pincode }) =>
      axiosPrivate.post(`/accounting/journals/${jeId}/reverse`, { user_pincode: pincode }),
    onSuccess: () => {
      toast({ title: "Journal entry reversed", description: "A reversal entry has been created." });
      queryClient.invalidateQueries({ queryKey: ["journal-entries-data"] });
      closePinDialog();
    },
    onError: (err) => {
      setPinError(err?.response?.data?.messages?.[0] ?? "Could not reverse this entry.");
    },
  });

  const reverseBulk = useMutation({
    mutationFn: ({ jeIds, pincode }) =>
      axiosPrivate.post("/accounting/journals/bulk-reverse", { ids: jeIds, user_pincode: pincode }),
    onSuccess: (res) => {
      const count = res.data.data?.reversed?.length ?? 0;
      toast({ title: `${count} entr${count === 1 ? "y" : "ies"} reversed`, description: "Reversal journal entries have been created." });
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ["journal-entries-data"] });
      closePinDialog();
    },
    onError: (err) => {
      setPinError(err?.response?.data?.messages?.[0] ?? "Bulk reversal failed.");
    },
  });

  const openPinDialog = useCallback((mode, je) => {
    if (mode === "single") {
      setPinDialog({ mode: "single", jeId: je.journal_entry_id, code: je.transaction_code });
    } else {
      const ids = [...selectedIds];
      if (!ids.length) return;
      setPinDialog({ mode: "bulk", jeIds: ids });
    }
    setPin("");
    setPinError("");
  }, [selectedIds]);

  const closePinDialog = useCallback(() => {
    setPinDialog(null);
    setPin("");
    setPinError("");
  }, []);

  const submitReversal = useCallback(() => {
    if (!pin.trim()) { setPinError("PIN is required"); return; }
    if (pinDialog.mode === "single") {
      reverseSingle.mutate({ jeId: pinDialog.jeId, pincode: pin });
    } else {
      reverseBulk.mutate({ jeIds: pinDialog.jeIds, pincode: pin });
    }
  }, [pin, pinDialog, reverseSingle, reverseBulk]);

  const isPending = reverseSingle.isPending || reverseBulk.isPending;

  const handleExport = useCallback(async (type) => {
    const rows = (data?.data ?? []).map((row) => ({
      "Transaction Code": row.transaction_code,
      "Amount":           row.amount,
      "Branch":           row.branch,
      "Date":             row.transaction_date,
      "Description":      row.description,
      "Status":           row.status,
    }));
    if (!rows.length) return;

    const headers = ["Transaction Code", "Amount", "Branch", "Date", "Description", "Status"];

    if (type === "csv") {
      const escape = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
      const csv = [headers, ...rows.map((r) => headers.map((h) => escape(r[h])))].map((r) => r.join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = `journal-entries-${Date.now()}.csv`; a.click();
      URL.revokeObjectURL(url);
      return;
    }

    try {
      setIsDownloading(true);
      const res = await axiosPrivate.post(
        type === "pdf" ? "/export/general/pdf" : "/export/general/excel",
        {
          data: {
            data:    { headers, rows },
            totals:  {},
            colspan: 0,
            mode:    { format: "A4", orientation: "landscape" },
            dates:   { start_date: "—", end_date: "—" },
            title:   "Journal Entries",
          },
        },
        { responseType: "blob" }
      );
      fileDownload(res.data, `journal-entries-${Date.now()}.${type === "pdf" ? "pdf" : "xlsx"}`);
    } catch {
      toast({ title: "Export failed", variant: "destructive" });
    } finally {
      setIsDownloading(false);
    }
  }, [axiosPrivate, data]);

  const printJournalEntry = (je) => {
    const lines = je.lines ?? [];
    const lineRows = lines.map((l) => `
      <tr>
        <td>${l.account_title || "—"}</td>
        <td style="text-align:right;color:#1d4ed8">${l.debit_amount > 0 ? Number(l.debit_amount).toLocaleString() : ""}</td>
        <td style="text-align:right;color:#15803d">${l.credit_amount > 0 ? Number(l.credit_amount).toLocaleString() : ""}</td>
      </tr>`).join("");
    const w = window.open("", "_blank", "width=640,height=720");
    w.document.write(`
      <html><head><title>Journal Entry — ${je.transaction_code}</title><style>
        body{font-family:sans-serif;padding:32px;font-size:14px;color:#111}
        h2{margin:0 0 2px;font-size:20px}
        .sub{color:#666;font-size:12px;margin-bottom:20px}
        .meta{display:grid;grid-template-columns:1fr 1fr;gap:6px 24px;margin-bottom:20px}
        .meta-label{color:#555;font-size:11px;text-transform:uppercase;letter-spacing:.5px}
        .meta-value{font-size:13px;font-weight:500}
        table{width:100%;border-collapse:collapse;margin-top:8px}
        th{text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.5px;color:#555;border-bottom:2px solid #e5e7eb;padding:6px 4px}
        td{padding:6px 4px;border-bottom:1px solid #f3f4f6;font-size:13px}
        .footer{margin-top:32px;font-size:11px;color:#999;text-align:center;border-top:1px solid #eee;padding-top:12px}
      </style></head><body>
        <h2>Journal Entry</h2>
        <p class="sub">${je.transaction_code}</p>
        <div class="meta">
          <div><div class="meta-label">Date</div><div class="meta-value">${je.transaction_date || "—"}</div></div>
          <div><div class="meta-label">Branch</div><div class="meta-value">${je.branch || "—"}</div></div>
          <div><div class="meta-label">Amount</div><div class="meta-value">${Number(je.amount).toLocaleString()}</div></div>
          <div><div class="meta-label">Status</div><div class="meta-value" style="text-transform:capitalize">${je.status || "—"}</div></div>
          <div style="grid-column:span 2"><div class="meta-label">Description</div><div class="meta-value">${je.description || "—"}</div></div>
        </div>
        <table>
          <thead><tr><th>Account</th><th style="text-align:right">Debit</th><th style="text-align:right">Credit</th></tr></thead>
          <tbody>${lineRows}</tbody>
        </table>
        <p class="footer">${import.meta.env.VITE_APP_NAME ?? "Banking System"} — Generated ${new Date().toLocaleString()}</p>
        <script>window.onload=()=>{window.print();}</script>
      </body></html>
    `);
    w.document.close();
  };

  const canReverseSingle = hasPermission(roles, 100172);
  const canReverseBulk   = hasPermission(roles, 100269);

  const rows          = data?.data ?? [];
  const allPageJeIds  = rows.filter(isReversible).map((r) => r.journal_entry_id);
  const allPageSelected  = allPageJeIds.length > 0 && allPageJeIds.every((id) => selectedIds.has(id));
  const somePageSelected = allPageJeIds.some((id) => selectedIds.has(id));
  const selectedCount    = selectedIds.size;

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        allPageJeIds.forEach((id) => next.delete(id));
      } else {
        allPageJeIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }, [allPageJeIds, allPageSelected]);

  const toggleRow = useCallback((jeId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(jeId) ? next.delete(jeId) : next.add(jeId);
      return next;
    });
  }, []);

  const columns = [
    ...(canReverseBulk ? [{
      id: "select",
      header: () => (
        <Checkbox
          checked={allPageSelected}
          ref={(el) => { if (el) el.indeterminate = somePageSelected && !allPageSelected; }}
          onCheckedChange={toggleAll}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => {
        if (!isReversible(row.original)) return null;
        return (
          <Checkbox
            checked={selectedIds.has(row.original.journal_entry_id)}
            onCheckedChange={() => toggleRow(row.original.journal_entry_id)}
            aria-label="Select row"
          />
        );
      },
      enableSorting: false,
      enableHiding:  false,
    }] : []),
    {
      id: "transaction_code",
      header: "Code",
      cell: ({ row }) => (
        <Link
          to={hasPermission(roles, 100169) ? `/journal-entries/${row.original.journal_entry_id}` : "#"}
          className="font-mono text-primary hover:underline text-xs"
        >
          {row.original.transaction_code}
        </Link>
      ),
    },
    {
      id: "amount",
      header: "Amount",
      cell: ({ row }) => (
        <span className="tabular-nums text-sm font-medium">
          {parseFloat(row.original.amount).toLocaleString()}
        </span>
      ),
    },
    {
      id: "branch",
      header: "Branch",
      cell: ({ row }) => <span className="text-muted-foreground text-xs">{row.original.branch}</span>,
    },
    {
      id: "transaction_date",
      header: "Date",
      cell: ({ row }) => <span className="text-xs whitespace-nowrap">{formatDateTimestamp(row.original.transaction_date)}</span>,
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => <span className="text-xs line-clamp-2 max-w-[200px]">{row.original.description}</span>,
    },
    {
      id: "lines",
      header: "Entries",
      cell: ({ row }) => {
        const lines = row.original.lines ?? [];
        return (
          <div className="space-y-0.5 text-xs min-w-[180px]">
            {lines.map((l, i) => (
              <div key={i} className="flex gap-2 items-baseline">
                <span className="text-muted-foreground truncate max-w-[110px]">{l.account_title}</span>
                {l.debit_amount  > 0 && <span className="text-blue-600 font-mono ml-auto">Dr {Number(l.debit_amount).toLocaleString()}</span>}
                {l.credit_amount > 0 && <span className="text-green-600 font-mono ml-auto">Cr {Number(l.credit_amount).toLocaleString()}</span>}
              </div>
            ))}
          </div>
        );
      },
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge className={`capitalize text-xs border ${STATUS_BADGE[row.original.status] ?? "bg-muted text-muted-foreground"}`}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const je = row.original;
        const canReverse = canReverseSingle && isReversible(je);
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-7 w-7 p-0 text-muted-foreground">
                <span className="sr-only">Open menu</span>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-xs" onClick={() => setViewJe(je)}>
                <Eye className="w-3 h-3 mr-1.5" /> View Details
              </DropdownMenuItem>
              {hasPermission(roles, 100169) && (
                <DropdownMenuItem
                  className="text-xs"
                  onClick={() => navigate(`/journal-entries/${je.journal_entry_id}`)}
                >
                  Open Full Page
                </DropdownMenuItem>
              )}
              {canReverse && (
                <DropdownMenuItem
                  className="text-xs text-destructive focus:text-destructive"
                  onClick={() => openPinDialog("single", je)}
                >
                  <RotateCcw className="w-3 h-3 mr-1.5" /> Reverse
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [debouncedFilter]);

  const table = useReactTable({
    data:         rows,
    rowCount:     data?.meta?.totalRowCount,
    columns,
    manualPagination: true,
    manualSorting:    true,
    onSortingChange:  setSorting,
    onPaginationChange: (updater) => {
      setPagination((old) => {
        const next = typeof updater === "function" ? updater(old) : updater;
        setSelectedIds(new Set());
        return next;
      });
    },
    getCoreRowModel:       getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel:     getSortedRowModel(),
    state: { sorting, globalFilter, pagination },
  });

  return (
    <div className="w-full space-y-3">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search journal entries…"
          value={globalFilter}
          onChange={(e) => {
            setGlobalFilter(e.target.value);
            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
          }}
          className="h-8 max-w-xs text-sm"
        />

        {/* Status filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              Status: {statusFilter === "all" ? "All" : statusFilter} <ChevronDown className="ml-1 w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {["all", "completed", "pending", "reversed"].map((s) => (
              <DropdownMenuCheckboxItem
                key={s}
                checked={statusFilter === s}
                onCheckedChange={() => { setStatusFilter(s); setPagination((p) => ({ ...p, pageIndex: 0 })); }}
                className="capitalize text-xs"
              >
                {s}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {hasPermission(roles, 100108) && (
          <Button size="sm" className="h-8" onClick={() => setIsModalOpen(true)}>
            + New Entry
          </Button>
        )}

        {canReverseBulk && selectedCount > 0 && (
          <Button
            variant="destructive"
            size="sm"
            className="h-8"
            onClick={() => openPinDialog("bulk")}
          >
            <RotateCcw className="w-3 h-3 mr-1.5" />
            Reverse Selected ({selectedCount})
          </Button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8" onClick={() => handleExport("csv")} disabled={isDownloading}>
            CSV
          </Button>
          <Button variant="outline" size="sm" className="h-8" onClick={() => handleExport("excel")} disabled={isDownloading}>
            {isDownloading ? <RefreshCw className="w-3 h-3 animate-spin" /> : "Excel"}
          </Button>
          <Button variant="outline" size="sm" className="h-8" onClick={() => handleExport("pdf")} disabled={isDownloading}>
            PDF
          </Button>
          <Button variant="outline" size="sm" className="h-8" onClick={refetch} disabled={isRefetching}>
            <RefreshCw className={`w-3 h-3 ${isRefetching ? "animate-spin" : ""}`} />
          </Button>

          {/* Column visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                Columns <ChevronDown className="ml-1 w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table.getAllColumns().filter((c) => c.getCanHide() && !["select", "actions"].includes(c.id)).map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  className="capitalize text-xs"
                  checked={col.getIsVisible()}
                  onCheckedChange={(v) => col.toggleVisibility(!!v)}
                >
                  {col.columnDef.header}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Page size */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                Show {pagination.pageSize} <ChevronDown className="ml-1 w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {[10, 25, 50, 100].map((sz) => (
                <DropdownMenuCheckboxItem
                  key={sz}
                  checked={pagination.pageSize === sz}
                  onCheckedChange={(v) => v && setPagination({ pageIndex: 0, pageSize: sz })}
                  className="text-xs"
                >
                  {sz}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {selectedCount > 0 && (
        <p className="text-xs text-primary font-medium">
          {selectedCount} entr{selectedCount === 1 ? "y" : "ies"} selected
        </p>
      )}

      {/* ── Table ── */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id} className="text-xs">
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading || isRefetching ? (
              [...Array(pagination.pageSize)].map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 rounded" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-destructive text-sm py-8">
                  Failed to load journal entries.
                </TableCell>
              </TableRow>
            ) : data?.data?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={`hover:bg-muted/30 ${row.original.status === "reversed" ? "opacity-50" : ""}`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center text-muted-foreground py-8">
                  No journal entries found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Pagination ── */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {data?.meta?.totalRowCount
            ? `${data.meta.totalRowCount} total entries`
            : ""}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"
            onClick={() => setPagination((p) => ({ ...p, pageIndex: Math.max(p.pageIndex - 1, 0) }))}
            disabled={pagination.pageIndex === 0 || isLoading}
          >
            Previous
          </Button>
          <Button variant="outline" size="sm"
            onClick={() => setPagination((p) => ({ ...p, pageIndex: p.pageIndex + 1 }))}
            disabled={
              (data?.meta?.totalRowCount ?? 0) <= (pagination.pageIndex + 1) * pagination.pageSize || isLoading
            }
          >
            Next
          </Button>
        </div>
      </div>

      {/* ── New entry dialog ── */}
      {hasPermission(roles, 100108) && isModalOpen && (
        <JournalEntryDialog
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          refetch={refetch}
        />
      )}

      {/* ── Journal Entry Details Dialog ── */}
      <Dialog open={!!viewJe} onOpenChange={(o) => !o && setViewJe(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Journal Entry Details</DialogTitle>
            <DialogDescription className="font-mono text-xs">{viewJe?.transaction_code}</DialogDescription>
          </DialogHeader>
          {viewJe && (
            <div className="space-y-4 py-1">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <span className="text-muted-foreground text-xs">Date</span>
                <span className="text-xs">{formatDateTimestamp(viewJe.transaction_date)}</span>

                <span className="text-muted-foreground text-xs">Branch</span>
                <span className="text-xs">{viewJe.branch || "—"}</span>

                <span className="text-muted-foreground text-xs">Amount</span>
                <span className="text-xs font-bold tabular-nums">{Number(viewJe.amount).toLocaleString()}</span>

                <span className="text-muted-foreground text-xs">Status</span>
                <span className="text-xs capitalize">
                  <Badge className={`text-xs border ${STATUS_BADGE[viewJe.status] ?? "bg-muted text-muted-foreground"}`}>
                    {viewJe.status}
                  </Badge>
                </span>

                {viewJe.description && (
                  <>
                    <span className="text-muted-foreground text-xs">Description</span>
                    <span className="text-xs">{viewJe.description}</span>
                  </>
                )}
              </div>

              {(viewJe.lines ?? []).length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Journal Lines</p>
                  <div className="rounded border overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="text-left px-2 py-1.5 font-medium">Account</th>
                          <th className="text-right px-2 py-1.5 font-medium text-blue-600">Debit</th>
                          <th className="text-right px-2 py-1.5 font-medium text-green-700">Credit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewJe.lines.map((l, i) => (
                          <tr key={i} className="border-t">
                            <td className="px-2 py-1.5 text-muted-foreground">{l.account_title}</td>
                            <td className="px-2 py-1.5 text-right tabular-nums text-blue-600">
                              {l.debit_amount > 0 ? Number(l.debit_amount).toLocaleString() : ""}
                            </td>
                            <td className="px-2 py-1.5 text-right tabular-nums text-green-700">
                              {l.credit_amount > 0 ? Number(l.credit_amount).toLocaleString() : ""}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setViewJe(null)}>Close</Button>
            <Button size="sm" onClick={() => printJournalEntry(viewJe)}>
              Print Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reversal PIN dialog ── */}
      <Dialog open={!!pinDialog} onOpenChange={(o) => !o && closePinDialog()}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {pinDialog?.mode === "bulk"
                ? `Reverse ${pinDialog.jeIds?.length} entr${pinDialog.jeIds?.length === 1 ? "y" : "ies"}`
                : "Reverse journal entry?"}
            </DialogTitle>
            <DialogDescription>
              {pinDialog?.mode === "bulk"
                ? "All selected entries will be reversed in a single all-or-nothing operation. Enter your PIN to confirm."
                : <>A reversal entry will be created that cancels <strong>{pinDialog?.code}</strong>. The original entry will be marked as <em>reversed</em>. Enter your PIN to confirm.</>}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="je-reversal-pin">Your PIN</Label>
              <Input
                id="je-reversal-pin"
                type="password"
                placeholder="Enter PIN"
                value={pin}
                onChange={(e) => { setPin(e.target.value); setPinError(""); }}
                onKeyDown={(e) => e.key === "Enter" && submitReversal()}
                autoFocus
              />
              {pinError && <p className="text-xs text-destructive">{pinError}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closePinDialog} disabled={isPending}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={isPending || !pin.trim()}
              onClick={submitReversal}
            >
              {isPending
                ? <><RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />Reversing…</>
                : <><RotateCcw className="w-3.5 h-3.5 mr-1.5" />Confirm Reversal</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

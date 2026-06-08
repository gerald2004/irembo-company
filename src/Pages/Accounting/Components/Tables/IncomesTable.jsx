/* eslint-disable react/prop-types */
import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { useDebounce, hasPermission, formatDateTimestamp } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ChevronDown,
  RefreshCw,
  RotateCcw,
  Eye,
} from "lucide-react";
import AddIncomeDialog from "../Forms/AddIncomeDialog";
import useAuth from "@/MiddleWares/Hooks/useAuth";
import { toast } from "@/hooks/use-toast";

const PAGE_SIZES = [10, 25, 50, 100];

const STATUS_CLASS = {
  active:   "bg-green-100 text-green-800 border-green-200",
  reversed: "bg-gray-100 text-gray-600 border-gray-200",
};

export function IncomesTable() {
  const navigate     = useNavigate();
  const axiosPrivate = useAxiosPrivate();
  const queryClient  = useQueryClient();
  const { auth: { roles } } = useAuth();

  const [sorting,      setSorting]      = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination,   setPagination]   = useState({ pageIndex: 0, pageSize: 10 });
  const [selectedIds,  setSelectedIds]  = useState(new Set()); // journal_entry_id values
  const [isAddOpen,    setIsAddOpen]    = useState(false);
  const [viewIncome,   setViewIncome]   = useState(null);

  // PIN dialog: null | { mode: 'single', jeId: number } | { mode: 'bulk', jeIds: number[] }
  const [pinDialog, setPinDialog] = useState(null);
  const [pin,       setPin]       = useState("");
  const [pinError,  setPinError]  = useState("");

  const debouncedFilter = useDebounce(globalFilter, 500);

  const { data: accountsData, isLoading: isLoadingAccounts, isError: isErrorAccounts, refetch: refetchAccounts, isRefetching: isRefetchingAccounts } = useQuery({
    queryKey: ["account-votes-income"],
    queryFn: async () => {
      const res = await axiosPrivate.get("/settings/accounts/account", { params: { account_types: "Income" } });
      return res.data.data.accounts;
    },
  });

  const { data = {}, isLoading, isRefetching, isError, refetch } = useQuery({
    queryKey: ["incomes-ssr", pagination.pageIndex, pagination.pageSize, debouncedFilter, sorting],
    queryFn: async ({ signal }) => {
      try {
        const res = await axiosPrivate.get("/serverside/incomes", {
          params: {
            start:        pagination.pageIndex * pagination.pageSize,
            size:         pagination.pageSize,
            globalFilter: debouncedFilter || undefined,
            sorting:      sorting.length ? JSON.stringify(sorting) : undefined,
          },
          signal,
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
    mutationFn: ({ incomeId, pincode }) =>
      axiosPrivate.post(`/accounting/incomes/${incomeId}/reverse`, { user_pincode: pincode }),
    onSuccess: () => {
      toast({ title: "Income reversed", description: "A reversal journal entry has been created." });
      queryClient.invalidateQueries({ queryKey: ["incomes-ssr"] });
    },
    onError: (err) => {
      const msg = err?.response?.data?.messages?.[0] ?? "Could not reverse this entry.";
      setPinError(msg);
    },
  });

  const reverseBulk = useMutation({
    mutationFn: ({ incomeIds, pincode }) =>
      axiosPrivate.post("/accounting/incomes/bulk-reverse", { ids: incomeIds, user_pincode: pincode }),
    onSuccess: (res) => {
      const count = res.data.data?.reversed?.length ?? 0;
      toast({ title: `${count} income entr${count === 1 ? "y" : "ies"} reversed`, description: "Reversal journal entries have been created." });
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ["incomes-ssr"] });
    },
    onError: (err) => {
      const msg = err?.response?.data?.messages?.[0] ?? "Bulk reversal failed.";
      setPinError(msg);
    },
  });

  const openPinDialog = useCallback((mode, incomeId) => {
    if (mode === "single") {
      setPinDialog({ mode: "single", incomeId });
    } else {
      const ids = [...selectedIds];
      if (!ids.length) return;
      setPinDialog({ mode: "bulk", incomeIds: ids });
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
      reverseSingle.mutate({ incomeId: pinDialog.incomeId, pincode: pin });
    } else {
      reverseBulk.mutate({ incomeIds: pinDialog.incomeIds, pincode: pin });
    }
  }, [pin, pinDialog, reverseSingle, reverseBulk]);

  const isPending = reverseSingle.isPending || reverseBulk.isPending;

  const printReceipt = (income) => {
    const w = window.open("", "_blank", "width=600,height=700");
    w.document.write(`
      <html><head><title>Income Receipt — ${income.income_code}</title><style>
        body{font-family:sans-serif;padding:32px;font-size:14px;color:#111}
        h2{margin:0 0 2px;font-size:20px}
        .sub{color:#666;font-size:12px;margin-bottom:24px}
        table{width:100%;border-collapse:collapse}
        td{padding:7px 0;border-bottom:1px solid #eee;vertical-align:top}
        td:first-child{color:#555;width:42%;font-size:12px;text-transform:uppercase;letter-spacing:.5px}
        .amount{font-size:22px;font-weight:700;color:#1d4ed8}
        .footer{margin-top:32px;font-size:11px;color:#999;text-align:center;border-top:1px solid #eee;padding-top:12px}
      </style></head><body>
        <h2>Income Receipt</h2>
        <p class="sub">${income.income_code}</p>
        <table>
          <tr><td>Received From</td><td>${income.income_received_from || "—"}</td></tr>
          <tr><td>Amount</td><td class="amount">UGX ${parseFloat(income.income_amount).toLocaleString(undefined,{minimumFractionDigits:2})}</td></tr>
          <tr><td>Income Account</td><td>${income.income_account || "—"}</td></tr>
          <tr><td>Debit Account</td><td>${income.debit_account || "—"}</td></tr>
          <tr><td>Date</td><td>${income.income_date || "—"}</td></tr>
          <tr><td>Posted By</td><td>${income.user || "—"}</td></tr>
          <tr><td>Branch</td><td>${income.branch || "—"}</td></tr>
          <tr><td>Notes</td><td>${income.income_notes || "—"}</td></tr>
          <tr><td>Status</td><td>${income.income_reverse_status || "active"}</td></tr>
        </table>
        <p class="footer">${import.meta.env.VITE_APP_NAME ?? "Banking System"} — Generated ${new Date().toLocaleString()}</p>
        <script>window.onload=()=>{window.print();}</script>
      </body></html>
    `);
    w.document.close();
  };

  const rows          = data?.data ?? [];
  const totalRowCount = data?.meta?.totalRowCount ?? 0;

  const allPageJeIds       = rows.filter((r) => r.income_id && r.income_reverse_status !== "reversed").map((r) => r.income_id);
  const allPageSelected    = allPageJeIds.length > 0 && allPageJeIds.every((id) => selectedIds.has(id));
  const somePageSelected   = allPageJeIds.some((id) => selectedIds.has(id));
  const selectedCount      = selectedIds.size;

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

  const canReverseSingle = hasPermission(roles, 100172);
  const canReverseBulk   = hasPermission(roles, 100269);

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
        const incomeId = row.original.income_id;
        const reversed = row.original.income_reverse_status === "reversed";
        if (!incomeId || reversed) return null;
        return (
          <Checkbox
            checked={selectedIds.has(incomeId)}
            onCheckedChange={() => toggleRow(incomeId)}
            aria-label="Select row"
          />
        );
      },
      enableSorting: false,
      enableHiding:  false,
    }] : []),
    {
      id: "income_code",
      header: "Code",
      enableSorting: true,
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.income_code}</span>,
      exportValue: (r) => r.income_code,
    },
    {
      id: "income_received_from",
      header: "Received From",
      enableSorting: true,
      cell: ({ row }) => <span>{row.original.income_received_from}</span>,
      exportValue: (r) => r.income_received_from,
    },
    {
      id: "income_amount",
      header: "Amount",
      enableSorting: true,
      cell: ({ row }) => (
        <span className="font-mono text-blue-600 font-medium">
          {parseFloat(row.original.income_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      ),
      exportValue: (r) => parseFloat(r.income_amount).toFixed(2),
    },
    {
      id: "income_account",
      header: "Income Account",
      enableSorting: false,
      cell: ({ row }) => <span className="text-xs">{row.original.income_account}</span>,
      exportValue: (r) => r.income_account,
    },
    {
      id: "debit_account",
      header: "Debit Account",
      enableSorting: false,
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.debit_account}</span>,
      exportValue: (r) => r.debit_account,
    },
    {
      id: "income_date",
      header: "Date",
      enableSorting: true,
      cell: ({ row }) => <span className="text-xs whitespace-nowrap">{formatDateTimestamp(row.original.income_date)}</span>,
      exportValue: (r) => r.income_date,
    },
    {
      id: "income_reverse_status",
      header: "Status",
      enableSorting: false,
      cell: ({ row }) => {
        const s = row.original.income_reverse_status ?? "active";
        return (
          <Badge className={`capitalize text-xs border ${STATUS_CLASS[s] ?? "bg-muted"}`}>
            {s}
          </Badge>
        );
      },
      exportValue: (r) => r.income_reverse_status ?? "active",
    },
    {
      id: "user",
      header: "Posted By",
      enableSorting: false,
      cell: ({ row }) => <span className="text-xs">{row.original.user}</span>,
      exportValue: (r) => r.user,
    },
    {
      id: "branch",
      header: "Branch",
      enableSorting: false,
      cell: ({ row }) => <span className="text-xs">{row.original.branch}</span>,
      exportValue: (r) => r.branch,
    },
    {
      id: "income_notes",
      header: "Notes",
      enableSorting: false,
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.income_notes || "—"}</span>,
      exportValue: (r) => r.income_notes || "",
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      enableHiding:  false,
      cell: ({ row }) => {
        const incomeId = row.original.income_id;
        const reversed = row.original.income_reverse_status === "reversed";
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-7 w-7 p-0 text-muted-foreground">
                <span className="sr-only">Open menu</span>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-xs" onClick={() => setViewIncome(row.original)}>
                <Eye className="w-3 h-3 mr-1.5" /> View Details
              </DropdownMenuItem>
              {canReverseSingle && incomeId && !reversed && (
                <DropdownMenuItem
                  className="text-xs text-destructive focus:text-destructive"
                  onClick={() => openPinDialog("single", incomeId)}
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
    data: rows,
    rowCount: totalRowCount,
    columns,
    manualPagination: true,
    manualSorting:    true,
    onSortingChange:  setSorting,
    onPaginationChange: (updater) => {
      setPagination((old) => {
        const next = typeof updater === "function" ? updater(old) : updater;
        setSelectedIds(new Set()); // clear selection on page change
        return next;
      });
    },
    getCoreRowModel:       getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel:     getSortedRowModel(),
    state: { sorting, pagination },
  });

  const visibleCols   = table.getVisibleLeafColumns().filter((c) => !["select", "actions"].includes(c.id));
  const exportHeaders = visibleCols.map((c) => typeof c.columnDef.header === "string" ? c.columnDef.header : c.id);
  const exportRows    = rows.map((row) => visibleCols.map((col) => {
    const def = col.columnDef;
    if (def.exportValue) return String(def.exportValue(row) ?? "");
    const raw = row[col.id];
    return raw !== undefined && raw !== null ? String(raw) : "";
  }));

  const exportCSV = useCallback(() => {
    const escape = (v) => `"${v.replace(/"/g, '""')}"`;
    const csv = [exportHeaders, ...exportRows].map((r) => r.map(escape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "incomes.csv"; a.click();
    URL.revokeObjectURL(url);
  }, [exportHeaders, exportRows]);

  const pageCount  = Math.max(1, Math.ceil(totalRowCount / pagination.pageSize));
  const from       = totalRowCount ? pagination.pageIndex * pagination.pageSize + 1 : 0;
  const to         = Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalRowCount);
  const isLastPage = to >= totalRowCount;

  return (
    <div className="w-full space-y-3">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search incomes…"
          value={globalFilter}
          onChange={(e) => { setGlobalFilter(e.target.value); setPagination((p) => ({ ...p, pageIndex: 0 })); }}
          className="h-8 w-52"
        />

        {hasPermission(roles, 100104) && (
          <Button variant="outline" size="sm" className="h-8" onClick={() => setIsAddOpen(true)}>
            + New Income
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

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="h-8" onClick={() => refetch()} disabled={isRefetching}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefetching ? "animate-spin" : ""}`} />
            {isRefetching ? "Refreshing…" : "Refresh"}
          </Button>
          <Button variant="outline" size="sm" className="h-8" onClick={exportCSV} disabled={!rows.length}>
            CSV
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                Columns <ChevronDown className="w-3.5 h-3.5 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {table.getAllColumns().filter((c) => c.getCanHide()).map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  checked={col.getIsVisible()}
                  onCheckedChange={(v) => col.toggleVisibility(!!v)}
                >
                  {typeof col.columnDef.header === "string" ? col.columnDef.header : col.id}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => {
                  const canSort = h.column.getCanSort();
                  const sorted  = h.column.getIsSorted();
                  return (
                    <TableHead
                      key={h.id}
                      className={canSort ? "cursor-pointer select-none whitespace-nowrap" : "whitespace-nowrap"}
                      onClick={canSort ? h.column.getToggleSortingHandler() : undefined}
                    >
                      <div className="flex items-center gap-1">
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        {canSort && (
                          sorted === "asc" ? <ArrowUp className="w-3 h-3 text-primary" /> :
                          sorted === "desc" ? <ArrowDown className="w-3 h-3 text-primary" /> :
                          <ArrowUpDown className="w-3 h-3 opacity-30" />
                        )}
                      </div>
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {isLoading ? (
              [...Array(pagination.pageSize)].map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => <TableCell key={j}><Skeleton className="h-4 rounded" /></TableCell>)}
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-10 text-destructive">
                  Failed to load income transactions — try refreshing.
                </TableCell>
              </TableRow>
            ) : rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={`${isRefetching ? "opacity-60" : ""} ${row.original.income_reverse_status === "reversed" ? "opacity-50" : ""}`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-2">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-10 text-muted-foreground">
                  No income transactions found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Pagination ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>
          {totalRowCount > 0
            ? `${from.toLocaleString()}–${to.toLocaleString()} of ${totalRowCount.toLocaleString()} records`
            : "No records"}
          {selectedCount > 0 && <span className="ml-2 text-primary font-medium">· {selectedCount} selected</span>}
        </span>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                {pagination.pageSize} / page <ChevronDown className="w-3.5 h-3.5 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {PAGE_SIZES.map((size) => (
                <DropdownMenuItem
                  key={size}
                  onClick={() => setPagination({ pageIndex: 0, pageSize: size })}
                  className={pagination.pageSize === size ? "font-semibold" : ""}
                >
                  {size} rows
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" className="h-8"
            onClick={() => setPagination((p) => ({ ...p, pageIndex: Math.max(p.pageIndex - 1, 0) }))}
            disabled={pagination.pageIndex === 0 || isLoading}
          >Previous</Button>
          <span className="text-xs font-medium tabular-nums">{pagination.pageIndex + 1} / {pageCount}</span>
          <Button variant="outline" size="sm" className="h-8"
            onClick={() => setPagination((p) => ({ ...p, pageIndex: p.pageIndex + 1 }))}
            disabled={isLastPage || isLoading}
          >Next</Button>
        </div>
      </div>

      {/* ── Add Income Dialog ── */}
      {hasPermission(roles, 100104) && isAddOpen && (
        <AddIncomeDialog
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          refetch={() => queryClient.invalidateQueries({ queryKey: ["incomes-ssr"] })}
          accountsData={accountsData}
          isLoadingAccounts={isLoadingAccounts}
          isErrorAccounts={isErrorAccounts}
          refetchAccounts={refetchAccounts}
          isRefetchingAccounts={isRefetchingAccounts}
        />
      )}

      {/* ── Income Details Dialog ── */}
      <Dialog open={!!viewIncome} onOpenChange={(o) => !o && setViewIncome(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Income Details</DialogTitle>
            <DialogDescription className="font-mono text-xs">{viewIncome?.income_code}</DialogDescription>
          </DialogHeader>
          {viewIncome && (
            <div className="space-y-2 py-1 text-sm">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <span className="text-muted-foreground text-xs">Received From</span>
                <span className="text-xs font-medium">{viewIncome.income_received_from || "—"}</span>

                <span className="text-muted-foreground text-xs">Amount</span>
                <span className="text-xs font-bold text-blue-600">
                  UGX {parseFloat(viewIncome.income_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>

                <span className="text-muted-foreground text-xs">Income Account</span>
                <span className="text-xs">{viewIncome.income_account || "—"}</span>

                <span className="text-muted-foreground text-xs">Debit Account</span>
                <span className="text-xs">{viewIncome.debit_account || "—"}</span>

                <span className="text-muted-foreground text-xs">Date</span>
                <span className="text-xs">{viewIncome.income_date || "—"}</span>

                <span className="text-muted-foreground text-xs">Posted By</span>
                <span className="text-xs">{viewIncome.user || "—"}</span>

                <span className="text-muted-foreground text-xs">Branch</span>
                <span className="text-xs">{viewIncome.branch || "—"}</span>

                <span className="text-muted-foreground text-xs">Status</span>
                <span className="text-xs capitalize">
                  <Badge className={`text-xs border ${STATUS_CLASS[viewIncome.income_reverse_status ?? "active"] ?? "bg-muted"}`}>
                    {viewIncome.income_reverse_status || "active"}
                  </Badge>
                </span>

                {viewIncome.income_notes && (
                  <>
                    <span className="text-muted-foreground text-xs">Notes</span>
                    <span className="text-xs">{viewIncome.income_notes}</span>
                  </>
                )}
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setViewIncome(null)}>Close</Button>
            <Button size="sm" onClick={() => printReceipt(viewIncome)}>
              Print Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── PIN Reversal Dialog ── */}
      <Dialog open={!!pinDialog} onOpenChange={(o) => !o && closePinDialog()}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {pinDialog?.mode === "bulk"
                ? `Reverse ${pinDialog.incomeIds?.length} income entr${pinDialog.incomeIds?.length === 1 ? "y" : "ies"}`
                : "Reverse income entry"}
            </DialogTitle>
            <DialogDescription>
              {pinDialog?.mode === "bulk"
                ? "All selected entries will be reversed in a single all-or-nothing operation. Enter your PIN to confirm."
                : "A reversal journal entry will be created and this income will be marked as reversed. Enter your PIN to confirm."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="reversal-pin">Your PIN</Label>
              <Input
                id="reversal-pin"
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
            <Button variant="destructive" onClick={submitReversal} disabled={isPending || !pin.trim()}>
              {isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <RotateCcw className="w-3.5 h-3.5 mr-1.5" />}
              {isPending ? "Reversing…" : "Confirm Reversal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import {
  flexRender, getCoreRowModel, getPaginationRowModel,
  getSortedRowModel, useReactTable,
} from "@tanstack/react-table";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChevronDown, RefreshCw, RotateCcw } from "lucide-react";
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

export function JournalEntriesTable() {
  const navigate      = useNavigate();
  const axiosPrivate  = useAxiosPrivate();
  const queryClient   = useQueryClient();
  const { auth: { roles } } = useAuth();

  const [sorting,       setSorting]       = useState([]);
  const [globalFilter,  setGlobalFilter]  = useState("");
  const [statusFilter,  setStatusFilter]  = useState("all");
  const [pagination,    setPagination]    = useState({ pageIndex: 0, pageSize: 10 });
  const [isModalOpen,   setIsModalOpen]   = useState(false);
  const [reverseTarget, setReverseTarget] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

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

  const reverseMutation = useMutation({
    mutationFn: (jeId) =>
      axiosPrivate.post(`/accounting/journals/${jeId}/reverse`),
    onSuccess: () => {
      toast({ title: "Journal entry reversed", description: "A reversal entry has been created." });
      queryClient.invalidateQueries({ queryKey: ["journal-entries-data"] });
    },
    onError: (err) => {
      toast({
        title: "Reversal failed",
        description: err?.response?.data?.messages?.[0] ?? "Could not reverse this entry.",
        variant: "destructive",
      });
    },
  });

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

  const columns = [
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
        const canReverse = hasPermission(roles, 100172) && je.status !== "reversed" && je.source_module === "manual";
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
              {hasPermission(roles, 100169) && (
                <DropdownMenuItem
                  className="text-xs"
                  onClick={() => navigate(`/journal-entries/${je.journal_entry_id}`)}
                >
                  View Details
                </DropdownMenuItem>
              )}
              {canReverse && (
                <DropdownMenuItem
                  className="text-xs text-destructive focus:text-destructive"
                  onClick={() => setReverseTarget(je)}
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

  const table = useReactTable({
    data:         data?.data || [],
    rowCount:     data?.meta?.totalRowCount,
    columns,
    manualPagination: true,
    manualSorting:    true,
    onSortingChange:  setSorting,
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
          onChange={(e) => setGlobalFilter(e.target.value)}
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
              {table.getAllColumns().filter((c) => c.getCanHide() && c.id !== "actions").map((col) => (
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
                <TableRow key={row.id} className="hover:bg-muted/30">
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

      {/* ── Reverse confirmation ── */}
      <AlertDialog open={!!reverseTarget} onOpenChange={(o) => !o && setReverseTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reverse journal entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a new reversal entry that cancels{" "}
              <strong>{reverseTarget?.transaction_code}</strong>. The original entry will be
              marked as <em>reversed</em>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                reverseMutation.mutate(reverseTarget.journal_entry_id);
                setReverseTarget(null);
              }}
            >
              Reverse Entry
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

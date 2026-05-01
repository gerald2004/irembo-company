/* eslint-disable react/prop-types */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { useDebounce } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/dropdown-menu";
import {
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ChevronDown,
  RefreshCw,
  FileText,
  FileSpreadsheet,
} from "lucide-react";

const PAGE_SIZES = [10, 25, 50, 100];

/**
 * Reusable server-side data table.
 *
 * Props:
 *  queryKey     string[]   — base TanStack Query key; pagination/filter/sort appended automatically
 *  endpoint     string     — API path (GET, returns { data: [...], meta: { totalRowCount } })
 *  columns      ColumnDef[] — TanStack column defs; add exportValue?: (row) => string for export
 *  title        string     — displayed in PDF header
 *  filename     string     — base filename for CSV / PDF downloads
 *  toolbar      ReactNode  — slot for extra buttons (e.g. "+ New" button) inserted left of actions
 *  extraParams  object     — fixed query params merged on every request
 */
export function ServerDataTable({
  queryKey,
  endpoint,
  columns,
  title = "Report",
  filename = "export",
  toolbar,
  extraParams = {},
}) {
  const navigate = useNavigate();
  const axiosPrivate = useAxiosPrivate();

  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const debouncedFilter = useDebounce(globalFilter, 500);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const { data = {}, isLoading, isRefetching, isError, refetch } = useQuery({
    queryKey: [...queryKey, pagination.pageIndex, pagination.pageSize, debouncedFilter, sorting],
    queryFn: async ({ signal }) => {
      try {
        const res = await axiosPrivate.get(endpoint, {
          params: {
            start: pagination.pageIndex * pagination.pageSize,
            size: pagination.pageSize,
            globalFilter: debouncedFilter || undefined,
            sorting: sorting.length ? JSON.stringify(sorting) : undefined,
            ...extraParams,
          },
          signal,
        });
        return res.data.data ?? {};
      } catch (err) {
        if (err?.response?.status === 401)
          navigate("/", { state: { from: location }, replace: true });
        throw err;
      }
    },
    placeholderData: (prev) => prev,
  });

  const rows = data?.data ?? [];
  const totalRowCount = data?.meta?.totalRowCount ?? 0;

  const table = useReactTable({
    data: rows,
    rowCount: totalRowCount,
    columns,
    manualPagination: true,
    manualSorting: true,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting, pagination },
  });

  // ── Export helpers ─────────────────────────────────────────────────────────
  const visibleCols = table
    .getVisibleLeafColumns()
    .filter((c) => c.id !== "actions");

  const exportHeaders = visibleCols.map((c) =>
    typeof c.columnDef.header === "string" ? c.columnDef.header : c.id
  );

  const exportRows = rows.map((row) =>
    visibleCols.map((col) => {
      const def = col.columnDef;
      if (def.exportValue) return String(def.exportValue(row) ?? "");
      const raw = row[col.id];
      return raw !== undefined && raw !== null ? String(raw) : "";
    })
  );

  const exportCSV = () => {
    const escape = (v) => `"${v.replace(/"/g, '""')}"`;
    const csv = [exportHeaders, ...exportRows]
      .map((r) => r.map(escape).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text(title, 14, 14);
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(`Exported: ${new Date().toLocaleString()}`, 14, 20);
    autoTable(doc, {
      head: [exportHeaders],
      body: exportRows,
      startY: 25,
      styles: { fontSize: 7.5, cellPadding: 2 },
      headStyles: { fillColor: [30, 90, 168], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });
    doc.save(`${filename}.pdf`);
  };

  // ── Pagination info ────────────────────────────────────────────────────────
  const from = totalRowCount ? pagination.pageIndex * pagination.pageSize + 1 : 0;
  const to = Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalRowCount);
  const pageCount = Math.max(1, Math.ceil(totalRowCount / pagination.pageSize));
  const isLastPage = to >= totalRowCount;

  return (
    <div className="w-full space-y-3">
      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search..."
          value={globalFilter}
          onChange={(e) => {
            setGlobalFilter(e.target.value);
            setPagination((p) => ({ ...p, pageIndex: 0 }));
          }}
          className="h-8 w-52"
        />

        {/* Caller-supplied buttons (e.g. "+ New Income") */}
        {toolbar}

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw
              className={`w-3.5 h-3.5 mr-1.5 ${isRefetching ? "animate-spin" : ""}`}
            />
            {isRefetching ? "Refreshing…" : "Refresh"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={exportCSV}
            disabled={!rows.length}
            title="Export visible rows to CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />
            CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={exportPDF}
            disabled={!rows.length}
            title="Export visible rows to PDF"
          >
            <FileText className="w-3.5 h-3.5 mr-1.5" />
            PDF
          </Button>

          {/* Column visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                Columns <ChevronDown className="w-3.5 h-3.5 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {table
                .getAllColumns()
                .filter((c) => c.getCanHide())
                .map((col) => (
                  <DropdownMenuCheckboxItem
                    key={col.id}
                    checked={col.getIsVisible()}
                    onCheckedChange={(v) => col.toggleVisibility(!!v)}
                  >
                    {typeof col.columnDef.header === "string"
                      ? col.columnDef.header
                      : col.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => {
                  const canSort = h.column.getCanSort();
                  const sorted = h.column.getIsSorted();
                  return (
                    <TableHead
                      key={h.id}
                      className={canSort ? "cursor-pointer select-none whitespace-nowrap" : "whitespace-nowrap"}
                      onClick={canSort ? h.column.getToggleSortingHandler() : undefined}
                    >
                      <div className="flex items-center gap-1">
                        {flexRender(h.column.columnDef.header, h.getContext())}
                        {canSort && (
                          sorted === "asc" ? (
                            <ArrowUp className="w-3 h-3 text-primary" />
                          ) : sorted === "desc" ? (
                            <ArrowDown className="w-3 h-3 text-primary" />
                          ) : (
                            <ArrowUpDown className="w-3 h-3 opacity-30" />
                          )
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
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 rounded" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center py-10 text-destructive"
                >
                  Failed to load data — try refreshing.
                </TableCell>
              </TableRow>
            ) : rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={isRefetching ? "opacity-60 transition-opacity" : ""}
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
                <TableCell
                  colSpan={columns.length}
                  className="text-center py-10 text-muted-foreground"
                >
                  No records found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Pagination footer ────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>
          {totalRowCount > 0
            ? `${from.toLocaleString()}–${to.toLocaleString()} of ${totalRowCount.toLocaleString()} records`
            : "No records"}
        </span>

        <div className="flex items-center gap-2">
          {/* Rows per page */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                {pagination.pageSize} / page
                <ChevronDown className="w-3.5 h-3.5 ml-1" />
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

          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() =>
              setPagination((p) => ({ ...p, pageIndex: Math.max(p.pageIndex - 1, 0) }))
            }
            disabled={pagination.pageIndex === 0 || isLoading}
          >
            Previous
          </Button>

          <span className="text-xs font-medium tabular-nums">
            {pagination.pageIndex + 1} / {pageCount}
          </span>

          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() =>
              setPagination((p) => ({ ...p, pageIndex: p.pageIndex + 1 }))
            }
            disabled={isLastPage || isLoading}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

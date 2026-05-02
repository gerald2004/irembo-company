/* eslint-disable react/prop-types */
import React, { useState, forwardRef } from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, Search, RefreshCw, AlertCircle, FileX } from "lucide-react";

const fmt = (n) =>
  new Intl.NumberFormat("en-UG", { maximumFractionDigits: 2 }).format(n ?? 0);

const DatatableReport = forwardRef(
  (
    {
      columns,
      data,
      fetchData,
      isLoading,
      isRefetching,
      isError,
      buttonTitle,
      buttonMethod,
      colSpan,
      totalDebit  = 0,
      totalCredit = 0,
      footerCells,
    },
    ref
  ) => {
    const [globalFilter, setGlobalFilter] = useState("");
    const [pagination, setPagination]     = useState({ pageIndex: 0, pageSize: 10 });

    const table = useReactTable({
      data: data ?? [],
      columns,
      getCoreRowModel:       getCoreRowModel(),
      getFilteredRowModel:   getFilteredRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      state:                 { globalFilter, pagination },
      onPaginationChange:    setPagination,
      onGlobalFilterChange:  setGlobalFilter,
      globalFilterFn: (row, columnId, filterValue) =>
        String(row.getValue(columnId) ?? "")
          .toLowerCase()
          .includes(filterValue.toLowerCase()),
    });

    React.useImperativeHandle(ref, () => table);
    DatatableReport.displayName = "DatatableReport";

    const handlePageSizeChange = (size) =>
      setPagination((prev) => ({ ...prev, pageSize: size, pageIndex: 0 }));

    const totalRows    = table.getFilteredRowModel().rows.length;
    const pageCount    = table.getPageCount();
    const currentPage  = pagination.pageIndex + 1;

    return (
      <div className="w-full space-y-3">

        {/* ── Toolbar ────────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              className="pl-8 h-8 text-xs"
              placeholder="Search table…"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
            />
          </div>

          {buttonTitle && (
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={buttonMethod}>
              {buttonTitle}
            </Button>
          )}

          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={fetchData} disabled={isRefetching}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isRefetching ? "animate-spin" : ""}`} />
            {isRefetching ? "Refreshing…" : "Refresh"}
          </Button>

          {/* Rows per page */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs">
                {pagination.pageSize} / page <ChevronDown className="w-3 h-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {[10, 20, 50, 100, 250].map((size) => (
                <DropdownMenuItem key={size} className="text-xs" onClick={() => handlePageSizeChange(size)}>
                  {size} rows
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Column visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs ml-auto">
                Columns <ChevronDown className="w-3 h-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-64 overflow-y-auto">
              {table
                .getAllColumns()
                .filter((col) => col.getCanHide())
                .map((col) => (
                  <DropdownMenuCheckboxItem
                    key={col.id}
                    className="capitalize text-xs"
                    checked={col.getIsVisible()}
                    onCheckedChange={(v) => col.toggleVisibility(!!v)}
                  >
                    {typeof col.columnDef.header === "string" ? col.columnDef.header : col.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* ── Table ──────────────────────────────────────────────────────────── */}
        <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id} className="bg-muted/50 hover:bg-muted/50">
                    {hg.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className="text-xs font-semibold uppercase tracking-wide text-muted-foreground h-9 px-3 whitespace-nowrap"
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>

              <TableBody>
                {/* Loading skeleton */}
                {(isLoading || isRefetching) &&
                  Array(pagination.pageSize).fill(0).map((_, i) => (
                    <TableRow key={`sk-${i}`} className={i % 2 === 0 ? "" : "bg-muted/20"}>
                      {columns.map((_, ci) => (
                        <TableCell key={`skc-${ci}`} className="px-3 py-2">
                          <Skeleton className="h-4 w-full rounded" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                }

                {/* Error state */}
                {isError && !isLoading && (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-2 text-destructive">
                        <AlertCircle className="w-6 h-6" />
                        <span className="text-sm font-medium">Failed to load data</span>
                        <Button variant="outline" size="sm" className="mt-1 text-xs" onClick={fetchData}>
                          Try Again
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {/* Data rows */}
                {!isLoading && !isError && data?.length > 0 && (
                  <>
                    {table.getRowModel().rows.map((row, idx) => (
                      <TableRow
                        key={row.id}
                        className={`
                          text-xs transition-colors
                          ${idx % 2 === 0 ? "bg-background" : "bg-muted/20"}
                          hover:bg-primary/5
                        `}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            className="px-3 py-2 whitespace-normal break-words max-w-[220px]"
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}

                    {/* Totals row — footerCells (per-column alignment) or legacy totalDebit/totalCredit */}
                    {footerCells?.length > 0 ? (
                      <TableRow className="bg-muted font-semibold text-xs border-t-2">
                        <TableCell colSpan={columns.length - footerCells.length} className="px-3 py-2 text-muted-foreground">
                          Total ({totalRows} records)
                        </TableCell>
                        {footerCells.map((cell, i) => (
                          <TableCell key={i} className={`px-3 py-2 tabular-nums text-right ${cell.className ?? ""}`}>
                            {cell.empty ? "—" : cell.isCount ? Number(cell.value ?? 0).toLocaleString() : fmt(cell.value ?? 0)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ) : (totalDebit > 0 || totalCredit > 0) ? (
                      <TableRow className="bg-muted font-semibold text-xs border-t-2">
                        <TableCell colSpan={columns.length - colSpan} className="px-3 py-2 text-muted-foreground">
                          Total ({totalRows} records)
                        </TableCell>
                        {totalDebit > 0 && (
                          <TableCell className="px-3 py-2 text-right tabular-nums">{fmt(totalDebit)}</TableCell>
                        )}
                        {totalCredit > 0 && (
                          <TableCell className="px-3 py-2 text-right tabular-nums">{fmt(totalCredit)}</TableCell>
                        )}
                      </TableRow>
                    ) : null}
                  </>
                )}

                {/* Empty state */}
                {!isLoading && !isError && !data?.length && (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="py-14 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <FileX className="w-8 h-8 opacity-40" />
                        <span className="text-sm font-medium">No records found</span>
                        <span className="text-xs">Try adjusting the date range or filters</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* ── Pagination ─────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            {totalRows > 0
              ? `Showing ${pagination.pageIndex * pagination.pageSize + 1}–${Math.min(
                  (pagination.pageIndex + 1) * pagination.pageSize,
                  totalRows
                )} of ${totalRows} records`
              : "No records"}
          </span>
          <div className="flex items-center gap-1.5">
            <Button size="sm" variant="outline" className="h-7 text-xs px-2"
              onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
              «
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs px-2"
              onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
              ‹ Prev
            </Button>
            <span className="px-2 font-medium text-foreground">
              {currentPage} / {pageCount || 1}
            </span>
            <Button size="sm" variant="outline" className="h-7 text-xs px-2"
              onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              Next ›
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs px-2"
              onClick={() => table.setPageIndex(pageCount - 1)} disabled={!table.getCanNextPage()}>
              »
            </Button>
          </div>
        </div>
      </div>
    );
  }
);

export default DatatableReport;

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
import { ChevronDown } from "lucide-react";

const DatatableReportTwo = forwardRef(
  ({
    columns,
    data,
    fetchData,
    isLoading,
    isRefetching,
    isError,
    buttonTitle,
    buttonMethod,
    colSpan = 0,
    summaryFields = {},
  }, ref) => {
    const [globalFilter, setGlobalFilter] = useState("");
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 7 });

    const table = useReactTable({
      data,
      columns,
      getCoreRowModel: getCoreRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      state: {
        globalFilter,
        pagination,
      },
      onPaginationChange: setPagination,
      onGlobalFilterChange: setGlobalFilter,
      globalFilterFn: (row, columnId, filterValue) => {
        return String(row.getValue(columnId))
          .toLowerCase()
          .includes(filterValue.toLowerCase());
      },
    });

    React.useImperativeHandle(ref, () => table);
    DatatableReportTwo.displayName = "Datatable";

    const handlePageSizeChange = (size) => {
      setPagination((prev) => ({
        ...prev,
        pageSize: size,
        pageIndex: 0,
      }));
    };

    return (
      <div className="w-full">
        {/* ✅ Search, Add Button, Refresh */}
        <div className="flex items-center py-4 space-x-4">
          <Input
            placeholder="Search..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
          />
          {buttonTitle && (
            <Button variant="outline" size="sm" onClick={buttonMethod}>
              {buttonTitle}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={fetchData}>
            {isRefetching ? "Refreshing" : "Refresh"}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                Columns <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.columnDef.header}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* ✅ Table Component */}
        <div className="w-full overflow-x-auto border rounded-md">
          <Table className="table-auto min-w-max w-full">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading || isRefetching ? (
                Array(pagination.pageSize)
                  .fill()
                  .map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      {columns.map((_, colIdx) => (
                        <TableCell key={`skeleton-cell-${colIdx}`}>
                          <Skeleton className="h-5 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center">
                    Error Loading Data
                  </TableCell>
                </TableRow>
              ) : data?.length ? (
                <>
                  {table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          className="whitespace-normal break-words max-w-[250px] p-2"
                          key={cell.id}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}

                  {/* Summary Row (Only if totalDebit or totalCredit is not 0) */}
                  {Object.values(summaryFields).some((val) => val > 0) && (
                    <TableRow className="font-semibold  text-xs">
                      <TableCell
                        colSpan={
                          columns.length -
                          Object.keys(summaryFields).length -
                          colSpan
                        }
                      />
                      {Object.entries(summaryFields).map(([key, value]) => (
                        <TableCell key={key} className="text-start">
                          {value >= 0 ? value.toLocaleString() : 0}
                        </TableCell>
                      ))}
                    </TableRow>
                  )}
                </>
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="text-center">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* ✅ Pagination Controls */}
        <div className="flex justify-between items-center py-4">
          <div className="text-sm">
            Page {pagination.pageIndex + 1} of {table.getPageCount()}
          </div>
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Rows per page
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {[5, 10, 20, 50, 100, 500].map((size) => (
                  <DropdownMenuItem
                    key={size}
                    onClick={() => handlePageSizeChange(size)}
                  >
                    {size}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    );
  }
);

export default DatatableReportTwo;

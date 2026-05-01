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
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTimestamp, useDebounce } from "@/lib/utils";

export function ShareTable() {
  const navigate = useNavigate();
  const axiosPrivate = useAxiosPrivate();

  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const debouncedFilter = useDebounce(globalFilter, 600);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const { data = {}, isLoading, refetch, isRefetching, isError } = useQuery({
    queryKey: ["shares-ssr", pagination.pageIndex, pagination.pageSize, debouncedFilter, sorting],
    queryFn: async () => {
      const controller = new AbortController();
      try {
        const res = await axiosPrivate.get("/serverside/shares", {
          params: {
            start:        pagination.pageIndex * pagination.pageSize,
            size:         pagination.pageSize,
            globalFilter: debouncedFilter,
            sorting:      JSON.stringify(sorting || []),
          },
          signal: controller.signal,
        });
        return res.data.data ?? {};
      } catch (error) {
        if (error?.response?.status === 401)
          navigate("/", { state: { from: location }, replace: true });
        throw error;
      }
    },
    keepPreviousData: true,
  });

  const columns = [
    {
      id: "shares_transaction_code",
      header: "Code",
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.shares_transaction_code}</span>,
    },
    {
      id: "client_name",
      header: "Member",
      cell: ({ row }) => <span className="text-sm font-medium">{row.original.client_name}</span>,
    },
    {
      id: "client_account_number",
      header: "Account No.",
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.client_account_number}</span>,
    },
    {
      id: "shares_transaction_type",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant={row.original.shares_transaction_type === "in" ? "default" : "secondary"} className="text-xs capitalize">
          {row.original.shares_transaction_type === "in" ? "Purchase" : "Redemption"}
        </Badge>
      ),
    },
    {
      id: "shares_transaction_count",
      header: "Shares",
      cell: ({ row }) => (
        <span className={`font-mono font-semibold text-sm ${row.original.shares_transaction_type === "in" ? "text-blue-600" : "text-red-600"}`}>
          {row.original.shares_transaction_type === "in" ? "+" : "-"}{row.original.shares_transaction_count}
        </span>
      ),
    },
    {
      id: "shares_transaction_narrative",
      header: "Narrative",
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{row.original.shares_transaction_narrative || "—"}</span>,
    },
    {
      id: "branch",
      header: "Branch",
      cell: ({ row }) => <span className="text-xs">{row.original.branch}</span>,
    },
    {
      id: "created_at",
      header: "Date",
      cell: ({ row }) => <span className="text-xs whitespace-nowrap">{formatDateTimestamp(row.original.created_at)}</span>,
    },
  ];

  const table = useReactTable({
    data: data?.data || [],
    rowCount: data?.meta?.totalRowCount,
    columns,
    manualPagination: true,
    manualSorting: true,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting, globalFilter, pagination },
  });

  const renderSkeleton = () =>
    [...Array(pagination.pageSize)].map((_, i) => (
      <TableRow key={i}>
        {columns.map((_, j) => (
          <TableCell key={j}><Skeleton className="h-5 rounded" /></TableCell>
        ))}
      </TableRow>
    ));

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center gap-2 py-4">
        <Input
          placeholder="Search shares..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-xs"
        />
        <Button variant="outline" size="sm" onClick={refetch}>
          {isRefetching ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>
                    {flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading || isRefetching ? renderSkeleton()
              : isError ? (
                <TableRow><TableCell colSpan={columns.length} className="text-center">Error loading data.</TableCell></TableRow>
              ) : data?.data?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={columns.length} className="text-center">No share transactions found.</TableCell></TableRow>
              )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-center py-4 text-sm text-muted-foreground">
        <span>
          {data?.meta?.totalRowCount
            ? `${pagination.pageIndex * pagination.pageSize + 1}–${Math.min((pagination.pageIndex + 1) * pagination.pageSize, data.meta.totalRowCount)} of ${data.meta.totalRowCount}`
            : ""}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline" size="sm"
            onClick={() => setPagination((p) => ({ ...p, pageIndex: Math.max(p.pageIndex - 1, 0) }))}
            disabled={pagination.pageIndex === 0 || isLoading}
          >Previous</Button>
          <Button
            variant="outline" size="sm"
            onClick={() => setPagination((p) => ({ ...p, pageIndex: p.pageIndex + 1 }))}
            disabled={(data?.meta?.totalRowCount || 0) <= (pagination.pageIndex + 1) * pagination.pageSize || isLoading}
          >Next</Button>
        </div>
      </div>
    </div>
  );
}

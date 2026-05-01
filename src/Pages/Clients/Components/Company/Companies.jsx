import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import jsPDF from "jspdf";
import "jspdf-autotable";
import { ChevronDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { hasPermission } from "@/lib/utils";
import useAuth from "@/MiddleWares/Hooks/useAuth";

export function Companies() {
  const navigate = useNavigate();
  const axiosPrivate = useAxiosPrivate();
  const { auth } = useAuth();
  const roles = auth?.roles;

  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 7 });

  const { data: rawData = [], isLoading, refetch, isRefetching, isError } = useQuery({
    queryKey: ["companies"],
    queryFn: async () => {
      const res = await axiosPrivate.get("/clients/company");
      return res.data.data.clients ?? [];
    },
  });

  const columns = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          aria-label="Select row"
        />
      ),
    },
    {
      id: "client_account_number",
      header: "Account Number",
      accessorFn: (row) => row.client_account_number,
      cell: ({ row }) => (
        <Link
          to={hasPermission(roles, 100016) ? `/clients/company/${row.original.client_id}` : ""}
          className="font-mono text-xs hover:underline"
        >
          {row.original.client_account_number}
        </Link>
      ),
    },
    {
      id: "client_firstname",
      header: "Company Name",
      accessorFn: (row) => row.client_firstname,
      cell: ({ row }) => (
        <Link
          to={hasPermission(roles, 100016) ? `/clients/company/${row.original.client_id}` : ""}
          className="font-medium capitalize hover:uppercase"
        >
          {row.original.client_firstname}
        </Link>
      ),
    },
    {
      id: "company_detail.registration_number",
      header: "Reg. Number",
      accessorFn: (row) => row.company_detail?.registration_number ?? "—",
      cell: ({ row }) => (
        <span className="text-xs">{row.original.company_detail?.registration_number ?? "—"}</span>
      ),
    },
    {
      accessorKey: "client_contact",
      header: "Contact",
    },
    {
      accessorKey: "client_email_address",
      header: "Email",
      cell: ({ row }) => row.original.client_email_address ?? "—",
    },
    {
      id: "client_date_of_join",
      header: "Date Joined",
      accessorFn: (row) => row.client_date_of_join,
      cell: ({ row }) =>
        row.original.client_date_of_join
          ? new Date(row.original.client_date_of_join).toLocaleDateString()
          : "—",
    },
    {
      id: "client_status",
      header: "Status",
      accessorFn: (row) => row.client_status,
      cell: ({ row }) => (
        <Badge variant={row.original.client_status === "active" ? "success" : "secondary"}>
          {row.original.client_status}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              ...
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(row.original.client_account_number)}
            >
              Copy Account Number
            </DropdownMenuItem>
            {hasPermission(roles, 100016) && (
              <DropdownMenuItem asChild>
                <Link to={`/clients/company/${row.original.client_id}`}>
                  View Company Profile
                </Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const table = useReactTable({
    data: rawData,
    columns,
    state: { sorting, globalFilter, pagination },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const exportToCSV = () => {
    const csv = [
      ["Account Number", "Company Name", "Contact", "Email", "Date Joined", "Status"],
      ...rawData.map((r) => [
        r.client_account_number,
        r.client_firstname,
        r.client_contact,
        r.client_email_address ?? "",
        r.client_date_of_join ?? "",
        r.client_status,
      ]),
    ]
      .map((e) => e.join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `companies-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.autoTable({
      head: [["Account Number", "Company Name", "Contact", "Email", "Status"]],
      body: rawData.map((r) => [
        r.client_account_number,
        r.client_firstname,
        r.client_contact,
        r.client_email_address ?? "",
        r.client_status,
      ]),
    });
    doc.save(`companies-${Date.now()}.pdf`);
  };

  const handlePageSizeChange = (size) =>
    setPagination((prev) => ({ ...prev, pageSize: size, pageIndex: 0 }));

  const renderSkeleton = () =>
    [...Array(pagination.pageSize)].map((_, i) => (
      <TableRow key={i}>
        {columns.map((_, j) => (
          <TableCell key={j}>
            <Skeleton className="h-[20px] rounded-xl" />
          </TableCell>
        ))}
      </TableRow>
    ));

  return (
    <div className="w-full">
      <div className="flex items-center py-4 space-x-4 flex-wrap gap-y-2">
        <Input
          placeholder="Search companies..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />
        {hasPermission(roles, 100012) && (
          <Button asChild size="sm">
            <Link to="/clients/company/new">+ Register Company</Link>
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={exportToCSV}>Export CSV</Button>
        <Button variant="outline" size="sm" onClick={exportToPDF}>Export PDF</Button>
        <Button variant="outline" size="sm" onClick={() => window.print()}>Print</Button>
        <Button variant="outline" size="sm" onClick={refetch}>
          {isRefetching ? "Refreshing..." : "Refresh"}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">Columns <ChevronDown /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {table
              .getAllColumns()
              .filter((c) => c.getCanHide() && c.id !== "select")
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(v) => column.toggleVisibility(!!v)}
                >
                  {column.columnDef.header}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Show <ChevronDown /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {[5, 10, 20, 50, 100].map((size) => (
              <DropdownMenuCheckboxItem
                key={size}
                checked={pagination.pageSize === size}
                onCheckedChange={(c) => c && handlePageSizeChange(size)}
              >
                {size}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
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
            {isLoading || isRefetching ? (
              renderSkeleton()
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center">Error loading data</TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length ? (
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
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                  No company clients found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between py-4">
        <span className="text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
          {" · "}{table.getFilteredRowModel().rows.length} total
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Companies;

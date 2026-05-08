import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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
import { ChevronDown, MoreHorizontal, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import AlertModal from "@/components/AlertModal";
import { Badge } from "@/components/ui/badge";
import { formatDateTimestamp, hasPermission } from "@/lib/utils";
import { useDebounce } from "@/lib/utils";
import useAuth from "@/MiddleWares/Hooks/useAuth";

const loanStatusBadge = (status) => {
  const s = (status || "").toLowerCase();
  const cls = {
    pending:       "bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-100",
    first_review:  "bg-sky-100 text-sky-800 border-sky-300 hover:bg-sky-100",
    second_review: "bg-indigo-100 text-indigo-800 border-indigo-300 hover:bg-indigo-100",
    final_review:  "bg-violet-100 text-violet-800 border-violet-300 hover:bg-violet-100",
    processed:     "bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-100",
    approved:      "bg-green-100 text-green-800 border-green-300 hover:bg-green-100",
    disbursed:            "bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-100",
    pending_disbursement: "bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-100",
    overdue:              "bg-red-100 text-red-700 border-red-300 hover:bg-red-100",
    rejected:    "bg-red-100 text-red-700 border-red-300 hover:bg-red-100",
    paid_off:    "bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-100",
    settled:     "bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-100",
    writternoff: "bg-gray-800 text-gray-100 border-gray-700 hover:bg-gray-800",
    writtenoff:  "bg-gray-800 text-gray-100 border-gray-700 hover:bg-gray-800",
    refinanced:  "bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-100",
    active:      "bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-100",
  }[s] || "";
  return <Badge variant="outline" className={`capitalize text-xs font-medium ${cls}`}>{status}</Badge>;
};

export function IndividualLoansApplicationsTable({
  clientType = "individual",
  queryKeyPrefix = "individual",
  clientRoute = "/clients/individual",
  extraFilters = {},
}) {
  const navigate = useNavigate();
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const debouncedGlobalFilter = useDebounce(globalFilter, 1000);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 7 });
  const [statusFilter, setStatusFilter] = useState("");
  const axiosPrivate = useAxiosPrivate();
  const [showDialog, setShowDialog] = useState(false);
  const {auth : {roles}} = useAuth();
  const {
    data = [],
    isLoading,
    refetch,
    isRefetching,
    isError,
  } = useQuery({
    queryKey: [
      `${queryKeyPrefix}-loans-applications-data`,
      pagination.pageIndex,
      pagination.pageSize,
      debouncedGlobalFilter,
      sorting,
      extraFilters,
      statusFilter,
    ],
    queryFn: async () => {
      const controller = new AbortController();

      const fetchURL = `/serverside/loan-applications`;
      try {
        const response = await axiosPrivate.get(fetchURL, {
          params: {
            start: pagination.pageIndex * pagination.pageSize,
            size: pagination.pageSize,
            globalFilter: debouncedGlobalFilter,
            sorting: JSON.stringify(sorting || []),
            type: clientType,
            ...(statusFilter ? { status: statusFilter } : {}),
            ...extraFilters,
          },
          signal: controller.signal,
        });
        return response.data.data ?? [];
      } catch (error) {
        if (error?.response?.status === 401) {
          navigate("/", { state: { from: location }, replace: true });
        }
        return error;
      }
    },
    placeholderData: (prev) => prev,
  });

  const columns = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
    },
    {
      id: "loan_application_code",
      header: "Loan Number",
      cell: ({ row }) => (
        <Link
          to={
            hasPermission(roles, 100068) ?
            `/loans/${row.original.loan_application_id}` : ""
          }
          className="capitalize hover:uppercase"
        >
          {row.original.loan_application_code}
        </Link>
      ),
    },
    {
      id: "loan_application_amount",
      header: "Application Amount",
      cell: ({ row }) => (
        <p className="capitalize hover:uppercase">
          {parseFloat(row.original.loan_application_amount).toLocaleString()}
        </p>
      ),
    },
    {
      id: "loan_product_title",
      header: "Loan Product",
      cell: ({ row }) => (
        <p className="capitalize hover:uppercase">
          {row.original.loan_product_title}
        </p>
      ),
    },
    {
      id: "client_account_number",
      header: "Account Number",
      cell: ({ row }) => (
        <Link
          to={`${clientRoute}/${row.original.client_id}`}
          className="capitalize hover:uppercase"
        >
          {row.original.client_account_number}
        </Link>
      ),
    },
    {
      id: "name",
      header: "Client Name",
      cell: ({ row }) => {
        const name = row.original.client_group_name ||
          `${row.original.client_lastname || ""} ${row.original.client_firstname || ""}`.trim();
        return (
          <Link
            to={`${clientRoute}/${row.original.client_id}`}
            className="capitalize hover:uppercase"
          >
            {name}
          </Link>
        );
      },
    },
    {
      id: "loan_application_date",
      header: "Application Date",
      cell: ({ row }) =>
        formatDateTimestamp(row.original.loan_application_date),
    },
    {
      accessorKey: "loan_application_tenure_period",
      header: "Tenure Period",
    },
    {
      id: "loan_application_status",
      cell: ({ row }) => loanStatusBadge(row.original.loan_application_status),
      header: "Application Status",
    },
    {
      id: "guarantors_list",
      header: "Guarantors",
      cell: ({ row }) => (
        <p className="text-sm text-muted-foreground">
          {row.original.guarantors_list || "—"}
        </p>
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
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {hasPermission(roles, 100068) && (
              <DropdownMenuItem>
                <Link to={`/loans/${row.original.loan_application_id}`}>
                  View Loan
                </Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [debouncedGlobalFilter]);

  const table = useReactTable({
    data: data?.data || [],
    rowCount: data?.meta?.totalRowCount,
    columns,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
      pagination,
    },
  });

  const exportToCSV = () => {
    const csvData = data?.data.map((row) => ({
      AccountNumber: row.client_account_number,
      LoanNumber: row.client_account_number,
      ClientName: `${row.client_firstname} ${row.client_lastname}`,
      ApplicationDate: row.loan_application_date,
      TenurePeriod: row.loan_application_tenure_period,
      Status: row.loan_application_status,
    }));

    const csv = [
      [
        "Account Number",
        "Loan Number",
        "Client Name",
        "Application Date",
        "Tenure Period",
        "Status",
      ],
      ...csvData.map((row) => Object.values(row)),
    ]
      .map((e) => e.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `loans-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.autoTable({
      head: [
        [
          "Account Number",
          "Loan Number",
          "Client Name",
          "Application Date",
          "Tenure Period",
          "Status",
        ],
      ],
      body: data?.data.map((row) => [
        row.client_account_number,
        row.client_account_number,
        `${row.client_firstname} ${row.client_lastname}`,
        row.loan_application_date,
        row.loan_application_tenure_period,
        row.loan_application_status,
      ]),
    });
    doc.save(`loans-${Date.now()}.pdf`);
  };

  const renderSkeletonRows = () => {
    return [...Array(pagination.pageSize)].map((_, index) => (
      <TableRow key={`skeleton-${index}`}>
        {columns.map((column, colIndex) => (
          <TableCell key={`skeleton-cell-${colIndex}`}>
            <Skeleton className="col-span-4 h-[20px]  rounded-xl" />
          </TableCell>
        ))}
      </TableRow>
    ));
  };

  const handlePageSizeChange = (size) => {
    setPagination((prev) => ({
      ...prev,
      pageSize: size,
      pageIndex: 0,
    }));
  };

  return (
    <div className="w-full">
      <div className="flex items-center py-4 space-x-4 flex-wrap gap-y-2">
        <Input
          placeholder="Search clients..."
          value={globalFilter}
          onChange={(event) => {
            setGlobalFilter(event.target.value);
            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
          }}
          className="max-w-sm"
        />

        <Select
          value={statusFilter || "_all"}
          onValueChange={(v) => {
            setStatusFilter(v === "_all" ? "" : v);
            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
          }}
        >
          <SelectTrigger className="w-[180px]">
            <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="first_review">First Review</SelectItem>
            <SelectItem value="second_review">Second Review</SelectItem>
            <SelectItem value="final_review">Final Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="pending_disbursement">Pending Disbursement</SelectItem>
            <SelectItem value="disbursed">Disbursed</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="paid_off">Paid Off</SelectItem>
            <SelectItem value="settled">Settled</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={() => exportToCSV(data?.data)}
        >
          Export to CSV
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportToPDF(data?.data)}
        >
          Export to PDF
        </Button>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          Print
        </Button>
        <Button variant="outline" size="sm" onClick={refetch}>
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
              .filter((column) => column.id !== "select")
              .map((column) => {
                return (
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
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Show <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {[5, 10, 20, 50, 100].map((size) => (
              <DropdownMenuCheckboxItem
                key={size}
                className="capitalize"
                checked={pagination.pageSize === size}
                onCheckedChange={(checked) => {
                  if (checked) handlePageSizeChange(size);
                }}
              >
                {size}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Bulk Actions <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {[{ title: "Delete", action: "delete_action" }].map((action) => (
              <DropdownMenuCheckboxItem
                key={action.title}
                className="capitalize"
                onClick={() => setShowDialog(true)}
              >
                {action.title}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border overflow-x-auto">
        <Table>
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
              renderSkeletonRows()
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center">
                  Error Loading Data
                </TableCell>
              </TableRow>
            ) : data?.data?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
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
      <div className="flex justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setPagination((prev) => ({
              ...prev,
              pageIndex: Math.max(prev.pageIndex - 1, 0),
            }))
          }
          disabled={pagination.pageIndex === 0 || isLoading}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setPagination((prev) => ({
              ...prev,
              pageIndex: prev.pageIndex + 1,
            }))
          }
          disabled={
            (data?.meta?.totalRowCount || 0) <=
              (pagination.pageIndex + 1) * pagination.pageSize || isLoading
          }
        >
          Next
        </Button>
      </div>
      {showDialog && (
        <AlertModal
          showDialog={showDialog}
          setShowDialog={setShowDialog}
          title="Alert"
          message="This action is not permitted."
          method={() => setShowDialog(false)}
          // buttonName="Close"
          // modalSize="325px"
        />
      )}
    </div>
  );
}

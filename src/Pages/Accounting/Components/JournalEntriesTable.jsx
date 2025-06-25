import { useState } from "react";
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
import { ChevronDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import AlertModal from "@/components/AlertModal";
import { Badge } from "@/components/ui/badge";
import { formatDateTimestamp, hasPermission } from "@/lib/utils";
import JournalEntryDialog from "./Forms/JournalEntryDialog";
import { useDebounce } from "@/lib/utils";
import useAuth from "@/MiddleWares/Hooks/useAuth";
export function JournalEntriesTable() {
  const navigate = useNavigate();
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const debouncedGlobalFilter = useDebounce(globalFilter, 1000);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 7 });
  const axiosPrivate = useAxiosPrivate();
  const [showDialog, setShowDialog] = useState(false);
  const {
    auth: { roles },
  } = useAuth();
  const {
    data = [],
    isLoading,
    refetch,
    isRefetching,
    isError,
  } = useQuery({
    queryKey: [
      "journal-entries-data",
      pagination.pageIndex,
      pagination.pageSize,
      debouncedGlobalFilter,
      sorting,
    ],
    queryFn: async () => {
      const controller = new AbortController();
      const fetchURL = `/serverside/journal-entries`;
      try {
        const response = await axiosPrivate.get(fetchURL, {
          params: {
            start: pagination.pageIndex * pagination.pageSize,
            size: pagination.pageSize,
            globalFilter: debouncedGlobalFilter,
            sorting: JSON.stringify(sorting || []),
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
    keepPreviousData: true,
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
      id: "transaction_code",
      header: "Transaction Code",
      cell: ({ row }) => (
        <Link
          to={hasPermission(
            roles,
            100169
          ) ? `/journal-entries/${row.original.journal_entry_id}` : ""}
          className="capitalize hover:uppercase"
        >
          {row.original.transaction_code}
        </Link>
      ),
    },
    {
      id: "amount",
      header: "Amount",
      cell: ({ row }) => (
        <p className="capitalize hover:uppercase">
          {parseFloat(row.original.amount).toLocaleString()}
        </p>
      ),
    },
    {
      id: "branch",
      header: "Branch",
      cell: ({ row }) => (
        <p className="capitalize hover:uppercase">{row.original.branch}</p>
      ),
    },
    {
      id: "transaction_date",
      header: "Timestamp",
      cell: ({ row }) => formatDateTimestamp(row.original.transaction_date),
    },
    {
      accessorKey: "description",
      header: "Description",
    },
    {
      id: "status",
      cell: ({ row }) => (
        <Badge className="capitalize">{row.original.status}</Badge>
      ),
      header: "Status",
    },
    {
      id: "actions",
      header: "Actions",
      cell: () => (
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
            {hasPermission(roles, 100172) && (
              <DropdownMenuItem>Reverse</DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
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
    state: {
      sorting,
      globalFilter,
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
        "Transaction Code",
        "Amount",
        "Branch",
        "Timestamp",
        "Description",
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
    link.setAttribute("download", `journal-entries-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.autoTable({
      head: [
        [
          "Transaction Code",
          "Amount",
          "Branch",
          "Timestamp",
          "Description",
          "Status",
        ],
      ],
      body: data?.data.map((row) => [
        row.transaction_code,
        row.amount,
        row.branch,
        row.timestamp,
        row.description,
        row.status,
      ]),
    });
    doc.save(`journal-entries-${Date.now()}.pdf`);
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

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  return (
    <div className="w-full">
      <div className="flex items-center py-4 space-x-4">
        <Input
          placeholder="Search journal entries..."
          value={globalFilter}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="max-w-sm"
        />
        {hasPermission(roles, 100108) && (
          <Button variant="outline" size="sm" onClick={handleOpenModal}>
            + New Entry
          </Button>
        )}
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
      {hasPermission(roles, 100108) && isModalOpen && (
        <JournalEntryDialog
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          refetch={refetch}
        />
      )}
    </div>
  );
}

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
import { ChevronDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import AlertModal from "@/components/AlertModal";
import { Badge } from "@/components/ui/badge";
import { formatDateTimestamp } from "@/lib/utils";
import { useDebounce } from "@/lib/utils";
import fileDownload from "js-file-download";
import { toast } from "@/hooks/use-toast";
import { FixedDepositLogModal } from "./FixedDepositLogModal";
import { UnitTrustMovementDialog } from "./UnitTrustMovementDialog";

export function FixedDepositTable() {
  const navigate = useNavigate();
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const debouncedGlobalFilter = useDebounce(globalFilter, 1000);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 7 });
  const axiosPrivate = useAxiosPrivate();
  const [showDialog, setShowDialog] = useState(false);

  const [selectedId, setSelectedId] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [showActionDialog, setShowActionDialog] = useState(false);

  const [isDownloading, setIsDownloading] = useState(false);
  const [logModal, setLogModal] = useState({ open: false, fdId: null, fdCode: "" });
  const [movModal, setMovModal] = useState({ open: false, fdId: null, fdCode: "", type: "deposit", balance: 0, clientId: null, clientAccountId: null });

  const openLog = (row) => setLogModal({ open: true, fdId: row.fixed_deposit_transaction_id, fdCode: row.fixed_deposit_transaction_code });
  const closeLog = () => setLogModal((s) => ({ ...s, open: false }));

  const openMov = (row, type) => setMovModal({
    open: true,
    fdId:            row.fixed_deposit_transaction_id,
    fdCode:          row.fixed_deposit_transaction_code,
    type,
    balance:         row.fixed_deposit_transaction_current_balance ?? 0,
    clientId:        row.client_id,
    clientAccountId: row.client_account_id,
  });
  const closeMov = () => setMovModal((s) => ({ ...s, open: false }));

  const handleOpenActionDialog = (id, status, accountId, clientId) => {
    setSelectedId(id);
    setSelectedStatus(status);
    setSelectedAccountId(accountId);
    setSelectedClientId(clientId);
    setShowActionDialog(true);
  };

  const handleCloseActionDialog = () => {
    setSelectedId(null);
    setSelectedStatus(null);
    setSelectedAccountId(null);
    setSelectedClientId(null);
    setShowActionDialog(false);
  };

  const handleTransfer = async () => {
    try {
      await axiosPrivate.put(`accounting/fixed/deposits`, {
        status: selectedStatus,
        transaction_id: selectedId,
        client_account_id: selectedAccountId,
        client_id: selectedClientId,
      });
      toast({ title: "Success", description: "Fixed deposit updated." });
      refetch();
    } catch (error) {
      const msg = error?.response?.data?.messages || "No server response";
      toast({ title: "Error", variant: "destructive", description: Array.isArray(msg) ? msg.join(", ") : msg });
    } finally {
      handleCloseActionDialog();
    }
  };

  const {
    data = [],
    isLoading,
    refetch,
    isRefetching,
    isError,
  } = useQuery({
    queryKey: [
      "fixed-deposits-data",
      pagination.pageIndex,
      pagination.pageSize,
      debouncedGlobalFilter,
      sorting,
    ],
    queryFn: async () => {
      const controller = new AbortController();
      const fetchURL = `/serverside/fixed-deposits`;
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
      id: "fixed_deposit_transaction_code",
      header: "Transaction Code",
      cell: ({ row }) => (
        <p className="capitalize hover:uppercase">
          {row.original.fixed_deposit_transaction_code}
        </p>
      ),
    },
    {
      id: "fixed_deposit_transaction_amount",
      header: "Fixed Amount",
      cell: ({ row }) => (
        <p className="capitalize hover:uppercase">
          {parseFloat(
            row.original.fixed_deposit_transaction_amount
          ).toLocaleString()}
        </p>
      ),
    },
    {
      id: "fixed_deposit_transaction_return_amount",
      header: "Return Interest",
      cell: ({ row }) => (
        <p className="capitalize hover:uppercase">
          {parseFloat(
            row.original.fixed_deposit_transaction_return_amount
          ).toLocaleString()}
        </p>
      ),
    },

    {
      id: "client_account_number",
      header: "Account Number",
      cell: ({ row }) => (
        <Link
          to={`/clients/individual/${row.original.client_id}`}
          className="capitalize hover:uppercase"
        >
          {row.original.account_number}
        </Link>
      ),
    },
    {
      id: "name",
      header: "Client Name",
      cell: ({ row }) => (
        <Link
          to={`/clients/individual/${row.original.client_id}`}
          className="capitalize hover:uppercase"
        >
          {row.original.account_name}
        </Link>
      ),
    },
    {
      accessorKey: "fixed_deposit_transaction_start_date",
      header: "Start Date",
      cell: ({ row }) =>
        formatDateTimestamp(row.original.fixed_deposit_transaction_start_date),
    },
    {
      accessorKey: "fixed_deposit_transaction_end_date",
      header: "End Date",
      cell: ({ row }) =>
        row.original.fixed_deposit_transaction_end_date
          ? formatDateTimestamp(row.original.fixed_deposit_transaction_end_date)
          : <span className="text-muted-foreground text-xs">Open-ended</span>,
    },
    {
      id: "fixed_deposit_transaction_current_balance",
      header: "Balance",
      cell: ({ row }) =>
        row.original.product_type === "unit_trust"
          ? <span className="font-semibold text-green-700">{parseFloat(row.original.fixed_deposit_transaction_current_balance ?? 0).toLocaleString()}</span>
          : <span className="text-muted-foreground text-xs">—</span>,
    },
    {
      id: "fixed_deposit_transaction_status",
      cell: ({ row }) => (
        <Badge className="capitalize">
          {row.original.fixed_deposit_transaction_status}
        </Badge>
      ),
      header: "Status",
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
            <DropdownMenuItem onClick={() => openLog(row.original)}>
              View Accrual Log
            </DropdownMenuItem>
            {row.original.fixed_deposit_transaction_transfer_status === "ongoing" && (
              <>
                {row.original.product_type === "unit_trust" ? (
                  <>
                    <DropdownMenuItem className="text-green-700" onClick={() => openMov(row.original, "deposit")}>
                      Deposit Funds
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-amber-600" onClick={() => openMov(row.original, "withdrawal")}>
                      Withdraw Funds
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleOpenActionDialog(row.original.fixed_deposit_transaction_id, "terminate", row.original.client_account_id, row.original.client_id)}
                    >
                      Close Account
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem onClick={() => handleOpenActionDialog(row.original.fixed_deposit_transaction_id, "complete", row.original.client_account_id, row.original.client_id)}>
                      Complete (Matured)
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-amber-600" onClick={() => handleOpenActionDialog(row.original.fixed_deposit_transaction_id, "early_withdrawal", row.original.client_account_id, row.original.client_id)}>
                      Early Withdrawal
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => handleOpenActionDialog(row.original.fixed_deposit_transaction_id, "terminate", row.original.client_account_id, row.original.client_id)}>
                      Terminate (No Interest)
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={() => onDownload(row.original)}>
              {isDownloading ? "Downloading Please Wait" : "Download Certificate"}
            </DropdownMenuItem>
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
  const onDownload = async (row) => {
    const isUnitTrust = row.product_type === "unit_trust";
    const payload = {
      transaction: {
        code:              row.fixed_deposit_transaction_code,
        start:             row.fixed_deposit_transaction_start_date,
        end:               isUnitTrust ? null : row.fixed_deposit_transaction_end_date,
        account_name:      row.account_name  ?? "",
        account_number:    row.account_number ?? "",
        amount:            row.fixed_deposit_transaction_amount,
        interest:          row.fixed_deposit_setting?.fixed_deposit_setting_interest,
        amount_to_receive: isUnitTrust
          ? row.fixed_deposit_transaction_amount
          : parseFloat(row.fixed_deposit_transaction_amount) + parseFloat(row.fixed_deposit_transaction_return_amount ?? 0),
      },
    };
    try {
      setIsDownloading(true);
      const response = await axiosPrivate.post(
        "/export/certificate/fixed-deposit/pdf",
        { data: payload },
        { responseType: "blob" }
      );
      const filename = isUnitTrust ? "unit-trust-certificate.pdf" : "fixed-deposit-certificate.pdf";
      fileDownload(response.data, filename);
      toast({ title: "Download successful", description: "Certificate saved." });
    } catch {
      toast({ title: "Download failed", variant: "destructive", description: "Could not generate certificate." });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center py-4 space-x-4">
        <Input
          placeholder="Search fixed deposits..."
          value={globalFilter}
          onChange={(event) => {
            setGlobalFilter(event.target.value);
            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
          }}
          className="max-w-sm"
        />

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
      {showActionDialog && (
        <AlertModal
          showDialog={showActionDialog}
          setShowDialog={handleCloseActionDialog}
          title={
            selectedStatus === "early_withdrawal"
              ? "Early Withdrawal — Prorated Interest"
              : selectedStatus === "complete"
              ? "Complete Fixed Deposit"
              : "Terminate — No Interest Returned"
          }
          message={
            selectedStatus === "early_withdrawal"
              ? "The client will receive the principal plus interest prorated to today's date."
              : selectedStatus === "complete"
              ? "The client will receive the full principal and contracted interest."
              : "The client will only receive the original principal. No interest will be paid."
          }
          method={handleTransfer}
          buttonName="Confirm"
        />
      )}
      {showDialog && (
        <AlertModal
          showDialog={showDialog}
          setShowDialog={setShowDialog}
          title="Alert"
          message="This action is not permitted."
          method={() => setShowDialog(false)}
        />
      )}

      <FixedDepositLogModal
        isOpen={logModal.open}
        onClose={closeLog}
        fdId={logModal.fdId}
        fdCode={logModal.fdCode}
      />

      <UnitTrustMovementDialog
        isOpen={movModal.open}
        onClose={closeMov}
        refetch={refetch}
        fdId={movModal.fdId}
        fdCode={movModal.fdCode}
        clientId={movModal.clientId}
        clientAccountId={movModal.clientAccountId}
        currentBalance={movModal.balance}
        movementType={movModal.type}
      />
    </div>
  );
}

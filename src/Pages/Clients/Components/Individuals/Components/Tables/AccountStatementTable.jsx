import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Datatable from "@/Pages/Components/Datatable";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useRef, useCallback } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  formatDateTimestamp,
  getValidDate,
  hasPermission,
  prepareDataForExport,
} from "@/lib/utils";
import ClientStatementQuery from "../Queries/ClientStatementQuery";
import { toast } from "@/hooks/use-toast";
import fileDownload from "js-file-download";
import useAuth from "@/MiddleWares/Hooks/useAuth";
import ReverseStatementTransaction from "../Forms/ReverseStatementTransaction";
import { RotateCcw } from "lucide-react";

const STATUS_CLASS = {
  completed: "bg-green-100 text-green-800 border-green-200",
  reversed:  "bg-gray-100 text-gray-600 border-gray-200",
  pending:   "bg-yellow-100 text-yellow-800 border-yellow-200",
};

const REVERSIBLE_TYPES = new Set([
  "Deposit", "Withdrawal", "Account Charge",
  "Loan Disbursement", "Loan Repayment", "Loan Application Charge",
  "Compulsory Savings (Frozen)",
]);

const isReversible = (row) =>
  REVERSIBLE_TYPES.has(row.transaction_type) && row.status !== "reversed";

const AccountStatementTable = () => {
  const { client_id: clientAccountId } = useParams();
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const tableRef = useRef(null);

  const [filters, setFilters]           = useState({ startDate: "", endDate: "" });
  const [reverseModal, setReverseModal] = useState(null);
  const [selectedCount, setSelectedCount] = useState(0);
  const { auth } = useAuth();
  const roles = auth?.roles;

  const { data = [], isLoading, refetch, isRefetching, isError } = useQuery({
    queryKey: ["transactions", clientAccountId, filters],
    queryFn: async () => {
      const controller = new AbortController();
      try {
        const response = await axiosPrivate.get(`/clients/accounts/statement/${clientAccountId}`, {
          signal: controller.signal,
          params: { startDate: filters.startDate, endDate: filters.endDate },
        });
        return response?.data?.data ?? [];
      } catch (error) {
        if (error?.response?.status === 401) navigate("/", { state: { from: location }, replace: true });
        throw error;
      }
    },
    keepPreviousData: true,
  });

  const handleFilterChange = (d) => { setFilters(d); refetch(); };

  const canReverse = hasPermission(roles, 100041);

  const getSelectedReversibleIds = useCallback(() => {
    const table = tableRef.current;
    if (!table) return [];
    return table.getSelectedRowModel().rows
      .filter((r) => isReversible(r.original))
      .map((r) => r.original.statement_id);
  }, []);

  const handleBulkReverse = useCallback(() => {
    const ids = getSelectedReversibleIds();
    if (ids.length === 0) return;
    setReverseModal({ mode: "bulk", transactionIds: ids });
  }, [getSelectedReversibleIds]);

  const handleCloseModal = useCallback(() => {
    setReverseModal(null);
    // clear selection after reversal
    tableRef.current?.resetRowSelection?.();
    setSelectedCount(0);
  }, []);

  const columns = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => {
            table.toggleAllPageRowsSelected(!!value);
            // count update is handled in cell re-renders via row.getIsSelected()
            setTimeout(() => setSelectedCount(table.getSelectedRowModel().rows.length), 0);
          }}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => {
        const reversible = isReversible(row.original);
        if (!reversible) return null;
        return (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => {
              row.toggleSelected(!!value);
              setTimeout(() => setSelectedCount(tableRef.current?.getSelectedRowModel().rows.length ?? 0), 0);
            }}
            aria-label="Select row"
          />
        );
      },
    },
    {
      accessorKey: "transaction_code",
      header: "Code",
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.transaction_code}</span>,
    },
    {
      accessorKey: "transaction_type",
      header: "Type",
      cell: ({ row }) => <span className="capitalize text-sm">{row.original.transaction_type}</span>,
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => <span className="text-xs text-muted-foreground max-w-xs truncate block">{row.original.description}</span>,
    },
    {
      accessorKey: "debit_amount",
      header: "Debit",
      cell: ({ row }) =>
        row.original.debit_credit === "Debit" ? (
          <span className="font-mono text-red-600">{parseFloat(row.original.amount).toLocaleString()}</span>
        ) : "—",
    },
    {
      accessorKey: "credit_amount",
      header: "Credit",
      cell: ({ row }) =>
        row.original.debit_credit === "Credit" ? (
          <span className="font-mono text-emerald-600">{parseFloat(row.original.amount).toLocaleString()}</span>
        ) : "—",
    },
    {
      accessorKey: "running_balance",
      header: "Balance",
      cell: ({ row }) => (
        <span className="font-mono font-medium">{parseFloat(row.original.running_balance).toLocaleString()}</span>
      ),
    },
    {
      accessorKey: "transaction_date",
      header: "Date",
      cell: ({ row }) => <span className="text-xs whitespace-nowrap">{formatDateTimestamp(row.original.transaction_date)}</span>,
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const s = row.original.status ?? "completed";
        return (
          <Badge className={`capitalize text-xs border ${STATUS_CLASS[s] ?? "bg-muted text-muted-foreground"}`}>
            {s}
          </Badge>
        );
      },
    },
    ...(canReverse ? [{
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        if (row.original.status === "reversed") return null;
        const reversible = isReversible(row.original);
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">...</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {reversible ? (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive text-xs"
                  onClick={() => setReverseModal({ mode: "single", transactionId: row.original.statement_id })}
                >
                  <RotateCcw className="w-3 h-3 mr-1.5" /> Reverse
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem disabled className="text-muted-foreground text-xs">
                  Cannot reverse
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    }] : []),
  ];

  const [isDownloading, setIsDownloading] = useState(false);

  const onDownload = async (type) => {
    if (!tableRef.current) {
      toast({ title: "Table not ready", variant: "destructive" });
      return;
    }
    const exportData = prepareDataForExport(tableRef.current, data);
    const dataDownload = {
      transactions: exportData,
      clientData: { client_account_id: clientAccountId },
      dates: {
        start_date: formatDateTimestamp(getValidDate(filters.startDate, auth?.fiscalYear?.start_date)),
        end_date:   formatDateTimestamp(getValidDate(filters.endDate, new Date())),
      },
    };
    try {
      setIsDownloading(true);
      const response = await axiosPrivate.post(
        type === "pdf" ? "/export/account-statement/pdf" : "/export/account-statement/excel",
        { data: dataDownload },
        { responseType: "blob" }
      );
      const ext = type === "pdf" ? "pdf" : "xlsx";
      fileDownload(response.data, `Account-Statement-${Math.round(+new Date() / 1000)}.${ext}`);
      toast({ title: "Download successful", variant: "success" });
    } catch {
      toast({ title: "Download failed", variant: "destructive" });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters + exports */}
      <div className="flex flex-wrap items-center gap-2">
        {hasPermission(roles, 100050) && (
          <ClientStatementQuery onFilterChange={handleFilterChange} isRefetching={isRefetching} refetch={refetch} />
        )}
        {hasPermission(roles, 100157) && (
          <>
            <Button size="sm" variant="outline" onClick={() => onDownload("pdf")} disabled={isDownloading}>Export PDF</Button>
            <Button size="sm" variant="outline" onClick={() => onDownload("xlsx")} disabled={isDownloading}>Export Excel</Button>
          </>
        )}
      </div>

      {/* Bulk action bar */}
      {canReverse && selectedCount > 0 && (
        <div className="flex items-center gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-2">
          <span className="text-sm font-medium text-destructive">
            {selectedCount} transaction{selectedCount !== 1 ? "s" : ""} selected
          </span>
          <Button size="sm" variant="destructive" className="h-7" onClick={handleBulkReverse}>
            <RotateCcw className="w-3 h-3 mr-1.5" /> Reverse Selected
          </Button>
          <Button
            size="sm" variant="outline" className="h-7"
            onClick={() => { tableRef.current?.resetRowSelection?.(); setSelectedCount(0); }}
          >
            Clear
          </Button>
        </div>
      )}

      <Datatable
        ref={tableRef}
        columns={columns}
        data={data}
        fetchData={refetch}
        isLoading={isLoading}
        isRefetching={isRefetching}
        isError={isError}
        colSpan={5}
      />

      {reverseModal && (
        <ReverseStatementTransaction
          isOpen
          onClose={handleCloseModal}
          refetch={refetch}
          mode={reverseModal.mode}
          transactionId={reverseModal.transactionId}
          transactionIds={reverseModal.transactionIds}
        />
      )}
    </div>
  );
};

export default AccountStatementTable;

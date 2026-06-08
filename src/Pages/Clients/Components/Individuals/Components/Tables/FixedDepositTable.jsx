import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Datatable from "@/Pages/Components/Datatable";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import FixedDepositDialog from "../Forms/FixedDepositDialog";
import { useState } from "react";
import AlertModal from "@/components/AlertModal";
import { formatDateTimestamp, hasPermission } from "@/lib/utils";
import useAuth from "@/MiddleWares/Hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import fileDownload from "js-file-download";
import { FixedDepositLogModal } from "@/Pages/Accounting/Components/FixedDepositLogModal";
import { UnitTrustMovementDialog } from "@/Pages/Accounting/Components/UnitTrustMovementDialog";

const FixedDepositTable = () => {
  const { client_id: clientAccountId, id: clientId } = useParams();
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const { auth } = useAuth();
  const roles = auth?.roles;

  const [selectedId, setSelectedId]         = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [showDialog, setShowDialog]         = useState(false);
  const [isDownloading, setIsDownloading]   = useState(false);
  const [isModalOpen, setIsModalOpen]       = useState(false);

  const [logModal, setLogModal] = useState({ open: false, fdId: null, fdCode: "" });
  const [movModal, setMovModal] = useState({ open: false, fdId: null, fdCode: "", type: "deposit", balance: 0 });

  const openLog  = (row) => setLogModal({ open: true, fdId: row.fixed_deposit_transaction_id, fdCode: row.fixed_deposit_transaction_code });
  const closeLog = () => setLogModal({ open: false, fdId: null, fdCode: "" });

  const openMov  = (row, type) => setMovModal({
    open: true,
    fdId:    row.fixed_deposit_transaction_id,
    fdCode:  row.fixed_deposit_transaction_code,
    type,
    balance: row.fixed_deposit_transaction_current_balance ?? 0,
  });
  const closeMov = () => setMovModal((s) => ({ ...s, open: false }));

  const handleOpenActionDialog = (id, status) => {
    setSelectedId(id);
    setSelectedStatus(status);
    setShowDialog(true);
  };
  const handleCloseActionDialog = () => {
    setSelectedId(null);
    setSelectedStatus(null);
    setShowDialog(false);
  };

  const { data = [], isLoading, refetch, isRefetching, isError } = useQuery({
    queryKey: ["fixedDeposits", clientAccountId],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get(`/accounting/fixed/deposits/${clientAccountId}`);
        return res?.data?.data?.fixed_deposits ?? [];
      } catch (error) {
        if (error?.response?.status === 401) navigate("/", { state: { from: location }, replace: true });
        throw error;
      }
    },
    keepPreviousData: true,
  });

  const onDownload = async (row) => {
    const isUnitTrust = row.product_type === "unit_trust";
    const payload = {
      transaction: {
        code:             row.fixed_deposit_transaction_code,
        start:            row.fixed_deposit_transaction_start_date,
        end:              isUnitTrust ? null : row.fixed_deposit_transaction_end_date,
        account_name:     row.account_name  ?? "",
        account_number:   row.account_number ?? "",
        amount:           row.fixed_deposit_transaction_amount,
        interest:         row.fixed_deposit_setting?.fixed_deposit_setting_interest,
        amount_to_receive: isUnitTrust
          ? row.fixed_deposit_transaction_amount
          : parseFloat(row.fixed_deposit_transaction_amount) + parseFloat(row.fixed_deposit_transaction_return_amount ?? 0),
      },
    };
    try {
      setIsDownloading(true);
      const res = await axiosPrivate.post(
        "/export/certificate/fixed-deposit/pdf",
        { data: payload },
        { responseType: "blob" }
      );
      fileDownload(res.data, isUnitTrust ? "unit-trust-certificate.pdf" : "fixed-deposit-certificate.pdf");
      toast({ title: "Download successful", description: "Certificate saved." });
    } catch {
      toast({ title: "Download failed", variant: "destructive", description: "Could not generate certificate." });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleTransfer = async () => {
    try {
      await axiosPrivate.put("accounting/fixed/deposits", {
        status:            selectedStatus,
        transaction_id:    selectedId,
        client_account_id: clientAccountId,
        client_id:         clientId,
      });
      toast({ title: "Success", description: "Fixed deposit updated." });
      refetch();
    } catch (error) {
      toast({ title: "Error", variant: "destructive", description: error?.response?.data?.messages || "No server response" });
    } finally {
      handleCloseActionDialog();
    }
  };

  const columns = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox checked={row.getIsSelected()} onCheckedChange={(v) => row.toggleSelected(!!v)} aria-label="Select row" />
      ),
    },
    {
      accessorKey: "fixed_deposit_transaction_code",
      header: "Code",
      cell: ({ row }) => <p className="font-mono text-xs">{row.original.fixed_deposit_transaction_code}</p>,
    },
    {
      accessorKey: "fixed_deposit_setting.fixed_deposit_setting_title",
      header: "Product",
      cell: ({ row }) => (
        <div className="space-y-1">
          <p className="text-sm">{row.original.fixed_deposit_setting?.fixed_deposit_setting_title}</p>
          {row.original.product_type === "unit_trust"
            ? <Badge variant="outline" className="text-purple-700 border-purple-300 text-xs">Unit Trust</Badge>
            : <Badge variant="outline" className="text-blue-700 border-blue-300 text-xs">Term Deposit</Badge>
          }
        </div>
      ),
    },
    {
      accessorKey: "fixed_deposit_transaction_amount",
      header: "Principal",
      cell: ({ row }) => (
        <p>{parseFloat(row.original.fixed_deposit_transaction_amount).toLocaleString()}</p>
      ),
    },
    {
      id: "balance_or_interest",
      header: "Balance / Interest",
      cell: ({ row }) =>
        row.original.product_type === "unit_trust"
          ? <span className="font-semibold text-green-700">{parseFloat(row.original.fixed_deposit_transaction_current_balance ?? 0).toLocaleString()}</span>
          : <span className="text-muted-foreground">{parseFloat(row.original.fixed_deposit_transaction_return_amount ?? 0).toLocaleString()}</span>,
    },
    {
      accessorKey: "fixed_deposit_transaction_start_date",
      header: "Start Date",
      cell: ({ row }) => formatDateTimestamp(row.original.fixed_deposit_transaction_start_date),
    },
    {
      accessorKey: "fixed_deposit_transaction_end_date",
      header: "End Date",
      cell: ({ row }) =>
        row.original.fixed_deposit_transaction_end_date
          ? formatDateTimestamp(row.original.fixed_deposit_transaction_end_date)
          : <span className="text-muted-foreground text-xs italic">Open-ended</span>,
    },
    {
      accessorKey: "fixed_deposit_transaction_status",
      header: "Status",
      cell: ({ row }) => <Badge className="capitalize">{row.original.fixed_deposit_transaction_status}</Badge>,
    },
    {
      accessorKey: "fixed_deposit_transaction_transfer_status",
      header: "Transfer Status",
      cell: ({ row }) => <Badge className="capitalize">{row.original.fixed_deposit_transaction_transfer_status}</Badge>,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">...</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => openLog(row.original)}>
              View Accrual Log
            </DropdownMenuItem>

            {hasPermission(roles, 100053) && row.original.fixed_deposit_transaction_transfer_status === "ongoing" && (
              <>
                {row.original.product_type === "unit_trust" ? (
                  <>
                    <DropdownMenuItem onClick={() => openMov(row.original, "deposit")} className="text-green-700">
                      Deposit Funds
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openMov(row.original, "withdrawal")} className="text-amber-600">
                      Withdraw Funds
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleOpenActionDialog(row.original.fixed_deposit_transaction_id, "terminate")} className="text-destructive">
                      Close Account
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem onClick={() => handleOpenActionDialog(row.original.fixed_deposit_transaction_id, "complete")}>
                      Complete (Matured)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleOpenActionDialog(row.original.fixed_deposit_transaction_id, "early_withdrawal")} className="text-amber-600">
                      Early Withdrawal
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleOpenActionDialog(row.original.fixed_deposit_transaction_id, "terminate")} className="text-destructive">
                      Terminate (No Interest)
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
              </>
            )}

            {/* Certificate always available regardless of status */}
            <DropdownMenuItem onClick={() => onDownload(row.original)} disabled={isDownloading}>
              {isDownloading ? "Downloading…" : "Download Certificate"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Datatable
        columns={columns}
        data={data}
        fetchData={refetch}
        isLoading={isLoading}
        isRefetching={isRefetching}
        isError={isError}
        colSpan={5}
        buttonTitle={hasPermission(roles, 100051) ? "+ Add Fixed Deposit" : ""}
        buttonMethod={hasPermission(roles, 100051) ? () => setIsModalOpen(true) : ""}
      />

      {isModalOpen && hasPermission(roles, 100051) && (
        <FixedDepositDialog isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} refetch={refetch} />
      )}

      <AlertModal
        showDialog={showDialog}
        setShowDialog={handleCloseActionDialog}
        title={
          selectedStatus === "early_withdrawal" ? "Early Withdrawal — Prorated Interest"
          : selectedStatus === "complete"       ? "Complete Fixed Deposit"
          :                                       "Terminate — No Interest Returned"
        }
        message={
          selectedStatus === "early_withdrawal" ? "The client will receive the principal plus interest prorated to today's date."
          : selectedStatus === "complete"       ? "The client will receive the full principal and contracted interest."
          :                                       "The client will only receive the original principal. No interest will be paid."
        }
        method={handleTransfer}
        buttonName="Confirm"
        selectedId={selectedId}
      />

      <FixedDepositLogModal isOpen={logModal.open} onClose={closeLog} fdId={logModal.fdId} fdCode={logModal.fdCode} />

      <UnitTrustMovementDialog
        isOpen={movModal.open}
        onClose={closeMov}
        refetch={refetch}
        fdId={movModal.fdId}
        fdCode={movModal.fdCode}
        clientId={clientId}
        clientAccountId={clientAccountId}
        currentBalance={movModal.balance}
        movementType={movModal.type}
      />
    </div>
  );
};

export default FixedDepositTable;

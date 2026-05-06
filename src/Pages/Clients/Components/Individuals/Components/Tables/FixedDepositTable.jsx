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
  const { client_id: clientAccountId, id: clientId } = useParams(); // ✅ Get client_account_id from URL
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [showDialog, setShowDialog] = useState(false);

  const [logModal, setLogModal]   = useState({ open: false, fdId: null, fdCode: "" });
  const [movModal, setMovModal]   = useState({ open: false, fdId: null, fdCode: "", type: "deposit", balance: 0 });

  const openLog = (row) => setLogModal({ open: true, fdId: row.fixed_deposit_transaction_id, fdCode: row.fixed_deposit_transaction_code });
  const closeLog = () => setLogModal({ open: false, fdId: null, fdCode: "" });

  const openMov = (row, type) => setMovModal({
    open: true,
    fdId:    row.fixed_deposit_transaction_id,
    fdCode:  row.fixed_deposit_transaction_code,
    type,
    balance: row.fixed_deposit_transaction_current_balance ?? 0,
  });
  const closeMov = () => setMovModal((s) => ({ ...s, open: false }));
  const { auth } = useAuth();
  const roles = auth?.roles;

  const handleOpenDeleteDialog = (id, status, accountId) => {
    setSelectedId(id);
    setSelectedStatus(status);
    setSelectedAccountId(accountId ?? clientAccountId);
    setShowDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setSelectedId(null);
    setSelectedStatus(null);
    setShowDialog(false);
  };
  // ✅ Fetch Fixed Deposit Transactions
  const {
    data = [],
    isLoading,
    refetch,
    isRefetching,
    isError,
  } = useQuery({
    queryKey: ["fixedDeposits", clientAccountId],
    queryFn: async () => {
      const controller = new AbortController();

      const fetchURL = `/accounting/fixed/deposits/${clientAccountId}`;
      try {
        const response = await axiosPrivate.get(fetchURL, {
          signal: controller.signal,
        });
        return response?.data?.data?.fixed_deposits ?? [];
      } catch (error) {
        if (error?.response?.status === 401) {
          navigate("/", { state: { from: location }, replace: true });
        }
        throw error;
      }
    },
    keepPreviousData: true,
  });

  const columns = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
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
      accessorKey: "fixed_deposit_transaction_code",
      header: "Transaction Code",
      cell: ({ row }) => <p>{row.original.fixed_deposit_transaction_code}</p>,
    },
    {
      accessorKey: "fixed_deposit_setting.fixed_deposit_setting_title",
      header: "Deposit Product",
      cell: ({ row }) => (
        <p>{row.original.fixed_deposit_setting.fixed_deposit_setting_title}</p>
      ),
    },
    {
      accessorKey: "fixed_deposit_transaction_amount",
      header: "Deposit Amount",
      cell: ({ row }) => (
        <p>
          {parseFloat(
            row.original.fixed_deposit_transaction_amount
          ).toLocaleString()}
        </p>
      ),
    },
    {
      accessorKey: "fixed_deposit_transaction_return_amount",
      header: "Return Interest",
      cell: ({ row }) => (
        <p>
          {parseFloat(
            row.original.fixed_deposit_transaction_return_amount
          ).toLocaleString()}
        </p>
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
        formatDateTimestamp(row.original.fixed_deposit_transaction_end_date),
    },
    {
      accessorKey: "fixed_deposit_transaction_status",
      header: "Status",
      cell: ({ row }) => (
        <Badge className={"capitalize"}>
          {row.original.fixed_deposit_transaction_status}
        </Badge>
      ),
    },
    {
      accessorKey: "fixed_deposit_transaction_transfer_status",
      header: "Transfer Status",
      cell: ({ row }) => (
        <Badge className={"capitalize"}>
          {row.original.fixed_deposit_transaction_transfer_status}
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
              ...
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => openLog(row.original)}>
              View Accrual Log
            </DropdownMenuItem>
            {hasPermission(roles, 100053) && (
              <>
                {row.original.fixed_deposit_transaction_transfer_status === "ongoing" && (
                  <>
                    {row.original.product_type === "unit_trust" ? (
                      <>
                        <DropdownMenuItem onClick={() => openMov(row.original, "deposit")} className="text-green-700">
                          Deposit Funds
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openMov(row.original, "withdrawal")} className="text-amber-600">
                          Withdraw Funds
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleOpenDeleteDialog(row.original.fixed_deposit_transaction_id, "terminate")}
                          className="text-destructive"
                        >
                          Close Account
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <>
                        <DropdownMenuItem onClick={() => handleOpenDeleteDialog(row.original.fixed_deposit_transaction_id, "complete")}>
                          Complete (Matured)
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleOpenDeleteDialog(row.original.fixed_deposit_transaction_id, "early_withdrawal")}
                          className="text-amber-600"
                        >
                          Early Withdrawal
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleOpenDeleteDialog(row.original.fixed_deposit_transaction_id, "terminate")}
                          className="text-destructive"
                        >
                          Terminate (No Interest)
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuItem onClick={() => onDownload(row.original)}>
                      {isDownloading ? "Downloading…" : "Download Certificate"}
                    </DropdownMenuItem>
                  </>
                )}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
const [isDownloading, setIsDownloading] = useState(false);
  const onDownload = async (data) => {
    const controller = new AbortController();
    const dataDownload = {
      transaction: {
        code: data?.fixed_deposit_transaction_code,
        start: data?.fixed_deposit_transaction_start_date,
        account_name: data?.account_name,
        account_number: data?.account_number,
        amount: data?.fixed_deposit_transaction_amount,
        interest: data?.fixed_deposit_setting?.fixed_deposit_setting_interest,
        end: data?.fixed_deposit_transaction_end_date,
        amount_to_receive:
          parseFloat(data?.fixed_deposit_transaction_amount) +
          parseFloat(data?.fixed_deposit_transaction_return_amount),
      },
    };    
    try {
      setIsDownloading(true);
      let response;

      response = await axiosPrivate.post(
        `/export/certificate/fixed-deposit/pdf`, // <-- Your endpoint
        { data: dataDownload },
        {
          responseType: "blob",
          signal: controller.signal,
        }
      );

      const downloadTitle = `Fixed-Deposit-Certificate.pdf`;

      fileDownload(response.data, downloadTitle);

      toast({
        title: `Download successful`,
        variant: "success",
        description: `Your file has been downloaded.`,
      });
      setIsDownloading(false);
    } catch (error) {
      console.log(error);
      toast({
        title: "Uh oh! Something went wrong.",
        variant: "destructive",
        description: "Failed to download file.",
      });
      setIsDownloading(false);
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);
  const handleTransfer = async () => {
    const controller = new AbortController();
    try {
      const data = {
        status: selectedStatus,
        transaction_id: selectedId,
        client_account_id: clientAccountId,
        client_id: clientId,
      };
      const response = await axiosPrivate.put(
        `accounting/fixed/deposits`,
        data,
        { signal: controller.signal }
      );
      toast({
        title: "Success",
        description: response.data.messages,
      });
      refetch();
    } catch (error) {
      const errorMessage =
        error?.response?.data?.messages || "No server response";
      toast({
        title: "Uh oh! Something went wrong.",
        variant: "destructive",
        description: errorMessage,
      });
    }
  };
  return (
    <div className="space-y-4">
      {/* ✅ Transaction Table */}
      <Datatable
        columns={columns}
        data={data}
        fetchData={refetch}
        isLoading={isLoading}
        isRefetching={isRefetching}
        isError={isError}
        colSpan={5}
        buttonTitle={hasPermission(roles, 100051) ? "+ Add Fixed Deposit" : ""}
        buttonMethod={hasPermission(roles, 100051) ? handleOpenModal : ""}
      />
      {isModalOpen && hasPermission(roles, 100051) && (
        <FixedDepositDialog
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          refetch={refetch}
        />
      )}

      <AlertModal
        showDialog={showDialog}
        setShowDialog={handleCloseDeleteDialog}
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
        buttonName="Ok"
        selectedId={selectedId}
      />

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
        clientId={clientId}
        clientAccountId={clientAccountId}
        currentBalance={movModal.balance}
        movementType={movModal.type}
      />
    </div>
  );
};

export default FixedDepositTable;

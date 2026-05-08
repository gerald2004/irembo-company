import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { Button } from "@/components/ui/button";
import Datatable from "@/Pages/Components/Datatable";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import AddClientAccount from "../Forms/AddClientAccount";
import { useState } from "react";
import DepositTransactionDialog from "../Forms/DepositTransactionDialog";
import WithdrawTransactionDialog from "../Forms/WithdrawTransactionDialog";
import TransferTransactionDialog from "../Forms/TransferTransactionDialog";
import AccountChargeDialog from "../Forms/AccountChargeDialog";
import { formatDateTimestamp, hasPermission } from "@/lib/utils";
import useAuth from "@/MiddleWares/Hooks/useAuth";
import InvoicePOS from "@/Pages/Components/InvoicePOS";
export function AccountsTable() {
  const navigate = useNavigate();
  const axiosPrivate = useAxiosPrivate();
  const params = useParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);
  const [accountId, setAccountId] = useState([]);
  const [isModalDepositOpen, setIsModalDepositOpen] = useState(false);
  const [isModalWithdrawOpen, setIsModalWithdrawOpen] = useState(false);
  const [isModalTransferOpen, setIsModalTransferOpen] = useState(false);
  const [isModalChargeOpen, setIsModalChargeOpen] = useState(false);
  const handleOpenModalDeposit = (id) => {
    setIsModalDepositOpen(true);
    setAccountId(id);
  };
  const handleCloseModalDeposit = () => {
    setIsModalDepositOpen(false);
    setAccountId([]);
  };
  const handleOpenModalWithdraw = (id) => {
    setIsModalWithdrawOpen(true);
    setAccountId(id);
  };
  const handleCloseModalWithdraw = () => {
    setIsModalWithdrawOpen(false);
    setAccountId([]);
  };

  const handleOpenModalTransfer = (id) => {
    setIsModalTransferOpen(true);
    setAccountId(id);
  };
  const handleCloseModalTransfer = () => {
    setIsModalTransferOpen(false);
    setAccountId([]);
  };

  const handleOpenModalCharge = (id) => {
    setIsModalChargeOpen(true);
    setAccountId(id);
  };
  const handleCloseModalCharge = () => {
    setIsModalChargeOpen(false);
    setAccountId([]);
  };
  const { auth } = useAuth();
  const roles = auth?.roles;
  const {
    data = [],
    isLoading,
    refetch,
    isRefetching,
    isError,
  } = useQuery({
    queryKey: ["accounts", params.clientid],
    queryFn: async () => {
      const controller = new AbortController();

      const fetchURL = `/accounts/attached/accounts/${params.id}`;
      try {
        const response = await axiosPrivate.get(fetchURL, {
          signal: controller.signal,
        });
        return response?.data?.data?.accounts ?? [];
      } catch (error) {
        if (error?.response?.status === 401) {
          navigate("/", { state: { from: location }, replace: true });
        }
        throw error;
      }
    },
    keepPreviousData: true,
  });

  const toggleAccountStatus = async (accountId, currentStatus) => {
    const controller = new AbortController();

    try {
      await axiosPrivate.patch(
        `/accounts/attached/${accountId}/accounts`,
        {
          client_account_status:
            currentStatus === "active" ? "inactive" : "active",
        },
        { signal: controller.signal }
      );
      refetch();
    } catch (error) {
      console.error("Error updating account status", error);
    }
  };

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
      accessorKey: "product_title",
      header: "Product Title",
      cell: ({ row }) => (
        <Link
          className="hover:uppercase"
          to={
            hasPermission(roles, 100155)
              ? `/clients/individuals/${params.id}/accounts/${row.original.client_account_id}`
              : ""
          }
        >
          {row.original.product_title}
        </Link>
      ),
    },
    hasPermission(roles, 100154) && {
      accessorKey: "actual_balance",
      header: "Actual Balance",
      cell: ({ row }) => (
        <p>{parseFloat(row.original.actual_balance).toLocaleString()}</p>
      ),
    },
    hasPermission(roles, 100154) && {
      accessorKey: "available_balance",
      header: "Avaliable Balance",
      cell: ({ row }) => (
        <p>{parseFloat(row.original.available_balance).toLocaleString()}</p>
      ),
    },
    hasPermission(roles, 100154) && {
      accessorKey: "client_account_frozen_balance",
      header: "Frozen Balance",
      cell: ({ row }) => (
        <p>
          {parseFloat(
            row.original.client_account_frozen_balance
          ).toLocaleString()}
        </p>
      ),
    },
    hasPermission(roles, 100154) && {
      accessorKey: "client_account_fixed_amount",
      header: "Fixed Balance",
      cell: ({ row }) => (
        <p>
          {parseFloat(
            row.original.client_account_fixed_amount
          ).toLocaleString()}
        </p>
      ),
    },
    {
      accessorKey: "client_account_status",
      header: "Status",
      cell: ({ row }) => (
        <Switch
          checked={row.original.client_account_status === "active"}
          onCheckedChange={() =>
            toggleAccountStatus(
              row.original.client_account_id,
              row.original.client_account_status
            )
          }
        />
      ),
    },
    {
      accessorKey: "client_timestamp",
      header: "Created At",
      cell: ({ row }) => formatDateTimestamp(row.original.client_timestamp),
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
            {hasPermission(roles, 100155) && (
              <DropdownMenuItem>
                <Link
                  to={`/clients/individuals/${params.id}/accounts/${row.original.client_account_id}`}
                >
                  View
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            {hasPermission(roles, 100039) && (
              <DropdownMenuItem
                onClick={() =>
                  handleOpenModalDeposit(row.original.client_account_id)
                }
              >
                Deposit
              </DropdownMenuItem>
            )}
            {hasPermission(roles, 100042) && (
              <DropdownMenuItem
                onClick={() =>
                  handleOpenModalWithdraw(row.original.client_account_id)
                }
              >
                Withdraw
              </DropdownMenuItem>
            )}
            {hasPermission(roles, 100045) && (
              <DropdownMenuItem
                onClick={() =>
                  handleOpenModalTransfer(row.original.client_account_id)
                }
              >
                Transfer
              </DropdownMenuItem>
            )}
            {hasPermission(roles, 100048) && (
              <DropdownMenuItem
                onClick={() =>
                  handleOpenModalCharge(row.original.client_account_id)
                }
              >
                Account Charge
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ].filter(Boolean);
  
  const {auth:{user} } = useAuth();
  const [receiptData, setReceiptData] = useState([]);
  const [openReceiptDialog, setOpenReceiptDialog] = useState(false);
  
  const handleOpenReceiptDialog = (data, type) => {
    const clientFirstname = data?.client?.client_firstname ?? "";
    const clientLastname  = data?.client?.client_lastname  ?? "";
    const clientName      = [clientFirstname, clientLastname].filter(Boolean).join(" ") || null;

    const tellerFirstname = data?.user?.user_firstname ?? "";
    const tellerLastname  = data?.user?.user_lastname  ?? "";
    const tellerName      = [tellerFirstname, tellerLastname].filter(Boolean).join(" ") || null;

    const loadedData = {
      sacco: {
        name:       user?.sacco_name,
        address:    user?.sacco_address,
        email:      user?.sacco_email,
        contact:    user?.sacco_contact,
        branchName: user?.branch_name,
      },
      client: {
        accountNumber: data?.clientAccount?.client_account_number ?? data?.client?.client_account_number ?? null,
        accountName:   clientName,
      },
      transaction: {
        amount:        type === "savings" ? data?.deposit_transaction_amount  : data?.withdraw_transaction_amount,
        timestamp:     type === "savings" ? data?.deposit_transaction_timestamp : data?.withdraw_transaction_timestamp,
        notes:         type === "savings" ? data?.deposit_transaction_notes   : data?.withdraw_transaction_notes,
        notary:        type === "savings" ? data?.deposit_transaction_notary  : data?.withdraw_transaction_notary,
        transactionId: type === "savings" ? data?.deposit_transaction_code    : data?.withdraw_transaction_code,
        user:          tellerName,
      },
      title: type === "savings" ? "Savings Receipt" : type === "withdraws" ? "Withdrawal Receipt" : "Receipt",
    };
    setReceiptData(loadedData);
    setOpenReceiptDialog(true);
  }
  const handleCloseReceiptDialog = () => {
    setReceiptData([]);
    setOpenReceiptDialog(false);
  }
  return (
    <>
      {hasPermission(roles, 100033) && (
        <Datatable
          columns={columns}
          data={data}
          fetchData={refetch}
          isLoading={isLoading}
          isRefetching={isRefetching}
          isError={isError}
          buttonTitle={hasPermission(roles, 100034) ? "+ Add Account" : ""}
          buttonMethod={hasPermission(roles, 100034) ? handleOpenModal : ""}
        />
      )}
      {isModalOpen && hasPermission(roles, 100034) && (
        <AddClientAccount
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          refetch={refetch}
        />
      )}
      {isModalDepositOpen && hasPermission(roles, 100039) && (
        <DepositTransactionDialog
          isOpen={isModalDepositOpen}
          onClose={handleCloseModalDeposit}
          refetch={refetch}
          accountId={accountId}
          handleOpenReceiptDialog={handleOpenReceiptDialog}
        />
      )}
      {isModalWithdrawOpen && hasPermission(roles, 100042) && (
        <WithdrawTransactionDialog
          isOpen={isModalWithdrawOpen}
          onClose={handleCloseModalWithdraw}
          refetch={refetch}
          accountId={accountId}
          handleOpenReceiptDialog={handleOpenReceiptDialog}
        />
      )}
      {isModalTransferOpen && hasPermission(roles, 100045) && (
        <TransferTransactionDialog
          isOpen={isModalTransferOpen}
          onClose={handleCloseModalTransfer}
          refetch={refetch}
          accountId={accountId}
        />
      )}
      {isModalChargeOpen && hasPermission(roles, 100048) && (
        <AccountChargeDialog
          isOpen={isModalChargeOpen}
          onClose={handleCloseModalCharge}
          refetch={refetch}
          accountId={accountId}
        />
      )}
      {openReceiptDialog && receiptData && (
        <InvoicePOS
          data={receiptData}
          onClose={handleCloseReceiptDialog}
          isOpen={openReceiptDialog}
        />
      )}
    </>
  );
}

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
const FixedDepositTable = () => {
  const { client_id: clientAccountId } = useParams(); // ✅ Get client_account_id from URL
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState(null);

  const [showDialog, setShowDialog] = useState(false);
  const { auth } = useAuth();
  const roles = auth?.roles;

  const handleOpenDeleteDialog = (id) => {
    setSelectedId(id);
    setShowDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setSelectedId(null);
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
      header: "Return Amount",
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
            {hasPermission(roles, 100053) && (
              <>
                <DropdownMenuItem
                  onClick={() => {
                    handleOpenDeleteDialog(row.original.id);
                  }}
                >
                  Complete
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    handleOpenDeleteDialog(row.original.id);
                  }}
                >
                  Terminate
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    handleOpenDeleteDialog(row.original.id);
                  }}
                >
                  Download Certificate
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

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
      {isModalOpen &&
        hasPermission(
          roles,
          100051
        ) && (
          <FixedDepositDialog
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            refetch={refetch}
          />
        )}

      <AlertModal
        showDialog={showDialog}
        setShowDialog={handleCloseDeleteDialog}
        title="Are you sure?"
        message="Do you want to perform this action?"
        method={""}
        buttonName="Ok"
        selectedId={selectedId}
      />
    </div>
  );
};

export default FixedDepositTable;

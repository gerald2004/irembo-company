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
import { useState } from "react";
import AlertModal from "@/components/AlertModal";
import FreezeTransactionDialog from "../Forms/FreezeTransactionDialog";
import { toast } from "@/hooks/use-toast";
import { formatDateTimestamp, hasPermission } from "@/lib/utils";
import useAuth from "@/MiddleWares/Hooks/useAuth";
const FrozenBalanceTable = () => {
  const { client_id: clientAccountId } = useParams(); // ✅ Get client_account_id from URL
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState(null);
  const [showDialog, setShowDialog] = useState(false);

  const handleOpenUpdateDialog = (id) => {
    setSelectedId(id);
    setShowDialog(true);
  };

  const handleCloseUpdateDialog = () => {
    setSelectedId(null);
    setShowDialog(false);
  };

  const [openModal, setOpenModal] = useState(false);

  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => setOpenModal(false);
  const {
    auth: { roles },
  } = useAuth();
  // ✅ Fetch Frozen Transactions
  const {
    data = [],
    isLoading,
    refetch,
    isRefetching,
    isError,
  } = useQuery({
    queryKey: ["frozenBalances", clientAccountId],
    queryFn: async () => {
      const controller = new AbortController();

      const fetchURL = `/accounting/frozen/balance/${clientAccountId}`;
      try {
        const response = await axiosPrivate.get(fetchURL, {
          signal: controller.signal,
        });
        return response?.data?.data?.frozen_transactions ?? [];
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
      accessorKey: "transfer_code",
      header: "Transaction Code",
      cell: ({ row }) => <p>{row.original.transfer_code}</p>,
    },
    {
      accessorKey: "transfer_amount",
      header: "Amount",
      cell: ({ row }) => (
        <p>{parseFloat(row.original.transfer_amount).toLocaleString()}</p>
      ),
    },
    {
      accessorKey: "transfer_type",
      header: "Type",
      cell: ({ row }) => (
        <p className="capitalize">{row.original.transfer_type}</p>
      ),
    },
    {
      accessorKey: "transfer_status",
      header: "Status",
      cell: ({ row }) => (
        <Badge className="capitalize">{row.original.transfer_status}</Badge>
      ),
    },
    {
      accessorKey: "transfer_timestamp",
      header: "Timestamp",
      cell: ({ row }) => formatDateTimestamp(row.original.transfer_timestamp),
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
            {row.original.transfer_status === "ongoing" ? (
              hasPermission(roles, 100059) && (
                <DropdownMenuItem
                  onClick={() =>
                    handleOpenUpdateDialog(row.original.transfer_id)
                  }
                >
                  Transfer
                </DropdownMenuItem>
              )
            ) : (
              <DropdownMenuItem>No action</DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const updateFrozenBalance = async () => {
    const controller = new AbortController();

    try {
      const payload = {
        client_account_id: clientAccountId,
        transactionid: selectedId,
        action: "unfreeze",
      };
      const response = await axiosPrivate.post(
        "/accounting/frozen/balance",
        payload,
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
      {/* ✅ Frozen Balances Table */}
      <Datatable
        columns={columns}
        data={data}
        fetchData={refetch}
        isLoading={isLoading}
        isRefetching={isRefetching}
        isError={isError}
        colSpan={5}
        buttonTitle={hasPermission(roles, 100058) ? "+ Freeze Funds" : ""}
        buttonMethod={hasPermission(roles, 100058) ? handleOpenModal : ""}
      />

      {showDialog && (
        <AlertModal
          showDialog={showDialog}
          setShowDialog={handleCloseUpdateDialog}
          method={updateFrozenBalance}
          buttonName="Ok"
          title="Are you sure?"
          message="Do you want to perform this action?"
        />
      )}
      {openModal && (
        <FreezeTransactionDialog
          isOpen={openModal}
          onClose={handleCloseModal}
          refetch={refetch}
          selectedId={selectedId}
        />
      )}
    </div>
  );
};

export default FrozenBalanceTable;

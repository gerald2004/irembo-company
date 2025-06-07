import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import Datatable from "@/Pages/Components/Datatable";
import { toast } from "@/hooks/use-toast";
import AlertModal from "@/components/AlertModal";
import AddTransactionTillDialog from "../Forms/AddTransactionTillDialog";
import EditTransactionTillDialog from "../Forms/EditTransactionTillDialog";

export function TransactionTillTable() {
  const navigate = useNavigate();
  const axiosPrivate = useAxiosPrivate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalOpenEdit, setIsModalOpenEdit] = useState(false);
  const [defaultData, setDefaultData] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  // ✅ Handle Modals
  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleOpenModalEdit = (data) => {
    setIsModalOpenEdit(true);
    setDefaultData(data);
  };

  const handleCloseModalEdit = () => {
    setIsModalOpenEdit(false);
    setDefaultData([]);
  };

  // ✅ Fetch Transaction Tills
  const {
    data = [],
    isLoading,
    refetch,
    isRefetching,
    isError,
  } = useQuery({
    queryKey: ["transaction_tills"],
    queryFn: async () => {
            const controller = new AbortController();

      const fetchURL = `/settings/transaction-channels`;
      try {
        const response = await axiosPrivate.get(fetchURL, {
          signal: controller.signal,
        });
        return response?.data?.data?.transaction_tills ?? [];
      } catch (error) {
        if (error?.response?.status === 401) {
          navigate("/", { state: { from: location }, replace: true });
        }
        throw error;
      }
    },
    keepPreviousData: true,
  });
   const {
     data: accountsData,
     isLoading: isLoadingAccounts,
     isError: isErrorAccounts,
     refetch: refetchAccounts,
     isRefetching: isRefetchingAccounts,
   } = useQuery({
     queryKey: ["account-votes"],
     queryFn: async () => {
            const controller = new AbortController();

       const response = await axiosPrivate.get("/settings/accounts/account", {
         signal: controller.signal,
       });
       return response.data.data.accounts;
     },
   });
const {
  data: staffList = []
} = useQuery({
  queryKey: ["users"],
  queryFn: async () => {
          const controller = new AbortController();

    try {
      const response = await axiosPrivate.get(`/business/employees`, {
        signal: controller.signal,
      });
      return response?.data?.data?.users ?? [];
    } catch (error) {
      if (error?.response?.status === 401) {
        navigate("/", { state: { from: location }, replace: true });
      }
      throw error;
    }
  },
  keepPreviousData: true,
});
  // ✅ Handle Delete Till
  const handleOpenDeleteDialog = (id) => {
    setSelectedId(id);
    setShowDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setSelectedId(null);
    setShowDialog(false);
  };

  const handleDeleteTill = async () => {
          const controller = new AbortController();

    try {
      const response = await axiosPrivate.delete(
        `/settings/transaction-channels/${selectedId}`,
        { signal: controller.signal }
      );
      toast({ title: "Success", description: response?.data?.messages });
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

  // ✅ Table Columns
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
      accessorKey: "staff",
      header: "Staff Name",
      cell: ({ row }) => (
        <p className="capitalize">
          {row.original.staff?.user_identification_code}{" "}
          {row.original.staff?.user_firstname}{" "}
          {row.original.staff?.user_lastname}
        </p>
      ),
    },
    {
      accessorKey: "account.account_title",
      header: "Linked Account",
      cell: ({ row }) => <p>{row.original.account?.account_title || "N/A"}</p>,
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => <p>{row.original.description || "N/A"}</p>,
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
            <DropdownMenuItem
              onSelect={() => handleOpenModalEdit(row.original)}
            >
              Edit Till
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleOpenDeleteDialog(row.original.till_id)}
            >
              Delete Till
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <Datatable
        columns={columns}
        data={data}
        fetchData={refetch}
        isLoading={isLoading}
        isRefetching={isRefetching}
        buttonTitle={"+ Add Transaction Till"}
        buttonMethod={handleOpenModal}
        isError={isError}
      />
      {/* ✅ Add Till Modal */}
      <AddTransactionTillDialog
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        refetch={refetch}
        accountsData={accountsData}
        isLoadingAccounts={isLoadingAccounts}
        isErrorAccounts={isErrorAccounts}
        refetchAccounts={refetchAccounts}
        isRefetchingAccounts={isRefetchingAccounts}
        staffList={staffList}
      />
      {/* ✅ Edit Till Modal */}
      <EditTransactionTillDialog
        isOpen={isModalOpenEdit}
        onClose={handleCloseModalEdit}
        refetch={refetch}
        defaultValues={defaultData}
        accountsData={accountsData}
        isLoadingAccounts={isLoadingAccounts}
        isErrorAccounts={isErrorAccounts}
        refetchAccounts={refetchAccounts}
        isRefetchingAccounts={isRefetchingAccounts}
        staffList={staffList}
      />
      {/* ✅ Delete Confirmation Modal */}
      <AlertModal
        showDialog={showDialog}
        setShowDialog={handleCloseDeleteDialog}
        title="Are you sure?"
        message="Do you want to delete this transaction till?"
        method={handleDeleteTill}
        buttonName="Delete"
      />
    </>
  );
}

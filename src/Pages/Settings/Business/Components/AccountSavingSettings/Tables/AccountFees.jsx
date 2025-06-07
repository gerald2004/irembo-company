import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";

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

import "jspdf-autotable";

import Datatable from "@/Pages/Components/Datatable";
import { toast } from "@/hooks/use-toast";
import AlertModal from "@/components/AlertModal";
import AddAccountProductFeeDialog from "../Forms/AddAccountProductFeeDialog";
import EditAccountProductFeeDialog from "../Forms/EditAccountProductFeeDialog";
export function AccountFees() {
  const navigate = useNavigate();
  const axiosPrivate = useAxiosPrivate();
  const params = useParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalOpenEdit, setIsModalOpenEdit] = useState(false);
  const [defaultData, setDefaultData] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

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

  const {
    data = [],
    isLoading,
    refetch,
    isRefetching,
    isError,
  } = useQuery({
    queryKey: ["accounts-settings-fees-data", params.id],
    queryFn: async () => {
            const controller = new AbortController();

      const fetchURL = `/settings/saving-accounts/autocharges/${params.id}/product`;
      try {
        const response = await axiosPrivate.get(fetchURL, {
          signal: controller.signal,
        });
        return response?.data?.data?.fees ?? [];
      } catch (error) {
        if (error?.response?.status === 401) {
          navigate("/", { state: { from: location }, replace: true });
        }
        throw error;
      }
    },
    keepPreviousData: true,
  });
  const handleOpenDeleteDialog = (id) => {
    setSelectedId(id);
    setShowDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setSelectedId(null);
    setShowDialog(false);
  };

  const handleDelete = async () => {
          const controller = new AbortController();

    try {
      const response = await axiosPrivate.delete(
        `/settings/saving-accounts/autocharges/${selectedId}`,
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
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <p className="capitalize hover:uppercase">{row.original.title}</p>
      ),
    },
    {
      accessorKey: "calculated_as",
      header: "Calculated As",
      cell: ({ row }) => (
        <p className="capitalize">
          {row.original.calculated_as
            .split("_") // Split by underscore
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize first letter
            .join(" ")}{" "}
          {/* Join words with a space */}
        </p>
      ),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => <p className="capitalize">{row.original.type}</p>,
    },
    {
      accessorKey: "trigger",
      header: "Trigger",
      cell: ({ row }) => (
        <p className="capitalize">{row.original.trigger.replace(/_/g, " ")}</p>
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
            <DropdownMenuItem
              onSelect={() => handleOpenModalEdit(row.original)}
            >
              Edit Account Fee
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleOpenDeleteDialog(row.original.id)}
            >
              Delete Account Fee
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

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

  return (
    <>
      <Datatable
        columns={columns}
        data={data}
        fetchData={refetch}
        isLoading={isLoading}
        isRefetching={isRefetching}
        buttonTitle={"+ Account Product Fees"}
        buttonMethod={handleOpenModal}
        isError={isError}
      />
      <AddAccountProductFeeDialog
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        refetch={refetch}
        accountsData={accountsData}
        isLoadingAccounts={isLoadingAccounts}
        isErrorAccounts={isErrorAccounts}
        refetchAccounts={refetchAccounts}
        isRefetchingAccounts={isRefetchingAccounts}
      />
      <EditAccountProductFeeDialog
        isOpen={isModalOpenEdit}
        onClose={handleCloseModalEdit}
        refetch={refetch}
        defaultValues={defaultData}
        accountsData={accountsData}
        isLoadingAccounts={isLoadingAccounts}
        isErrorAccounts={isErrorAccounts}
        refetchAccounts={refetchAccounts}
        isRefetchingAccounts={isRefetchingAccounts}
      />
      <AlertModal
        showDialog={showDialog}
        setShowDialog={handleCloseDeleteDialog}
        title="Are you absolutely sure?"
        message="Are you sure you want to delete this account fee?"
        method={handleDelete}
        buttonName="Delete"
      />
    </>
  );
}

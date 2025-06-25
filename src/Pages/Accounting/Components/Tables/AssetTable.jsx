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
import { toast } from "@/hooks/use-toast";
import Datatable from "@/Pages/Components/Datatable";
import AlertModal from "@/components/AlertModal";
import { formatDateTimestamp, hasPermission } from "@/lib/utils";
import AddAsset from "../Forms/AddAsset";
import ViewAsset from "../Forms/ViewAsset";
import useAuth from "@/MiddleWares/Hooks/useAuth";
export function AssetTable() {
  const navigate = useNavigate();
  const axiosPrivate = useAxiosPrivate();
  const params = useParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedId, setIsSelectedId] = useState(false);

  const [showDialog, setShowDialog] = useState(false);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);
  const {
    data = [],
    isLoading,
    refetch,
    isRefetching,
    isError,
  } = useQuery({
    queryKey: ["assets-table-data", params.id],
    queryFn: async () => {
      const controller = new AbortController();
      const fetchURL = `/accounting/assets`;
      try {
        const response = await axiosPrivate.get(fetchURL, {
          signal: controller.signal,
        });
        return response?.data?.data ?? [];
      } catch (error) {
        if (error?.response?.status === 401) {
          navigate("/", { state: { from: location }, replace: true });
        }
        throw error;
      }
    },
    keepPreviousData: true,
  });

  const [isModalOpenAsset, setIsModalOpenAsset] = useState(false);
  const [defaultData, setDefaultData] = useState([]);

  const handleViewOpen = (data) => {
    setIsModalOpenAsset(true);
    setDefaultData(data);
  };

  const handleViewClose = () => {
    setIsModalOpenAsset(false);
    setDefaultData([]);
  };

  const handleOpenDeleteDialog = (id) => {
    setIsSelectedId(id);
    setShowDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setShowDialog(false);
    setIsSelectedId([]);
  };

  const {
    auth: { roles },
  } = useAuth();

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
      accessorKey: "asset_name",
      header: "Name",
      cell: ({ row }) => (
        <p className="capitalize hover:uppercase">{row.original.asset_name}</p>
      ),
    },
    {
      accessorKey: "date",
      header: "Purchase Date",
      cell: ({ row }) => (
        <p className="capitalize hover:uppercase">
          {formatDateTimestamp(row.original.date)}
        </p>
      ),
    },
    {
      accessorKey: "date_put_to_use",
      header: "Date Put To Use",
      cell: ({ row }) => (
        <p className="capitalize hover:uppercase">
          {formatDateTimestamp(row.original.date_put_to_use)}
        </p>
      ),
    },
    {
      accessorKey: "rate",
      header: "Rate",
      cell: ({ row }) => (
        <p className="capitalize hover:uppercase">{row.original.rate} %</p>
      ),
    },
    {
      accessorKey: "purchase_cost",
      header: "Purchase Cost",
      cell: ({ row }) => (
        <p className="capitalize">
          {parseFloat(row.original.purchase_cost).toLocaleString()}
        </p>
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
            {hasPermission(roles, 100170) && (
              <DropdownMenuItem onClick={() => handleViewOpen(row.original)}>
                View
              </DropdownMenuItem>
            )}
            {hasPermission(roles, 100171) && (
              <DropdownMenuItem
                onClick={() => handleOpenDeleteDialog(row.original.asset_id)}
              >
                Delete
              </DropdownMenuItem>
            )}
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
  const handleDelete = async () => {
    try {
      const controller = new AbortController();
      const response = await axiosPrivate.delete(
        `/accounting/assets/${selectedId}`,
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
  return (
    <>
      <Datatable
        columns={columns}
        data={data}
        fetchData={refetch}
        isLoading={isLoading}
        isRefetching={isRefetching}
        buttonTitle={hasPermission(roles, 100110) ? "+ Add Assets" : ""}
        buttonMethod={hasPermission(roles, 100110) ? handleOpenModal : ""}
        isError={isError}
      />
      {hasPermission(roles, 100110) && isModalOpen && (
        <AddAsset
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          refetch={refetch}
          accountsData={accountsData}
          isLoadingAccounts={isLoadingAccounts}
          isErrorAccounts={isErrorAccounts}
          refetchAccounts={refetchAccounts}
          isRefetchingAccounts={isRefetchingAccounts}
        />
      )}
      {hasPermission(roles, 100171) && showDialog && (
        <AlertModal
          showDialog={showDialog}
          setShowDialog={handleCloseDeleteDialog}
          title="Are you absolutely sure?"
          message="Are you sure you want to delete this asset?"
          method={handleDelete}
          buttonName="Delete"
        />
      )}
      {hasPermission(roles, 100170) && isModalOpenAsset && (
        <ViewAsset
          isOpen={isModalOpenAsset}
          onClose={handleViewClose}
          asset={defaultData}
        />
      )}
    </>
  );
}

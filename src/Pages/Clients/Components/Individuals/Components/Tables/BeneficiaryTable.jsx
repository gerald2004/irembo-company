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
import AddBeneficiary from "../Forms/AddBeneficiary";
import EditBeneficiary from "../Forms/EditBeneficiary";
import useAuth from "@/MiddleWares/Hooks/useAuth";
import { hasPermission } from "@/lib/utils";
export function BeneficiaryTable() {
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
  const { auth } = useAuth();
  const roles = auth?.roles;
  const {
    data = [],
    isLoading,
    refetch,
    isRefetching,
    isError,
  } = useQuery({
    queryKey: ["beneficiary", params.id],
    queryFn: async () => {
      const controller = new AbortController();

      const fetchURL = `/clients/beneficiary/${params.id}`;
      try {
        const response = await axiosPrivate.get(fetchURL, {
          signal: controller.signal,
        });
        return response?.data?.data?.next_of_kin ?? [];
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

  const handleDeleteBeneficiary = async () => {
    const controller = new AbortController();

    try {
      const response = await axiosPrivate.delete(
        `/clients/beneficiary/${selectedId}`,
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
      accessorKey: "client_next_of_kin_firstname",
      header: "Firstname",
      cell: ({ row }) => (
        <p className="capitalize">
          {row.original.client_next_of_kin_firstname}
        </p>
      ),
    },
    {
      accessorKey: "client_next_of_kin_lastname",
      header: "Lastname",
      cell: ({ row }) => (
        <p className="capitalize">{row.original.client_next_of_kin_lastname}</p>
      ),
    },
    {
      accessorKey: "client_next_of_kin_gender",
      header: "Gender",
      cell: ({ row }) => (
        <p className="capitalize">{row.original.client_next_of_kin_gender}</p>
      ),
    },
    {
      accessorKey: "client_next_of_kin_relationship",
      header: "Relationship",
      cell: ({ row }) => (
        <p className="capitalize">
          {row.original.client_next_of_kin_relationship}
        </p>
      ),
    },
    {
      accessorKey: "client_next_of_kin_heritance",
      header: "Heritance (%)",
      cell: ({ row }) => (
        <p className="capitalize">
          {row.original.client_next_of_kin_heritance}%
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
            {hasPermission(roles, 100023) && (
              <DropdownMenuItem
                onSelect={() => handleOpenModalEdit(row.original)}
              >
                Edit Beneficiary
              </DropdownMenuItem>
            )}
            {hasPermission(roles, 100024) && (
              <DropdownMenuItem
                onClick={() => handleOpenDeleteDialog(row.original.id)}
              >
                Delete Beneficiary
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      {hasPermission(roles, 100021) && (
        <Datatable
          columns={columns}
          data={data}
          fetchData={refetch}
          isLoading={isLoading}
          isRefetching={isRefetching}
          buttonTitle={hasPermission(roles, 100022) ? "+ Beneficiary" : ""}
          buttonMethod={hasPermission(roles, 100022) ? handleOpenModal : ""}
          isError={isError}
        />
      )}
      {hasPermission(roles, 100022) && (
        <AddBeneficiary
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          refetch={refetch}
        />
      )}
      {hasPermission(roles, 100023) && (
        <EditBeneficiary
          isOpen={isModalOpenEdit}
          onClose={handleCloseModalEdit}
          refetch={refetch}
          defaultValues={defaultData}
        />
      )}
      {hasPermission(roles, 100024) && (
        <AlertModal
          showDialog={showDialog}
          setShowDialog={handleCloseDeleteDialog}
          title="Are you absolutely sure?"
          message="Are you sure you want to delete this beneficiary?"
          method={handleDeleteBeneficiary}
          buttonName="Delete"
        />
      )}
    </>
  );
}

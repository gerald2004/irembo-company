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
import AddExecutive from "../Forms/AddExecutive";
import EditExecutive from "../Forms/EditBeneficiary";
import { formatDateTimestamp, hasPermission } from "@/lib/utils";
import PhotoEdit from "../Forms/PhotoEdit";
import useAuth from "@/MiddleWares/Hooks/useAuth";
export function ExecutiveTable() {
  const { auth } = useAuth();
  const roles = auth?.roles;
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

  const [photoEdit, setPhotoEdit] = useState(false);

  const handleOpenModalPhotoEdit = (data) => {
    setPhotoEdit(true);
    setDefaultData(data);
  };

  const handleCloseModalPhotoEdit = () => {
    setPhotoEdit(false);
    setDefaultData([]);
  };

  const {
    data = [],
    isLoading,
    refetch,
    isRefetching,
    isError,
  } = useQuery({
    queryKey: ["executive", params.id],
    queryFn: async () => {
      const controller = new AbortController();

      const fetchURL = `/clients/executives/${params.id}`;
      try {
        const response = await axiosPrivate.get(fetchURL, {
          signal: controller.signal,
        });
        return response?.data?.data?.executives ?? [];
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
        `/clients/executives/${selectedId}/single`,
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
      accessorKey: "fullname",
      header: "Fullname",
      cell: ({ row }) => (
        <p className="capitalize">
          {row.original.title}.{row.original.fullname}
        </p>
      ),
    },
    {
      accessorKey: "contact",
      header: "Contact",
      cell: ({ row }) => <p className="capitalize">{row.original.contact}</p>,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <p className="lowercase">{row.original.email}</p>,
    },
    {
      accessorKey: "identification",
      header: "Identification",
      cell: ({ row }) => (
        <p className="capitalize">{row.original.identification}</p>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => <p className="capitalize">{row.original.role}</p>,
    },
    {
      accessorKey: "address",
      header: "Address",
      cell: ({ row }) => <p className="capitalize">{row.original.address}</p>,
    },
    {
      accessorKey: "created_at",
      header: "Timestamp",
      cell: ({ row }) => (
        <p className="capitalize">
          {formatDateTimestamp(row.original.created_at)}
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
            {hasPermission(roles, 100018) && (
              <DropdownMenuItem
                onClick={() => handleOpenModalPhotoEdit(row.original)}
              >
                Update Images
              </DropdownMenuItem>
            )}{" "}
            {hasPermission(roles, 100018) && (
              <DropdownMenuItem
                onSelect={() => handleOpenModalEdit(row.original)}
              >
                Edit Executive
              </DropdownMenuItem>
            )}
            {hasPermission(roles, 100019) && (
              <DropdownMenuItem
                onClick={() => handleOpenDeleteDialog(row.original.id)}
              >
                Delete Executive
              </DropdownMenuItem>
            )}
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
        buttonTitle={hasPermission(roles, 100017) ? "+ Member" : ""}
        buttonMethod={hasPermission(roles, 100017) ? handleOpenModal : ""}
        isError={isError}
      />
      {hasPermission(roles, 100017) && (
        <AddExecutive
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          refetch={refetch}
        />
      )}
      {hasPermission(roles, 100018) && (
        <>
          <EditExecutive
            isOpen={isModalOpenEdit}
            onClose={handleCloseModalEdit}
            refetch={refetch}
            defaultValues={defaultData}
          />
          <PhotoEdit
            isOpen={photoEdit}
            onClose={handleCloseModalPhotoEdit}
            refetch={refetch}
            defaultValues={defaultData}
          />
        </>
      )}
      {hasPermission(roles, 100019) && (
        <AlertModal
          showDialog={showDialog}
          setShowDialog={handleCloseDeleteDialog}
          title="Are you absolutely sure?"
          message="Are you sure you want to delete this executive?"
          method={handleDelete}
          buttonName="Delete"
        />
      )}
    </>
  );
}

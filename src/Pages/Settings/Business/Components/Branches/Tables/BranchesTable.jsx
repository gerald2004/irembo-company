import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";

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
import AddBranchDialog from "../Forms/AddBranchDialog";
import EditBranchDialog from "../Forms/EditBranchDialog";

export function BranchesTable() {
  const navigate = useNavigate();
  const axiosPrivate = useAxiosPrivate();
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

  // ✅ Fetch Branches
  const {
    data = [],
    isLoading,
    refetch,
    isRefetching,
    isError,
  } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const fetchURL = `/settings/branches`;
            const controller = new AbortController();

      try {
        const response = await axiosPrivate.get(fetchURL, {
          signal: controller.signal,
        });
        return response?.data?.data?.branches ?? [];
      } catch (error) {
        if (error?.response?.status === 401) {
          navigate("/", { state: { from: location }, replace: true });
        }
        throw error;
      }
    },
    keepPreviousData: true,
  });

  // ✅ Handle Delete
  const handleOpenDeleteDialog = (id) => {
    setSelectedId(id);
    setShowDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setSelectedId(null);
    setShowDialog(false);
  };

  const handleDeleteBranch = async () => {
          const controller = new AbortController();

    try {
      const response = await axiosPrivate.delete(
        `/settings/branches/${selectedId}`,
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
      accessorKey: "name",
      header: "Branch Name",
      cell: ({ row }) => (
        <Link
          to={`/branch-management/${row.original.id}`}
          className="capitalize hover:uppercase"
        >
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: "code",
      header: "Branch Code",
      cell: ({ row }) => <p>{row.original.code}</p>,
    },
    {
      accessorKey: "contact",
      header: "Contact",
      cell: ({ row }) => <p>{row.original.contact}</p>,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <p>{row.original.email || "N/A"}</p>,
    },
    {
      accessorKey: "address",
      header: "Address",
      cell: ({ row }) => <p>{row.original.address || "N/A"}</p>,
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
            <DropdownMenuItem>
              <Link to={`/branch-management/${row.original.id}`}>
                View Branch
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => handleOpenModalEdit(row.original)}
            >
              Edit Branch
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleOpenDeleteDialog(row.original.id)}
            >
              Delete Branch
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
        buttonTitle={"+ Add Branch"}
        buttonMethod={handleOpenModal}
        isError={isError}
      />
      {/* ✅ Add Branch Modal */}
      <AddBranchDialog
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        refetch={refetch}
      />
      {/* ✅ Edit Branch Modal */}
      <EditBranchDialog
        isOpen={isModalOpenEdit}
        onClose={handleCloseModalEdit}
        refetch={refetch}
        defaultValues={defaultData}
      />
      {/* ✅ Delete Confirmation Modal */}
      <AlertModal
        showDialog={showDialog}
        setShowDialog={handleCloseDeleteDialog}
        title="Are you sure?"
        message="Do you want to delete this branch?"
        method={handleDeleteBranch}
        buttonName="Delete"
      />
    </>
  );
}

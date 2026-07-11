import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import useAuth from "@/MiddleWares/Hooks/useAuth";
import { hasPermission } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

import Datatable from "@/Pages/Components/Datatable";
import AddSalaryAdvanceProductDialog from "../Forms/AddSalaryAdvanceProductDialog";
import EditSalaryAdvanceProductDialog from "../Forms/EditSalaryAdvanceProductDialog";
import { toast } from "@/hooks/use-toast";
import AlertModal from "@/components/AlertModal";

export function SalaryAdvanceProductsTable() {
  const navigate = useNavigate();
  const axiosPrivate = useAxiosPrivate();
  const {
    auth: { roles },
  } = useAuth();

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
    queryKey: ["salary-advance-products"],
    queryFn: async () => {
      const controller = new AbortController();
      try {
        const response = await axiosPrivate.get(
          `/settings/salary-advance/products`,
          { signal: controller.signal }
        );
        return response?.data?.data?.salary_advance_products ?? [];
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

  const handleDeleteProduct = async () => {
    const controller = new AbortController();
    try {
      const response = await axiosPrivate.delete(
        `/settings/salary-advance/products/${selectedId}`,
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
        description: Array.isArray(errorMessage)
          ? errorMessage.join(", ")
          : errorMessage,
      });
    } finally {
      handleCloseDeleteDialog();
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
        <p className="font-medium capitalize">{row.original.title}</p>
      ),
    },
    {
      accessorKey: "code",
      header: "Code",
    },
    {
      accessorKey: "max_advance_percentage",
      header: "Max Advance",
      cell: ({ row }) => <p>{row.original.max_advance_percentage}% of salary</p>,
    },
    {
      accessorKey: "fee_value",
      header: "Fee",
      cell: ({ row }) => (
        <p className="capitalize">
          {row.original.fee_type === "percent"
            ? `${row.original.fee_value}%`
            : row.original.fee_value}{" "}
          ({row.original.fee_type})
        </p>
      ),
    },
    {
      accessorKey: "allow_multiple_active",
      header: "Multiple Active",
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {row.original.allow_multiple_active}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant={row.original.status === "active" ? "default" : "secondary"}
          className="capitalize"
        >
          {row.original.status}
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
            {hasPermission(roles, 100620) && (
              <DropdownMenuItem
                onSelect={() => handleOpenModalEdit(row.original)}
              >
                Edit Product
              </DropdownMenuItem>
            )}
            {hasPermission(roles, 100620) && (
              <DropdownMenuItem
                onClick={() => handleOpenDeleteDialog(row.original.id)}
              >
                Delete Product
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
        buttonTitle={
          hasPermission(roles, 100620) ? "+ Salary Advance Product" : ""
        }
        buttonMethod={hasPermission(roles, 100620) ? handleOpenModal : ""}
        isError={isError}
      />
      {hasPermission(roles, 100620) && (
        <>
          <AddSalaryAdvanceProductDialog
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            refetch={refetch}
          />
          <EditSalaryAdvanceProductDialog
            isOpen={isModalOpenEdit}
            onClose={handleCloseModalEdit}
            refetch={refetch}
            defaultValues={defaultData}
          />
        </>
      )}
      <AlertModal
        showDialog={showDialog}
        setShowDialog={handleCloseDeleteDialog}
        title="Are you absolutely sure?"
        message="Are you sure you want to delete this salary advance product? This cannot be undone."
        method={handleDeleteProduct}
        buttonName="Delete"
      />
    </>
  );
}

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

import "jspdf-autotable";

import Datatable from "@/Pages/Components/Datatable";
import AddLoanProductDialog from "../Forms/AddLoanProductDialog";
import EditLoanProductDialog from "../Forms/EditLoanProductDialog";
import { toast } from "@/hooks/use-toast";
import AlertModal from "@/components/AlertModal";
export function GeneralLoanSettingsTables() {
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

  const {
    data = [],
    isLoading,
    refetch,
    isRefetching,
    isError
  } = useQuery({
    queryKey: ["loan-settings-data"],
    queryFn: async () => {
            const controller = new AbortController();

      const fetchURL = `/settings/loans/products`;
      try {
        const response = await axiosPrivate.get(fetchURL, {
          signal: controller.signal,
        });
        return response?.data?.data?.loan_products ?? [];
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

  const handleDeleteLoanProduct = async () => {
          const controller = new AbortController();

    try {
      const response = await axiosPrivate.delete(
        `/settings/loans/products/${selectedId}`,
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
        <Link
          to={`/loan-settings/products/${row.original.id}`}
          className="capitalize hover:uppercase"
        >
          {row.original.title}
        </Link>
      ),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => <p className="capitalize">{row.original.type}</p>,
    },
    {
      accessorKey: "interest_rate",
      header: "Interest Rate",
      cell: ({ row }) => (
        <p className="capitalize">{row.original.interest_rate}%</p>
      ),
    },
    {
      accessorKey: "product_interval",
      header: "Product Interval",
      cell: ({ row }) => (
        <p className="capitalize">{row.original.product_interval}</p>
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
            <DropdownMenuItem>
              <Link to={`/loan-settings/products/${row.original.id}`}>
                View Loan Product
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => handleOpenModalEdit(row.original)}
            >
              Edit Loan Product
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleOpenDeleteDialog(row.original.id)}
            >
              Delete Loan Product
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
        buttonTitle={"+ Loan Product"}
        buttonMethod={handleOpenModal}
        isError={isError}
      />
      <AddLoanProductDialog
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        refetch={refetch}
      />
      <EditLoanProductDialog
        isOpen={isModalOpenEdit}
        onClose={handleCloseModalEdit}
        refetch={refetch}
        defaultValues={defaultData}
      />
      <AlertModal
        showDialog={showDialog}
        setShowDialog={handleCloseDeleteDialog}
        title="Are you absolutely sure?"
        message="Are you sure you want to delete this loan product?"
        method={handleDeleteLoanProduct}
        buttonName="Delete"
      />
    </>
  );
}

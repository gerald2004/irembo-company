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
import AddDeductionAllowanceDialog from "../Forms/AddDeductionAllowanceDialog";
import EditDeductionAllowanceDialog from "../Forms/EditDeductionAllowanceDialog";

export function PayrollSettingsConfig() {
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

  // ✅ Fetch Payroll Deductions & Allowances
  const {
    data: deductionsAllowancesData = [],
    isLoading,
    refetch,
    isRefetching,
    isError,
  } = useQuery({
    queryKey: ["payroll-deductions-allowances"],
    queryFn: async () => {
            const controller = new AbortController();

      const fetchURL = `/settings/payroll-config`;
      try {
        const response = await axiosPrivate.get(fetchURL, {
          signal: controller.signal,
        });
        return response?.data?.data?.deductions_allowances ?? [];
      } catch (error) {
        if (error?.response?.status === 401) {
          navigate("/", { state: { from: location }, replace: true });
        }
        throw error;
      }
    },
    keepPreviousData: true,
  });

  // ✅ Handle Delete Deduction/Allowance
  const handleOpenDeleteDialog = (id) => {
    setSelectedId(id);
    setShowDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setSelectedId(null);
    setShowDialog(false);
  };

  const handleDeleteDeductionAllowance = async () => {
          const controller = new AbortController();

    try {
      const response = await axiosPrivate.delete(
        `/settings/payroll-config/${selectedId}`,
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
      header: "Name",
      cell: ({ row }) => <p className="capitalize">{row.original.name}</p>,
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <p
          className={`capitalize ${
            row.original.type === "Deduction"
              ? "text-red-500"
              : "text-green-500"
          }`}
        >
          {row.original.type}
        </p>
      ),
    },
    {
      accessorKey: "value_type",
      header: "Value Type",
      cell: ({ row }) => <p>{row.original.value_type}</p>,
    },
    {
      accessorKey: "value",
      header: "Value",
      cell: ({ row }) => (
        <p>
          {row.original.value_type === "Percentage"
            ? `${row.original.value}%`
            : `${Number(row.original.value).toLocaleString()}`}
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
            <DropdownMenuItem
              onSelect={() => handleOpenModalEdit(row.original)}
            >
              Edit Deduction/Allowance
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleOpenDeleteDialog(row.original.id)}
            >
              Delete
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
        data={deductionsAllowancesData}
        fetchData={refetch}
        isLoading={isLoading}
        isRefetching={isRefetching}
        buttonTitle={"+ Add Deduction/Allowance"}
        buttonMethod={handleOpenModal}
        isError={isError}
      />
      {/* ✅ Add Deduction/Allowance Modal */}
      <AddDeductionAllowanceDialog
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        refetch={refetch}
      />
      {/* ✅ Edit Deduction/Allowance Modal */}
      <EditDeductionAllowanceDialog
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
        message="Do you want to delete this deduction or allowance?"
        method={handleDeleteDeductionAllowance}
        buttonName="Delete"
      />
    </>
  );
}

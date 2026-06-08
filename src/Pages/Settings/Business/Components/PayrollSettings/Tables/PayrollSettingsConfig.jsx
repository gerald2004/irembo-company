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

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleOpenModalEdit = (data) => { setIsModalOpenEdit(true); setDefaultData(data); };
  const handleCloseModalEdit = () => { setIsModalOpenEdit(false); setDefaultData([]); };

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
      try {
        const response = await axiosPrivate.get("/settings/payroll-config", { signal: controller.signal });
        return response?.data?.data?.deductions_allowances ?? [];
      } catch (error) {
        if (error?.response?.status === 401) navigate("/", { state: { from: location }, replace: true });
        throw error;
      }
    },
    keepPreviousData: true,
  });

  const {
    data: accountsData = [],
    isLoading: isLoadingAccounts,
    isError: isErrorAccounts,
    refetch: refetchAccounts,
  } = useQuery({
    queryKey: ["account-votes"],
    queryFn: async () => {
      const controller = new AbortController();
      const response = await axiosPrivate.get("/settings/accounts/account", { signal: controller.signal });
      return response.data.data.accounts ?? [];
    },
  });

  const handleOpenDeleteDialog = (id) => { setSelectedId(id); setShowDialog(true); };
  const handleCloseDeleteDialog = () => { setSelectedId(null); setShowDialog(false); };

  const handleDeleteDeductionAllowance = async () => {
    const controller = new AbortController();
    try {
      const response = await axiosPrivate.delete(`/settings/payroll-config/${selectedId}`, { signal: controller.signal });
      toast({ title: "Success", description: response?.data?.messages });
      refetch();
    } catch (error) {
      toast({
        title: "Uh oh! Something went wrong.",
        variant: "destructive",
        description: error?.response?.data?.messages || "No server response",
      });
    }
  };

  const columns = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
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
        <p className={`capitalize font-medium ${row.original.type === "Deduction" ? "text-red-500" : "text-green-500"}`}>
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
            : Number(row.original.value).toLocaleString()}
        </p>
      ),
    },
    {
      accessorKey: "account_name",
      header: "Account",
      cell: ({ row }) =>
        row.original.account_name ? (
          <p className="text-xs text-gray-500">
            <span className="font-mono">{row.original.account_code}</span>{" "}
            {row.original.account_name}
          </p>
        ) : (
          <p className="text-xs text-gray-400 italic">Default</p>
        ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">...</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => handleOpenModalEdit(row.original)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleOpenDeleteDialog(row.original.id)}>
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
        buttonTitle="+ Add Deduction/Allowance"
        buttonMethod={handleOpenModal}
        isError={isError}
      />
      <AddDeductionAllowanceDialog
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        refetch={refetch}
        accountsData={accountsData}
        isLoadingAccounts={isLoadingAccounts}
        isErrorAccounts={isErrorAccounts}
        refetchAccounts={refetchAccounts}
      />
      <EditDeductionAllowanceDialog
        isOpen={isModalOpenEdit}
        onClose={handleCloseModalEdit}
        refetch={refetch}
        defaultValues={defaultData}
        accountsData={accountsData}
        isLoadingAccounts={isLoadingAccounts}
        isErrorAccounts={isErrorAccounts}
        refetchAccounts={refetchAccounts}
      />
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

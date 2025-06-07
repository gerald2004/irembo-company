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
import AlertModal from "@/components/AlertModal";
import AddExpenseDialog from "../Forms/AddExpenseDialog";
import { formatDateTimestamp } from "@/lib/utils";
export function ExpensesTable() {
  const navigate = useNavigate();
  const axiosPrivate = useAxiosPrivate();
  const params = useParams();
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    queryKey: ["expenses-data", params.id],
    queryFn: async () => {
      const controller = new AbortController();
      const fetchURL = `/accounting/vendors/bills`;
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
  const handleOpenDeleteDialog = () => {
    setShowDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setShowDialog(false);
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
      accessorKey: "vendor_bill_code",
      header: "Expense Code",
      cell: ({ row }) => (
        <p className="capitalize hover:uppercase">
          {row.original.vendor_bill_code}
        </p>
      ),
    },
    {
      accessorKey: "vendor_bill_amount",
      header: "Amount",
      cell: ({ row }) => (
        <p className="capitalize">
          {parseFloat(row.original.vendor_bill_amount).toLocaleString()}
        </p>
      ),
    },
    {
      accessorKey: "vendor_bill_date",
      header: "Expense Date",
      cell: ({ row }) => (
        <p className="capitalize">
          {formatDateTimestamp(row.original.vendor_bill_date)}
        </p>
      ),
    },
    {
      accessorKey: "vendor_bill_due_date",
      header: "Expense Due Date",
      cell: ({ row }) => (
        <p className="capitalize">
          {formatDateTimestamp(row.original.vendor_bill_due_date)}
        </p>
      ),
    },
    {
      accessorKey: "vendor_bill_notes",
      header: "Notes",
      cell: ({ row }) => (
        <p className="capitalize">{row.original.vendor_bill_notes}</p>
      ),
    },
    {
      accessorKey: "vendor.vendor_id",
      header: "Vendor",
      cell: ({ row }) => (
        <p className="capitalize">{`${row.original.vendor.vendor_firstname} ${row.original.vendor.vendor_lastname}`}</p>
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
              onClick={() => handleOpenDeleteDialog(row.original.id)}
            >
              Reverse
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
        buttonTitle={"+ Expenses"}
        buttonMethod={handleOpenModal}
        isError={isError}
      />
      <AddExpenseDialog
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        refetch={refetch}
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
        message="Are you sure you want to reverse this transaction?"
        method={""}
        buttonName="Okay"
      />
    </>
  );
}

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
import AddIncomeDialog from "../Forms/AddIncomeDialog";
import { formatDateTimestamp } from "@/lib/utils";
export function IncomesTable() {
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
    queryKey: ["income-data", params.id],
    queryFn: async () => {
      const controller = new AbortController();
      const fetchURL = `/accounting/incomes`;
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
      accessorKey: "income_code",
      header: "Income Code",
      cell: ({ row }) => (
        <p className="capitalize hover:uppercase">{row.original.income_code}</p>
      ),
    },
    {
      accessorKey: "income_amount",
      header: "Amount",
      cell: ({ row }) => (
        <p className="capitalize">
          {parseFloat(row.original.income_amount).toLocaleString()}
        </p>
      ),
    },
    {
      accessorKey: "income_received_from",
      header: "Received From",
      cell: ({ row }) => (
        <p className="capitalize">{row.original.income_received_from}</p>
      ),
    },
    {
      accessorKey: "income_date",
      header: "Date",
      cell: ({ row }) => (
        <p className="capitalize">
          {formatDateTimestamp(row.original.income_date)}
        </p>
      ),
    },
    {
      accessorKey: "income_notes",
      header: "Notes",
      cell: ({ row }) => (
        <p className="capitalize">{row.original.income_notes}</p>
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
        buttonTitle={"+ Incomes"}
        buttonMethod={handleOpenModal}
        isError={isError}
      />
      <AddIncomeDialog
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

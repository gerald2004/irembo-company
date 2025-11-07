/* eslint-disable react/prop-types */
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
import AddTransactionTillDialog from "../Forms/AddTransactionTillDialog";
import EditTransactionTillDialog from "../Forms/EditTransactionTillDialog";

export function TransactionTillTable() {
  const navigate = useNavigate();
  const axiosPrivate = useAxiosPrivate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalOpenEdit, setIsModalOpenEdit] = useState(false);
  const [defaultData, setDefaultData] = useState(null);

  const [showDialog, setShowDialog] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const openAdd = () => setIsModalOpen(true);
  const closeAdd = () => setIsModalOpen(false);

  const openEdit = (row) => {
    setDefaultData(row);
    setIsModalOpenEdit(true);
  };
  const closeEdit = () => {
    setDefaultData(null);
    setIsModalOpenEdit(false);
  };

  // ─────────────────────────────────────────────────────────
  // Fetch tills list
  // ─────────────────────────────────────────────────────────
  const {
    data = [],
    isLoading,
    refetch,
    isRefetching,
    isError,
  } = useQuery({
    queryKey: ["transaction_tills"],
    queryFn: async () => {
      const controller = new AbortController();
      try {
        const res = await axiosPrivate.get("/settings/transaction-channels", {
          signal: controller.signal,
        });
        return res?.data?.data?.transaction_tills ?? [];
      } catch (error) {
        if (error?.response?.status === 401) {
          navigate("/", { state: { from: location }, replace: true });
        }
        throw error;
      }
    },
    keepPreviousData: true,
  });

  // Accounts (for dialogs)
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
      const res = await axiosPrivate.get("/settings/accounts/account", {
        signal: controller.signal,
      });
      return res?.data?.data?.accounts ?? [];
    },
  });

  // Staff (for dialogs)
  const { data: staffList = [] } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const controller = new AbortController();
      try {
        const res = await axiosPrivate.get(`/business/employees`, {
          signal: controller.signal,
        });
        return res?.data?.data?.users ?? [];
      } catch (error) {
        if (error?.response?.status === 401) {
          navigate("/", { state: { from: location }, replace: true });
        }
        throw error;
      }
    },
    keepPreviousData: true,
  });

  // ─────────────────────────────────────────────────────────
  // Delete flow
  // ─────────────────────────────────────────────────────────
  const confirmDelete = (id) => {
    setSelectedId(id);
    setShowDialog(true);
  };
  const closeDelete = () => {
    setSelectedId(null);
    setShowDialog(false);
  };

  const doDelete = async () => {
    const controller = new AbortController();
    try {
      const res = await axiosPrivate.delete(
        `/settings/transaction-channels/${selectedId}`,
        { signal: controller.signal }
      );
      toast({ title: "Success", description: res?.data?.messages });
      refetch();
      closeDelete();
    } catch (error) {
      const msg = error?.response?.data?.messages || "No server response";
      toast({
        title: "Uh oh! Something went wrong.",
        variant: "destructive",
        description: msg,
      });
    }
  };

  // ─────────────────────────────────────────────────────────
  // Table columns
  // ─────────────────────────────────────────────────────────
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
      accessorKey: "staff",
      header: "Staff Name",
      cell: ({ row }) => {
        const s = row.original?.staff;
        return (
          <p className="capitalize">
            {s?.user_identification_code
              ? `${s.user_identification_code} `
              : ""}
            {s?.user_firstname || ""} {s?.user_lastname || ""}
          </p>
        );
      },
    },
    // ✅ Now that tills link directly to COA, read from account relation
    {
      accessorKey: "account.account_title",
      header: "Linked Account",
      cell: ({ row }) => <p>{row.original?.account?.account_title || "N/A"}</p>,
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => <p>{row.original?.description || "N/A"}</p>,
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
            <DropdownMenuItem onSelect={() => openEdit(row.original)}>
              Edit Till
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => confirmDelete(row.original.till_id)}
            >
              Delete Till
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
        buttonTitle={"+ Add Transaction Till"}
        buttonMethod={openAdd}
        isError={isError}
      />

      <AddTransactionTillDialog
        isOpen={isModalOpen}
        onClose={closeAdd}
        refetch={refetch}
        accountsData={accountsData}
        isLoadingAccounts={isLoadingAccounts}
        isErrorAccounts={isErrorAccounts}
        refetchAccounts={refetchAccounts}
        isRefetchingAccounts={isRefetchingAccounts}
        staffList={staffList}
      />

      <EditTransactionTillDialog
        isOpen={isModalOpenEdit}
        onClose={closeEdit}
        refetch={refetch}
        defaultValues={defaultData}
        accountsData={accountsData}
        isLoadingAccounts={isLoadingAccounts}
        isErrorAccounts={isErrorAccounts}
        refetchAccounts={refetchAccounts}
        isRefetchingAccounts={isRefetchingAccounts}
        staffList={staffList}
      />

      <AlertModal
        showDialog={showDialog}
        setShowDialog={closeDelete}
        title="Are you sure?"
        message="Do you want to delete this transaction till?"
        method={doDelete}
        buttonName="Delete"
      />
    </>
  );
}

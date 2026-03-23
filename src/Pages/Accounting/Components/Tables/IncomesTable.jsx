import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";

import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { Checkbox } from "@/components/ui/checkbox";

import "jspdf-autotable";

import Datatable from "@/Pages/Components/Datatable";
import AddIncomeDialog from "../Forms/AddIncomeDialog";
import { formatDateTimestamp, hasPermission } from "@/lib/utils";
import useAuth from "@/MiddleWares/Hooks/useAuth";
export function IncomesTable() {
  const navigate = useNavigate();
  const axiosPrivate = useAxiosPrivate();
  const params = useParams();
  const [isModalOpen, setIsModalOpen] = useState(false);


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
  const {
    auth: { roles },
  } = useAuth();

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
        params: { account_types: "Income" },
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
        buttonTitle={hasPermission(roles, 100104) ? "+ Incomes" : ""}
        buttonMethod={hasPermission(roles, 100104) ? handleOpenModal : ""}
        isError={isError}
      />
      {hasPermission(roles, 100104) && isModalOpen && (
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
      )}
    </>
  );
}

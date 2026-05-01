/* eslint-disable react/prop-types */
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { Button } from "@/components/ui/button";
import { formatDateTimestamp, hasPermission } from "@/lib/utils";
import { ServerDataTable } from "@/Pages/Components/ServerDataTable";
import AddIncomeDialog from "../Forms/AddIncomeDialog";
import useAuth from "@/MiddleWares/Hooks/useAuth";

const columns = [
  {
    id: "income_code",
    header: "Code",
    enableSorting: true,
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.income_code}</span>
    ),
    exportValue: (r) => r.income_code,
  },
  {
    id: "income_received_from",
    header: "Received From",
    enableSorting: true,
    cell: ({ row }) => <span>{row.original.income_received_from}</span>,
    exportValue: (r) => r.income_received_from,
  },
  {
    id: "income_amount",
    header: "Amount",
    enableSorting: true,
    cell: ({ row }) => (
      <span className="font-mono text-blue-600 font-medium">
        {parseFloat(row.original.income_amount).toLocaleString(undefined, {
          minimumFractionDigits: 2,
        })}
      </span>
    ),
    exportValue: (r) => parseFloat(r.income_amount).toFixed(2),
  },
  {
    id: "income_account",
    header: "Income Account",
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-xs">{row.original.income_account}</span>
    ),
    exportValue: (r) => r.income_account,
  },
  {
    id: "debit_account",
    header: "Debit Account",
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {row.original.debit_account}
      </span>
    ),
    exportValue: (r) => r.debit_account,
  },
  {
    id: "income_date",
    header: "Date",
    enableSorting: true,
    cell: ({ row }) => (
      <span className="text-xs whitespace-nowrap">
        {formatDateTimestamp(row.original.income_date)}
      </span>
    ),
    exportValue: (r) => r.income_date,
  },
  {
    id: "user",
    header: "Posted By",
    enableSorting: false,
    cell: ({ row }) => <span className="text-xs">{row.original.user}</span>,
    exportValue: (r) => r.user,
  },
  {
    id: "branch",
    header: "Branch",
    enableSorting: false,
    cell: ({ row }) => <span className="text-xs">{row.original.branch}</span>,
    exportValue: (r) => r.branch,
  },
  {
    id: "income_notes",
    header: "Notes",
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {row.original.income_notes || "—"}
      </span>
    ),
    exportValue: (r) => r.income_notes || "",
  },
];

export function IncomesTable() {
  const axiosPrivate = useAxiosPrivate();
  const queryClient = useQueryClient();
  const {
    auth: { roles },
  } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    data: accountsData,
    isLoading: isLoadingAccounts,
    isError: isErrorAccounts,
    refetch: refetchAccounts,
    isRefetching: isRefetchingAccounts,
  } = useQuery({
    queryKey: ["account-votes-income"],
    queryFn: async () => {
      const res = await axiosPrivate.get("/settings/accounts/account", {
        params: { account_types: "Income" },
      });
      return res.data.data.accounts;
    },
  });

  return (
    <>
      <ServerDataTable
        queryKey={["incomes-ssr"]}
        endpoint="/serverside/incomes"
        columns={columns}
        title="Income Transactions"
        filename="incomes"
        toolbar={
          hasPermission(roles, 100104) && (
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => setIsModalOpen(true)}
            >
              + New Income
            </Button>
          )
        }
      />

      {hasPermission(roles, 100104) && isModalOpen && (
        <AddIncomeDialog
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          refetch={() => queryClient.invalidateQueries({ queryKey: ["incomes-ssr"] })}
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

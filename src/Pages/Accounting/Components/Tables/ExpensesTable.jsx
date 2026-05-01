/* eslint-disable react/prop-types */
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateTimestamp, hasPermission } from "@/lib/utils";
import { ServerDataTable } from "@/Pages/Components/ServerDataTable";
import AddExpenseDialog from "../Forms/AddExpenseDialog";
import useAuth from "@/MiddleWares/Hooks/useAuth";

const STATUS_VARIANT = {
  paid: "default",
  pending: "secondary",
  overdue: "destructive",
};

const columns = [
  {
    id: "vendor_bill_code",
    header: "Code",
    enableSorting: true,
    cell: ({ row }) => (
      <span className="font-mono text-xs">{row.original.vendor_bill_code}</span>
    ),
    exportValue: (r) => r.vendor_bill_code,
  },
  {
    id: "vendor",
    header: "Vendor",
    enableSorting: false,
    cell: ({ row }) => <span className="text-sm">{row.original.vendor}</span>,
    exportValue: (r) => r.vendor,
  },
  {
    id: "vendor_bill_amount",
    header: "Amount",
    enableSorting: true,
    cell: ({ row }) => (
      <span className="font-mono text-red-600 font-medium">
        {parseFloat(row.original.vendor_bill_amount).toLocaleString(undefined, {
          minimumFractionDigits: 2,
        })}
      </span>
    ),
    exportValue: (r) => parseFloat(r.vendor_bill_amount).toFixed(2),
  },
  {
    id: "expense_account",
    header: "Expense Account",
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-xs">{row.original.expense_account}</span>
    ),
    exportValue: (r) => r.expense_account,
  },
  {
    id: "paid_from_account",
    header: "Paid From",
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {row.original.paid_from_account}
      </span>
    ),
    exportValue: (r) => r.paid_from_account,
  },
  {
    id: "vendor_bill_date",
    header: "Date",
    enableSorting: true,
    cell: ({ row }) => (
      <span className="text-xs whitespace-nowrap">
        {formatDateTimestamp(row.original.vendor_bill_date)}
      </span>
    ),
    exportValue: (r) => r.vendor_bill_date,
  },
  {
    id: "vendor_bill_due_date",
    header: "Due Date",
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-xs whitespace-nowrap">
        {formatDateTimestamp(row.original.vendor_bill_due_date)}
      </span>
    ),
    exportValue: (r) => r.vendor_bill_due_date,
  },
  {
    id: "vendor_bill_status",
    header: "Status",
    enableSorting: true,
    cell: ({ row }) => (
      <Badge
        variant={STATUS_VARIANT[row.original.vendor_bill_status] ?? "secondary"}
        className="capitalize text-xs"
      >
        {row.original.vendor_bill_status}
      </Badge>
    ),
    exportValue: (r) => r.vendor_bill_status,
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
    id: "vendor_bill_notes",
    header: "Notes",
    enableSorting: false,
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {row.original.vendor_bill_notes || "—"}
      </span>
    ),
    exportValue: (r) => r.vendor_bill_notes || "",
  },
];

export function ExpensesTable() {
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
    queryKey: ["account-votes-expense"],
    queryFn: async () => {
      const res = await axiosPrivate.get("/settings/accounts/account", {
        params: { account_types: "Expenses" },
      });
      return res.data.data.accounts;
    },
  });

  return (
    <>
      <ServerDataTable
        queryKey={["expenses-ssr"]}
        endpoint="/serverside/expenses"
        columns={columns}
        title="Expense Transactions"
        filename="expenses"
        toolbar={
          hasPermission(roles, 100106) && (
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => setIsModalOpen(true)}
            >
              + New Expense
            </Button>
          )
        }
      />

      {hasPermission(roles, 100106) && isModalOpen && (
        <AddExpenseDialog
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          refetch={() => queryClient.invalidateQueries({ queryKey: ["expenses-ssr"] })}
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

/* eslint-disable react/prop-types */
import { Button } from "@/components/ui/button";
import Datatable from "@/Pages/Components/Datatable";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDateTimestamp } from "@/lib/utils";
export function LoanTransactionTable({
  data,
  refetch,
  isLoading,
  isRefetching,
  isError,
}) {
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
      accessorKey: "loan_transaction_code",
      header: "Code",
      cell: ({ row }) => (
        <p className="text-xs">{row.original.loan_transaction_code}</p>
      ),
    },
    {
      accessorKey: "loan_transaction_amount",
      header: "Amount",
      cell: ({ row }) => (
        <p className="text-xs">
          {parseFloat(row.original.loan_transaction_amount).toLocaleString()}
        </p>
      ),
    },
    {
      accessorKey: "loan_transaction_narrative",
      header: "Narrative",
      cell: ({ row }) => (
        <p className="text-xs capitalize">
          {row.original.loan_transaction_narrative}
        </p>
      ),
    },
    // {
    //   accessorKey: "loan_transaction_type",
    //   header: "Breakdown",
    //   cell: ({ row }) => {
    //     const transactionBreakdown = JSON.parse(
    //       row.original.loan_transaction_type || "{}"
    //     );
    //     // console.log(row.original);
    //     return (
    //       <ul className="list text-xs capitalize ml-5">
    //         <li>
    //           <strong>Principal:</strong>
    //           {transactionBreakdown.principal?.toLocaleString()}
    //         </li>
    //         <li>
    //           <strong>Interest:</strong>
    //           {transactionBreakdown.interest?.toLocaleString()}
    //         </li>
    //         <li>
    //           <strong>Penalty:</strong>
    //           {transactionBreakdown.penalty?.toLocaleString()}
    //         </li>
    //       </ul>
    //     );
    //   },
    // },
    {
      accessorKey: "loan_transaction_timestamp",
      header: "Timestamp",
      cell: ({ row }) => (
        <p className="text-xs">{formatDateTimestamp(row.original.loan_transaction_timestamp)}</p>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: () => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              ...
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>No Actions</DropdownMenuItem>
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
        isError={isError}
      />
    </>
  );
}

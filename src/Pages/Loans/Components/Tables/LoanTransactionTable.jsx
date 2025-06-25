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

// Flatten grouped data with headers
function flattenGroupedTransactions(data) {
  const grouped = {};
  const flatList = [];

  for (const tx of data) {
    const code = tx.loan_transaction_code || "UNKNOWN";

    if (!grouped[code]) {
      grouped[code] = {
        code,
        total: 0,
        rows: [],
      };
    }

    grouped[code].rows.push(tx);
    grouped[code].total += parseFloat(tx.loan_transaction_amount || 0);
  }

  Object.values(grouped).forEach((group) => {
    // Add fake summary row with marker
    flatList.push({
      isGroupSummary: true,
      code: group.code,
      total: group.total,
    });

    // Add real rows
    flatList.push(...group.rows);
  });

  return flatList;
}

export function LoanTransactionTable({
  data,
  refetch,
  isLoading,
  isRefetching,
  isError,
}) {
  const flattenedData = flattenGroupedTransactions(data || []);

  const columns = [
    {
      id: "select",
      header: () => null,
      cell: ({ row }) => {
        if (row.original.isGroupSummary) return null;
        return (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        );
      },
    },
    {
      accessorKey: "loan_transaction_code",
      header: "Code",
      cell: ({ row }) => {
        if (row.original.isGroupSummary) {
          return (
            <p className="font-bold text-sm">
              Code: {row.original.code} — Total:{" "}
              {row.original.total.toLocaleString()}
            </p>
          );
        }

        return <p className="text-xs">{row.original.loan_transaction_code}</p>;
      },
    },
    {
      accessorKey: "loan_transaction_amount",
      header: "Amount",
      cell: ({ row }) => {
        if (row.original.isGroupSummary) return null;
        return (
          <p className="text-xs">
            {parseFloat(row.original.loan_transaction_amount).toLocaleString()}
          </p>
        );
      },
    },
    {
      accessorKey: "loan_transaction_narrative",
      header: "Narrative",
      cell: ({ row }) => {
        if (row.original.isGroupSummary) return null;
        return (
          <p className="text-xs capitalize">
            {row.original.loan_transaction_narrative}
          </p>
        );
      },
    },
    {
      accessorKey: "loan_transaction_timestamp",
      header: "Timestamp",
      cell: ({ row }) => {
        if (row.original.isGroupSummary) return null;
        return (
          <p className="text-xs">
            {formatDateTimestamp(row.original.loan_transaction_timestamp)}
          </p>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        if (row.original.isGroupSummary) return null;
        return (
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
        );
      },
    },
  ];

  return (
    <Datatable
      columns={columns}
      data={flattenedData}
      fetchData={refetch}
      isLoading={isLoading}
      isRefetching={isRefetching}
      isError={isError}
    />
  );
}

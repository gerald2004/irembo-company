/* eslint-disable react/prop-types */
import Datatable from "@/Pages/Components/Datatable";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDateTimestamp } from "@/lib/utils";
export function LoanHistory({
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
      accessorKey: "action_type",
      header: "Action",
      cell: ({ row }) => (
        <p className="text-xs capitalize">{row.original.action_type}</p>
      ),
    },
    {
      accessorKey: "action_reason",
      header: "Action Reason",
      cell: ({ row }) => (
        <p className="text-xs">{row.original.action_reason}</p>
      ),
    },
    {
      accessorKey: "action_notes",
      header: "Action Notes",
      cell: ({ row }) => (
        <p className="text-xs capitalize">{row.original.action_notes}</p>
      ),
    },
    {
      accessorKey: "user.user_id",
      header: "User",
      cell: ({ row }) => {
        const user = row.original.user || {}; // Handle null case
        return (
          <p className="text-xs capitalize">
            {user.user_firstname
              ? `${user.user_firstname} ${user.user_lastname}`
              : "N/A"}
          </p>
        );
      },
    },
    {
      accessorKey: "branch.branch_id",
      header: "Branch",
      cell: ({ row }) => {
        const branch = row.original.branch || {}; // Handle null case
        return (
          <p className="text-xs capitalize">{branch.branch_name || "N/A"}</p>
        );
      },
    },
    {
      accessorKey: "action_timestamp",
      header: "Timestamp",
      cell: ({ row }) => {
        return (
          <p className="text-xs capitalize">
            {formatDateTimestamp(row.original.action_timestamp) || "N/A"}
          </p>
        );
      },
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

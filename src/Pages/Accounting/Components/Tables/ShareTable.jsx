import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { Checkbox } from "@/components/ui/checkbox";
import "jspdf-autotable";
import Datatable from "@/Pages/Components/Datatable";
import { Badge } from "@/components/ui/badge";
import { formatDateTimestamp } from "@/lib/utils";

export function ShareTable() {
  const navigate = useNavigate();
  const axiosPrivate = useAxiosPrivate();

  const {
    data = [],
    isLoading,
    refetch,
    isRefetching,
    isError,
  } = useQuery({
    queryKey: ["shares"],
    queryFn: async () => {
      const controller = new AbortController();
      const fetchURL = `/accounting/shares`;
      try {
        const response = await axiosPrivate.get(fetchURL, {
          signal: controller.signal,
        });
        // console.log(response.data.data);
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
      accessorKey: "client",
      header: "Client Name",
      cell: ({ row }) => (
        <p className="text-xs">
          {row.original.client.client_type === "individual"
            ? `${row.original.client.client_firstname} ${row.original.client.client_lastname}`
            : `${row.original.client.client_group_name}`}
        </p>
      ),
    },
    {
      accessorKey: "client_account_number",
      header: "Account Number",
      cell: ({ row }) => (
        <p className="text-xs">{row.original.client.client_account_number}</p>
      ),
    },
    {
      accessorKey: "shares_transaction_code",
      header: "Code",
      cell: ({ row }) => (
        <p className="text-xs">{row.original.shares_transaction_code}</p>
      ),
    },
    {
      accessorKey: "shares_transaction_narrative",
      header: "Narrative",
      cell: ({ row }) => (
        <p className="text-xs">{row.original.shares_transaction_narrative}</p>
      ),
    },
    {
      accessorKey: "shares_transaction_type",
      header: "Status",
      cell: ({ row }) => (
        <Badge className="capitalize text-xs">
          {row.original.shares_transaction_type === "in"
            ? "Transfer In"
            : "Transfer Out"}
        </Badge>
      ),
    },
    {
      accessorKey: "shares_transaction_count",
      header: "Count",
      cell: ({ row }) => (
        <p className="capitalize text-xs">
          {row.original.shares_transaction_count}
        </p>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Timestamp",
      cell: ({ row }) => formatDateTimestamp(row.original.created_at),
    },
  ];

  return (
    <>
      <Datatable
        columns={columns}
        data={data?.shares ?? []}
        fetchData={refetch}
        isLoading={isLoading}
        isRefetching={isRefetching}
        // buttonTitle={"+ Buy Shares"}
        buttonMethod={""}
        isError={isError}
      />
    </>
  );
}

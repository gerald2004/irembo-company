import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";

import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { Checkbox } from "@/components/ui/checkbox";

import "jspdf-autotable";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import Datatable from "@/Pages/Components/Datatable";
import { Badge } from "@/components/ui/badge";
import ShareTransactionDialog from "../Forms/ShareTransactionDialog";
import { formatDateTimestamp, hasPermission } from "@/lib/utils";
import useAuth from "@/MiddleWares/Hooks/useAuth";
export function SharesTable() {
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
    queryKey: ["shares", params.id],
    queryFn: async () => {
      const controller = new AbortController();

      const fetchURL = `/accounting/shares/${params.id}`;
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
  const { auth } = useAuth();
  const roles = auth?.roles;
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
      header: "Number of Shares",
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
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shares</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-1xl font-bold">
              {data?.shares_information?.client_share_balance}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Share Price</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-1xl font-bold">
              {data?.shares_information?.share_price?.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Share Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-1xl font-bold">
              {" "}
              {data?.shares_information?.total_shares_value?.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>
      <Datatable
        columns={columns}
        data={data?.shares ?? []}
        fetchData={refetch}
        isLoading={isLoading}
        isRefetching={isRefetching}
        buttonTitle={hasPermission(roles, 100065) ? "+ Buy Shares" : ""}
        buttonMethod={hasPermission(roles, 100065) ? handleOpenModal : ""}
        isError={isError}
      />
      <ShareTransactionDialog
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        refetch={refetch}
      />
    </>
  );
}

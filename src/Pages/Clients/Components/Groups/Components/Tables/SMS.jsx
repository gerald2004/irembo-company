import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";

import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { Checkbox } from "@/components/ui/checkbox";

import "jspdf-autotable";

import Datatable from "@/Pages/Components/Datatable";
import { Badge } from "@/components/ui/badge";
import SendSMS from "../Forms/SendSMS";
import { formatDateTimestamp, hasPermission } from "@/lib/utils";
import useAuth from "@/MiddleWares/Hooks/useAuth";
export function SMS() {
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
    queryKey: ["sms", params.id],
    queryFn: async () => {
            const controller = new AbortController();

      const fetchURL = `/communication/${params.id}/sms`;
      try {
        const response = await axiosPrivate.get(fetchURL, {
          signal: controller.signal,
        });
        return response?.data?.data?.sms ?? [];
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
      accessorKey: "sms_message",
      header: "Message",
      cell: ({ row }) => <p className="text-xs">{row.original.sms_message}</p>,
    },
    {
      accessorKey: "sms_status",
      header: "Status",
      cell: ({ row }) => (
        <Badge className="capitalize text-xs">
          {row.original.sms_status === "Y" ? "Sent" : "Pending"}
        </Badge>
      ),
    },
    {
      accessorKey: "sms_length",
      header: "Length",
      cell: ({ row }) => (
        <p className="capitalize text-xs">{row.original.sms_length}</p>
      ),
    },
    {
      accessorKey: "sms_timestamp",
      header: "Timestamp",
      cell: ({ row }) => (
        <p className="text-xs">{formatDateTimestamp(row.original.sms_timestamp)}</p>
      ),
    },
    {
      accessorKey: "sms_sent_at",
      header: "Sent At",
      cell: ({ row }) => (
        <p className="text-xs">{formatDateTimestamp(row.original.sms_sent_at) ?? "N/A"}</p>
      ),
    },
  ];
  const { auth } = useAuth();
  const roles = auth?.roles;
  return (
    <>
      <Datatable
        columns={columns}
        data={data}
        fetchData={refetch}
        isLoading={isLoading}
        isRefetching={isRefetching}
        buttonTitle={hasPermission(roles, 100061) ? "+ Send SMS" : ""}
        buttonMethod={hasPermission(roles, 100062) ? handleOpenModal : ""}
        isError={isError}
      />
      <SendSMS
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        refetch={refetch}
      />
    </>
  );
}

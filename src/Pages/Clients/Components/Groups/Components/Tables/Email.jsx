import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";

import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { Checkbox } from "@/components/ui/checkbox";

import "jspdf-autotable";

import Datatable from "@/Pages/Components/Datatable";
import { Badge } from "@/components/ui/badge";
import SendEmail from "../Forms/SendEmail";
import { formatDateTimestamp, hasPermission } from "@/lib/utils";
import useAuth from "@/MiddleWares/Hooks/useAuth";
export function Email() {
  const navigate = useNavigate();
  const axiosPrivate = useAxiosPrivate();
  const params = useParams();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);
  const { auth } = useAuth();
  const roles = auth?.roles;
  const {
    data = [],
    isLoading,
    refetch,
    isRefetching,
    isError,
  } = useQuery({
    queryKey: ["email", params.id],
    queryFn: async () => {
            const controller = new AbortController();

      const fetchURL = `/communication/${params.id}/emails`;
      try {
        const response = await axiosPrivate.get(fetchURL, {
          signal: controller.signal,
        });
        return response?.data?.data?.email ?? [];
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
      accessorKey: "email_subject",
      header: "Subject",
      cell: ({ row }) => (
        <p className="text-xs">{row.original.email_subject}</p>
      ),
    },
    {
      accessorKey: "email_status",
      header: "Status",
      cell: ({ row }) => (
        <Badge className="capitalize text-xs">
          {row.original.email_status === "Y" ? "Sent" : "Pending"}
        </Badge>
      ),
    },
    {
      accessorKey: "email_message",
      header: "Message",
      cell: ({ row }) => (
        <p
          className="truncate max-w-[100px] text-xs capitalize"
          title={row.original.email_message}
        >
          {row.original.email_message}
        </p>
      ),
    },
    {
      accessorKey: "email_timestamp",
      header: "Timestamp",
      cell: ({ row }) => (
        <p className="capitalize text-xs">{formatDateTimestamp(row.original.email_timestamp)}</p>
      ),
    },
    {
      accessorKey: "email_sent_at",
      header: "Sent At",
      cell: ({ row }) => (
        <p className="capitalize text-xs">
          {formatDateTimestamp(row.original.email_sent_at) ?? "N/A"}
        </p>
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
        buttonTitle={hasPermission(roles, 100062) ? "+ Send Email" : ""}
        buttonMethod={hasPermission(roles, 100062) ? handleOpenModal : ""}
        isError={isError}
      />
      
      <SendEmail
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        refetch={refetch}
      />
    </>
  );
}

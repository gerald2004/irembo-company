import Datatable from "@/Pages/Components/Datatable";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { useState } from "react";
import LoanFeesDialog from "../Forms/LoanFeesDialog";
import { formatDateTimestamp, hasPermission } from "@/lib/utils";
import useAuth from "@/MiddleWares/Hooks/useAuth";
export function LoanFeesTable() {
  const navigate = useNavigate();
  const axiosPrivate = useAxiosPrivate();
  const params = useParams();

  const {
    data = [],
    refetch,
    isLoading,
    isRefetching,
    isError,
  } = useQuery({
    queryKey: ["loan-fees-data", params.loanid],
    queryFn: async () => {
            const controller = new AbortController();

      const fetchURL = `/loans/charges/${params.loanid}/applications`;
      try {
        const response = await axiosPrivate.get(fetchURL, {
          signal: controller.signal,
        });
        if (!response.data.data) {
          throw new Error(response?.data?.message);
        }
        // console.log(response.data.data.loan_charges);
        return response.data.data.loan_charges;
      } catch (error) {
        if (error?.response?.status === 401) {
          navigate("/", { state: { from: location }, replace: true });
        }
        throw new Error(error?.response?.data?.message);
      }
    },
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);
  const {auth: {roles}} = useAuth();
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
      accessorKey: "loan_charge_code",
      header: "Code",
      cell: ({ row }) => (
        <p className="text-xs">{row?.original?.loan_charge_code}</p>
      ),
    },
    {
      accessorKey: "loan_charge_amount",
      header: "Amount",
      cell: ({ row }) => (
        <p className="text-xs capitalize">
          {parseFloat(row?.original.loan_charge_amount).toLocaleString()}
        </p>
      ),
    },
    {
      accessorKey: "loan_charge_title",
      header: "Loan Charge Reason",
      cell: ({ row }) => (
        <p className="text-xs capitalize">{row?.original?.loan_charge_title}</p>
      ),
    },
    {
      accessorKey: "loan_charge_rate_type",
      header: "Type",
      cell: ({ row }) => (
        <Badge className="text-xs capitalize">
          {row?.original?.loan_charge_rate_type}
        </Badge>
      ),
    },
    {
      accessorKey: "loan_charge_status",
      header: "Status",
      cell: ({ row }) => (
        <Badge className="text-xs capitalize">
          {row?.original?.loan_charge_status}
        </Badge>
      ),
    },
    {
      accessorKey: "income_account",
      header: "Income Account",
      cell: ({ row }) => (
        <p className="text-xs capitalize">
          {row?.original?.income_account?.account_title}
        </p>
      ),
    },
    {
      accessorKey: "receivable_account",
      header: "Receivable Account",
      cell: ({ row }) => (
        <p className="text-xs capitalize">
          {row?.original?.receivable_account?.account_title}
        </p>
      ),
    },
    {
      accessorKey: "loan_charge_timestamp",
      header: "Timestamp",
      cell: ({ row }) => {
        return (
          <p className="text-xs capitalize">
            {formatDateTimestamp(row.original.loan_charge_timestamp) || "N/A"}
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
        buttonTitle={hasPermission(roles, 100095) ? "+ Loans Fees" : ""}
        buttonMethod={hasPermission(roles, 100095) ? handleOpenModal : ""}
      />
      {hasPermission(roles, 100095) && isModalOpen && (
        <LoanFeesDialog
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          refetch={refetch}
        />
      )}
    </>
  );
}

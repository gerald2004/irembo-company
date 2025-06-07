import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Datatable from "@/Pages/Components/Datatable";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import LoanApplicationDialog from "../Forms/LoanApplicationDialog";
import { formatDateTimestamp, hasPermission } from "@/lib/utils";
import useAuth from "@/MiddleWares/Hooks/useAuth";

const LoansTable = () => {
  const { client_id: clientAccountId } = useParams(); // ✅ Get client_account_id from URL
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();

  const [openModal, setOpenModal] = useState(false);

  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => setOpenModal(false);
  const {
    auth: { roles },
  } = useAuth();
  // ✅ Fetch Loan Applications
  const {
    data = [],
    isLoading,
    refetch,
    isRefetching,
    isError,
  } = useQuery({
    queryKey: ["loanApplications", clientAccountId],
    queryFn: async () => {
      const controller = new AbortController();

      const fetchURL = `/loans/${clientAccountId}/applications`;
      try {
        const response = await axiosPrivate.get(fetchURL, {
          signal: controller.signal,
        });
        return response?.data?.data?.loan_applications ?? [];
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
      accessorKey: "loan_application_code",
      header: "Loan Code",
      cell: ({ row }) => (
        <Link
          to={`/loans/${row.original.loan_application_id}`}
          className="capitalize hover:uppercase"
        >
          {row.original.loan_application_code}
        </Link>
      ),
    },
    {
      accessorKey: "loan_application_amount",
      header: "Amount",
      cell: ({ row }) => (
        <Link
          to={`/loans/${row.original.loan_application_id}`}
          className="capitalize hover:uppercase"
        >
          {parseFloat(row.original.loan_application_amount).toLocaleString()}
        </Link>
      ),
    },
    {
      accessorKey: "loan_application_tenure_period",
      header: "Tenure",
      cell: ({ row }) => (
        <Link
          to={`/loans/${row.original.loan_application_id}`}
          className="capitalize hover:uppercase"
        >
          {row.original.loan_application_tenure_period}
        </Link>
      ),
    },
    {
      accessorKey: "loan_product.loan_product_title",
      header: "Loan Product",
      cell: ({ row }) => (
        <Link
          to={`/loans/${row.original.loan_application_id}`}
          className="capitalize hover:uppercase"
        >
          {row.original.loan_product.loan_product_title}
        </Link>
      ),
    },
    {
      accessorKey: "loan_application_status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.loan_application_status;

        return <Badge className={`capitalize`}>{status}</Badge>;
      },
    },
    {
      accessorKey: "loan_application_date",
      header: "Date Applied",
      cell: ({ row }) =>
        formatDateTimestamp(row.original.loan_application_date),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              ...
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {hasPermission(roles, 100068) && (
              <DropdownMenuItem>
                <Link
                  to={`/loans/${row.original.loan_application_id}`}
                  className="capitalize hover:uppercase"
                >
                  View Loan
                </Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* ✅ Loan Applications Table */}
      <Datatable
        columns={columns}
        data={data}
        fetchData={refetch}
        isLoading={isLoading}
        isRefetching={isRefetching}
        isError={isError}
        colSpan={5}
        buttonTitle={hasPermission(roles, 100055) ? "+ Apply for Loan" : ""}
        buttonMethod={hasPermission(roles, 100055) ? handleOpenModal : ""}
      />
      {openModal && (
        <LoanApplicationDialog
          isOpen={openModal}
          onClose={handleCloseModal}
          refetch={refetch}
        />
      )}
    </div>
  );
};

export default LoansTable;

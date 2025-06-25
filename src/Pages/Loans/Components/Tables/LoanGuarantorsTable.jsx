import Datatable from "@/Pages/Components/Datatable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { useState } from "react";
import AlertModal from "@/components/AlertModal";
import { toast } from "@/hooks/use-toast";
import LoanGaurantorDialog from "../Forms/LoanGaurantorDialog";
import EditLoanGaurantorDialog from "../Forms/EditLoanGaurantorDialog";
import { formatDateTimestamp, hasPermission } from "@/lib/utils";
import useAuth from "@/MiddleWares/Hooks/useAuth";
export function LoanGuarantorsTable() {
  const navigate = useNavigate();
  const axiosPrivate = useAxiosPrivate();
  const params = useParams();
  const {
    auth: { roles },
  } = useAuth();
  const {
    data = [],
    refetch,
    isLoading,
    isRefetching,
    isError,
  } = useQuery({
    queryKey: ["loan-guarantor-data", params.loanid],
    queryFn: async () => {
      const controller = new AbortController();
      const fetchURL = `/loans/guarantor/${params.loanid}`;
      try {
        const response = await axiosPrivate.get(fetchURL, {
          signal: controller.signal,
        });
        if (!response.data.data) {
          throw new Error(response?.data?.message);
        }
        return response.data.data.guarantors;
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

  const [isModalOpenEdit, setIsModalOpenEdit] = useState(false);
  const [defaultValues, setDefaultValues] = useState([]);
  const handleOpenModalEdit = (data) => {
    setIsModalOpenEdit(true);
    setDefaultValues(data);
  };
  const handleCloseModalEdit = () => setIsModalOpenEdit(false);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const handleOpenDeleteDialog = (id) => {
    setSelectedId(id);
    setShowDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setSelectedId(null);
    setShowDialog(false);
  };

  const handleDelete = async () => {
    const controller = new AbortController();

    try {
      const response = await axiosPrivate.delete(
        `/loans/${selectedId}/guarantor`,
        { signal: controller.signal }
      );
      toast({ title: "Success", description: response?.data?.messages });
      refetch();
    } catch (error) {
      const errorMessage =
        error?.response?.data?.messages || "No server response";
      toast({
        title: "Uh oh! Something went wrong.",
        variant: "destructive",
        description: errorMessage,
      });
    }
  };
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
      accessorKey: "loan_guarantor_name",
      header: "Name",
      cell: ({ row }) => (
        <p className="text-xs capitalize">
          {row.original.loan_guarantor_name}{" "}
          {row?.original?.loan_guarantor_mode === "member"
            ? `(${row.original.guarantor_account_number})`
            : ""}
        </p>
      ),
    },
    {
      accessorKey: "loan_guarantor_amount",
      header: "Guaranted Amount",
      cell: ({ row }) => (
        <p className="text-xs">
          {parseFloat(row?.original?.loan_guarantor_amount)?.toLocaleString()}
        </p>
      ),
    },
    {
      accessorKey: "loan_guarantor_mode",
      header: "Guarantor Mode",
      cell: ({ row }) => (
        <Badge className="text-xs capitalize">
          {row?.original?.loan_guarantor_mode}
        </Badge>
      ),
    },
    {
      accessorKey: "guranator_contact",
      header: "Contact",
      cell: ({ row }) => (
        <p className="text-xs capitalize">{row?.original?.guranator_contact}</p>
      ),
    },
    {
      accessorKey: "guarantor_gender",
      header: "Gender",
      cell: ({ row }) => (
        <p className="text-xs capitalize">{row?.original?.guarantor_gender}</p>
      ),
    },
    {
      accessorKey: "loan_guarantor_type",
      header: "Status",
      cell: ({ row }) => (
        <Badge className="text-xs capitalize">
          {row?.original?.loan_guarantor_type}
        </Badge>
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
      accessorKey: "loan_guarantor_timestamp",
      header: "Timestamp",
      cell: ({ row }) => {
        return (
          <p className="text-xs capitalize">
            {formatDateTimestamp(row.original.loan_guarantor_timestamp) ||
              "N/A"}
          </p>
        );
      },
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
            {hasPermission(roles, 100093) && (
              <DropdownMenuItem
                onClick={() => handleOpenModalEdit(row.original)}
              >
                Edit
              </DropdownMenuItem>
            )}
            {hasPermission(roles, 100094) && (
              <DropdownMenuItem
                onClick={() =>
                  handleOpenDeleteDialog(row.original.loan_guarantor_id)
                }
              >
                Delete
              </DropdownMenuItem>
            )}
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
        buttonTitle={hasPermission(roles, 100092) ? "+ Add Guarantor" : ""}
        buttonMethod={hasPermission(roles, 100092) ? handleOpenModal : ""}
      />
      {hasPermission(roles, 100092) && isModalOpen && (
        <LoanGaurantorDialog
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          refetch={refetch}
        />
      )}
      {hasPermission(roles, 100093) && isModalOpenEdit && (
        <EditLoanGaurantorDialog
          isOpen={isModalOpenEdit}
          onClose={handleCloseModalEdit}
          refetch={refetch}
          defaultValues={defaultValues}
        />
      )}
      {hasPermission(roles, 100094) && showDialog && (
        <AlertModal
          showDialog={showDialog}
          setShowDialog={handleCloseDeleteDialog}
          title="Are you absolutely sure?"
          message="Are you sure you want to delete this guarantor?"
          method={handleDelete}
          buttonName="Delete"
        />
      )}
    </>
  );
}

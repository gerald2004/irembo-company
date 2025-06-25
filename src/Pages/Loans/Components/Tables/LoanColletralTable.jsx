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
import LoanColletralDialog from "../Forms/LoanColletralDialog";
import { useState } from "react";
import EditLoanColletralDialog from "../Forms/EditLoanColletralDialog";
import AlertModal from "@/components/AlertModal";
import { toast } from "@/hooks/use-toast";
import { formatDateTimestamp, hasPermission } from "@/lib/utils";
import useAuth from "@/MiddleWares/Hooks/useAuth";
export function LoanColletralTable() {
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
    queryKey: ["loan-colletral-data", params.loanid],
    queryFn: async () => {
      const controller = new AbortController();

      const fetchURL = `/loans/colletral/${params.loanid}/applications`;
      try {
        const response = await axiosPrivate.get(fetchURL, {
          signal: controller.signal,
        });
        if (!response.data.data) {
          throw new Error(response?.data?.message);
        }
        return response.data.data.loan_collaterals;
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
        `/loans/colletral/${selectedId}`,
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
  const {
    auth: { roles },
  } = useAuth();
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
      accessorKey: "loan_colletral_title",
      header: "Title",
      cell: ({ row }) => (
        <p className="text-xs capitalize">
          {row.original.loan_colletral_title}
        </p>
      ),
    },
    {
      accessorKey: "loan_colletral_regno",
      header: "Registration Details",
      cell: ({ row }) => (
        <p className="text-xs">{row.original.loan_colletral_regno}</p>
      ),
    },
    {
      accessorKey: "loan_colletral_value",
      header: "Colletral Value",
      cell: ({ row }) => (
        <p className="text-xs capitalize">
          {parseFloat(row?.original?.loan_colletral_value)?.toLocaleString()}
        </p>
      ),
    },
    {
      accessorKey: "loan_colletral_notes",
      header: "Notes",
      cell: ({ row }) => (
        <p className="text-xs capitalize">
          {row?.original?.loan_colletral_notes}
        </p>
      ),
    },
    {
      accessorKey: "colletral_status",
      header: "Status",
      cell: ({ row }) => (
        <Badge className="text-xs capitalize">
          {row?.original?.colletral_status}
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
      accessorKey: "loan_colletral_timestamp",
      header: "Timestamp",
      cell: ({ row }) => {
        return (
          <p className="text-xs capitalize">
            {formatDateTimestamp(row.original.loan_colletral_timestamp) ||
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
            {hasPermission(roles, 100087) && (
              <DropdownMenuItem
                onClick={() => handleOpenModalEdit(row.original)}
              >
                Edit
              </DropdownMenuItem>
            )}
            {hasPermission(roles, 100088) && (
              <DropdownMenuItem
                onClick={() =>
                  handleOpenDeleteDialog(row.original.loan_colletral_id)
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
        buttonTitle={hasPermission(roles, 100086) ? "+ Colletral Sercuity" : ""}
        buttonMethod={hasPermission(roles, 100086) ? handleOpenModal : ""}
      />
      {hasPermission(roles, 100086) && isModalOpen && (
        <LoanColletralDialog
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          refetch={refetch}
        />
      )}
      {hasPermission(roles, 100087) && isModalOpenEdit && (
        <EditLoanColletralDialog
          isOpen={isModalOpenEdit}
          onClose={handleCloseModalEdit}
          refetch={refetch}
          defaultValues={defaultValues}
        />
      )}
      {hasPermission(roles, 100088) && showDialog && (
        <AlertModal
          showDialog={showDialog}
          setShowDialog={handleCloseDeleteDialog}
          title="Are you absolutely sure?"
          message="Are you sure you want to delete this colletral sercuity?"
          method={hasPermission(roles, 100088) ? handleDelete : ""}
          buttonName="Delete"
        />
      )}
    </>
  );
}

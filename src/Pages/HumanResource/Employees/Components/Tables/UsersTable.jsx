import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Checkbox } from "@/components/ui/checkbox";

import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import Datatable from "@/Pages/Components/Datatable";
import { toast } from "@/hooks/use-toast";
import AlertModal from "@/components/AlertModal";
import EditUserDialog from "../Forms/EditUserDialog";
import AddUserDialog from "../Forms/AddUserDialog";
import useAuth from "@/MiddleWares/Hooks/useAuth";
import { hasPermission } from "@/lib/utils";

export function UsersTable() {
  const navigate = useNavigate();
  const axiosPrivate = useAxiosPrivate();
  const [isModalOpenEdit, setIsModalOpenEdit] = useState(false);
  const [defaultData, setDefaultData] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModalEdit = (data) => {
    setIsModalOpenEdit(true);
    setDefaultData(data);
  };

  const handleCloseModalEdit = () => {
    setIsModalOpenEdit(false);
    setDefaultData([]);
  };

  // ✅ Fetch Users
  const {
    data = [],
    isLoading,
    refetch,
    isRefetching,
    isError,
  } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const controller = new AbortController();

      try {
        const response = await axiosPrivate.get(`/business/employees`, {
          signal: controller.signal,
        });
        return response?.data?.data?.users ?? [];
      } catch (error) {
        if (error?.response?.status === 401) {
          navigate("/", { state: { from: location }, replace: true });
        }
        throw error;
      }
    },
    keepPreviousData: true,
  });

  // ✅ Handle Delete
  const handleOpenDeleteDialog = (id) => {
    setSelectedId(id);
    setShowDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setSelectedId(null);
    setShowDialog(false);
  };

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleDeleteUser = async () => {
    const controller = new AbortController();

    try {
      const response = await axiosPrivate.delete(
        `/business/employees/${selectedId}`,
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

  // ✅ Table Columns
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
      accessorKey: "user_identification_code",
      header: "User Code",
      cell: ({ row }) => (
        <Link
          to={
            hasPermission(roles, 100173)
              ? `/staff-management/${row.original.user_id}`
              : ""
          }
          className="capitalize hover:uppercase"
        >
          {row.original.user_identification_code}
        </Link>
      ),
    },
    {
      accessorKey: "user_firstname",
      header: "First Name",
      cell: ({ row }) => (
        <Link
          to={
            hasPermission(roles, 100173)
              ? `/staff-management/${row.original.user_id}`
              : ""
          }
          className="capitalize hover:uppercase"
        >
          {row.original.user_firstname}
        </Link>
      ),
    },
    {
      accessorKey: "user_lastname",
      header: "Last Name",
      cell: ({ row }) => (
        <Link
          to={
            hasPermission(roles, 100173)
              ? `/staff-management/${row.original.user_id}`
              : ""
          }
          className="capitalize hover:uppercase"
        >
          {row.original.user_lastname}
        </Link>
      ),
    },
    {
      accessorKey: "user_email",
      header: "Email",
      cell: ({ row }) => (
        <Link
          to={
            hasPermission(roles, 100173)
              ? `/staff-management/${row.original.user_id}`
              : ""
          }
        >
          {row.original.user_email}
        </Link>
      ),
    },
    {
      accessorKey: "user_status",
      header: "Status",
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.user_status === "active" ? "default" : "secondary"
          }
          className="capitalize"
        >
          {row.original.user_status}
        </Badge>
      ),
    },
    {
      accessorKey: "user_login_attempts",
      header: "Login Attempts",
      cell: ({ row }) =>
        row.original.user_login_attempts > 3 ? (
          <Badge variant="destructive">
            Locked: {row.original.user_login_attempts}
          </Badge>
        ) : (
          <Badge variant={"default"}>
            Unlocked: {row.original.user_login_attempts}
          </Badge>
        ),
    },
    {
      accessorKey: "role.role_title",
      header: "Role",
      cell: ({ row }) => <p>{row.original.role?.role_title || "N/A"}</p>,
    },
    {
      accessorKey: "branch.branch_name",
      header: "Branch",
      cell: ({ row }) => <p>{row.original.branch?.branch_name || "N/A"}</p>,
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
            {hasPermission(roles, 100173) && (
              <DropdownMenuItem>
                <Link to={`/staff-management/${row.original.user_id}`}>
                  View Staff
                </Link>
              </DropdownMenuItem>
            )}
            {hasPermission(roles, 100113) && (
              <DropdownMenuItem
                onSelect={() => handleOpenModalEdit(row.original)}
              >
                Edit Staff
              </DropdownMenuItem>
            )}
            {hasPermission(roles, 100114) && (
              <DropdownMenuItem
                onClick={() => handleOpenDeleteDialog(row.original.user_id)}
              >
                Delete Staff
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
        buttonTitle={hasPermission(roles, 100112) ? "+ Add Staff" : ""}
        buttonMethod={hasPermission(roles, 100112) ? handleOpenModal : ""}
        isError={isError}
      />
      {hasPermission(roles, 100112) && isModalOpen && (
        <AddUserDialog
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          refetch={refetch}
        />
      )}
      {/* ✅ Edit User Modal */}
      {isModalOpenEdit && hasPermission(roles, 100113) && (
        <EditUserDialog
          isOpen={isModalOpenEdit}
          onClose={handleCloseModalEdit}
          refetch={refetch}
          defaultValues={defaultData}
        />
      )}
      {/* ✅ Delete Confirmation Modal */}
      {hasPermission(roles, 100114) && showDialog && (
        <AlertModal
          showDialog={showDialog}
          setShowDialog={handleCloseDeleteDialog}
          title="Are you sure?"
          message="Do you want to delete this staff?"
          method={handleDeleteUser}
          buttonName="Delete"
        />
      )}
    </>
  );
}

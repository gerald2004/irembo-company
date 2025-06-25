import { useState } from "react";

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

import "jspdf-autotable";

import Datatable from "@/Pages/Components/Datatable";
import AlertModal from "@/components/AlertModal";
import { formatDateTimestamp } from "@/lib/utils";
import { useRoles } from "@/Queries/Settings/roles";
import { Link, useNavigate } from "react-router-dom";
export function RolesTable() {
  const navigate = useNavigate();
  const [showDialog, setShowDialog] = useState(false);

  const { data = [], isLoading, refetch, isRefetching, isError } = useRoles();
  const handleOpenDeleteDialog = () => {
    setShowDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setShowDialog(false);
  };
  const handleNavigate = () => navigate("/system-roles/add-role");
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
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <Link
          className="capitalize hover:uppercase"
          to={`/system-roles/edit-role/${row.original.id}`}
        >
          {row.original.name}
        </Link>
      ),
    },

    {
      accessorKey: "timestamp",
      header: "Timestamp",
      cell: ({ row }) => (
        <p className="capitalize">
          {formatDateTimestamp(row.original.timestamp)}
        </p>
      ),
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
            <DropdownMenuItem>
              <Link to={`/system-roles/edit-role/${row.original.id}`}>
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleOpenDeleteDialog(row.original.id)}
            >
              Delete
            </DropdownMenuItem>
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
        buttonTitle={"+ Role"}
        buttonMethod={handleNavigate}
        isError={isError}
      />

      <AlertModal
        showDialog={showDialog}
        setShowDialog={handleCloseDeleteDialog}
        title="Are you absolutely sure?"
        message="Are you sure you want to delete this role?"
        method={""}
        buttonName="Okay"
      />
    </>
  );
}

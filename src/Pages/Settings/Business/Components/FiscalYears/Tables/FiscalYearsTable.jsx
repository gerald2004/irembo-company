import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import AddFiscalYearDialog from "../Forms/AddFiscalYearDialog";
import EditFiscalYearDialog from "../Forms/EditFiscalYearDialog";

export function FiscalYearsTable() {
  const navigate = useNavigate();
  const axiosPrivate = useAxiosPrivate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalOpenEdit, setIsModalOpenEdit] = useState(false);
  const [defaultData, setDefaultData] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  const handleOpenModalEdit = (data) => {
    setIsModalOpenEdit(true);
    setDefaultData(data);
  };

  const handleCloseModalEdit = () => {
    setIsModalOpenEdit(false);
    setDefaultData([]);
  };

  // ✅ Fetch Fiscal Years
  const {
    data = [],
    isLoading,
    refetch,
    isRefetching,
    isError,
  } = useQuery({
    queryKey: ["fiscal-years"],
    queryFn: async () => {
            const controller = new AbortController();

      const fetchURL = `/settings/fiscal-years`;
      try {
        const response = await axiosPrivate.get(fetchURL, {
          signal: controller.signal,
        });
        return response?.data?.data?.fiscal_years ?? [];
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

  const handleDeleteFiscalYear = async () => {
    try {
      const response = await axiosPrivate.delete(
        `/settings/fiscal-years/${selectedId}`
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
      accessorKey: "name",
      header: "Fiscal Year",
      cell: ({ row }) => <p className="capitalize">{row.original.name}</p>,
    },
    {
      accessorKey: "start_date",
      header: "Start Date",
      cell: ({ row }) => <p>{row.original.start_date}</p>,
    },
    {
      accessorKey: "end_date",
      header: "End Date",
      cell: ({ row }) => <p>{row.original.end_date}</p>,
    },
    {
      accessorKey: "is_active",
      header: "Active",
      cell: ({ row }) => (
        <Badge variant={row.original.is_active ? "default" : "secondary"}>
          {row.original.is_active ? "Active" : "Inactive"}
        </Badge>
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
            <DropdownMenuItem
              onSelect={() => handleOpenModalEdit(row.original)}
            >
              Edit Fiscal Year
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleOpenDeleteDialog(row.original.id)}
            >
              Delete Fiscal Year
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
        buttonTitle={"+ Add Fiscal Year"}
        buttonMethod={handleOpenModal}
        isError={isError}
      />
      {/* ✅ Add Fiscal Year Modal */}
      <AddFiscalYearDialog
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        refetch={refetch}
      />
      {/* ✅ Edit Fiscal Year Modal */}
      <EditFiscalYearDialog
        isOpen={isModalOpenEdit}
        onClose={handleCloseModalEdit}
        refetch={refetch}
        defaultValues={defaultData}
      />
      {/* ✅ Delete Confirmation Modal */}
      <AlertModal
        showDialog={showDialog}
        setShowDialog={handleCloseDeleteDialog}
        title="Are you sure?"
        message="Do you want to delete this fiscal year?"
        method={handleDeleteFiscalYear}
        buttonName="Delete"
      />
    </>
  );
}

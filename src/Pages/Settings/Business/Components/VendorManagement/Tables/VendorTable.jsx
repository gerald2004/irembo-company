import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
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

import Datatable from "@/Pages/Components/Datatable";
import { toast } from "@/hooks/use-toast";
import AlertModal from "@/components/AlertModal";
import AddVendorDialog from "../Forms/AddVendorDialog";
import EditVendorDialog from "../Forms/EditVendorDialog";

export function VendorTable() {
  const navigate = useNavigate();
  const axiosPrivate = useAxiosPrivate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalOpenEdit, setIsModalOpenEdit] = useState(false);
  const [defaultData, setDefaultData] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  // ✅ Handle Modals
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

  // ✅ Fetch Vendors
  const {
    data = [],
    isLoading,
    refetch,
    isRefetching,
    isError,
  } = useQuery({
    queryKey: ["vendors"],
    queryFn: async () => {
            const controller = new AbortController();

      const fetchURL = `/accounting/vendors/account`;
      try {
        const response = await axiosPrivate.get(fetchURL, {
          signal: controller.signal,
        });
        return response?.data?.data?.vendors ?? [];
      } catch (error) {
        if (error?.response?.status === 401) {
          navigate("/", { state: { from: location }, replace: true });
        }
        throw error;
      }
    },
    keepPreviousData: true,
  });

  // ✅ Handle Delete Vendor
  const handleOpenDeleteDialog = (id) => {
    setSelectedId(id);
    setShowDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setSelectedId(null);
    setShowDialog(false);
  };

  const handleDeleteVendor = async () => {
          const controller = new AbortController();

    try {
      const response = await axiosPrivate.delete(
        `/accounting/vendors/account/${selectedId}`,
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
      accessorKey: "vendor_firstname",
      header: "Vendor Name",
      cell: ({ row }) => (
        <p
          className="capitalize hover:uppercase"
        >
          {row.original.vendor_firstname} {row.original.vendor_lastname}
        </p>
      ),
    },
    {
      accessorKey: "vendor_company",
      header: "Company",
      cell: ({ row }) => <p>{row.original.vendor_company || "N/A"}</p>,
    },
    {
      accessorKey: "vendor_contact",
      header: "Contact",
      cell: ({ row }) => <p>{row.original.vendor_contact}</p>,
    },
    {
      accessorKey: "vendor_email",
      header: "Email",
      cell: ({ row }) => <p>{row.original.vendor_email || "N/A"}</p>,
    },
    {
      accessorKey: "vendor_address",
      header: "Address",
      cell: ({ row }) => <p>{row.original.vendor_address || "N/A"}</p>,
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
            <DropdownMenuItem
              onSelect={() => handleOpenModalEdit(row.original)}
            >
              Edit Vendor
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleOpenDeleteDialog(row.original.vendor_id)}
            >
              Delete Vendor
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
        buttonTitle={"+ Add Vendor"}
        buttonMethod={handleOpenModal}
        isError={isError}
      />
      {/* ✅ Add Vendor Modal */}
      <AddVendorDialog
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        refetch={refetch}
      />
      {/* ✅ Edit Vendor Modal */}
      <EditVendorDialog
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
        message="Do you want to delete this vendor?"
        method={handleDeleteVendor}
        buttonName="Delete"
      />
    </>
  );
}

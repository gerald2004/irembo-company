import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import useAuth from "@/MiddleWares/Hooks/useAuth";
import { hasPermission } from "@/lib/utils";
import SalaryAdvanceApplicationDialog from "./Components/Forms/SalaryAdvanceApplicationDialog";
import ApproveSalaryAdvanceDialog from "./Components/Forms/ApproveSalaryAdvanceDialog";
import RejectSalaryAdvanceDialog from "./Components/Forms/RejectSalaryAdvanceDialog";
import { salaryAdvanceStatusBadge } from "./salaryAdvanceStatusBadge";

const SalaryAdvanceApplications = () => {
  const navigate = useNavigate();
  const axiosPrivate = useAxiosPrivate();
  const {
    auth: { roles },
  } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const {
    data = [],
    isLoading,
    refetch,
    isRefetching,
    isError,
  } = useQuery({
    queryKey: ["salary-advance-applications"],
    queryFn: async () => {
      const controller = new AbortController();
      try {
        const response = await axiosPrivate.get(`/salary-advance/applications`, {
          signal: controller.signal,
        });
        return response?.data?.data?.salary_advance_applications ?? [];
      } catch (error) {
        if (error?.response?.status === 401) {
          navigate("/", { state: { from: location }, replace: true });
        }
        throw error;
      }
    },
    keepPreviousData: true,
  });

  const handleOpenApprove = (id) => {
    setSelectedId(id);
    setShowApproveDialog(true);
  };
  const handleCloseApprove = () => {
    setSelectedId(null);
    setShowApproveDialog(false);
  };

  const handleOpenReject = (id) => {
    setSelectedId(id);
    setShowRejectDialog(true);
  };
  const handleCloseReject = () => {
    setSelectedId(null);
    setShowRejectDialog(false);
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
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => (
        <Link
          to={`/salary-advance/${row.original.id}`}
          className="font-medium hover:underline"
        >
          {row.original.code}
        </Link>
      ),
    },
    {
      id: "staff",
      header: "Staff",
      cell: ({ row }) => (
        <p>
          {row.original.user
            ? `${row.original.user.firstname ?? ""} ${row.original.user.lastname ?? ""}`.trim()
            : `#${row.original.user_id}`}
        </p>
      ),
    },
    {
      accessorKey: "amount_requested",
      header: "Amount Requested",
      cell: ({ row }) => (
        <p>{Number(row.original.amount_requested ?? 0).toLocaleString()}</p>
      ),
    },
    {
      accessorKey: "outstanding_balance",
      header: "Outstanding",
      cell: ({ row }) => (
        <p>{Number(row.original.outstanding_balance ?? 0).toLocaleString()}</p>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => salaryAdvanceStatusBadge(row.original.status),
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
              <Link to={`/salary-advance/${row.original.id}`}>View</Link>
            </DropdownMenuItem>
            {row.original.status === "pending" && hasPermission(roles, 100623) && (
              <DropdownMenuItem onSelect={() => handleOpenApprove(row.original.id)}>
                Approve
              </DropdownMenuItem>
            )}
            {row.original.status === "pending" && hasPermission(roles, 100624) && (
              <DropdownMenuItem onSelect={() => handleOpenReject(row.original.id)}>
                Reject
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="/dashboard">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Salary Advances</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <div className="flex items-center justify-between space-y-2">
            <h5 className="text-2xl font-bold tracking-tight">
              Salary Advance Applications
            </h5>
          </div>
          <Datatable
            columns={columns}
            data={data}
            fetchData={refetch}
            isLoading={isLoading}
            isRefetching={isRefetching}
            buttonTitle={hasPermission(roles, 100622) ? "+ Apply" : ""}
            buttonMethod={
              hasPermission(roles, 100622) ? () => setIsModalOpen(true) : ""
            }
            isError={isError}
          />
        </div>
      </div>

      {hasPermission(roles, 100622) && (
        <SalaryAdvanceApplicationDialog
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          refetch={refetch}
        />
      )}

      <RejectSalaryAdvanceDialog
        isOpen={showRejectDialog}
        onClose={handleCloseReject}
        refetch={refetch}
        applicationId={selectedId}
      />

      <ApproveSalaryAdvanceDialog
        isOpen={showApproveDialog}
        onClose={handleCloseApprove}
        refetch={refetch}
        applicationId={selectedId}
      />
    </>
  );
};

export default SalaryAdvanceApplications;

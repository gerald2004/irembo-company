import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import useBranchFilter from "@/MiddleWares/Hooks/useBranchFilter";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import DatatableReport from "@/Pages/Components/DatatableReport";
import { formatDateTimestamp } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useState, useRef } from "react";
import LoanGeneralReportQuery from "../Queries/LoanGeneralReportQuery";

const EmailReport = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const tableRef = useRef(null);
  const { branchKey } = useBranchFilter();
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    branch_id: String(branchKey ?? ""),
    user_id: "",
  });
  const {
    data = [],
    isLoading,
    refetch,
    isRefetching,
    isError,
  } = useQuery({
    queryKey: ["emails-reports", filters],
    queryFn: async () => {
      const controller = new AbortController();
      const fetchURL = `reports/communications/emails`;
      try {
        const response = await axiosPrivate.get(fetchURL, {
          params: {
            startDate: filters.startDate,
            endDate: filters.endDate,
            branch_id: filters.branch_id,
            user_id: filters.user_id,
          },
          signal: controller.signal,
        });
        return response?.data?.data ?? [];
      } catch (error) {
        if (error?.response?.status === 401) {
          navigate("/", { state: { from: location }, replace: true });
        }
        throw error;
      }
    },
    placeholderData: (prev) => prev,
  });

  const columns = [
    {
      accessorKey: "subject",
      header: "Subject",
      cell: ({ row }) => (
        <p className="capitalize text-xs">{row.original.subject}</p>
      ),
    },
    {
      accessorKey: "address",
      header: "Emails",
      cell: ({ row }) => (
        <p className="lowercase text-xs">{row.original.address}</p>
      ),
    },

    {
      accessorKey: "message",
      header: "Message",
      cell: ({ row }) => (
        <p className="capitalize text-xs">{row.original.message}</p>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge className="capitalize text-xs">
          {row.original.sms_status === "Y" ? "Sent" : "Pending"}
        </Badge>
      ),
    },
    {
      accessorKey: "email_timestamp",
      header: "Timestamp",
      cell: ({ row }) => (
        <p className="capitalize text-xs">
          {formatDateTimestamp(row.original.email_timestamp)}
        </p>
      ),
    },
  ];
  const handleFilterChange = (data) => {
    setFilters(data);
    refetch();
  };
  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="/dashboard">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink to="/communication-reports">
              Communication Reports
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Emails Reports</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <div className="flex items-center justify-between space-y-2">
            <h5 className="text-2xl font-bold tracking-tight">Email Report</h5>
          </div>
          <LoanGeneralReportQuery show={{ officer: false, status: true }} statusOptions={[{ value: 'delivered', label: 'Delivered' }, { value: 'failed', label: 'Failed' }, { value: 'pending', label: 'Pending' }]}
            onFilterChange={handleFilterChange}
            isRefetching={isRefetching}
            refetch={refetch}
            data={data}
            tableRef={tableRef}
            filters={filters}
            colSpan={2}
            mode={{
              format: "A4-L",
              orientation: "L",
            }}
            title={"Email Report"}
          />
          <DatatableReport
            ref={tableRef}
            columns={columns}
            data={data ?? []}
            fetchData={refetch}
            isLoading={isLoading}
            isRefetching={isRefetching}
            isError={isError}
          />
        </div>
      </div>
    </>
  );
};

export default EmailReport;

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { formatDateTimestamp } from "@/lib/utils";
import DatatableReportTwo from "@/Pages/Components/DatatableReportTwo";
import { useState, useRef } from "react";
import LoanGeneralReportQuery from "./Components/Blocks/Queries/LoanGeneralReportQuery";

const AuditTrialReport = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const tableRef = useRef(null);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    branch_id: "",
    user_id: "",
  });
  const {
    data = [],
    isLoading,
    refetch,
    isRefetching,
    isError,
  } = useQuery({
    queryKey: ["audit-trail-reports", filters],
    queryFn: async () => {
      const controller = new AbortController();
      const fetchURL = `reports/audit-trail`;
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
    keepPreviousData: true,
  });
  const processedData = data?.map((audit) => ({
    ...audit,
    name: `${audit.user.user_firstname} ${audit.user.user_lastname}`,
    branch_name: audit.branch.branch_name,
  }));
  const columns = [
    {
      accessorKey: "action_type",
      header: "Action Type",
      cell: ({ row }) => (
        <span className="text-xs">{row.original.action_type}</span>
      ),
    },
    {
      accessorKey: "action_description",
      header: "Description",
      cell: ({ row }) => (
        <span className="text-xs">{row.original.action_description}</span>
      ),
    },
    {
      accessorKey: "action_table",
      header: "Section",
      cell: ({ row }) => (
        <span className="text-xs">{row.original.action_table}</span>
      ),
    },
    {
      accessorKey: "action_record_id",
      header: "Record ID",
      cell: ({ row }) => (
        <span className="text-xs">
          {row.original.action_record_id ?? "N/A"}
        </span>
      ),
    },
    {
      accessorKey: "name",
      header: "User",
      cell: ({ row }) => <span className="text-xs">{row.original.name}</span>,
    },
    {
      accessorKey: "branch_name",
      header: "Branch",
      cell: ({ row }) => (
        <span className="text-xs">{row.original.branch_name}</span>
      ),
    },
    {
      accessorKey: "request_ip",
      header: "IP Address",
      cell: ({ row }) => (
        <span className="text-xs">{row.original.request_ip}</span>
      ),
    },
    {
      accessorKey: "user_agent",
      header: "User Agent",
      cell: ({ row }) => (
        <span className="text-xs">{row.original.user_agent}</span>
      ),
    },
    {
      accessorKey: "device",
      header: "Device",
      cell: ({ row }) => <span className="text-xs">{row.original.device}</span>,
    },
    {
      accessorKey: "platform",
      header: "Platform",
      cell: ({ row }) => (
        <span className="text-xs">{row.original.platform}</span>
      ),
    },
    {
      accessorKey: "browser",
      header: "Broswer",
      cell: ({ row }) => (
        <span className="text-xs">{row.original.browser}</span>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-xs">
          {formatDateTimestamp(row.original.created_at)}
        </span>
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
            <BreadcrumbPage>Audit Trail Reports</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <div className="flex items-center justify-between space-y-2">
            <h5 className="text-2xl font-bold tracking-tight">
              Audit Trail Report
            </h5>
          </div>
          <LoanGeneralReportQuery
            onFilterChange={handleFilterChange}
            isRefetching={isRefetching}
            refetch={refetch}
            data={processedData}
            tableRef={tableRef}
            filters={filters}
            colSpan={2}
            mode={{
              format: "A4-L",
              orientation: "L",
            }}
            title={"Audit Trail Report"}
          />
          <div className="max-w-[1150px]">
            {" "}
            {/* adjust min-width as needed */}
            <DatatableReportTwo
              ref={tableRef}
              columns={columns}
              data={processedData ?? []}
              fetchData={refetch}
              isLoading={isLoading}
              isRefetching={isRefetching}
              isError={isError}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default AuditTrialReport;

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
import {  useNavigate } from "react-router-dom";
import DatatableReport from "@/Pages/Components/DatatableReport";
import { formatDateTimestamp } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useState, useRef } from "react";
import LoanGeneralReportQuery from "../Queries/LoanGeneralReportQuery";

const SMSReport = () => {
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
    queryKey: ["sms-reports", filters],
    queryFn: async () => {
      const controller = new AbortController();
      const fetchURL = `reports/communications/sms`;
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

  const columns = [
    {
      accessorKey: "sms_contact",
      header: "Contact",
      cell: ({ row }) => (
        <p className="capitalize text-xs">{row.original.sms_contact}</p>
      ),
    },
    {
      accessorKey: "sms_length",
      header: "Length",
      cell: ({ row }) => (
        <p className="capitalize text-xs">
          {parseFloat(row.original.sms_length).toLocaleString()}
        </p>
      ),
    },

    {
      accessorKey: "sms_message",
      header: "Message",
      cell: ({ row }) => (
        <p className="capitalize text-xs">{row.original.sms_message}</p>
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
      accessorKey: "sms_timestamp",
      header: "Timestamp",
      cell: ({ row }) => (
        <p className="capitalize text-xs">
          {formatDateTimestamp(row.original.sms_timestamp)}
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
            <BreadcrumbPage>SMS Reports</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <div className="flex items-center justify-between space-y-2">
            <h5 className="text-2xl font-bold tracking-tight">SMS Report</h5>
          </div>
          <LoanGeneralReportQuery
            onFilterChange={handleFilterChange}
            isRefetching={isRefetching}
            refetch={refetch}
            data={data?.data}
            tableRef={tableRef}
            filters={filters}
            colSpan={2}
            mode={{
              format: "A4-L",
              orientation: "L",
            }}
            title={"SMS Report"}
          />
          <DatatableReport
            ref={tableRef}
            columns={columns}
            data={data?.data ?? []}
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

export default SMSReport;

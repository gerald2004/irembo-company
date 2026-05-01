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
    placeholderData: (prev) => prev,
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

  const smsRows     = data?.data ?? data ?? [];
  const delivered   = data?.meta?.delivered ?? smsRows.filter(r => r.status === "Y").length;
  const failed      = data?.meta?.failed    ?? smsRows.filter(r => r.status === "N").length;
  const total       = data?.meta?.total     ?? smsRows.length;
  const delivRate   = total > 0 ? Math.round((delivered / total) * 100) : 0;

  const KPI = ({ label, value, sub, accent = "bg-blue-500" }) => (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className={`h-1 ${accent}`} />
      <div className="p-4">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
        <p className="text-xl font-bold mt-1">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </div>
    </div>
  );

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
          <LoanGeneralReportQuery show={{ officer: false, status: true }}
            statusOptions={[{ value: "Y", label: "Delivered" }, { value: "N", label: "Failed" }]}
            onFilterChange={handleFilterChange}
            isRefetching={isRefetching}
            data={smsRows}
            tableRef={tableRef}
            filters={filters}
            colSpan={2}
            mode={{ format: "A4-L", orientation: "L" }}
            title="SMS Report"
          />
          {/* KPI Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KPI label="Total Messages" value={total}        sub="In selected period" accent="bg-blue-500" />
            <KPI label="Delivered"      value={delivered}    sub="Successfully sent"  accent="bg-emerald-500" />
            <KPI label="Failed"         value={failed}       sub="Delivery failures"  accent="bg-red-500" />
            <KPI label="Delivery Rate"  value={`${delivRate}%`} sub="Success rate"    accent="bg-violet-500" />
          </div>
          <DatatableReport
            ref={tableRef}
            columns={columns}
            data={smsRows}
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

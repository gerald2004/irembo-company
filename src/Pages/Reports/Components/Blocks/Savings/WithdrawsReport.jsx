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
import { Link, useNavigate } from "react-router-dom";
import DatatableReport from "@/Pages/Components/DatatableReport";
import LoanGeneralReportQuery from "../Queries/LoanGeneralReportQuery";
import { useState, useRef } from "react";
import { formatDateTimestamp } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const WithdrawsReport = () => {
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
    queryKey: ["withdraws-reports", filters],
    queryFn: async () => {
      const controller = new AbortController();
      const fetchURL = `reports/savings/withdraws`;
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
      accessorKey: "account",
      header: "Account Number",
      cell: ({ row }) => (
        <Link
          to={`/clients/${
            row.original.client_type === "individual" ? "individual" : "group"
          }/${row.original.client_id}`}
          className="capitalize text-xs"
        >
          {" "}
          {row.original.account}
        </Link>
      ),
    },
    {
      accessorKey: "client",
      header: "Client Name",
      cell: ({ row }) => (
        <Link
          to={`/clients/${
            row.original.client_type === "individual" ? "individual" : "group"
          }/${row.original.client_id}`}
          className="capitalize text-xs"
        >
          {" "}
          {row.original.client}
        </Link>
      ),
    },
    {
      accessorKey: "code",
      header: "Deposit Number",
      cell: ({ row }) => (
        <p className="capitalize text-xs">{row.original.code}</p>
      ),
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => (
        <p className="capitalize text-xs">
          {parseFloat(row.original.amount).toLocaleString()}
        </p>
      ),
    },

    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge className="capitalize text-xs">{row.original.status}</Badge>
      ),
    },
    {
      accessorKey: "method",
      header: "Method",
      cell: ({ row }) => (
        <Badge className="capitalize text-xs">{row.original.method}</Badge>
      ),
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => (
        <p className="capitalize text-xs">
          {formatDateTimestamp(row.original.timestamp)}
        </p>
      ),
    },
    {
      accessorKey: "handled_by",
      header: "Handled By",
      cell: ({ row }) => (
        <p className="capitalize text-xs">{row.original.handled_by}</p>
      ),
    },
    {
      accessorKey: "narrative",
      header: "Narrative",
      cell: ({ row }) => (
        <p className="capitalize text-xs">{row?.original.narrative}</p>
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
            <BreadcrumbLink to="/savings-reports">
              Withdraw Reports
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Withdraw Reports</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <div className="flex items-center justify-between space-y-2">
            <h5 className="text-2xl font-bold tracking-tight">
              Withdraws Report
            </h5>
          </div>
          <LoanGeneralReportQuery
            onFilterChange={handleFilterChange}
            isRefetching={isRefetching}
            refetch={refetch}
            data={data?.data}
            tableRef={tableRef}
            filters={filters}
            colSpan={3}
            mode={{
              format: "A4-L",
              orientation: "L",
            }}
            totals={{
              totalDebit: data?.meta?.total_withdrawn,
            }}
            title={"Withdraws Report"}
          />
          <DatatableReport
            ref={tableRef}
            columns={columns}
            data={data?.data ?? []}
            fetchData={refetch}
            isLoading={isLoading}
            isRefetching={isRefetching}
            isError={isError}
            colSpan={6}
            totalDebit={data?.meta?.total_withdrawn}
          />
        </div>
      </div>
    </>
  );
};

export default WithdrawsReport;

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

const AssetsReport = () => {
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
    queryKey: ["assets-reports", filters],
    queryFn: async () => {
      const controller = new AbortController();
      const fetchURL = `reports/assets`;
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
      accessorKey: "identification_no",
      header: "Asset ID",
      cell: ({ row }) => (
        <span className="text-xs">{row.original.identification_no}</span>
      ),
    },
    {
      accessorKey: "name",
      header: "Asset Name",
      cell: ({ row }) => (
        <span className="capitalize text-xs">{row.original.name}</span>
      ),
    },
    {
      accessorKey: "purchase_date",
      header: "Purchase Date",
      cell: ({ row }) => (
        <span className="text-xs">
          {formatDateTimestamp(row.original.purchase_date)}
        </span>
      ),
    },
    {
      accessorKey: "date_put_to_use",
      header: "Date Put to Use",
      cell: ({ row }) => (
        <span className="text-xs">
          {formatDateTimestamp(row.original.date_put_to_use)}
        </span>
      ),
    },
    {
      accessorKey: "original_cost",
      header: "Original Cost",
      cell: ({ row }) => (
        <span className="text-xs">
          {parseFloat(row.original.original_cost).toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "book_value",
      header: "Book Value",
      cell: ({ row }) => (
        <span className="text-xs">
          {parseFloat(row.original.book_value).toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "accumulated",
      header: "Accumulated Depreciation",
      cell: ({ row }) => (
        <span className="text-xs">
          {parseFloat(row.original.accumulated).toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "years_used",
      header: "Years Used",
      cell: ({ row }) => (
        <span className="text-xs">{row.original.years_used}</span>
      ),
    },
    {
      accessorKey: "depreciation_method",
      header: "Depreciation Method",
      cell: ({ row }) => (
        <span className="capitalize text-xs">
          {row.original.depreciation_method || "-"}
        </span>
      ),
    },
    {
      accessorKey: "rate",
      header: "Depreciation/Appreciation Rate (%)",
      cell: ({ row }) => <span className="text-xs">{row.original.rate}%</span>,
    },
    {
      accessorKey: "debit_account",
      header: "Debit Account",
      cell: ({ row }) => (
        <span className="capitalize text-xs">{row.original.debit_account}</span>
      ),
    },
    {
      accessorKey: "depreciation_expense",
      header: "Depreciation Expense Account",
      cell: ({ row }) => (
        <span className="capitalize text-xs">
          {row.original.depreciation_expense}
        </span>
      ),
    },
    {
      accessorKey: "depreciation_loss",
      header: "Depreciation Loss Account",
      cell: ({ row }) => (
        <span className="capitalize text-xs">
          {row.original.depreciation_loss}
        </span>
      ),
    },
    {
      accessorKey: "depreciation_gain",
      header: "Depreciation Gain Account",
      cell: ({ row }) => (
        <span className="capitalize text-xs">
          {row.original.depreciation_gain}
        </span>
      ),
    },
    {
      accessorKey: "appreciation_account",
      header: "Appreciation Account",
      cell: ({ row }) => (
        <span className="capitalize text-xs">
          {row.original.appreciation_account}
        </span>
      ),
    },
    {
      accessorKey: "appreciation_income",
      header: "Appreciation Income Account",
      cell: ({ row }) => (
        <span className="capitalize text-xs">
          {row.original.appreciation_income}
        </span>
      ),
    },
    {
      accessorKey: "appreciation_loss",
      header: "Appreciation Loss Account",
      cell: ({ row }) => (
        <span className="capitalize text-xs">
          {row.original.appreciation_loss}
        </span>
      ),
    },
    {
      accessorKey: "appreciation_gain",
      header: "Appreciation Gain Account",
      cell: ({ row }) => (
        <span className="capitalize text-xs">
          {row.original.appreciation_gain}
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
            <BreadcrumbPage>Assets Reports</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <div className="flex items-center justify-between space-y-2">
            <h5 className="text-2xl font-bold tracking-tight">Assets Report</h5>
          </div>
          <LoanGeneralReportQuery
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
            title={"Assets Report"}
          />
          <div className="max-w-[1150px]">
            {" "}
            {/* adjust min-width as needed */}
            <DatatableReportTwo
              ref={tableRef}
              columns={columns}
              data={data ?? []}
              fetchData={refetch}
              isLoading={isLoading}
              isRefetching={isRefetching}
              isError={isError}
              colSpan={3}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default AssetsReport;

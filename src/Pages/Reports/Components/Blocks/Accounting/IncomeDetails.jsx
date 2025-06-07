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
import { Checkbox } from "@/components/ui/checkbox";
import DatatableReport from "@/Pages/Components/DatatableReport";
import { formatDateTimestamp } from "@/lib/utils";
import { useState, useRef } from "react";
import GeneralReportQuery from "../Queries/GeneralReportQuery";
const IncomeDetails = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const tableRef = useRef(null);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    branch_id: "",
  });
  const {
    data = [],
    isLoading,
    refetch,
    isRefetching,
    isError,
  } = useQuery({
    queryKey: ["incomes-detailed", filters],
    queryFn: async () => {
      const controller = new AbortController();
      const fetchURL = `reports/accounting/incomes-detailed`;
      try {
        const response = await axiosPrivate.get(fetchURL, {
          params: {
            startDate: filters.startDate,
            endDate: filters.endDate,
            branch_id: filters.branch_id,
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
      accessorKey: "account",
      header: "Account Title",
      cell: ({ row }) => <p>{row.original.account}</p>,
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => <p>{formatDateTimestamp(row.original.date)}</p>,
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <p className="capitalize text-xs">{row.original.description}</p>
      ),
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => (
        <p className="capitalize text-xs">
          {row.original.amount !== ""
            ? parseFloat(row.original.amount).toLocaleString()
            : 0}
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
            <BreadcrumbLink to="/accounting-reports">
              Accounting Reports
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Income Details Report</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <div className="flex items-center justify-between space-y-2">
            <h5 className="text-2xl font-bold tracking-tight">
              Income Details Report
            </h5>
          </div>
          <GeneralReportQuery
            onFilterChange={handleFilterChange}
            isRefetching={isRefetching}
            refetch={refetch}
            data={data?.income ?? []}
            tableRef={tableRef}
            filters={filters}
            colSpan={3}
            mode={{
              format: "A4-L",
              orientation: "L",
            }}
            totals={{ debit: data?.total }}
            title={"Income Report Detailed"}
          />
          <DatatableReport
            columns={columns}
            data={data?.income ?? []}
            fetchData={refetch}
            isLoading={isLoading}
            isRefetching={isRefetching}
            isError={isError}
            colSpan={1}
            totalDebit={data?.total}
            ref={tableRef}
          />
        </div>
      </div>
    </>
  );
};

export default IncomeDetails;

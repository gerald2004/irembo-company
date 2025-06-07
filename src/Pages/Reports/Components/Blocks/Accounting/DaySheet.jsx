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
import DatatableReport from "@/Pages/Components/DatatableReport";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDateTimestamp } from "@/lib/utils";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import GeneralReportQuery from "../Queries/GeneralReportQuery";
const DaySheet = () => {
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
    queryKey: ["general-day-sheet", filters],
    queryFn: async () => {
      const controller = new AbortController();
      const fetchURL = `/reports/accounting/day-sheet`;
      try {
        const response = await axiosPrivate.get(fetchURL, {
          params: {
            startDate: filters.startDate,
            endDate: filters.endDate,
            branch_id: filters.branch_id,
          },
          signal: controller.signal,
        });
        // console.log(response.data.data);
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
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => (
        <p className="Date">{formatDateTimestamp(row.original.date)}</p>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <p className="capitalize text-xs">{row.original.description}</p>
      ),
    },
    {
      accessorKey: "account",
      header: "Account",
      cell: ({ row }) => (
        <p className="capitalize text-xs">{row.original.account}</p>
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
            <BreadcrumbPage>Day Sheet</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <div className="flex items-center justify-between space-y-2">
            <h5 className="text-2xl font-bold tracking-tight">Day Sheet</h5>
          </div>

          {/* <DaySheetTable data={data} isLoading={isLoading} /> */}
          <div className="space-y-6">
            <h4 className="text-lg font-semibold">Inflow</h4>
            <GeneralReportQuery
              onFilterChange={handleFilterChange}
              isRefetching={isRefetching}
              refetch={refetch}
              data={data?.deposits}
              tableRef={tableRef}
              filters={filters}
              colSpan={3}
              mode={{
                format: "A4-L",
                orientation: "L",
              }}
              totals={{
                debit: data?.totals?.deposits,
              }}
              title={"Day Sheet"}
            />
            <DatatableReport
              ref={tableRef}
              columns={columns}
              data={data?.deposits ?? []}
              fetchData={refetch}
              isLoading={isLoading}
              isRefetching={isRefetching}
              isError={isError}
              colSpan={1}
              totalDebit={data?.totals?.deposits}
            />
            <h4 className="text-lg font-semibold">OutFlow</h4>
            <GeneralReportQuery
              onFilterChange={handleFilterChange}
              isRefetching={isRefetching}
              refetch={refetch}
              data={data?.withdrawals}
              tableRef={tableRef}
              filters={filters}
              colSpan={3}
              mode={{
                format: "A4-L",
                orientation: "L",
              }}
              totals={{
                debit: data?.totals?.withdrawals,
              }}
              title={"Day Sheet"}
            />
            <DatatableReport
              ref={tableRef}
              columns={columns}
              data={data?.withdrawals ?? []}
              fetchData={refetch}
              isLoading={isLoading}
              isRefetching={isRefetching}
              isError={isError}
              colSpan={1}
              totalDebit={data?.totals?.withdrawals}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default DaySheet;

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
import { formatDateTimestamp } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { useRef, useState } from "react";
import TillReportQuery from "../Queries/TillReportQuery";
import useAuth from "@/MiddleWares/Hooks/useAuth";
const TillSheet = () => {
  const axiosPrivate = useAxiosPrivate();
  const tableRef = useRef(null);
  const { auth } = useAuth();
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    till_id: "",
  });
  const {
    data = [],
    isLoading,
    refetch,
    isRefetching,
    isError,
  } = useQuery({
    queryKey: ["general-till-sheet", filters],
    queryFn: async () => {
      const controller = new AbortController();
      const response = await axiosPrivate.get(
        `/reports/accounting/till-sheet`,
        {
          params: {
            startDate: filters.startDate,
            endDate: filters.endDate,
            till_id: filters.till_id,
          },
          signal: controller.signal,
        }
      );
      return response?.data?.data ?? [];
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
      accessorKey: "debit",
      header: "Cash In (Dr)	",
      cell: ({ row }) => (
        <p className="capitalize text-xs">
          {row.original.debit !== ""
            ? parseFloat(row.original.debit).toLocaleString()
            : 0}
        </p>
      ),
    },
    {
      accessorKey: "credit",
      header: "Cash Out (Cr)	",
      cell: ({ row }) => (
        <p className="capitalize text-xs">
          {row.original.credit !== ""
            ? parseFloat(row.original.credit).toLocaleString()
            : 0}
        </p>
      ),
    },
    {
      accessorKey: "balance",
      header: "Running Balance",
      cell: ({ row }) => (
        <p className="capitalize text-xs">
          {row.original.balance !== ""
            ? parseFloat(row.original.balance).toLocaleString()
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
            <BreadcrumbPage>Till Sheet</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <div className="flex items-center justify-between space-y-2">
            <h5 className="text-2xl font-bold tracking-tight">Till Sheet</h5>
          </div>
          <TillReportQuery
            onFilterChange={handleFilterChange}
            isRefetching={isRefetching}
            refetch={refetch}
            data={data?.cash ?? []}
            tableRef={tableRef}
            filters={filters}
            colSpan={2}
            mode={{
              format: "A4-P",
              orientation: "P",
            }}
            totals={{
              debit: data?.totals?.cash_in,
              credit: data?.totals?.cash_out,
            }}
            title={`Till Sheet - ${auth?.user?.firstname} ${auth?.user?.lastname}`}
          />

          <DatatableReport
            ref={tableRef}
            columns={columns}
            data={data?.cash ?? []}
            fetchData={refetch}
            isLoading={isLoading}
            isRefetching={isRefetching}
            isError={isError}
            colSpan={3}
            totalDebit={data?.totals?.cash_in}
            totalCredit={data?.totals?.cash_out}
          />
        </div>
      </div>
    </>
  );
};

export default TillSheet;

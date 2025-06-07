import { useState, useRef } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import DatatableReport from "@/Pages/Components/DatatableReport";
import GeneralReportQuery from "../Queries/GeneralReportQuery";
const TrialBalance = () => {
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
    queryKey: ["trial-balance", filters],
    queryFn: async () => {
      const controller = new AbortController();
      const fetchURL = `reports/accounting/trial-balance`;
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
      accessorKey: "account_title",
      header: "Account Title",
      cell: ({ row }) => (
        <Link to={`/ledgers/accounts/${row.original.account_id}`}>
          {" "}
          [{row.original.account_code}] {row.original.account_title}
        </Link>
      ),
    },
    {
      accessorKey: "debit",
      header: "Debit",
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
      header: "Credit",
      cell: ({ row }) => (
        <p className="capitalize text-xs">
          {row.original.credit !== ""
            ? parseFloat(row.original.credit).toLocaleString()
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
            <BreadcrumbPage>Trial Balance</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <div className="flex items-center justify-between space-y-2">
            <h5 className="text-2xl font-bold tracking-tight">Trial Balance</h5>
          </div>
          <GeneralReportQuery
            onFilterChange={handleFilterChange}
            isRefetching={isRefetching}
            refetch={refetch}
            data={data?.trial_balance}
            tableRef={tableRef}
            filters={filters}
            colSpan={1}
            mode={{
              format: "A4-P",
              orientation: "P",
            }}
            totals={{ debit: data?.total_debit, credit: data?.total_credit }}
            title={"Trial Balance"}
          />
          <DatatableReport
            ref={tableRef}
            columns={columns}
            data={data?.trial_balance ?? []}
            fetchData={refetch}
            isLoading={isLoading}
            isRefetching={isRefetching}
            isError={isError}
            colSpan={2}
            totalDebit={data?.total_debit}
            totalCredit={data?.total_credit}
          />
        </div>
      </div>
    </>
  );
};

export default TrialBalance;

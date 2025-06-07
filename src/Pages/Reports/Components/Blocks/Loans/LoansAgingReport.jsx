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
import DatatableReportTwo from "@/Pages/Components/DatatableReportTwo";
import { formatDateTimestamp } from "@/lib/utils";
import LoanGeneralReportQuery from "../Queries/LoanGeneralReportQuery";
import { useState, useRef } from "react";

const LoansAgingReport = () => {
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
    queryKey: ["aging-loans", filters],
    queryFn: async () => {
      const controller = new AbortController();
      const fetchURL = `reports/loans/aging-loans`;
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
  const total_overdue = data?.reduce((a, b) => a + b.total_overdue, 0);
  const age_zero = data?.reduce((sum, loan) => sum + loan.age_zero, 0);
  const age_one = data?.reduce((sum, loan) => sum + loan.age_one, 0);
  const age_two = data?.reduce((sum, loan) => sum + loan.age_two, 0);
  const age_three = data?.reduce((sum, loan) => sum + loan.age_three, 0);
  const age_four = data?.reduce((sum, loan) => sum + loan.age_four, 0);
  const age_five = data?.reduce((sum, loan) => sum + loan.age_five, 0);
  const age_six = data?.reduce((sum, loan) => sum + loan.age_six, 0);
  const age_seven = data?.reduce((sum, loan) => sum + loan.age_seven, 0);

  const columns = [
    {
      accessorKey: "account",
      header: "Account Number",
      cell: ({ row }) => (
        <Link
          to={`/clients/${
            row.original.client_type === "individual" ? "individual" : "group"
          }/${row.original.account_id}`}
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
          }/${row.original.account_id}`}
          className="capitalize text-xs"
        >
          {" "}
          {row.original.client}
        </Link>
      ),
    },

    {
      accessorKey: "code",
      header: "Loan Number",
      cell: ({ row }) => (
        <Link
          to={`/loans/${row.original.loan_id}`}
          className="capitalize text-xs"
        >
          {" "}
          {row.original.code}
        </Link>
      ),
    },
    {
      accessorKey: "product",
      header: "Product",
      cell: ({ row }) => (
        <p className="capitalize text-xs">{row?.original.product}</p>
      ),
    },
    {
      accessorKey: "last_payment_date",
      header: "Last Payment Date",
      cell: ({ row }) => (
        <p className="capitalize text-xs">
          {formatDateTimestamp(row.original.last_payment_date) ??
            "No Payment Made"}
        </p>
      ),
    },
    {
      accessorKey: "first_overdue_date",
      header: "Overdue Date",
      cell: ({ row }) => (
        <p className="capitalize text-xs">
          {formatDateTimestamp(row.original.first_overdue_date)}
        </p>
      ),
    },
    {
      accessorKey: "total_overdue",
      header: "Amount Due",
      cell: ({ row }) => (
        <p className="capitalize text-xs">
          {parseFloat(row.original.total_overdue).toLocaleString()}
        </p>
      ),
    },
    {
      accessorKey: "age_zero",
      header: "0-30 days",
      cell: ({ row }) => (
        <p className="capitalize text-xs">
          {parseFloat(row.original.age_zero).toLocaleString()}
        </p>
      ),
    },
    {
      accessorKey: "age_one",
      header: "1-30 days",
      cell: ({ row }) => (
        <p className="capitalize text-xs">
          {parseFloat(row.original.age_one).toLocaleString()}
        </p>
      ),
    },
    {
      accessorKey: "age_two",
      header: "31-60 days",
      cell: ({ row }) => (
        <p className="capitalize text-xs">
          {parseFloat(row.original.age_two).toLocaleString()}
        </p>
      ),
    },
    {
      accessorKey: "age_three",
      header: "61-90 days",
      cell: ({ row }) => (
        <p className="capitalize text-xs">
          {parseFloat(row.original.age_three).toLocaleString()}
        </p>
      ),
    },
    {
      accessorKey: "age_four",
      header: "91-120 days",
      cell: ({ row }) => (
        <p className="capitalize text-xs">
          {parseFloat(row.original.age_four).toLocaleString()}
        </p>
      ),
    },
    {
      accessorKey: "age_five",
      header: "121-150 days",
      cell: ({ row }) => (
        <p className="capitalize text-xs">
          {parseFloat(row.original.age_five).toLocaleString()}
        </p>
      ),
    },
    {
      accessorKey: "age_six",
      header: "151-180 days",
      cell: ({ row }) => (
        <p className="capitalize text-xs">
          {parseFloat(row.original.age_six).toLocaleString()}
        </p>
      ),
    },
    {
      accessorKey: "age_seven",
      header: "> 180 days",
      cell: ({ row }) => (
        <p className="capitalize text-xs">
          {parseFloat(row.original.age_seven).toLocaleString()}
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
            <BreadcrumbLink to="/loans-reports">Loans Reports</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Aging Loans Reports</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <div className="flex items-center justify-between space-y-2">
            <h5 className="text-2xl font-bold tracking-tight">
              Aging Loans Report
            </h5>
          </div>
          <LoanGeneralReportQuery
            onFilterChange={handleFilterChange}
            isRefetching={isRefetching}
            refetch={refetch}
            data={data}
            tableRef={tableRef}
            filters={filters}
            colSpan={6}
            mode={{
              format: "A4-L",
              orientation: "L",
            }}
            totals={{
              total_overdue: total_overdue,
              age_zero: age_zero,
              age_one: age_one,
              age_two: age_two,
              age_three: age_three,
              age_four: age_four,
              age_five: age_five,
              age_six: age_six,
              age_seven: age_seven,
            }}
            title={"Aging Loans Report"}
          />
          <div className="max-w-[1150px]">
            <DatatableReportTwo
              ref={tableRef}
              columns={columns}
              data={data ?? []}
              fetchData={refetch}
              isLoading={isLoading}
              isRefetching={isRefetching}
              isError={isError}
              colSpan={0}
              summaryFields={{
                total_overdue: total_overdue,
                age_zero: age_zero,
                age_one: age_one,
                age_two: age_two,
                age_three: age_three,
                age_four: age_four,
                age_five: age_five,
                age_six: age_six,
                age_seven: age_seven,
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default LoansAgingReport;

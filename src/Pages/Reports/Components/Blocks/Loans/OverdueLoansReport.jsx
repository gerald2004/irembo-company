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
import { formatDateTimestamp } from "@/lib/utils";
import LoanGeneralReportQuery from "../Queries/LoanGeneralReportQuery";
import { useState, useRef } from "react";

const OverdueLoansReport = () => {
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
    queryKey: ["overdue-loans", filters],
    queryFn: async () => {
      const controller = new AbortController();

      const fetchURL = `reports/loans/overdue-loans`;
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

  const totalAmountDisbursed = data?.reduce(
    (sum, loan) => sum + loan.amount_disbursed,
    0
  );
  const totalAmountDue = data?.reduce(
    (sum, loan) => sum + loan.overdue_amount,
    0
  );

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
      accessorKey: "contact",
      header: "Client Contact",
      cell: ({ row }) => (
        <Link
          to={`/clients/${
            row.original.client_type === "individual" ? "individual" : "group"
          }/${row.original.account_id}`}
          className="capitalize text-xs"
        >
          {" "}
          {row.original.contact}
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
      accessorKey: "interest_rate",
      header: "Interest Rate",
      cell: ({ row }) => (
        <p className="capitalize text-xs">{row.original.interest_rate} %</p>
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
      accessorKey: "tenure",
      header: "Tenure",
      cell: ({ row }) => (
        <p className="capitalize text-xs">{row.original.tenure}</p>
      ),
    },
    {
      accessorKey: "disbursement_date",
      header: "Date Of Disbursement",
      cell: ({ row }) => (
        <p className="capitalize text-xs">
          {formatDateTimestamp(row.original.disbursement_date)}
        </p>
      ),
    },
    {
      accessorKey: "overdue_date",
      header: "Overdue Date",
      cell: ({ row }) => (
        <p className="capitalize text-xs">
          {formatDateTimestamp(row.original.overdue_date)}
        </p>
      ),
    },
    {
      accessorKey: "amount_disbursed",
      header: "Amount Disbursed",
      cell: ({ row }) => (
        <p className="capitalize text-xs">
          {parseFloat(row.original.amount_disbursed).toLocaleString()}
        </p>
      ),
    },
    {
      accessorKey: "overdue_amount",
      header: "Amount Over Due",
      cell: ({ row }) => (
        <p className="capitalize text-xs">
          {parseFloat(row.original.overdue_amount).toLocaleString()}
        </p>
      ),
    },
    {
      accessorKey: "days_overdue",
      header: "Days Overdue",
      cell: ({ row }) => (
        <p className="capitalize text-xs">
          {parseFloat(row.original.days_overdue).toLocaleString()} Days
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
            <BreadcrumbPage>Overdue Loans Reports</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <div className="flex items-center justify-between space-y-2">
            <h5 className="text-2xl font-bold tracking-tight">
              Overdue Loans Report
            </h5>
          </div>
          <LoanGeneralReportQuery
            onFilterChange={handleFilterChange}
            isRefetching={isRefetching}
            refetch={refetch}
            data={data}
            tableRef={tableRef}
            filters={filters}
            colSpan={9}
            mode={{
              format: "A4-L",
              orientation: "L",
            }}
            totals={{
              totalAmountDisbursed: totalAmountDisbursed,
              totalAmountDue: totalAmountDue,
            }}
            title={"Overdue Loans Report"}
          />
          <div className="max-w-[1200px]">
            <DatatableReport
              ref={tableRef}
              columns={columns}
              data={data ?? []}
              fetchData={refetch}
              isLoading={isLoading}
              isRefetching={isRefetching}
              isError={isError}
              colSpan={3}
              totalDebit={totalAmountDisbursed}
              totalCredit={totalAmountDue}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default OverdueLoansReport;

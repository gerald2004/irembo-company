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
import LoanGeneralReportQuery from "../Queries/LoanGeneralReportQuery";
import { useState, useRef } from "react";
import { formatDateTimestamp } from "@/lib/utils";
import DatatableReportTwo from "@/Pages/Components/DatatableReportTwo";

const SettledLoansReport = () => {
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
    queryKey: ["settled-loans", filters],
    queryFn: async () => {
      const controller = new AbortController();

      const fetchURL = `reports/loans/settled-loans`;
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

  const totalAmountDisbursed = data?.reduce(
    (sum, loan) => sum + loan.amount_disbursed,
    0
  );
  const totalPrincipal = data?.reduce(
    (sum, loan) => sum + loan.principal_paid,
    0
  );
  const totalInterest = data?.reduce(
    (sum, loan) => sum + loan.interest_paid,
    0
  );
  const totalPenalty = data?.reduce((sum, loan) => sum + loan.pentaly_paid, 0);
  const totalAmountPaid = data?.reduce((sum, loan) => sum + loan.total_paid, 0);

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
      accessorKey: "interest",
      header: "Interest Rate",
      cell: ({ row }) => (
        <p className="capitalize text-xs">{row.original.interest} %</p>
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
      accessorKey: "disbursed_date",
      header: "Date Of Disbursement",
      cell: ({ row }) => (
        <p className="capitalize text-xs">
          {formatDateTimestamp(row.original.disbursed_date)}
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
      accessorKey: "principal_paid",
      header: "Principal Paid",
      cell: ({ row }) => (
        <p className="capitalize text-xs">
          {parseFloat(row.original.principal_paid).toLocaleString()}
        </p>
      ),
    },
    {
      accessorKey: "interest_paid",
      header: "Interest Paid",
      cell: ({ row }) => (
        <p className="capitalize text-xs">
          {parseFloat(row.original.interest_paid).toLocaleString()}
        </p>
      ),
    },
    {
      accessorKey: "penalty_paid",
      header: "Penalty Paid",
      cell: ({ row }) => (
        <p className="capitalize text-xs">
          {parseFloat(row.original.penalty_paid).toLocaleString()}
        </p>
      ),
    },
    {
      accessorKey: "total_paid",
      header: "Total Paid",
      cell: ({ row }) => (
        <p className="capitalize text-xs">
          {parseFloat(row.original.total_paid).toLocaleString()}
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
            <BreadcrumbPage>Settled Loans Reports</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <div className="flex items-center justify-between space-y-2">
            <h5 className="text-2xl font-bold tracking-tight">
              Settled Loans Report
            </h5>
          </div>
          <LoanGeneralReportQuery
            onFilterChange={handleFilterChange}
            isRefetching={isRefetching}
            refetch={refetch}
            data={data}
            tableRef={tableRef}
            filters={filters}
            colSpan={7}
            mode={{
              format: "A4-L",
              orientation: "L",
            }}
            totals={{
              totalAmountDisbursed: totalAmountDisbursed,
              totalPrincipal: totalPrincipal,
              totalInterest: totalInterest,
              totalPenalty: totalPenalty,
              totalAmountPaid: totalAmountPaid,
            }}
            title={"Settled Loans Report"}
          />
          <div className="max-w-[1200px]">
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
                totalAmountDisbursed: totalAmountDisbursed,
                totalPrincipal: totalPrincipal,
                totalInterest: totalInterest,
                totalPenalty: totalPenalty,
                totalAmountPaid: totalAmountPaid,
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default SettledLoansReport;

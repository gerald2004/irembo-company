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
import LoanGeneralReportQuery from "../Queries/LoanGeneralReportQuery";
import { useState, useRef } from "react";

const LoansBalancesReport = () => {
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
    queryKey: ["balances-loans", filters],
    queryFn: async () => {
      const controller = new AbortController();

      const fetchURL = `reports/loans/loan-balances`;
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
    (sum, loan) => sum + loan.disbursed_principal,
    0
  );
  const totalPrincipalPaid = data?.reduce(
    (sum, loan) => sum + loan.principal_paid,
    0
  );

  const totalInterest = data?.reduce((sum, loan) => sum + loan.interest, 0);
  const totalInterestPaid = data?.reduce(
    (sum, loan) => sum + loan.interest_paid,
    0
  );

  const totalPenalty = data?.reduce((sum, loan) => sum + loan.penalty, 0);
  const totalPenaltyPaid = data?.reduce(
    (sum, loan) => sum + loan.penalty_paid,
    0
  );
  const processedData = data?.map((loan) => ({
    ...loan,
    remaining_principal_balance:
      parseFloat(loan.disbursed_principal) - parseFloat(loan.principal_paid),
    remaining_interest_balance:
      parseFloat(loan.interest) - parseFloat(loan.interest_paid),
    remaining_penalty_balance:
      parseFloat(loan.penalty) - parseFloat(loan.penalty_paid),
    total_loan_paid_amount:
      parseFloat(loan.principal_paid) +
      parseFloat(loan.penalty_paid) +
      parseFloat(loan.interest_paid),
    total_balance:
      parseFloat(loan.penalty) +
      parseFloat(loan.interest) +
      parseFloat(loan.disbursed_principal) -
      (parseFloat(loan.principal_paid) +
        parseFloat(loan.penalty_paid) +
        parseFloat(loan.interest_paid)),
  }));
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
      accessorKey: "disbursed_principal",
      header: "Disbursed Principal",
      cell: ({ row }) => (
        <p className="capitalize text-xs">
          {parseFloat(row.original.disbursed_principal).toLocaleString()}
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
      accessorKey: "remaining_principal_balance",
      header: "Principal Balance",
      cell: ({ row }) => (
        <p className="capitalize text-xs">
          {parseFloat(
            row.original.remaining_principal_balance
          ).toLocaleString()}
        </p>
      ),
    },

    {
      accessorKey: "interest",
      header: "Interest",
      cell: ({ row }) => (
        <p className="capitalize text-xs">
          {parseFloat(row.original.interest).toLocaleString()}
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
      accessorKey: "remaining_interest_balance",
      header: "Interest Balance",
      cell: ({ row }) => (
        <p className="capitalize text-xs">
          {parseFloat(row.original.remaining_interest_balance).toLocaleString()}
        </p>
      ),
    },

    {
      accessorKey: "penalty",
      header: "Penalty",
      cell: ({ row }) => (
        <p className="capitalize text-xs">
          {parseFloat(row.original.penalty).toLocaleString()}
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
      accessorKey: "remaining_penalty_balance",
      header: "Penalty Balance",
      cell: ({ row }) => (
        <p className="capitalize text-xs">
          {parseFloat(row.original.remaining_penalty_balance).toLocaleString()}
        </p>
      ),
    },
    {
      accessorKey: "total_loan_paid_amount",
      header: "Total Paid Amount",
      cell: ({ row }) => (
        <p className="capitalize text-xs">
          {parseFloat(row.original.total_loan_paid_amount).toLocaleString()}
        </p>
      ),
    },
    {
      accessorKey: "total_balance",
      header: "Total Balance",
      cell: ({ row }) => (
        <p className="capitalize text-xs">
          {parseFloat(row.original.total_balance).toLocaleString()}
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
            <BreadcrumbPage>Loans Balances Reports</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <div className="flex items-center justify-between space-y-2">
            <h5 className="text-2xl font-bold tracking-tight">
              Loans Balances Report
            </h5>
          </div>
          <LoanGeneralReportQuery
            onFilterChange={handleFilterChange}
            isRefetching={isRefetching}
            refetch={refetch}
            data={processedData}
            tableRef={tableRef}
            filters={filters}
            colSpan={4}
            mode={{
              format: "A4-L",
              orientation: "L",
            }}
            totals={{
              totalAmountDisbursed: totalAmountDisbursed,
              totalPrincipalPaid: totalPrincipalPaid,
              principalBalance: totalAmountDisbursed - totalPrincipalPaid,
              totalInterest: totalInterest,
              totalInterestPaid: totalInterestPaid,
              totalInterestBalance: totalInterest - totalInterestPaid,
              totalPenalty: totalPenalty,
              totalPenaltyPaid: totalPenaltyPaid,
              totalPenaltyBalance: totalPenalty - totalPenaltyPaid,
              totalLoanAmountPaid:
                totalPrincipalPaid + totalInterestPaid + totalPenaltyPaid,
              totalLoanBalance:
                totalAmountDisbursed +
                totalInterest +
                totalPenalty -
                (totalPrincipalPaid + totalInterestPaid + totalPenaltyPaid),
            }}
            title={"Loans Balances Report"}
          />
          <div className="max-w-[1200px]">
            <DatatableReportTwo
              ref={tableRef}
              columns={columns}
              data={processedData ?? []}
              fetchData={refetch}
              isLoading={isLoading}
              isRefetching={isRefetching}
              isError={isError}
              colSpan={0}
              summaryFields={{
                totalAmountDisbursed: totalAmountDisbursed,
                totalPrincipalPaid: totalPrincipalPaid,
                principalBalance: totalAmountDisbursed - totalPrincipalPaid,
                totalInterest: totalInterest,
                totalInterestPaid: totalInterestPaid,
                totalInterestBalance: totalInterest - totalInterestPaid,
                totalPenalty: totalPenalty,
                totalPenaltyPaid: totalPenaltyPaid,
                totalPenaltyBalance: totalPenalty - totalPenaltyPaid,
                totalLoanAmountPaid:
                  totalPrincipalPaid + totalInterestPaid + totalPenaltyPaid,
                totalLoanBalance:
                  totalAmountDisbursed +
                  totalInterest +
                  totalPenalty -
                  (totalPrincipalPaid + totalInterestPaid + totalPenaltyPaid),
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default LoansBalancesReport;

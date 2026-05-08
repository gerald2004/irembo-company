import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import useBranchFilter from "@/MiddleWares/Hooks/useBranchFilter";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import LoanGeneralReportQuery from "../Queries/LoanGeneralReportQuery";
import { formatDateTimestamp } from "@/lib/utils";
import DatatableReportTwo from "@/Pages/Components/DatatableReportTwo";
import { useState, useRef } from "react";

const LoanRecoveryReport = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const tableRef = useRef(null);

  const { branchKey } = useBranchFilter();
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    branch_id: String(branchKey ?? ""),
    user_id: "",
  });
  const {
    data = [],
    isLoading,
    refetch,
    isRefetching,
    isError,
  } = useQuery({
    queryKey: ["loans-recovery", filters],
    queryFn: async () => {
      const controller = new AbortController();

      const fetchURL = `reports/loans/loans-recovery`;
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
    (sum, loan) => sum + loan.disbursed_principal,
    0
  );
  const totalPrincipalPaid = data?.reduce(
    (sum, loan) => sum + loan.recovered_principal,
    0
  );
  const totalInterestPaid = data?.reduce(
    (sum, loan) => sum + loan.recovered_interest,
    0
  );
  const totalPenaltyPaid = data?.reduce(
    (sum, loan) => sum + loan.recovered_penalty,
    0
  );
  const totalTotalPaid = data?.reduce(
    (sum, loan) => sum + loan.total_recovered,
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
      accessorKey: "disbursed_principal",
      header: "Principal Disbrused",
      cell: ({ row }) => (
        <p className="capitalize text-xs">
          {parseFloat(row.original.disbursed_principal).toLocaleString()}
        </p>
      ),
    },
    {
      accessorKey: "recovered_principal",
      header: "Recovered Principal",
      cell: ({ row }) => (
        <p className="capitalize text-xs">
          {parseFloat(row.original.recovered_principal).toLocaleString()}
        </p>
      ),
    },
    {
      accessorKey: "recovered_interest",
      header: "Recovered Interest",
      cell: ({ row }) => (
        <p className="capitalize text-xs">
          {parseFloat(row.original.recovered_interest).toLocaleString()}
        </p>
      ),
    },
    {
      accessorKey: "recovered_penalty",
      header: "Recovered Penalty",
      cell: ({ row }) => (
        <p className="capitalize text-xs">
          {parseFloat(row.original.recovered_penalty).toLocaleString()}
        </p>
      ),
    },
    {
      accessorKey: "total_recovered",
      header: "Total Recovered",
      cell: ({ row }) => (
        <p className="capitalize text-xs">
          {parseFloat(row.original.total_recovered).toLocaleString()}
        </p>
      ),
    },
    {
      accessorKey: "recovery_percent",
      header: "Recovery Percentage",
      cell: ({ row }) => (
        <p className="capitalize text-xs">
          {parseFloat(row.original.recovery_percent).toLocaleString()}
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
            <BreadcrumbPage>Loans Recovery Reports</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <div className="flex items-center justify-between space-y-2">
            <h5 className="text-2xl font-bold tracking-tight">
              Loans Recovery Report
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
              totalPrincipalPaid: totalPrincipalPaid,
              totalInterestPaid: totalInterestPaid,
              totalPenaltyPaid: totalPenaltyPaid,
              totalTotalPaid: totalTotalPaid,
            }}
            title={"Loans Recovery Report"}
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
              colSpan={1}
              summaryFields={{
                totalAmountDisbursed: totalAmountDisbursed,
                totalPrincipalPaid: totalPrincipalPaid,
                totalInterestPaid: totalInterestPaid,
                totalPenaltyPaid: totalPenaltyPaid,
                totalTotalPaid: totalTotalPaid,
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default LoanRecoveryReport;

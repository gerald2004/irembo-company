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
// import DatatableReport from "@/Pages/Components/DatatableReport";
import LoanGeneralReportQuery from "../Queries/LoanGeneralReportQuery";
import { useState, useRef } from "react";
import DatatableReportTwo from "@/Pages/Components/DatatableReportTwo";

const LoansPortfolioReport = () => {
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
    queryKey: ["portfolio-loans", filters],
    queryFn: async () => {
      const controller = new AbortController();

      const fetchURL = `reports/loans/portfolio`;
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
  const totalAmountDue = data?.reduce(
    (sum, loan) => sum + loan.overdue_principal,
    0
  );

  const totalOutstandingBalance = data?.reduce(
    (sum, loan) => sum + loan.outstanding_principal,
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
      accessorKey: "outstanding_principal",
      header: "Outstanding Principal",
      cell: ({ row }) => (
        <p className="capitalize text-xs">
          {parseFloat(row.original.outstanding_principal).toLocaleString()}
        </p>
      ),
    },
    {
      accessorKey: "overdue_principal",
      header: "Overdue Principal",
      cell: ({ row }) => (
        <p className="capitalize text-xs">
          {parseFloat(row.original.overdue_principal).toLocaleString()}
        </p>
      ),
    },
    {
      accessorKey: "portfolio_at_risk",
      header: "Portfolio At Risk",
      cell: ({ row }) => (
        <p className="capitalize text-xs">{row.original.portfolio_at_risk} %</p>
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
            <BreadcrumbPage>Loans Portfolio Reports</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <div className="flex items-center justify-between space-y-2">
            <h5 className="text-2xl font-bold tracking-tight">
              Loans Portfolio Report
            </h5>
          </div>
          <LoanGeneralReportQuery
            onFilterChange={handleFilterChange}
            isRefetching={isRefetching}
            refetch={refetch}
            data={data}
            tableRef={tableRef}
            filters={filters}
            colSpan={4}
            mode={{
              format: "A4-L",
              orientation: "L",
            }}
            totals={{
              totalDebit: totalAmountDisbursed,
              totalOutstandingBalance: totalOutstandingBalance,
              totalCredit: totalAmountDue,
            }}
            title={"Loans Portofolio Report"}
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
                totalDebit: totalAmountDisbursed,
                totalOutstandingBalance: totalOutstandingBalance,
                totalCredit: totalAmountDue,
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default LoansPortfolioReport;

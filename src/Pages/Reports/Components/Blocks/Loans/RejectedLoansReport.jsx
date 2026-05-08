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
import { useState, useRef } from "react";
import { formatDateTimestamp } from "@/lib/utils";
import DatatableReportTwo from "@/Pages/Components/DatatableReportTwo";

const RejectedLoansReport = () => {
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
    queryKey: ["rejected-loans", filters],
    queryFn: async () => {
      const controller = new AbortController();
      const fetchURL = `reports/loans/rejected-loans`;
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

  const totalAmountApplied = data?.reduce(
    (sum, loan) => sum + loan.amount_requested,
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
      accessorKey: "tenure",
      header: "Tenure",
      cell: ({ row }) => (
        <p className="capitalize text-xs">{row.original.tenure}</p>
      ),
    },
    {
      accessorKey: "applied_on",
      header: "Date Of Application",
      cell: ({ row }) => (
        <p className="capitalize text-xs">
          {formatDateTimestamp(row.original.applied_on)}
        </p>
      ),
    },
    {
      accessorKey: "amount_requested",
      header: "Amount Applied",
      cell: ({ row }) => (
        <p className="capitalize text-xs">
          {parseFloat(row.original.amount_requested).toLocaleString()}
        </p>
      ),
    },

    {
      accessorKey: "rejected_by",
      header: "Rejected By",
      cell: ({ row }) => (
        <p className="capitalize text-xs">{row.original.rejected_by}</p>
      ),
    },
    {
      accessorKey: "rejection_reason",
      header: "Reason",
      cell: ({ row }) => (
        <p className="capitalize text-xs">{row.original.rejection_reason}</p>
      ),
    },
    {
      accessorKey: "rejection_notes",
      header: "Notes",
      cell: ({ row }) => (
        <p className="capitalize text-xs">{row.original.rejection_notes}</p>
      ),
    },

    {
      accessorKey: "rejected_on",
      header: "Rejected On",
      cell: ({ row }) => (
        <p className="capitalize text-xs">
          {formatDateTimestamp(row.original.rejected_on)}
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
            <BreadcrumbPage>Rejected Loans Reports</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <div className="flex items-center justify-between space-y-2">
            <h5 className="text-2xl font-bold tracking-tight">
              Rejected Loans Report
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
              totalAmountApplied: totalAmountApplied,
            }}
            title={"Rejected Loans Report"}
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
              colSpan={4}
              summaryFields={{
                totalAmountApplied: totalAmountApplied,
              }}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default RejectedLoansReport;

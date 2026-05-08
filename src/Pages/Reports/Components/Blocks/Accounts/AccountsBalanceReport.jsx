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
import { formatDateTimestamp } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import DatatableReportTwo from "@/Pages/Components/DatatableReportTwo";
import LoanGeneralReportQuery from "../Queries/LoanGeneralReportQuery";
import { useState, useRef } from "react";

const AccountsBalanceReport = () => {
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
    queryKey: ["accounts-reports", filters],
    queryFn: async () => {
      const controller = new AbortController();
      const fetchURL = `reports/accounts/general`;
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
  const columns = [
    {
      accessorKey: "account",
      header: "Account Number",
      cell: ({ row }) => (
        <Link
          to={`/clients/${
            row.original.client_type === "individual" ? "individual" : "group"
          }/${row.original.client_id}`}
          className="capitalize text-xs"
        >
          {" "}
          {row.original.account}
        </Link>
      ),
    },
    {
      accessorKey: "name",
      header: "Client Name",
      cell: ({ row }) => (
        <Link
          to={`/clients/${
            row.original.client_type === "individual" ? "individual" : "group"
          }/${row.original.client_id}`}
          className="capitalize text-xs"
        >
          {" "}
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: "account_balance",
      header: "Account Balance",
      cell: ({ row }) => (
        <p className="capitalize text-xs">
          {parseFloat(row.original.account_balance).toLocaleString()}
        </p>
      ),
    },
    {
      accessorKey: "frozen_balance",
      header: "Frozen Balance",
      cell: ({ row }) => (
        <p className="capitalize text-xs">
          {parseFloat(row.original.frozen_balance).toLocaleString()}
        </p>
      ),
    },
    {
      accessorKey: "fixed_amount",
      header: "Fixed Balance",
      cell: ({ row }) => (
        <p className="capitalize text-xs">
          {parseFloat(row.original.fixed_amount).toLocaleString()}
        </p>
      ),
    },

    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge className="capitalize text-xs">{row.original.status}</Badge>
      ),
    },
    {
      accessorKey: "savings_product",
      header: "Account Product",
      cell: ({ row }) => (
        <p className="capitalize text-xs">{row.original.savings_product}</p>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Timestamp",
      cell: ({ row }) => (
        <p className="capitalize text-xs">
          {formatDateTimestamp(row.original.created_at)}
        </p>
      ),
    },
  ];
  const handleFilterChange = (data) => {
    setFilters(data);
    refetch();
  };
  const totalAccountBalance = data?.reduce((a, b) => a + b?.account_balance, 0);
  const totalFrozenBalance = data?.reduce((a, b) => a + b?.frozen_balance, 0);
  const totalFixedBalance = data?.reduce((a, b) => a + b?.fixed_amount, 0);
  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="/dashboard">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink to="/account-reports">
              Account Reports
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Account Balances Reports</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <div className="flex items-center justify-between space-y-2">
            <h5 className="text-2xl font-bold tracking-tight">
              Account Balances Report
            </h5>
          </div>
          <LoanGeneralReportQuery show={{ officer: false }}
            onFilterChange={handleFilterChange}
            isRefetching={isRefetching}
            refetch={refetch}
            data={data}
            tableRef={tableRef}
            filters={filters}
            colSpan={2}
            mode={{
              format: "A4-P",
              orientation: "P",
            }}
            title={"Account Balances Report"}
            totals={{
              totalAccountBalance: totalAccountBalance,
              totalFrozenBalance: totalFrozenBalance,
              totalFixedBalance: totalFixedBalance,
            }}
          />
          <DatatableReportTwo
            ref={tableRef}
            columns={columns}
            data={data ?? []}
            fetchData={refetch}
            isLoading={isLoading}
            isRefetching={isRefetching}
            isError={isError}
            colSpan={3}
            summaryFields={{
              totalAccountBalance: totalAccountBalance,
              totalFrozenBalance: totalFrozenBalance,
              totalFixedBalance: totalFixedBalance,
            }}
          />
        </div>
      </div>
    </>
  );
};

export default AccountsBalanceReport;

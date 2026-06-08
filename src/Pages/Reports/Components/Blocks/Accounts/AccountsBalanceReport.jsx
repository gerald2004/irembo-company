import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDateTimestamp } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import DatatableReportTwo from "@/Pages/Components/DatatableReportTwo";
import LoanGeneralReportQuery from "../Queries/LoanGeneralReportQuery";
import { useState, useRef } from "react";

const clientLink = (type, id) => {
  switch (type) {
    case "individual":    return `/clients/individual/${id}`;
    case "group":         return `/clients/group/${id}`;
    case "company":       return `/clients/company/${id}`;
    case "joint_account": return `/clients/joint-account/${id}`;
    default:              return `/clients/individual/${id}`;
  }
};

const AccountsBalanceReport = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const tableRef = useRef(null);
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    branch_id: "",
    user_id: "",
    savings_product_id: "",
  });

  const { data = [], isLoading, refetch, isRefetching, isError } = useQuery({
    queryKey: ["accounts-reports", filters],
    queryFn: async () => {
      const controller = new AbortController();
      try {
        const response = await axiosPrivate.get("reports/accounts/general", {
          params: {
            start_date:         filters.startDate         || undefined,
            end_date:           filters.endDate           || undefined,
            branch_id:          filters.branch_id         || undefined,
            user_id:            filters.user_id           || undefined,
            savings_product_id: filters.savings_product_id || undefined,
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
        <Link to={clientLink(row.original.client_type, row.original.client_id)} className="text-xs">
          {row.original.account}
        </Link>
      ),
    },
    {
      accessorKey: "name",
      header: "Client Name",
      cell: ({ row }) => (
        <Link to={clientLink(row.original.client_type, row.original.client_id)} className="capitalize text-xs">
          {row.original.name}
        </Link>
      ),
    },
    {
      accessorKey: "savings_product",
      header: "Account Product",
      cell: ({ row }) => (
        <p className="text-xs">{row.original.savings_product}</p>
      ),
    },
    {
      accessorKey: "account_balance",
      header: "Account Balance",
      cell: ({ row }) => (
        <p className="tabular-nums text-xs">
          {parseFloat(row.original.account_balance).toLocaleString()}
        </p>
      ),
    },
    {
      accessorKey: "frozen_balance",
      header: "Frozen Balance",
      cell: ({ row }) => (
        <p className="tabular-nums text-xs">
          {parseFloat(row.original.frozen_balance).toLocaleString()}
        </p>
      ),
    },
    {
      accessorKey: "fixed_amount",
      header: "Fixed Balance",
      cell: ({ row }) => (
        <p className="tabular-nums text-xs">
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
      accessorKey: "created_at",
      header: "Timestamp",
      cell: ({ row }) => (
        <p className="text-xs">{formatDateTimestamp(row.original.created_at)}</p>
      ),
    },
  ];

  const handleFilterChange = (data) => {
    setFilters(data);
    refetch();
  };

  const totalAccountBalance = data?.reduce((a, b) => a + (b?.account_balance ?? 0), 0);
  const totalFrozenBalance  = data?.reduce((a, b) => a + (b?.frozen_balance  ?? 0), 0);
  const totalFixedBalance   = data?.reduce((a, b) => a + (b?.fixed_amount    ?? 0), 0);

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="/dashboard">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink to="/account-reports">Account Reports</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Account Balances Report</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <div className="flex items-center justify-between space-y-2">
            <h5 className="text-2xl font-bold tracking-tight">Account Balances Report</h5>
          </div>

          <LoanGeneralReportQuery
            show={{ officer: false, savingsProduct: true }}
            onFilterChange={handleFilterChange}
            isRefetching={isRefetching}
            refetch={refetch}
            data={data}
            tableRef={tableRef}
            filters={filters}
            colSpan={2}
            mode={{ format: "A4-P", orientation: "P" }}
            title="Account Balances Report"
            totals={{
              totalAccountBalance,
              totalFrozenBalance,
              totalFixedBalance,
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
              totalAccountBalance,
              totalFrozenBalance,
              totalFixedBalance,
            }}
          />
        </div>
      </div>
    </>
  );
};

export default AccountsBalanceReport;

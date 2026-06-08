import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { Badge } from "@/components/ui/badge";
import DatatableReportTwo from "@/Pages/Components/DatatableReportTwo";
import LoanGeneralReportQuery from "../Queries/LoanGeneralReportQuery";
import { useState, useRef } from "react";

const nf = new Intl.NumberFormat("en-UG", { maximumFractionDigits: 0 });
const fmt = (v) => nf.format(Number(v ?? 0));

const SavingsConsolidatedBalanceReport = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const tableRef = useRef(null);

  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    branch_id: "",
    savings_product_id: "",
  });

  const { data = [], isLoading, refetch, isRefetching, isError } = useQuery({
    queryKey: ["savings-consolidated-balance", filters],
    queryFn: async () => {
      const controller = new AbortController();
      try {
        const response = await axiosPrivate.get("reports/accounts/savings-consolidated", {
          params: {
            branch_id:          filters.branch_id          || undefined,
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
      accessorKey: "product_title",
      header: "Savings Product",
      cell: ({ row }) => (
        <p className="text-xs font-medium">{row.original.product_title}</p>
      ),
    },
    {
      accessorKey: "account_count",
      header: "No. of Accounts",
      cell: ({ row }) => (
        <p className="tabular-nums text-xs text-center">{row.original.account_count}</p>
      ),
    },
    {
      accessorKey: "total_balance",
      header: "Total Balance",
      cell: ({ row }) => (
        <p className="tabular-nums text-xs text-right">{fmt(row.original.total_balance)}</p>
      ),
    },
    {
      accessorKey: "total_frozen",
      header: "Total Frozen",
      cell: ({ row }) => (
        <p className="tabular-nums text-xs text-right">{fmt(row.original.total_frozen)}</p>
      ),
    },
    {
      accessorKey: "total_fixed",
      header: "Total Fixed",
      cell: ({ row }) => (
        <p className="tabular-nums text-xs text-right">{fmt(row.original.total_fixed)}</p>
      ),
    },
    {
      accessorKey: "available_balance",
      header: "Available Balance",
      cell: ({ row }) => (
        <p className="tabular-nums text-xs text-right font-semibold">{fmt(row.original.available_balance)}</p>
      ),
    },
  ];

  const handleFilterChange = (patch) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    refetch();
  };

  const totalBalance   = data.reduce((s, r) => s + (r.total_balance   ?? 0), 0);
  const totalFrozen    = data.reduce((s, r) => s + (r.total_frozen     ?? 0), 0);
  const totalFixed     = data.reduce((s, r) => s + (r.total_fixed      ?? 0), 0);
  const totalAvailable = data.reduce((s, r) => s + (r.available_balance ?? 0), 0);
  const totalAccounts  = data.reduce((s, r) => s + (r.account_count    ?? 0), 0);

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
            <BreadcrumbPage>Consolidated Savings Balance</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <div className="flex items-center justify-between space-y-2">
            <h5 className="text-2xl font-bold tracking-tight">
              Consolidated Savings Balance Report
            </h5>
          </div>

          <LoanGeneralReportQuery
            show={{ officer: false, savingsProduct: true }}
            onFilterChange={handleFilterChange}
            isRefetching={isRefetching}
            refetch={refetch}
            data={data}
            tableRef={tableRef}
            filters={filters}
            colSpan={1}
            mode={{ format: "A4-P", orientation: "P" }}
            title="Consolidated Savings Balance Report"
            totals={{ totalBalance, totalFrozen, totalFixed, totalAvailable, totalAccounts }}
          />

          {/* KPI strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Products</p>
              <p className="text-base font-semibold tabular-nums">{data.length}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Total Accounts</p>
              <p className="text-base font-semibold tabular-nums">{fmt(totalAccounts)}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Total Balance</p>
              <p className="text-base font-semibold tabular-nums">{fmt(totalBalance)}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Total Frozen</p>
              <p className="text-base font-semibold tabular-nums">{fmt(totalFrozen)}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Available Balance</p>
              <p className="text-base font-semibold tabular-nums">{fmt(totalAvailable)}</p>
            </div>
          </div>

          <DatatableReportTwo
            ref={tableRef}
            columns={columns}
            data={data ?? []}
            fetchData={refetch}
            isLoading={isLoading}
            isRefetching={isRefetching}
            isError={isError}
            colSpan={1}
            summaryFields={{ totalBalance, totalFrozen, totalFixed, totalAvailable }}
          />
        </div>
      </div>
    </>
  );
};

export default SavingsConsolidatedBalanceReport;

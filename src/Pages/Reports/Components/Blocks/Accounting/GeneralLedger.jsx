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
import { useState, useRef } from "react";
import { AccountCombobox } from "@/Pages/Components/AccountCombobox";
import { Checkbox } from "@/components/ui/checkbox";
import DatatableReport from "@/Pages/Components/DatatableReport";
import { formatDateTimestamp } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import GeneralReportQuery from "../Queries/GeneralReportQuery";
const GeneralLedger = () => {
  const axiosPrivate = useAxiosPrivate();
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const tableRef = useRef(null);

  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    branch_id: "",
  });
  const {
    data = [],
    isLoading,
    refetch,
    isRefetching,
    isError,
  } = useQuery({
    queryKey: ["general-ledger-statement", selectedAccountId, filters],
    queryFn: async () => {
      if (!selectedAccountId) return [];
      const controller = new AbortController();
      const response = await axiosPrivate.get(
        `/reports/accounting/general-ledger/${selectedAccountId}`,
        {
          params: {
            startDate: filters.startDate,
            endDate: filters.endDate,
            branch_id: filters.branch_id,
          },
          signal: controller.signal,
        }
      );
      return response?.data?.data ?? [];
    },
    keepPreviousData: true,
    enabled: !!selectedAccountId, // only run if account is selected
  });

  const {
    data: accountsData,
    isLoading: isLoadingAccounts,
    isError: isErrorAccounts,
    refetch: refetchAccounts,
    isRefetching: isRefetchingAccounts,
  } = useQuery({
    queryKey: ["account-votes"],
    queryFn: async () => {
      const response = await axiosPrivate.get("/settings/accounts/account");
      return response.data.data.accounts;
    },
  });
  const columns = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => (
        <p className="capitalize text-xs">
          {formatDateTimestamp(row?.original?.date)}
        </p>
      ),
    },
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => (
        <Badge variant="secondary" className="capitalize text-xs">
          {row?.original?.code}
        </Badge>
      ),
    },
    {
      accessorKey: "debit",
      header: "Debit",
      cell: ({ row }) => (
        <p className="capitalize text-xs">
          {row.original.debit !== ""
            ? parseFloat(row.original.debit).toLocaleString()
            : 0}
        </p>
      ),
    },
    {
      accessorKey: "credit",
      header: "Credit",
      cell: ({ row }) => (
        <p className="capitalize text-xs">
          {row.original.credit !== ""
            ? parseFloat(row.original.credit).toLocaleString()
            : 0}
        </p>
      ),
    },
    {
      accessorKey: "balance",
      header: "Balance",
      cell: ({ row }) => (
        <p className="capitalize text-xs">
          {row.original.balance !== ""
            ? parseFloat(row.original.balance).toLocaleString()
            : 0}
        </p>
      ),
    },
  ];
  const handleFilterChange = (data) => {
    setFilters(data);
    refetch();
  };
  const entries = Array.isArray(data?.entries) ? data.entries : [];

  const totalDebit = entries.reduce(
    (sum, entry) => sum + (parseFloat(entry?.debit || 0) || 0),
    0
  );

  const totalCredit = entries.reduce(
    (sum, entry) => sum + (parseFloat(entry?.credit || 0) || 0),
    0
  );

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="/dashboard">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink to="/accounting-reports">
              Accounting Reports
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>General Ledger</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <div className="flex items-center justify-between space-y-2">
            <h5 className="text-2xl font-bold tracking-tight">
              General Ledger
            </h5>
            <p>
              {selectedAccountId &&
                `${data?.account?.title} (${data?.account?.code}) - ${data?.account?.type}`}
            </p>
            {/* 👇 Account selection */}
            <AccountCombobox
              // label="Select Account"
              selectedAccount={selectedAccountId}
              onAccountSelect={(value) => setSelectedAccountId(parseInt(value))}
              accountsData={accountsData}
              isLoading={isLoadingAccounts}
              isError={isErrorAccounts}
              refetch={refetchAccounts}
              isRefetching={isRefetchingAccounts}
            />
          </div>
          <GeneralReportQuery
            onFilterChange={handleFilterChange}
            isRefetching={isRefetching}
            refetch={refetch}
            data={data?.entries}
            tableRef={tableRef}
            filters={filters}
            colSpan={2}
            mode={{
              format: "A4-P",
              orientation: "P",
            }}
            totals={{ debit: totalDebit, credit: totalCredit }}
            title={`General Ledger - ${data?.account?.title} (${data?.account?.code})`}
          />
          <DatatableReport
            ref={tableRef}
            columns={columns}
            data={Array.isArray(data?.entries) ? data.entries : []}
            fetchData={refetch}
            isLoading={isLoading}
            isRefetching={isRefetching}
            isError={isError}
            colSpan={3}
            totalDebit={totalDebit}
            totalCredit={totalCredit}
          />
        </div>
      </div>
    </>
  );
};

export default GeneralLedger;

import { useRef, useState } from "react";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import useBranchFilter from "@/MiddleWares/Hooks/useBranchFilter";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AccountCombobox } from "@/Pages/Components/AccountCombobox";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import DatatableReport from "@/Pages/Components/DatatableReport";
import ReportFilterBar from "../Queries/ReportFilterBar";
import { formatDateTimestamp } from "@/lib/utils";

const GeneralLedger = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const tableRef = useRef(null);

  const [selectedAccountId, setSelectedAccountId] = useState("");
  const { branchKey } = useBranchFilter();
  const [filters, setFilters] = useState({
    startDate: "", endDate: "", branch_id: String(branchKey ?? ""), status: "completed",
  });

  const { data = {}, isLoading, refetch, isRefetching, isError } = useQuery({
    queryKey: ["general-ledger-statement", selectedAccountId, filters],
    queryFn: async ({ signal }) => {
      if (!selectedAccountId) return {};
      const res = await axiosPrivate.get(
        `/reports/accounting/general-ledger/${selectedAccountId}`,
        {
          params: { startDate: filters.startDate, endDate: filters.endDate, branch_id: filters.branch_id, status: filters.status },
          signal,
        }
      );
      return res?.data?.data ?? {};
    },
    placeholderData: (prev) => prev,
    enabled: !!selectedAccountId,
  });

  const { data: accountsData, isLoading: isLoadingAccounts, isError: isErrorAccounts,
    refetch: refetchAccounts, isRefetching: isRefetchingAccounts } = useQuery({
    queryKey: ["account-votes"],
    queryFn: async () => {
      const res = await axiosPrivate.get("/settings/accounts/account");
      return res.data.data.accounts;
    },
  });

  const entries = Array.isArray(data?.entries) ? data.entries : [];
  const totalDebit  = entries.reduce((s, e) => s + (parseFloat(e?.debit)  || 0), 0);
  const totalCredit = entries.reduce((s, e) => s + (parseFloat(e?.credit) || 0), 0);

  const columns = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => <p className="text-xs">{formatDateTimestamp(row.original.date)}</p>,
    },
    {
      accessorKey: "code",
      header: "Ref",
      cell: ({ row }) => <Badge variant="secondary" className="text-xs font-mono">{row.original.code}</Badge>,
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => <p className="text-xs">{row.original.description}</p>,
    },
    {
      accessorKey: "debit",
      header: "Debit",
      cell: ({ row }) => (
        <p className="text-xs tabular-nums">
          {row.original.debit ? parseFloat(row.original.debit).toLocaleString() : "0"}
        </p>
      ),
    },
    {
      accessorKey: "credit",
      header: "Credit",
      cell: ({ row }) => (
        <p className="text-xs tabular-nums">
          {row.original.credit ? parseFloat(row.original.credit).toLocaleString() : "0"}
        </p>
      ),
    },
    {
      accessorKey: "balance",
      header: "Balance",
      cell: ({ row }) => (
        <p className="text-xs tabular-nums font-medium">
          {row.original.balance ? parseFloat(row.original.balance).toLocaleString() : "0"}
        </p>
      ),
    },
  ];

  const exportHeaders = ["Date", "Ref", "Description", "Debit", "Credit", "Balance"];
  const exportRows = entries.map((r) => [
    r.date, r.code, r.description,
    parseFloat(r.debit || 0).toFixed(2),
    parseFloat(r.credit || 0).toFixed(2),
    parseFloat(r.balance || 0).toFixed(2),
  ]);

  const accountLabel = selectedAccountId && data?.account
    ? `${data.account.title} (${data.account.code}) — ${data.account.type}`
    : "";

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink to="/dashboard">Home</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink to="/accounting-reports">Accounting Reports</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>General Ledger</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-1 space-y-4 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h5 className="text-2xl font-bold tracking-tight">General Ledger</h5>
          {accountLabel && <p className="text-sm text-muted-foreground">{accountLabel}</p>}
        </div>

        <ReportFilterBar
          onApply={setFilters}
          isLoading={isRefetching}
          showStatus
          extra={
            <div className="space-y-1">
              <Label className="text-xs font-medium text-muted-foreground">Account</Label>
              <AccountCombobox
                selectedAccount={selectedAccountId}
                onAccountSelect={(v) => setSelectedAccountId(parseInt(v))}
                accountsData={accountsData}
                isLoading={isLoadingAccounts}
                isError={isErrorAccounts}
                refetch={refetchAccounts}
                isRefetching={isRefetchingAccounts}
              />
            </div>
          }
          exportTitle={`General Ledger — ${data?.account?.title ?? ""}`}
          exportFilename="general-ledger"
          exportHeaders={exportHeaders}
          exportRows={exportRows}
          exportDisabled={!entries.length}
        />

        {!selectedAccountId && (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Select an account above to view its ledger entries.
          </p>
        )}

        {selectedAccountId && (
          <DatatableReport
            ref={tableRef}
            columns={columns}
            data={entries}
            fetchData={refetch}
            isLoading={isLoading}
            isRefetching={isRefetching}
            isError={isError}
            colSpan={3}
            totalDebit={totalDebit}
            totalCredit={totalCredit}
          />
        )}
      </div>
    </>
  );
};

export default GeneralLedger;

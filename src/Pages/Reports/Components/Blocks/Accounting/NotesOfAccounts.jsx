/* eslint-disable react/prop-types */
import { useState } from "react";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import useBranchFilter from "@/MiddleWares/Hooks/useBranchFilter";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import ReportFilterBar from "../Queries/ReportFilterBar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

const fmt = (v) =>
  new Intl.NumberFormat("en-UG", { maximumFractionDigits: 0 }).format(v ?? 0);

const ACCOUNT_TYPES = ["assets", "liabilities", "equity", "income", "expenses"];

const NotesOfAccounts = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const { branchKey } = useBranchFilter();
  const [filters, setFilters] = useState({ startDate: "", endDate: "", branch_id: String(branchKey ?? "") });
  const [accountType, setAccountType] = useState("");

  const { data = {}, isLoading, isRefetching, isError } = useQuery({
    queryKey: ["notes-of-accounts", filters, accountType],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get("reports/accounting/notes-of-accounts", {
          params: {
            startDate:    filters.startDate    || undefined,
            endDate:      filters.endDate      || undefined,
            branch_id:    filters.branch_id    || undefined,
            account_type: accountType          || undefined,
          },
        });
        return res?.data?.data ?? {};
      } catch (err) {
        if (err?.response?.status === 401) navigate("/", { replace: true });
        throw err;
      }
    },
    placeholderData: (prev) => prev,
  });

  const notes  = data?.notes  ?? [];
  const totals = data?.totals ?? {};
  const period = data?.period ?? {};

  const exportHeaders = ["Code", "Account", "Type", "Open Dr", "Open Cr", "Period Dr", "Period Cr", "Closing Dr", "Closing Cr", "Entries"];
  const exportRows = notes.map((r) => [
    r.account_code, r.account_title, r.account_type,
    r.open_debit, r.open_credit,
    r.period_debit, r.period_credit,
    r.closing_debit, r.closing_credit,
    r.entry_count,
  ]);

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink to="/dashboard">Home</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink to="/accounting-reports">Accounting Reports</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Notes of Accounts</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-1 space-y-4 pt-2">
        <h5 className="text-2xl font-bold tracking-tight">Notes of Accounts</h5>

        <ReportFilterBar
          onApply={setFilters}
          isLoading={isRefetching}
          showStatus={false}
          exportTitle="Notes of Accounts"
          exportFilename="notes_of_accounts"
          exportHeaders={exportHeaders}
          exportRows={exportRows}
          exportDisabled={!notes.length}
          extra={
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Account Type</p>
              <select
                className="h-8 rounded-md border border-input bg-background px-2 text-xs w-36"
                value={accountType}
                onChange={(e) => setAccountType(e.target.value)}
              >
                <option value="">All Types</option>
                {ACCOUNT_TYPES.map((t) => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
          }
        />

        {isError && <p className="text-sm text-destructive">Failed to load report. Please try again.</p>}

        {isLoading ? (
          <Skeleton className="h-64 rounded-xl" />
        ) : notes.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No account movement found for the selected period.</p>
        ) : (
          <>
            {period.start_date && (
              <p className="text-xs text-muted-foreground">
                Period: <strong>{period.start_date}</strong> → <strong>{period.end_date}</strong>
              </p>
            )}
            <div className="rounded-lg border overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Code</th>
                    <th className="px-3 py-2 text-left font-medium">Account</th>
                    <th className="px-3 py-2 text-left font-medium">Type</th>
                    <th className="px-3 py-2 text-right font-medium">Open Dr</th>
                    <th className="px-3 py-2 text-right font-medium">Open Cr</th>
                    <th className="px-3 py-2 text-right font-medium bg-blue-50/50">Period Dr</th>
                    <th className="px-3 py-2 text-right font-medium bg-blue-50/50">Period Cr</th>
                    <th className="px-3 py-2 text-right font-medium bg-emerald-50/50">Closing Dr</th>
                    <th className="px-3 py-2 text-right font-medium bg-emerald-50/50">Closing Cr</th>
                    <th className="px-3 py-2 text-right font-medium">Entries</th>
                  </tr>
                </thead>
                <tbody>
                  {notes.map((r) => (
                    <tr key={r.account_id} className="border-t hover:bg-muted/20">
                      <td className="px-3 py-2 font-mono">{r.account_code}</td>
                      <td className="px-3 py-2 font-medium">{r.account_title}</td>
                      <td className="px-3 py-2">
                        <Badge variant="outline" className="text-xs capitalize">{r.account_type}</Badge>
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{fmt(r.open_debit)}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{fmt(r.open_credit)}</td>
                      <td className="px-3 py-2 text-right tabular-nums bg-blue-50/30">{fmt(r.period_debit)}</td>
                      <td className="px-3 py-2 text-right tabular-nums bg-blue-50/30">{fmt(r.period_credit)}</td>
                      <td className="px-3 py-2 text-right tabular-nums bg-emerald-50/30 font-medium">{fmt(r.closing_debit)}</td>
                      <td className="px-3 py-2 text-right tabular-nums bg-emerald-50/30 font-medium">{fmt(r.closing_credit)}</td>
                      <td className="px-3 py-2 text-right text-muted-foreground">{r.entry_count}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 bg-muted/30">
                  <tr>
                    <td colSpan={3} className="px-3 py-2 font-bold">Totals ({notes.length} accounts)</td>
                    <td className="px-3 py-2 text-right font-bold tabular-nums">{fmt(totals.open_debit)}</td>
                    <td className="px-3 py-2 text-right font-bold tabular-nums">{fmt(totals.open_credit)}</td>
                    <td className="px-3 py-2 text-right font-bold tabular-nums bg-blue-50/30">{fmt(totals.period_debit)}</td>
                    <td className="px-3 py-2 text-right font-bold tabular-nums bg-blue-50/30">{fmt(totals.period_credit)}</td>
                    <td className="px-3 py-2 text-right font-bold tabular-nums bg-emerald-50/30">{fmt(totals.closing_debit)}</td>
                    <td className="px-3 py-2 text-right font-bold tabular-nums bg-emerald-50/30">{fmt(totals.closing_credit)}</td>
                    <td className="px-3 py-2" />
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default NotesOfAccounts;

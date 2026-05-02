/* eslint-disable react/prop-types */
import { useRef, useState } from "react";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import ReportFilterBar from "../Queries/ReportFilterBar";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";

const fmt = (v) =>
  new Intl.NumberFormat("en-UG", { maximumFractionDigits: 0 }).format(v ?? 0);

const ComprehensiveTrialBalance = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ startDate: "", endDate: "", branch_id: "", status: "completed" });

  const { data = {}, isLoading, isRefetching, isError } = useQuery({
    queryKey: ["comprehensive-trial-balance", filters],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get("reports/accounting/comprehensive-trial-balance", {
          params: {
            startDate:  filters.startDate || undefined,
            endDate:    filters.endDate   || undefined,
            branch_id:  filters.branch_id || undefined,
            status:     filters.status    || "completed",
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

  const rows   = data?.rows   ?? [];
  const totals = data?.totals ?? {};
  const period = data?.period ?? {};

  const exportHeaders = [
    "Code", "Account", "Type",
    "Open Dr", "Open Cr",
    "Period Dr", "Period Cr",
    "Closing Dr", "Closing Cr",
  ];
  const exportRows = rows.map((r) => [
    r.account_code, r.account_title, r.account_type,
    r.open_dr, r.open_cr,
    r.period_dr, r.period_cr,
    r.closing_dr, r.closing_cr,
  ]);

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink to="/dashboard">Home</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink to="/accounting-reports">Accounting Reports</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Comprehensive Trial Balance</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-1 space-y-4 pt-2">
        <h5 className="text-2xl font-bold tracking-tight">Comprehensive Trial Balance</h5>

        <ReportFilterBar
          onApply={setFilters}
          isLoading={isRefetching}
          showStatus
          exportTitle="Comprehensive Trial Balance"
          exportFilename="comprehensive_trial_balance"
          exportHeaders={exportHeaders}
          exportRows={exportRows}
          exportDisabled={!rows.length}
        />

        {isError && <p className="text-sm text-destructive">Failed to load report. Please try again.</p>}

        {isLoading ? (
          <Skeleton className="h-64 rounded-xl" />
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No data found for the selected period.</p>
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
                    <th className="px-3 py-2 text-left font-medium" rowSpan={2}>Code</th>
                    <th className="px-3 py-2 text-left font-medium" rowSpan={2}>Account</th>
                    <th className="px-3 py-2 text-left font-medium" rowSpan={2}>Type</th>
                    <th className="px-3 py-2 text-center font-medium border-l bg-muted/40" colSpan={2}>Opening Balance</th>
                    <th className="px-3 py-2 text-center font-medium border-l bg-blue-50/60" colSpan={2}>Period Movement</th>
                    <th className="px-3 py-2 text-center font-medium border-l bg-emerald-50/60" colSpan={2}>Closing Balance</th>
                  </tr>
                  <tr>
                    <th className="px-3 py-2 text-right font-medium border-l bg-muted/40">Dr</th>
                    <th className="px-3 py-2 text-right font-medium bg-muted/40">Cr</th>
                    <th className="px-3 py-2 text-right font-medium border-l bg-blue-50/40">Dr</th>
                    <th className="px-3 py-2 text-right font-medium bg-blue-50/40">Cr</th>
                    <th className="px-3 py-2 text-right font-medium border-l bg-emerald-50/40">Dr</th>
                    <th className="px-3 py-2 text-right font-medium bg-emerald-50/40">Cr</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.account_id} className="border-t hover:bg-muted/20">
                      <td className="px-3 py-2 font-mono">
                        <Link to={`/ledgers/accounts/${r.account_id}`} className="text-primary hover:underline">
                          {r.account_code}
                        </Link>
                      </td>
                      <td className="px-3 py-2">{r.account_title}</td>
                      <td className="px-3 py-2 capitalize text-muted-foreground">{r.account_type}</td>
                      <td className="px-3 py-2 text-right tabular-nums border-l">{r.open_dr > 0 ? fmt(r.open_dr) : "—"}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{r.open_cr > 0 ? fmt(r.open_cr) : "—"}</td>
                      <td className="px-3 py-2 text-right tabular-nums border-l bg-blue-50/20">{r.period_dr > 0 ? fmt(r.period_dr) : "—"}</td>
                      <td className="px-3 py-2 text-right tabular-nums bg-blue-50/20">{r.period_cr > 0 ? fmt(r.period_cr) : "—"}</td>
                      <td className="px-3 py-2 text-right tabular-nums border-l bg-emerald-50/20 font-medium">{r.closing_dr > 0 ? fmt(r.closing_dr) : "—"}</td>
                      <td className="px-3 py-2 text-right tabular-nums bg-emerald-50/20 font-medium">{r.closing_cr > 0 ? fmt(r.closing_cr) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 bg-muted/30">
                  <tr>
                    <td colSpan={3} className="px-3 py-2 font-bold">Totals ({rows.length} accounts)</td>
                    <td className="px-3 py-2 text-right font-bold tabular-nums border-l">{fmt(totals.open_dr)}</td>
                    <td className="px-3 py-2 text-right font-bold tabular-nums">{fmt(totals.open_cr)}</td>
                    <td className="px-3 py-2 text-right font-bold tabular-nums border-l bg-blue-50/30">{fmt(totals.period_dr)}</td>
                    <td className="px-3 py-2 text-right font-bold tabular-nums bg-blue-50/30">{fmt(totals.period_cr)}</td>
                    <td className="px-3 py-2 text-right font-bold tabular-nums border-l bg-emerald-50/30">{fmt(totals.close_dr)}</td>
                    <td className="px-3 py-2 text-right font-bold tabular-nums bg-emerald-50/30">{fmt(totals.close_cr)}</td>
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

export default ComprehensiveTrialBalance;

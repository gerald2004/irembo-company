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
import { ChevronDown, ChevronRight } from "lucide-react";

const fmt = (v) =>
  new Intl.NumberFormat("en-UG", { maximumFractionDigits: 0 }).format(v ?? 0);

const TYPE_COLORS = {
  assets:      "bg-blue-50 text-blue-700 border-blue-200",
  liabilities: "bg-red-50 text-red-700 border-red-200",
  equity:      "bg-violet-50 text-violet-700 border-violet-200",
  income:      "bg-green-50 text-green-700 border-green-200",
  expenses:    "bg-amber-50 text-amber-700 border-amber-200",
};

const CategorySection = ({ cat }) => {
  const [open, setOpen] = useState(true);
  const colorCls = TYPE_COLORS[cat.category.toLowerCase()] ?? "bg-gray-50 text-gray-700 border-gray-200";

  return (
    <div className="rounded-lg border overflow-hidden">
      {/* Section header */}
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-2.5 bg-muted/40 hover:bg-muted/60 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          <span className="font-semibold text-sm">{cat.category}</span>
          <Badge className={`text-xs border ${colorCls}`}>{cat.accounts.length} accounts</Badge>
        </div>
        <div className="flex items-center gap-6 text-xs">
          <span className="text-muted-foreground">Dr: <strong className="text-foreground tabular-nums">{fmt(cat.subtotal_debit)}</strong></span>
          <span className="text-muted-foreground">Cr: <strong className="text-foreground tabular-nums">{fmt(cat.subtotal_credit)}</strong></span>
          <span className="text-muted-foreground">Net: <strong className={`tabular-nums ${cat.subtotal_net >= 0 ? "text-green-700" : "text-red-700"}`}>{fmt(cat.subtotal_net)}</strong></span>
        </div>
      </button>

      {/* Account rows */}
      {open && (
        <table className="w-full text-xs">
          <thead className="bg-muted/20">
            <tr>
              <th className="px-4 py-1.5 text-left font-medium text-muted-foreground">Code</th>
              <th className="px-4 py-1.5 text-left font-medium text-muted-foreground">Account</th>
              <th className="px-4 py-1.5 text-right font-medium text-muted-foreground">Debit</th>
              <th className="px-4 py-1.5 text-right font-medium text-muted-foreground">Credit</th>
              <th className="px-4 py-1.5 text-right font-medium text-muted-foreground">Net</th>
            </tr>
          </thead>
          <tbody>
            {cat.accounts.map((a) => (
              <tr key={a.account_id} className="border-t hover:bg-muted/10">
                <td className="px-4 py-1.5 font-mono text-muted-foreground">{a.account_code}</td>
                <td className="px-4 py-1.5">{a.account_title}</td>
                <td className="px-4 py-1.5 text-right tabular-nums">{a.debit > 0 ? fmt(a.debit) : "—"}</td>
                <td className="px-4 py-1.5 text-right tabular-nums">{a.credit > 0 ? fmt(a.credit) : "—"}</td>
                <td className={`px-4 py-1.5 text-right tabular-nums font-medium ${a.net >= 0 ? "text-green-700" : "text-red-700"}`}>
                  {fmt(a.net)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t bg-muted/20">
            <tr>
              <td colSpan={2} className="px-4 py-1.5 font-semibold">Subtotal — {cat.category}</td>
              <td className="px-4 py-1.5 text-right font-semibold tabular-nums">{fmt(cat.subtotal_debit)}</td>
              <td className="px-4 py-1.5 text-right font-semibold tabular-nums">{fmt(cat.subtotal_credit)}</td>
              <td className={`px-4 py-1.5 text-right font-semibold tabular-nums ${cat.subtotal_net >= 0 ? "text-green-700" : "text-red-700"}`}>
                {fmt(cat.subtotal_net)}
              </td>
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  );
};

const CategoryReport = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const { branchKey } = useBranchFilter();
  const [filters, setFilters] = useState({ startDate: "", endDate: "", branch_id: String(branchKey ?? ""), status: "completed" });

  const { data = {}, isLoading, isRefetching, isError } = useQuery({
    queryKey: ["category-report", filters],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get("reports/accounting/category-report", {
          params: {
            startDate: filters.startDate || undefined,
            endDate:   filters.endDate   || undefined,
            branch_id: filters.branch_id || undefined,
            status:    filters.status    || "completed",
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

  const categories  = data?.categories   ?? [];
  const grandTotals = data?.grand_totals ?? {};
  const period      = data?.period       ?? {};

  const allAccounts = categories.flatMap((c) => c.accounts);
  const exportHeaders = ["Category", "Code", "Account", "Debit", "Credit", "Net"];
  const exportRows = categories.flatMap((c) =>
    c.accounts.map((a) => [c.category, a.account_code, a.account_title, a.debit, a.credit, a.net])
  );

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink to="/dashboard">Home</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink to="/accounting-reports">Accounting Reports</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Category Report</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-1 space-y-4 pt-2">
        <h5 className="text-2xl font-bold tracking-tight">Account Category Report</h5>

        <ReportFilterBar
          onApply={setFilters}
          isLoading={isRefetching}
          showStatus
          exportTitle="Account Category Report"
          exportFilename="category_report"
          exportHeaders={exportHeaders}
          exportRows={exportRows}
          exportDisabled={!allAccounts.length}
        />

        {isError && <p className="text-sm text-destructive">Failed to load report. Please try again.</p>}

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)}
          </div>
        ) : categories.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No data found for the selected period.</p>
        ) : (
          <>
            {period.start_date && (
              <p className="text-xs text-muted-foreground">
                Period: <strong>{period.start_date}</strong> → <strong>{period.end_date}</strong>
              </p>
            )}

            <div className="space-y-3">
              {categories.map((cat) => (
                <CategorySection key={cat.category} cat={cat} />
              ))}
            </div>

            {/* Grand total */}
            <div className="rounded-lg border bg-muted/20 px-4 py-3 flex items-center justify-between">
              <span className="font-bold text-sm">Grand Total — {allAccounts.length} accounts across {categories.length} categories</span>
              <div className="flex items-center gap-6 text-xs">
                <span>Dr: <strong className="tabular-nums">{fmt(grandTotals.debit)}</strong></span>
                <span>Cr: <strong className="tabular-nums">{fmt(grandTotals.credit)}</strong></span>
                <span>Net: <strong className={`tabular-nums ${(grandTotals.net ?? 0) >= 0 ? "text-green-700" : "text-red-700"}`}>{fmt(grandTotals.net)}</strong></span>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default CategoryReport;

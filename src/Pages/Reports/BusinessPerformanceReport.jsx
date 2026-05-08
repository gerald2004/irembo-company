/* eslint-disable react/prop-types */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp, TrendingDown, Users, Wallet, CreditCard, ShieldAlert,
  PiggyBank, BarChart3, Target, ArrowUpRight, ArrowDownRight, Minus,
} from "lucide-react";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import useBranchFilter from "@/MiddleWares/Hooks/useBranchFilter";
import ReportFilterBar from "./Components/Blocks/Queries/ReportFilterBar";
import ReportKpi from "./Components/ReportKpi";
import { IncomeExpenses } from "@/Pages/Dashboard/components/others/IncomeExpenses";

const fmt   = (v) => (v != null ? Number(v).toLocaleString("en-UG") : "—");
const fmtPct = (v) => (v != null ? `${Number(v).toFixed(1)}%` : "—");
const fmtAbs = (v) => (v != null ? Math.abs(Number(v)).toLocaleString("en-UG") : "—");

function ChangeBadge({ chg, inverse = false }) {
  if (chg == null) return null;
  const positive = inverse ? chg < 0 : chg > 0;
  const neutral  = chg === 0;
  if (neutral) return (
    <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-0.5">
      <Minus className="h-2.5 w-2.5" /> 0%
    </Badge>
  );
  return (
    <Badge
      variant="outline"
      className={`text-[10px] px-1.5 py-0 gap-0.5 ${
        positive
          ? "border-emerald-300 text-emerald-700 bg-emerald-50"
          : "border-rose-300 text-rose-700 bg-rose-50"
      }`}
    >
      {positive
        ? <ArrowUpRight className="h-2.5 w-2.5" />
        : <ArrowDownRight className="h-2.5 w-2.5" />}
      {fmtPct(Math.abs(chg))}
    </Badge>
  );
}

function MetricRow({ label, curr, prior, chg, prefix = "", suffix = "", inverse = false }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b last:border-0 text-sm">
      <span className="text-muted-foreground text-xs">{label}</span>
      <div className="flex items-center gap-2 shrink-0">
        <span className="font-semibold tabular-nums">{prefix}{fmt(curr)}{suffix}</span>
        <span className="text-muted-foreground tabular-nums text-xs hidden sm:block">
          vs {prefix}{fmt(prior)}{suffix}
        </span>
        <ChangeBadge chg={chg} inverse={inverse} />
      </div>
    </div>
  );
}

function ParGauge({ ratio, label }) {
  const pct = Math.min(100, Math.max(0, ratio ?? 0));
  const color = pct > 20 ? "bg-rose-500" : pct > 10 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span className={`font-bold ${pct > 20 ? "text-rose-600" : pct > 10 ? "text-amber-600" : "text-emerald-600"}`}>
          {fmtPct(pct)}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[10px] text-muted-foreground">
        {pct === 0 ? "No at-risk loans" : pct <= 5 ? "Healthy range" : pct <= 10 ? "Watch closely" : pct <= 20 ? "Elevated risk" : "Critical — action needed"}
      </p>
    </div>
  );
}

const BusinessPerformanceReport = () => {
  const axios = useAxiosPrivate();
  const navigate = useNavigate();

  const { branchKey } = useBranchFilter();
  const [filters, setFilters] = useState({ startDate: "", endDate: "", branch_id: String(branchKey ?? "") });

  const { data, isLoading, isRefetching, isError } = useQuery({
    queryKey: ["business-performance-report", filters],
    queryFn: async ({ signal }) => {
      try {
        const res = await axios.get("/reports/business/performance", {
          params: { startDate: filters.startDate, endDate: filters.endDate, branch_id: filters.branch_id },
          signal,
        });
        return res.data?.data ?? null;
      } catch (err) {
        if (err?.response?.status === 401) navigate("/", { replace: true });
        throw err;
      }
    },
    placeholderData: (prev) => prev,
  });

  const period  = data?.period;
  const members = data?.members;
  const fin     = data?.financial;
  const loans   = data?.loans;
  const savings = data?.savings;
  const trend   = (data?.trend ?? []).map((d) => ({ period: d.month, income: d.income, expenses: d.expenses }));

  const exportHeaders = ["Metric", "Current Period", "Prior Period", "Change %"];
  const exportRows = data ? [
    ["Total Members",          members?.total,               "—",                  "—"],
    ["New Members",            members?.new_curr,            members?.new_prior,   members?.growth_pct ?? ""],
    ["Total Income",           fin?.income?.curr,            fin?.income?.prior,   fin?.income?.chg ?? ""],
    ["Total Expenses",         fin?.expenses?.curr,          fin?.expenses?.prior, fin?.expenses?.chg ?? ""],
    ["Net Profit",             fin?.net_profit?.curr,        fin?.net_profit?.prior, fin?.net_profit?.chg ?? ""],
    ["Profit Margin (%)",      fin?.profit_margin?.curr,     fin?.profit_margin?.prior, fin?.profit_margin?.chg ?? ""],
    ["OSS (%)",                fin?.oss?.curr,               fin?.oss?.prior,      fin?.oss?.chg ?? ""],
    ["Gross Loan Portfolio",   loans?.gross_portfolio,       "—",                  "—"],
    ["Active Borrowers",       loans?.active_borrowers,      "—",                  "—"],
    ["Avg Loan Size",          loans?.avg_loan_size,         "—",                  "—"],
    ["Loans Disbursed (amt)",  loans?.disbursed_amount?.curr, loans?.disbursed_amount?.prior, loans?.disbursed_amount?.chg ?? ""],
    ["Loans Disbursed (#)",    loans?.disbursed_count?.curr, loans?.disbursed_count?.prior, ""],
    ["PAR30 (%)",              loans?.par30?.ratio,          "—",                  "—"],
    ["PAR90 (%)",              loans?.par90?.ratio,          "—",                  "—"],
    ["Loan-to-Savings Ratio",  loans?.loan_to_savings,       "—",                  "—"],
    ["Total Savings",          savings?.total,               "—",                  "—"],
    ["Deposits",               savings?.deposits?.curr,      savings?.deposits?.prior, savings?.deposits?.chg ?? ""],
    ["Withdrawals",            savings?.withdrawals?.curr,   savings?.withdrawals?.prior, savings?.withdrawals?.chg ?? ""],
    ["Net Savings Flow",       savings?.net_flow?.curr,      savings?.net_flow?.prior, savings?.net_flow?.chg ?? ""],
  ] : [];

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink to="/dashboard">Home</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Business Performance Report</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-1 space-y-6 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h5 className="text-2xl font-bold tracking-tight">Business Performance Report</h5>
            {!isLoading && period && (
              <p className="text-xs text-muted-foreground mt-1">
                Current period: {period.current.start} → {period.current.end}
                {" · "}Compared to: {period.prior.start} → {period.prior.end}
              </p>
            )}
          </div>
        </div>

        <ReportFilterBar
          onApply={setFilters}
          isLoading={isRefetching}
          showStatus={false}
          exportTitle="Business Performance Report"
          exportFilename="business_performance"
          exportHeaders={exportHeaders}
          exportRows={exportRows}
          exportDisabled={!data}
        />

        {isError && (
          <p className="text-sm text-destructive">Failed to load report. Please try again.</p>
        )}

        {isLoading && !data ? (
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : data ? (
          <>
            {/* ── KPI SUMMARY ROW ──────────────────────────────────────────── */}
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
              <ReportKpi
                label="Total Members"
                value={fmt(members?.total)}
                hint={`+${fmt(members?.new_curr)} this period`}
                icon={<Users className="h-4 w-4" />}
                accent="bg-indigo-500"
              />
              <ReportKpi
                label="Net Profit"
                value={fmt(fin?.net_profit?.curr)}
                hint={<ChangeBadge chg={fin?.net_profit?.chg} />}
                icon={<TrendingUp className="h-4 w-4" />}
                accent={fin?.net_profit?.curr >= 0 ? "bg-emerald-500" : "bg-rose-500"}
              />
              <ReportKpi
                label="OSS"
                value={fmtPct(fin?.oss?.curr)}
                hint={fin?.oss?.curr >= 100 ? "Self-sufficient" : "Below break-even"}
                icon={<Target className="h-4 w-4" />}
                accent={fin?.oss?.curr >= 100 ? "bg-emerald-500" : "bg-amber-500"}
              />
              <ReportKpi
                label="Gross Loan Portfolio"
                value={fmt(loans?.gross_portfolio)}
                hint={`${fmt(loans?.active_borrowers)} active borrowers`}
                icon={<CreditCard className="h-4 w-4" />}
                accent="bg-sky-500"
              />
              <ReportKpi
                label="Total Savings"
                value={fmt(savings?.total)}
                hint={`${fmt(savings?.active_accounts)} active accounts`}
                icon={<PiggyBank className="h-4 w-4" />}
                accent="bg-violet-500"
              />
            </div>

            {/* ── MAIN SECTIONS ────────────────────────────────────────────── */}
            <div className="grid gap-4 lg:grid-cols-3">

              {/* Financial Performance */}
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-emerald-600" /> Financial Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-0">
                  <MetricRow label="Total Income"   curr={fin?.income?.curr}        prior={fin?.income?.prior}        chg={fin?.income?.chg} />
                  <MetricRow label="Total Expenses" curr={fin?.expenses?.curr}      prior={fin?.expenses?.prior}      chg={fin?.expenses?.chg} inverse />
                  <MetricRow label="Net Profit"     curr={fin?.net_profit?.curr}    prior={fin?.net_profit?.prior}    chg={fin?.net_profit?.chg} />
                  <div className="py-2 border-b last:border-0 flex items-center justify-between gap-3 text-sm">
                    <span className="text-muted-foreground text-xs">Profit Margin</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-semibold tabular-nums">{fmtPct(fin?.profit_margin?.curr)}</span>
                      <span className="text-muted-foreground tabular-nums text-xs hidden sm:block">vs {fmtPct(fin?.profit_margin?.prior)}</span>
                      <ChangeBadge chg={fin?.profit_margin?.chg} />
                    </div>
                  </div>
                  <div className="py-2 flex items-center justify-between gap-3 text-sm">
                    <span className="text-muted-foreground text-xs">Operational Self-Sufficiency</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`font-bold tabular-nums ${fin?.oss?.curr >= 100 ? "text-emerald-600" : "text-rose-600"}`}>
                        {fmtPct(fin?.oss?.curr)}
                      </span>
                      <ChangeBadge chg={fin?.oss?.chg} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Loan Portfolio */}
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-sky-600" /> Loan Portfolio
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-0">
                  <div className="py-2 border-b text-sm flex justify-between">
                    <span className="text-muted-foreground text-xs">Gross Portfolio</span>
                    <span className="font-bold text-sky-700">{fmt(loans?.gross_portfolio)}</span>
                  </div>
                  <div className="py-2 border-b text-sm flex justify-between">
                    <span className="text-muted-foreground text-xs">Active Borrowers</span>
                    <span className="font-semibold">{fmt(loans?.active_borrowers)}</span>
                  </div>
                  <div className="py-2 border-b text-sm flex justify-between">
                    <span className="text-muted-foreground text-xs">Avg Loan Size</span>
                    <span className="font-semibold tabular-nums">{fmt(loans?.avg_loan_size)}</span>
                  </div>
                  <MetricRow label="Disbursed (Amount)" curr={loans?.disbursed_amount?.curr} prior={loans?.disbursed_amount?.prior} chg={loans?.disbursed_amount?.chg} />
                  <div className="py-2 border-b text-sm flex justify-between">
                    <span className="text-muted-foreground text-xs">Disbursed (#) — vs prior</span>
                    <span className="font-semibold">
                      {loans?.disbursed_count?.curr ?? "—"} / {loans?.disbursed_count?.prior ?? "—"}
                    </span>
                  </div>
                  <div className="py-2 text-sm flex justify-between">
                    <span className="text-muted-foreground text-xs">Loan-to-Savings Ratio</span>
                    <span className={`font-bold ${(loans?.loan_to_savings ?? 0) > 90 ? "text-rose-600" : "text-amber-600"}`}>
                      {fmtPct(loans?.loan_to_savings)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Savings & Members */}
              <Card className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-violet-600" /> Savings & Members
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-0">
                  <div className="py-2 border-b text-sm flex justify-between">
                    <span className="text-muted-foreground text-xs">Total Savings</span>
                    <span className="font-bold text-violet-700">{fmt(savings?.total)}</span>
                  </div>
                  <div className="py-2 border-b text-sm flex justify-between">
                    <span className="text-muted-foreground text-xs">Avg Savings / Member</span>
                    <span className="font-semibold tabular-nums">{fmt(savings?.avg_per_member)}</span>
                  </div>
                  <MetricRow label="Deposits"    curr={savings?.deposits?.curr}    prior={savings?.deposits?.prior}    chg={savings?.deposits?.chg} />
                  <MetricRow label="Withdrawals" curr={savings?.withdrawals?.curr} prior={savings?.withdrawals?.prior} chg={savings?.withdrawals?.chg} inverse />
                  <MetricRow label="Net Savings Flow" curr={savings?.net_flow?.curr} prior={savings?.net_flow?.prior} chg={savings?.net_flow?.chg} />
                  <div className="py-2 text-sm flex justify-between items-center">
                    <span className="text-muted-foreground text-xs">New Members (this period)</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{fmt(members?.new_curr)}</span>
                      <ChangeBadge chg={members?.growth_pct} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ── PORTFOLIO AT RISK ─────────────────────────────────────────── */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-rose-600" /> Portfolio At Risk (PAR)
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Percentage of total loan portfolio with any instalment overdue by 30 or 90 days.
                  Industry benchmark: PAR30 {"<"} 5%, PAR90 {"<"} 2%.
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-3">
                    <ParGauge ratio={loans?.par30?.ratio} label="PAR30 (30+ days overdue)" />
                    <p className="text-xs text-muted-foreground tabular-nums">
                      At-risk balance: <strong>{fmt(loans?.par30?.balance)}</strong>
                      {" · "}{loans?.par30?.count ?? 0} loan{loans?.par30?.count !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="space-y-3">
                    <ParGauge ratio={loans?.par90?.ratio} label="PAR90 (90+ days overdue)" />
                    <p className="text-xs text-muted-foreground tabular-nums">
                      At-risk balance: <strong>{fmt(loans?.par90?.balance)}</strong>
                      {" · "}{loans?.par90?.count ?? 0} loan{loans?.par90?.count !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                  <div>
                    <p className="font-medium text-foreground">Cost per Borrower</p>
                    <p className="text-base font-bold tabular-nums text-foreground">{fmt(loans?.cost_per_borrower)}</p>
                    <p>Total operating expenses ÷ active borrowers</p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Loan-to-Savings Ratio</p>
                    <p className={`text-base font-bold tabular-nums ${(loans?.loan_to_savings ?? 0) > 90 ? "text-rose-600" : "text-amber-600"}`}>
                      {fmtPct(loans?.loan_to_savings)}
                    </p>
                    <p>Gross portfolio as % of total savings</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── 12-MONTH TREND ────────────────────────────────────────────── */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-600" /> 12-Month Income vs Expenses Trend
                </CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <IncomeExpenses monthlyData={trend} />
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </>
  );
};

export default BusinessPerformanceReport;

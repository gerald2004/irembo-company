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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Accordion, AccordionItem, AccordionTrigger, AccordionContent,
} from "@/components/ui/accordion";
import ReportFilterBar from "../Queries/ReportFilterBar";
import ReportKpi from "../../ReportKpi";
import { formatDateTimestamp } from "@/lib/utils";
import { Pie, PieChart, Cell, Legend, Tooltip } from "recharts";
import { Wallet, Hash, User, TrendingUp } from "lucide-react";

const fmt = (v) => new Intl.NumberFormat("en-UG", { maximumFractionDigits: 0 }).format(v ?? 0);
const fmtPct = (v) => `${Number(v ?? 0).toFixed(1)}%`;

const GENDER_COLORS = { Male: "#3b82f6", Female: "#ec4899" };

const PERIOD_OPTIONS = [
  { value: "monthly", label: "Monthly" },
  { value: "weekly",  label: "Weekly" },
  { value: "daily",   label: "Daily" },
];

/** Two-slice male/female pie chart, fed from the report's `summary` block */
const DepositsByGenderPieChart = ({ summary }) => {
  const chartData = [
    { name: "Male",   value: summary?.male?.count   || 0, amount: summary?.male?.amount   || 0 },
    { name: "Female", value: summary?.female?.count || 0, amount: summary?.female?.amount || 0 },
  ].filter((d) => d.value > 0);

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Deposits by Gender</CardTitle>
        <CardDescription className="text-xs">Share of deposit transactions by client gender</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex items-center justify-center pb-4">
        {chartData.length === 0 ? (
          <p className="text-xs text-muted-foreground py-10">No data for the selected filters.</p>
        ) : (
          <PieChart width={280} height={280}>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({ name, value }) => `${name}: ${value}`}
              labelLine={true}
            >
              {chartData.map((d) => (
                <Cell key={d.name} fill={GENDER_COLORS[d.name]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name, props) => [
                `${value} deposits · UGX ${fmt(props.payload.amount)}`,
                name,
              ]}
            />
            <Legend />
          </PieChart>
        )}
      </CardContent>
    </Card>
  );
};

const DepositsDemographicsReport = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const { branchKey } = useBranchFilter();

  const [periodType, setPeriodType] = useState("monthly");
  const [gender, setGender] = useState("all");
  const [filters, setFilters] = useState({ startDate: "", endDate: "", branch_id: String(branchKey ?? "") });

  const { data: raw = {}, isLoading, isRefetching, isError } = useQuery({
    queryKey: ["deposits-demographics-report", filters, periodType, gender],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get("reports/savings/deposits/demographics", {
          params: {
            startDate:   filters.startDate  || undefined,
            endDate:     filters.endDate    || undefined,
            branch_id:   filters.branch_id  || undefined,
            period_type: periodType,
            gender:      gender === "all" ? undefined : gender,
          },
        });
        return res?.data?.data ?? {};
      } catch (error) {
        if (error?.response?.status === 401) navigate("/", { state: { from: location }, replace: true });
        throw error;
      }
    },
    placeholderData: (prev) => prev,
  });

  const meta    = raw?.meta ?? {};
  const summary = raw?.summary ?? {};
  const periods = Array.isArray(raw?.periods) ? raw.periods : [];
  const loading = isLoading || isRefetching;

  // Flatten every period's transactions into export-ready rows
  const exportHeaders = ["Period", "Client", "Account", "Gender", "Amount", "Date", "Status", "Method", "Handled By"];
  const exportRows = periods.flatMap((p) =>
    (p.transactions ?? []).map((t) => ({
      Period: p.period_label,
      Client: t.client,
      Account: t.account,
      Gender: t.gender,
      Amount: t.amount,
      Date: formatDateTimestamp(t.date),
      Status: t.status,
      Method: t.method,
      "Handled By": t.handled_by,
    }))
  );

  const genderFilterControl = (
    <div className="flex items-end gap-3">
      <div className="space-y-1">
        <Label className="text-xs font-medium text-muted-foreground">Gender</Label>
        <Select value={gender} onValueChange={setGender}>
          <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Genders</SelectItem>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs font-medium text-muted-foreground">Group By</Label>
        <div className="flex gap-1">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setPeriodType(opt.value)}
              className={`text-xs px-3 py-1.5 h-8 rounded-md border transition-colors ${
                periodType === opt.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-foreground border-border hover:bg-muted"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink to="/dashboard">Home</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink to="/savings-reports">Savings Reports</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Deposits Demographics</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="space-y-4 pt-2">
        <h5 className="text-2xl font-bold tracking-tight">Client Deposits Demographics Report</h5>

        <ReportFilterBar
          onApply={setFilters}
          isLoading={loading}
          showStatus={false}
          extra={genderFilterControl}
          exportTitle="Client Deposits Demographics Report"
          exportFilename="deposits_demographics"
          exportHeaders={exportHeaders}
          exportRows={exportRows}
          exportDisabled={!periods.length}
        />

        {isError ? (
          <p className="text-sm text-destructive">Failed to load report. Please try again.</p>
        ) : loading && !periods.length ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
            </div>
            <Skeleton className="h-64 rounded-xl" />
          </div>
        ) : periods.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No deposits found for the selected filters.
          </div>
        ) : (
          <>
            {/* KPI summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <ReportKpi
                label="Total Deposits"
                value={`UGX ${fmt(summary.total_amount)}`}
                hint={`${summary.total_count ?? 0} transactions`}
                icon={<Wallet className="w-4 h-4" />}
                accent="bg-emerald-500"
              />
              <ReportKpi
                label="Average Deposit"
                value={`UGX ${fmt(summary.average_amount)}`}
                hint={`${periods.length} ${periodType} periods`}
                icon={<Hash className="w-4 h-4" />}
                accent="bg-blue-500"
              />
              <ReportKpi
                label="Male Depositors"
                value={fmtPct(summary?.male?.percentage)}
                hint={`${summary?.male?.count ?? 0} deposits · UGX ${fmt(summary?.male?.amount)}`}
                icon={<User className="w-4 h-4" />}
                accent="bg-blue-500"
              />
              <ReportKpi
                label="Female Depositors"
                value={fmtPct(summary?.female?.percentage)}
                hint={`${summary?.female?.count ?? 0} deposits · UGX ${fmt(summary?.female?.amount)}`}
                icon={<User className="w-4 h-4" />}
                accent="bg-pink-500"
              />
            </div>

            {/* Gender pie + period breakdown table */}
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="lg:col-span-1">
                <DepositsByGenderPieChart summary={summary} />
              </div>

              <div className="lg:col-span-2 space-y-2">
                <div className="flex items-center justify-between">
                  <h6 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {periodType.charAt(0).toUpperCase() + periodType.slice(1)} Breakdown
                  </h6>
                  <Badge variant="outline" className="text-xs">
                    {meta.start_date} → {meta.end_date}
                  </Badge>
                </div>
                <div className="rounded-lg border overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium">Period</th>
                        <th className="px-3 py-2 text-right font-medium">Total</th>
                        <th className="px-3 py-2 text-right font-medium">Txns</th>
                        <th className="px-3 py-2 text-right font-medium">Male</th>
                        <th className="px-3 py-2 text-right font-medium">Female</th>
                      </tr>
                    </thead>
                    <tbody>
                      {periods.map((p) => (
                        <tr key={p.period_key} className="border-t hover:bg-muted/20">
                          <td className="px-3 py-2 font-medium">{p.period_label}</td>
                          <td className="px-3 py-2 text-right font-semibold text-emerald-700">{fmt(p.total_amount)}</td>
                          <td className="px-3 py-2 text-right text-muted-foreground">{p.total_count}</td>
                          <td className="px-3 py-2 text-right text-blue-600">
                            {p.male.count} · {fmt(p.male.amount)}
                          </td>
                          <td className="px-3 py-2 text-right text-pink-600">
                            {p.female.count} · {fmt(p.female.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t bg-muted/30">
                      <tr>
                        <td className="px-3 py-2 font-semibold">Totals</td>
                        <td className="px-3 py-2 text-right font-bold text-emerald-700">{fmt(summary.total_amount)}</td>
                        <td className="px-3 py-2 text-right font-semibold">{summary.total_count}</td>
                        <td className="px-3 py-2 text-right font-semibold text-blue-600">{summary?.male?.count ?? 0}</td>
                        <td className="px-3 py-2 text-right font-semibold text-pink-600">{summary?.female?.count ?? 0}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Trend bar chart */}
                {periods.length > 1 && (() => {
                  const maxVal = periods.reduce((m, p) => Math.max(m, Number(p.total_amount) || 0), 1);
                  return (
                    <div className="rounded-lg border p-4">
                      <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        <TrendingUp className="w-3.5 h-3.5" /> Deposit Trend
                      </div>
                      <div className="flex items-end gap-1" style={{ height: "80px" }}>
                        {periods.map((p) => {
                          const pct = Math.max(((Number(p.total_amount) || 0) / maxVal) * 100, 1);
                          return (
                            <div
                              key={p.period_key}
                              className="flex-1 rounded-t bg-emerald-500 hover:bg-emerald-600 transition-colors cursor-default"
                              style={{ height: `${pct}%` }}
                              title={`${p.period_label}: ${fmt(p.total_amount)}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Per-period transaction drill-down */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h6 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Transactions by Period
                </h6>
                <Badge variant="outline" className="text-xs">{exportRows.length} transactions</Badge>
              </div>
              <div className="rounded-lg border">
                <Accordion type="multiple" className="w-full">
                  {periods.map((p) => (
                    <AccordionItem key={p.period_key} value={p.period_key} className="px-3">
                      <AccordionTrigger>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="font-medium">{p.period_label}</span>
                          <Badge variant="outline" className="text-[10px]">{p.total_count} txns</Badge>
                          <span className="text-muted-foreground">UGX {fmt(p.total_amount)}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead className="bg-muted/50">
                              <tr>
                                <th className="px-2 py-1.5 text-left font-medium">Code</th>
                                <th className="px-2 py-1.5 text-left font-medium">Client</th>
                                <th className="px-2 py-1.5 text-left font-medium">Gender</th>
                                <th className="px-2 py-1.5 text-left font-medium">Account</th>
                                <th className="px-2 py-1.5 text-right font-medium">Amount</th>
                                <th className="px-2 py-1.5 text-left font-medium">Date</th>
                                <th className="px-2 py-1.5 text-left font-medium">Method</th>
                                <th className="px-2 py-1.5 text-left font-medium">Status</th>
                                <th className="px-2 py-1.5 text-left font-medium">Handled By</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(p.transactions ?? []).map((t) => (
                                <tr key={t.id} className="border-t hover:bg-muted/20">
                                  <td className="px-2 py-1.5">{t.code}</td>
                                  <td className="px-2 py-1.5 capitalize">{t.client}</td>
                                  <td className="px-2 py-1.5">
                                    <Badge className={`capitalize text-[10px] ${t.gender === "female" ? "bg-pink-500" : "bg-blue-500"}`}>
                                      {t.gender ?? "—"}
                                    </Badge>
                                  </td>
                                  <td className="px-2 py-1.5">{t.account}</td>
                                  <td className="px-2 py-1.5 text-right font-medium">{fmt(t.amount)}</td>
                                  <td className="px-2 py-1.5">{formatDateTimestamp(t.date)}</td>
                                  <td className="px-2 py-1.5 capitalize">{t.method}</td>
                                  <td className="px-2 py-1.5">
                                    <Badge variant="outline" className="capitalize text-[10px]">{t.status}</Badge>
                                  </td>
                                  <td className="px-2 py-1.5">{t.handled_by}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default DepositsDemographicsReport;

import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import DatatableReport from "@/Pages/Components/DatatableReport";
import LoanGeneralReportQuery from "../Queries/LoanGeneralReportQuery";
import { useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Banknote, Users, TrendingDown, DollarSign } from "lucide-react";

const fmt = (n) => new Intl.NumberFormat("en-UG", { maximumFractionDigits: 0 }).format(n ?? 0);

const statusVariant = {
  posted:    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  pending:   "bg-amber-100  text-amber-800  dark:bg-amber-900/30  dark:text-amber-400",
  approved:  "bg-blue-100   text-blue-800   dark:bg-blue-900/30   dark:text-blue-400",
  cancelled: "bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-400",
};

const KPI = ({ icon: Icon, label, value, sub, accent }) => (
  <Card className="overflow-hidden">
    <div className={`h-1 ${accent}`} />
    <CardContent className="pt-3 pb-3 px-4">
      <div className="flex items-start gap-3">
        <div className={`p-1.5 rounded-lg ${accent.replace("bg-", "bg-").replace("500", "100")} ${accent.replace("bg-", "text-")}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
          <p className="text-xl font-bold mt-0.5">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
      </div>
    </CardContent>
  </Card>
);

const PayrollReport = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate     = useNavigate();
  const tableRef     = useRef(null);

  const [filters, setFilters] = useState({
    startDate: "",
    endDate:   "",
    branch_id: "",
    user_id:   "",
  });

  const { data = [], isLoading, refetch, isRefetching, isError } = useQuery({
    queryKey: ["payroll-report", filters],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get("reports/hr/payroll", {
          params: {
            startDate: filters.startDate,
            endDate:   filters.endDate,
            branch_id: filters.branch_id,
            user_id:   filters.user_id,
          },
        });
        return res?.data?.data ?? [];
      } catch (error) {
        if (error?.response?.status === 401)
          navigate("/", { state: { from: location }, replace: true });
        return [];
      }
    },
    placeholderData: (prev) => prev,
  });

  const rows = Array.isArray(data) ? data : (data?.payroll_runs ?? []);

  const totalGross      = rows.reduce((s, r) => s + (r.gross_pay      ?? 0), 0);
  const totalNet        = rows.reduce((s, r) => s + (r.net_pay        ?? 0), 0);
  const totalDeductions = rows.reduce((s, r) => s + (r.total_deductions ?? 0), 0);

  const columns = [
    {
      accessorKey: "run_period",
      header: "Pay Period",
      cell: ({ row }) => <p className="text-xs font-medium">{row.original.run_period ?? row.original.period ?? "—"}</p>,
    },
    {
      accessorKey: "employee_name",
      header: "Employee",
      cell: ({ row }) => (
        <p className="text-xs capitalize font-medium">
          {row.original.employee_name ?? row.original.officer_name ?? "—"}
        </p>
      ),
    },
    {
      accessorKey: "employee_code",
      header: "Code",
      cell: ({ row }) => <p className="text-xs font-mono">{row.original.employee_code ?? row.original.officer_code ?? "—"}</p>,
    },
    {
      accessorKey: "branch",
      header: "Branch",
      cell: ({ row }) => <p className="text-xs">{row.original.branch ?? "—"}</p>,
    },
    {
      accessorKey: "gross_pay",
      header: "Gross Pay",
      cell: ({ row }) => <p className="text-xs text-right font-mono">{fmt(row.original.gross_pay)}</p>,
    },
    {
      accessorKey: "total_deductions",
      header: "Deductions",
      cell: ({ row }) => <p className="text-xs text-right font-mono text-red-600">{fmt(row.original.total_deductions)}</p>,
    },
    {
      accessorKey: "net_pay",
      header: "Net Pay",
      cell: ({ row }) => (
        <p className="text-xs text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
          {fmt(row.original.net_pay)}
        </p>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const s = (row.original.status ?? "pending").toLowerCase();
        return (
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusVariant[s] ?? "bg-muted text-muted-foreground"}`}>
            {s}
          </span>
        );
      },
    },
    {
      accessorKey: "journal_entry",
      header: "Journal",
      cell: ({ row }) => (
        <p className="text-xs font-mono text-muted-foreground">
          {row.original.journal_entry ?? row.original.journal_entry_code ?? "—"}
        </p>
      ),
    },
  ];

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink to="/dashboard">Home</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink to="/hr-reports">HR Reports</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Payroll Report</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="space-y-4 pt-2">
        <h5 className="text-2xl font-bold tracking-tight">Payroll Report</h5>

        <LoanGeneralReportQuery
          show={{ officer: false }}
          onFilterChange={(f) => { setFilters(f); refetch(); }}
          isRefetching={isRefetching}
          data={rows}
          tableRef={tableRef}
          filters={filters}
          colSpan={3}
          mode={{ format: "A4-L", orientation: "L" }}
          totals={{ totalDebit: totalGross, totalCredit: totalNet }}
          title="Payroll Report"
        />

        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPI icon={Users}       label="Employees"       value={rows.length}              sub="Payroll records"         accent="bg-blue-500" />
          <KPI icon={Banknote}    label="Total Gross"     value={`UGX ${fmt(totalGross)}`}  sub="Before deductions"       accent="bg-emerald-500" />
          <KPI icon={TrendingDown}label="Total Deductions"value={`UGX ${fmt(totalDeductions)}`} sub="Tax, NSSF, etc."    accent="bg-red-500" />
          <KPI icon={DollarSign}  label="Total Net Pay"   value={`UGX ${fmt(totalNet)}`}   sub="Take-home amount"        accent="bg-violet-500" />
        </div>

        <div className="overflow-x-auto">
          <DatatableReport
            ref={tableRef}
            columns={columns}
            data={rows}
            fetchData={refetch}
            isLoading={isLoading}
            isRefetching={isRefetching}
            isError={isError}
            colSpan={4}
            totalDebit={totalGross}
            totalCredit={totalNet}
          />
        </div>
      </div>
    </>
  );
};

export default PayrollReport;

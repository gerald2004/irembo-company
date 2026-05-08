import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import useBranchFilter from "@/MiddleWares/Hooks/useBranchFilter";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import DatatableReport from "@/Pages/Components/DatatableReport";
import LoanGeneralReportQuery from "../Queries/LoanGeneralReportQuery";
import { useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";

const fmtMoney = (v) =>
  new Intl.NumberFormat("en-UG", { maximumFractionDigits: 0 }).format(v ?? 0);

const rateBadge = (rate) => {
  const n = parseFloat(rate);
  if (n >= 90) return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-100 text-xs">{n}%</Badge>;
  if (n >= 70) return <Badge className="bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-100 text-xs">{n}%</Badge>;
  return <Badge className="bg-red-100 text-red-700 border-red-300 hover:bg-red-100 text-xs">{n}%</Badge>;
};

const LoanOfficerPerformanceReport = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const tableRef = useRef(null);

  const { branchKey } = useBranchFilter();
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    branch_id: String(branchKey ?? ""),
    user_id: "",
    product_id: "",
  });

  const { data = [], isLoading, refetch, isRefetching, isError } = useQuery({
    queryKey: ["loan-officer-performance", filters],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get("reports/hr/loan-officer-performance", {
          params: {
            startDate:  filters.startDate,
            endDate:    filters.endDate,
            branch_id:  filters.branch_id,
            user_id:    filters.user_id,
            product_id: filters.product_id,
          },
        });
        return res?.data?.data ?? [];
      } catch (error) {
        if (error?.response?.status === 401) {
          navigate("/", { state: { from: location }, replace: true });
        }
        return [];
      }
    },
    placeholderData: (prev) => prev,
  });

  const totals = {
    totalLoans:       data.reduce((s, r) => s + (r.total_loans ?? 0), 0),
    totalDisbursed:   data.reduce((s, r) => s + (r.total_disbursed ?? 0), 0),
    totalCollected:   data.reduce((s, r) => s + (r.total_collected ?? 0), 0),
    totalOutstanding: data.reduce((s, r) => s + (r.total_outstanding ?? 0), 0),
  };

  const columns = [
    {
      accessorKey: "officer_code",
      header: "Code",
      cell: ({ row }) => <p className="text-xs font-mono">{row.original.officer_code}</p>,
    },
    {
      accessorKey: "officer_name",
      header: "Officer Name",
      cell: ({ row }) => <p className="text-xs font-medium capitalize">{row.original.officer_name}</p>,
    },
    {
      accessorKey: "total_loans",
      header: "Total Loans",
      cell: ({ row }) => <p className="text-xs text-center">{row.original.total_loans}</p>,
    },
    {
      accessorKey: "active_loans",
      header: "Active",
      cell: ({ row }) => (
        <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800 text-xs">
          {row.original.active_loans}
        </Badge>
      ),
    },
    {
      accessorKey: "overdue_loans",
      header: "Overdue",
      cell: ({ row }) => (
        <Badge variant="outline" className={`text-xs ${row.original.overdue_loans > 0 ? "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800" : "bg-muted text-muted-foreground"}`}>
          {row.original.overdue_loans}
        </Badge>
      ),
    },
    {
      accessorKey: "paid_off_loans",
      header: "Paid Off",
      cell: ({ row }) => <p className="text-xs text-center">{row.original.paid_off_loans}</p>,
    },
    {
      accessorKey: "total_disbursed",
      header: "Disbursed",
      cell: ({ row }) => <p className="text-xs font-medium">{fmtMoney(row.original.total_disbursed)}</p>,
    },
    {
      accessorKey: "total_collected",
      header: "Collected",
      cell: ({ row }) => <p className="text-xs text-emerald-700 font-medium">{fmtMoney(row.original.total_collected)}</p>,
    },
    {
      accessorKey: "total_outstanding",
      header: "Outstanding",
      cell: ({ row }) => (
        <p className={`text-xs font-medium ${row.original.total_outstanding > 0 ? "text-red-600" : "text-emerald-700"}`}>
          {fmtMoney(row.original.total_outstanding)}
        </p>
      ),
    },
    {
      accessorKey: "collection_rate",
      header: "Collection Rate",
      cell: ({ row }) => rateBadge(row.original.collection_rate),
    },
    {
      accessorKey: "overdue_rate",
      header: "Overdue Rate",
      cell: ({ row }) => {
        const n = parseFloat(row.original.overdue_rate);
        const cls = n === 0
          ? "bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
          : n < 10
          ? "bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-100"
          : "bg-red-100 text-red-700 border-red-300 hover:bg-red-100";
        return <Badge variant="outline" className={`text-xs ${cls}`}>{n}%</Badge>;
      },
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
          <BreadcrumbItem><BreadcrumbPage>Loan Officer Performance</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <h5 className="text-2xl font-bold tracking-tight">Loan Officer Performance Report</h5>

          <LoanGeneralReportQuery
            onFilterChange={setFilters}
            isRefetching={isRefetching}
            refetch={refetch}
            data={data}
            tableRef={tableRef}
            filters={filters}
            colSpan={3}
            mode={{ format: "A4-L", orientation: "L" }}
            totals={totals}
            title="Loan Officer Performance Report"
            showProductFilter={true}
          />

          {/* Summary KPI cards — dark-mode safe */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Officers",        value: data.length,                      accent: "bg-slate-500",   text: "" },
              { label: "Total Disbursed", value: `UGX ${fmtMoney(totals.totalDisbursed)}`,  accent: "bg-emerald-500", text: "" },
              { label: "Collected",       value: `UGX ${fmtMoney(totals.totalCollected)}`,  accent: "bg-blue-500",    text: "" },
              { label: "Outstanding",     value: `UGX ${fmtMoney(totals.totalOutstanding)}`,accent: "bg-red-500",     text: "" },
            ].map(({ label, value, accent }) => (
              <div key={label} className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <div className={`h-1 ${accent}`} />
                <div className="p-4">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
                  <p className="text-xl font-bold mt-1">{value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="max-w-[1400px]">
            <DatatableReport
              ref={tableRef}
              columns={columns}
              data={data ?? []}
              fetchData={refetch}
              isLoading={isLoading}
              isRefetching={isRefetching}
              isError={isError}
              colSpan={11}
              totalDebit={totals.totalDisbursed}
              totalCredit={totals.totalCollected}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default LoanOfficerPerformanceReport;

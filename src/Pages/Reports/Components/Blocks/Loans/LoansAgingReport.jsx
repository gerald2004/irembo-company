import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useLocation } from "react-router-dom";
import DatatableReport from "@/Pages/Components/DatatableReport";
import { formatDateTimestamp } from "@/lib/utils";
import LoanGeneralReportQuery from "../Queries/LoanGeneralReportQuery";
import { useMemo, useState, useRef } from "react";
import { AlertTriangle, Clock, TrendingDown, BarChart3 } from "lucide-react";
import ReportKpi from "@/Pages/Reports/Components/ReportKpi";

const nf = new Intl.NumberFormat("en-UG", { maximumFractionDigits: 0 });
const fmtMoney = (v) => { const n = Number(v ?? 0); return nf.format(isFinite(n) ? n : 0); };
const fmtDate  = (v) => (v ? formatDateTimestamp(v) : "—");

const LoansAgingReport = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const location = useLocation();
  const tableRef = useRef(null);

  const [filters, setFilters] = useState({ startDate: "", endDate: "", branch_id: "", user_id: "" });

  const { data = [], isLoading, refetch, isRefetching, isError } = useQuery({
    queryKey: ["aging-loans", filters],
    queryFn: async ({ signal }) => {
      try {
        const response = await axiosPrivate.get("reports/loans/aging-loans", {
          params: {
            startDate: filters.startDate || undefined,
            endDate:   filters.endDate   || undefined,
            branch_id: filters.branch_id || undefined,
            user_id:   filters.user_id   || undefined,
          },
          signal,
        });
        return response?.data?.data ?? [];
      } catch (error) {
        if (error?.response?.status === 401)
          navigate("/", { state: { from: location }, replace: true });
        throw error;
      }
    },
    placeholderData: (prev) => prev,
    staleTime: 60_000,
  });

  const safeData = Array.isArray(data) ? data : [];

  const total_overdue = useMemo(() => safeData.reduce((s, r) => s + (Number(r?.total_overdue) || 0), 0), [safeData]);
  const age_zero      = useMemo(() => safeData.reduce((s, r) => s + (Number(r?.age_zero)      || 0), 0), [safeData]);
  const age_one       = useMemo(() => safeData.reduce((s, r) => s + (Number(r?.age_one)       || 0), 0), [safeData]);
  const age_two       = useMemo(() => safeData.reduce((s, r) => s + (Number(r?.age_two)       || 0), 0), [safeData]);
  const age_three     = useMemo(() => safeData.reduce((s, r) => s + (Number(r?.age_three)     || 0), 0), [safeData]);
  const age_four      = useMemo(() => safeData.reduce((s, r) => s + (Number(r?.age_four)      || 0), 0), [safeData]);
  const age_five      = useMemo(() => safeData.reduce((s, r) => s + (Number(r?.age_five)      || 0), 0), [safeData]);
  const age_six       = useMemo(() => safeData.reduce((s, r) => s + (Number(r?.age_six)       || 0), 0), [safeData]);
  const age_seven     = useMemo(() => safeData.reduce((s, r) => s + (Number(r?.age_seven)     || 0), 0), [safeData]);

  const earlyStage  = useMemo(() => age_zero, [age_zero]);
  const subStandard = useMemo(() => age_one + age_two, [age_one, age_two]);
  const highRisk    = useMemo(() => age_three + age_four + age_five + age_six + age_seven, [age_three, age_four, age_five, age_six, age_seven]);

  const columns = useMemo(() => [
    {
      accessorKey: "account",
      header: "Account Number",
      cell: ({ row }) => (
        <Link to={`/clients/${row.original.client_type === "individual" ? "individual" : "group"}/${row.original.account_id}`}
          className="text-xs block truncate max-w-[160px] underline underline-offset-2 hover:opacity-80"
          title={row.original.account}>
          {row.original.account}
        </Link>
      ),
    },
    {
      accessorKey: "client",
      header: "Client Name",
      cell: ({ row }) => (
        <Link to={`/clients/${row.original.client_type === "individual" ? "individual" : "group"}/${row.original.account_id}`}
          className="text-xs block truncate max-w-[200px] underline underline-offset-2 hover:opacity-80"
          title={row.original.client}>
          {row.original.client}
        </Link>
      ),
    },
    {
      accessorKey: "code",
      header: "Loan Number",
      cell: ({ row }) => (
        <Link to={`/loans/${row.original.loan_id}`}
          className="text-xs block truncate max-w-[160px] underline underline-offset-2 hover:opacity-80"
          title={row.original.code}>
          {row.original.code}
        </Link>
      ),
    },
    {
      accessorKey: "product",
      header: "Product",
      cell: ({ row }) => <p className="text-xs block max-w-[180px] truncate" title={row?.original.product}>{row?.original.product}</p>,
    },
    {
      accessorKey: "last_payment_date",
      header: "Last Payment",
      cell: ({ row }) => <p className="text-xs">{fmtDate(row.original.last_payment_date) || "No Payment Made"}</p>,
    },
    {
      accessorKey: "first_overdue_date",
      header: "First Overdue",
      cell: ({ row }) => <p className="text-xs">{fmtDate(row.original.first_overdue_date)}</p>,
    },
    {
      accessorKey: "total_overdue",
      header: "Amount Overdue",
      cell: ({ row }) => <p className="text-xs tabular-nums text-right font-medium text-red-600">{fmtMoney(row.original.total_overdue)}</p>,
    },
    {
      accessorKey: "age_zero",
      header: "1–30",
      cell: ({ row }) => <p className="text-xs tabular-nums text-right">{fmtMoney(row.original.age_zero)}</p>,
    },
    {
      accessorKey: "age_one",
      header: "31–60",
      cell: ({ row }) => <p className="text-xs tabular-nums text-right">{fmtMoney(row.original.age_one)}</p>,
    },
    {
      accessorKey: "age_two",
      header: "61–90",
      cell: ({ row }) => <p className="text-xs tabular-nums text-right">{fmtMoney(row.original.age_two)}</p>,
    },
    {
      accessorKey: "age_three",
      header: "91–120",
      cell: ({ row }) => <p className="text-xs tabular-nums text-right">{fmtMoney(row.original.age_three)}</p>,
    },
    {
      accessorKey: "age_four",
      header: "121–150",
      cell: ({ row }) => <p className="text-xs tabular-nums text-right">{fmtMoney(row.original.age_four)}</p>,
    },
    {
      accessorKey: "age_five",
      header: "151–180",
      cell: ({ row }) => <p className="text-xs tabular-nums text-right">{fmtMoney(row.original.age_five)}</p>,
    },
    {
      accessorKey: "age_six",
      header: "181–210",
      cell: ({ row }) => <p className="text-xs tabular-nums text-right">{fmtMoney(row.original.age_six)}</p>,
    },
    {
      accessorKey: "age_seven",
      header: ">210",
      cell: ({ row }) => <p className="text-xs tabular-nums text-right text-red-600 font-medium">{fmtMoney(row.original.age_seven)}</p>,
    },
  ], []);

  // 15 cols — footerCells cover cols 7–15 (9 cells), label colSpan=6
  const footerCells = [
    { value: total_overdue, className: "text-red-600 font-bold" }, // col 7
    { value: age_zero },    // col 8
    { value: age_one },     // col 9
    { value: age_two },     // col 10
    { value: age_three },   // col 11
    { value: age_four },    // col 12
    { value: age_five },    // col 13
    { value: age_six },     // col 14
    { value: age_seven, className: "text-red-600" }, // col 15
  ];

  const handleFilterChange = (f) => { setFilters(f); refetch(); };

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden">
      <div className="flex flex-col min-w-0">
        <Breadcrumb className="mb-3">
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink to="/dashboard">Home</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbLink to="/loans-reports">Loans Reports</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>Aging Loans Reports</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <h5 className="text-2xl font-bold tracking-tight mb-2">Aging Loans Report</h5>

        <div className="space-y-4">
          <LoanGeneralReportQuery
            onFilterChange={handleFilterChange}
            isRefetching={isRefetching}
            refetch={refetch}
            data={safeData}
            tableRef={tableRef}
            filters={filters}
            colSpan={6}
            mode={{ format: "A4-L", orientation: "L" }}
            totals={{ total_overdue, age_zero, age_one, age_two, age_three, age_four, age_five, age_six, age_seven }}
            title="Aging Loans Report"
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <ReportKpi label="Total Overdue"    value={`UGX ${fmtMoney(total_overdue)}`}  hint={`${safeData.length} loans`}            accent="bg-red-600"    icon={<AlertTriangle size={16} />} />
            <ReportKpi label="1–30 Days"        value={`UGX ${fmtMoney(earlyStage)}`}     hint="Early stage overdue"                   accent="bg-orange-400" icon={<Clock size={16} />} />
            <ReportKpi label="31–90 Days"       value={`UGX ${fmtMoney(subStandard)}`}    hint="Sub-standard risk"                     accent="bg-amber-500"  icon={<TrendingDown size={16} />} />
            <ReportKpi label="PAR > 90 Days"    value={`UGX ${fmtMoney(highRisk)}`}       hint="High-risk / doubtful / loss"           accent="bg-rose-700"   icon={<BarChart3 size={16} />} />
          </div>

          <div className="max-w-[1200px]">
            <DatatableReport
              ref={tableRef}
              columns={columns}
              data={safeData}
              fetchData={refetch}
              isLoading={isLoading}
              isRefetching={isRefetching}
              isError={isError}
              footerCells={footerCells}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoansAgingReport;

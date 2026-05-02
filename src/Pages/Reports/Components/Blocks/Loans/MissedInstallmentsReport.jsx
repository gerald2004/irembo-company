/* eslint-disable react/prop-types */
import { useRef, useState, useCallback, useMemo } from "react";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import LoanGeneralReportQuery from "../Queries/LoanGeneralReportQuery";
import DatatableReport from "@/Pages/Components/DatatableReport";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const fmt = (v) =>
  new Intl.NumberFormat("en-UG", { maximumFractionDigits: 0 }).format(v ?? 0);

const dpdVariant = (days) => {
  if (days >= 180) return "bg-red-700 text-white";
  if (days >= 90)  return "bg-red-500 text-white";
  if (days >= 30)  return "bg-orange-500 text-white";
  return "bg-yellow-400 text-black";
};

const MissedInstallmentsReport = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate     = useNavigate();
  const tableRef     = useRef(null);

  const [filters, setFilters] = useState({
    startDate: "", endDate: "", branch_id: "", user_id: "",
    product_id: "", min_dpd: "",
  });

  const handleFilterChange = useCallback(
    (incoming) => setFilters((prev) => ({ ...prev, ...incoming })),
    []
  );

  const { data = {}, isLoading, isRefetching, isError, refetch } = useQuery({
    queryKey: ["missed-installments", filters],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get("reports/loans/missed-installments", {
          params: {
            startDate:  filters.startDate  || undefined,
            endDate:    filters.endDate    || undefined,
            branch_id:  filters.branch_id  || undefined,
            user_id:    filters.user_id    || undefined,
            product_id: filters.product_id || undefined,
            min_dpd:    filters.min_dpd    || undefined,
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

  const loans  = data?.loans  ?? [];
  const totals = data?.totals ?? {};

  const totalMissedPrincipal = useMemo(() => loans.reduce((s, r) => s + (r.missed_principal ?? 0), 0), [loans]);
  const totalMissedInterest  = useMemo(() => loans.reduce((s, r) => s + (r.missed_interest  ?? 0), 0), [loans]);
  const totalMissed          = useMemo(() => loans.reduce((s, r) => s + (r.total_missed     ?? 0), 0), [loans]);

  const columns = [
    {
      accessorKey: "code",
      header: "Loan Code",
      cell: ({ row }) => (
        <span className="font-mono font-medium text-primary text-xs">{row.original.code}</span>
      ),
    },
    {
      accessorKey: "client",
      header: "Client",
      cell: ({ row }) => (
        <div>
          <p className="font-medium leading-tight text-xs">{row.original.client}</p>
          <p className="text-muted-foreground text-xs">{row.original.contact}</p>
        </div>
      ),
    },
    {
      accessorKey: "product",
      header: "Product",
      cell: ({ row }) => <p className="text-xs text-muted-foreground">{row.original.product}</p>,
    },
    {
      accessorKey: "officer",
      header: "Officer",
      cell: ({ row }) => <p className="text-xs text-muted-foreground">{row.original.officer}</p>,
    },
    {
      accessorKey: "disbursed_amount",
      header: "Disbursed",
      cell: ({ row }) => (
        <p className="text-xs text-right tabular-nums">{fmt(row.original.disbursed_amount)}</p>
      ),
    },
    {
      accessorKey: "missed_count",
      header: "Missed #",
      cell: ({ row }) => (
        <div className="flex justify-center">
          <Badge variant="outline" className="text-xs">{row.original.missed_count}</Badge>
        </div>
      ),
    },
    {
      accessorKey: "missed_principal",
      header: "Principal",
      cell: ({ row }) => (
        <p className="text-xs text-right tabular-nums text-red-700">{fmt(row.original.missed_principal)}</p>
      ),
    },
    {
      accessorKey: "missed_interest",
      header: "Interest",
      cell: ({ row }) => (
        <p className="text-xs text-right tabular-nums text-orange-600">{fmt(row.original.missed_interest)}</p>
      ),
    },
    {
      accessorKey: "missed_penalties",
      header: "Penalties",
      cell: ({ row }) => (
        <p className="text-xs text-right tabular-nums text-amber-600">{fmt(row.original.missed_penalties)}</p>
      ),
    },
    {
      accessorKey: "total_missed",
      header: "Total Missed",
      cell: ({ row }) => (
        <p className="text-xs text-right tabular-nums font-semibold text-red-700">{fmt(row.original.total_missed)}</p>
      ),
    },
    {
      accessorKey: "max_dpd",
      header: "Max DPD",
      cell: ({ row }) => (
        <div className="flex justify-center">
          <Badge className={`text-xs ${dpdVariant(row.original.max_dpd)}`}>{row.original.max_dpd}d</Badge>
        </div>
      ),
    },
    {
      accessorKey: "first_missed_date",
      header: "First Missed",
      cell: ({ row }) => (
        <p className="text-xs text-muted-foreground whitespace-nowrap">{row.original.first_missed_date}</p>
      ),
    },
    {
      accessorKey: "last_missed_date",
      header: "Last Missed",
      cell: ({ row }) => (
        <p className="text-xs text-muted-foreground whitespace-nowrap">{row.original.last_missed_date}</p>
      ),
    },
  ];

  const exportHeaders = [
    "Loan Code", "Client", "Contact", "Product", "Officer",
    "Disbursed", "Missed Count", "Missed Principal",
    "Missed Interest", "Missed Penalties", "Total Missed",
    "First Missed", "Last Missed", "Max DPD",
  ];

  const exportRows = loans.map((r) => ({
    "Loan Code":        r.code,
    "Client":           r.client,
    "Contact":          r.contact,
    "Product":          r.product,
    "Officer":          r.officer,
    "Disbursed":        r.disbursed_amount,
    "Missed Count":     r.missed_count,
    "Missed Principal": r.missed_principal,
    "Missed Interest":  r.missed_interest,
    "Missed Penalties": r.missed_penalties,
    "Total Missed":     r.total_missed,
    "First Missed":     r.first_missed_date,
    "Last Missed":      r.last_missed_date,
    "Max DPD":          r.max_dpd,
  }));

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink to="/dashboard">Home</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink to="/loans-reports">Loan Reports</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Missed Installments</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-1 space-y-4 pt-2">
        <h5 className="text-2xl font-bold tracking-tight">Missed Installments Report</h5>

        <LoanGeneralReportQuery
          show={{ product: true, minDpd: true }}
          onFilterChange={handleFilterChange}
          isRefetching={isRefetching}
          data={{ data: { headers: exportHeaders, rows: exportRows } }}
          tableRef={tableRef}
          filters={filters}
          title="Missed Installments Report"
          totals={{
            "Missed Principal": totals.missed_principal ?? 0,
            "Missed Interest":  totals.missed_interest  ?? 0,
            "Missed Penalties": totals.missed_penalties ?? 0,
            "Total Missed":     totals.total_missed     ?? 0,
          }}
          colSpan={7}
          mode={{ format: "A4", orientation: "landscape" }}
        />

        {isError && (
          <p className="text-sm text-destructive">Failed to load report. Please try again.</p>
        )}

        {isLoading ? (
          <Skeleton className="h-64 rounded-xl" />
        ) : (
          <>
            {loans.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Loans Affected",   value: totals.loan_count,       cls: "text-foreground" },
                  { label: "Missed Principal",  value: fmt(totals.missed_principal), cls: "text-red-700" },
                  { label: "Missed Interest",   value: fmt(totals.missed_interest),  cls: "text-orange-600" },
                  { label: "Total Missed",      value: fmt(totals.total_missed),     cls: "text-red-700 font-bold" },
                ].map((k) => (
                  <div key={k.label} className="rounded-lg border bg-card p-3 space-y-1">
                    <p className="text-xs text-muted-foreground">{k.label}</p>
                    <p className={`text-lg font-semibold tabular-nums ${k.cls}`}>{k.value}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="max-w-[1200px]">
              <DatatableReport
                ref={tableRef}
                columns={columns}
                data={loans}
                fetchData={refetch}
                isLoading={isLoading}
                isRefetching={isRefetching}
                isError={isError}
                footerCells={[
                  { empty: true },                                                       // disbursed_amount
                  { empty: true },                                                       // missed_count
                  { value: totalMissedPrincipal, className: "text-red-700" },           // missed_principal
                  { value: totalMissedInterest,  className: "text-orange-600" },        // missed_interest
                  { empty: true },                                                       // missed_penalties
                  { value: totalMissed,          className: "font-bold text-red-700" }, // total_missed
                  { empty: true },                                                       // max_dpd
                  { empty: true },                                                       // first_missed_date
                  { empty: true },                                                       // last_missed_date
                ]}
              />
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default MissedInstallmentsReport;

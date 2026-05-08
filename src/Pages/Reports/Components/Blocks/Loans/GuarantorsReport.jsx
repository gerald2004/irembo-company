/* eslint-disable react/prop-types */
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import useBranchFilter from "@/MiddleWares/Hooks/useBranchFilter";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import DatatableReport from "@/Pages/Components/DatatableReport";
import { formatDateTimestamp } from "@/lib/utils";
import LoanGeneralReportQuery from "../Queries/LoanGeneralReportQuery";
import { useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ShieldAlert, TrendingUp } from "lucide-react";

const fmtMoney = (v) =>
  new Intl.NumberFormat("en-UG", { maximumFractionDigits: 0 }).format(v ?? 0);

const statusVariant = (s) => {
  if (s === "disbursed") return "default";
  if (s === "paid_off" || s === "settled") return "secondary";
  if (s === "writternoff" || s === "rejected") return "destructive";
  return "outline";
};

const GuarantorsReport = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const tableRef = useRef(null);

  const { branchKey } = useBranchFilter();
  const [filters, setFilters] = useState({ startDate: "", endDate: "", branch_id: String(branchKey ?? "") });

  const { data: raw = {}, isLoading, refetch, isRefetching, isError } = useQuery({
    queryKey: ["guarantors-report", filters],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get("reports/loans/guarantors", {
          params: {
            startDate: filters.startDate || undefined,
            endDate:   filters.endDate   || undefined,
            branch_id: filters.branch_id || undefined,
          },
        });
        return res?.data?.data ?? {};
      } catch (error) {
        if (error?.response?.status === 401)
          navigate("/", { state: { from: location }, replace: true });
        throw error;
      }
    },
    placeholderData: (prev) => prev,
  });

  const rows    = raw?.rows    ?? [];
  const summary = raw?.summary ?? {};
  const exposure = raw?.exposure_by_guarantor ?? [];

  const columns = [
    {
      accessorKey: "guarantor_name",
      header: "Guarantor",
      cell: ({ row }) => (
        <div>
          <p className="text-xs font-medium capitalize">{row.original.guarantor_name}</p>
          <p className="text-xs text-muted-foreground">{row.original.guarantor_contact || "—"}</p>
        </div>
      ),
    },
    {
      accessorKey: "guarantor_account",
      header: "Acct No.",
      cell: ({ row }) => <p className="text-xs font-mono">{row.original.guarantor_account || "—"}</p>,
    },
    {
      accessorKey: "guarantor_amount",
      header: "Guaranteed",
      cell: ({ row }) => <p className="text-xs font-medium">{fmtMoney(row.original.guarantor_amount)}</p>,
    },
    {
      accessorKey: "guarantor_type",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs capitalize">{row.original.guarantor_type}</Badge>
      ),
    },
    {
      accessorKey: "borrower",
      header: "Borrower",
      cell: ({ row }) => (
        <Link
          to={`/clients/individual/${row.original.borrower_id}`}
          className="text-xs text-primary hover:underline capitalize"
        >
          {row.original.borrower}
        </Link>
      ),
    },
    {
      accessorKey: "loan_code",
      header: "Loan No.",
      cell: ({ row }) => (
        <Link to={`/loans/${row.original.loan_id}`} className="text-xs text-primary hover:underline font-mono">
          {row.original.loan_code}
        </Link>
      ),
    },
    {
      accessorKey: "product",
      header: "Product",
      cell: ({ row }) => <p className="text-xs">{row.original.product || "—"}</p>,
    },
    {
      accessorKey: "disbursed_amount",
      header: "Disbursed",
      cell: ({ row }) => <p className="text-xs">{fmtMoney(row.original.disbursed_amount)}</p>,
    },
    {
      accessorKey: "loan_outstanding",
      header: "Outstanding",
      cell: ({ row }) => (
        <p className={`text-xs font-medium ${row.original.loan_outstanding > 0 ? "text-red-600" : "text-green-600"}`}>
          {fmtMoney(row.original.loan_outstanding)}
        </p>
      ),
    },
    {
      accessorKey: "loan_status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={statusVariant(row.original.loan_status)} className="text-xs capitalize">
          {row.original.loan_status}
        </Badge>
      ),
    },
    {
      accessorKey: "disbursement_date",
      header: "Disbursed On",
      cell: ({ row }) => <p className="text-xs">{formatDateTimestamp(row.original.disbursement_date)}</p>,
    },
    {
      accessorKey: "branch",
      header: "Branch",
      cell: ({ row }) => <p className="text-xs">{row.original.branch || "—"}</p>,
    },
  ];

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink to="/dashboard">Home</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink to="/loans-reports">Loans Reports</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Guarantors Report</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <h5 className="text-2xl font-bold tracking-tight">Guarantors Report</h5>

          <LoanGeneralReportQuery
            onFilterChange={setFilters}
            isRefetching={isRefetching}
            refetch={refetch}
            data={rows}
            tableRef={tableRef}
            filters={filters}
            colSpan={12}
            mode={{ format: "A4-L", orientation: "L" }}
            totals={{}}
            title="Guarantors Report"
          />

          {/* Summary KPIs */}
          {!isLoading && !isError && summary.unique_guarantors > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card>
                <CardHeader className="pb-1 pt-3 px-4">
                  <CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> Unique Guarantors
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  <p className="text-xl font-bold">{summary.unique_guarantors}</p>
                  <p className="text-xs text-muted-foreground">{summary.unique_loans} loans covered</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-1 pt-3 px-4">
                  <CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" /> Total Guaranteed
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  <p className="text-xl font-bold">{fmtMoney(summary.total_guaranteed_amount)}</p>
                  <p className="text-xs text-muted-foreground">sum of all guarantees</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-1 pt-3 px-4">
                  <CardTitle className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" /> Outstanding Exposure
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  <p className="text-xl font-bold text-red-600">{fmtMoney(summary.total_outstanding)}</p>
                  <p className="text-xs text-muted-foreground">across active loans</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-1 pt-3 px-4">
                  <CardTitle className="text-xs text-muted-foreground font-medium">Total Records</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  <p className="text-xl font-bold">{summary.total_rows}</p>
                  <p className="text-xs text-muted-foreground">guarantor–loan pairs</p>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="max-w-[1400px]">
            <DatatableReport
              ref={tableRef}
              columns={columns}
              data={rows}
              fetchData={refetch}
              isLoading={isLoading}
              isRefetching={isRefetching}
              isError={isError}
              colSpan={12}
            />
          </div>

          {/* Per-guarantor exposure table */}
          {!isLoading && !isError && exposure.length > 0 && (
            <div className="space-y-2">
              <h6 className="text-sm font-semibold">Guarantor Exposure Summary</h6>
              <div className="rounded-lg border overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Guarantor</th>
                      <th className="px-3 py-2 text-left font-medium">Account</th>
                      <th className="px-3 py-2 text-left font-medium">Contact</th>
                      <th className="px-3 py-2 text-right font-medium">Guaranteed</th>
                      <th className="px-3 py-2 text-right font-medium">Outstanding</th>
                      <th className="px-3 py-2 text-center font-medium">Loans</th>
                      <th className="px-3 py-2 text-center font-medium">Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exposure.map((e, i) => (
                      <tr key={i} className="border-t hover:bg-muted/20">
                        <td className="px-3 py-2 capitalize">{e.guarantor_name}</td>
                        <td className="px-3 py-2 font-mono">{e.guarantor_account || "—"}</td>
                        <td className="px-3 py-2">{e.guarantor_contact || "—"}</td>
                        <td className="px-3 py-2 text-right">{fmtMoney(e.guaranteed_amount)}</td>
                        <td className={`px-3 py-2 text-right font-medium ${e.outstanding_exposure > 0 ? "text-red-600" : "text-green-600"}`}>
                          {fmtMoney(e.outstanding_exposure)}
                        </td>
                        <td className="px-3 py-2 text-center">{e.loans_count}</td>
                        <td className="px-3 py-2 text-center">
                          <Badge variant={e.active_loans > 0 ? "default" : "secondary"} className="text-xs">
                            {e.active_loans}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default GuarantorsReport;

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import DatatableReport from "@/Pages/Components/DatatableReport";
import { formatDateTimestamp } from "@/lib/utils";
import LoanGeneralReportQuery from "../Queries/LoanGeneralReportQuery";
import { useState, useRef, useMemo } from "react";

const fmtMoney = (v) =>
  new Intl.NumberFormat("en-UG", { maximumFractionDigits: 0 }).format(v ?? 0);

const dpdColor = (days) => {
  if (days > 180) return "text-red-700 font-bold";
  if (days > 90)  return "text-red-500 font-semibold";
  if (days > 30)  return "text-orange-500";
  return "text-yellow-600";
};

const LoanArrearsReport = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const tableRef = useRef(null);

  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    branch_id: "",
    min_dpd: "",
  });

  const { data = [], isLoading, refetch, isRefetching, isError } = useQuery({
    queryKey: ["loan-arrears", filters],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get("reports/loans/loan-arrears", {
          params: {
            startDate: filters.startDate,
            endDate: filters.endDate,
            branch_id: filters.branch_id,
            min_dpd: filters.min_dpd,
          },
        });
        return res?.data?.data ?? [];
      } catch (error) {
        if (error?.response?.status === 401)
          navigate("/", { state: { from: location }, replace: true });
        throw error;
      }
    },
    placeholderData: (prev) => prev,
  });

  const totalArrears = useMemo(
    () => data.reduce((s, r) => s + (r.total_arrears ?? 0), 0),
    [data]
  );
  const totalPrincipalDue = useMemo(
    () => data.reduce((s, r) => s + (r.principal_due ?? 0), 0),
    [data]
  );

  const columns = [
    {
      accessorKey: "client",
      header: "Client",
      cell: ({ row }) => (
        <Link to={`/clients/individual/${row.original.account_id}`} className="text-xs capitalize">
          {row.original.client}
        </Link>
      ),
    },
    {
      accessorKey: "code",
      header: "Loan No.",
      cell: ({ row }) => (
        <Link to={`/loans/${row.original.loan_id}`} className="text-xs">
          {row.original.code}
        </Link>
      ),
    },
    {
      accessorKey: "installment_no",
      header: "Installment #",
      cell: ({ row }) => <p className="text-xs">{row.original.installment_no}</p>,
    },
    {
      accessorKey: "due_date",
      header: "Due Date",
      cell: ({ row }) => (
        <p className="text-xs">{formatDateTimestamp(row.original.due_date)}</p>
      ),
    },
    {
      accessorKey: "days_overdue",
      header: "DPD",
      cell: ({ row }) => (
        <p className={`text-xs ${dpdColor(row.original.days_overdue)}`}>
          {row.original.days_overdue}
        </p>
      ),
    },
    {
      accessorKey: "principal_due",
      header: "Principal Due",
      cell: ({ row }) => <p className="text-xs">{fmtMoney(row.original.principal_due)}</p>,
    },
    {
      accessorKey: "interest_due",
      header: "Interest Due",
      cell: ({ row }) => <p className="text-xs">{fmtMoney(row.original.interest_due)}</p>,
    },
    {
      accessorKey: "penalty_due",
      header: "Penalty",
      cell: ({ row }) => <p className="text-xs">{fmtMoney(row.original.penalty_due)}</p>,
    },
    {
      accessorKey: "total_arrears",
      header: "Total Arrears",
      cell: ({ row }) => (
        <p className="text-xs font-semibold">{fmtMoney(row.original.total_arrears)}</p>
      ),
    },
    {
      accessorKey: "guarantors",
      header: "Guarantors",
      cell: ({ row }) => (
        <p className="text-xs">
          {(row.original.guarantors ?? []).map((g) => g.guarantor_name).join(", ") || "—"}
        </p>
      ),
    },
  ];

  const handleFilterChange = (data) => {
    setFilters(data);
    refetch();
  };

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="/dashboard">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink to="/loans-reports">Loans Reports</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Loan Arrears</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <h5 className="text-2xl font-bold tracking-tight">Loan Arrears Report</h5>
          <LoanGeneralReportQuery
            onFilterChange={handleFilterChange}
            isRefetching={isRefetching}
            refetch={refetch}
            data={data}
            tableRef={tableRef}
            filters={filters}
            colSpan={3}
            mode={{ format: "A4-L", orientation: "L" }}
            totals={{
              totalAmountDisbursed: totalArrears,
              totalAmountDue: totalPrincipalDue,
            }}
            title="Loan Arrears Report"
          />
          <div className="max-w-[1200px]">
            <DatatableReport
              ref={tableRef}
              columns={columns}
              data={data ?? []}
              fetchData={refetch}
              isLoading={isLoading}
              isRefetching={isRefetching}
              isError={isError}
              colSpan={10}
              totalDebit={totalArrears}
              totalCredit={totalPrincipalDue}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default LoanArrearsReport;

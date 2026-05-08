import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import useBranchFilter from "@/MiddleWares/Hooks/useBranchFilter";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import DatatableReport from "@/Pages/Components/DatatableReport";
import { formatDateTimestamp } from "@/lib/utils";
import LoanGeneralReportQuery from "../Queries/LoanGeneralReportQuery";
import { useState, useRef, useMemo } from "react";
import { Badge } from "@/components/ui/badge";

const fmtMoney = (v) =>
  new Intl.NumberFormat("en-UG", { maximumFractionDigits: 0 }).format(v ?? 0);

const statusVariant = {
  disbursed: "default",
  paid_off:  "secondary",
  settled:   "secondary",
  writternoff: "destructive",
};

const GroupLoansReport = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const tableRef = useRef(null);

  const { branchKey } = useBranchFilter();
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    branch_id: String(branchKey ?? ""),
  });

  const { data = [], isLoading, refetch, isRefetching, isError } = useQuery({
    queryKey: ["group-loans-report", filters],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get("reports/loans/group-loans", {
          params: {
            startDate: filters.startDate,
            endDate: filters.endDate,
            branch_id: filters.branch_id,
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

  const totalDisbursed = useMemo(
    () => data.reduce((s, r) => s + (r.amount_disbursed ?? 0), 0),
    [data]
  );
  const totalOutstanding = useMemo(
    () => data.reduce((s, r) => s + (r.outstanding_balance ?? 0), 0),
    [data]
  );

  const columns = [
    {
      accessorKey: "group_name",
      header: "Group Name",
      cell: ({ row }) => (
        <Link to={`/clients/group/${row.original.account_id}`} className="text-xs capitalize">
          {row.original.group_name}
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
      accessorKey: "product",
      header: "Product",
      cell: ({ row }) => <p className="text-xs">{row.original.product}</p>,
    },
    {
      accessorKey: "amount_disbursed",
      header: "Disbursed",
      cell: ({ row }) => <p className="text-xs">{fmtMoney(row.original.amount_disbursed)}</p>,
    },
    {
      accessorKey: "outstanding_balance",
      header: "Outstanding",
      cell: ({ row }) => (
        <p className="text-xs font-medium">{fmtMoney(row.original.outstanding_balance)}</p>
      ),
    },
    {
      accessorKey: "interest_rate",
      header: "Interest Rate",
      cell: ({ row }) => <p className="text-xs">{row.original.interest_rate}%</p>,
    },
    {
      accessorKey: "loan_application_status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={statusVariant[row.original.loan_application_status] ?? "outline"}>
          {row.original.loan_application_status}
        </Badge>
      ),
    },
    {
      accessorKey: "disbursement_date",
      header: "Disbursed On",
      cell: ({ row }) => (
        <p className="text-xs">{formatDateTimestamp(row.original.disbursement_date)}</p>
      ),
    },
    {
      accessorKey: "maturity_date",
      header: "Maturity",
      cell: ({ row }) => (
        <p className="text-xs">{formatDateTimestamp(row.original.maturity_date)}</p>
      ),
    },
    {
      accessorKey: "members",
      header: "Members",
      cell: ({ row }) => (
        <p className="text-xs text-center">{row.original.members ?? "—"}</p>
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
            <BreadcrumbPage>Group Loans</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <h5 className="text-2xl font-bold tracking-tight">Group Loans Report</h5>
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
              totalAmountDisbursed: totalDisbursed,
              totalAmountDue: totalOutstanding,
            }}
            title="Group Loans Report"
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
              colSpan={11}
              totalDebit={totalDisbursed}
              totalCredit={totalOutstanding}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default GroupLoansReport;

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
import { useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";

const fmtMoney = (v) =>
  new Intl.NumberFormat("en-UG", { maximumFractionDigits: 0 }).format(v ?? 0);

const GuarantorsReport = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const tableRef = useRef(null);

  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    branch_id: "",
  });

  const { data = [], isLoading, refetch, isRefetching, isError } = useQuery({
    queryKey: ["guarantors-report", filters],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get("reports/loans/guarantors", {
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

  const columns = [
    {
      accessorKey: "guarantor_name",
      header: "Guarantor Name",
      cell: ({ row }) => (
        <p className="text-xs capitalize">{row.original.guarantor_name}</p>
      ),
    },
    {
      accessorKey: "guarantor_phone",
      header: "Phone",
      cell: ({ row }) => <p className="text-xs">{row.original.guarantor_phone ?? "—"}</p>,
    },
    {
      accessorKey: "guarantee_amount",
      header: "Guarantee Amount",
      cell: ({ row }) => (
        <p className="text-xs">{fmtMoney(row.original.guarantee_amount)}</p>
      ),
    },
    {
      accessorKey: "borrower_name",
      header: "Borrower",
      cell: ({ row }) => (
        <Link
          to={`/clients/individual/${row.original.borrower_account_id}`}
          className="text-xs capitalize"
        >
          {row.original.borrower_name}
        </Link>
      ),
    },
    {
      accessorKey: "loan_code",
      header: "Loan No.",
      cell: ({ row }) => (
        <Link to={`/loans/${row.original.loan_id}`} className="text-xs">
          {row.original.loan_code}
        </Link>
      ),
    },
    {
      accessorKey: "loan_amount",
      header: "Loan Amount",
      cell: ({ row }) => <p className="text-xs">{fmtMoney(row.original.loan_amount)}</p>,
    },
    {
      accessorKey: "loan_status",
      header: "Loan Status",
      cell: ({ row }) => (
        <Badge variant={row.original.loan_status === "disbursed" ? "default" : "secondary"}>
          {row.original.loan_status}
        </Badge>
      ),
    },
    {
      accessorKey: "outstanding_balance",
      header: "Outstanding",
      cell: ({ row }) => (
        <p className="text-xs">{fmtMoney(row.original.outstanding_balance)}</p>
      ),
    },
    {
      accessorKey: "disbursement_date",
      header: "Disbursed On",
      cell: ({ row }) => (
        <p className="text-xs">{formatDateTimestamp(row.original.disbursement_date)}</p>
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
            <BreadcrumbPage>Guarantors Report</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <h5 className="text-2xl font-bold tracking-tight">Guarantors Report</h5>
          <LoanGeneralReportQuery
            onFilterChange={handleFilterChange}
            isRefetching={isRefetching}
            refetch={refetch}
            data={data}
            tableRef={tableRef}
            filters={filters}
            colSpan={3}
            mode={{ format: "A4-L", orientation: "L" }}
            totals={{}}
            title="Guarantors Report"
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
              colSpan={9}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default GuarantorsReport;

import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import useBranchFilter from "@/MiddleWares/Hooks/useBranchFilter";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import DatatableReport from "@/Pages/Components/DatatableReport";
import { formatDateTimestamp } from "@/lib/utils";
import LoanGeneralReportQuery from "../Queries/LoanGeneralReportQuery";
import { useState, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RotateCcw } from "lucide-react";
import LoanFlagOffDialog from "@/Pages/Loans/Components/Forms/LoanFlagOffDialog";

const fmtMoney = (v) =>
  new Intl.NumberFormat("en-UG", { maximumFractionDigits: 0 }).format(v ?? 0);

const FlaggedOffLoansReport = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const tableRef = useRef(null);

  const { branchKey } = useBranchFilter();
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    branch_id: String(branchKey ?? ""),
    user_id: "",
  });

  const [unflagModal, setUnflagModal] = useState({ open: false, loanId: null });

  const { data: reportData = {}, isLoading, refetch, isRefetching, isError } = useQuery({
    queryKey: ["flagged-off-loans", filters],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get("reports/loans/flagged-off-loans", {
          params: {
            startDate:  filters.startDate,
            endDate:    filters.endDate,
            branch_id:  filters.branch_id,
            user_id:    filters.user_id,
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

  const rows = reportData.rows ?? [];

  const totalAmount = useMemo(
    () => rows.reduce((s, r) => s + (r.amount_disbursed ?? 0), 0),
    [rows]
  );

  const columns = [
    {
      accessorKey: "loan_code",
      header: "Loan No.",
      cell: ({ row }) => (
        <Link to={`/loans/${row.original.loan_id}`} className="text-xs text-primary hover:underline">
          {row.original.loan_code}
        </Link>
      ),
    },
    {
      accessorKey: "client",
      header: "Client",
      cell: ({ row }) => (
        <div>
          <p className="text-xs font-medium capitalize">{row.original.client}</p>
          <p className="text-xs text-muted-foreground">{row.original.account_no}</p>
        </div>
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
      cell: ({ row }) => (
        <p className="text-xs font-medium">{fmtMoney(row.original.amount_disbursed)}</p>
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
      accessorKey: "flag_off_date",
      header: "Flagged On",
      cell: ({ row }) => (
        <p className="text-xs">{formatDateTimestamp(row.original.flag_off_date)}</p>
      ),
    },
    {
      accessorKey: "flag_off_reason",
      header: "Reason",
      cell: ({ row }) => (
        <p className="text-xs max-w-[200px] truncate" title={row.original.flag_off_reason}>
          {row.original.flag_off_reason ?? "—"}
        </p>
      ),
    },
    {
      accessorKey: "officer",
      header: "Officer",
      cell: ({ row }) => <p className="text-xs capitalize">{row.original.officer}</p>,
    },
    {
      id: "status",
      header: "Status",
      cell: () => (
        <Badge variant="outline" className="text-xs border-orange-400 text-orange-700">
          Flagged Off
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "Action",
      cell: ({ row }) => (
        <Button
          size="sm"
          variant="outline"
          className="text-xs h-7 border-green-500 text-green-700 hover:bg-green-50"
          onClick={() => setUnflagModal({ open: true, loanId: row.original.loan_id })}
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Reverse Flag-Off
        </Button>
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
            <BreadcrumbPage>Flagged Off Loans</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <h5 className="text-2xl font-bold tracking-tight">Flagged Off Loans Report</h5>
          <LoanGeneralReportQuery
            onFilterChange={handleFilterChange}
            isRefetching={isRefetching}
            refetch={refetch}
            data={rows}
            tableRef={tableRef}
            filters={filters}
            colSpan={3}
            mode={{ format: "A4-L", orientation: "L" }}
            totals={{ totalAmountDisbursed: totalAmount }}
            title="Flagged Off Loans Report"
          />
          <div className="max-w-[1400px]">
            <DatatableReport
              ref={tableRef}
              columns={columns}
              data={rows}
              fetchData={refetch}
              isLoading={isLoading}
              isRefetching={isRefetching}
              isError={isError}
              colSpan={10}
              totalDebit={totalAmount}
            />
          </div>
        </div>
      </div>

      {unflagModal.open && (
        <LoanFlagOffDialog
          isOpen={unflagModal.open}
          onClose={() => setUnflagModal({ open: false, loanId: null })}
          mode="unflag"
          loanId={unflagModal.loanId}
          refetch={refetch}
        />
      )}
    </>
  );
};

export default FlaggedOffLoansReport;

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
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const fmtMoney = (v) =>
  new Intl.NumberFormat("en-UG", { maximumFractionDigits: 0 }).format(v ?? 0);

const PaidOffLoansReport = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const tableRef = useRef(null);
  const [reversing, setReversing] = useState(null);

  const { branchKey } = useBranchFilter();
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    branch_id: String(branchKey ?? ""),
    user_id: "",
  });

  const { data = [], isLoading, refetch, isRefetching, isError } = useQuery({
    queryKey: ["paid-off-loans", filters],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get("reports/loans/paid-off-loans", {
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
  const totalPaid = useMemo(
    () => data.reduce((s, r) => s + (r.total_paid ?? 0), 0),
    [data]
  );

  const handleReverse = async (loan) => {
    setReversing(loan.loan_id);
    try {
      await axiosPrivate.post("reports/loans/reverse-to-active", {
        loan_id: loan.loan_id,
        reason: `Reversed to active via report by user`,
      });
      toast.success(`Loan ${loan.code} reversed to active`);
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.messages?.[0] ?? "Failed to reverse loan");
    } finally {
      setReversing(null);
    }
  };

  const columns = [
    {
      accessorKey: "account",
      header: "Account",
      cell: ({ row }) => (
        <Link to={`/clients/individual/${row.original.account_id}`} className="text-xs">
          {row.original.account}
        </Link>
      ),
    },
    {
      accessorKey: "client",
      header: "Client",
      cell: ({ row }) => (
        <p className="text-xs capitalize">{row.original.client}</p>
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
      accessorKey: "total_paid",
      header: "Total Paid",
      cell: ({ row }) => <p className="text-xs">{fmtMoney(row.original.total_paid)}</p>,
    },
    {
      accessorKey: "total_interest_paid",
      header: "Interest Paid",
      cell: ({ row }) => <p className="text-xs">{fmtMoney(row.original.total_interest_paid)}</p>,
    },
    {
      accessorKey: "loan_application_status",
      header: "Status",
      cell: ({ row }) => (
        <span className="text-xs capitalize">{row.original.loan_application_status}</span>
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
      id: "actions",
      header: "Reverse",
      cell: ({ row }) => (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7"
              disabled={reversing === row.original.loan_id}
            >
              Reverse to Active
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reverse Loan to Active?</AlertDialogTitle>
              <AlertDialogDescription>
                Loan <strong>{row.original.code}</strong> will be moved back to active (disbursed) status.
                This action is logged in the audit trail.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => handleReverse(row.original)}>
                Confirm Reversal
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
            <BreadcrumbPage>Paid Off Loans</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <h5 className="text-2xl font-bold tracking-tight">Paid Off Loans Report</h5>
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
              totalAmountDue: totalPaid,
            }}
            title="Paid Off Loans Report"
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
              totalDebit={totalDisbursed}
              totalCredit={totalPaid}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default PaidOffLoansReport;

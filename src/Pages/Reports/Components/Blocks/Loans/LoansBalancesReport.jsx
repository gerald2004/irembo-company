import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import useBranchFilter from "@/MiddleWares/Hooks/useBranchFilter";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import DatatableReport from "@/Pages/Components/DatatableReport";
import LoanGeneralReportQuery from "../Queries/LoanGeneralReportQuery";
import { useState, useRef, useMemo } from "react";
import { Wallet, TrendingUp, CreditCard, Activity } from "lucide-react";
import ReportKpi from "@/Pages/Reports/Components/ReportKpi";

const fmt = (n) => new Intl.NumberFormat("en-UG", { maximumFractionDigits: 0 }).format(n ?? 0);

const LoansBalancesReport = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const tableRef = useRef(null);

  const { branchKey } = useBranchFilter();
  const [filters, setFilters] = useState({ startDate: "", endDate: "", branch_id: String(branchKey ?? ""), user_id: "" });

  const { data = [], isLoading, refetch, isRefetching, isError } = useQuery({
    queryKey: ["balances-loans", filters],
    queryFn: async () => {
      try {
        const response = await axiosPrivate.get("reports/loans/loan-balances", {
          params: {
            startDate: filters.startDate,
            endDate:   filters.endDate,
            branch_id: filters.branch_id,
            user_id:   filters.user_id,
          },
        });
        return response?.data?.data ?? [];
      } catch (error) {
        if (error?.response?.status === 401)
          navigate("/", { state: { from: location }, replace: true });
        throw error;
      }
    },
    placeholderData: (prev) => prev,
  });

  const processedData = useMemo(() => data?.map((loan) => ({
    ...loan,
    remaining_principal_balance: parseFloat(loan.disbursed_principal) - parseFloat(loan.principal_paid),
    remaining_interest_balance:  parseFloat(loan.interest) - parseFloat(loan.interest_paid),
    remaining_penalty_balance:   parseFloat(loan.penalty)  - parseFloat(loan.penalty_paid),
    total_loan_paid_amount:
      parseFloat(loan.principal_paid) + parseFloat(loan.penalty_paid) + parseFloat(loan.interest_paid),
    total_balance:
      parseFloat(loan.penalty) + parseFloat(loan.interest) + parseFloat(loan.disbursed_principal) -
      (parseFloat(loan.principal_paid) + parseFloat(loan.penalty_paid) + parseFloat(loan.interest_paid)),
  })), [data]);

  const totalAmountDisbursed = useMemo(() => data?.reduce((s, l) => s + (l.disbursed_principal ?? 0), 0), [data]);
  const totalPrincipalPaid   = useMemo(() => data?.reduce((s, l) => s + (l.principal_paid      ?? 0), 0), [data]);
  const totalInterest        = useMemo(() => data?.reduce((s, l) => s + (l.interest             ?? 0), 0), [data]);
  const totalInterestPaid    = useMemo(() => data?.reduce((s, l) => s + (l.interest_paid        ?? 0), 0), [data]);
  const totalPenalty         = useMemo(() => data?.reduce((s, l) => s + (l.penalty              ?? 0), 0), [data]);
  const totalPenaltyPaid     = useMemo(() => data?.reduce((s, l) => s + (l.penalty_paid         ?? 0), 0), [data]);

  const totalLoanAmountPaid = useMemo(() => totalPrincipalPaid + totalInterestPaid + totalPenaltyPaid, [totalPrincipalPaid, totalInterestPaid, totalPenaltyPaid]);
  const totalLoanBalance    = useMemo(() => totalAmountDisbursed + totalInterest + totalPenalty - totalLoanAmountPaid, [totalAmountDisbursed, totalInterest, totalPenalty, totalLoanAmountPaid]);
  const totalOwed           = useMemo(() => totalAmountDisbursed + totalInterest + totalPenalty, [totalAmountDisbursed, totalInterest, totalPenalty]);
  const collectionEfficiency = useMemo(() => totalOwed > 0 ? ((totalLoanAmountPaid / totalOwed) * 100).toFixed(1) : 0, [totalOwed, totalLoanAmountPaid]);

  const columns = [
    {
      accessorKey: "account",
      header: "Account Number",
      cell: ({ row }) => (
        <Link to={`/clients/${row.original.client_type === "individual" ? "individual" : "group"}/${row.original.account_id}`} className="capitalize text-xs">
          {row.original.account}
        </Link>
      ),
    },
    {
      accessorKey: "client",
      header: "Client Name",
      cell: ({ row }) => (
        <Link to={`/clients/${row.original.client_type === "individual" ? "individual" : "group"}/${row.original.account_id}`} className="capitalize text-xs">
          {row.original.client}
        </Link>
      ),
    },
    {
      accessorKey: "code",
      header: "Loan Number",
      cell: ({ row }) => (
        <Link to={`/loans/${row.original.loan_id}`} className="capitalize text-xs">
          {row.original.code}
        </Link>
      ),
    },
    {
      accessorKey: "product",
      header: "Product",
      cell: ({ row }) => <p className="capitalize text-xs">{row?.original.product}</p>,
    },
    {
      accessorKey: "disbursed_principal",
      header: "Disbursed",
      cell: ({ row }) => <p className="text-xs text-right tabular-nums">{fmt(row.original.disbursed_principal)}</p>,
    },
    {
      accessorKey: "principal_paid",
      header: "Principal Paid",
      cell: ({ row }) => <p className="text-xs text-right tabular-nums">{fmt(row.original.principal_paid)}</p>,
    },
    {
      accessorKey: "remaining_principal_balance",
      header: "Principal Balance",
      cell: ({ row }) => <p className="text-xs text-right tabular-nums">{fmt(row.original.remaining_principal_balance)}</p>,
    },
    {
      accessorKey: "interest",
      header: "Interest",
      cell: ({ row }) => <p className="text-xs text-right tabular-nums">{fmt(row.original.interest)}</p>,
    },
    {
      accessorKey: "interest_paid",
      header: "Interest Paid",
      cell: ({ row }) => <p className="text-xs text-right tabular-nums">{fmt(row.original.interest_paid)}</p>,
    },
    {
      accessorKey: "remaining_interest_balance",
      header: "Interest Balance",
      cell: ({ row }) => <p className="text-xs text-right tabular-nums">{fmt(row.original.remaining_interest_balance)}</p>,
    },
    {
      accessorKey: "penalty",
      header: "Penalty",
      cell: ({ row }) => <p className="text-xs text-right tabular-nums">{fmt(row.original.penalty)}</p>,
    },
    {
      accessorKey: "penalty_paid",
      header: "Penalty Paid",
      cell: ({ row }) => <p className="text-xs text-right tabular-nums">{fmt(row.original.penalty_paid)}</p>,
    },
    {
      accessorKey: "remaining_penalty_balance",
      header: "Penalty Balance",
      cell: ({ row }) => <p className="text-xs text-right tabular-nums">{fmt(row.original.remaining_penalty_balance)}</p>,
    },
    {
      accessorKey: "total_loan_paid_amount",
      header: "Total Paid",
      cell: ({ row }) => <p className="text-xs text-right tabular-nums font-medium text-emerald-700">{fmt(row.original.total_loan_paid_amount)}</p>,
    },
    {
      accessorKey: "total_balance",
      header: "Total Balance",
      cell: ({ row }) => <p className="text-xs text-right tabular-nums font-semibold text-blue-700">{fmt(row.original.total_balance)}</p>,
    },
  ];

  // 15 cols — footerCells cover cols 5–15 (11 cells), label colSpan=4
  const footerCells = [
    { value: totalAmountDisbursed },                          // col 5
    { value: totalPrincipalPaid },                            // col 6
    { value: totalAmountDisbursed - totalPrincipalPaid },     // col 7
    { value: totalInterest },                                 // col 8
    { value: totalInterestPaid },                             // col 9
    { value: totalInterest - totalInterestPaid },             // col 10
    { value: totalPenalty },                                  // col 11
    { value: totalPenaltyPaid },                              // col 12
    { value: totalPenalty - totalPenaltyPaid },               // col 13
    { value: totalLoanAmountPaid, className: "text-emerald-700 font-medium" }, // col 14
    { value: totalLoanBalance,    className: "text-blue-700 font-semibold" },  // col 15
  ];

  const handleFilterChange = (f) => { setFilters(f); refetch(); };

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink to="/dashboard">Home</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink to="/loans-reports">Loans Reports</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Loans Balances Reports</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <div className="flex items-center justify-between space-y-2">
            <h5 className="text-2xl font-bold tracking-tight">Loans Balances Report</h5>
          </div>
          <LoanGeneralReportQuery
            onFilterChange={handleFilterChange}
            isRefetching={isRefetching}
            refetch={refetch}
            data={processedData}
            tableRef={tableRef}
            filters={filters}
            colSpan={4}
            mode={{ format: "A4-L", orientation: "L" }}
            totals={{
              totalAmountDisbursed,
              totalPrincipalPaid,
              principalBalance:        totalAmountDisbursed - totalPrincipalPaid,
              totalInterest,
              totalInterestPaid,
              totalInterestBalance:    totalInterest - totalInterestPaid,
              totalPenalty,
              totalPenaltyPaid,
              totalPenaltyBalance:     totalPenalty - totalPenaltyPaid,
              totalLoanAmountPaid,
              totalLoanBalance,
            }}
            title="Loans Balances Report"
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <ReportKpi label="Total Loan Balance"     value={`UGX ${fmt(totalLoanBalance)}`}    hint="Net balance remaining"              accent="bg-blue-600"    icon={<Wallet size={16} />} />
            <ReportKpi label="Total Collected"        value={`UGX ${fmt(totalLoanAmountPaid)}`} hint="Principal + Interest + Penalty"     accent="bg-emerald-500" icon={<TrendingUp size={16} />} />
            <ReportKpi label="Collection Efficiency"  value={`${collectionEfficiency}%`}        hint="Collected vs total owed"            accent="bg-violet-500"  icon={<Activity size={16} />} />
            <ReportKpi label="Active Loans"           value={data.length}                       hint="Loans in portfolio"                 accent="bg-amber-500"   icon={<CreditCard size={16} />} />
          </div>
          <div className="max-w-[1200px]">
            <DatatableReport
              ref={tableRef}
              columns={columns}
              data={processedData ?? []}
              fetchData={refetch}
              isLoading={isLoading}
              isRefetching={isRefetching}
              isError={isError}
              footerCells={footerCells}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default LoansBalancesReport;

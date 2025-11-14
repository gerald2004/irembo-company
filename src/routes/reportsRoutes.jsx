import DailyReport from "@/Pages/Reports/DailyReport";
import AccountingReport from "@/Pages/Reports/AccountingReports";
import TrialBalance from "@/Pages/Reports/Components/Blocks/Accounting/TrialBalance";
import BalanceSheet from "@/Pages/Reports/Components/Blocks/Accounting/BalanceSheet";
import IncomeStatement from "@/Pages/Reports/Components/Blocks/Accounting/IncomeStatement";
import CashFlowStatement from "@/Pages/Reports/Components/Blocks/Accounting/CashFlowStatement";
import GeneralLedger from "@/Pages/Reports/Components/Blocks/Accounting/GeneralLedger";
import CashBook from "@/Pages/Reports/Components/Blocks/Accounting/CashBook";
import TillSheet from "@/Pages/Reports/Components/Blocks/Accounting/TIllSheet";
import DaySheet from "@/Pages/Reports/Components/Blocks/Accounting/DaySheet";
import IncomeReport from "@/Pages/Reports/Components/Blocks/Accounting/IncomeReport";
import ExpenseReport from "@/Pages/Reports/Components/Blocks/Accounting/ExpenseReport";
import IncomeDetails from "@/Pages/Reports/Components/Blocks/Accounting/IncomeDetails";
import ExpenseDetails from "@/Pages/Reports/Components/Blocks/Accounting/ExpenseDetails";

import LoanReport from "@/Pages/Reports/LoanReports";
import LoanApplicationsReport from "@/Pages/Reports/Components/Blocks/Loans/LoanApplicationsReport";
import ActiveLoansReport from "@/Pages/Reports/Components/Blocks/Loans/ActiveLoansReport";
import OverdueLoansReport from "@/Pages/Reports/Components/Blocks/Loans/OverdueLoansReport";
import LoansPortfolioReport from "@/Pages/Reports/Components/Blocks/Loans/LoansPortfolioReport";
import LoansPortfolioReportSummary from "@/Pages/Reports/Components/Blocks/Loans/LoansPortfolioReportSummary";
import LoansBalancesReport from "@/Pages/Reports/Components/Blocks/Loans/LoansBalancesReport";
import LoansAgingReport from "@/Pages/Reports/Components/Blocks/Loans/LoansAgingReport";
import SettledLoansReport from "@/Pages/Reports/Components/Blocks/Loans/SettledLoansReport";
import WritternOffLoansReport from "@/Pages/Reports/Components/Blocks/Loans/WritternOffLoansReport";
import RejectedLoansReport from "@/Pages/Reports/Components/Blocks/Loans/RejectedLoansReport";
import LoanRecoveryReport from "@/Pages/Reports/Components/Blocks/Loans/LoanRecoveryReport";
import LoanInterestExpectedReport from "@/Pages/Reports/Components/Blocks/Loans/LoanInterestExpectedReport";

import SavingsReports from "@/Pages/Reports/SavingsReports";
import SavingsReport from "@/Pages/Reports/Components/Blocks/Savings/SavingsReport";
import WithdrawsReport from "@/Pages/Reports/Components/Blocks/Savings/WithdrawsReport";

import ClientsReports from "@/Pages/Reports/ClientsReports";
import MembershipReport from "@/Pages/Reports/Components/Blocks/Clients/MembershipReport";
import SharesReport from "@/Pages/Reports/Components/Blocks/Clients/SharesReport";

import AccountsReports from "@/Pages/Reports/AccountReports";
import AccountsBalanceReport from "@/Pages/Reports/Components/Blocks/Accounts/AccountsBalanceReport";

import AssetsReport from "@/Pages/Reports/AssetsReport";
import CommunicationReports from "@/Pages/Reports/CommunicationReports";
import SMSReport from "@/Pages/Reports/Components/Blocks/Communications/SMSReport";
import EmailReport from "@/Pages/Reports/Components/Blocks/Communications/EmailReport";

import AuditTrialReport from "@/Pages/Reports/AuditTrialReport";
import LoansMaturityReport from "@/Pages/Reports/Components/Blocks/Loans/LoansMaturityReport";

const reportsRoutes = [
  { path: "/daily-reports", element: <DailyReport />, roles: [100126] },

  // Accounting Reports
  {
    path: "/accounting-reports",
    element: <AccountingReport />,
    roles: [100127],
  },
  {
    path: "/accounting-reports/trial-balance",
    element: <TrialBalance />,
    roles: [100127],
  },
  {
    path: "/accounting-reports/balance-sheet",
    element: <BalanceSheet />,
    roles: [100127],
  },
  {
    path: "/accounting-reports/income-statement",
    element: <IncomeStatement />,
    roles: [100127],
  },
  {
    path: "/accounting-reports/cash-flow",
    element: <CashFlowStatement />,
    roles: [100127],
  },
  {
    path: "/accounting-reports/general-ledger",
    element: <GeneralLedger />,
    roles: [100127],
  },
  {
    path: "/accounting-reports/cash-book",
    element: <CashBook />,
    roles: [100127],
  },
  {
    path: "/accounting-reports/till-sheet",
    element: <TillSheet />,
    roles: [100127],
  },
  {
    path: "/accounting-reports/day-sheet",
    element: <DaySheet />,
    roles: [100127],
  },
  {
    path: "/accounting-reports/income-reports",
    element: <IncomeReport />,
    roles: [100127],
  },
  {
    path: "/accounting-reports/expense-reports",
    element: <ExpenseReport />,
    roles: [100127],
  },
  {
    path: "/accounting-reports/income-report-detailed",
    element: <IncomeDetails />,
    roles: [100127],
  },
  {
    path: "/accounting-reports/expense-report-detailed",
    element: <ExpenseDetails />,
    roles: [100127],
  },

  // Loan Reports
  { path: "/loans-reports", element: <LoanReport />, roles: [100128] },
  {
    path: "/loans-reports/loan-applications",
    element: <LoanApplicationsReport />,
    roles: [100128],
  },
  {
    path: "/loans-reports/loan-maturity-report",
    element: <LoansMaturityReport />,
    roles: [100128],
  },
  {
    path: "/loans-reports/active-loans",
    element: <ActiveLoansReport />,
    roles: [100128],
  },
  {
    path: "/loans-reports/overdue-loans",
    element: <OverdueLoansReport />,
    roles: [100128],
  },
  {
    path: "/loans-reports/loan-portfolio",
    element: <LoansPortfolioReport />,
    roles: [100128],
  },
  {
    path: "/loans-reports/loan-portfolio/summary",
    element: <LoansPortfolioReportSummary />,
    roles: [100128],
  },
  {
    path: "/loans-reports/loan-balances",
    element: <LoansBalancesReport />,
    roles: [100128],
  },
  {
    path: "/loans-reports/aging-loans",
    element: <LoansAgingReport />,
    roles: [100128],
  },
  {
    path: "/loans-reports/settled-loans",
    element: <SettledLoansReport />,
    roles: [100128],
  },
  {
    path: "/loans-reports/writtern-off-loans",
    element: <WritternOffLoansReport />,
    roles: [100128],
  },
  {
    path: "/loans-reports/rejected-loans",
    element: <RejectedLoansReport />,
    roles: [100128],
  },
  {
    path: "/loans-reports/loans-recovery",
    element: <LoanRecoveryReport />,
    roles: [100128],
  },
  {
    path: "/loans-reports/loans-expected-interest",
    element: <LoanInterestExpectedReport />,
    roles: [100128],
  },

  // Savings Reports
  { path: "/savings-reports", element: <SavingsReports />, roles: [100129] },
  {
    path: "/savings-reports/savings",
    element: <SavingsReport />,
    roles: [100129],
  },
  {
    path: "/savings-reports/withdraws",
    element: <WithdrawsReport />,
    roles: [100129],
  },

  // Client Reports
  { path: "/client-reports", element: <ClientsReports />, roles: [100130] },
  {
    path: "/client-reports/membership",
    element: <MembershipReport />,
    roles: [100130],
  },
  {
    path: "/client-reports/shares",
    element: <SharesReport />,
    roles: [100130],
  },

  // Account Reports
  { path: "/account-reports", element: <AccountsReports />, roles: [100131] },
  {
    path: "/account-reports/account-balances",
    element: <AccountsBalanceReport />,
    roles: [100131],
  },

  // Assets Reports
  { path: "/assets-reports", element: <AssetsReport />, roles: [100131] },

  // Communication Reports
  {
    path: "/communication-reports",
    element: <CommunicationReports />,
    roles: [100133],
  },
  {
    path: "/communication-reports/sms",
    element: <SMSReport />,
    roles: [100133],
  },
  {
    path: "/communication-reports/emails",
    element: <EmailReport />,
    roles: [100133],
  },

  // Audit Trail
  { path: "/activity-log", element: <AuditTrialReport />, roles: [100134] },
];

export default reportsRoutes;

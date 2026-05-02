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
import ComprehensiveIncomeReport from "@/Pages/Reports/Components/Blocks/Accounting/ComprehensiveIncomeReport";
import NotesOfAccounts from "@/Pages/Reports/Components/Blocks/Accounting/NotesOfAccounts";
import ComprehensiveTrialBalance from "@/Pages/Reports/Components/Blocks/Accounting/ComprehensiveTrialBalance";
import CategoryReport from "@/Pages/Reports/Components/Blocks/Accounting/CategoryReport";

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
import MemberProfileReport from "@/Pages/Reports/Components/Blocks/Clients/MemberProfileReport";

import AccountsReports from "@/Pages/Reports/AccountReports";
import AccountsBalanceReport from "@/Pages/Reports/Components/Blocks/Accounts/AccountsBalanceReport";

import AssetsReport from "@/Pages/Reports/AssetsReport";
import CommunicationReports from "@/Pages/Reports/CommunicationReports";
import SMSReport from "@/Pages/Reports/Components/Blocks/Communications/SMSReport";
import EmailReport from "@/Pages/Reports/Components/Blocks/Communications/EmailReport";

import AuditTrialReport from "@/Pages/Reports/AuditTrialReport";
import LoansMaturityReport from "@/Pages/Reports/Components/Blocks/Loans/LoansMaturityReport";
import LoansDisbursementsReport from "@/Pages/Reports/Components/Blocks/Loans/LoansDisbursementsReport";
import DefaultedLoansReport from "@/Pages/Reports/Components/Blocks/Loans/DefaultedLoansReport";
import LoanTrackingReport from "@/Pages/Reports/Components/Blocks/Loans/LoanTrackingReport";
import LoanArrearsReport from "@/Pages/Reports/Components/Blocks/Loans/LoanArrearsReport";
import GuarantorsReport from "@/Pages/Reports/Components/Blocks/Loans/GuarantorsReport";
import PaidOffLoansReport from "@/Pages/Reports/Components/Blocks/Loans/PaidOffLoansReport";
import LoanPeriodicRepaymentReport from "@/Pages/Reports/Components/Blocks/Loans/LoanPeriodicRepaymentReport";
import MissedInstallmentsReport from "@/Pages/Reports/Components/Blocks/Loans/MissedInstallmentsReport";

import GroupReports from "@/Pages/Reports/GroupReports";
import GroupLoansReport from "@/Pages/Reports/Components/Blocks/Groups/GroupLoansReport";
import GroupMembersReport from "@/Pages/Reports/Components/Blocks/Groups/GroupMembersReport";
import GroupSavingsReport from "@/Pages/Reports/Components/Blocks/Groups/GroupSavingsReport";
import GroupPerformanceReport from "@/Pages/Reports/Components/Blocks/Groups/GroupPerformanceReport";
import GroupActiveLoansReport from "@/Pages/Reports/Components/Blocks/Groups/GroupActiveLoansReport";
import GroupOverdueLoansReport from "@/Pages/Reports/Components/Blocks/Groups/GroupOverdueLoansReport";
import GroupPortfolioReport from "@/Pages/Reports/Components/Blocks/Groups/GroupPortfolioReport";
import GroupLoansDueTodayReport from "@/Pages/Reports/Components/Blocks/Groups/GroupLoansDueTodayReport";
import GroupMemberLoansReport from "@/Pages/Reports/Components/Blocks/Groups/GroupMemberLoansReport";

import HRReports from "@/Pages/Reports/HRReports";
import LoanOfficerPerformanceReport from "@/Pages/Reports/Components/Blocks/HR/LoanOfficerPerformanceReport";
import AttendanceReport from "@/Pages/Reports/Components/Blocks/HR/AttendanceReport";
import PayrollReport from "@/Pages/Reports/Components/Blocks/HR/PayrollReport";

const reportsRoutes = [
  { path: "/daily-reports", element: <DailyReport />, roles: [100204, 100126] },

  // Accounting Reports
  { path: "/accounting-reports",                        element: <AccountingReport />,          roles: [100205, 100127] },
  { path: "/accounting-reports/trial-balance",          element: <TrialBalance />,              roles: [100206, 100127] },
  { path: "/accounting-reports/balance-sheet",          element: <BalanceSheet />,              roles: [100207, 100127] },
  { path: "/accounting-reports/income-statement",       element: <IncomeStatement />,           roles: [100208, 100127] },
  { path: "/accounting-reports/cash-flow",              element: <CashFlowStatement />,         roles: [100209, 100127] },
  { path: "/accounting-reports/general-ledger",         element: <GeneralLedger />,             roles: [100210, 100127] },
  { path: "/accounting-reports/cash-book",              element: <CashBook />,                  roles: [100211, 100127] },
  { path: "/accounting-reports/till-sheet",             element: <TillSheet />,                 roles: [100212, 100127] },
  { path: "/accounting-reports/day-sheet",              element: <DaySheet />,                  roles: [100213, 100127] },
  { path: "/accounting-reports/income-reports",         element: <IncomeReport />,              roles: [100214, 100127] },
  { path: "/accounting-reports/expense-reports",        element: <ExpenseReport />,             roles: [100215, 100127] },
  { path: "/accounting-reports/income-report-detailed", element: <IncomeDetails />,             roles: [100216, 100127] },
  { path: "/accounting-reports/expense-report-detailed",element: <ExpenseDetails />,            roles: [100217, 100127] },
  { path: "/accounting-reports/comprehensive-income",        element: <ComprehensiveIncomeReport />,   roles: [100218, 100127] },
  { path: "/accounting-reports/notes-of-accounts",          element: <NotesOfAccounts />,             roles: [100262, 100127] },
  { path: "/accounting-reports/comprehensive-trial-balance", element: <ComprehensiveTrialBalance />,   roles: [100263, 100127] },
  { path: "/accounting-reports/category-report",            element: <CategoryReport />,              roles: [100264, 100127] },

  // Loan Reports
  { path: "/loans-reports",                             element: <LoanReport />,                roles: [100219, 100128] },
  { path: "/loans-reports/loan-applications",           element: <LoanApplicationsReport />,   roles: [100220, 100128] },
  { path: "/loans-reports/loan-maturity-report",        element: <LoansMaturityReport />,       roles: [100232, 100128] },
  { path: "/loans-reports/loan-disbursement-report",    element: <LoansDisbursementsReport />,  roles: [100233, 100128] },
  { path: "/loans-reports/active-loans",                element: <ActiveLoansReport />,         roles: [100221, 100128] },
  { path: "/loans-reports/overdue-loans",               element: <OverdueLoansReport />,        roles: [100222, 100128] },
  { path: "/loans-reports/loan-portfolio",              element: <LoansPortfolioReport />,      roles: [100223, 100128] },
  { path: "/loans-reports/loan-portfolio/summary",      element: <LoansPortfolioReportSummary />,roles: [100224, 100128] },
  { path: "/loans-reports/loan-balances",               element: <LoansBalancesReport />,       roles: [100225, 100128] },
  { path: "/loans-reports/aging-loans",                 element: <LoansAgingReport />,          roles: [100226, 100128] },
  { path: "/loans-reports/settled-loans",               element: <SettledLoansReport />,        roles: [100227, 100128] },
  { path: "/loans-reports/writtern-off-loans",          element: <WritternOffLoansReport />,    roles: [100228, 100128] },
  { path: "/loans-reports/rejected-loans",              element: <RejectedLoansReport />,       roles: [100229, 100128] },
  { path: "/loans-reports/loans-recovery",              element: <LoanRecoveryReport />,        roles: [100230, 100128] },
  { path: "/loans-reports/loans-expected-interest",     element: <LoanInterestExpectedReport />,roles: [100231, 100128] },
  { path: "/loans-reports/defaulted-loans",             element: <DefaultedLoansReport />,      roles: [100234, 100128] },
  { path: "/loans-reports/loan-tracking",               element: <LoanTrackingReport />,        roles: [100235, 100128] },
  { path: "/loans-reports/loan-arrears",                element: <LoanArrearsReport />,         roles: [100236, 100128] },
  { path: "/loans-reports/guarantors",                  element: <GuarantorsReport />,          roles: [100237, 100128] },
  { path: "/loans-reports/paid-off-loans",              element: <PaidOffLoansReport />,        roles: [100238, 100128] },
  { path: "/loans-reports/repayment-periodic",          element: <LoanPeriodicRepaymentReport />, roles: [100261, 100128] },
  { path: "/loans-reports/missed-installments",         element: <MissedInstallmentsReport />,    roles: [100265, 100128] },

  // Group Reports
  { path: "/group-reports",                             element: <GroupReports />,              roles: [100239, 100128] },
  { path: "/group-reports/group-loans",                 element: <GroupLoansReport />,          roles: [100240, 100128] },
  { path: "/group-reports/group-members",               element: <GroupMembersReport />,        roles: [100241, 100128] },
  { path: "/group-reports/group-savings",               element: <GroupSavingsReport />,        roles: [100242, 100128] },
  { path: "/group-reports/group-performance",           element: <GroupPerformanceReport />,    roles: [100243, 100128] },
  { path: "/group-reports/active-group-loans",          element: <GroupActiveLoansReport />,    roles: [100244, 100128] },
  { path: "/group-reports/overdue-group-loans",         element: <GroupOverdueLoansReport />,   roles: [100245, 100128] },
  { path: "/group-reports/group-portfolio",             element: <GroupPortfolioReport />,      roles: [100246, 100128] },
  { path: "/group-reports/loans-due-today",             element: <GroupLoansDueTodayReport />,  roles: [100247, 100128] },
  { path: "/group-reports/member-loans",                element: <GroupMemberLoansReport />,    roles: [100248, 100128] },

  // Savings Reports
  { path: "/savings-reports",                           element: <SavingsReports />,            roles: [100244, 100129] },
  { path: "/savings-reports/savings",                   element: <SavingsReport />,             roles: [100245, 100129] },
  { path: "/savings-reports/withdraws",                 element: <WithdrawsReport />,           roles: [100246, 100129] },

  // Client Reports
  { path: "/client-reports",                            element: <ClientsReports />,            roles: [100247, 100130] },
  { path: "/client-reports/membership",                 element: <MembershipReport />,          roles: [100248, 100130] },
  { path: "/client-reports/shares",                     element: <SharesReport />,              roles: [100249, 100130] },
  { path: "/client-reports/member-profile",             element: <MemberProfileReport />,       roles: [100248, 100130] },

  // Account & Asset Reports
  { path: "/account-reports",                           element: <AccountsReports />,           roles: [100250, 100131] },
  { path: "/account-reports/account-balances",          element: <AccountsBalanceReport />,     roles: [100251, 100131] },
  { path: "/assets-reports",                            element: <AssetsReport />,              roles: [100252, 100131] },

  // Communication Reports
  { path: "/communication-reports",                     element: <CommunicationReports />,      roles: [100253, 100133] },
  { path: "/communication-reports/sms",                 element: <SMSReport />,                 roles: [100254, 100133] },
  { path: "/communication-reports/emails",              element: <EmailReport />,               roles: [100255, 100133] },

  // Audit Trail
  { path: "/activity-log",                              element: <AuditTrialReport />,          roles: [100256, 100134] },

  // HR & Performance Reports
  { path: "/hr-reports",                                element: <HRReports />,                    roles: [100257, 100194] },
  { path: "/hr-reports/loan-officer-performance",       element: <LoanOfficerPerformanceReport />, roles: [100258, 100194] },
  { path: "/hr-reports/attendance",                     element: <AttendanceReport />,             roles: [100259, 100194] },
  { path: "/hr-reports/payroll",                        element: <PayrollReport />,                roles: [100260, 100194] },
];

export default reportsRoutes;

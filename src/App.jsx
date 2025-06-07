import "./App.css";
import { Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import Layout from "./Layouts/Layout";
import Login from "./Pages/Auth/Login";
// import ForgotPassword from "./Pages/Auth/ForgotPassword";
import TwoFactorAuthentication from "./Pages/Auth/TwoFactorAuthentication";
import Dashboard from "./Pages/Dashboard/Dashboard";
import AuthLayout from "./Layouts/AuthLayout";
import RequireAuth from "./components/RequiredAuth";
import PersistLogin from "./components/PersistLogin";
import Missing from "./Pages/Others/Missing";
import Unauthorized from "./Pages/Others/Unauthorized";
import Clients from "./Pages/Clients/Clients";
import SingleIndividualClient from "./Pages/Clients/Components/Individuals/SingleIndividualClient";
import BusinessProfile from "./Pages/Settings/Business/BusinessProfile";
import BusinessDefaults from "./Pages/Settings/Business/BusinessDefaults";
import ChartOfAccounts from "./Pages/Settings/Business/ChartOfAccounts";
import LoanSettings from "./Pages/Settings/Business/LoanSettings";
import LoanSettingsSummary from "./Pages/Settings/Business/LoanSettingsSummary";
import AccountSavingSettings from "./Pages/Settings/Business/AccountSavingSettings";
import AccountSettingsSummary from "./Pages/Settings/Business/AccountSettingsSummary";
import FiscalYears from "./Pages/Settings/Business/FiscalYears";
import FixedDepositSettings from "./Pages/Settings/Business/FixedDepositSettings";
import BranchManagement from "./Pages/Settings/Business/BranchManagement";
import BranchManagementSummary from "./Pages/Settings/Business/BranchManagementSummary";
import EmployeeManagement from "./Pages/HumanResource/Employees/EmployeeManagement";
import StaffDetails from "./Pages/HumanResource/Employees/UserDetails";
import VendorManagement from "./Pages/Settings/Business/VendorManagement";
import TransactionChannels from "./Pages/Settings/Business/TransactionChannels";
import PayrollSettings from "./Pages/Settings/Business/PayrollSettings";
import NotificationSettings from "./Pages/Settings/Business/NotificationSettings";
import AddNewMember from "./Pages/Clients/Components/Individuals/AddNewMember";
import EditMember from "./Pages/Clients/Components/Individuals/EditMember";
import SystemNotifcationsTriggers from "./Pages/Settings/System/SystemNotifcationsTriggers";
import AccountsSummary from "./Pages/Clients/Components/Individuals/AccountsSummary";
import SingleLoan from "./Pages/Loans/SingleLoan";
import IndividualLoans from "./Pages/Loans/IndividualLoans";
import Savings from "./Pages/Accounting/Savings";
import Withdraws from "./Pages/Accounting/Withdraws";
import FixedDeposits from "./Pages/Accounting/FixedDeposits";
import InternalTransfers from "./Pages/Accounting/InternalTransfers";
import Incomes from "./Pages/Accounting/Incomes";
import Expenses from "./Pages/Accounting/Expenses";
import DailyReport from "./Pages/Reports/DailyReport";
import Shares from "./Pages/Accounting/Shares";
import JournalEntries from "./Pages/Accounting/JournalEntries";
import JournalEntriesDetails from "./Pages/Accounting/JournalEntriesDetails";
import AccountEntriesDetails from "./Pages/Accounting/AccountEntriesDetails";
import Assets from "./Pages/Accounting/Assets";
import AccountingReport from "./Pages/Reports/AccountingReports";
import TrialBalance from "./Pages/Reports/Components/Blocks/Accounting/TrialBalance";
import BalanceSheet from "./Pages/Reports/Components/Blocks/Accounting/BalanceSheet";
import IncomeStatement from "./Pages/Reports/Components/Blocks/Accounting/IncomeStatement";
import CashFlowStatement from "./Pages/Reports/Components/Blocks/Accounting/CashFlowStatement";
import GeneralLedger from "./Pages/Reports/Components/Blocks/Accounting/GeneralLedger";
import CashBook from "./Pages/Reports/Components/Blocks/Accounting/CashBook";
import TillSheet from "./Pages/Reports/Components/Blocks/Accounting/TIllSheet";
import DaySheet from "./Pages/Reports/Components/Blocks/Accounting/DaySheet";
import IncomeReport from "./Pages/Reports/Components/Blocks/Accounting/IncomeReport";
import ExpenseReport from "./Pages/Reports/Components/Blocks/Accounting/ExpenseReport";
import IncomeDetails from "./Pages/Reports/Components/Blocks/Accounting/IncomeDetails";
import ExpenseDetails from "./Pages/Reports/Components/Blocks/Accounting/ExpenseDetails";
import LoanReport from "./Pages/Reports/LoanReports";
import AddNewGroup from "./Pages/Clients/Components/Groups/AddGroup";
import SingleGroupClient from "./Pages/Clients/Components/Groups/SingleGroupClient";
import AccountsSummaryGroup from "./Pages/Clients/Components/Groups/AccountsSummaryGroup";
import EditGroup from "./Pages/Clients/Components/Groups/EditGroup";
import GroupLoans from "./Pages/Loans/GroupLoans";
import Profile from "./Pages/Profile/Profile";
import ChangePassword from "./Pages/Profile/ChangePassword";
import Notifications from "./Pages/Profile/Notifications";
import Utility from "./Pages/ExternalTransactions/Utilities/Utility";
import Email from "./Pages/ExternalTransactions/Emails/Email";
import Sms from "./Pages/ExternalTransactions/SMS/Sms";
import BulkSavingsDeposit from "./Pages/BulkStudio/Deposits/BulkSavingsDepositForm";
import BulkSavingsWithdraw from "./Pages/BulkStudio/Withdraws/BulkSavingsWithdraw";
import BulkClientRegistration from "./Pages/BulkStudio/Clients/BulkClientRegistration";
import BulkGroupRegistration from "./Pages/BulkStudio/Groups/BulkGroupRegistration";
import BulkTransfer from "./Pages/BulkStudio/Transfers/BulkTransfer";
import LoanApplications from "./Pages/BulkStudio/Applications/LoanApplications";
import BulkShares from "./Pages/BulkStudio/Shares/BulkShares";
import BulkSms from "./Pages/BulkStudio/BulkSms/BulkSms";
import BulkEmail from "./Pages/BulkStudio/BulkEmail/BulkEmail";
import CreditReferenceBureau from "./Pages/ExternalTransactions/CRB/CreditReferenceBureau";
import LoanApplicationsReport from "./Pages/Reports/Components/Blocks/Loans/LoanApplicationsReport";
import ActiveLoansReport from "./Pages/Reports/Components/Blocks/Loans/ActiveLoansReport";
import OverdueLoansReport from "./Pages/Reports/Components/Blocks/Loans/OverdueLoansReport";
import LoansPortfolioReport from "./Pages/Reports/Components/Blocks/Loans/LoansPortfolioReport";
import LoansPortfolioReportSummary from "./Pages/Reports/Components/Blocks/Loans/LoansPortfolioReportSummary";
import LoansBalancesReport from "./Pages/Reports/Components/Blocks/Loans/LoansBalancesReport";
import LoansAgingReport from "./Pages/Reports/Components/Blocks/Loans/LoansAgingReport";
import SettledLoansReport from "./Pages/Reports/Components/Blocks/Loans/SettledLoansReport";
import WritternOffLoansReport from "./Pages/Reports/Components/Blocks/Loans/WritternOffLoansReport";
import RejectedLoansReport from "./Pages/Reports/Components/Blocks/Loans/RejectedLoansReport";
import LoanRecoveryReport from "./Pages/Reports/Components/Blocks/Loans/LoanRecoveryReport";
import LoanInterestExpectedReport from "./Pages/Reports/Components/Blocks/Loans/LoanInterestExpectedReport";
import SavingsReports from "./Pages/Reports/SavingsReports";
import SavingsReport from "./Pages/Reports/Components/Blocks/Savings/SavingsReport";
import WithdrawsReport from "./Pages/Reports/Components/Blocks/Savings/WithdrawsReport";
import ClientsReports from "./Pages/Reports/ClientsReports";
import MembershipReport from "./Pages/Reports/Components/Blocks/Clients/MembershipReport";
import SharesReport from "./Pages/Reports/Components/Blocks/Clients/SharesReport";
import AccountsReports from "./Pages/Reports/AccountReports";
import AccountsBalanceReport from "./Pages/Reports/Components/Blocks/Accounts/AccountsBalanceReport";
import AssetsReport from "./Pages/Reports/AssetsReport";
import CommunicationReports from "./Pages/Reports/CommunicationReports";
import SMSReport from "./Pages/Reports/Components/Blocks/Communications/SMSReport";
import EmailReport from "./Pages/Reports/Components/Blocks/Communications/EmailReport";
import AuditTrialReport from "./Pages/Reports/AuditTrialReport";
import PayrollManagement from "./Pages/HumanResource/Payroll/Payroll";
import GeneralConfigurationTriggers from "./Pages/Settings/System/GeneralConfigurationTriggers";
import MobileMoneyFloatManagent from "./Pages/FloatManagement/MobileMoneyFloatManagent";
import SMSFloatManagent from "./Pages/FloatManagement/SMSFloatManagent";
import UtilityFloatManagent from "./Pages/FloatManagement/UtilityFloatManagent";
import CrbFloatManagent from "./Pages/FloatManagement/CrbFloatManagent";
import Roles from "./Pages/Settings/System/Roles";
import AddRoles from "./Pages/Settings/System/AddRoles";
import EditRoles from "./Pages/Settings/System/EditRoles";

function App() {
  return (
    <>
      <Toaster />
      <Routes>
        <Route path="" element={<Layout />}>
          <Route path="/" element={<Login />} />
          {/* <Route path="/forgot-password" element={<ForgotPassword />} /> */}
          <Route path="/unauthorized" element={<Unauthorized />} />

          <Route element={<PersistLogin />}>
            <Route element={<RequireAuth allowedRoles={[100001]} />}>
              <Route path="/verify" element={<TwoFactorAuthentication />} />
            </Route>
            <Route element={<AuthLayout />}>
              {/* dashboard */}
              <Route element={<RequireAuth allowedRoles={[100001]} />}>
                <Route path="/dashboard" element={<Dashboard />} />
              </Route>
              {/* clients */}
              <Route element={<RequireAuth allowedRoles={[100011, 100015]} />}>
                <Route path="/clients" element={<Clients />} />
              </Route>
              <Route element={<RequireAuth allowedRoles={[100008]} />}>
                <Route
                  path="/clients/individual/:id"
                  element={<SingleIndividualClient />}
                />
              </Route>
              <Route element={<RequireAuth allowedRoles={[100016]} />}>
                <Route
                  path="/clients/group/:id"
                  element={<SingleGroupClient />}
                />
              </Route>
              <Route element={<RequireAuth allowedRoles={[100155]} />}>
                <Route
                  path="/clients/individuals/:id/accounts/:client_id"
                  element={<AccountsSummary />}
                />
                <Route
                  path="/clients/group/:id/accounts/:client_id"
                  element={<AccountsSummaryGroup />}
                />
              </Route>
              <Route element={<RequireAuth allowedRoles={[100007]} />}>
                <Route
                  path="/clients/individual/new"
                  element={<AddNewMember />}
                />
              </Route>
              <Route element={<RequireAuth allowedRoles={[100012]} />}>
                <Route path="/clients/group/new" element={<AddNewGroup />} />
              </Route>
              <Route element={<RequireAuth allowedRoles={[100009]} />}>
                <Route
                  path="/clients/individual/:id/edit-client"
                  element={<EditMember />}
                />
              </Route>
              <Route element={<RequireAuth allowedRoles={[100013]} />}>
                <Route
                  path="/clients/group/:id/edit-client"
                  element={<EditGroup />}
                />
              </Route>
              {/* loans */}
              <Route element={<RequireAuth allowedRoles={[100067]} />}>
                <Route path="/Individual-loans" element={<IndividualLoans />} />
              </Route>
              <Route element={<RequireAuth allowedRoles={[100157]} />}>
                <Route path="/group-loans" element={<GroupLoans />} />
              </Route>
              <Route element={<RequireAuth allowedRoles={[100068]} />}>
                <Route path="/loans/:loanid" element={<SingleLoan />} />
              </Route>
              {/* savings and withdraws */}
              <Route path="/savings" element={<Savings />} />
              <Route path="/withdraws" element={<Withdraws />} />
              <Route path="/fixed-deposits" element={<FixedDeposits />} />
              <Route
                path="/internal-transfers"
                element={<InternalTransfers />}
              />
              {/* income and expenses */}
              <Route path="/external-incomes" element={<Incomes />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/shares" element={<Shares />} />
              {/* journal entries */}
              <Route path="/journal-entries" element={<JournalEntries />} />
              <Route
                path="/journal-entries/:journalId"
                element={<JournalEntriesDetails />}
              />
              <Route
                path="/ledgers/accounts/:accountId"
                element={<AccountEntriesDetails />}
              />
              {/* assets */}
              <Route path="/assets" element={<Assets />} />
              {/* reports */}
              <Route path="/daily-reports" element={<DailyReport />} />
              <Route
                path="/accounting-reports"
                element={<AccountingReport />}
              />
              <Route
                path="/accounting-reports/trial-balance"
                element={<TrialBalance />}
              />
              <Route
                path="/accounting-reports/balance-sheet"
                element={<BalanceSheet />}
              />
              <Route
                path="/accounting-reports/income-statement"
                element={<IncomeStatement />}
              />
              <Route
                path="/accounting-reports/cash-flow"
                element={<CashFlowStatement />}
              />
              <Route
                path="/accounting-reports/cash-flow"
                element={<CashFlowStatement />}
              />
              <Route
                path="/accounting-reports/general-ledger"
                element={<GeneralLedger />}
              />
              <Route
                path="/accounting-reports/cash-book"
                element={<CashBook />}
              />
              <Route
                path="/accounting-reports/till-sheet"
                element={<TillSheet />}
              />
              <Route
                path="/accounting-reports/day-sheet"
                element={<DaySheet />}
              />
              <Route
                path="/accounting-reports/income-reports"
                element={<IncomeReport />}
              />
              <Route
                path="/accounting-reports/expense-reports"
                element={<ExpenseReport />}
              />
              <Route
                path="/accounting-reports/income-report-detailed"
                element={<IncomeDetails />}
              />
              <Route
                path="/accounting-reports/expense-report-detailed"
                element={<ExpenseDetails />}
              />
              <Route path="/loans-reports" element={<LoanReport />} />
              {/* business settings */}
              <Route path="/business-profile" element={<BusinessProfile />} />
              <Route path="/business-defaults" element={<BusinessDefaults />} />
              <Route path="/chart-of-accounts" element={<ChartOfAccounts />} />
              <Route path="/loan-settings" element={<LoanSettings />} />
              <Route
                path="/loan-settings/products/:id"
                element={<LoanSettingsSummary />}
              />
              <Route
                path="/account-savings-settings"
                element={<AccountSavingSettings />}
              />
              <Route
                path="/account-savings-settings/:id"
                element={<AccountSettingsSummary />}
              />
              <Route path="/fiscal-years" element={<FiscalYears />} />
              <Route
                path="/fixed-deposit-settings"
                element={<FixedDepositSettings />}
              />
              <Route path="/branch-management" element={<BranchManagement />} />
              <Route
                path="/branch-management/:id"
                element={<BranchManagementSummary />}
              />
              <Route
                path="/staff-management"
                element={<EmployeeManagement />}
              />
              <Route path="/payroll" element={<PayrollManagement />} />
              <Route path="/staff-management/:id" element={<StaffDetails />} />
              <Route path="/vendor-management" element={<VendorManagement />} />
              <Route
                path="/transaction-channels"
                element={<TransactionChannels />}
              />
              <Route path="/payroll-settings" element={<PayrollSettings />} />
              <Route
                path="/notifications-settings"
                element={<NotificationSettings />}
              />
              {/* system settings */}
              <Route
                path="/system-notification-triggers"
                element={<SystemNotifcationsTriggers />}
              />
              <Route
                path="/general-config"
                element={<GeneralConfigurationTriggers />}
              />
              <Route path="/system-roles" element={<Roles />} />
              <Route path="/system-roles/add-role" element={<AddRoles />} />
              <Route
                path="/system-roles/edit-role/:id"
                element={<EditRoles />}
              />
              {/* profile */}
              <Route path="/profile" element={<Profile />} />
              <Route path="/change-password" element={<ChangePassword />} />
              <Route path="/notifications" element={<Notifications />} />
              {/* customer_care */}
              <Route path="/utilities" element={<Utility />} />
              <Route path="/emails" element={<Email />} />
              <Route path="/sms" element={<Sms />} />
              <Route
                path="/credit-reference-bureau"
                element={<CreditReferenceBureau />}
              />
              {/* bulk studio */}
              {/* Bulk savings and withdraws */}
              <Route path="/bulk-savings" element={<BulkSavingsDeposit />} />
              <Route path="/bulk-withdraws" element={<BulkSavingsWithdraw />} />
              {/* Bulk registration */}
              <Route
                path="/bulk-client-registration"
                element={<BulkClientRegistration />}
              />
              <Route
                path="/bulk-group-registration"
                element={<BulkGroupRegistration />}
              />
              {/* Bulk Transfers */}
              <Route path="/bulk-transfers" element={<BulkTransfer />} />
              {/* Bulk Applications */}
              <Route
                path="/bulk-loan-applications"
                element={<LoanApplications />}
              />
              {/*  Bulk shares */}
              <Route path="/bulk-shares" element={<BulkShares />} />
              {/* Bulk SMS Alerts */}
              <Route path="/bulk-sms-alerts" element={<BulkSms />} />
              {/* Bulk Email alerts */}
              <Route path="/bulk-email-alerts" element={<BulkEmail />} />
              {/* float management */}
              <Route
                path="/mobile-banking-float-management"
                element={<MobileMoneyFloatManagent />}
              />
              <Route
                path="/sms-float-management"
                element={<SMSFloatManagent />}
              />
              <Route
                path="/utilities-float-management"
                element={<UtilityFloatManagent />}
              />
              <Route
                path="/crb-float-management"
                element={<CrbFloatManagent />}
              />
              {/* loans report */}
              <Route
                path="/loans-reports/loan-applications"
                element={<LoanApplicationsReport />}
              />
              <Route
                path="/loans-reports/active-loans"
                element={<ActiveLoansReport />}
              />
              <Route
                path="/loans-reports/overdue-loans"
                element={<OverdueLoansReport />}
              />
              <Route
                path="/loans-reports/loan-portfolio"
                element={<LoansPortfolioReport />}
              />
              <Route
                path="/loans-reports/loan-portfolio/summary"
                element={<LoansPortfolioReportSummary />}
              />
              <Route
                path="/loans-reports/loan-balances"
                element={<LoansBalancesReport />}
              />
              <Route
                path="/loans-reports/aging-loans"
                element={<LoansAgingReport />}
              />
              <Route
                path="/loans-reports/settled-loans"
                element={<SettledLoansReport />}
              />
              <Route
                path="/loans-reports/writtern-off-loans"
                element={<WritternOffLoansReport />}
              />
              <Route
                path="/loans-reports/rejected-loans"
                element={<RejectedLoansReport />}
              />
              <Route
                path="/loans-reports/loans-recovery"
                element={<LoanRecoveryReport />}
              />{" "}
              <Route
                path="/loans-reports/loans-expected-interest"
                element={<LoanInterestExpectedReport />}
              />
              {/* saving reports */}
              <Route path="/savings-reports" element={<SavingsReports />} />
              <Route
                path="/savings-reports/savings"
                element={<SavingsReport />}
              />
              <Route
                path="/savings-reports/withdraws"
                element={<WithdrawsReport />}
              />
              {/* client reports */}
              <Route path="/client-reports" element={<ClientsReports />} />
              <Route
                path="/client-reports/membership"
                element={<MembershipReport />}
              />
              <Route path="/client-reports/shares" element={<SharesReport />} />
              {/* account reports */}
              <Route path="/account-reports" element={<AccountsReports />} />
              <Route
                path="/account-reports/account-balances"
                element={<AccountsBalanceReport />}
              />
              {/* assets reports */}
              <Route path="/assets-reports" element={<AssetsReport />} />
              {/* communications reports */}
              <Route
                path="/communication-reports"
                element={<CommunicationReports />}
              />
              <Route
                path="/communication-reports/sms"
                element={<SMSReport />}
              />
              <Route
                path="/communication-reports/emails"
                element={<EmailReport />}
              />
              {/* audit trail */}
              <Route path="/activity-log" element={<AuditTrialReport />} />
            </Route>
          </Route>
          <Route path="*" element={<Missing />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;

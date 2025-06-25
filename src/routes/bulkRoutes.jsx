import BulkSavingsDeposit from "@/Pages/BulkStudio/Deposits/BulkSavingsDepositForm";
import BulkSavingsWithdraw from "@/Pages/BulkStudio/Withdraws/BulkSavingsWithdraw";
import BulkClientRegistration from "@/Pages/BulkStudio/Clients/BulkClientRegistration";
import BulkGroupRegistration from "@/Pages/BulkStudio/Groups/BulkGroupRegistration";
import BulkTransfer from "@/Pages/BulkStudio/Transfers/BulkTransfer";
import LoanApplications from "@/Pages/BulkStudio/Applications/LoanApplications";
import BulkShares from "@/Pages/BulkStudio/Shares/BulkShares";
import BulkSms from "@/Pages/BulkStudio/BulkSms/BulkSms";
import BulkEmail from "@/Pages/BulkStudio/BulkEmail/BulkEmail";
const bulkRoutes = [
  // Bulk Operations
  { path: "/bulk-savings", element: <BulkSavingsDeposit />, roles: [100125] },
  {
    path: "/bulk-withdraws",
    element: <BulkSavingsWithdraw />,
    roles: [100125],
  },
  {
    path: "/bulk-client-registration",
    element: <BulkClientRegistration />,
    roles: [100125],
  },
  {
    path: "/bulk-group-registration",
    element: <BulkGroupRegistration />,
    roles: [100125],
  },
  { path: "/bulk-transfers", element: <BulkTransfer />, roles: [100125] },
  {
    path: "/bulk-loan-applications",
    element: <LoanApplications />,
    roles: [100125],
  },
  { path: "/bulk-shares", element: <BulkShares />, roles: [100125] },
  { path: "/bulk-sms-alerts", element: <BulkSms />, roles: [100125] },
  { path: "/bulk-email-alerts", element: <BulkEmail />, roles: [100125] },
];

export default bulkRoutes;
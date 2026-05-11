import BusinessProfile from "@/Pages/Settings/Business/BusinessProfile";
import BusinessDefaults from "@/Pages/Settings/Business/BusinessDefaults";
import ChartOfAccounts from "@/Pages/Settings/Business/ChartOfAccounts";
import LoanSettings from "@/Pages/Settings/Business/LoanSettings";
import LoanSettingsSummary from "@/Pages/Settings/Business/LoanSettingsSummary";
import AccountSavingSettings from "@/Pages/Settings/Business/AccountSavingSettings";
import AccountSettingsSummary from "@/Pages/Settings/Business/AccountSettingsSummary";
import FiscalYears from "@/Pages/Settings/Business/FiscalYears";
import FixedDepositSettings from "@/Pages/Settings/Business/FixedDepositSettings";
import BranchManagement from "@/Pages/Settings/Business/BranchManagement";
import BranchManagementSummary from "@/Pages/Settings/Business/BranchManagementSummary";
import VendorManagement from "@/Pages/Settings/Business/VendorManagement";
import TransactionChannels from "@/Pages/Settings/Business/TransactionChannels";
import PayrollSettings from "@/Pages/Settings/Business/PayrollSettings";
import NotificationSettings from "@/Pages/Settings/Business/NotificationSettings";
import CompulsorySavingsSettings from "@/Pages/Settings/Business/CompulsorySavingsSettings";
import MobileAppConfig from "@/Pages/Settings/Business/MobileAppConfig";

import SystemNotifcationsTriggers from "@/Pages/Settings/System/SystemNotifcationsTriggers";
import Roles from "@/Pages/Settings/System/Roles";
import AddRoles from "@/Pages/Settings/System/AddRoles";
import EditRoles from "@/Pages/Settings/System/EditRoles";
import GeneralConfigurationTriggers from "@/Pages/Settings/System/GeneralConfigurationTriggers";
import LoanNotificationsAdmin from "@/Pages/Settings/System/LoanNotificationsAdmin";
import SaccoDiskUsage from "@/Pages/Settings/System/SaccoDiskUsage";
import TransactionChannelLinkedAccounts from "@/Pages/Settings/Business/TransactionChannelLinkedAccounts";

const settingsRoutes = [
  // Business Settings
  { path: "/business-profile", element: <BusinessProfile />, roles: [100136] },
  {
    path: "/business-defaults",
    element: <BusinessDefaults />,
    roles: [100137],
  },
  { path: "/chart-of-accounts", element: <ChartOfAccounts />, roles: [100139] },
  { path: "/loan-settings", element: <LoanSettings />, roles: [100140] },
  {
    path: "/loan-settings/products/:id",
    element: <LoanSettingsSummary />,
    roles: [100140],
  },
  {
    path: "/account-savings-settings",
    element: <AccountSavingSettings />,
    roles: [100142],
  },
  {
    path: "/account-savings-settings/:id",
    element: <AccountSettingsSummary />,
    roles: [100142],
  },
  { path: "/fiscal-years", element: <FiscalYears />, roles: [100138] },
  {
    path: "/fixed-deposit-settings",
    element: <FixedDepositSettings />,
    roles: [100141],
  },
  {
    path: "/branch-management",
    element: <BranchManagement />,
    roles: [100143],
  },
  {
    path: "/branch-management/:id",
    element: <BranchManagementSummary />,
    roles: [100143],
  },
  {
    path: "/vendor-management",
    element: <VendorManagement />,
    roles: [100144],
  },
  {
    path: "/transaction-channels",
    element: <TransactionChannels />,
    roles: [100145],
  },
  {
    path: "/transaction-linked-accounts",
    element: <TransactionChannelLinkedAccounts />,
    roles: [100145],
  },
  { path: "/payroll-settings", element: <PayrollSettings />, roles: [100146] },
  {
    path: "/notifications-settings",
    element: <NotificationSettings />,
    roles: [100147],
  },
  {
    path: "/compulsory-savings-settings",
    element: <CompulsorySavingsSettings />,
    roles: [100137],
  },

  // System Settings
  {
    path: "/system-notification-triggers",
    element: <SystemNotifcationsTriggers />,
    roles: [100150],
  },
  {
    path: "/general-config",
    element: <GeneralConfigurationTriggers />,
    roles: [100148],
  },
  {
    path: "/mobile-app-config",
    element: <MobileAppConfig />,
    roles: [100148],
  },
  {
    path: "/loan-notifications-admin",
    element: <LoanNotificationsAdmin />,
    roles: [100266],
  },
  {
    path: "/sacco-disk-usage",
    element: <SaccoDiskUsage />,
    roles: [100148],
  },
  { path: "/system-roles", element: <Roles />, roles: [100149] },
  { path: "/system-roles/add-role", element: <AddRoles />, roles: [100149] },
  {
    path: "/system-roles/edit-role/:id",
    element: <EditRoles />,
    roles: [100149],
  },
];

export default settingsRoutes;

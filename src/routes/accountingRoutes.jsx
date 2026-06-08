import Incomes from "@/Pages/Accounting/Incomes";
import Expenses from "@/Pages/Accounting/Expenses";
import JournalEntries from "@/Pages/Accounting/JournalEntries";
import JournalEntriesDetails from "@/Pages/Accounting/JournalEntriesDetails";
import AccountEntriesDetails from "@/Pages/Accounting/AccountEntriesDetails";
import Assets from "@/Pages/Accounting/Assets";
import OpeningDay from "@/Pages/Accounting/OpeningDay";
import ClosingDay from "@/Pages/Accounting/ClosingDay";
import CashTransfers from "@/Pages/Accounting/CashTransfers";
import InterBranchTransfers from "@/Pages/Accounting/InterBranchTransfers";
import Budgets from "@/Pages/Accounting/Budgets";
import BudgetDetail from "@/Pages/Accounting/BudgetDetail";
import BudgetVariance from "@/Pages/Accounting/BudgetVariance";

const accountingRoutes = [
  {
    path: "/external-incomes",
    element: <Incomes />,
    roles: [100104],
  },
  {
    path: "/expenses",
    element: <Expenses />,
    roles: [100107],
  },
  {
    path: "/journal-entries",
    element: <JournalEntries />,
    roles: [100109],
  },
  {
    path: "/opening-a-business-day",
    element: <OpeningDay />,
    roles: [100109],
  },
  {
    path: "/closing-a-business-day",
    element: <ClosingDay />,
    roles: [100109],
  },
  {
    path: "/journal-entries/:journalId",
    element: <JournalEntriesDetails />,
    roles: [100169],
  },
  {
    path: "/ledgers/accounts/:accountId",
    element: <AccountEntriesDetails />,
    roles: [100168],
  },
  {
    path: "/assets",
    element: <Assets />,
    roles: [100111],
  },
  {
    path: "/cash-transfers",
    element: <CashTransfers />,
    roles: [100516],
  },
  {
    path: "/inter-branch-transfers",
    element: <InterBranchTransfers />,
    roles: [100511],
  },
  { path: "/budgets",                    element: <Budgets />,        roles: [100270, 100275] },
  { path: "/budgets/:budgetId",          element: <BudgetDetail />,   roles: [100270, 100275] },
  { path: "/budgets/:budgetId/variance", element: <BudgetVariance />, roles: [100274, 100275] },
];

export default accountingRoutes;

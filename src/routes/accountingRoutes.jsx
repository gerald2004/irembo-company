import Incomes from "@/Pages/Accounting/Incomes";
import Expenses from "@/Pages/Accounting/Expenses";
import JournalEntries from "@/Pages/Accounting/JournalEntries";
import JournalEntriesDetails from "@/Pages/Accounting/JournalEntriesDetails";
import AccountEntriesDetails from "@/Pages/Accounting/AccountEntriesDetails";
import Assets from "@/Pages/Accounting/Assets";

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
];

export default accountingRoutes;

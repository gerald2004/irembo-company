import Savings from "@/Pages/Accounting/Savings";
import Withdraws from "@/Pages/Accounting/Withdraws";
import FixedDeposits from "@/Pages/Accounting/FixedDeposits";
import InternalTransfers from "@/Pages/Accounting/InternalTransfers";
import Shares from "@/Pages/Accounting/Shares";

const transactionRoutes = [
  {
    path: "/savings",
    element: <Savings />,
    roles: [100099],
  },
  {
    path: "/withdraws",
    element: <Withdraws />,
    roles: [100100],
  },
  {
    path: "/fixed-deposits",
    element: <FixedDeposits />,
    roles: [100101],
  },
  {
    path: "/internal-transfers",
    element: <InternalTransfers />,
    roles: [100102],
  },
  {
    path: "/shares",
    element: <Shares />,
    roles: [100103],
  },
];

export default transactionRoutes;

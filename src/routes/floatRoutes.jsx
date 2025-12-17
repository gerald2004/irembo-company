import MobileMoneyFloatManagent from "@/Pages/FloatManagement/MobileMoneyFloatManagent";
import MobileMoneyTransactionsData from "@/Pages/FloatManagement/MobileMoneyTransactionsData";
import SMSFloatManagent from "@/Pages/FloatManagement/SMSFloatManagent";
import UtilityFloatManagent from "@/Pages/FloatManagement/UtilityFloatManagent";
import CrbFloatManagent from "@/Pages/FloatManagement/CrbFloatManagent";
const floatRoutes = [
  // Float Management
  {
    path: "/mobile-banking-float-management",
    element: <MobileMoneyFloatManagent />,
    roles: [100135],
  },
  {
    path: "/float-management/mobile-banking/:provider",
    element: <MobileMoneyTransactionsData />,
    roles: [100135],
  },
  {
    path: "/sms-float-management",
    element: <SMSFloatManagent />,
    roles: [100135],
  },
  {
    path: "/utilities-float-management",
    element: <UtilityFloatManagent />,
    roles: [100135],
  },
  {
    path: "/crb-float-management",
    element: <CrbFloatManagent />,
    roles: [100135],
  },
];

export default floatRoutes;

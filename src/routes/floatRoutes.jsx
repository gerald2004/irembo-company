import MobileMoneyFloatManagent from "@/Pages/FloatManagement/MobileMoneyFloatManagent";
import MobileMoneyTransactionsData from "@/Pages/FloatManagement/MobileMoneyTransactionsData";
import SMSFloatManagent from "@/Pages/FloatManagement/SMSFloatManagent";
import UtilityFloatManagent from "@/Pages/FloatManagement/UtilityFloatManagent";
import CrbFloatManagent from "@/Pages/FloatManagement/CrbFloatManagent";
import BankFloatManagement from "@/Pages/FloatManagement/BankFloatManagement";
import BankTransactionsData from "@/Pages/FloatManagement/BankTransactionsData";
import SmsFloatTransactionsData from "@/Pages/FloatManagement/SmsFloatTransactionsData";
import UtilitiesFloatTransactionsData from "@/Pages/FloatManagement/UtilitiesFloatTransactionsData";
import EmailFloatManagent from "@/Pages/FloatManagement/EmailFloatManagent";
import EmailFloatTransactionsData from "@/Pages/FloatManagement/EmailFloatTransactionsData";
import CrbFloatTransactionsData from "@/Pages/FloatManagement/CrbFloatTransactionsData";
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
    path: "/bank-float-management",
    element: <BankFloatManagement />,
    roles: [100135],
  },
  {
    path: "/float-management/bank/:provider",
    element: <BankTransactionsData />,
    roles: [100135],
  },
  {
    path: "/sms-float-management",
    element: <SMSFloatManagent />,
    roles: [100135],
  },
  {
    path: "/sms-float-management/:smsAccountId",
    element: <SmsFloatTransactionsData />,
    roles: [100135],
  },
  {
    path: "/utilities-float-management",
    element: <UtilityFloatManagent />,
    roles: [100135],
  },
  {
    path: "/utilities-float-management/:utilityAccountId",
    element: <UtilitiesFloatTransactionsData />,
    roles: [100135],
  },
  {
    path: "/email-float-management",
    element: <EmailFloatManagent />,
    roles: [100135],
  },
  {
    path: "/email-float-management/:emailAccountId",
    element: <EmailFloatTransactionsData />,
    roles: [100135],
  },
  {
    path: "/crb-float-management",
    element: <CrbFloatManagent />,
    roles: [100135],
  },
  {
    path: "/crb-float-management/:crbAccountId",
    element: <CrbFloatTransactionsData />,
    roles: [100135],
  },
];

export default floatRoutes;

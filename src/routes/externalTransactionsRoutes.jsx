import Utility from "@/Pages/ExternalTransactions/Utilities/Utility";
import Email from "@/Pages/ExternalTransactions/Emails/Email";
import Sms from "@/Pages/ExternalTransactions/SMS/Sms";
import CreditReferenceBureau from "@/Pages/ExternalTransactions/CRB/CreditReferenceBureau";
const externalTransactionsRoutes = [
  // Customer Care
  { path: "/utilities", element: <Utility />, roles: [100124] },
  { path: "/emails", element: <Email />, roles: [100122] },
  { path: "/sms", element: <Sms />, roles: [100121] },
  {
    path: "/credit-reference-bureau",
    element: <CreditReferenceBureau />,
    roles: [100123],
  },

 
];

export default externalTransactionsRoutes;

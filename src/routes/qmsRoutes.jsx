import QMSPage from "@/Pages/QMS/QMSPage";

// 100611 View Policies · 100613 View Approval Queue · 100616 View Pending Actions
const qmsRoutes = [
  { path: "/qms", element: <QMSPage />, roles: [100611, 100613, 100616] },
];

export default qmsRoutes;

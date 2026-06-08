import AMLPage from "@/Pages/AML/AMLPage";

// 100601 View Dashboard · 100602 View Rules · 100606 View Alerts · 100608 View Cases
const amlRoutes = [
  { path: "/aml", element: <AMLPage />, roles: [100601, 100602, 100606, 100608] },
];

export default amlRoutes;

import Dashboard from "@/Pages/Dashboard/Dashboard";

const dashBoardRoutes = [
 
  {
    path: "/dashboard",
    element: <Dashboard />,
    roles: [100001],
  },
];

export default dashBoardRoutes;

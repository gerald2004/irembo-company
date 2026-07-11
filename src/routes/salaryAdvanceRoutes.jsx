import SalaryAdvanceApplications from "@/Pages/SalaryAdvance/SalaryAdvanceApplications";
import SingleSalaryAdvance from "@/Pages/SalaryAdvance/SingleSalaryAdvance";

const salaryAdvanceRoutes = [
  {
    path: "/salary-advance-applications",
    element: <SalaryAdvanceApplications />,
    roles: [100621],
  },
  {
    path: "/salary-advance/:applicationid",
    element: <SingleSalaryAdvance />,
    roles: [100621],
  },
];

export default salaryAdvanceRoutes;

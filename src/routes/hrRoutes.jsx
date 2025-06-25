import EmployeeManagement from "@/Pages/HumanResource/Employees/EmployeeManagement";
import StaffDetails from "@/Pages/HumanResource/Employees/UserDetails";
import PayrollManagement from "@/Pages/HumanResource/Payroll/Payroll";

const hrRoutes = [
  {
    path: "/staff-management",
    element: <EmployeeManagement />,
    roles: [100174],
  },
  {
    path: "/payroll",
    element: <PayrollManagement />,
    roles: [100119],
  },
  {
    path: "/staff-management/:id",
    element: <StaffDetails />,
    roles: [100173],
  },
];

export default hrRoutes;

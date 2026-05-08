import EmployeeManagement from "@/Pages/HumanResource/Employees/EmployeeManagement";
import StaffDetails from "@/Pages/HumanResource/Employees/UserDetails";
import LoanPrivileges from "@/Pages/HumanResource/Employees/LoanPrivileges";
import PayrollManagement from "@/Pages/HumanResource/Payroll/Payroll";
import AttendancePage from "@/Pages/HumanResource/Attendance/Attendance";
import LeaveManagement from "@/Pages/HumanResource/Leave/LeaveManagement";
import PublicHolidays from "@/Pages/HumanResource/Holidays/PublicHolidays";

const hrRoutes = [
  { path: "/staff-management",               element: <EmployeeManagement />, roles: [100174] },
  { path: "/staff-management/:id",           element: <StaffDetails />,       roles: [100173] },
  { path: "/staff-management/loan-privileges", element: <LoanPrivileges />,   roles: [100174] },
  { path: "/payroll",                 element: <PayrollManagement />,  roles: [100119] },
  { path: "/attendance",              element: <AttendancePage />,     roles: [100174] },
  { path: "/leave-management",        element: <LeaveManagement />,    roles: [100174] },
  { path: "/public-holidays",         element: <PublicHolidays />,     roles: [100174] },
];

export default hrRoutes;

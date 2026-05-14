import IndividualLoans from "@/Pages/Loans/IndividualLoans";
import GroupLoans from "@/Pages/Loans/GroupLoans";
import JointLoans from "@/Pages/Loans/JointLoans";
import CompanyLoans from "@/Pages/Loans/CompanyLoans";
import SingleLoan from "@/Pages/Loans/SingleLoan";

const loansRoutes = [
  {
    path: "/Individual-loans",
    element: <IndividualLoans />,
    roles: [100067],
  },
  {
    path: "/group-loans",
    element: <GroupLoans />,
    roles: [100158],
  },
  {
    path: "/joint-loans",
    element: <JointLoans />,
    roles: [100520],
  },
  {
    path: "/company-loans",
    element: <CompanyLoans />,
    roles: [100521],
  },
  {
    path: "/loans/:loanid",
    element: <SingleLoan />,
    roles: [100068],
  },
];

export default loansRoutes;

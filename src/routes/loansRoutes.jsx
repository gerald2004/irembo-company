import IndividualLoans from "@/Pages/Loans/IndividualLoans";
import GroupLoans from "@/Pages/Loans/GroupLoans";
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
    path: "/loans/:loanid",
    element: <SingleLoan />,
    roles: [100068],
  },
];

export default loansRoutes;

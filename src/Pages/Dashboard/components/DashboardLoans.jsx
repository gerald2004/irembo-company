import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { useNavigate } from "react-router-dom";

import { DisbursementByLoanProduct } from "./others/DisbrsementByLoanProduct";
import { LoansByGenderPieChart } from "./others/LoansByGender";
import { LoansTrendBarChart } from "./others/LoansTrendBarChart";
const DashboardLoans = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const { data: loans = [], isLoading } = useQuery({
    queryKey: ["dashboard-loans-data"],
    queryFn: async () => {
      const fetchURL = `/dashboards/loans`;
      try {
        const response = await axiosPrivate.get(fetchURL);
        return response.data.data ?? [];
      } catch (error) {
        if (error?.response?.status === 401) {
          navigate("/", { state: { from: location }, replace: true });
        }
      }
    },
  });
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            <Skeleton className="h-[125px] w-full rounded-xl" />
            <Skeleton className="h-[125px] w-full rounded-xl" />
            <Skeleton className="h-[125px] w-full rounded-xl" />
            <Skeleton className="h-[125px] w-full rounded-xl" />
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Loans
                </CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {" "}
                  {loans?.loan_status?.pending?.totalAmount?.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {loans?.loan_status?.pending?.totalCount} Pending Loans
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Loans
                </CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {" "}
                  {loans?.loan_status?.disbursed?.totalAmount?.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {loans?.loan_status?.disbursed?.totalCount} Active Loans
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Overdue Loans
                </CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <path d="M10.29 3.86l-6.8 11.8A1 1 0 0 0 4.2 18h13.6a1 1 0 0 0 .86-1.34l-6.8-11.8a1 1 0 0 0-1.72 0z" />

                  <line x1="12" y1="9" x2="12" y2="13" />
                  <circle cx="12" cy="17" r="1" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {" "}
                  {loans?.loan_status?.overdue?.totalAmount?.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {loans?.loan_status?.overdue?.totalCount} Overdue Loans
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Settled Loans
                </CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {" "}
                  {loans?.loan_status?.settled?.totalAmount?.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {loans?.loan_status?.settled?.totalCount} Settled Loans
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {isLoading ? (
          <>
            <Skeleton className="col-span-4 h-[300px]  rounded-xl" />
            <Skeleton className="col-span-3 h-[300px] rounded-xl" />
          </>
        ) : (
          <>
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Disbursement By Loan Product</CardTitle>
                <Separator />
              </CardHeader>
              <CardContent className="pl-2">
                <DisbursementByLoanProduct
                  loan_products={loans?.loan_products}
                />
              </CardContent>
            </Card>
            <div className="col-span-3">
              <LoansByGenderPieChart loans_gender={loans?.loans_gender} />
            </div>
          </>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {isLoading ? (
          <>
            <Skeleton className="col-span-12 h-[300px]  rounded-xl" />
          </>
        ) : (
          <>
            <Card className="col-span-12">
              <CardHeader>
                <CardTitle>Disbursement vs Settled Loans</CardTitle>
                <Separator />
              </CardHeader>
              <CardContent className="pl-2">
                <LoansTrendBarChart loansTrendData={loans?.loans_trend} />
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  );
};

export default DashboardLoans;

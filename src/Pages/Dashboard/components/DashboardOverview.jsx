import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { RecentTransactions } from "./others/RecentTransactions";
import { useQuery } from "@tanstack/react-query";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { SavingWithdrawsByHour } from "./others/SavingWithdrawsByHour";
import { useNavigate } from "react-router-dom";
const DashboardOverview = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["dashboard-overview-data"],
    queryFn: async () => {
      const fetchURL = `/dashboards/overview`;
      try {
        const response = await axiosPrivate.get(fetchURL);
        return response.data.data;
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
                  Daily Savings
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
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {" "}
                  {parseFloat(transactions?.totalDeposits)?.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {transactions?.transactionDepositCount} Savings Transactions
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Daily Withdraws
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
                  <path d="M5 12h14M12 5l-7 7 7 7" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {" "}
                  {parseFloat(transactions?.totalWithdraws)?.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {transactions?.transactionWithdrawCount?.toLocaleString()}{" "}
                  Withdraw Transactions
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Daily Transfers
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
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {" "}
                  {parseFloat(
                    transactions?.totalTransferAmount
                  )?.toLocaleString()}{" "}
                </div>
                <p className="text-xs text-muted-foreground">
                  {transactions?.transferCount} Transfer Transactions
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Daily Expenses
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
                  <rect width="20" height="14" x="2" y="5" rx="2" />
                  <path d="M2 10h20" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {" "}
                  {parseFloat(transactions?.totalBillAmount)?.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {transactions?.billCount} Expense Transactions
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
                <CardTitle>Daily Savings Vs Withdraws</CardTitle>
                <Separator />
              </CardHeader>
              <CardContent className="pl-2">
                <SavingWithdrawsByHour
                  withdraws={transactions?.withdraws}
                  deposits={transactions?.deposits}
                />
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Recent Savings & Withdraws</CardTitle>
                <Separator />
              </CardHeader>
              <CardContent>
                <RecentTransactions
                  withdraws={transactions?.withdraws}
                  deposits={transactions?.deposits}
                />
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  );
};

export default DashboardOverview;

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { useNavigate } from "react-router-dom";
import { SavingWithdrawsMonths } from "./others/SavingWithdrawsMonths";
import { SavingsWithdrawByGender } from "./others/SavingsWithdrawByGender";
import { IncomeExpenses } from "./others/IncomeExpenses";
const DashboardTransactions = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["dashboard-transactions-data"],
    queryFn: async () => {
      const fetchURL = `/dashboards/transactions`;
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
                <CardTitle className="text-sm font-medium">Savings</CardTitle>
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
                  {transactions?.totalDeposits?.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {transactions?.transactionDepositCount} Savings Transactions
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Withdraws</CardTitle>
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
                  {transactions?.totalWithdraws?.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {transactions?.transactionWithdrawCount?.toLocaleString()}{" "}
                  Withdraw Transactions
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Transfers</CardTitle>
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
                  {transactions?.totalTransferAmount?.toLocaleString()}{" "}
                </div>
                <p className="text-xs text-muted-foreground">
                  {transactions?.transferCount} Transfer Transactions
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expenses</CardTitle>
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
                  {transactions?.totalBillAmount?.toLocaleString()}
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
                <CardTitle>Savings Vs Withdraws</CardTitle>
                <Separator />
              </CardHeader>
              <CardContent className="pl-2">
                <SavingWithdrawsMonths
                  withdraws={transactions?.withdraws}
                  deposits={transactions?.deposits}
                />
              </CardContent>
            </Card>
            <div className="col-span-3">
              <SavingsWithdrawByGender
                withdraws={transactions?.withdraws}
                deposits={transactions?.deposits}
              />
            </div>
          </>
        )}
      </div>
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
                <CardTitle className="text-sm font-medium">Incomes</CardTitle>
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
                  <path d="M12 2v15M8 8l4-4 4 4" />
                  <path d="M6 21h12" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {transactions?.incomeTotal?.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {transactions?.income_transactions?.length} Income
                  Transactions
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Bank Balances
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
                  <path d="M12 22V7M16 18l-4 4-4-4" />
                  <path d="M6 3h12" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {transactions?.bankBalance?.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {/* {transactions?.accountChargesCount?.toLocaleString()} Bank */}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Cash Balances
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
                  <rect x="3" y="3" width="4" height="4" />
                  <rect x="10" y="3" width="4" height="4" />
                  <rect x="17" y="3" width="4" height="4" />
                  <rect x="3" y="10" width="4" height="4" />
                  <rect x="10" y="10" width="4" height="4" />
                  <rect x="17" y="10" width="4" height="4" />
                  <rect x="3" y="17" width="4" height="4" />
                  <rect x="10" y="17" width="4" height="4" />
                  <rect x="17" y="17" width="4" height="4" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {transactions?.cashBalance?.toLocaleString()}{" "}
                </div>
                <p className="text-xs text-muted-foreground">
                  {/* {transactions?.reversed_transaction?.ussd?.coun} USSD
                  Transactions */}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Debit & Credit
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
                  <path d="M3 12a9 9 0 1 1 9 9" />
                  <polyline points="3 12 7 16 3 20" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-xs font-bold">
                  {transactions?.totalDebit?.toLocaleString()}
                  <br /> {transactions?.totalCredit?.toLocaleString()}
                </div>

                <p className="text-xs text-muted-foreground"></p>
              </CardContent>
            </Card>
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
                <CardTitle>Incomes Vs Expenses</CardTitle>
                <Separator />
              </CardHeader>
              <CardContent className="pl-2">
                <IncomeExpenses
                  expenseTransactions={transactions?.expense_transactions}
                  incomeTransactions={transactions?.income_transactions}
                />
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  );
};

export default DashboardTransactions;

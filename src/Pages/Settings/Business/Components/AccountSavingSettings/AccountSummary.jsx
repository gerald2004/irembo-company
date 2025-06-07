/* eslint-disable react/prop-types */
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const AccountSummary = ({
  isLoading,
  isError,
  savingsProduct,
  error,
  accountStats = {},
}) => {
  if (isLoading) {
    return (
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(2)].map((_, index) => (
          <Card key={index} className="shadow-lg rounded-xl">
            <CardHeader className="bg-gray-100 p-4">
              <Skeleton className="h-6 w-1/2 mb-4 rounded" />
              <Skeleton className="h-4 w-1/3 rounded" />
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-4 w-3/4 rounded" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-red-500 text-center font-bold">
        Error: {error.message}
      </div>
    );
  }

  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Savings Product Details */}
      <Card className="shadow-lg rounded-xl">
        <CardHeader className="p-4 rounded-t-xl">
          <CardTitle className="text-xl font-semibold">
            {savingsProduct?.title || "Savings Account"}
          </CardTitle>
          <div className="border-b" />
          <CardDescription className="text-sm capitalize">
            Code: {savingsProduct?.code || "N/A"}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-4 text-sm">
          <p className="flex items-center">
            <span className="w-1/3">Minimal Balance:</span>
            <span>{savingsProduct?.minimal_balance?.toLocaleString() ?? "N/A"}</span>
          </p>
          <p className="flex items-center">
            <span className="w-1/3">Minimal Deposit:</span>
            <span>{savingsProduct?.minimal_deposit?.toLocaleString() ?? "N/A"}</span>
          </p>
          <p className="flex items-center">
            <span className="w-1/3">Maximum Deposit:</span>
            <span>{savingsProduct?.maximum_deposit?.toLocaleString() ?? "N/A"}</span>
          </p>
          <p className="flex items-center">
            <span className="w-1/3">Minimal Withdraw:</span>
            <span>{savingsProduct?.minimal_withdraw?.toLocaleString() ?? "N/A"}</span>
          </p>
          <p className="flex items-center">
            <span className="w-1/3">Maximum Withdraw:</span>
            <span>{savingsProduct?.maximum_withdraw?.toLocaleString() ?? "N/A"}</span>
          </p>
        </CardContent>
      </Card>

      {/* Account Product Status with Dummy Data */}
      <Card className="shadow-lg rounded-xl">
        <CardHeader className="p-4 rounded-t-xl">
          <CardTitle className="text-xl font-semibold">
            Account Product Status
          </CardTitle>
          <div className="border-b" />
        </CardHeader>
        <CardContent className="p-4 space-y-4 text-sm">
          <p className="flex items-center">
            <span className="w-2/3">Total Accounts:</span>
            <span>{accountStats.totalAccounts ?? "0"}</span>
          </p>
          <p className="flex items-center">
            <span className="w-2/3">Active Accounts:</span>
            <span>{accountStats.activeAccounts ?? "0"}</span>
          </p>
          <p className="flex items-center">
            <span className="w-2/3">Dormant Accounts:</span>
            <span>{accountStats.dormantAccounts ?? "0"}</span>
          </p>
          <p className="flex items-center">
            <span className="w-2/3">Closed Accounts:</span>
            <span>{accountStats.closedAccounts ?? "0"}</span>
          </p>
          <p className="flex items-center">
            <span className="w-2/3">Total Deposits:</span>
            <span>{accountStats.totalDeposits ?? "0"}</span>
          </p>
          <p className="flex items-center">
            <span className="w-2/3">Total Withdrawals:</span>
            <span>{accountStats.totalWithdrawals ?? "0"}</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountSummary;

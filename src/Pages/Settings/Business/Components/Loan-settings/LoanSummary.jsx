/* eslint-disable react/prop-types */
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const LoanSummary = ({
  isLoading,
  isError,
  loanProduct,
  error,
  loanStats = [],
}) => {
  if (isLoading) {
    return (
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="shadow-lg rounded-xl">
          <CardHeader className="bg-gray-100 p-4">
            <Skeleton className="h-6 w-1/2 mb-4 rounded" />
            <Skeleton className="h-4 w-1/3 rounded" />
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <Skeleton className="h-4 w-3/4 rounded" />
            <Skeleton className="h-4 w-1/2 rounded" />
            <Skeleton className="h-4 w-full rounded" />
            <Skeleton className="h-4 w-2/3 rounded" />
            <Skeleton className="h-4 w-3/5 rounded" />
            <Skeleton className="h-4 w-1/4 rounded" />
          </CardContent>
        </Card>
        <Card className="shadow-lg rounded-xl">
          <CardHeader className="bg-gray-100 p-4">
            <Skeleton className="h-6 w-1/2 mb-4 rounded" />
            <Skeleton className="h-4 w-1/3 rounded" />
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <Skeleton className="h-4 w-1/2 rounded" />
            <Skeleton className="h-4 w-1/3 rounded" />
            <Skeleton className="h-4 w-1/4 rounded" />
          </CardContent>
        </Card>
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
    <>
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="shadow-lg rounded-xl">
          <CardHeader className="p-4 rounded-t-xl">
            <CardTitle className="text-xl font-semibold">
              {loanProduct.title} 
            </CardTitle>
            <div className="border-b" />
            <CardDescription className="text-sm capitalize">{`Type: ${loanProduct.type}`}</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4 text-sm">
            <p className="flex items-center">
              <span className="w-1/3">Interest Rate:</span>
              <span className="capitalize">{loanProduct.interest_rate}%</span>
            </p>
            <p className="flex items-center">
              <span className="w-1/3">Product Interval:</span>
              <span className="capitalize">{loanProduct.product_interval}</span>
            </p>
            <p className="flex items-center">
              <span className="w-1/3">Penalty Interval:</span>
              <span className="capitalize">{loanProduct.penalty_interval}</span>
            </p>
            <p className="flex items-center">
              <span className="w-1/3">Penalty Value:</span>
              <span className="capitalize">
                {loanProduct.penalty_value}{" "}
                {loanProduct.penalty_mode === "percentage" ? "%" : ""}
              </span>
            </p>
            <p className="flex items-center">
              <span className="w-1/3">Penalty Offset Period:</span>
              <span className="capitalize">
                {loanProduct.penalty_offset_period}{" "}
                {loanProduct.penalty_offset_interval || ""}
              </span>
            </p>
            <p className="flex items-center">
              <span className="w-1/3">Penalty Grace Period:</span>
              <span className="capitalize">
                {loanProduct.penalty_grace_period}{" "}
                {loanProduct.penalty_grace_period_interval}
              </span>
            </p>
            <p className="flex items-center">
              <span className="w-1/3">Last Updated:</span>
              <span>{loanProduct.timestamp}</span>
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-lg rounded-xl">
          <CardHeader className="p-4 rounded-t-xl">
            <CardTitle className="text-xl font-semibold">
              Loan Product Statistics
            </CardTitle>
            <div className="border-b" />
          </CardHeader>
          <CardContent className="p-4 space-y-4 text-sm">
            <p className="flex items-center">
              <span className="w-2/3">Active Loans:</span>
              <span>{loanStats.activeLoans}</span>
            </p>
            <p className="flex items-center">
              <span className="w-2/3">Loans in Arrears:</span>
              <span>{loanStats.loansInArrears}</span>
            </p>
            <p className="flex items-center">
              <span className="w-2/3">Paid Off Loans:</span>
              <span>{loanStats.paidOffLoans}</span>
            </p>
            <p className="flex items-center">
              <span className="w-2/3">Written Off Loans:</span>
              <span>{loanStats.writtenOffLoans}</span>
            </p>
            <p className="flex items-center">
              <span className="w-2/3">Settled Loans:</span>
              <span>{loanStats.settledLoans}</span>
            </p>
            <p className="flex items-center">
              <span className="w-2/3">Defaulted Loans:</span>
              <span>{loanStats.defaultedLoans}</span>
            </p>
            <p className="flex items-center">
              <span className="w-2/3">Locked Loans:</span>
              <span>{loanStats.lockedLoans}</span>
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default LoanSummary;

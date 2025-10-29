/* eslint-disable react/prop-types */
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const LoanSummary = ({ isLoading, isError, loanProduct = {}, error }) => {
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
        Error: {error?.message || "Failed to load loan product"}
      </div>
    );
  }

  // Helpers to keep UI clean even when fields are missing
  const fmt = (v, fallback = "N/A") =>
    v === undefined || v === null || v === "" ? fallback : v;

  const pct = (v) => (v === undefined || v === null ? "N/A" : `${v}%`);

  const penaltyValue =
    loanProduct.penalty_mode === "percentage"
      ? `${fmt(loanProduct.penalty_value, 0)}%`
      : `${fmt(loanProduct.penalty_value, 0)}`;

  const monitoringEnabled =
    Number(loanProduct.monitoring_fee_enabled) === 1 ? "Yes" : "No";

  const monitoringType =
    loanProduct.monitoring_fee_type === "fixed"
      ? "Fixed"
      : loanProduct.monitoring_fee_type === "percent"
      ? "Percentage"
      : "N/A";

  const monitoringValue =
    loanProduct.monitoring_fee_type === "percent"
      ? pct(loanProduct.monitoring_fee_value)
      : fmt(loanProduct.monitoring_fee_value);

  const monitoringBase = fmt(loanProduct.monitoring_fee_base, "principal");

  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Left: Core product details */}
      <Card className="shadow-lg rounded-xl">
        <CardHeader className="p-4 rounded-t-xl">
          <CardTitle className="text-xl font-semibold">
            {fmt(loanProduct.title)}
          </CardTitle>
          <div className="border-b" />
          <CardDescription className="text-sm capitalize">
            {`Type: ${fmt(loanProduct.type).toString()}`}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4 space-y-4 text-sm">
          <p className="flex items-center">
            <span className="w-1/3">Interest Rate:</span>
            <span className="capitalize">{pct(loanProduct.interest_rate)}</span>
          </p>

          <p className="flex items-center">
            <span className="w-1/3">Product Interval:</span>
            <span className="capitalize">
              {fmt(loanProduct.product_interval)}
            </span>
          </p>

          <div className="border-t my-2" />

          <p className="flex items-center">
            <span className="w-1/3">Penalty Interval:</span>
            <span className="capitalize">
              {fmt(loanProduct.penalty_interval)}
            </span>
          </p>

          <p className="flex items-center">
            <span className="w-1/3">Penalty Value:</span>
            <span className="capitalize">{penaltyValue}</span>
          </p>

          <p className="flex items-center">
            <span className="w-1/3">Penalty Offset:</span>
            <span className="capitalize">
              {fmt(loanProduct.penalty_offset_period, 0)}{" "}
              {fmt(loanProduct.penalty_offset_interval, "")}
            </span>
          </p>

          <p className="flex items-center">
            <span className="w-1/3">Penalty Grace:</span>
            <span className="capitalize">
              {fmt(loanProduct.penalty_grace_period, 0)}{" "}
              {fmt(loanProduct.penalty_grace_period_interval, "")}
            </span>
          </p>

          <div className="border-t my-2" />

          <p className="flex items-center">
            <span className="w-1/3">Last Updated:</span>
            <span>{fmt(loanProduct.onUpdate || loanProduct.timestamp)}</span>
          </p>
        </CardContent>
      </Card>

      {/* Right: Monitoring & policy (replaces “Loan Product Statistics”) */}
      <Card className="shadow-lg rounded-xl">
        <CardHeader className="p-4 rounded-t-xl">
          <CardTitle className="text-xl font-semibold">
            Monitoring & Policy
          </CardTitle>
          <div className="border-b" />
          <CardDescription className="text-sm">
            Product-level oversight and fee configuration
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4 space-y-4 text-sm">
          <p className="flex items-center">
            <span className="w-2/3">Monitoring Fee Enabled:</span>
            <span>{monitoringEnabled}</span>
          </p>

          <p className="flex items-center">
            <span className="w-2/3">Monitoring Fee Type:</span>
            <span>{monitoringType}</span>
          </p>

          <p className="flex items-center">
            <span className="w-2/3">Monitoring Fee Value:</span>
            <span>{monitoringEnabled === "Yes" ? monitoringValue : "N/A"}</span>
          </p>

          <p className="flex items-center">
            <span className="w-2/3">Monitoring Fee Base:</span>
            <span className="capitalize">
              {monitoringEnabled === "Yes" ? monitoringBase : "N/A"}
            </span>
          </p>

          <div className="border-t my-2" />

          <p className="flex items-center">
            <span className="w-2/3">Penalty Grace Policy:</span>
            <span className="capitalize">
              {fmt(loanProduct.penalty_grace_period, 0)}{" "}
              {fmt(loanProduct.penalty_grace_period_interval, "")}
            </span>
          </p>

          <p className="flex items-center">
            <span className="w-2/3">Penalty Offset Policy:</span>
            <span className="capitalize">
              {fmt(loanProduct.penalty_offset_period, 0)}{" "}
              {fmt(loanProduct.penalty_offset_interval, "")}
            </span>
          </p>

          <div className="border-t my-2" />

        </CardContent>
      </Card>
    </div>
  );
};

export default LoanSummary;

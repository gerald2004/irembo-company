/* eslint-disable react/prop-types */
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, AlertTriangle, CheckCircle } from "lucide-react";

const currency = (n) => Number(n || 0).toLocaleString();

const getHealthConfig = (isMonthly, acc) => {
  if (isMonthly) {
    const units = Number(acc.email_units || 0);
    if (units > 100) {
      return {
        color: "bg-green-500",
        trackColor: "bg-green-100",
        badgeClass: "bg-green-100 text-green-800 border-green-200",
        label: "Healthy",
        icon: CheckCircle,
        iconClass: "text-green-500",
        borderClass: "border-l-4 border-l-green-500",
      };
    }
    if (units >= 50) {
      return {
        color: "bg-yellow-400",
        trackColor: "bg-yellow-100",
        badgeClass: "bg-yellow-100 text-yellow-800 border-yellow-200",
        label: "Low",
        icon: AlertTriangle,
        iconClass: "text-yellow-500",
        borderClass: "border-l-4 border-l-yellow-400",
      };
    }
    return {
      color: "bg-red-500",
      trackColor: "bg-red-100",
      badgeClass: "bg-red-100 text-red-800 border-red-200",
      label: "Critical",
      icon: AlertTriangle,
      iconClass: "text-red-500",
      borderClass: "border-l-4 border-l-red-500",
    };
  }

  const value = Number(acc.value || 0);
  if (value < 500) {
    return {
      badgeClass: "bg-green-100 text-green-800 border-green-200",
      label: "Healthy",
      icon: CheckCircle,
      iconClass: "text-green-500",
      borderClass: "border-l-4 border-l-green-500",
    };
  }
  if (value <= 2000) {
    return {
      badgeClass: "bg-yellow-100 text-yellow-800 border-yellow-200",
      label: "Moderate",
      icon: AlertTriangle,
      iconClass: "text-yellow-500",
      borderClass: "border-l-4 border-l-yellow-400",
    };
  }
  return {
    badgeClass: "bg-red-100 text-red-800 border-red-200",
    label: "High Debt",
    icon: AlertTriangle,
    iconClass: "text-red-500",
    borderClass: "border-l-4 border-l-red-500",
  };
};

const EmailAccountCard = ({ acc, onView }) => {
  const isMonthly = acc.billing_type === "monthly";
  const health = getHealthConfig(isMonthly, acc);
  const HealthIcon = health.icon;

  const units = Number(acc.email_units || 0);
  const allowance = Number(acc.monthly_allowance || 250);
  const maxUnits = Math.max(allowance, 1);
  const progressPct = isMonthly ? Math.min((units / maxUnits) * 100, 100) : 0;

  return (
    <Card className={`flex flex-col overflow-hidden ${health.borderClass}`}>
      <CardHeader className="space-y-2 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-primary/10 p-1.5">
              <Mail className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-base">{acc.name}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isMonthly ? "default" : "secondary"}>
              {isMonthly ? "Monthly" : "Overage"}
            </Badge>
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${health.badgeClass}`}>
              <HealthIcon className={`h-3 w-3 ${health.iconClass}`} />
              {health.label}
            </span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          {isMonthly ? (
            <>
              Allowance:{" "}
              <span className="font-medium">{allowance} / month</span>
            </>
          ) : (
            <>
              Charge/Email:{" "}
              <span className="font-medium">{currency(acc.charge_per_email)}</span>
            </>
          )}
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        <div>
          <div className="text-2xl font-bold">
            {isMonthly ? (
              <>{currency(units)} Emails Remaining</>
            ) : (
              <>UGX {currency(acc.value)}</>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isMonthly
              ? `Out of ${allowance}`
              : `${currency(units)} Unpaid Emails`}
          </p>
          {!isMonthly && (
            <p className="text-xs text-muted-foreground">
              ({currency(acc.charge_per_email)} × {units})
            </p>
          )}
        </div>

        {isMonthly && (
          <div className="space-y-1">
            <div className={`h-2 w-full rounded-full ${health.trackColor}`}>
              <div
                className={`h-2 rounded-full transition-all ${health.color}`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          {acc.transactions ?? 0} Transactions
        </p>

        <Button size="sm" variant="outline" onClick={onView} className="w-full">
          View Transactions →
        </Button>
      </CardContent>
    </Card>
  );
};

const EmailFloat = ({ branchId }) => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["email-float", branchId ?? "all"],
    queryFn: async () => {
      const res = await axiosPrivate.get("/float-management/email-float", {
        params: branchId ? { branch_id: branchId } : undefined,
      });
      return res.data.data;
    },
    retry: (failureCount, err) => {
      const status = err?.response?.status;
      if (status === 404) return false;
      return failureCount < 2;
    },
  });

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading email float…</div>;
  }

  const status = error?.response?.status;

  if (status === 404) {
    return (
      <div className="text-sm text-muted-foreground">
        No email accounts configured for your branch.
      </div>
    );
  }

  if (isError) {
    return <div className="text-sm text-red-600">Failed to load email float</div>;
  }

  const accounts = data?.accounts || [];

  if (accounts.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No email accounts configured yet.
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
      {accounts.map((acc) => (
        <EmailAccountCard
          key={acc.email_account_id}
          acc={acc}
          onView={() => navigate(`/email-float-management/${acc.email_account_id}`)}
        />
      ))}
    </div>
  );
};

export default EmailFloat;

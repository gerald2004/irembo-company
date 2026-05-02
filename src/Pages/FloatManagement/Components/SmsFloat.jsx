/* eslint-disable react/prop-types */
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, AlertTriangle, CheckCircle } from "lucide-react";

const currency = (n) => Number(n || 0).toLocaleString();

const getHealthConfig = (units) => {
  if (units > 500) {
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
  if (units >= 100) {
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
};

const SmsAccountCard = ({ acc, onView }) => {
  const isPostpaid = acc.billing_type === "postpaid";
  const units = Number(acc.sms_units || 0);
  const health = getHealthConfig(isPostpaid ? Infinity : units);
  const HealthIcon = health.icon;

  const maxUnits = Math.max(units + (Number(acc.reserved_sms) || 0), 1000);
  const progressPct = isPostpaid ? 0 : Math.min((units / maxUnits) * 100, 100);

  return (
    <Card className={`flex flex-col overflow-hidden ${health.borderClass}`}>
      <CardHeader className="space-y-2 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-primary/10 p-1.5">
              <MessageSquare className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-base">{acc.name}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isPostpaid ? "secondary" : "default"}>
              {isPostpaid ? "Postpaid" : "Prepaid"}
            </Badge>
            {!isPostpaid && (
              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${health.badgeClass}`}>
                <HealthIcon className={`h-3 w-3 ${health.iconClass}`} />
                {health.label}
              </span>
            )}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Charge/SMS:{" "}
          <span className="font-medium">{currency(acc.charge_per_sms)}</span>
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        <div>
          <div className="text-2xl font-bold">{currency(acc.value)}</div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {currency(units)}{" "}
            {isPostpaid ? "Messages Unpaid" : "Messages Available"}
          </p>
        </div>

        {!isPostpaid && (
          <div className="space-y-1">
            <div className={`h-2 w-full rounded-full ${health.trackColor}`}>
              <div
                className={`h-2 rounded-full transition-all ${health.color}`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Reserved: {currency(acc.reserved_sms)} SMS ({currency(acc.reserved_value)})
            </p>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          {acc.transactions ?? 0} Transactions
        </p>

        <Button size="sm" variant="outline" onClick={onView} className="w-full">
          View Transactions
        </Button>
      </CardContent>
    </Card>
  );
};

const SmsFloat = ({ branchId }) => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["sms-float", branchId ?? "all"],
    queryFn: async () => {
      const res = await axiosPrivate.get("/float-management/sms-float", {
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
    return <div className="text-sm text-muted-foreground">Loading SMS float…</div>;
  }

  const status = error?.response?.status;

  if (status === 404) {
    return (
      <div className="text-sm text-muted-foreground">
        No SMS accounts configured for your branch.
      </div>
    );
  }

  if (isError) {
    return <div className="text-sm text-red-600">Failed to load SMS float</div>;
  }

  const accounts = data?.accounts || [];
  const summary = data?.summary;

  if (accounts.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No SMS accounts configured yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {summary && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Total Prepaid
            </p>
            <p className="mt-1 text-2xl font-bold">
              {currency(summary.prepaid?.sms_units ?? 0)}
              <span className="ml-1 text-sm font-normal text-muted-foreground">units</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {currency(summary.prepaid?.value ?? 0)} value
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Total Postpaid
            </p>
            <p className="mt-1 text-2xl font-bold">
              {currency(summary.postpaid?.sms_units ?? 0)}
              <span className="ml-1 text-sm font-normal text-muted-foreground">units</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {currency(summary.postpaid?.value ?? 0)} value
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        {accounts.map((acc) => (
          <SmsAccountCard
            key={acc.sms_account_id}
            acc={acc}
            onView={() => navigate(`/sms-float-management/${acc.sms_account_id}`)}
          />
        ))}
      </div>
    </div>
  );
};

export default SmsFloat;

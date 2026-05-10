/* eslint-disable react/prop-types */
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, AlertTriangle, CheckCircle } from "lucide-react";

const currency = (n) => Number(n || 0).toLocaleString();

const getPrepaidHealth = (units) => {
  if (units > 500) return {
    bar: "bg-green-500", track: "bg-green-100",
    badge: "bg-green-100 text-green-800 border-green-200",
    label: "Healthy", Icon: CheckCircle, icon: "text-green-500",
    border: "border-l-4 border-l-green-500",
  };
  if (units >= 100) return {
    bar: "bg-yellow-400", track: "bg-yellow-100",
    badge: "bg-yellow-100 text-yellow-800 border-yellow-200",
    label: "Low", Icon: AlertTriangle, icon: "text-yellow-500",
    border: "border-l-4 border-l-yellow-400",
  };
  return {
    bar: "bg-red-500", track: "bg-red-100",
    badge: "bg-red-100 text-red-800 border-red-200",
    label: "Critical", Icon: AlertTriangle, icon: "text-red-500",
    border: "border-l-4 border-l-red-500",
  };
};

const getPostpaidHealth = (due, limit) => {
  if (!limit || limit <= 0) return {
    badge: "bg-blue-100 text-blue-800 border-blue-200",
    label: "Active", Icon: CheckCircle, icon: "text-blue-500",
    border: "border-l-4 border-l-blue-400",
  };
  const pct = (due / limit) * 100;
  if (pct < 60) return {
    badge: "bg-green-100 text-green-800 border-green-200",
    label: "Within Limit", Icon: CheckCircle, icon: "text-green-500",
    border: "border-l-4 border-l-green-500",
  };
  if (pct < 90) return {
    badge: "bg-yellow-100 text-yellow-800 border-yellow-200",
    label: "Near Limit", Icon: AlertTriangle, icon: "text-yellow-500",
    border: "border-l-4 border-l-yellow-400",
  };
  return {
    badge: "bg-red-100 text-red-800 border-red-200",
    label: "Over Limit", Icon: AlertTriangle, icon: "text-red-500",
    border: "border-l-4 border-l-red-500",
  };
};

const SmsAccountCard = ({ acc, onView }) => {
  const isPostpaid = acc.billing_type === "postpaid";

  if (isPostpaid) {
    const due    = Number(acc.current_due ?? acc.value ?? 0);
    const limit  = Number(acc.credit_limit ?? 0);
    const sent   = Number(acc.sms_units ?? 0);
    const health = getPostpaidHealth(due, limit);
    const { Icon } = health;

    return (
      <Card className={`flex flex-col overflow-hidden ${health.border}`}>
        <CardHeader className="space-y-2 pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="rounded-md bg-primary/10 p-1.5">
                <MessageSquare className="h-4 w-4 text-primary" />
              </div>
              <CardTitle className="text-base">{acc.name}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Postpaid</Badge>
              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${health.badge}`}>
                <Icon className={`h-3 w-3 ${health.icon}`} />
                {health.label}
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Charge/SMS: <span className="font-medium">{currency(acc.charge_per_sms)}</span>
            {limit > 0 && (
              <> &nbsp;·&nbsp; Credit limit: <span className="font-medium">{currency(limit)}</span></>
            )}
          </p>
        </CardHeader>

        <CardContent className="space-y-3">
          <div>
            <div className="text-2xl font-bold">UGX {currency(due)}</div>
            <p className="text-sm text-muted-foreground mt-0.5">Current outstanding balance</p>
          </div>

          {limit > 0 && (
            <div className="space-y-1">
              <div className="h-2 w-full rounded-full bg-muted">
                <div
                  className={`h-2 rounded-full transition-all ${health.bar ?? "bg-blue-400"}`}
                  style={{ width: `${Math.min((due / limit) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {currency(due)} / {currency(limit)} limit
              </p>
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            {currency(sent)} messages sent &nbsp;·&nbsp; {acc.transactions ?? 0} transactions
          </p>

          <Button size="sm" variant="outline" onClick={onView} className="w-full">
            View Transactions
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ── Prepaid card ────────────────────────────────────────────────────────────
  const units    = Number(acc.sms_units ?? 0);
  const reserved = Number(acc.reserved_sms ?? 0);
  const health   = getPrepaidHealth(units);
  const { Icon } = health;
  const maxUnits = Math.max(units + reserved, 1000);
  const pct      = Math.min((units / maxUnits) * 100, 100);

  return (
    <Card className={`flex flex-col overflow-hidden ${health.border}`}>
      <CardHeader className="space-y-2 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-primary/10 p-1.5">
              <MessageSquare className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-base">{acc.name}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="default">Prepaid</Badge>
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${health.badge}`}>
              <Icon className={`h-3 w-3 ${health.icon}`} />
              {health.label}
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Charge/SMS: <span className="font-medium">{currency(acc.charge_per_sms)}</span>
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        <div>
          <div className="text-2xl font-bold">
            {currency(units)}
            <span className="ml-1 text-sm font-normal text-muted-foreground">SMS available</span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Value: UGX {currency(acc.value)}
          </p>
        </div>

        <div className="space-y-1">
          <div className={`h-2 w-full rounded-full ${health.track}`}>
            <div
              className={`h-2 rounded-full transition-all ${health.bar}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          {reserved > 0 && (
            <p className="text-xs text-muted-foreground">
              Reserved: {currency(reserved)} SMS (UGX {currency(acc.reserved_value)})
            </p>
          )}
        </div>

        <p className="text-xs text-muted-foreground">{acc.transactions ?? 0} transactions</p>

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
      if (err?.response?.status === 404) return false;
      return failureCount < 2;
    },
  });

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading SMS float…</div>;
  if (error?.response?.status === 404) return <div className="text-sm text-muted-foreground">No SMS accounts configured for your branch.</div>;
  if (isError) return <div className="text-sm text-red-600">Failed to load SMS float</div>;

  const accounts = data?.accounts || [];
  const summary  = data?.summary;

  if (accounts.length === 0) return <div className="text-sm text-muted-foreground">No SMS accounts configured yet.</div>;

  return (
    <div className="space-y-6">
      {summary && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total Prepaid</p>
            <p className="mt-1 text-2xl font-bold">
              {currency(summary.prepaid?.sms_units ?? 0)}
              <span className="ml-1 text-sm font-normal text-muted-foreground">SMS remaining</span>
            </p>
            <p className="text-xs text-muted-foreground">UGX {currency(summary.prepaid?.value ?? 0)} value</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total Postpaid</p>
            <p className="mt-1 text-2xl font-bold">
              UGX {currency(summary.postpaid?.current_due ?? 0)}
            </p>
            <p className="text-xs text-muted-foreground">{currency(summary.postpaid?.sms_units ?? 0)} messages sent</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
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

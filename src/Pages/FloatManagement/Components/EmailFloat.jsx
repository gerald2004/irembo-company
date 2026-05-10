/* eslint-disable react/prop-types */
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, AlertTriangle, CheckCircle } from "lucide-react";

const currency = (n) => Number(n || 0).toLocaleString();

const getMonthlyHealth = (available, allowance) => {
  const pct = allowance > 0 ? (available / allowance) * 100 : 0;
  if (pct > 40) return {
    bar: "bg-green-500", track: "bg-green-100",
    badge: "bg-green-100 text-green-800 border-green-200",
    label: "Healthy", Icon: CheckCircle, icon: "text-green-500",
    border: "border-l-4 border-l-green-500",
  };
  if (pct > 15) return {
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

const EmailAccountCard = ({ acc, onView }) => {
  const isMonthly = acc.billing_type === "monthly";

  if (isMonthly) {
    const available = Number(acc.email_units ?? 0);
    const allowance = Number(acc.monthly_allowance ?? 250);
    const health    = getMonthlyHealth(available, allowance);
    const { Icon } = health;
    const pct = allowance > 0 ? Math.min((available / allowance) * 100, 100) : 0;

    return (
      <Card className={`flex flex-col overflow-hidden ${health.border}`}>
        <CardHeader className="space-y-2 pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="rounded-md bg-primary/10 p-1.5">
                <Mail className="h-4 w-4 text-primary" />
              </div>
              <CardTitle className="text-base">{acc.name}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default">Monthly</Badge>
              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${health.badge}`}>
                <Icon className={`h-3 w-3 ${health.icon}`} />
                {health.label}
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Allowance: <span className="font-medium">{currency(allowance)} / month</span>
          </p>
        </CardHeader>

        <CardContent className="space-y-3">
          <div>
            <div className="text-2xl font-bold">
              {currency(available)}
              <span className="ml-1 text-sm font-normal text-muted-foreground">emails remaining</span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {currency(allowance - available)} used of {currency(allowance)}
            </p>
          </div>

          <div className="space-y-1">
            <div className={`h-2 w-full rounded-full ${health.track}`}>
              <div
                className={`h-2 rounded-full transition-all ${health.bar}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">{acc.transactions ?? 0} transactions</p>

          <Button size="sm" variant="outline" onClick={onView} className="w-full">
            View Transactions
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ── Postpaid card ───────────────────────────────────────────────────────────
  const sent  = Number(acc.email_units ?? 0);
  const due   = Number(acc.value ?? 0);

  return (
    <Card className="flex flex-col overflow-hidden border-l-4 border-l-blue-400">
      <CardHeader className="space-y-2 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-primary/10 p-1.5">
              <Mail className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-base">{acc.name}</CardTitle>
          </div>
          <Badge variant="secondary">Postpaid</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Charge/Email: <span className="font-medium">{currency(acc.charge_per_email)}</span>
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        <div>
          <div className="text-2xl font-bold">UGX {currency(due)}</div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {currency(sent)} emails sent
          </p>
        </div>

        <p className="text-xs text-muted-foreground">{acc.transactions ?? 0} transactions</p>

        <Button size="sm" variant="outline" onClick={onView} className="w-full">
          View Transactions
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
      if (err?.response?.status === 404) return false;
      return failureCount < 2;
    },
  });

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading email float…</div>;
  if (error?.response?.status === 404) return <div className="text-sm text-muted-foreground">No email accounts configured for your branch.</div>;
  if (isError) return <div className="text-sm text-red-600">Failed to load email float</div>;

  const accounts = data?.accounts || [];

  if (accounts.length === 0) return <div className="text-sm text-muted-foreground">No email accounts configured yet.</div>;

  return (
    <div className="grid gap-6 md:grid-cols-2">
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

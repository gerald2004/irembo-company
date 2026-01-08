/* eslint-disable react/prop-types */
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail } from "lucide-react";

const currency = (n) => Number(n || 0).toLocaleString();

const SmsAccountCard = ({ acc, onView }) => {
  const isPostpaid = acc.billing_type === "postpaid";

  return (
    <Card className="flex flex-col">
      <CardHeader className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{acc.name}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={isPostpaid ? "secondary" : "default"}>
              {isPostpaid ? "Postpaid" : "Prepaid"}
            </Badge>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Charge/SMS:{" "}
          <span className="font-medium">
            {currency(acc.charge_per_sms)}
          </span>
        </p>
      </CardHeader>

      <CardContent className="space-y-2">
        <div className="text-xl font-bold">{currency(acc.value)}</div>

        <p className="text-sm text-muted-foreground">
          {acc.sms_units}{" "}
          {isPostpaid ? "Messages Unpaid" : "Messages Available"}
        </p>

        {!isPostpaid ? (
          <p className="text-xs text-muted-foreground">
            Reserved: {acc.reserved_sms} SMS ({currency(acc.reserved_value)}
            )
          </p>
        ) : null}

        <p className="text-xs text-muted-foreground">
          {acc.transactions ?? 0} Transactions
        </p>

        <Button size="sm" onClick={onView}>
          View transactions
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
      return res.data.data; // { accounts: [...] }
    },
    retry: (failureCount, err) => {
      const status = err?.response?.status;
      if (status === 404) return false;
      return failureCount < 2;
    },
  });

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground">Loading SMS float…</div>
    );
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

  if (accounts.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No SMS accounts configured yet.
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
      {accounts.map((acc) => (
        <SmsAccountCard
          key={acc.sms_account_id}
          acc={acc}
          onView={() => navigate(`/sms-float-management/${acc.sms_account_id}`)}
        />
      ))}
    </div>
  );
};

export default SmsFloat;

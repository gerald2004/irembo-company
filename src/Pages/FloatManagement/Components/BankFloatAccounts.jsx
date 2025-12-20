/* eslint-disable react/prop-types */
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const currency = (n) => Number(n || 0).toLocaleString();

const BankCard = ({ title, subtitle, data, onView }) => {
  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-base">{title}</CardTitle>
        {subtitle ? (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-2">
        <div className="text-xl font-bold text-green-700">
          UGX {currency(data?.available)}
        </div>

        <p className="text-xs text-muted-foreground">
          Reserved: UGX {currency(data?.reserved)}
        </p>

        <p className="text-sm text-muted-foreground">
          {data?.transactions ?? 0} Transactions
        </p>

        <Button size="sm" disabled={!data} onClick={onView}>
          View details
        </Button>
      </CardContent>
    </Card>
  );
};

const BankFloatAccounts = ({ branchId }) => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();

  const {
    data,
    isLoading,
    isError,
    error, // axios error
  } = useQuery({
    queryKey: ["bank-float-accounts", branchId ?? "all"],
    queryFn: async () => {
      const res = await axiosPrivate.get("/float-management/bank-accounts", {
        params: branchId ? { branch_id: branchId } : undefined,
      });
      return res.data.data; // { accounts: [...] }
    },
    retry: (failureCount, err) => {
      // don't retry 404
      const status = err?.response?.status;
      if (status === 404) return false;
      return failureCount < 2;
    },
  });

  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground">
        Loading bank float accounts…
      </div>
    );
  }

  // ✅ Special handling: 404 means no accounts
  const status = error?.response?.status;
  if (status === 404) {
    return (
      <div className="text-sm text-muted-foreground">
        No bank accounts configured for your branch.
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-sm text-red-600">
        Failed to load bank float accounts
      </div>
    );
  }

  const accounts = data?.accounts || [];

  if (accounts.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No bank accounts configured yet.
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {accounts.map((acc) => (
        <BankCard
          key={acc.bank_account_id}
          title={acc.bank_name || "Bank"}
          subtitle={`${acc.account_name} • ${acc.account_number}`}
          data={acc}
          onView={() =>
            navigate(`/float-management/bank/${acc.bank_account_id}`)
          }
        />
      ))}
    </div>
  );
};

export default BankFloatAccounts;

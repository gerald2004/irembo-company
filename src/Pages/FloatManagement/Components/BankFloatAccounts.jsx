/* eslint-disable react/prop-types */
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Banknote } from "lucide-react";

const currency = (n) => Number(n || 0).toLocaleString();

const getBorderClass = (acc) => {
  const available = Number(acc?.available || 0);
  const reserved = Number(acc?.reserved || 0);
  if (available > 0) return "border-t-4 border-t-green-500";
  if (reserved > 0 && available < 1000) return "border-t-4 border-t-yellow-400";
  return "border-t-4 border-t-gray-200";
};

const BankCard = ({ acc, onView }) => {
  const borderClass = getBorderClass(acc);

  return (
    <Card className={`overflow-hidden ${borderClass}`}>
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="rounded-md bg-primary/10 p-1.5">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <CardTitle className="text-base">{acc.bank_name || "Bank"}</CardTitle>
        </div>
        <p className="text-xs text-muted-foreground">{acc.account_name}</p>
        <p className="text-xs text-muted-foreground font-mono">{acc.account_number}</p>
      </CardHeader>

      <CardContent className="space-y-2">
        <div className="flex items-center gap-2">
          <Banknote className="h-4 w-4 text-green-600" />
          <div className="text-xl font-bold text-green-700">
            {currency(acc?.available)}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Reserved: {currency(acc?.reserved)}
        </p>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {acc?.transactions ?? 0} Transactions
          </Badge>
        </div>

        <Button size="sm" disabled={!acc} onClick={onView}>
          View Transactions →
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
    error,
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

  // Special handling: 404 means no accounts
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
          acc={acc}
          onView={() =>
            navigate(`/float-management/bank/${acc.bank_account_id}`)
          }
        />
      ))}
    </div>
  );
};

export default BankFloatAccounts;

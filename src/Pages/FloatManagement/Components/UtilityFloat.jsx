/* eslint-disable react/prop-types */
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const currency = (n) => Number(n || 0).toLocaleString();

const UtilityCard = ({ acc, onView }) => {
  const isPostpaid = acc.billing_type === "postpaid";

  return (
    <Card className="flex flex-col">
      <CardHeader className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{acc.name}</CardTitle>
          <Badge variant={isPostpaid ? "secondary" : "default"}>
            {isPostpaid ? "Postpaid" : "Prepaid"}
          </Badge>
        </div>

        <p className="text-xs text-muted-foreground">
          {acc.utility_type?.toUpperCase?.() || "UTILITY"} • Fee:{" "}
          <span className="font-medium">{acc.fee_label}</span>
        </p>
      </CardHeader>

      <CardContent className="space-y-2">
        <div className="text-xl font-bold">UGX {currency(acc.available)}</div>

        <p className="text-xs text-muted-foreground">
          Reserved: UGX {currency(acc.reserved)}
        </p>

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

const UtilitiesFloat = ({ branchId }) => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["utilities-float", branchId ?? "all"],
    queryFn: async () => {
      const res = await axiosPrivate.get("/float-management/utilities-float", {
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

  if (isLoading)
    return (
      <div className="text-sm text-muted-foreground">
        Loading utilities float…
      </div>
    );

  const status = error?.response?.status;
  if (status === 404) {
    return (
      <div className="text-sm text-muted-foreground">
        No utility accounts configured for your branch.
      </div>
    );
  }

  if (isError)
    return (
      <div className="text-sm text-red-600">Failed to load utilities float</div>
    );

  const accounts = data?.accounts || [];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
      {accounts.map((acc) => (
        <UtilityCard
          key={acc.utility_account_id}
          acc={acc}
          onView={() =>
            navigate(`/utilities-float-management/${acc.utility_account_id}`)
          }
        />
      ))}
    </div>
  );
};

export default UtilitiesFloat;

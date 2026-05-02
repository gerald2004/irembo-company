/* eslint-disable react/prop-types */
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, AlertTriangle, CheckCircle, DollarSign } from "lucide-react";

const currency = (n) => Number(n || 0).toLocaleString();

const getWalletHealth = (available) => {
  const amount = Number(available || 0);
  if (amount > 10000) {
    return {
      badgeClass: "bg-green-100 text-green-800 border-green-200",
      label: "Healthy",
      icon: CheckCircle,
      iconClass: "text-green-500",
      borderClass: "border-l-4 border-l-green-500",
    };
  }
  if (amount >= 1000) {
    return {
      badgeClass: "bg-yellow-100 text-yellow-800 border-yellow-200",
      label: "Low",
      icon: AlertTriangle,
      iconClass: "text-yellow-500",
      borderClass: "border-l-4 border-l-yellow-400",
    };
  }
  return {
    badgeClass: "bg-red-100 text-red-800 border-red-200",
    label: "Critical",
    icon: AlertTriangle,
    iconClass: "text-red-500",
    borderClass: "border-l-4 border-l-red-500",
  };
};

const ProductCard = ({ p, onView }) => {
  return (
    <Card className="flex flex-col">
      <CardHeader className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-primary/10 p-1.5">
              <CreditCard className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-base">{p.name}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {p.is_free ? <Badge variant="secondary" className="text-green-700">Free</Badge> : null}
            {p.is_overridden ? <Badge variant="outline">Custom</Badge> : null}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Code:{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">{p.code}</code>
        </p>
      </CardHeader>

      <CardContent className="space-y-2">
        <div className="text-xl font-bold">
          {p.is_free && Number(p.unit_price) === 0 ? (
            <span className="text-green-600">FREE</span>
          ) : (
            <>UGX {currency(p.unit_price)}</>
          )}
        </div>

        <Button size="sm" onClick={onView}>
          View transactions →
        </Button>
      </CardContent>
    </Card>
  );
};

const CrbFloat = ({ branchId }) => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["crb-float", branchId ?? "all"],
    queryFn: async () => {
      const res = await axiosPrivate.get("/float-management/crb-float", {
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

  if (isLoading)
    return <div className="text-sm text-muted-foreground">Loading CRB float…</div>;

  const status = error?.response?.status;
  if (status === 404) {
    return (
      <div className="text-sm text-muted-foreground">
        No CRB accounts configured for your branch.
      </div>
    );
  }

  if (isError)
    return <div className="text-sm text-red-600">Failed to load CRB float</div>;

  const accounts = data?.accounts || [];
  const products = data?.products || [];

  const acc = accounts[0];
  const walletHealth = acc ? getWalletHealth(acc.available) : null;
  const WalletIcon = walletHealth?.icon;

  return (
    <div className="space-y-6">
      {acc ? (
        <Card className={`overflow-hidden ${walletHealth.borderClass}`}>
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="rounded-md bg-primary/10 p-1.5">
                  <DollarSign className="h-4 w-4 text-primary" />
                </div>
                <CardTitle>{acc.name}</CardTitle>
              </div>
              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${walletHealth.badgeClass}`}>
                <WalletIcon className={`h-3 w-3 ${walletHealth.iconClass}`} />
                {walletHealth.label}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-2xl font-bold">
                UGX {currency(acc.available)}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Reserved: UGX {currency(acc.reserved)}
              </p>
              <p className="text-xs text-muted-foreground">
                {acc.transactions ?? 0} Transactions
              </p>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/crb-float-management/${acc.crb_account_id}`)}
            >
              View all transactions →
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <ProductCard
            key={p.product_id}
            p={p}
            onView={() =>
              navigate(`/crb-float-management/${acc.crb_account_id}?product=${p.code}`)
            }
          />
        ))}
      </div>
    </div>
  );
};

export default CrbFloat;

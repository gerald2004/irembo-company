/* eslint-disable react/prop-types */
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const currency = (n) => Number(n || 0).toLocaleString();

const ProductCard = ({ p, onView }) => {
  return (
    <Card className="flex flex-col">
      <CardHeader className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{p.name}</CardTitle>
          <div className="flex items-center gap-2">
            {p.is_free ? <Badge variant="secondary">Free</Badge> : null}
            {p.is_overridden ? <Badge variant="outline">Custom</Badge> : null}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Code: {p.code}</p>
      </CardHeader>

      <CardContent className="space-y-2">
        <div className="text-xl font-bold">
          {p.is_free && Number(p.unit_price) === 0
            ? "FREE"
            : `UGX ${currency(p.unit_price)}`}
        </div>

        <Button size="sm" onClick={onView}>
          View transactions
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
      return res.data.data; // { accounts, products }
    },
    retry: (failureCount, err) => {
      const status = err?.response?.status;
      if (status === 404) return false;
      return failureCount < 2;
    },
  });

  if (isLoading)
    return (
      <div className="text-sm text-muted-foreground">Loading CRB float…</div>
    );

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

  const acc = accounts[0]; // typically 1 account

  return (
    <div className="space-y-6">
      {/* Wallet */}
      {acc ? (
        <Card>
          <CardHeader>
            <CardTitle>{acc.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold">
              UGX {currency(acc.available)}
            </div>
            <p className="text-xs text-muted-foreground">
              Reserved: UGX {currency(acc.reserved)}
            </p>
            <p className="text-xs text-muted-foreground">
              {acc.transactions ?? 0} Transactions
            </p>

            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                navigate(`/crb-float-management/${acc.crb_account_id}`)
              }
            >
              View all transactions
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* Products */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <ProductCard
            key={p.product_id}
            p={p}
            onView={() =>
              navigate(
                `/crb-float-management/${acc.crb_account_id}?product=${p.code}`
              )
            }
          />
        ))}
      </div>
    </div>
  );
};

export default CrbFloat;

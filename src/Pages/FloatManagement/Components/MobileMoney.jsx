/* eslint-disable react/prop-types */
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const currency = (n) => Number(n || 0).toLocaleString();

const ProviderCard = ({ title, data, onView }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
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

const MobileMoney = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["mobile-money-balances"],
    queryFn: async () => {
      const res = await axiosPrivate.get("/float-management/mobile-banking");
      return res.data.data;
    },
  });

  /* ===============================
   | Loading / Error
   =============================== */
  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground">
        Loading mobile money balances…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-sm text-red-600">
        Failed to load mobile money balances
      </div>
    );
  }

  /* ===============================
   | Normalize balances by channel_id
   =============================== */
  const balances = data?.balances || [];

  if (balances.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No mobile money channels configured yet.
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {balances.map((channel) => (
        <ProviderCard
          key={channel.channel_id}
          title={`${channel.provider} Mobile Money`}
          data={channel}
          onView={() =>
            navigate(`/float-management/mobile-banking/${channel.channel_id}`)
          }
        />
      ))}
    </div>
  );
};

export default MobileMoney;

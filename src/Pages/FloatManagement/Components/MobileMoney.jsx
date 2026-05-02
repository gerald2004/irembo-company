/* eslint-disable react/prop-types */
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Smartphone } from "lucide-react";

const currency = (n) => Number(n || 0).toLocaleString();

const getProviderBorderClass = (provider) => {
  const name = (provider || "").toLowerCase();
  if (name.includes("mtn")) return "border-l-4 border-l-yellow-400";
  if (name.includes("airtel")) return "border-l-4 border-l-red-500";
  return "border-l-4 border-l-blue-400";
};

const ProviderCard = ({ channel, onView }) => {
  const borderClass = getProviderBorderClass(channel.provider);

  return (
    <Card className={`overflow-hidden ${borderClass}`}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="rounded-md bg-primary/10 p-1.5">
            <Smartphone className="h-4 w-4 text-primary" />
          </div>
          <CardTitle className="text-base">{channel.provider} Mobile Money</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-2">
        <div className="text-xl font-bold text-green-700">
          {currency(channel?.available)}
        </div>

        <p className="text-xs text-muted-foreground">
          Reserved: {currency(channel?.reserved)}
        </p>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {channel?.transactions ?? 0} Transactions
          </Badge>
        </div>

        <Button size="sm" disabled={!channel} onClick={onView}>
          View Transactions →
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
          channel={channel}
          onView={() =>
            navigate(`/float-management/mobile-banking/${channel.channel_id}`)
          }
        />
      ))}
    </div>
  );
};

export default MobileMoney;

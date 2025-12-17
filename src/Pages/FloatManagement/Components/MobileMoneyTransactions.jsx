/* eslint-disable react/prop-types */
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const currency = (n) => Number(n || 0).toLocaleString();

const MobileMoneyTransactions = ({ channelId, onProviderResolved }) => {
  const axiosPrivate = useAxiosPrivate();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["float-transactions", channelId],
    queryFn: async () => {
      const res = await axiosPrivate.get(
        "/float-management/mobile-banking/transactions",
        {
          params: { channel_id: channelId },
        }
      );
      return res.data.data;
    },
    enabled: !!channelId,
  });

  /* ===============================
   | Notify parent once provider is known
   =============================== */
  useEffect(() => {
    if (data?.channel?.provider && onProviderResolved) {
      onProviderResolved(data.channel.provider);
    }
  }, [data, onProviderResolved]);

  const rows = data?.transactions || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {data?.channel?.provider
            ? `${data.channel.provider} Mobile Money Transactions`
            : "Mobile Money Transactions"}
        </CardTitle>
      </CardHeader>

      <CardContent>
        {isLoading && (
          <div className="text-sm text-muted-foreground">Loading…</div>
        )}

        {isError && (
          <div className="text-sm text-red-600">
            Failed to load transactions
          </div>
        )}

        {!isLoading && !isError && rows.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-6">
            No transactions yet.
          </div>
        )}

        {!isLoading && !isError && rows.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {rows.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>
                    {new Date(tx.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell className="capitalize">{tx.action}</TableCell>
                  <TableCell>UGX {currency(tx.amount)}</TableCell>
                  <TableCell>{tx.reference}</TableCell>
                  <TableCell>{tx.notes || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default MobileMoneyTransactions;

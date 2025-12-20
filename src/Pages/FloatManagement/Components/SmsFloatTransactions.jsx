/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
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
import { Button } from "@/components/ui/button";

const currency = (n) => Number(n || 0).toLocaleString();

const SmsFloatTransactions = ({ smsAccountId, onAccountResolved }) => {
  const axiosPrivate = useAxiosPrivate();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["sms-float-transactions", smsAccountId, page, limit],
    queryFn: async () => {
      const res = await axiosPrivate.get(
        "/float-management/sms-float/transactions",
        {
          params: { sms_account_id: smsAccountId, page, limit },
        }
      );
      return res.data.data;
    },
    enabled: !!smsAccountId,
    retry: (failureCount, err) => {
      const status = err?.response?.status;
      if (status === 404) return false;
      return failureCount < 2;
    },
    keepPreviousData: true,
  });

  /* ===============================
   | Notify parent once account is known
   =============================== */
  useEffect(() => {
    if (data?.sms_account?.name && onAccountResolved) {
      onAccountResolved(data.sms_account); // { name, billing_type, charge_per_sms }
    }
  }, [data, onAccountResolved]);

  const rows = data?.transactions || [];
  const total = Number(data?.total || 0);
  const totalPages = Math.max(Math.ceil(total / limit), 1);

  const status = error?.response?.status;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle>
          {data?.sms_account?.name
            ? `${data.sms_account.name} Transactions`
            : "Transactions"}
          {isFetching ? (
            <span className="ml-2 text-xs text-muted-foreground">
              Refreshing…
            </span>
          ) : null}
        </CardTitle>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Rows:</span>
          <select
            className="h-9 rounded-md border bg-background px-2 text-sm"
            value={limit}
            onChange={(e) => {
              setPage(1);
              setLimit(Number(e.target.value));
            }}
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading && (
          <div className="text-sm text-muted-foreground">Loading…</div>
        )}

        {status === 404 && (
          <div className="text-sm text-muted-foreground text-center py-6">
            SMS account not found (or you don’t have access).
          </div>
        )}

        {isError && status !== 404 && (
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
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>SMS Units</TableHead>
                  <TableHead>Charge/SMS</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {rows.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>
                      {tx.created_at
                        ? new Date(tx.created_at).toLocaleString()
                        : "—"}
                    </TableCell>

                    <TableCell className="capitalize">{tx.action}</TableCell>

                    <TableCell>{tx.sms_units ?? 0}</TableCell>

                    <TableCell>UGX {currency(tx.charge_per_sms)}</TableCell>

                    <TableCell className="font-medium">
                      UGX {currency(tx.amount)}
                    </TableCell>

                    <TableCell>{tx.reference || "—"}</TableCell>

                    <TableCell>{tx.notes || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex items-center justify-between pt-4">
              <p className="text-xs text-muted-foreground">
                Page {page} of {totalPages} • Total {total}
              </p>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                >
                  Prev
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SmsFloatTransactions;

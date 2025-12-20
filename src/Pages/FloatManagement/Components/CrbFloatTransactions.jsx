/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const currency = (n) => Number(n || 0).toLocaleString();

const CrbFloatTransactions = ({
  crbAccountId,
  productCode,
  onMetaResolved,
}) => {
  const axiosPrivate = useAxiosPrivate();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [
      "crb-float-transactions",
      crbAccountId,
      productCode ?? "all",
      page,
      limit,
    ],
    queryFn: async () => {
      const res = await axiosPrivate.get(
        "/float-management/crb-float/transactions",
        {
          params: {
            crb_account_id: crbAccountId,
            product_code: productCode || undefined,
            page,
            limit,
          },
        }
      );
      return res.data.data;
    },
    enabled: !!crbAccountId,
    keepPreviousData: true,
    retry: (c, err) => {
      const s = err?.response?.status;
      if (s === 404) return false;
      return c < 2;
    },
  });

  useEffect(() => {
    if (data?.crb_account && onMetaResolved) {
      onMetaResolved({ account: data.crb_account, filter: data.filter });
    }
  }, [data, onMetaResolved]);

  const rows = data?.transactions || [];
  const total = Number(data?.total || 0);
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  const status = error?.response?.status;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle>Transactions</CardTitle>

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
            CRB account not found (or you don’t have access).
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
                  <TableHead>Product</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Unit Price</TableHead>
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
                    <TableCell>{tx.product || "—"}</TableCell>
                    <TableCell>{tx.quantity ?? 1}</TableCell>
                    <TableCell>UGX {currency(tx.unit_price)}</TableCell>
                    <TableCell className="font-medium">
                      UGX {currency(tx.amount)}
                    </TableCell>
                    <TableCell>{tx.reference || "—"}</TableCell>
                    <TableCell>{tx.notes || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

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

export default CrbFloatTransactions;

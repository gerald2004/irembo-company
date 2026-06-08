/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";

import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SmsCarryForwardDialog from "./SmsCarryForwardDialog";

const currency = (n) => Number(n || 0).toLocaleString();

const ACTION_STYLE = {
  load:    "bg-green-100 text-green-800 border-green-200",
  use:     "bg-blue-100 text-blue-800 border-blue-200",
  adjust:  "bg-purple-100 text-purple-800 border-purple-200",
  reserve: "bg-yellow-100 text-yellow-800 border-yellow-200",
  release: "bg-sky-100 text-sky-800 border-sky-200",
  debt:    "bg-red-100 text-red-800 border-red-200",
};

const ActionBadge = ({ action }) => {
  const cls = ACTION_STYLE[action] ?? "bg-gray-100 text-gray-700 border-gray-200";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${cls}`}>
      {action}
    </span>
  );
};

const SmsFloatTransactions = ({ smsAccountId, saccoId, onAccountResolved }) => {
  const axiosPrivate = useAxiosPrivate();
  const [page, setPage]         = useState(1);
  const [limit, setLimit]       = useState(10);
  const [cfOpen, setCfOpen]     = useState(false);

  const { data, isLoading, isError, error, isFetching, refetch } = useQuery({
    queryKey: ["sms-float-transactions", smsAccountId, page, limit],
    queryFn: async () => {
      const res = await axiosPrivate.get("/float-management/sms-float/transactions", {
        params: { sms_account_id: smsAccountId, page, limit },
      });
      return res.data.data;
    },
    enabled: !!smsAccountId,
    retry: (failureCount, err) => {
      if (err?.response?.status === 404) return false;
      return failureCount < 2;
    },
    keepPreviousData: true,
  });

  useEffect(() => {
    if (data?.sms_account?.name && onAccountResolved) {
      onAccountResolved(data.sms_account);
    }
  }, [data, onAccountResolved]);

  const rows        = data?.transactions || [];
  const total       = Number(data?.total || 0);
  const totalPages  = Math.max(Math.ceil(total / limit), 1);
  const httpStatus  = error?.response?.status;
  const smsAccount  = data?.sms_account;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle>
          {smsAccount?.name ? `${smsAccount.name} Transactions` : "SMS Transactions"}
          {isFetching && <span className="ml-2 text-xs text-muted-foreground">Refreshing…</span>}
        </CardTitle>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!saccoId || !smsAccountId}
            onClick={() => setCfOpen(true)}
          >
            Carry Forward
          </Button>
          <span className="text-xs text-muted-foreground">Rows:</span>
          <select
            className="h-9 rounded-md border bg-background px-2 text-sm"
            value={limit}
            onChange={(e) => { setPage(1); setLimit(Number(e.target.value)); }}
          >
            {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}

        {httpStatus === 404 && (
          <div className="text-sm text-muted-foreground text-center py-6">
            SMS account not found.
          </div>
        )}

        {isError && httpStatus !== 404 && (
          <div className="text-sm text-red-600">Failed to load transactions</div>
        )}

        {!isLoading && !isError && rows.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-6">No transactions yet.</div>
        )}

        {!isLoading && !isError && rows.length > 0 && (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead className="text-right">SMS Units</TableHead>
                  <TableHead className="text-right">Charge/SMS</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {rows.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {tx.created_at ? new Date(tx.created_at).toLocaleString() : "—"}
                    </TableCell>
                    <TableCell><ActionBadge action={tx.action} /></TableCell>
                    <TableCell className="text-right font-medium">{tx.sms_units ?? 0}</TableCell>
                    <TableCell className="text-right">{currency(tx.charge_per_sms)}</TableCell>
                    <TableCell className="text-right font-medium">{currency(tx.amount)}</TableCell>
                    <TableCell className="text-sm">{tx.reference || "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{tx.notes || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between pt-4">
              <p className="text-xs text-muted-foreground">
                Page {page} of {totalPages} &nbsp;·&nbsp; {total} total
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}>Prev</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}>Next</Button>
              </div>
            </div>
          </>
        )}
      </CardContent>

      {cfOpen && (
        <SmsCarryForwardDialog
          isOpen={cfOpen}
          onClose={() => setCfOpen(false)}
          refetch={refetch}
          saccoId={saccoId}
          smsAccountId={smsAccountId}
          accountName={smsAccount?.name}
          defaultChargePerSms={smsAccount?.charge_per_sms}
          billingType={smsAccount?.billing_type}
        />
      )}
    </Card>
  );
};

export default SmsFloatTransactions;

/* eslint-disable react/prop-types */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { formatDateTimestamp } from "@/lib/utils";

const fmt = (v) => Number(v ?? 0).toLocaleString("en-UG");

export function FixedDepositLogModal({ isOpen, onClose, fdId, fdCode }) {
  const axios = useAxiosPrivate();
  const [page, setPage] = useState(0);
  const [pageSize] = useState(15);

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ["fd-interest-log-single", fdId, page],
    queryFn: async () => {
      const res = await axios.get("/accounting/fixed/interest-log", {
        params: { fd_id: fdId, start: page * pageSize, size: pageSize },
      });
      return res.data?.data ?? { meta: {}, data: [] };
    },
    enabled: !!fdId && isOpen,
    keepPreviousData: true,
    staleTime: 30_000,
  });

  const rows = data?.data ?? [];
  const total = data?.meta?.totalRowCount ?? 0;
  const totalAccrued = data?.meta?.total_accrued ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Interest Accrual Log — {fdCode}</DialogTitle>
          <DialogDescription>
            Daily accrual entries for this fixed deposit.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-muted-foreground">
            Total accrued:{" "}
            <span className="font-semibold text-green-700">{fmt(totalAccrued)}</span>
            {" · "}
            {fmt(total)} entries
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            {isFetching
              ? <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> Refreshing</>
              : <><RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh</>
            }
          </Button>
        </div>

        <div className="rounded-md border overflow-x-auto max-h-[400px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Daily Accrual</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Journal #</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(4)].map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6 text-destructive">
                    <AlertTriangle className="h-4 w-4 inline mr-1" /> Failed to load logs.
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground text-sm">
                    No accrual entries yet for this deposit.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.interest_log_id}>
                    <TableCell className="text-xs font-medium">
                      {formatDateTimestamp(row.accrual_date)}
                    </TableCell>
                    <TableCell className="text-xs text-right tabular-nums font-semibold text-green-700">
                      {fmt(row.accrual_amount)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          row.fixed_deposit_transaction_transfer_status === "ongoing"
                            ? "border-blue-300 text-blue-700 bg-blue-50"
                            : "border-green-300 text-green-700 bg-green-50"
                        }
                      >
                        {row.fixed_deposit_transaction_transfer_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {row.journal_entry_id ? `#${row.journal_entry_id}` : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
          <span>
            {rows.length === 0 ? "0" : page * pageSize + 1}–
            {Math.min((page + 1) * pageSize, total)} of {fmt(total)}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 0 || isFetching} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page + 1 >= totalPages || isFetching} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

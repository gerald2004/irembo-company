/* eslint-disable react/prop-types */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { RefreshCw, Play, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { formatDateTimestamp } from "@/lib/utils";

const fmt = (v) => Number(v ?? 0).toLocaleString("en-UG");

export function FixedDepositInterestLog() {
  const axios       = useAxiosPrivate();
  const qc          = useQueryClient();
  const [page, setPage]         = useState(0);
  const [pageSize]              = useState(20);
  const [fdFilter, setFdFilter] = useState("");

  const fdId = fdFilter.trim() !== "" && !isNaN(Number(fdFilter))
    ? Number(fdFilter)
    : undefined;

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ["fd-interest-log", page, pageSize, fdId],
    queryFn: async () => {
      const res = await axios.get("/accounting/fixed/interest-log", {
        params: { start: page * pageSize, size: pageSize, ...(fdId ? { fd_id: fdId } : {}) },
      });
      return res.data?.data ?? { meta: {}, data: [] };
    },
    keepPreviousData: true,
    staleTime: 30_000,
  });

  const rows       = data?.data  ?? [];
  const total      = data?.meta?.totalRowCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const totalAccrued = data?.meta?.total_accrued ?? 0;

  const runAccrual = useMutation({
    mutationFn: () => axios.post("/accounting/fixed/interest-log"),
    onSuccess: (res) => {
      const msg = res.data?.messages?.[0] ?? "Accrual complete.";
      toast({ title: "Accrual ran", description: msg });
      qc.invalidateQueries({ queryKey: ["fd-interest-log"] });
    },
    onError: (err) => {
      const msg = err?.response?.data?.messages?.[0] ?? "Accrual failed.";
      toast({ title: "Error", variant: "destructive", description: msg });
    },
  });

  return (
    <div className="space-y-4">
      {/* Summary + controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-1">
            <CardDescription className="text-xs">Total Accrued (filtered)</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">{fmt(totalAccrued)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-1">
            <CardDescription className="text-xs">Log Entries (filtered)</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">{fmt(total)}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-1">
            <CardTitle className="text-sm font-medium">Daily Accrual Worker</CardTitle>
            <CardDescription className="text-xs">
              Runs automatically via cron at{" "}
              <code className="text-xs bg-muted px-1 rounded">
                GET /cronjobs/fixed-deposits/accrue
              </code>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              size="sm"
              disabled={runAccrual.isPending}
              onClick={() => runAccrual.mutate()}
            >
              {runAccrual.isPending ? (
                <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Running…</>
              ) : (
                <><Play className="h-3.5 w-3.5 mr-1.5" /> Run Accrual Now</>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Result banner after run */}
      {runAccrual.isSuccess && (
        <div className="flex items-center gap-2 rounded-lg border border-green-300 bg-green-50 dark:bg-green-950/30 p-3 text-sm">
          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
          <span>
            Last run —{" "}
            <strong>{runAccrual.data?.data?.data?.accrued ?? 0}</strong> accrued,{" "}
            <strong>{runAccrual.data?.data?.data?.skipped ?? 0}</strong> already done,{" "}
            <strong>{runAccrual.data?.data?.data?.errors ?? 0}</strong> errors.
          </span>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Input
          className="max-w-xs"
          placeholder="Filter by FD ID…"
          value={fdFilter}
          onChange={(e) => { setFdFilter(e.target.value); setPage(0); }}
        />
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
          {isFetching
            ? <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> Refreshing</>
            : <><RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh</>
          }
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Accrual Date</TableHead>
              <TableHead>FD Code</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Client</TableHead>
              <TableHead className="text-right">FD Amount</TableHead>
              <TableHead className="text-right">Total Interest</TableHead>
              <TableHead className="text-right">Daily Accrual</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Journal Entry</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(6)].map((_, i) => (
                <TableRow key={i}>
                  {[...Array(9)].map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-destructive">
                  <AlertTriangle className="h-4 w-4 inline mr-1" /> Failed to load logs.
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-10 text-muted-foreground text-sm">
                  No accrual logs yet. Click <strong>Run Accrual Now</strong> to generate today's entries.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.interest_log_id}>
                  <TableCell className="text-xs font-medium">
                    {formatDateTimestamp(row.accrual_date)}
                  </TableCell>
                  <TableCell className="text-xs font-mono">
                    {row.fixed_deposit_transaction_code}
                  </TableCell>
                  <TableCell className="text-xs">
                    {row.fixed_deposit_setting_title}
                    <span className="ml-1 text-muted-foreground">
                      ({row.fixed_deposit_setting_interest}%)
                    </span>
                  </TableCell>
                  <TableCell className="text-xs">{row.client_name}</TableCell>
                  <TableCell className="text-xs text-right tabular-nums">
                    {fmt(row.fixed_deposit_transaction_amount)}
                  </TableCell>
                  <TableCell className="text-xs text-right tabular-nums">
                    {fmt(row.fixed_deposit_transaction_return_amount)}
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
                          : row.fixed_deposit_transaction_transfer_status === "completed"
                          ? "border-green-300 text-green-700 bg-green-50"
                          : "border-gray-300 text-gray-600"
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

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Showing {rows.length === 0 ? 0 : page * pageSize + 1}–
          {Math.min((page + 1) * pageSize, total)} of {fmt(total)} entries
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline" size="sm"
            disabled={page === 0 || isFetching}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline" size="sm"
            disabled={page + 1 >= totalPages || isFetching}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

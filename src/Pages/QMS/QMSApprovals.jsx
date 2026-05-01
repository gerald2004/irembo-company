import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import {
  CheckCircle,
  XCircle,
  Eye,
  AlertCircle,
  RefreshCw,
  Filter,
} from "lucide-react";

const MODULE_LABELS = {
  deposit:               "Deposit",
  withdrawal:            "Withdrawal",
  loan_disbursement:     "Loan Disbursement",
  loan_repayment:        "Loan Repayment",
  cash_transfer:         "Cash Transfer",
  inter_branch_transfer: "Inter-Branch Transfer",
  journal_entry:         "Manual Journal Entry",
  income:                "External Income",
  expense:               "Expense",
  shares:                "Shares",
  fixed_deposit:         "Fixed Deposit",
  asset:                 "Asset Registration",
  vendor_payment:        "Vendor Payment",
  compulsory_saving:     "Compulsory Saving",
};

const statusBadge = (s) => {
  if (s === "pending")   return <Badge variant="outline"     className="text-xs text-amber-600 border-amber-400">Pending</Badge>;
  if (s === "completed") return <Badge variant="default"     className="text-xs bg-green-600">Approved</Badge>;
  if (s === "rejected")  return <Badge variant="destructive" className="text-xs">Rejected</Badge>;
  return <Badge variant="secondary" className="text-xs">{s ?? "—"}</Badge>;
};

const fmtAmount = (n) =>
  Number(n ?? 0).toLocaleString("en-UG", { style: "currency", currency: "UGX", maximumFractionDigits: 0 });

/* ─── Pure display dialog — no hooks ─────────────────────── */
const DetailDialog = ({
  je, isLoading, onClose,
  isPending,
  rejectOpen, setRejectOpen,
  rejectReason, setRejectReason,
  onApprove, onReject,
  isMutating,
}) => {
  const lines = Array.isArray(je?.lines) ? je.lines : [];

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">
            Journal Entry — {je?.transaction_code ?? "…"}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-2 py-4">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8" />)}
          </div>
        ) : !je ? (
          <p className="text-sm text-muted-foreground py-4">Entry not found.</p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-muted-foreground">Module</p>
                <p className="font-medium">{MODULE_LABELS[je.source_module] ?? je.source_module ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Date</p>
                <p className="font-medium">{je.transaction_date ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Amount</p>
                <p className="font-medium">{fmtAmount(je.amount)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                {statusBadge(je.status)}
              </div>
              {je.description && (
                <div className="col-span-2">
                  <p className="text-muted-foreground">Description</p>
                  <p className="font-medium">{je.description}</p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground">Created By</p>
                <p className="font-medium">{je.created_by?.name ?? "—"}</p>
              </div>
              {je.approved_by && (
                <div>
                  <p className="text-muted-foreground">Checker</p>
                  <p className="font-medium">{je.approved_by?.name ?? "—"}</p>
                </div>
              )}
              {je.rejection_reason && (
                <div className="col-span-2">
                  <p className="text-muted-foreground">Rejection Reason</p>
                  <p className="font-medium text-destructive">{je.rejection_reason}</p>
                </div>
              )}
            </div>

            {lines.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="text-xs font-semibold mb-2">Journal Lines</p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Account</TableHead>
                        <TableHead className="text-xs text-right">Debit</TableHead>
                        <TableHead className="text-xs text-right">Credit</TableHead>
                        <TableHead className="text-xs">Narration</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lines.map((line, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs">
                            <span className="font-medium">{line.account_title ?? "—"}</span>
                            {line.account_code && (
                              <span className="text-muted-foreground ml-1">({line.account_code})</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-right font-mono">
                            {(line.debit_amount ?? 0) > 0 ? fmtAmount(line.debit_amount) : "—"}
                          </TableCell>
                          <TableCell className="text-xs text-right font-mono">
                            {(line.credit_amount ?? 0) > 0 ? fmtAmount(line.credit_amount) : "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{line.description ?? ""}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}

            {isPending && (
              <>
                <Separator />
                {rejectOpen ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-destructive">Rejection reason (required)</p>
                    <Textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      rows={3}
                      placeholder="Explain why this entry is being rejected…"
                      className="text-xs resize-none"
                    />
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" size="sm" onClick={() => setRejectOpen(false)}>Back</Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={!rejectReason.trim() || isMutating}
                        onClick={() => onReject(rejectReason)}
                      >
                        {isMutating ? "Saving…" : "Confirm Reject"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <DialogFooter className="gap-2">
                    <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={isMutating}
                      onClick={() => setRejectOpen(true)}
                    >
                      <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                    </Button>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      disabled={isMutating}
                      onClick={onApprove}
                    >
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />
                      {isMutating ? "Saving…" : "Approve"}
                    </Button>
                  </DialogFooter>
                )}
              </>
            )}

            {!isPending && (
              <DialogFooter>
                <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
              </DialogFooter>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

/* ─── Main component ─────────────────────────────────────── */
const QMSApprovals = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate     = useNavigate();
  const queryClient  = useQueryClient();

  const [status,      setStatus]      = useState("pending");
  const [module,      setModule]      = useState("all");
  const [startDate,   setStartDate]   = useState("");
  const [endDate,     setEndDate]     = useState("");
  const [viewId,      setViewId]      = useState(null);
  const [rejectOpen,  setRejectOpen]  = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  /* list */
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["qms-approvals", status, module, startDate, endDate],
    queryFn: async () => {
      const params = { status };
      if (module && module !== "all") params.module = module;
      if (startDate) params.startDate = startDate;
      if (endDate)   params.endDate   = endDate;
      try {
        const res = await axiosPrivate.get("/qms/approvals", { params });
        return res?.data?.data ?? null;
      } catch (e) {
        if (e?.response?.status === 401) navigate("/", { replace: true });
        throw e;
      }
    },
    retry: 1,
  });

  const entries = Array.isArray(data?.entries) ? data.entries : [];

  /* detail — runs only when viewId is set */
  const { data: jeDetail, isLoading: detailLoading } = useQuery({
    queryKey: ["qms-je-detail", viewId],
    queryFn: async () => {
      const res = await axiosPrivate.get(`/qms/approvals/${viewId}`);
      return res?.data?.data ?? null;
    },
    enabled: !!viewId,
  });

  /* mutations */
  const approveMut = useMutation({
    mutationFn: (jeId) => axiosPrivate.post(`/qms/approvals/${jeId}/approve`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qms-approvals"] });
      queryClient.removeQueries({ queryKey: ["qms-je-detail", viewId] });
      closeView();
      toast({ title: "Journal entry approved", variant: "success" });
    },
    onError: (e) =>
      toast({ title: e?.response?.data?.messages?.[0] ?? "Approval failed", variant: "destructive" }),
  });

  const rejectMut = useMutation({
    mutationFn: ({ jeId, reason }) =>
      axiosPrivate.post(`/qms/approvals/${jeId}/reject`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qms-approvals"] });
      queryClient.removeQueries({ queryKey: ["qms-je-detail", viewId] });
      closeView();
      toast({ title: "Journal entry rejected", variant: "success" });
    },
    onError: (e) =>
      toast({ title: e?.response?.data?.messages?.[0] ?? "Rejection failed", variant: "destructive" }),
  });

  const openView = (id) => {
    setViewId(id);
    setRejectOpen(false);
    setRejectReason("");
  };

  const closeView = () => {
    setViewId(null);
    setRejectOpen(false);
    setRejectReason("");
  };

  const isMutating = approveMut.isPending || rejectMut.isPending;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center gap-3 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0" />

            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending"   className="text-xs">Pending</SelectItem>
                <SelectItem value="completed" className="text-xs">Approved</SelectItem>
                <SelectItem value="rejected"  className="text-xs">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={module} onValueChange={setModule}>
              <SelectTrigger className="h-8 w-48 text-xs"><SelectValue placeholder="All modules" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All modules</SelectItem>
                {Object.entries(MODULE_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-8 w-36 text-xs"
            />
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-8 w-36 text-xs"
            />

            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => refetch()} disabled={isRefetching}>
              <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin" : ""}`} />
            </Button>

            <span className="text-xs text-muted-foreground ml-auto">
              {!isLoading && `${entries.length} entr${entries.length === 1 ? "y" : "ies"}`}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
        </div>
      ) : isError ? (
        <div className="flex items-center gap-2 text-destructive text-sm py-6">
          <AlertCircle className="h-4 w-4" /> Failed to load entries.
        </div>
      ) : entries.length === 0 ? (
        <Card>
          <CardContent className="text-center py-10 text-muted-foreground text-sm">
            No {status} journal entries.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Code</TableHead>
                <TableHead className="text-xs">Module</TableHead>
                <TableHead className="text-xs">Description</TableHead>
                <TableHead className="text-xs text-right">Amount</TableHead>
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Maker</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((je) => (
                <TableRow key={je.je_id}>
                  <TableCell className="text-xs font-mono">{je.transaction_code ?? "—"}</TableCell>
                  <TableCell className="text-xs">{MODULE_LABELS[je.source_module] ?? je.source_module ?? "—"}</TableCell>
                  <TableCell className="text-xs max-w-[200px] truncate">{je.description ?? ""}</TableCell>
                  <TableCell className="text-xs text-right font-mono">{fmtAmount(je.amount)}</TableCell>
                  <TableCell className="text-xs">{je.transaction_date ?? "—"}</TableCell>
                  <TableCell className="text-xs">{je.maker_name ?? "—"}</TableCell>
                  <TableCell>{statusBadge(je.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7"
                        title="View details"
                        onClick={() => openView(je.je_id)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      {je.status === "pending" && (
                        <>
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7 text-green-600"
                            title="Approve"
                            disabled={isMutating}
                            onClick={() => approveMut.mutate(je.je_id)}
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                            title="Reject — open detail"
                            onClick={() => openView(je.je_id)}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Detail dialog */}
      {viewId && (
        <DetailDialog
          je={jeDetail ?? null}
          isLoading={detailLoading}
          onClose={closeView}
          isPending={jeDetail?.status === "pending"}
          rejectOpen={rejectOpen}
          setRejectOpen={setRejectOpen}
          rejectReason={rejectReason}
          setRejectReason={setRejectReason}
          onApprove={() => approveMut.mutate(viewId)}
          onReject={(reason) => rejectMut.mutate({ jeId: viewId, reason })}
          isMutating={isMutating}
        />
      )}
    </div>
  );
};

export default QMSApprovals;

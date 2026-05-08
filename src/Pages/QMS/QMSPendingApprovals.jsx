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
  deposit:           "Deposit",
  withdrawal:        "Withdrawal",
  loan_disbursement: "Loan Disbursement",
  loan_write_off:    "Loan Write-Off",
  loan_reschedule:   "Loan Reschedule",
  account_closure:   "Account Closure",
  large_withdrawal:  "Large Withdrawal",
  journal_entry:     "Journal Entry",
};

const SENSITIVE_FIELDS = new Set([
  "user_pincode",
  "client_id",
  "client_account_id",
  "deposit_transaction_account_id",
  "withdraw_transaction_account_id",
  "skip_fee_ids",
  "fee_overrides",
  "password",
  "token",
]);

const PAYLOAD_LABELS = {
  deposit_transaction_amount:    "Amount",
  withdraw_transaction_amount:   "Amount",
  deposit_transaction_method:    "Method",
  withdraw_transaction_method:   "Method",
  deposit_transaction_notary:    "Notary / Reference",
  withdraw_transaction_notary:   "Notary / Reference",
  deposit_transaction_notes:     "Notes",
  withdraw_transaction_notes:    "Notes",
  deposit_transaction_charge:    "Charge",
  withdraw_transaction_charge:   "Charge",
  loan_application_amount:       "Loan Amount",
  loan_application_id:           "Loan ID",
  journal_entry_id:              "Journal Entry ID",
  journal_entry_description:     "Description",
  journal_entry_amount:          "Amount",
};

const statusBadge = (s) => {
  if (s === "pending")  return <Badge variant="outline"     className="text-xs text-amber-600 border-amber-400">Pending</Badge>;
  if (s === "approved") return <Badge variant="default"     className="text-xs bg-green-600">Approved</Badge>;
  if (s === "rejected") return <Badge variant="destructive" className="text-xs">Rejected</Badge>;
  return <Badge variant="secondary" className="text-xs">{s ?? "—"}</Badge>;
};

/* ─── Detail dialog ──────────────────────────────────────────── */
const DetailDialog = ({
  item, isLoading, onClose,
  isPending,
  rejectOpen, setRejectOpen,
  rejectReason, setRejectReason,
  note, setNote,
  onApprove, onReject,
  isMutating,
}) => (
  <Dialog open onOpenChange={onClose}>
    <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="text-base">
          Pending Action #{item?.approval_id ?? "…"}
        </DialogTitle>
      </DialogHeader>

      {isLoading ? (
        <div className="space-y-2 py-4">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-8" />)}
        </div>
      ) : !item ? (
        <p className="text-sm text-muted-foreground py-4">Record not found.</p>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-muted-foreground">Module</p>
              <p className="font-medium">{MODULE_LABELS[item.module] ?? item.module ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Reference</p>
              <p className="font-medium font-mono">#{item.approval_id ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              {statusBadge(item.status)}
            </div>
            <div>
              <p className="text-muted-foreground">Requested By</p>
              <p className="font-medium">{item.requested_by?.name ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Submitted</p>
              <p className="font-medium">{item.created_at ?? "—"}</p>
            </div>
            {item.approver && (
              <div>
                <p className="text-muted-foreground">Actioned By</p>
                <p className="font-medium">{item.approver.name}</p>
              </div>
            )}
            {item.notes && (
              <div className="col-span-2">
                <p className="text-muted-foreground">Notes</p>
                <p className="font-medium">{item.notes}</p>
              </div>
            )}
            {item.rejection_reason && (
              <div className="col-span-2">
                <p className="text-muted-foreground">Rejection Reason</p>
                <p className="font-medium text-destructive">{item.rejection_reason}</p>
              </div>
            )}
          </div>

          {item.payload && Object.keys(item.payload).length > 0 && (() => {
            const safeEntries = Object.entries(item.payload).filter(([k]) => !SENSITIVE_FIELDS.has(k));
            if (safeEntries.length === 0) return null;
            return (
              <>
                <Separator />
                <div>
                  <p className="text-xs font-semibold mb-2">Request Details</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {safeEntries.map(([k, v]) => (
                      <div key={k}>
                        <p className="text-muted-foreground capitalize">
                          {PAYLOAD_LABELS[k] ?? k.replace(/_/g, " ")}
                        </p>
                        <p className="font-medium">
                          {Array.isArray(v) ? (v.length ? v.join(", ") : "—") : String(v ?? "—")}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            );
          })()}

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
                    placeholder="Explain the reason for rejection…"
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
                <>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Optional approval note</p>
                    <Input
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Add a note (optional)…"
                      className="h-8 text-xs"
                    />
                  </div>
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
                      onClick={() => onApprove(note)}
                    >
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />
                      {isMutating ? "Saving…" : "Approve"}
                    </Button>
                  </DialogFooter>
                </>
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

/* ─── Main component ──────────────────────────────────────────── */
const QMSPendingApprovals = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate     = useNavigate();
  const queryClient  = useQueryClient();

  const [status,       setStatus]       = useState("pending");
  const [module,       setModule]       = useState("all");
  const [startDate,    setStartDate]    = useState("");
  const [endDate,      setEndDate]      = useState("");
  const [viewId,       setViewId]       = useState(null);
  const [rejectOpen,   setRejectOpen]   = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [note,         setNote]         = useState("");

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["qms-pending", status, module, startDate, endDate],
    queryFn: async () => {
      const params = { status };
      if (module && module !== "all") params.module = module;
      if (startDate) params.startDate = startDate;
      if (endDate)   params.endDate   = endDate;
      try {
        const res = await axiosPrivate.get("/qms/pending", { params });
        return res?.data?.data ?? null;
      } catch (e) {
        if (e?.response?.status === 401) navigate("/", { replace: true });
        throw e;
      }
    },
    retry: 1,
  });

  const items = Array.isArray(data?.items) ? data.items : [];

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ["qms-pending-detail", viewId],
    queryFn: async () => {
      const res = await axiosPrivate.get(`/qms/pending/${viewId}`);
      return res?.data?.data ?? null;
    },
    enabled: !!viewId,
  });

  const approveMut = useMutation({
    mutationFn: ({ id, note }) =>
      axiosPrivate.post(`/qms/pending/${id}/approve`, { note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qms-pending"] });
      queryClient.removeQueries({ queryKey: ["qms-pending-detail", viewId] });
      closeView();
      toast({ title: "Request approved successfully", variant: "success" });
    },
    onError: (e) =>
      toast({ title: e?.response?.data?.messages?.[0] ?? "Approval failed", variant: "destructive" }),
  });

  const rejectMut = useMutation({
    mutationFn: ({ id, reason }) =>
      axiosPrivate.post(`/qms/pending/${id}/reject`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qms-pending"] });
      queryClient.removeQueries({ queryKey: ["qms-pending-detail", viewId] });
      closeView();
      toast({ title: "Request rejected", variant: "success" });
    },
    onError: (e) =>
      toast({ title: e?.response?.data?.messages?.[0] ?? "Rejection failed", variant: "destructive" }),
  });

  const openView = (id) => {
    setViewId(id);
    setRejectOpen(false);
    setRejectReason("");
    setNote("");
  };

  const closeView = () => {
    setViewId(null);
    setRejectOpen(false);
    setRejectReason("");
    setNote("");
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
                <SelectItem value="pending"  className="text-xs">Pending</SelectItem>
                <SelectItem value="approved" className="text-xs">Approved</SelectItem>
                <SelectItem value="rejected" className="text-xs">Rejected</SelectItem>
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
              {!isLoading && `${items.length} item${items.length === 1 ? "" : "s"}`}
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
          <AlertCircle className="h-4 w-4" /> Failed to load pending actions.
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="text-center py-10 text-muted-foreground text-sm">
            No {status} actions.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">ID</TableHead>
                <TableHead className="text-xs">Module</TableHead>
                <TableHead className="text-xs">Ref #</TableHead>
                <TableHead className="text-xs">Requested By</TableHead>
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.approval_id}>
                  <TableCell className="text-xs font-mono">#{item.approval_id}</TableCell>
                  <TableCell className="text-xs">{MODULE_LABELS[item.module] ?? item.module ?? "—"}</TableCell>
                  <TableCell className="text-xs font-mono">#{item.approval_id}</TableCell>
                  <TableCell className="text-xs">{item.maker_name ?? "—"}</TableCell>
                  <TableCell className="text-xs">{item.created_at ?? "—"}</TableCell>
                  <TableCell>{statusBadge(item.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7"
                        title="View details"
                        onClick={() => openView(item.approval_id)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      {item.status === "pending" && (
                        <>
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7 text-green-600"
                            title="Approve"
                            disabled={isMutating}
                            onClick={() => approveMut.mutate({ id: item.approval_id, note: "" })}
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                            title="Reject — open detail"
                            onClick={() => openView(item.approval_id)}
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

      {viewId && (
        <DetailDialog
          item={detail ?? null}
          isLoading={detailLoading}
          onClose={closeView}
          isPending={detail?.status === "pending"}
          rejectOpen={rejectOpen}
          setRejectOpen={setRejectOpen}
          rejectReason={rejectReason}
          setRejectReason={setRejectReason}
          note={note}
          setNote={setNote}
          onApprove={(n) => approveMut.mutate({ id: viewId, note: n })}
          onReject={(reason) => rejectMut.mutate({ id: viewId, reason })}
          isMutating={isMutating}
        />
      )}
    </div>
  );
};

export default QMSPendingApprovals;

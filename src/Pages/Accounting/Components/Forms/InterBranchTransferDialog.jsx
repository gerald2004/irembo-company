/* eslint-disable react/prop-types */
import * as React from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import useAuth from "@/MiddleWares/Hooks/useAuth";
import { toast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DateField } from "@/components/DateField";
import { X, Loader2, ArrowRight } from "lucide-react";

const SCOPES = [
  { v: "till",         label: "Till" },
  { v: "safe",         label: "Safe" },
  { v: "bank",         label: "Bank" },
  { v: "mobile_money", label: "Mobile Money" },
];

function fmtAmount(n) {
  if (n == null) return "";
  const num = Number(n);
  if (Number.isNaN(num)) return "";
  return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function useOperationalAccounts(scope, branchId, enabled) {
  const axiosPrivate = useAxiosPrivate();
  return useQuery({
    queryKey: ["operational-accounts", scope, branchId],
    queryFn: async () => {
      const ctrl = new AbortController();
      const params = new URLSearchParams({ scope });
      if (branchId) params.set("branch_id", branchId);
      const r = await axiosPrivate.get(
        `/accounting/operational-accounts?${params.toString()}`,
        { signal: ctrl.signal }
      );
      const items = r?.data?.data?.items ?? r?.data?.data ?? [];
      return (items ?? [])
        .filter((it) => it?.ref_id != null)
        .map((it) => ({
          ref_id: String(it.ref_id),
          name: it.name ?? `Ref #${it.ref_id}`,
          available: it.available ?? null,
        }));
    },
    enabled: !!enabled && !!scope,
    staleTime: 10_000,
  });
}

export default function InterBranchTransferDialog({
  isOpen,
  onClose,
  defaultDate,
  onSuccess,
}) {
  const axiosPrivate = useAxiosPrivate();
  const { auth } = useAuth();
  const user = auth?.user ?? {};
  const dataPrivilege = String(user?.data_privilege ?? "branch").toLowerCase();
  const isSaccoUser = dataPrivilege === "sacco";

  // ── form state
  const [transferDate, setTransferDate] = React.useState(
    defaultDate || new Date().toISOString().slice(0, 10)
  );
  const [fromBranchId, setFromBranchId] = React.useState("");
  const [toBranchId, setToBranchId] = React.useState("");
  const [fromScope, setFromScope] = React.useState("till");
  const [toScope, setToScope] = React.useState("safe");
  const [fromRef, setFromRef] = React.useState("");
  const [toRef, setToRef] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [reason, setReason] = React.useState("");

  // reset on open
  React.useEffect(() => {
    if (isOpen) {
      setTransferDate(defaultDate || new Date().toISOString().slice(0, 10));
      setFromBranchId("");
      setToBranchId("");
      setFromScope("till");
      setToScope("safe");
      setFromRef("");
      setToRef("");
      setAmount("");
      setReason("");
    }
  }, [isOpen, defaultDate]);

  // ── branches
  const { data: branchesRaw = [] } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const ctrl = new AbortController();
      const r = await axiosPrivate.get("/settings/branches", { signal: ctrl.signal });
      const raw = r?.data?.data?.branches ?? [];
      return raw.map((b) => ({ id: String(b.id ?? b.branch_id), name: b.name ?? b.branch_name }));
    },
  });
  const branches = branchesRaw.filter((b) => b.id !== "" && b.id !== "0");

  // ── operational accounts per side
  const { data: fromChoices = [], isFetching: loadingFrom } =
    useOperationalAccounts(fromScope, fromBranchId, isOpen && !!fromBranchId);
  const { data: toChoices = [], isFetching: loadingTo } =
    useOperationalAccounts(toScope, toBranchId, isOpen && !!toBranchId);

  const renderChoice = (it) => {
    const avail = it.available != null ? ` (Avail: ${fmtAmount(it.available)})` : "";
    return `${it.name}${avail}`;
  };

  const amountNum = Number(amount || 0);
  const sameBranch = fromBranchId && toBranchId && fromBranchId === toBranchId;

  const canSubmit =
    !!fromBranchId &&
    !!toBranchId &&
    !sameBranch &&
    !!fromRef &&
    !!toRef &&
    amountNum > 0;

  // ── mutation
  const { mutate: submit, isPending } = useMutation({
    mutationFn: async () => {
      const payload = {
        from_branch_id: parseInt(fromBranchId, 10),
        to_branch_id:   parseInt(toBranchId, 10),
        from_scope:     fromScope,
        from_ref_id:    parseInt(fromRef, 10),
        to_scope:       toScope,
        to_ref_id:      parseInt(toRef, 10),
        amount:         amountNum,
        transfer_date:  transferDate,
        reason:         reason || undefined,
      };
      const ctrl = new AbortController();
      const r = await axiosPrivate.post(
        "/accounting/inter-branch-transfers",
        payload,
        { signal: ctrl.signal }
      );
      return r?.data?.data;
    },
    onSuccess: (d) => {
      toast({
        title: "Transfer Posted",
        description: `Code: ${d?.transaction_code ?? "—"} | Amount: ${fmtAmount(amountNum)}`,
      });
      onSuccess?.();
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.messages ??
        err?.message ??
        "Failed to post transfer";
      toast({
        title: "Error",
        description: Array.isArray(msg) ? msg.join(", ") : msg,
        variant: "destructive",
      });
    },
  });

  if (!isSaccoUser) {
    return (
      <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Inter-Branch Transfer</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-4">
            Only SACCO-level users can create inter-branch transfers.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>New Inter-Branch Transfer</DialogTitle>
          <DialogDescription>
            Move funds between two branches via the SACCO clearing account.
          </DialogDescription>
          <DialogClose asChild>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:outline-none"
            >
              <X className="h-4 w-4" />
            </button>
          </DialogClose>
        </DialogHeader>

        <div className="space-y-5">
          {/* Date */}
          <DateField
            value={transferDate}
            onChange={setTransferDate}
            label="Transfer Date"
            className="w-full"
          />

          {/* FROM side */}
          <div className="rounded-md border p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              From
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label>Branch</Label>
                <Select
                  value={fromBranchId}
                  onValueChange={(v) => { setFromBranchId(v); setFromRef(""); }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Scope</Label>
                <Select
                  value={fromScope}
                  onValueChange={(v) => { setFromScope(v); setFromRef(""); }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SCOPES.map((s) => (
                      <SelectItem key={s.v} value={s.v}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Account</Label>
                <Select
                  value={fromRef}
                  onValueChange={setFromRef}
                  disabled={!fromBranchId || loadingFrom}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingFrom ? "Loading…" : "Select Account"} />
                  </SelectTrigger>
                  <SelectContent>
                    {fromChoices.map((it) => (
                      <SelectItem key={it.ref_id} value={it.ref_id}>
                        {renderChoice(it)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Arrow separator */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="flex-1 border-t" />
            <ArrowRight className="h-4 w-4 shrink-0" />
            <div className="flex-1 border-t" />
          </div>

          {/* TO side */}
          <div className="rounded-md border p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              To
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label>Branch</Label>
                <Select
                  value={toBranchId}
                  onValueChange={(v) => { setToBranchId(v); setToRef(""); }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {sameBranch && (
                  <p className="text-xs text-red-600 mt-1">Must be a different branch.</p>
                )}
              </div>

              <div>
                <Label>Scope</Label>
                <Select
                  value={toScope}
                  onValueChange={(v) => { setToScope(v); setToRef(""); }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SCOPES.map((s) => (
                      <SelectItem key={s.v} value={s.v}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Account</Label>
                <Select
                  value={toRef}
                  onValueChange={setToRef}
                  disabled={!toBranchId || loadingTo}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingTo ? "Loading…" : "Select Account"} />
                  </SelectTrigger>
                  <SelectContent>
                    {toChoices.map((it) => (
                      <SelectItem key={it.ref_id} value={it.ref_id}>
                        {renderChoice(it)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Amount */}
          <div>
            <Label>Amount</Label>
            <Input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>

          {/* Reason */}
          <div>
            <Label>Reason (optional)</Label>
            <Textarea
              placeholder="Short reason for audit trail…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            onClick={() => submit()}
            disabled={isPending || !canSubmit}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending ? "Posting…" : "Post Transfer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

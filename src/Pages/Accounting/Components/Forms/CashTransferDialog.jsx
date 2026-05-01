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
import { X, Loader2 } from "lucide-react";

/** Cash transfer directions (includes mobile money) */
const TYPES = [
  { v: "till_to_safe", label: "Till → Safe", from: "till", to: "safe" },
  { v: "safe_to_till", label: "Safe → Till", from: "safe", to: "till" },
  { v: "safe_to_bank", label: "Safe → Bank", from: "safe", to: "bank" },
  { v: "bank_to_safe", label: "Bank → Safe", from: "bank", to: "safe" },
  { v: "till_to_bank", label: "Till → Bank", from: "till", to: "bank" },
  { v: "till_to_till", label: "Till → Till", from: "till", to: "till" },
  { v: "mobile_money_to_till",  label: "Mobile Money → Till",  from: "mobile_money", to: "till" },
  { v: "till_to_mobile_money",  label: "Till → Mobile Money",  from: "till",         to: "mobile_money" },
  { v: "mobile_money_to_safe",  label: "Mobile Money → Safe",  from: "mobile_money", to: "safe" },
  { v: "safe_to_mobile_money",  label: "Safe → Mobile Money",  from: "safe",         to: "mobile_money" },
  { v: "mobile_money_to_bank",  label: "Mobile Money → Bank",  from: "mobile_money", to: "bank" },
  { v: "bank_to_mobile_money",  label: "Bank → Mobile Money",  from: "bank",         to: "mobile_money" },
];

function getTypeMeta(type) {
  return TYPES.find((t) => t.v === type);
}

function fmtAmount(n) {
  if (n == null) return "";
  const num = Number(n);
  if (Number.isNaN(num)) return "";
  return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default function CashTransferDialog({
  isOpen,
  onClose,
  defaultDate,
  defaultBranchId,
  isSaccoUser,
  onSuccess,
}) {
  const axiosPrivate = useAxiosPrivate();
  const { auth } = useAuth();

  const user = auth?.user ?? {};
  const branchLockedId = !isSaccoUser
    ? auth?.current_branch_id ?? user?.branch_id ?? null
    : null;

  // ── form state
  const [businessDate, setBusinessDate] = React.useState(
    defaultDate || new Date().toISOString().slice(0, 10)
  );
  const [branchId, setBranchId] = React.useState(
    isSaccoUser
      ? defaultBranchId || ""
      : branchLockedId
      ? String(branchLockedId)
      : ""
  );
  const [type, setType] = React.useState("till_to_safe");
  const [fromRef, setFromRef] = React.useState("");
  const [toRef, setToRef] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [channelId, setChannelId] = React.useState("");
  const [narration, setNarration] = React.useState("");

  // reset on open
  React.useEffect(() => {
    if (isOpen) {
      setBusinessDate(defaultDate || new Date().toISOString().slice(0, 10));
      setBranchId(
        isSaccoUser ? defaultBranchId || "" : branchLockedId ? String(branchLockedId) : ""
      );
      setType("till_to_safe");
      setFromRef("");
      setToRef("");
      setAmount("");
      setChannelId("");
      setNarration("");
    }
  }, [isOpen, defaultDate, defaultBranchId, isSaccoUser, branchLockedId]);

  const meta = getTypeMeta(type);

  // ── branches (SACCO users only)
  const { data: branchesRaw = [] } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const ctrl = new AbortController();
      const r = await axiosPrivate.get("/settings/branches", { signal: ctrl.signal });
      const raw = r?.data?.data?.branches ?? [];
      return raw.map((b) => ({ id: b.id ?? b.branch_id, name: b.name ?? b.branch_name }));
    },
    enabled: isSaccoUser,
  });

  const branches = (branchesRaw ?? [])
    .map((b) => ({ id: String(b.id ?? ""), name: b.name ?? `Branch #${b.id}` }))
    .filter((b) => b.id !== "");

  // ── channels (optional)
  const { data: channelsRaw = [] } = useQuery({
    queryKey: ["txn-channels"],
    queryFn: async () => {
      const ctrl = new AbortController();
      const r = await axiosPrivate.get("/settings/transaction-channels", {
        signal: ctrl.signal,
      });
      const raw = r?.data?.data?.channels ?? r?.data?.data ?? [];
      return raw.map((c) => ({
        id: c.id ?? c.channel_id,
        name: c.name ?? c.channel_name ?? `Channel #${c.id ?? c.channel_id}`,
      }));
    },
  });
  const channels = (channelsRaw ?? []).filter((c) => c?.id != null);

  // ── helper to load operational accounts by scope
  const useOperationalList = (scope, enabled) =>
    useQuery({
      queryKey: ["operational-accounts", scope, branchId],
      queryFn: async () => {
        const ctrl = new AbortController();
        const params = new URLSearchParams();
        params.set("scope", scope);
        if (isSaccoUser && branchId) params.set("branch_id", branchId);
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
            account_id: it.account_id ?? null,
            available: it.available ?? null,
          }));
      },
      enabled,
      staleTime: 10_000,
    });

  const fromEnabled = isOpen && (!isSaccoUser || !!branchId);
  const toEnabled   = isOpen && (!isSaccoUser || !!branchId);

  const { data: fromChoices = [], isFetching: loadingFrom } =
    useOperationalList(meta?.from ?? "till", fromEnabled);
  const { data: toChoices = [], isFetching: loadingTo } =
    useOperationalList(meta?.to ?? "safe", toEnabled);

  // ── validations
  const sameTillInvalid =
    type === "till_to_till" &&
    fromRef &&
    toRef &&
    String(fromRef) === String(toRef);

  const amountNum = Number(amount || 0);

  // ── submit
  const { mutate: submit, isPending } = useMutation({
    mutationFn: async () => {
      if (!amountNum || amountNum <= 0) throw new Error("Amount must be greater than zero");
      if (!meta) throw new Error("Invalid transfer type");
      if (!fromRef || !toRef) throw new Error("Select both source and destination");
      if (sameTillInvalid) throw new Error("Cannot transfer to the same till");

      const payload = {
        transfer_date: businessDate,
        business_date: businessDate,
        transfer_type: type,
        from_scope:    meta.from,
        from_ref_id:   parseInt(fromRef, 10),
        to_scope:      meta.to,
        to_ref_id:     parseInt(toRef, 10),
        amount:        amountNum,
        narration:     narration || undefined,
        channel_id:    channelId && channelId !== "none" ? parseInt(channelId, 10) : undefined,
        ...(isSaccoUser && branchId ? { branch_id: parseInt(branchId, 10) } : {}),
      };

      const ctrl = new AbortController();
      const r = await axiosPrivate.post("/accounting/cash-transfers", payload, {
        signal: ctrl.signal,
      });
      return r?.data?.data;
    },
    onSuccess: (d) => {
      toast({
        title: "Success",
        description: `Transfer created (Code: ${d?.transaction_code ?? "—"})`,
      });
      onSuccess?.();
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.messages ??
        err?.message ??
        "Failed to create transfer";
      toast({
        title: "Error",
        description: Array.isArray(msg) ? msg.join(", ") : msg,
        variant: "destructive",
      });
    },
  });

  // label with available balance (if present)
  const renderChoice = (it) => {
    const avail =
      it.available != null ? ` (Avail: ${fmtAmount(it.available)})` : "";
    return `${it.name}${avail}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[680px]">
        <DialogHeader>
          <DialogTitle>New Cash Transfer</DialogTitle>
          <DialogDescription>
            Post a double-entry journal and keep a backup row for the transfer.
          </DialogDescription>

          {/* Close icon */}
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

        {/* Form */}
        <div className="space-y-4">
          {/* Row 1: Date + Type + Branch (for SACCO users) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <DateField value={businessDate} onChange={setBusinessDate} label="Business Date" className="w-full" />

            <div>
              <Label>Transfer Type</Label>
              <Select
                value={type}
                onValueChange={(v) => { setType(v); setFromRef(""); setToRef(""); }}
              >
                <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => <SelectItem key={t.v} value={t.v}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {isSaccoUser && (
              <div>
                <Label>Branch</Label>
                <Select value={branchId} onValueChange={(v) => { setBranchId(v); setFromRef(""); setToRef(""); }}>
                  <SelectTrigger><SelectValue placeholder="Select Branch" /></SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* From / To account pickers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>From ({(meta?.from ?? "—").replace("_", " ").toUpperCase()})</Label>
              <Select
                value={fromRef}
                onValueChange={setFromRef}
                disabled={loadingFrom || (isSaccoUser && !branchId)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingFrom ? "Loading…" : "Select Source"} />
                </SelectTrigger>
                <SelectContent>
                  {fromChoices.map((it) => (
                    <SelectItem key={String(it.ref_id)} value={String(it.ref_id)}>{renderChoice(it)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>To ({(meta?.to ?? "—").replace("_", " ").toUpperCase()})</Label>
              <Select
                value={toRef}
                onValueChange={setToRef}
                disabled={loadingTo || (isSaccoUser && !branchId)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingTo ? "Loading…" : "Select Destination"} />
                </SelectTrigger>
                <SelectContent>
                  {toChoices.map((it) => (
                    <SelectItem key={String(it.ref_id)} value={String(it.ref_id)}>{renderChoice(it)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {sameTillInvalid && (
                <p className="text-xs text-red-600 mt-1">You can&apos;t transfer to the same till.</p>
              )}
            </div>
          </div>

          {/* Amount + Channel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Amount</Label>
              <Input
                type="number" inputMode="decimal" min="0" step="0.01"
                value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00"
              />
            </div>
            <div>
              <Label>Channel (optional)</Label>
              <Select value={channelId || "none"} onValueChange={(v) => setChannelId(v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Select Channel" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {channels.map((c) => (
                    <SelectItem key={String(c.id)} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Reason / Narration (optional)</Label>
            <Textarea placeholder="Short reason for audit trail…" value={narration} onChange={(e) => setNarration(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            onClick={() => submit()}
            disabled={
              isPending ||
              !businessDate ||
              !type ||
              !fromRef ||
              !toRef ||
              !amount ||
              Number(amount) <= 0 ||
              sameTillInvalid ||
              (isSaccoUser && !branchId)
            }
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending ? "Posting…" : "Post Transfer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

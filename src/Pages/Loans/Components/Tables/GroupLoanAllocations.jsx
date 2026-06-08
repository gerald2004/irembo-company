import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Users, ChevronDown, ChevronRight, CalendarDays,
  Wallet, LockKeyhole, CreditCard, AlertCircle, RefreshCw,
} from "lucide-react";

const fmt = (v) =>
  Number(v ?? 0).toLocaleString("en-UG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const pct = (paid, total) =>
  total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;

const statusVariant = (s) => {
  if (s === "paid")                         return "default";
  if (s === "overdue" || s === "defaulted") return "destructive";
  if (s === "partial")                      return "secondary";
  return "outline";
};

const schedStatusVariant = (s) => {
  if (s === "paid")    return "default";
  if (s === "overdue") return "destructive";
  if (s === "partial") return "secondary";
  return "outline";
};

// ── Per-member schedule rows ──────────────────────────────────────────────────
const MemberScheduleRows = ({ memberId, loanid, axiosPrivate }) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["group-member-schedules", loanid, memberId],
    queryFn: async () => {
      const res = await axiosPrivate.get(
        `/loans/${loanid}/group-member-schedules?member_id=${memberId}`
      );
      const byMember = res.data?.data?.by_member ?? [];
      return byMember.find((m) => Number(m.member_id) === Number(memberId))?.schedules ?? [];
    },
  });

  if (isLoading)
    return (
      <TableRow>
        <TableCell colSpan={11} className="py-3 pl-10 bg-slate-50 dark:bg-slate-800/50">
          <Skeleton className="h-8 w-full" />
        </TableCell>
      </TableRow>
    );

  if (isError || !data?.length)
    return (
      <TableRow>
        <TableCell colSpan={11} className="py-3 pl-10 bg-slate-50 text-xs text-muted-foreground">
          No schedule found for this member.
        </TableCell>
      </TableRow>
    );

  return (
    <>
      <TableRow className="bg-slate-50 dark:bg-slate-800/50">
        <TableCell colSpan={11} className="pl-10 py-1">
          <div className="flex items-center gap-1 text-xs text-muted-foreground font-semibold uppercase tracking-wide">
            <CalendarDays className="w-3 h-3" /> Repayment Schedule
          </div>
        </TableCell>
      </TableRow>
      <TableRow className="bg-slate-100 dark:bg-slate-700/60">
        <TableCell className="pl-10 py-1 text-xs font-semibold text-muted-foreground">#</TableCell>
        <TableCell className="py-1 text-xs font-semibold text-muted-foreground">Due Date</TableCell>
        <TableCell className="py-1 text-right text-xs font-semibold text-muted-foreground">Principal</TableCell>
        <TableCell className="py-1 text-right text-xs font-semibold text-muted-foreground">Interest</TableCell>
        <TableCell className="py-1 text-right text-xs font-semibold text-muted-foreground">Monitoring</TableCell>
        <TableCell className="py-1 text-right text-xs font-semibold text-muted-foreground">Paid</TableCell>
        <TableCell className="py-1 text-right text-xs font-semibold text-muted-foreground">Balance</TableCell>
        <TableCell className="py-1 text-xs font-semibold text-muted-foreground" colSpan={4}>Status</TableCell>
      </TableRow>
      {data.map((s) => {
        const totalDue  = (s.principal ?? 0) + (s.interest ?? 0) + (s.monitoring_amount ?? 0) + (s.penalties ?? 0);
        const totalPaid = (s.principal_paid ?? 0) + (s.interest_paid ?? 0) + (s.monitoring_paid ?? 0) + (s.penalties_paid ?? 0);
        const balance   = Math.max(0, totalDue - totalPaid);
        return (
          <TableRow key={s.id} className="bg-slate-50 dark:bg-slate-800/40 text-xs">
            <TableCell className="pl-10 py-1.5">{s.period}</TableCell>
            <TableCell className="py-1.5">{s.due_date}</TableCell>
            <TableCell className="py-1.5 text-right">{fmt(s.principal)}</TableCell>
            <TableCell className="py-1.5 text-right">{fmt(s.interest)}</TableCell>
            <TableCell className="py-1.5 text-right">{fmt(s.monitoring_amount)}</TableCell>
            <TableCell className="py-1.5 text-right text-green-700 font-medium">{fmt(totalPaid)}</TableCell>
            <TableCell className="py-1.5 text-right text-orange-600 font-medium">{fmt(balance)}</TableCell>
            <TableCell className="py-1.5" colSpan={4}>
              <Badge variant={schedStatusVariant(s.status)} className="text-xs capitalize">
                {s.status}
              </Badge>
            </TableCell>
          </TableRow>
        );
      })}
    </>
  );
};

// ── Pay dialog ────────────────────────────────────────────────────────────────
const PayDialog = ({ allocation, loanid, axiosPrivate, onClose }) => {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [error, setError]   = useState("");

  const memberName = `${allocation.member?.client_firstname ?? ""} ${allocation.member?.client_lastname ?? ""}`.trim();
  const savingsBalance = allocation.savings_balance ?? 0;
  const loanBalance    = allocation.balance ?? 0;
  const amountNum      = parseFloat(amount) || 0;

  const insufficientSavings = amountNum > 0 && amountNum > savingsBalance;
  const exceedsLoanBalance  = amountNum > 0 && amountNum > loanBalance;

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await axiosPrivate.post(`/loans/${loanid}/group-allocations`, {
        member_id: allocation.member_id,
        amount:    amountNum,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-loan-allocations", loanid] });
      queryClient.invalidateQueries({ queryKey: ["group-member-schedules", loanid] });
      onClose();
    },
    onError: (e) => {
      setError(e?.response?.data?.messages?.[0] ?? e?.response?.data?.message ?? "Payment failed.");
    },
  });

  const handlePay = () => {
    setError("");
    if (!amountNum || amountNum <= 0) { setError("Enter a valid amount."); return; }
    if (insufficientSavings) { setError("Insufficient savings balance."); return; }
    if (exceedsLoanBalance)  { setError("Amount exceeds remaining loan balance."); return; }
    mutation.mutate();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> Pay Loan — {memberName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="border rounded-lg p-3">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Wallet className="w-3 h-3" /> Group Savings Balance
              </p>
              <p className={`font-bold mt-0.5 ${insufficientSavings ? "text-red-600" : "text-blue-700"}`}>
                UGX {fmt(savingsBalance)}
              </p>
            </div>
            <div className="border rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Loan Balance</p>
              <p className="font-bold mt-0.5 text-orange-600">UGX {fmt(loanBalance)}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pay-amount">Payment Amount (UGX)</Label>
            <Input
              id="pay-amount"
              type="number"
              min="1"
              step="1000"
              placeholder="0"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setError(""); }}
              className={insufficientSavings || exceedsLoanBalance ? "border-red-400" : ""}
            />
            {insufficientSavings && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Savings balance (UGX {fmt(savingsBalance)}) is less than the payment amount.
              </p>
            )}
            {!insufficientSavings && exceedsLoanBalance && (
              <p className="text-xs text-amber-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Amount exceeds loan balance — will be capped at UGX {fmt(loanBalance)}.
              </p>
            )}
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded px-3 py-2">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>Cancel</Button>
          <Button
            onClick={handlePay}
            disabled={mutation.isPending || !amountNum || insufficientSavings}
          >
            {mutation.isPending ? "Processing…" : "Confirm Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ── Re-Loan / Top-Up dialog ───────────────────────────────────────────────────
const ReLoanDialog = ({ allocation, loanid, axiosPrivate, onClose }) => {
  const queryClient = useQueryClient();
  const [newAmount, setNewAmount]     = useState("");
  const [tenure, setTenure]           = useState(allocation.tenure_period ?? "");
  const [rate, setRate]               = useState(allocation.interest_rate ?? "");
  const [loanType, setLoanType]       = useState(allocation.loan_type ?? "reducing_balance");
  const [error, setError]             = useState("");

  const memberName = `${allocation.member?.client_firstname ?? ""} ${allocation.member?.client_lastname ?? ""}`.trim();
  const outstanding = allocation.balance ?? 0;
  const newAmountNum = parseFloat(newAmount) || 0;
  const netDisbursed = Math.max(0, newAmountNum - outstanding);

  const mutation = useMutation({
    mutationFn: async () => {
      const body = { new_amount: newAmountNum };
      if (tenure)   body.tenure_period  = parseInt(tenure);
      if (rate)     body.interest_rate  = parseFloat(rate);
      if (loanType) body.loan_type      = loanType;

      const res = await axiosPrivate.patch(
        `/loans/${loanid}/group-allocations?allocation_id=${allocation.id}&action=group_topup`,
        body
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["group-loan-allocations", loanid] });
      queryClient.invalidateQueries({ queryKey: ["group-member-schedules", loanid] });
      onClose();
    },
    onError: (e) => {
      setError(e?.response?.data?.messages?.[0] ?? e?.response?.data?.message ?? "Top-up failed.");
    },
  });

  const handleSubmit = () => {
    setError("");
    if (!newAmountNum || newAmountNum <= 0) { setError("Enter a valid new loan amount."); return; }
    if (newAmountNum < outstanding) {
      setError(`New amount (${fmt(newAmountNum)}) must be ≥ outstanding balance (${fmt(outstanding)}).`);
      return;
    }
    mutation.mutate();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Re-Loan / Top-Up — {memberName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Info cards */}
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="border rounded-lg p-2.5">
              <p className="text-xs text-muted-foreground">Outstanding</p>
              <p className="font-bold text-orange-600 mt-0.5">UGX {fmt(outstanding)}</p>
            </div>
            <div className="border rounded-lg p-2.5">
              <p className="text-xs text-muted-foreground">Cycle #</p>
              <p className="font-bold mt-0.5">{allocation.cycle_number ?? "—"} → {(allocation.cycle_number ?? 0) + 1}</p>
            </div>
            <div className="border rounded-lg p-2.5">
              <p className="text-xs text-muted-foreground">Net Disbursed</p>
              <p className="font-bold text-green-700 mt-0.5">UGX {fmt(netDisbursed)}</p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded px-3 py-2">
            The outstanding balance ({fmt(outstanding)}) is settled internally. The member receives the net difference as fresh disbursement. A new loan cycle is opened and the old one closed.
          </p>

          {/* New amount */}
          <div className="space-y-1.5">
            <Label htmlFor="new-amount">New Loan Amount (UGX) <span className="text-red-500">*</span></Label>
            <Input
              id="new-amount"
              type="number"
              min={outstanding}
              step="1000"
              placeholder={`Min: ${fmt(outstanding)}`}
              value={newAmount}
              onChange={(e) => { setNewAmount(e.target.value); setError(""); }}
            />
          </div>

          {/* Optional overrides */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Tenure (periods)</Label>
              <Input
                type="number"
                min="1"
                placeholder="inherit"
                value={tenure}
                onChange={(e) => setTenure(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Interest Rate (%)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="inherit"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Loan Type</Label>
              <Select value={loanType} onValueChange={setLoanType}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reducing_balance">Reducing Balance</SelectItem>
                  <SelectItem value="fixed">Fixed Rate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded px-3 py-2">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={mutation.isPending || !newAmountNum || newAmountNum < outstanding}
          >
            {mutation.isPending ? "Processing…" : "Confirm Re-Loan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const GroupLoanAllocations = () => {
  const axiosPrivate = useAxiosPrivate();
  const { loanid }   = useParams();
  const [expandedMember, setExpandedMember]   = useState(null);
  const [payingAllocation, setPayingAllocation] = useState(null);
  const [reloanAllocation, setReloanAllocation] = useState(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["group-loan-allocations", loanid],
    queryFn: async () => {
      const res = await axiosPrivate.get(`/loans/${loanid}/group-allocations`);
      return res.data.data;
    },
  });

  if (isLoading)
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );

  if (isError)
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Failed to load group loan allocations.</p>
      </div>
    );

  const allocations  = data?.allocations ?? [];
  const totals       = data?.totals ?? {};

  if (allocations.length === 0)
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="font-medium">No member allocations recorded for this loan.</p>
        <p className="text-xs mt-1">
          Submit loan with <code className="bg-muted px-1 rounded">member_allocations</code> to create per-member splits.
        </p>
      </div>
    );

  const overallPct   = pct(totals.total_paid, totals.total_allocated);
  const totalSavings = allocations.reduce((s, a) => s + (a.savings_balance ?? 0), 0);
  const totalFrozen  = allocations.reduce((s, a) => s + (a.frozen_balance  ?? 0), 0);

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total Allocated", value: totals.total_allocated, accent: "text-foreground" },
          { label: "Total Paid",      value: totals.total_paid,      accent: "text-green-700" },
          { label: "Loan Balance",    value: totals.total_balance,   accent: "text-orange-600" },
          { label: "Group Savings",   value: totalSavings,           accent: "text-blue-700",   icon: <Wallet className="w-3.5 h-3.5 mr-1 inline" /> },
          { label: "Frozen (Total)",  value: totalFrozen,            accent: "text-purple-700", icon: <LockKeyhole className="w-3.5 h-3.5 mr-1 inline" /> },
        ].map((c) => (
          <div key={c.label} className="border rounded-lg p-3 bg-white dark:bg-slate-900">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              {c.icon}{c.label}
            </p>
            <p className={`text-base font-bold mt-1 ${c.accent}`}>UGX {fmt(c.value)}</p>
          </div>
        ))}
      </div>

      {/* Overall progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Group Repayment Progress</span>
          <span>{overallPct}%</span>
        </div>
        <Progress value={overallPct} className="h-2" />
      </div>

      <p className="text-xs text-muted-foreground">
        Click a member row to view their schedule. Use <strong>Pay</strong> to record a payment or <strong>Re-Loan</strong> to close & re-issue the member's allocation.
      </p>

      {/* Per-member table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50 dark:bg-slate-800/60">
            <TableRow>
              <TableHead className="w-6" />
              <TableHead>Member</TableHead>
              <TableHead>Cycle</TableHead>
              <TableHead>Account No.</TableHead>
              <TableHead className="text-right">Allocated</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Loan Bal.</TableHead>
              <TableHead className="text-right text-blue-700">Group Savings</TableHead>
              <TableHead className="text-right text-purple-700">Frozen</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allocations.map((a) => {
              const memberPct = pct(a.amount_paid, a.allocated_amount);
              const isOpen    = expandedMember === a.member_id;
              const canPay    = a.status !== "paid";
              const canReloan = a.status !== "paid" && (a.balance ?? 0) > 0;
              return (
                <>
                  <TableRow
                    key={a.id}
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    onClick={() => setExpandedMember(isOpen ? null : a.member_id)}
                  >
                    <TableCell className="w-6 py-3">
                      {isOpen
                        ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      {a.member?.client_firstname} {a.member?.client_lastname}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {a.cycle_number != null
                        ? <Badge variant="outline" className="text-xs">Cycle {a.cycle_number}</Badge>
                        : "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {a.member?.client_account_number ?? "—"}
                    </TableCell>
                    <TableCell className="text-right text-sm">{fmt(a.allocated_amount)}</TableCell>
                    <TableCell className="text-right text-sm text-green-700 font-medium">{fmt(a.amount_paid)}</TableCell>
                    <TableCell className="text-right text-sm text-orange-600 font-medium">{fmt(a.balance)}</TableCell>
                    <TableCell className="text-right text-sm text-blue-700 font-medium">{fmt(a.savings_balance)}</TableCell>
                    <TableCell className="text-right text-sm text-purple-700 font-medium">{fmt(a.frozen_balance)}</TableCell>
                    <TableCell className="w-28">
                      <div className="space-y-0.5">
                        <Progress value={memberPct} className="h-1.5" />
                        <p className="text-xs text-muted-foreground text-right">{memberPct}%</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(a.status)} className="capitalize text-xs">
                        {a.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        {canPay && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs"
                            onClick={() => setPayingAllocation(a)}
                          >
                            <CreditCard className="w-3 h-3 mr-1" /> Pay
                          </Button>
                        )}
                        {canReloan && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                            onClick={() => setReloanAllocation(a)}
                          >
                            <RefreshCw className="w-3 h-3 mr-1" /> Re-Loan
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  {isOpen && (
                    <MemberScheduleRows
                      key={`schedule-${a.member_id}`}
                      memberId={a.member_id}
                      loanid={loanid}
                      axiosPrivate={axiosPrivate}
                    />
                  )}
                </>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pay dialog */}
      {payingAllocation && (
        <PayDialog
          allocation={payingAllocation}
          loanid={loanid}
          axiosPrivate={axiosPrivate}
          onClose={() => setPayingAllocation(null)}
        />
      )}

      {/* Re-Loan dialog */}
      {reloanAllocation && (
        <ReLoanDialog
          allocation={reloanAllocation}
          loanid={loanid}
          axiosPrivate={axiosPrivate}
          onClose={() => setReloanAllocation(null)}
        />
      )}
    </div>
  );
};

export default GroupLoanAllocations;

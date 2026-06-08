/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Lock, AlertCircle, TriangleAlert } from "lucide-react";

const fmt = (v) =>
  Number(v ?? 0).toLocaleString("en-UG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/**
 * Props:
 *   amount           – transaction amount (number)
 *   clientAccountId  – for savings fees (deposit / withdrawal)
 *   loanProductId    – for loan auto charges (disbursement)
 *   trigger          – 'on_saving' | 'on_withdrawal' | 'on_disbursement'
 *   onSkipChange     – (skippedIds: number[]) => void
 *   onOverrideChange – ({ [id]: amount }) => void
 *   onChargesLoaded  – (count: number) => void
 */
const ChargesReviewStep = ({
  amount,
  clientAccountId,
  loanProductId,
  trigger,
  onSkipChange,
  onOverrideChange,
  onChargesLoaded,
}) => {
  const axiosPrivate = useAxiosPrivate();
  const [unchecked, setUnchecked] = useState(new Set());
  const [overrides, setOverrides] = useState({});

  const params = new URLSearchParams({ trigger, amount: amount || 0 });
  if (clientAccountId) params.set("client_account_id", clientAccountId);
  if (loanProductId)   params.set("loan_product_id",   loanProductId);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["charges-preview", trigger, clientAccountId, loanProductId, amount],
    queryFn: async () => {
      const res = await axiosPrivate.get(`/accounting/charges/preview?${params}`);
      return res.data.data;
    },
    enabled: !!trigger && amount > 0 && !!(clientAccountId || loanProductId),
    staleTime: 0,
  });

  useEffect(() => {
    setUnchecked(new Set());
    setOverrides({});
    onSkipChange?.([]);
    onOverrideChange?.({});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  useEffect(() => {
    if (data && onChargesLoaded) {
      onChargesLoaded((data.charges?.length ?? 0) + (data.pending_charges?.length ?? 0));
    }
  }, [data, onChargesLoaded]);

  const toggle = (id, mandatory) => {
    if (mandatory) return;
    setUnchecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      onSkipChange?.([...next]);
      return next;
    });
  };

  const updateOverride = (id, field, rawValue, charge) => {
    const value = parseFloat(rawValue);
    setOverrides((prev) => {
      const current = prev[id] ?? { rate: parseFloat(charge.rate), amount: charge.computed_amount };
      let updated;
      if (field === "rate") {
        const r = isNaN(value) ? 0 : value;
        updated = { rate: r, amount: Math.round(amount * r / 100 * 100) / 100 };
      } else {
        updated = { ...current, amount: isNaN(value) ? 0 : value };
      }
      const next = { ...prev, [id]: updated };
      if (onOverrideChange) {
        const map = {};
        Object.entries(next).forEach(([k, v]) => { map[Number(k)] = v.amount; });
        onOverrideChange(map);
      }
      return next;
    });
  };

  if (!amount || amount <= 0) {
    return (
      <p className="text-center py-8 text-sm text-muted-foreground">
        Enter an amount in the previous step to see applicable charges.
      </p>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-11 w-full rounded-lg" />)}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800/40 px-4 py-3 text-sm text-red-600 dark:text-red-400">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
        <span>Failed to load charges. You may proceed — charges will still be applied automatically.</span>
      </div>
    );
  }

  const charges        = data?.charges        ?? [];
  const pendingCharges = data?.pending_charges ?? [];

  if (charges.length === 0 && pendingCharges.length === 0) {
    return (
      <p className="text-center py-8 text-sm text-muted-foreground">
        No charges apply for this transaction.
      </p>
    );
  }

  const totalOnSaving = charges.reduce((sum, c) => {
    if (!c.mandatory && unchecked.has(c.id)) return sum;
    const amt = (!c.mandatory && overrides[c.id]?.amount !== undefined)
      ? overrides[c.id].amount : (c.computed_amount ?? 0);
    return sum + amt;
  }, 0);

  const totalPending = pendingCharges.reduce((sum, c) => sum + (c.amount ?? 0), 0);
  const grandTotal   = totalOnSaving + totalPending;
  const netCredit    = Math.max(0, amount - grandTotal);

  return (
    <div className="space-y-5">

      {/* ── On-saving product fees ── */}
      {charges.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
            Transaction Charges
          </p>
          <div className="rounded-lg border divide-y overflow-hidden">
            {charges.map((c) => {
              const isMandatory  = c.mandatory;
              const isSkipped    = !isMandatory && unchecked.has(c.id);
              const ov           = overrides[c.id];
              const isPercentage = c.calculated_as === "percentage";
              const displayRate   = ov?.rate   ?? parseFloat(c.rate);
              const displayAmount = ov?.amount  ?? c.computed_amount;
              const editable      = !isMandatory && !isSkipped;

              return (
                <div
                  key={c.id}
                  className={`flex items-center gap-3 px-4 py-3 transition-opacity ${isSkipped ? "opacity-40" : ""}`}
                >
                  {/* Toggle / lock */}
                  <div className="shrink-0 w-5 flex justify-center">
                    {isMandatory
                      ? <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                      : <Checkbox
                          checked={!isSkipped}
                          onCheckedChange={() => toggle(c.id, isMandatory)}
                          id={`charge-${c.id}`}
                        />
                    }
                  </div>

                  {/* Label */}
                  <label
                    htmlFor={`charge-${c.id}`}
                    className={`flex-1 text-sm truncate ${isMandatory ? "text-muted-foreground" : "cursor-pointer"}`}
                  >
                    {c.title}
                    {isMandatory && (
                      <span className="ml-2 text-[10px] uppercase tracking-wide text-muted-foreground/60">required</span>
                    )}
                  </label>

                  {/* Editable rate (percentage adjustable only) */}
                  {editable && isPercentage && (
                    <div className="flex items-center gap-1 shrink-0">
                      <Input
                        type="number" step="0.01" min="0" max="100"
                        value={displayRate}
                        onChange={(e) => updateOverride(c.id, "rate", e.target.value, c)}
                        className="h-7 w-16 text-xs text-right px-1"
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                  )}

                  {/* Amount */}
                  <div className="shrink-0 w-32 text-right">
                    {isMandatory || isSkipped ? (
                      <span className={`text-sm font-medium tabular-nums ${isSkipped ? "line-through text-muted-foreground" : ""}`}>
                        UGX {fmt(c.computed_amount)}
                      </span>
                    ) : isPercentage ? (
                      <span className="text-sm font-medium tabular-nums">UGX {fmt(displayAmount)}</span>
                    ) : (
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-xs text-muted-foreground">UGX</span>
                        <Input
                          type="number" step="0.01" min="0"
                          value={displayAmount}
                          onChange={(e) => updateOverride(c.id, "amount", e.target.value, c)}
                          className="h-7 w-24 text-xs text-right px-1"
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground px-1">
            Uncheck optional charges to skip them. Mandatory charges cannot be removed.
          </p>
        </div>
      )}

      {/* ── Outstanding pending fees ── */}
      {pendingCharges.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <TriangleAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Outstanding Fees
            </p>
            <span className="ml-auto text-xs text-muted-foreground">Auto-collected on this deposit</span>
          </div>

          <div className="rounded-lg border border-amber-200 dark:border-amber-700/50 divide-y divide-amber-100 dark:divide-amber-800/30 overflow-hidden">
            {pendingCharges.map((c) => (
              <div key={c.id} className="flex items-center gap-3 px-4 py-3 bg-amber-50/60 dark:bg-amber-900/10">
                <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{c.title}</p>
                  {c.status === "partial_payment" && (
                    <p className="text-xs text-muted-foreground">Partially paid — remaining balance shown</p>
                  )}
                </div>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-amber-700 dark:text-amber-400">
                  − UGX {fmt(c.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Summary ── */}
      <div className="rounded-lg border bg-muted/30 divide-y">
        {charges.length > 0 && pendingCharges.length > 0 && (
          <>
            <div className="flex justify-between px-4 py-2.5 text-sm text-muted-foreground">
              <span>Transaction charges</span>
              <span className="tabular-nums">− UGX {fmt(totalOnSaving)}</span>
            </div>
            <div className="flex justify-between px-4 py-2.5 text-sm text-muted-foreground">
              <span>Outstanding fees</span>
              <span className="tabular-nums">− UGX {fmt(totalPending)}</span>
            </div>
          </>
        )}
        <div className="flex justify-between px-4 py-2.5 text-sm font-semibold">
          <span>Total deductions</span>
          <span className="tabular-nums">− UGX {fmt(grandTotal)}</span>
        </div>
        <div className="flex justify-between px-4 py-2.5 text-sm bg-muted/40 rounded-b-lg">
          <span className="text-muted-foreground">Net credit to account</span>
          <span className="tabular-nums font-semibold">UGX {fmt(netCredit)}</span>
        </div>
      </div>

    </div>
  );
};

export default ChargesReviewStep;

/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Lock, AlertCircle } from "lucide-react";

const fmt = (v) =>
  Number(v ?? 0).toLocaleString("en-UG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/**
 * Renders a charges review list for deposit, withdrawal, or loan disbursement.
 *
 * Props:
 *   amount          – transaction amount (number)
 *   clientAccountId – for savings fees (deposit / withdrawal)
 *   loanProductId   – for loan auto charges (disbursement)
 *   trigger         – 'on_saving' | 'on_withdrawal' | 'on_disbursement'
 *   onSkipChange    – (skippedIds: number[]) => void
 *   onOverrideChange– ({ [id]: amount }) => void  — custom amounts for adjustable charges
 */
const ChargesReviewStep = ({
  amount,
  clientAccountId,
  loanProductId,
  trigger,
  onSkipChange,
  onOverrideChange,
}) => {
  const axiosPrivate = useAxiosPrivate();
  const [unchecked, setUnchecked] = useState(new Set());
  const [overrides, setOverrides] = useState({}); // { [id]: { rate, amount } }

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

  // Reset state when charges list changes (new query result)
  useEffect(() => {
    setUnchecked(new Set());
    setOverrides({});
    onSkipChange([]);
    onOverrideChange?.({});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const toggle = (id, mandatory) => {
    if (mandatory) return;
    setUnchecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      onSkipChange([...next]);
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
      <div className="text-center py-6 text-muted-foreground text-sm">
        Enter an amount in the previous step to see applicable charges.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-500 py-4">
        <AlertCircle className="w-4 h-4" />
        Failed to load charges. You may proceed — charges will be applied automatically.
      </div>
    );
  }

  const charges = data?.charges ?? [];

  if (charges.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground text-sm">
        No charges apply for this transaction.
      </div>
    );
  }

  const totalApplied = charges.reduce((sum, c) => {
    if (!c.mandatory && unchecked.has(c.id)) return sum;
    const amt = (!c.mandatory && overrides[c.id]?.amount !== undefined)
      ? overrides[c.id].amount
      : (c.computed_amount ?? 0);
    return sum + amt;
  }, 0);

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Mandatory charges are locked. Adjust optional charges or uncheck to skip them.
      </p>

      <div className="border rounded-md divide-y">
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
              className={`flex items-center gap-3 px-4 py-3 ${isSkipped ? "opacity-50" : ""}`}
            >
              {isMandatory ? (
                <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
              ) : (
                <Checkbox
                  checked={!isSkipped}
                  onCheckedChange={() => toggle(c.id, isMandatory)}
                  id={`charge-${c.id}`}
                />
              )}

              <label
                htmlFor={`charge-${c.id}`}
                className={`flex-1 text-sm min-w-0 truncate ${isMandatory ? "" : "cursor-pointer"}`}
              >
                {c.title}
              </label>

              <Badge variant={isMandatory ? "secondary" : "outline"} className="text-xs shrink-0">
                {isMandatory ? "Mandatory" : "Optional"}
              </Badge>

              {/* Editable rate input for percentage-based adjustable charges */}
              {editable && isPercentage && (
                <div className="flex items-center gap-1 shrink-0">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={displayRate}
                    onChange={(e) => updateOverride(c.id, "rate", e.target.value, c)}
                    className="h-7 w-16 text-xs text-right px-1"
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
              )}

              {/* Amount column */}
              {isMandatory || isSkipped ? (
                <span className="text-sm font-medium w-28 text-right shrink-0">
                  UGX {fmt(c.computed_amount)}
                </span>
              ) : isPercentage ? (
                // Percentage: amount auto-computed from rate, shown read-only
                <span className="text-sm font-medium w-28 text-right shrink-0">
                  UGX {fmt(displayAmount)}
                </span>
              ) : (
                // Fixed / range: editable amount
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-xs text-muted-foreground">UGX</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={displayAmount}
                    onChange={(e) => updateOverride(c.id, "amount", e.target.value, c)}
                    className="h-7 w-28 text-xs text-right px-1"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-between text-sm font-semibold border-t pt-3">
        <span>Total charges to apply</span>
        <span>UGX {fmt(totalApplied)}</span>
      </div>
    </div>
  );
};

export default ChargesReviewStep;

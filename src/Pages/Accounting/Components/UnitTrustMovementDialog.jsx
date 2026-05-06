/* eslint-disable react/prop-types */
import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { toast } from "@/hooks/use-toast";
import { X, ArrowDownCircle, ArrowUpCircle, TrendingUp } from "lucide-react";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";

const fmt = (v) => Number(v ?? 0).toLocaleString("en-UG");

export function UnitTrustMovementDialog({
  isOpen,
  onClose,
  refetch,
  fdId,
  fdCode,
  clientId,
  clientAccountId,
  currentBalance,
  movementType,
}) {
  const axios = useAxiosPrivate();
  const isDeposit = movementType === "deposit";

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const withdrawalAmount = parseFloat(watch("amount") || 0);

  // Fetch outstanding interest summary when in withdrawal mode
  const { data: summary, isLoading: loadingSummary } = useQuery({
    queryKey: ["fd-movement-summary", fdId],
    queryFn: async () => {
      const res = await axios.get("/accounting/fixed/movement", {
        params: { fd_id: fdId, size: 0 },
      });
      return res.data?.data?.summary ?? null;
    },
    enabled: !!fdId && isOpen && !isDeposit,
    staleTime: 15_000,
  });

  useEffect(() => {
    if (!isOpen) reset();
  }, [isOpen, reset]);

  const outstandingInterest = summary?.outstanding_interest ?? 0;
  const totalCredit = !isDeposit && withdrawalAmount > 0
    ? withdrawalAmount + outstandingInterest
    : 0;

  const onSubmit = async (data) => {
    try {
      const response = await axios.post("/accounting/fixed/movement", {
        fd_id:             fdId,
        client_id:         clientId,
        client_account_id: clientAccountId,
        movement_type:     movementType,
        amount:            parseFloat(data.amount),
        user_pincode:      data.user_pincode,
      });
      toast({
        title: "Success",
        description: response.data.messages?.[0] ?? "Movement recorded.",
      });
      reset();
      refetch?.();
      onClose();
    } catch (error) {
      const msg = error?.response?.data?.messages?.[0] ?? "An error occurred.";
      toast({ title: "Error", variant: "destructive", description: msg });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isDeposit
              ? <ArrowDownCircle className="h-5 w-5 text-green-600" />
              : <ArrowUpCircle className="h-5 w-5 text-amber-600" />
            }
            {isDeposit ? "Top Up" : "Withdraw from"} Unit Trust FD
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium">{fdCode}</span>
            {" · "}Current Balance:{" "}
            <span className="font-semibold text-green-700">{fmt(currentBalance)}</span>
          </DialogDescription>
          <DialogClose asChild>
            <button
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </button>
          </DialogClose>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* Outstanding interest banner — withdrawal only */}
          {!isDeposit && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-1.5">
              <p className="text-xs font-medium text-amber-800 flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5" /> Accrued Interest to be Settled
              </p>
              {loadingSummary ? (
                <Skeleton className="h-5 w-32" />
              ) : (
                <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
                  <span className="text-muted-foreground">Total accrued</span>
                  <span className="text-right tabular-nums">{fmt(summary?.total_accrued)}</span>
                  <span className="text-muted-foreground">Already paid</span>
                  <span className="text-right tabular-nums text-green-700">− {fmt(summary?.interest_paid)}</span>
                  <span className="font-semibold text-amber-800 border-t pt-0.5">Outstanding</span>
                  <span className="text-right tabular-nums font-semibold text-amber-800 border-t pt-0.5">{fmt(outstandingInterest)}</span>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                This interest will be credited to savings together with your withdrawal.
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="amount">{isDeposit ? "Deposit Amount" : "Withdrawal Amount"}</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="1"
              placeholder="Enter amount"
              {...register("amount", {
                required: "Amount is required",
                min: { value: 1, message: "Amount must be greater than 0" },
                ...(movementType === "withdrawal" && currentBalance > 0
                  ? { max: { value: currentBalance, message: `Cannot exceed balance of ${fmt(currentBalance)}` } }
                  : {}),
              })}
            />
            {errors.amount && (
              <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
            )}
          </div>

          {/* Total payout preview — withdrawal only */}
          {!isDeposit && withdrawalAmount > 0 && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs space-y-1">
              <p className="font-medium text-blue-800">Credit to savings account</p>
              <div className="grid grid-cols-2 gap-x-4 text-muted-foreground">
                <span>Withdrawal (principal)</span>
                <span className="text-right tabular-nums">{fmt(withdrawalAmount)}</span>
                <span>Outstanding interest</span>
                <span className="text-right tabular-nums">{fmt(outstandingInterest)}</span>
                <span className="font-semibold text-blue-800 border-t pt-1">Total credit</span>
                <span className="text-right tabular-nums font-semibold text-blue-800 border-t pt-1">{fmt(totalCredit)}</span>
              </div>
              <p className="text-muted-foreground">
                New FD balance after withdrawal: <strong>{fmt(currentBalance - withdrawalAmount)}</strong>
              </p>
            </div>
          )}

          <div className="flex flex-col items-center gap-2">
            <Label>PIN Code</Label>
            <Controller
              control={control}
              name="user_pincode"
              rules={{
                required: "PIN is required",
                pattern: { value: /^\d{4}$/, message: "PIN must be 4 digits" },
              }}
              render={({ field }) => (
                <InputOTP maxLength={4} {...field}>
                  <InputOTPGroup className="flex space-x-3">
                    <InputOTPSlot index={0} className="h-10 w-10 text-center rounded-md" />
                    <InputOTPSlot index={1} className="h-10 w-10 text-center rounded-md" />
                    <InputOTPSeparator />
                    <InputOTPSlot index={2} className="h-10 w-10 text-center rounded-md" />
                    <InputOTPSlot index={3} className="h-10 w-10 text-center rounded-md" />
                  </InputOTPGroup>
                </InputOTP>
              )}
            />
            {errors.user_pincode && (
              <p className="text-red-500 text-sm">{errors.user_pincode.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || (!isDeposit && loadingSummary)}
              className={isDeposit ? "" : "bg-amber-600 hover:bg-amber-700"}
            >
              {isSubmitting
                ? "Processing…"
                : isDeposit
                ? "Deposit"
                : `Withdraw${outstandingInterest > 0 ? " + Settle Interest" : ""}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

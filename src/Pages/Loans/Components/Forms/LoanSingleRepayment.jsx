/* eslint-disable react/prop-types */
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { useParams } from "react-router-dom";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  X,
  Info,
  AlertTriangle,
  LockKeyhole,
  PiggyBank,
} from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { cn } from "@/lib/utils";

const PAYMENT_MODES = [
  { label: "Normal (All)",          value: "normal",             components: null },
  { label: "Principal Only",         value: "principal",          components: ["principal"] },
  { label: "Interest Only",          value: "interest",           components: ["interest"] },
  { label: "Interest + Principal",   value: "interest_principal", components: ["interest", "principal"] },
  { label: "Monitoring Fees Only",   value: "monitoring",         components: ["monitoring"] },
];

const TOTAL_STEPS = 3;

const LoanSingleRepayment = ({ isOpen, onClose, refetch, isGroupLoan = false }) => {
  const axiosPrivate = useAxiosPrivate();
  const { loanid } = useParams();
  const [step, setStep] = useState(1);

  const {
    register,
    handleSubmit,
    control,
    trigger,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      payment_mode: "normal",
      amount: "",
      savings_amount: "",
      penalty_amount: "",
      user_pincode: "",
    },
  });

  const selectedMode = watch("payment_mode");
  const amount = parseFloat(watch("amount")) || 0;
  const penaltyAmount = parseFloat(watch("penalty_amount")) || 0;

  const validateStep = async () => {
    let fields = [];
    if (step === 1) fields = ["payment_mode", "amount"];
    if (step === 2) fields = ["penalty_amount"];
    const valid = await trigger(fields);
    if (valid) setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handleClose = () => {
    reset();
    setStep(1);
    onClose();
  };

  const onSubmit = async (data) => {
    const mainAmount  = parseFloat(data.amount) || 0;
    const penaltyAmt  = parseFloat(data.penalty_amount) || 0;

    if (mainAmount + penaltyAmt <= 0) {
      toast({
        title: "Amount required",
        description: "Enter a repayment amount or penalty amount greater than zero.",
        variant: "destructive",
      });
      return;
    }

    const mode = PAYMENT_MODES.find((m) => m.value === data.payment_mode);

    const payload = {
      loan_application_id: loanid,
      amount: mainAmount,
      user_pincode: data.user_pincode,
    };

    if (mode?.components) {
      payload.payment_components = mode.components;
    }

    if (penaltyAmt > 0) {
      payload.penalty_amount = penaltyAmt;
    }

    if (isGroupLoan && parseFloat(data.savings_amount) > 0) {
      payload.savings_amount = parseFloat(data.savings_amount);
    }

    const controller = new AbortController();
    try {
      const response = await axiosPrivate.post(
        "/loans/payments/general",
        payload,
        { signal: controller.signal }
      );
      toast({ title: "Success", description: response.data.messages });
      handleClose();
      refetch();
    } catch (error) {
      toast({
        title: "Uh oh! Something went wrong.",
        variant: "destructive",
        description: error?.response?.data?.messages || "No server response",
      });
    }
  };

  const stepConfig = [
    { icon: <Info className="w-5 h-5 text-blue-500" />,        label: "Mode & Amount" },
    { icon: <AlertTriangle className="w-5 h-5 text-amber-500" />, label: "Penalties" },
    { icon: <LockKeyhole className="w-5 h-5 text-yellow-500" />, label: "PIN" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Loan Manual Repayment</DialogTitle>
          <DialogDescription>Follow the steps to manually process a loan payment.</DialogDescription>
          <DialogClose asChild>
            <button
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </button>
          </DialogClose>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 my-1">
          {stepConfig.map((s, i) => (
            <div key={i} className={cn("flex items-center", i < stepConfig.length - 1 && "flex-1")}>
              <div className={cn("flex items-center gap-1.5 transition-opacity", step > i ? "opacity-100" : "opacity-40")}>
                {s.icon}
                <span className="text-xs font-medium hidden sm:inline">{s.label}</span>
              </div>
              {i < stepConfig.length - 1 && (
                <div className="flex-1 h-px bg-border mx-2" />
              )}
            </div>
          ))}
        </div>
        <Progress value={(step / TOTAL_STEPS) * 100} className="h-1.5" />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
          {/* Step 1: Payment mode + main amount */}
          {step === 1 && (
            <fieldset className="space-y-4">
              <div>
                <Label className="mb-2 block">Payment Mode</Label>
                <div className="grid grid-cols-1 gap-2">
                  {PAYMENT_MODES.map((mode) => (
                    <label
                      key={mode.value}
                      className={cn(
                        "flex items-center gap-3 border rounded-md px-3 py-2.5 cursor-pointer transition-colors text-sm",
                        selectedMode === mode.value
                          ? "border-primary bg-primary/5 font-medium"
                          : "hover:bg-muted/50"
                      )}
                    >
                      <input
                        type="radio"
                        value={mode.value}
                        className="accent-primary"
                        {...register("payment_mode", { required: "Select a payment mode" })}
                      />
                      {mode.label}
                    </label>
                  ))}
                </div>
                {errors.payment_mode && (
                  <p className="text-red-500 text-xs mt-1">{errors.payment_mode.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="amount">Repayment Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0"
                  {...register("amount", {
                    min: { value: 0, message: "Cannot be negative" },
                  })}
                />
                {errors.amount && (
                  <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>
                )}
              </div>

              {isGroupLoan && (
                <div>
                  <Label htmlFor="savings_amount" className="flex items-center gap-1.5">
                    <PiggyBank className="w-3.5 h-3.5 text-green-600" />
                    Compulsory Savings (optional)
                  </Label>
                  <Input
                    id="savings_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Leave blank to use setting default"
                    {...register("savings_amount", {
                      min: { value: 0, message: "Cannot be negative" },
                    })}
                  />
                  {errors.savings_amount && (
                    <p className="text-red-500 text-xs mt-1">{errors.savings_amount.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Deducted alongside repayment and credited to the group savings account.
                  </p>
                </div>
              )}
            </fieldset>
          )}

          {/* Step 2: Penalty amount */}
          {step === 2 && (
            <fieldset className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Penalty payments are processed separately from the main repayment and applied to outstanding penalty balances first.
              </p>
              <div>
                <Label htmlFor="penalty_amount">Penalty Amount (optional)</Label>
                <Input
                  id="penalty_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0 — leave blank to skip"
                  {...register("penalty_amount", {
                    min: { value: 0, message: "Cannot be negative" },
                  })}
                />
                {errors.penalty_amount && (
                  <p className="text-red-500 text-xs mt-1">{errors.penalty_amount.message}</p>
                )}
              </div>
              {amount > 0 || penaltyAmount > 0 ? (
                <div className="text-xs text-muted-foreground border rounded-md p-3 bg-muted/30 space-y-1">
                  {amount > 0 && (
                    <p>Main repayment: <span className="font-medium text-foreground">UGX {amount.toLocaleString()}</span></p>
                  )}
                  {penaltyAmount > 0 && (
                    <p>Penalty: <span className="font-medium text-foreground">UGX {penaltyAmount.toLocaleString()}</span></p>
                  )}
                  <p className="font-medium text-foreground border-t pt-1 mt-1">
                    Total: UGX {(amount + penaltyAmount).toLocaleString()}
                  </p>
                </div>
              ) : null}
            </fieldset>
          )}

          {/* Step 3: PIN */}
          {step === 3 && (
            <div className="flex flex-col items-center space-y-2">
              <div className="text-xs text-muted-foreground border rounded-md p-3 bg-muted/30 w-full space-y-1 mb-2">
                <p>Mode: <span className="font-medium text-foreground capitalize">{PAYMENT_MODES.find(m => m.value === selectedMode)?.label}</span></p>
                {amount > 0 && <p>Main: <span className="font-medium text-foreground">UGX {amount.toLocaleString()}</span></p>}
                {penaltyAmount > 0 && <p>Penalty: <span className="font-medium text-foreground">UGX {penaltyAmount.toLocaleString()}</span></p>}
                <p className="font-semibold text-foreground border-t pt-1 mt-1">Total: UGX {(amount + penaltyAmount).toLocaleString()}</p>
              </div>
              <Controller
                control={control}
                name="user_pincode"
                rules={{
                  required: "Pincode is required",
                  pattern: { value: /^\d{4}$/, message: "PIN must be exactly 4 digits" },
                }}
                render={({ field }) => (
                  <>
                    <Label>Enter Pincode to Confirm</Label>
                    <InputOTP maxLength={4} {...field}>
                      <InputOTPGroup className="flex space-x-3 py-4">
                        <InputOTPSlot index={0} className="h-10 w-10 text-center rounded-md" />
                        <InputOTPSlot index={1} className="h-10 w-10 text-center rounded-md" />
                        <InputOTPSeparator />
                        <InputOTPSlot index={2} className="h-10 w-10 text-center rounded-md" />
                        <InputOTPSlot index={3} className="h-10 w-10 text-center rounded-md" />
                      </InputOTPGroup>
                    </InputOTP>
                  </>
                )}
              />
              {errors.user_pincode && (
                <p className="text-red-500 text-sm">{errors.user_pincode.message}</p>
              )}
            </div>
          )}

          <DialogFooter>
            {step > 1 && (
              <Button type="button" variant="secondary" onClick={prevStep}>
                <ArrowLeft className="mr-1 h-4 w-4" /> Back
              </Button>
            )}
            {step < TOTAL_STEPS && (
              <Button type="button" onClick={validateStep}>
                Next <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            )}
            {step === TOTAL_STEPS && (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Processing..." : "Submit Payment"}
                <CheckCircle className="ml-2 h-4 w-4" />
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LoanSingleRepayment;

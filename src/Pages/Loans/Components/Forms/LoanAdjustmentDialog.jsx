/* eslint-disable react/prop-types */
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
import { toast } from "@/hooks/use-toast";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { CheckCircle, X } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { formatDateTimestamp } from "@/lib/utils";

const LoanAdjustmentDialog = ({ isOpen, onClose, refetch, scheduleData }) => {
  const axiosPrivate = useAxiosPrivate();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (data) => {
    const FIELDS = ["interest_adjusted", "penalty_adjusted", "monitoring_adjusted"];
    const filled = FIELDS.filter(
      (k) => data[k] !== "" && data[k] !== undefined && data[k] !== null
    );
    if (filled.length === 0) {
      toast({
        title: "No amounts provided",
        description: "Enter at least one adjustment amount.",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      loan_schedule_id: scheduleData?.loan_schedule_id,
      user_pincode: data.user_pincode,
    };
    for (const k of filled) {
      payload[k] = parseFloat(data[k]);
    }
    if (data.reason?.trim()) payload.reason = data.reason.trim();

    const controller = new AbortController();
    try {
      const response = await axiosPrivate.post(
        "/loans/adjustment/schedule",
        payload,
        { signal: controller.signal }
      );
      toast({ title: "Success", description: response.data.messages });
      reset();
      refetch();
      onClose();
    } catch (error) {
      toast({
        title: "Uh oh! Something went wrong.",
        variant: "destructive",
        description: error?.response?.data?.messages || "No server response",
      });
    }
  };

  const fmt = (v) => Number(v ?? 0).toLocaleString();

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Adjust Schedule #{scheduleData?.loan_schedule_period}</DialogTitle>
          <DialogDescription>
            {scheduleData?.loan_schedule_date && (
              <span>Due: {formatDateTimestamp(scheduleData.loan_schedule_date)} — </span>
            )}
            Set a new amount for any component. Leave blank to keep unchanged.
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

        {scheduleData && (
          <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground border rounded-md p-3 bg-muted/30">
            <div>
              <p className="font-medium text-foreground">Interest</p>
              <p>{fmt(scheduleData.loan_schedule_interest)}</p>
              <p className="text-[10px]">paid: {fmt(scheduleData.loan_schedule_interest_paid)}</p>
            </div>
            <div>
              <p className="font-medium text-foreground">Penalties</p>
              <p>{fmt(scheduleData.loan_schedule_penalties)}</p>
              <p className="text-[10px]">paid: {fmt(scheduleData.loan_schedule_penalty_paid)}</p>
            </div>
            <div>
              <p className="font-medium text-foreground">Monitoring</p>
              <p>{fmt(scheduleData.loan_schedule_monitoring_amount)}</p>
              <p className="text-[10px]">paid: {fmt(scheduleData.loan_schedule_monitoring_paid)}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <div>
              <Label htmlFor="interest_adjusted">New Interest Amount</Label>
              <Input
                id="interest_adjusted"
                type="number"
                step="0.01"
                min="0"
                placeholder="Leave blank to skip"
                {...register("interest_adjusted", {
                  min: { value: 0, message: "Cannot be negative" },
                })}
              />
              {errors.interest_adjusted && (
                <p className="text-red-500 text-xs mt-1">{errors.interest_adjusted.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="penalty_adjusted">New Penalty Amount</Label>
              <Input
                id="penalty_adjusted"
                type="number"
                step="0.01"
                min="0"
                placeholder="Leave blank to skip"
                {...register("penalty_adjusted", {
                  min: { value: 0, message: "Cannot be negative" },
                })}
              />
              {errors.penalty_adjusted && (
                <p className="text-red-500 text-xs mt-1">{errors.penalty_adjusted.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="monitoring_adjusted">New Monitoring Fee</Label>
              <Input
                id="monitoring_adjusted"
                type="number"
                step="0.01"
                min="0"
                placeholder="Leave blank to skip"
                {...register("monitoring_adjusted", {
                  min: { value: 0, message: "Cannot be negative" },
                })}
              />
              {errors.monitoring_adjusted && (
                <p className="text-red-500 text-xs mt-1">{errors.monitoring_adjusted.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="reason">Reason (optional)</Label>
              <Input
                id="reason"
                type="text"
                placeholder="Reason for adjustment"
                {...register("reason")}
              />
            </div>
          </div>

          <div className="flex flex-col items-center">
            <Controller
              control={control}
              name="user_pincode"
              rules={{
                required: "Pincode is required",
                pattern: { value: /^\d{4}$/, message: "PIN must be exactly 4 digits" },
              }}
              render={({ field }) => (
                <>
                  <Label>Enter Pincode</Label>
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
              <p className="text-red-500 text-sm mt-1">{errors.user_pincode.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Processing..." : "Apply Adjustment"}
              <CheckCircle className="ml-2 h-4 w-4" />
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LoanAdjustmentDialog;

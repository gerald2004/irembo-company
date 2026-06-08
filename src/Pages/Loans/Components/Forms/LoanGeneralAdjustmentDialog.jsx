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
import { useParams } from "react-router-dom";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { CheckCircle, X } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const LoanGeneralAdjustmentDialog = ({ isOpen, onClose, refetch }) => {
  const axiosPrivate = useAxiosPrivate();
  const { loanid: loanId } = useParams();

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
      loan_application_id: loanId,
      user_pincode: data.user_pincode,
    };
    for (const k of filled) {
      payload[k] = parseFloat(data[k]);
    }
    if (data.reason?.trim()) payload.reason = data.reason.trim();

    const controller = new AbortController();
    try {
      const response = await axiosPrivate.post(
        "/loans/general/adjustment/schedule",
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

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Adjust All Loan Schedules</DialogTitle>
          <DialogDescription>
            Set new per-installment amounts for any component. Leave a field blank to leave it unchanged.
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
              {isSubmitting ? "Processing..." : "Apply Adjustments"}
              <CheckCircle className="ml-2 h-4 w-4" />
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LoanGeneralAdjustmentDialog;

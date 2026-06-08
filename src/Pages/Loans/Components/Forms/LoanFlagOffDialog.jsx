/* eslint-disable react/prop-types */
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { X, Flag, RotateCcw, LockKeyhole } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { useParams } from "react-router-dom";

/**
 * mode: "flag"   — flag off the loan (stop penalty accumulation)
 * mode: "unflag" — reverse the flag-off (resume penalties)
 */
const LoanFlagOffDialog = ({ isOpen, onClose, mode, refetch, loanId: propLoanId }) => {
  const axiosPrivate = useAxiosPrivate();
  const { loanid: paramLoanId } = useParams();
  const loanid = propLoanId ?? paramLoanId;
  const [step, setStep] = useState(1);

  const {
    handleSubmit,
    control,
    reset,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm();

  const isFlagging = mode === "flag";

  const validateStep = async () => {
    const valid = await trigger();
    if (valid) setStep(2);
  };

  const handleClose = () => {
    reset();
    setStep(1);
    onClose();
  };

  const onSubmit = async (data) => {
    try {
      const payload = { user_pincode: data.user_pincode };
      if (isFlagging) payload.reason = data.reason;

      const response = isFlagging
        ? await axiosPrivate.post(`/loans/${loanid}/flag-off`, payload)
        : await axiosPrivate.delete(`/loans/${loanid}/flag-off`, { data: payload });

      toast({
        title: "Success",
        description: response.data.messages,
      });

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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isFlagging ? (
              <><Flag className="w-5 h-5 text-orange-500" /> Flag Off Loan</>
            ) : (
              <><RotateCcw className="w-5 h-5 text-green-600" /> Reverse Flag-Off</>
            )}
          </DialogTitle>
          <DialogDescription>
            {isFlagging
              ? "Flagging off suspends penalty accumulation. The loan can be unflagged at any time."
              : "Reversing the flag-off will resume normal penalty accumulation."}
          </DialogDescription>
          <DialogClose asChild>
            <button
              className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:outline-none"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </button>
          </DialogClose>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Step 1: reason (flag only) + confirm */}
          {step === 1 && (
            <div className="space-y-4">
              {isFlagging && (
                <div>
                  <Label htmlFor="reason">Reason for Flag-Off *</Label>
                  <Controller
                    name="reason"
                    control={control}
                    rules={{ required: "Reason is required" }}
                    render={({ field }) => (
                      <Textarea
                        id="reason"
                        placeholder="Enter reason for flagging off this loan..."
                        className="mt-1"
                        rows={3}
                        {...field}
                      />
                    )}
                  />
                  {errors.reason && (
                    <p className="text-red-500 text-sm mt-1">{errors.reason.message}</p>
                  )}
                </div>
              )}

              {!isFlagging && (
                <p className="text-sm text-muted-foreground border rounded p-3 bg-muted">
                  Click <strong>Next</strong> and enter your PIN to confirm reversing the flag-off.
                </p>
              )}
            </div>
          )}

          {/* Step 2: PIN */}
          {step === 2 && (
            <div className="flex flex-col items-center space-y-2">
              <LockKeyhole className="w-6 h-6 text-yellow-500" />
              <Label>Enter Your PIN to Confirm</Label>
              <Controller
                control={control}
                name="user_pincode"
                rules={{
                  required: "PIN is required",
                  pattern: { value: /^\d{4}$/, message: "PIN must be 4 digits" },
                }}
                render={({ field }) => (
                  <InputOTP maxLength={4} {...field}>
                    <InputOTPGroup className="flex space-x-3 py-4">
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
          )}

          <DialogFooter>
            {step === 1 ? (
              <>
                <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
                <Button type="button" onClick={validateStep}>
                  Next →
                </Button>
              </>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={() => setStep(1)}>← Back</Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  variant={isFlagging ? "destructive" : "default"}
                >
                  {isSubmitting
                    ? "Processing..."
                    : isFlagging ? "Flag Off Loan" : "Reverse Flag-Off"}
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LoanFlagOffDialog;

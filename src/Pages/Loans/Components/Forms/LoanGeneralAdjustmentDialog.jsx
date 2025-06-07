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

const LoanGeneralAdjustmentDialog = ({
  isOpen,
  onClose,
  refetch,
  actionType,
}) => {
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
          const controller = new AbortController();

    try {
      const payload = {
        loan_application_id: loanId,
        adjustment_type: actionType,
        ...data,
      };
      const response = await axiosPrivate.post(
        "/loans/general/adjustment/schedule",
        payload,
        { signal: controller.signal }
      );
      toast({
        title: "Success",
        description: response.data.messages,
      });
      reset();
      refetch();
      onClose();
    } catch (error) {
      const errorMessage =
        error?.response?.data?.messages || "No server response";
      toast({
        title: "Uh oh! Something went wrong.",
        variant: "destructive",
        description: errorMessage,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="capitalize">
            {actionType} Loan Adjustment{" "}
          </DialogTitle>
          <DialogDescription>
            Please provide the required details for this loan adjustment.
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

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="amount_adjusted">Amount</Label>
            <Input
              id="amount_adjusted"
              type="number"
              placeholder="Enter amount"
              {...register("amount_adjusted", {
                required: "Amount is required",
              })}
            />
            {errors.amount_adjusted && (
              <p className="text-red-500 text-sm">{errors.amount_adjusted.message}</p>
            )}
          </div>
          {/* Pincode Entry */}
          <div className="flex flex-col items-center">
            <Controller
              control={control}
              name="user_pincode"
              rules={{
                required: "Pincode is required",
                pattern: {
                  value: /^\d{4}$/,
                  message: "PIN must be exactly 4 digits",
                },
              }}
              render={({ field }) => (
                <>
                  <Label>Enter Pincode</Label>
                  <InputOTP maxLength={4} {...field}>
                    <InputOTPGroup className="flex space-x-3 py-4">
                      <InputOTPSlot
                        index={0}
                        className="h-10 w-10 text-center rounded-md"
                      />
                      <InputOTPSlot
                        index={1}
                        className="h-10 w-10 text-center rounded-md"
                      />
                      <InputOTPSeparator />
                      <InputOTPSlot
                        index={2}
                        className="h-10 w-10 text-center rounded-md"
                      />
                      <InputOTPSlot
                        index={3}
                        className="h-10 w-10 text-center rounded-md"
                      />
                    </InputOTPGroup>
                  </InputOTP>
                </>
              )}
            />
            {errors.user_pincode && (
              <p className="text-red-500 text-sm mt-1">
                {errors.user_pincode.message}
              </p>
            )}
          </div>

          {/* Footer Navigation */}
          <DialogFooter>
            <Button
              type="submit"
              className="capitalize"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : `${actionType}`}{" "}
              <CheckCircle className="ml-2" />
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LoanGeneralAdjustmentDialog;

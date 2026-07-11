/* eslint-disable react/prop-types */
import { useEffect } from "react";
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
import { X, CheckCircle } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { toast } from "@/hooks/use-toast";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";

const SalaryAdvanceDisbursementDialog = ({
  isOpen,
  onClose,
  refetch,
  applicationId,
  amountRequested = 0,
}) => {
  const axiosPrivate = useAxiosPrivate();
  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { amount: "", user_pincode: "" } });

  useEffect(() => {
    if (isOpen) setValue("amount", amountRequested);
  }, [isOpen, amountRequested, setValue]);

  const handleClose = () => {
    reset();
    onClose?.();
  };

  const onSubmit = async (data) => {
    const controller = new AbortController();
    try {
      const response = await axiosPrivate.post(
        `/salary-advance/applications/${applicationId}/disburse`,
        { amount: Number(data.amount), user_pincode: data.user_pincode },
        { signal: controller.signal }
      );
      toast({ title: "Success", description: response?.data?.messages });
      handleClose();
      refetch?.();
    } catch (error) {
      const errorMessage =
        error?.response?.data?.messages || "No server response";
      toast({
        title: "Uh oh! Something went wrong.",
        variant: "destructive",
        description: Array.isArray(errorMessage)
          ? errorMessage.join(", ")
          : errorMessage,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Disburse Salary Advance</DialogTitle>
          <DialogDescription>
            Requested amount: {Number(amountRequested).toLocaleString()}. You may
            disburse less, but not more.
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
          <div>
            <Label htmlFor="amount">Amount to Disburse</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              {...register("amount", {
                required: "Amount is required",
                min: { value: 0.01, message: "Must be greater than 0" },
                validate: (v) =>
                  Number(v) <= Number(amountRequested) ||
                  "Cannot exceed the requested amount",
              })}
            />
            {errors.amount && (
              <p className="text-red-500 text-sm">{errors.amount.message}</p>
            )}
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
                  <Label>Enter Your Pincode to Confirm</Label>
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
              {isSubmitting ? "Disbursing..." : "Disburse"}{" "}
              <CheckCircle className="ml-2 h-4 w-4" />
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SalaryAdvanceDisbursementDialog;

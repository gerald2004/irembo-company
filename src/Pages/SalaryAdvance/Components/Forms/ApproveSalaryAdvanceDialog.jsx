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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, CheckCircle } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { toast } from "@/hooks/use-toast";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";

const ApproveSalaryAdvanceDialog = ({ isOpen, onClose, refetch, applicationId }) => {
  const axiosPrivate = useAxiosPrivate();
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const handleClose = () => {
    reset();
    onClose?.();
  };

  const onSubmit = async (data) => {
    const controller = new AbortController();
    try {
      const response = await axiosPrivate.patch(
        `/salary-advance/applications/${applicationId}/approve`,
        { user_pincode: data.user_pincode, notes: data.notes || undefined },
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
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Approve Salary Advance</DialogTitle>
          <DialogDescription>
            Confirm approval of this salary advance application.
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
            <Label htmlFor="notes">Approval Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any notes about this approval..."
              {...register("notes")}
            />
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
              {isSubmitting ? "Approving..." : "Approve"}{" "}
              <CheckCircle className="ml-2 h-4 w-4" />
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ApproveSalaryAdvanceDialog;

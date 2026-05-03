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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { UndoIcon, X } from "lucide-react";

/**
 * Props:
 *  isOpen       bool
 *  onClose      () => void
 *  refetch      () => void
 *  mode         'single' | 'bulk'   (default: 'single')
 *  transactionId   number             (single mode)
 *  transactionIds  number[]           (bulk mode)
 */
const ReverseStatementTransaction = ({
  isOpen,
  onClose,
  refetch,
  mode = "single",
  transactionId,
  transactionIds = [],
}) => {
  const axiosPrivate = useAxiosPrivate();
  const {
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const isBulk   = mode === "bulk";
  const count    = isBulk ? transactionIds.length : 1;
  const endpoint = isBulk ? "/reversal/transactions/bulk" : "/reversal/transactions";

  const onSubmit = async (data) => {
    try {
      const payload = isBulk
        ? { user_pincode: data.user_pincode, ids: transactionIds }
        : { user_pincode: data.user_pincode, transaction_id: transactionId };

      const response = await axiosPrivate.post(endpoint, payload);

      const msg = isBulk
        ? `${response.data.data?.reversed?.length ?? count} transaction${count !== 1 ? "s" : ""} reversed successfully`
        : (response.data.messages?.[0] ?? "Transaction reversed successfully");

      toast({ title: "Success", description: msg });
      reset();
      refetch();
      onClose();
    } catch (error) {
      const errorMessage =
        error?.response?.data?.messages?.[0] ??
        error?.response?.data?.messages ??
        "Could not reverse the transaction(s). Please try again.";
      toast({
        title: "Reversal failed",
        variant: "destructive",
        description: errorMessage,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>
            {isBulk ? `Reverse ${count} Transaction${count !== 1 ? "s" : ""}` : "Reverse Transaction"}
          </DialogTitle>
          <DialogDescription>
            {isBulk
              ? `All ${count} selected transactions will be reversed in a single all-or-nothing operation. Enter your PIN to confirm.`
              : "Are you sure you want to reverse this transaction? Enter your PIN to continue."}
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
            <div className="flex justify-end w-full gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={isSubmitting}>
                {isSubmitting ? "Processing…" : (
                  <>
                    {isBulk ? `Reverse ${count}` : "Reverse"} <UndoIcon className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReverseStatementTransaction;

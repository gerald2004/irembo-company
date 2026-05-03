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
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useParams } from "react-router-dom";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { CheckCircle, X, CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { format } from "date-fns";

const LoanTopUpDialog = ({ isOpen, onClose, refetch, outstandingPrincipal = 0 }) => {
  const axiosPrivate = useAxiosPrivate();
  const { loanid: loanId } = useParams();

  const {
    handleSubmit,
    control,
    reset,
    register,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const topUpAmount = parseFloat(watch("top_up_amount") || 0);
  const newTotal    = outstandingPrincipal + topUpAmount;

  const onSubmit = async (data) => {
    try {
      const payload = {
        loan_application_id: loanId,
        top_up_amount: parseFloat(data.top_up_amount),
        new_tenure:    parseInt(data.new_tenure, 10),
        new_due_date:  format(new Date(data.new_due_date), "yyyy-MM-dd"),
        user_pincode:  data.user_pincode,
      };
      const response = await axiosPrivate.post("/loans/top-up", payload);
      toast({ title: "Success", description: response.data.messages });
      reset();
      refetch();
      onClose();
    } catch (error) {
      toast({
        title: "Top-Up Failed",
        variant: "destructive",
        description: error?.response?.data?.messages || "No server response",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[580px]">
        <DialogHeader>
          <DialogTitle>Loan Top-Up</DialogTitle>
          <DialogDescription>
            Adds new funds to this loan and generates a fresh repayment schedule.
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

        {/* Outstanding balance preview */}
        {outstandingPrincipal > 0 && (
          <div className="rounded-md border bg-muted/40 px-4 py-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Outstanding Principal</span>
              <span className="font-mono font-medium">{outstandingPrincipal.toLocaleString()}</span>
            </div>
            {topUpAmount > 0 && (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Top-Up Amount</span>
                  <span className="font-mono text-emerald-600">+ {topUpAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t pt-1">
                  <span className="font-semibold">New Schedule Principal</span>
                  <span className="font-mono font-semibold">{newTotal.toLocaleString()}</span>
                </div>
              </>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top-Up Amount */}
            <div>
              <Label htmlFor="top_up_amount">Top-Up Amount</Label>
              <Input
                id="top_up_amount"
                type="number"
                step="0.01"
                placeholder="Amount to add"
                {...register("top_up_amount", {
                  required: "Top-up amount is required",
                  min: { value: 1, message: "Must be greater than zero" },
                })}
              />
              {errors.top_up_amount && (
                <p className="text-sm text-red-500">{errors.top_up_amount.message}</p>
              )}
            </div>

            {/* New Tenure */}
            <div>
              <Label htmlFor="new_tenure">New Tenure (Installments)</Label>
              <Input
                id="new_tenure"
                type="number"
                placeholder="e.g. 12"
                {...register("new_tenure", {
                  required: "New tenure is required",
                  min: { value: 1, message: "Must be at least 1" },
                })}
              />
              {errors.new_tenure && (
                <p className="text-sm text-red-500">{errors.new_tenure.message}</p>
              )}
            </div>

            {/* First Due Date */}
            <div className="md:col-span-2">
              <Label>First Installment Due Date</Label>
              <Controller
                name="new_due_date"
                control={control}
                rules={{ required: "First due date is required" }}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full pl-3 text-left font-normal">
                        {field.value ? field.value.toLocaleDateString() : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date("2000-01-01")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.new_due_date && (
                <p className="text-sm text-red-500">{errors.new_due_date.message}</p>
              )}
            </div>
          </div>

          {/* PIN */}
          <div className="flex flex-col items-center">
            <Controller
              control={control}
              name="user_pincode"
              rules={{
                required: "PIN is required",
                pattern: { value: /^\d{4}$/, message: "PIN must be 4 digits" },
              }}
              render={({ field }) => (
                <>
                  <Label>Enter PIN</Label>
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
              {isSubmitting ? "Processing..." : "Confirm Top-Up"}
              <CheckCircle className="ml-2 h-4 w-4" />
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LoanTopUpDialog;

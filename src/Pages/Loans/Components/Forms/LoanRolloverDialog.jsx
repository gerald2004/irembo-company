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
const LoanRolloverDialog = ({ isOpen, onClose, refetch }) => {
  const axiosPrivate = useAxiosPrivate();
  const { loanid: loanId } = useParams();

  const {
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
        new_due_date: format(new Date(data.new_due_date), "yyyy-MM-dd"),
        user_pincode: data.user_pincode
      };
      // console.log(payload);
      const response = await axiosPrivate.post("/loans/rollover", payload, {
        signal: controller.signal,
      });
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
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="capitalize">Loan Rollover</DialogTitle>
          <DialogDescription>
            Please provide the required details for this loan rollover.
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
            <Label htmlFor="new_due_date">Start Date</Label>
            <Controller
              name="new_due_date"
              control={control}
              rules={{ required: "Start date is required" }}
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className="w-full pl-3 text-left font-normal"
                    >
                      {field.value ? (
                        field.value.toLocaleDateString()
                      ) : (
                        <span>Pick a date</span>
                      )}
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
              <p className="text-sm text-red-500">
                {errors.new_due_date.message}
              </p>
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
              {isSubmitting ? "Processing..." : `Submit`}{" "}
              <CheckCircle className="ml-2" />
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LoanRolloverDialog;

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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { useParams } from "react-router-dom";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  X,
  Info,
  LockKeyhole,
} from "lucide-react";

const WithdrawTransactionDialog = ({ isOpen, onClose, refetch, accountId }) => {
  const axiosPrivate = useAxiosPrivate();
  const { id: clientId } = useParams(); // ✅ Get client_id from params

  const {
    register,
    handleSubmit,
    control,
    trigger,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const [step, setStep] = useState(1);

  const validateStep = async () => {
    const valid = await trigger();
    if (valid && step < 2) {
      setStep((prev) => prev + 1);
    }
  };

  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const onSubmit = async (data) => {
          const controller = new AbortController();

    try {
      const payload = {
        ...data,
        client_id: clientId,
        client_account_id: accountId,
      };
    //   console.log(payload);
      const response = await axiosPrivate.post(
        "/accounting/withdraw/withdraws",
        payload,
        {signal: controller.signal}
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

  const stepIcons = [
    {
      icon: <Info className="w-6 h-6 text-blue-500" />,
      label: "Withdraw Details",
    },
    {
      icon: <LockKeyhole className="w-6 h-6 text-yellow-500" />,
      label: "PinCode",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Withdraw Transaction</DialogTitle>
          <DialogDescription>
            Follow the steps to complete transaction.
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

        {/* Step Progress Indicator */}
        <div className="flex items-center space-x-4 my-1">
          {stepIcons.map((stepIcon, index) => (
            <div
              key={index}
              className={`flex items-center ${
                step > index + 1 ? "opacity-100" : "opacity-50"
              } transition-opacity`}
            >
              {stepIcon.icon}
              <span className="ml-2 text-sm font-medium">{stepIcon.label}</span>
              {index < stepIcons.length - 1 && (
                <div className="h-[2px] w-8 bg-gray-300 mx-2"></div>
              )}
            </div>
          ))}
        </div>
        <Progress value={(step / 2) * 100} className="my-1" />

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Step 1: withdraw Details */}
          {step === 1 && (
            <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* withdraw Amount */}
              <div>
                <Label htmlFor="withdraw_transaction_amount">
                  Withdraw Amount
                </Label>
                <Input
                  id="withdraw_transaction_amount"
                  type="number"
                  step="0.01"
                  placeholder="Enter amount"
                  {...register("withdraw_transaction_amount", {
                    required: "Amount is required",
                  })}
                />
                {errors.withdraw_transaction_amount && (
                  <p className="text-red-500 text-sm">
                    {errors.withdraw_transaction_amount.message}
                  </p>
                )}
              </div>

              {/* Deposit Method */}
              <div>
                <Label htmlFor="withdraw_transaction_method">
                  Withdraw Method
                </Label>
                <Controller
                  name="withdraw_transaction_method"
                  control={control}
                  rules={{ required: "Withdraw method is required" }}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="bank_transfer">
                          Bank Transfer
                        </SelectItem>
                        <SelectItem value="mobile_money">
                          Mobile Money
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.withdraw_transaction_method && (
                  <p className="text-red-500 text-sm">
                    {errors.withdraw_transaction_method.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="withdraw_transaction_notary">Notary</Label>
                <Input
                  defaultValue={"Withdraw"}
                  id="withdraw_transaction_notary"
                  placeholder="Withdraw Notary"
                  {...register("withdraw_transaction_notary", {
                    required: "Withdraw Notary is required",
                  })}
                />
                {errors.withdraw_transaction_notary && (
                  <p className="text-red-500 text-sm">
                    {errors.withdraw_transaction_notary.message}
                  </p>
                )}
              </div>
              {/* Notes */}
              <div>
                <Label htmlFor="withdraw_transaction_notes">
                  Notes (Optional)
                </Label>
                <Input
                  id="withdraw_transaction_notes"
                  placeholder="Optional note"
                  {...register("withdraw_transaction_notes")}
                />
              </div>
            </fieldset>
          )}

          {/* Step 2: PIN Entry */}
          {step === 2 && (
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
          )}

          {/* Footer Navigation */}
          <DialogFooter>
            <div className="flex justify-end w-full">
              {step > 1 && (
                <Button
                  type="button"
                  className="mx-2"
                  variant="secondary"
                  onClick={prevStep}
                >
                  <ArrowLeft className="mr-2" /> Back
                </Button>
              )}
              {step === 1 ? (
                <Button type="button" onClick={validateStep}>
                  Next <ArrowRight className="ml-2" />
                </Button>
              ) : (
                ""
              )}
              {step === 2 && (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    "Processing..."
                  ) : (
                    <>
                      Save <CheckCircle className="ml-2" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default WithdrawTransactionDialog;

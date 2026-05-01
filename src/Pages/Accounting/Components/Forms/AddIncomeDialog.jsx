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
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { ArrowLeft, ArrowRight, CheckCircle, X, Info, LockKeyhole } from "lucide-react";
import { AccountCombobox } from "@/Pages/Components/AccountCombobox";
import { DateField } from "@/components/DateField";

const AddIncomeDialog = ({
  isOpen,
  onClose,
  refetch,
  accountsData,
  isLoadingAccounts,
  isErrorAccounts,
  refetchAccounts,
  isRefetchingAccounts,
}) => {
  const axiosPrivate = useAxiosPrivate();

  const {
    register,
    handleSubmit,
    control,
    trigger,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      income_date: new Date().toISOString().slice(0, 10),
    },
  });

  const [selectedAccounts, setSelectedAccounts] = useState({ income_account_id: null });
  const [step, setStep] = useState(1);

  const validateStep = async () => {
    const valid = await trigger();
    if (valid && step < 2) setStep((prev) => prev + 1);
  };

  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const onSubmit = async (data) => {
    const controller = new AbortController();
    try {
      const payload = { ...data, ...selectedAccounts };
      const response = await axiosPrivate.post("/accounting/incomes", payload, {
        signal: controller.signal,
      });
      toast({ title: "Success", description: response.data.messages });
      reset({ income_date: new Date().toISOString().slice(0, 10) });
      setSelectedAccounts({ income_account_id: null });
      setStep(1);
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

  const stepIcons = [
    { icon: <Info className="w-6 h-6 text-blue-500" />, label: "Income Details" },
    { icon: <LockKeyhole className="w-6 h-6 text-yellow-500" />, label: "PinCode" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Income Transaction</DialogTitle>
          <DialogDescription>Follow the steps to complete transaction.</DialogDescription>
          <DialogClose asChild>
            <button
              className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:outline-none"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </button>
          </DialogClose>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center space-x-4 my-1">
          {stepIcons.map((s, index) => (
            <div
              key={index}
              className={`flex items-center ${step > index + 1 ? "opacity-100" : "opacity-50"} transition-opacity`}
            >
              {s.icon}
              <span className="ml-2 text-sm font-medium">{s.label}</span>
              {index < stepIcons.length - 1 && <div className="h-[2px] w-8 bg-gray-300 mx-2" />}
            </div>
          ))}
        </div>
        <Progress value={(step / 2) * 100} className="my-1" />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {step === 1 && (
            <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Amount */}
              <div>
                <Label htmlFor="income_amount">Income Amount</Label>
                <Input
                  id="income_amount"
                  type="number"
                  step="0.01"
                  placeholder="Enter income amount"
                  {...register("income_amount", { required: "Income amount is required" })}
                />
                {errors.income_amount && (
                  <p className="text-red-500 text-sm">{errors.income_amount.message}</p>
                )}
              </div>

              {/* Received From */}
              <div>
                <Label htmlFor="income_received_from">Received From</Label>
                <Input
                  id="income_received_from"
                  placeholder="Enter who gave the income"
                  {...register("income_received_from", { required: "This field is required" })}
                />
                {errors.income_received_from && (
                  <p className="text-red-500 text-sm">{errors.income_received_from.message}</p>
                )}
              </div>

              {/* Income Date — uses DateField (outputs YYYY-MM-DD string) */}
              <div>
                <Controller
                  name="income_date"
                  control={control}
                  rules={{ required: "Income date is required" }}
                  render={({ field }) => (
                    <DateField
                      label="Income Date"
                      value={field.value}
                      onChange={(v) => setValue("income_date", v, { shouldValidate: true })}
                    />
                  )}
                />
                {errors.income_date && (
                  <p className="text-red-500 text-sm">{errors.income_date.message}</p>
                )}
              </div>

              {/* Income Account */}
              <AccountCombobox
                label="Income Account"
                selectedAccount={selectedAccounts.income_account_id}
                onAccountSelect={(value) =>
                  setSelectedAccounts((prev) => ({ ...prev, income_account_id: parseInt(value) }))
                }
                accountsData={accountsData}
                isLoading={isLoadingAccounts}
                isError={isErrorAccounts}
                refetch={refetchAccounts}
                isRefetching={isRefetchingAccounts}
              />

              {/* Notes */}
              <div className="md:col-span-2">
                <Label htmlFor="income_notes">Notes (Optional)</Label>
                <Input
                  id="income_notes"
                  placeholder="Add any remarks or notes"
                  {...register("income_notes")}
                />
              </div>
            </fieldset>
          )}

          {step === 2 && (
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
          )}

          <DialogFooter>
            <div className="flex justify-end w-full gap-2">
              {step > 1 && (
                <Button type="button" variant="secondary" onClick={prevStep}>
                  <ArrowLeft className="mr-2" /> Back
                </Button>
              )}
              {step === 1 && (
                <Button type="button" onClick={validateStep}>
                  Next <ArrowRight className="ml-2" />
                </Button>
              )}
              {step === 2 && (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Processing..." : <><CheckCircle className="mr-2" /> Save</>}
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddIncomeDialog;

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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  X,
  Info,
  LockKeyhole,
} from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { AccountCombobox } from "@/Pages/Components/AccountCombobox";
import { useQuery } from "@tanstack/react-query";

const JournalEntryDialog = ({ isOpen, onClose, refetch }) => {
  const axiosPrivate = useAxiosPrivate();
  const {
    register,
    handleSubmit,
    trigger,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm();

  const [step, setStep] = useState(1);
  // Step Icons
  const stepIcons = [
    {
      icon: <Info className="w-6 h-6 text-green-500" />,
      label: "Journal Details",
    },

    {
      icon: <LockKeyhole className="w-6 h-6 text-yellow-500" />,
      label: "Pincode",
    },
  ];

  const validateStep = async () => {
    const valid = await trigger();
    if (valid && step < 2) setStep((prev) => prev + 1);
  };

  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const onSubmit = async (data) => {
    const controller = new AbortController();
    try {
      const payload = {
        ...data,
        debit_account: selectedAccounts.debit_account,
        credit_account: selectedAccounts.credit_account,
      };

      const response = await axiosPrivate.post(
        "/accounting/journals",
        payload,
        { signal: controller.signal }
      );

      toast({ title: "Success", description: response.data.messages });
      reset();
      refetch();
      onClose();
      setStep(1);
    } catch (error) {
      toast({
        title: "Uh oh! Something went wrong.",
        variant: "destructive",
        description: error?.response?.data?.messages || "No server response",
      });
    }
  };

  const {
    data: accountsData,
    isLoading: isLoadingAccounts,
    isError: isErrorAccounts,
    refetch: refetchAccounts,
    isRefetching: isRefetchingAccounts,
  } = useQuery({
    queryKey: ["account-votes"],
    queryFn: async () => {
      const controller = new AbortController();
      const response = await axiosPrivate.get("/settings/accounts/account", {
        signal: controller.signal,
      });
      return response.data.data.accounts;
    },
  });
  const [selectedAccounts, setSelectedAccounts] = useState({
    debit_account: null,
    credit_account: null,
  });

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Journal Entry</DialogTitle>
          <DialogDescription>
            Follow the steps to apply an journal entry.
          </DialogDescription>
          <DialogClose asChild>
            <button
              className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100"
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
          {/* Step 1: Select Client */}
          {step === 1 && (
            <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Journal Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="Enter amount"
                  {...register("amount", {
                    required: "Charge amount is required",
                  })}
                />
                {errors.amount && (
                  <p className="text-red-500 text-sm">
                    {errors.amount.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Enter description reason"
                  {...register("description", {
                    required: "Description reason is required",
                  })}
                />
                {errors.description && (
                  <p className="text-red-500 text-sm">
                    {errors.description.message}
                  </p>
                )}
              </div>
              <AccountCombobox
                label="Debit Account"
                selectedAccount={selectedAccounts.debit_account}
                onAccountSelect={(value) =>
                  setSelectedAccounts((prev) => ({
                    ...prev,
                    debit_account: parseInt(value),
                  }))
                }
                accountsData={accountsData}
                isLoading={isLoadingAccounts}
                isError={isErrorAccounts}
                refetch={refetchAccounts}
                isRefetching={isRefetchingAccounts}
              />

              <AccountCombobox
                label="Credit Account"
                selectedAccount={selectedAccounts.credit_account}
                onAccountSelect={(value) =>
                  setSelectedAccounts((prev) => ({
                    ...prev,
                    credit_account: parseInt(value),
                  }))
                }
                accountsData={accountsData}
                isLoading={isLoadingAccounts}
                isError={isErrorAccounts}
                refetch={refetchAccounts}
                isRefetching={isRefetchingAccounts}
              />
            </fieldset>
          )}

          {/* Step 2: Select Account */}
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

export default JournalEntryDialog;

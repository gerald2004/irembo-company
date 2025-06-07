/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  ArrowRight,
  X,
  LockKeyhole,
  Info,
  User,
} from "lucide-react";
import { ClientCombobox } from "@/Pages/Components/ClientCombobox";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
const TransferTransactionDialog = ({ isOpen, onClose, refetch, accountId }) => {
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
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientAccounts, setClientAccounts] = useState([]);

  // Step icons
  const stepIcons = [
    {
      icon: <User className="w-6 h-6 text-blue-500" />,
      label: "Select Client",
    },
    {
      icon: <Info className="w-6 h-6 text-green-500" />,
      label: "Select Account & Enter Amount",
    },
    {
      icon: <LockKeyhole className="w-6 h-6 text-yellow-500" />,
      label: "PIN",
    },
  ];

  // Fetch client accounts when client is selected
  useEffect(() => {
    const fetchClientAccounts = async (clientId) => {
      const controller = new AbortController();

      try {
        const response = await axiosPrivate.get(
          `/accounts/attached/accounts/${clientId}`,
          { signal: controller.signal }
        );
        setClientAccounts(response.data.data.accounts ?? []);
      } catch (error) {
        const errorMessage =
          error?.response?.data?.messages || "Failed to fetch accounts";
        toast({
          title: "Error",
          variant: "destructive",
          description: errorMessage,
        });
      }
    };
    if (selectedClient) {
      fetchClientAccounts(selectedClient);
    }
  }, [selectedClient, axiosPrivate]);

  const validateStep = async () => {
    const valid = await trigger();
    if (valid && step < 3) setStep((prev) => prev + 1);
  };

  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const onSubmit = async (data) => {
    const controller = new AbortController();

    try {
      const payload = {
        ...data,
        client_id: selectedClient,
        account_sending: accountId,
      };
      // console.log(payload);
      const response = await axiosPrivate.post(
        "/accounting/transfers/inbound",
        payload,
        { signal: controller.signal }
      );
      toast({ title: "Success", description: response.data.messages });
      reset();
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

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Internal Transfer</DialogTitle>
          <DialogDescription>
            Follow the steps to complete the transfer.
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
        <Progress value={(step / 3) * 100} className="my-1" />

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Step 1: Select Client */}
          {step === 1 && (
            <div>
              <ClientCombobox
                label="Select Client"
                selectedClient={selectedClient}
                onClientSelect={setSelectedClient}
              />
            </div>
          )}

          {/* Step 2: Select Account */}
          {step === 2 && (
            <>
              <div>
                <Label>Select Account</Label>
                <Controller
                  name="account_receiving"
                  control={control}
                  rules={{ required: "Please select an account" }}
                  render={({ field }) => (
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value); // ✅ Update form state
                      }}
                      value={field.value || ""} // ✅ Ensure controlled component
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Account" />
                      </SelectTrigger>
                      <SelectContent>
                        {clientAccounts.map((account) => (
                          <SelectItem
                            key={account.client_account_id}
                            value={String(account.client_account_id)} // ✅ Ensure it's a string
                          >
                            {account.product_title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.account_receiving && (
                  <p className="text-red-500 text-sm">
                    {errors.account_receiving.message}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="transfer_amount">Transfer Amount</Label>
                  <Input
                    id="transfer_amount"
                    type="number"
                    step="0.01"
                    placeholder="Enter amount"
                    {...register("transfer_amount", {
                      required: "Amount is required",
                    })}
                  />
                  {errors.transfer_amount && (
                    <p className="text-red-500 text-sm">
                      {errors.transfer_amount.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="transfer_reason">Transfer Reason</Label>
                  <Input
                    id="transfer_reason"
                    placeholder="Reason for transfer"
                    {...register("transfer_reason", {
                      required: "Transfer reason is required",
                    })}
                  />
                  {errors.transfer_reason && (
                    <p className="text-red-500 text-sm">
                      {errors.transfer_reason.message}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Step 3: Enter Amount & PIN */}
          {step === 3 && (
            <fieldset>
              {/* PIN Entry */}
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
            </fieldset>
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
              {step < 3 ? (
                <Button type="button" onClick={validateStep}>
                  Next <ArrowRight className="ml-2" />
                </Button>
              ) : (
                ""
              )}
              {step === 3 && (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Processing..." : "Confirm Transfer"}
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TransferTransactionDialog;

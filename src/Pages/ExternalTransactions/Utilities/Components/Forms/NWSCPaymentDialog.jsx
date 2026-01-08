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
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
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
  User,
  CreditCard,
  Droplet,
  DollarSign,
  LockKeyhole,
} from "lucide-react";

// Dummy accounts data
const dummyClientAccounts = [
  {
    id: 1,
    account_name: "Primary Savings",
    account_number: "SAV00123456",
    balance: 1500000,
    currency: "",
    account_type: "Savings",
    status: "Active",
  },
  {
    id: 2,
    account_name: "Business Account",
    account_number: "BUS00567890",
    balance: 3500000,
    currency: "",
    account_type: "Current",
    status: "Active",
  },
  {
    id: 3,
    account_name: "Emergency Fund",
    account_number: "SAV00987654",
    balance: 500000,
    currency: "",
    account_type: "Savings",
    status: "Active",
  },
];

const NWSCPaymentDialog = ({ isOpen, onClose }) => {
  const {
    register,
    handleSubmit,
    control,
    trigger,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const [step, setStep] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState(null);

  // Mock API call
  // const mockPaymentAPI = async (data) => {
  //   return new Promise((resolve, reject) => {
  //     setTimeout(() => {
  //       const selectedAccountData = dummyClientAccounts.find(
  //         (a) => a.id.toString() === data.account_id
  //       );

  //       if (parseInt(data.amount) > selectedAccountData.balance) {
  //         reject({
  //           response: {
  //             data: {
  //               messages: "Insufficient funds in selected account",
  //             },
  //           },
  //         });
  //       } else {
  //         resolve({
  //           data: {
  //             transaction_id: `TXN_${Date.now()}`,
  //             meter_number: data.meter_number,
  //             amount: data.amount,
  //             utility_type: "NWSC",
  //             status: "completed",
  //             messages: "Water token purchase successful",
  //             token: Math.random().toString(36).substring(2, 10).toUpperCase(),
  //           },
  //         });
  //       }
  //     }, 1500); // Simulate network delay
  //   });
  // };

  const mockPaymentAPI = async (data) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: {
            transaction_id: `TXN_${Date.now()}`,
            meter_number: data.meter_number,
            meter_name: data.meter_name || "NWSC Customer",
            amount: data.amount,
            utility_type: "NWSC",
            status: "completed",
            messages: "Water token purchase successful",
            token: Math.random().toString(36).substring(2, 10).toUpperCase()
          }
        });
      }, 1500);
    });
  };

  const validateStep = async () => {
    const fieldsToValidate = {
      1: ["member_id"],
      2: ["account_id"],
      3: ["meter_number"],
      4: ["amount"],
    }[step];

    const valid = await trigger(fieldsToValidate);
    if (valid && step < 5) {
      setStep((prev) => prev + 1);
    }
  };

  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const onSubmit = async (data) => {
    try {
      const response = await mockPaymentAPI(data);

      setTransactionDetails(response.data);
      setIsSuccess(true);
      toast({
        title: "Success",
        description: response.data.messages,
      });
      reset();
    } catch (error) {
      const errorMessage =
        error?.response?.data?.messages || "Payment failed. Please try again.";
      toast({
        title: "Payment Error",
        variant: "destructive",
        description: errorMessage,
      });
    }
  };

  const stepIcons = [
    { icon: <User className="w-5 h-5" />, label: "Member" },
    { icon: <CreditCard className="w-5 h-5" />, label: "Account" },
    { icon: <Droplet className="w-5 h-5" />, label: "Meter" },
    { icon: <DollarSign className="w-5 h-5" />, label: "Amount" },
    { icon: <LockKeyhole className="w-5 h-5" />, label: "PIN" },
  ];

  const handleClose = () => {
    reset();
    setStep(1);
    setIsSuccess(false);
    setTransactionDetails(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        {isSuccess ? (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle>Payment Successful!</DialogTitle>
              <DialogDescription>
                Your NWSC water token purchase has been completed.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Transaction ID:
                </span>
                <span className="text-sm font-medium">
                  {transactionDetails.transaction_id}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Meter Number:
                </span>
                <span className="text-sm font-medium">
                  {transactionDetails.meter_number}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Amount Paid:
                </span>
                <span className="text-sm font-medium">
                  {transactionDetails.amount} 
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Water Token:
                </span>
                <span className="text-sm font-medium">
                  {transactionDetails.token}
                </span>
              </div>
            </div>

            <DialogFooter>
              <Button sm="sm" onClick={handleClose} className="w-250">
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>NWSC Water Token Purchase</DialogTitle>
              <DialogDescription>
                Follow the steps to complete your water token purchase.
              </DialogDescription>
              <DialogClose asChild>
                <button
                  className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  onClick={handleClose}
                >
                  <X className="h-4 w-4" />
                </button>
              </DialogClose>
            </DialogHeader>

            {/* Step Progress Indicator */}
            <div className="flex items-center justify-center space-x-2 my-4">
              {stepIcons.map((stepIcon, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div
                    className={`rounded-full p-2 ${
                      step > index
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {stepIcon.icon}
                  </div>
                  <span
                    className={`text-xs mt-1 ${
                      step > index ? "font-medium" : "text-muted-foreground"
                    }`}
                  >
                    {stepIcon.label}
                  </span>
                </div>
              ))}
            </div>
            <Progress value={(step / 5) * 100} className="my-2" />

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Step 1: Select Member */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="member_id">Select Member</Label>
                    <Controller
                      name="member_id"
                      control={control}
                      rules={{ required: "Member selection is required" }}
                      render={({ field }) => (
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select member" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="current">
                              Current Member
                            </SelectItem>
                            <SelectItem value="other">Other Member</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.member_id && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.member_id.message}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Select Account */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="account_id">Select Account</Label>
                    <Controller
                      name="account_id"
                      control={control}
                      rules={{ required: "Account selection is required" }}
                      render={({ field }) => (
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select account" />
                          </SelectTrigger>
                          <SelectContent>
                            {dummyClientAccounts?.map((account) => (
                              <SelectItem
                                key={account.id}
                                value={account.id.toString()}
                              >
                                {account.account_name} -{" "}
                                {account.account_number} (Balance:{" "}
                                {account.balance.toLocaleString()} )
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.account_id && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.account_id.message}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Meter Number */}
              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="meter_number">Meter Number</Label>
                    <Input
                      id="meter_number"
                      type="text"
                      placeholder="Enter NWSC meter number"
                      {...register("meter_number", {
                        required: "Meter number is required",
                        pattern: {
                          value: /^[0-9]+$/,
                          message: "Meter number should contain only numbers",
                        },
                        minLength: {
                          value: 6,
                          message: "Meter number should be at least 6 digits",
                        },
                      })}
                    />
                    {errors.meter_number && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.meter_number.message}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 4: Amount and Payment Method */}
              {step === 4 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="amount">Amount ()</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="1000"
                      min="1000"
                      placeholder="Enter amount"
                      {...register("amount", {
                        required: "Amount is required",
                        min: {
                          value: 1000,
                          message: "Minimum amount is 1,000 ",
                        },
                        validate: (value) => {
                          const selectedAccountData = dummyClientAccounts?.find(
                            (a) => a.id.toString() === watch("account_id")
                          );
                          if (
                            selectedAccountData &&
                            +value > selectedAccountData.balance
                          ) {
                            return "Amount exceeds account balance";
                          }
                          return true;
                        },
                      })}
                    />
                    {errors.amount && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.amount.message}
                      </p>
                    )}
                  </div>

                  {/* <div>
                    <Label htmlFor="payment_method">Payment Method</Label>
                    <Controller
                      name="payment_method"
                      control={control}
                      rules={{ required: "Payment method is required" }}
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
                            <SelectItem value="mobile_money">
                              Mobile Money
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.payment_method && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.payment_method.message}
                      </p>
                    )}
                  </div> */}
                </div>
              )}

              {/* Step 5: PIN Entry */}
              {step === 5 && (
                <div className="flex flex-col items-center space-y-4">
                  <div className="text-center">
                    <p className="font-medium">Confirm NWSC Payment</p>
                    <p className="text-sm text-muted-foreground">
                      Amount: {watch("amount")} 
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Meter: {watch("meter_number")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Meter Name: {watch("meter_name") || "NWSC Customer"}{" "}
                      {/* Added meter name field */}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Account:{" "}
                      {
                        dummyClientAccounts.find(
                          (a) => a.id.toString() === watch("account_id")
                        )?.account_name
                      }
                    </p>
                  </div>
                  <div className="w-full flex flex-col items-center">
                    <Label className="text-center mb-2">
                      Enter PIN to confirm
                    </Label>
                    <Controller
                      control={control}
                      name="user_pincode"
                      rules={{
                        required: "PIN is required",
                        pattern: {
                          value: /^\d{4}$/,
                          message: "PIN must be exactly 4 digits",
                        },
                      }}
                      render={({ field }) => (
                        <InputOTP maxLength={4} {...field}>
                          <InputOTPGroup className="flex justify-center space-x-2 py-4">
                            {[0, 1, 2, 3].map((index) => (
                              <InputOTPSlot
                                key={index}
                                index={index}
                                className="h-12 w-12 text-center"
                              />
                            ))}
                          </InputOTPGroup>
                        </InputOTP>
                      )}
                    />
                    {errors.user_pincode && (
                      <p className="text-red-500 text-sm mt-1 text-center">
                        {errors.user_pincode.message}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Footer Navigation */}
              <DialogFooter>
                <div className="flex justify-between w-full">
                  {step > 1 && (
                    <Button type="button" variant="outline" onClick={prevStep}>
                      <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                  )}
                  {step < 5 ? (
                    <Button
                      type="button"
                      onClick={validateStep}
                      className="ml-auto"
                    >
                      Next <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="ml-auto"
                    >
                      {isSubmitting ? (
                        "Processing..."
                      ) : (
                        <>
                          Confirm Payment{" "}
                          <CheckCircle className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NWSCPaymentDialog;

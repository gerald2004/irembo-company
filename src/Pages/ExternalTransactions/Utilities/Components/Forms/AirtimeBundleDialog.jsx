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
  Smartphone,
  Wifi,
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
    currency: "UGX",
    account_type: "Savings",
    status: "Active",
  },
  {
    id: 2,
    account_name: "Business Account",
    account_number: "BUS00567890",
    balance: 3500000,
    currency: "UGX",
    account_type: "Current",
    status: "Active",
  },
  {
    id: 3,
    account_name: "Emergency Fund",
    account_number: "SAV00987654",
    balance: 500000,
    currency: "UGX",
    account_type: "Savings",
    status: "Active",
  },
];

// Communication providers
const providers = [
  { id: "mtn", name: "MTN Uganda" },
  { id: "airtel", name: "Airtel Uganda" },
  { id: "utl", name: "UTL" },
  { id: "africell", name: "Africell Uganda" },
];

// Bundle options by provider
const bundleOptions = {
  mtn: [
    { id: "daily", name: "Daily Bundle", price: 1000, validity: "1 Day", data: "50MB" },
    { id: "weekly", name: "Weekly Bundle", price: 5000, validity: "7 Days", data: "250MB" },
    { id: "monthly", name: "Monthly Bundle", price: 20000, validity: "30 Days", data: "1.5GB" },
    { id: "social", name: "Social Bundle", price: 3000, validity: "7 Days", data: "Unlimited Social" },
    { id: "custom", name: "Custom Amount", price: 0 },
  ],
  airtel: [
    { id: "daily", name: "Daily Bundle", price: 1000, validity: "1 Day", data: "60MB" },
    { id: "weekly", name: "Weekly Bundle", price: 5000, validity: "7 Days", data: "300MB" },
    { id: "monthly", name: "Monthly Bundle", price: 25000, validity: "30 Days", data: "2GB" },
    { id: "video", name: "Video Bundle", price: 5000, validity: "7 Days", data: "500MB" },
    { id: "custom", name: "Custom Amount", price: 0 },
  ],
  utl: [
    { id: "daily", name: "Daily Bundle", price: 1500, validity: "1 Day", data: "100MB" },
    { id: "weekly", name: "Weekly Bundle", price: 7000, validity: "7 Days", data: "500MB" },
    { id: "monthly", name: "Monthly Bundle", price: 30000, validity: "30 Days", data: "3GB" },
    { id: "custom", name: "Custom Amount", price: 0 },
  ],
  africell: [
    { id: "daily", name: "Daily Bundle", price: 2000, validity: "1 Day", data: "150MB" },
    { id: "weekly", name: "Weekly Bundle", price: 8000, validity: "7 Days", data: "600MB" },
    { id: "monthly", name: "Monthly Bundle", price: 35000, validity: "30 Days", data: "3.5GB" },
    { id: "custom", name: "Custom Amount", price: 0 },
  ],
};

// Function to get phone number owner
const getPhoneNumberOwner = (phoneNumber) => {
  const owners = {
    "0758732625": "Gerald Hyuha",
    "0772123456": "John Doe",
    "0701122334": "Jane Smith",
  };
  
  return owners[phoneNumber] || "Unknown";
};

const AirtimeBundleDialog = ({ isOpen, onClose }) => {
  const {
    register,
    handleSubmit,
    control,
    trigger,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm();

  const [step, setStep] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedBundle, setSelectedBundle] = useState(null);
  const [transactionType, setTransactionType] = useState("airtime");

  // Watch form values
  const providerId = watch("provider_id");
//   const phoneNumber = watch("phone_number");
  const bundleId = watch("bundle_id");

  // Update bundles when provider changes
  useEffect(() => {
    if (providerId) {
      setSelectedProvider(providers.find(p => p.id === providerId));
      setValue("bundle_id", "");
      setSelectedBundle(null);
    }
  }, [providerId, setValue]);

  // Update amount when bundle changes
  useEffect(() => {
    if (bundleId && providerId && bundleId !== "custom") {
      const bundles = bundleOptions[providerId];
      const bundle = bundles.find(b => b.id === bundleId);
      if (bundle) {
        setSelectedBundle(bundle);
        setValue("amount", bundle.price);
      }
    } else if (bundleId === "custom") {
      setSelectedBundle(null);
      setValue("amount", "");
    }
  }, [bundleId, providerId, setValue]);

  const mockPaymentAPI = async (data) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const bundleInfo = transactionType === "data" && selectedBundle 
          ? `${selectedBundle.name} (${selectedBundle.data})`
          : null;

        resolve({
          data: {
            transaction_id: `TEL_TXN_${Date.now()}`,
            phone_number: data.phone_number,
            provider: providers.find(p => p.id === data.provider_id)?.name || "Unknown",
            amount: data.amount,
            type: transactionType,
            bundle: bundleInfo,
            status: "completed",
            messages: `${transactionType === "airtime" ? "Airtime" : "Data bundle"} purchase successful`,
            receipt_number: `TEL_RCPT_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
          }
        });
      }, 1500);
    });
  };

  const validateStep = async () => {
    const fieldsToValidate = {
      1: ["member_id"],
      2: ["account_id"],
      3: ["provider_id", "phone_number", "transaction_type"],
      4: transactionType === "data" ? ["bundle_id", "amount"] : ["amount"],
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
    { icon: <Smartphone className="w-5 h-5" />, label: "Provider" },
    { icon: transactionType === "airtime" ? <DollarSign className="w-5 h-5" /> : <Wifi className="w-5 h-5" />, 
      label: transactionType === "airtime" ? "Amount" : "Bundle" },
    { icon: <LockKeyhole className="w-5 h-5" />, label: "PIN" },
  ];

  const handleClose = () => {
    reset();
    setStep(1);
    setIsSuccess(false);
    setTransactionDetails(null);
    setSelectedProvider(null);
    setSelectedBundle(null);
    setTransactionType("airtime");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        {isSuccess ? (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle>Purchase Successful!</DialogTitle>
              <DialogDescription>
                {transactionDetails?.messages}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Transaction ID:
                </span>
                <span className="text-sm font-medium">
                  {transactionDetails?.transaction_id}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Receipt Number:
                </span>
                <span className="text-sm font-medium">
                  {transactionDetails?.receipt_number}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Phone Number:
                </span>
                <span className="text-sm font-medium">
                  {transactionDetails?.phone_number}({getPhoneNumberOwner(transactionDetails?.phone_number)})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Provider:
                </span>
                <span className="text-sm font-medium">
                  {transactionDetails?.provider}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Type:
                </span>
                <span className="text-sm font-medium capitalize">
                  {transactionDetails?.type}
                </span>
              </div>
              {transactionDetails?.bundle && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Bundle:
                  </span>
                  <span className="text-sm font-medium">
                    {transactionDetails?.bundle}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Amount:
                </span>
                <span className="text-sm font-medium">
                  {transactionDetails?.amount} UGX
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
              <DialogTitle>Buy Airtime/Data Bundle</DialogTitle>
              <DialogDescription>
                Follow the steps to complete your purchase.
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
                                {account.balance.toLocaleString()} UGX)
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

              {/* Step 3: Provider and Phone Number */}
              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="provider_id">Select Provider</Label>
                    <Controller
                      name="provider_id"
                      control={control}
                      rules={{ required: "Provider selection is required" }}
                      render={({ field }) => (
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select provider" />
                          </SelectTrigger>
                          <SelectContent>
                            {providers.map((provider) => (
                              <SelectItem
                                key={provider.id}
                                value={provider.id}
                              >
                                {provider.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.provider_id && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.provider_id.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phone_number">Phone Number</Label>
                    <Input
                      id="phone_number"
                      type="tel"
                      placeholder="Enter phone number (e.g., 0772123456)"
                      {...register("phone_number", {
                        required: "Phone number is required",
                        pattern: {
                          value: /^0[0-9]{9}$/,
                          message: "Enter a valid 10-digit Uganda phone number (e.g., 0772123456)",
                        },
                      })}
                    />
                    {errors.phone_number && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.phone_number.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="transaction_type">Transaction Type</Label>
                    <Controller
                      name="transaction_type"
                      control={control}
                      defaultValue="airtime"
                      render={({ field }) => (
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            setTransactionType(value);
                          }}
                          defaultValue={field.value}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="airtime">Airtime</SelectItem>
                            <SelectItem value="data">Data Bundle</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Step 4: Amount or Bundle Selection */}
              {step === 4 && (
                <div className="space-y-4">
                  {transactionType === "data" ? (
                    <>
                      <div>
                        <Label htmlFor="bundle_id">Select Bundle</Label>
                        <Controller
                          name="bundle_id"
                          control={control}
                          rules={{ required: "Bundle selection is required" }}
                          render={({ field }) => (
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              disabled={!providerId}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select bundle" />
                              </SelectTrigger>
                              <SelectContent>
                                {providerId && bundleOptions[providerId]?.map((bundle) => (
                                  <SelectItem
                                    key={bundle.id}
                                    value={bundle.id}
                                  >
                                    {bundle.name} - {bundle.data} ({bundle.validity}) - {bundle.price.toLocaleString()} UGX
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {errors.bundle_id && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.bundle_id.message}
                          </p>
                        )}
                      </div>

                      {bundleId === "custom" && (
                        <div>
                          <Label htmlFor="amount">Amount (UGX)</Label>
                          <Input
                            id="amount"
                            type="number"
                            placeholder="Enter amount"
                            {...register("amount", {
                              required: bundleId === "custom" ? "Amount is required" : false,
                              min: {
                                value: 500,
                                message: "Minimum amount is 500 UGX",
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
                      )}
                    </>
                  ) : (
                    <div>
                      <Label htmlFor="amount">Airtime Amount (UGX)</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="Enter amount"
                        {...register("amount", {
                          required: "Amount is required",
                          min: {
                            value: 500,
                            message: "Minimum amount is 500 UGX",
                          },
                          max: {
                            value: 1000000,
                            message: "Maximum amount is 1,000,000 UGX",
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
                  )}
                </div>
              )}

              {/* Step 5: PIN Entry */}
              {step === 5 && (
                <div className="flex flex-col items-center space-y-4">
                  <div className="text-center">
                    <p className="font-medium">Confirm {transactionType === "airtime" ? "Airtime" : "Data Bundle"} Purchase</p>
                    <p className="text-sm text-muted-foreground">
                      Amount: {watch("amount")} UGX
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Phone: {watch("phone_number")}({getPhoneNumberOwner(watch("phone_number"))}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Provider: {selectedProvider?.name}
                    </p>
                    {transactionType === "data" && selectedBundle && (
                      <p className="text-sm text-muted-foreground">
                        Bundle: {selectedBundle.name} ({selectedBundle.data})
                      </p>
                    )}
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
                      disabled={
                        (step === 3 && (!watch("provider_id") || !watch("phone_number"))) ||
                        (step === 4 && (
                          transactionType === "data" 
                            ? !watch("bundle_id") 
                            : !watch("amount")
                        ))
                      }
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
                          Confirm Purchase{" "}
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

export default AirtimeBundleDialog;
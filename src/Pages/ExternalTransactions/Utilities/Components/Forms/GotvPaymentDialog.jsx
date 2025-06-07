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
  Tv,
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

// GOtv package options
const gotvPackages = [
  { id: "lite", name: "GOtv Lite", price: 25000 },
  { id: "value", name: "GOtv Value", price: 45000 },
  { id: "plus", name: "GOtv Plus", price: 65000 },
  { id: "max", name: "GOtv Max", price: 85000 },
  { id: "supa", name: "GOtv Supa", price: 105000 },
  { id: "other", name: "Other Amount", price: 0 },
];

// Mock function to fetch GOtv customer details
const fetchGOTvCustomerDetails = async (customerId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Mock response with customer details
      resolve({
        success: true,
        data: {
          customerId,
          customerName: "John Doe",
          currentPackage: "GOtv Value",
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: "Active"
        }
      });
    }, 800);
  });
};

const GOtvPaymentDialog = ({ isOpen, onClose }) => {
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
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [customerDetails, setCustomerDetails] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);

  // Watch customer ID and package
  const customerId = watch("customer_id");
  const packageId = watch("package_id");

  useEffect(() => {
    if (customerId && customerId.length >= 6) {
      const fetchDetails = async () => {
        setIsFetchingDetails(true);
        try {
          const details = await fetchGOTvCustomerDetails(customerId);
          if (details.success) {
            setCustomerDetails(details.data);
            setValue("customer_name", details.data.customerName);
          } else {
            setCustomerDetails(null);
            toast({
              title: "Error",
              variant: "destructive",
              description: "Could not fetch customer details for this ID",
            });
          }
        // eslint-disable-next-line no-unused-vars
        } catch (error) {
          toast({
            title: "Error",
            variant: "destructive",
            description: "Failed to fetch customer details",
          });
        } finally {
          setIsFetchingDetails(false);
        }
      };

      const debounceTimer = setTimeout(fetchDetails, 1000);
      return () => clearTimeout(debounceTimer);
    }
  }, [customerId, setValue]);

  // Update amount when package changes
  useEffect(() => {
    if (packageId && packageId !== "other") {
      const pkg = gotvPackages.find(p => p.id === packageId);
      if (pkg) {
        setSelectedPackage(pkg);
        setValue("amount", pkg.price);
      }
    } else if (packageId === "other") {
      setSelectedPackage(null);
      setValue("amount", "");
    }
  }, [packageId, setValue]);

  const mockPaymentAPI = async (data) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const pkg = gotvPackages.find(p => p.id === data.package_id) || { name: "Custom Package" };
        resolve({
          data: {
            transaction_id: `GOTV_TXN_${Date.now()}`,
            customer_id: data.customer_id,
            customer_name: data.customer_name || "GOtv Customer",
            amount: data.amount,
            package_name: pkg.name,
            status: "completed",
            messages: "GOtv payment processed successfully",
            receipt_number: `GOTV_RCPT_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
            expiry_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          }
        });
      }, 1500);
    });
  };

  const validateStep = async () => {
    const fieldsToValidate = {
      1: ["member_id"],
      2: ["account_id"],
      3: ["customer_id"],
      4: ["package_id", "amount"],
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
    { icon: <Tv className="w-5 h-5" />, label: "Customer ID" },
    { icon: <DollarSign className="w-5 h-5" />, label: "Package" },
    { icon: <LockKeyhole className="w-5 h-5" />, label: "PIN" },
  ];

  const handleClose = () => {
    reset();
    setStep(1);
    setIsSuccess(false);
    setTransactionDetails(null);
    setCustomerDetails(null);
    setSelectedPackage(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        {isSuccess ? (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle>GOtv Payment Successful!</DialogTitle>
              <DialogDescription>
                Your GOtv subscription payment has been completed.
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
                  Receipt Number:
                </span>
                <span className="text-sm font-medium">
                  {transactionDetails.receipt_number}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Customer ID:
                </span>
                <span className="text-sm font-medium">
                  {transactionDetails.customer_id}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Customer Name:
                </span>
                <span className="text-sm font-medium">
                  {transactionDetails.customer_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Package:
                </span>
                <span className="text-sm font-medium">
                  {transactionDetails.package_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Amount Paid:
                </span>
                <span className="text-sm font-medium">
                  {transactionDetails.amount} UGX
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Expiry Date:
                </span>
                <span className="text-sm font-medium">
                  {transactionDetails.expiry_date}
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
              <DialogTitle>GOtv Payment</DialogTitle>
              <DialogDescription>
                Follow the steps to complete your GOtv subscription payment.
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

              {/* Step 3: Customer ID */}
              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="customer_id">Customer ID (Smart Card Number)</Label>
                    <Input
                      id="customer_id"
                      type="text"
                      placeholder="Enter GOtv customer ID"
                      {...register("customer_id", {
                        required: "Customer ID is required",
                        minLength: {
                          value: 6,
                          message: "Customer ID should be at least 6 characters",
                        },
                      })}
                    />
                    {errors.customer_id && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.customer_id.message}
                      </p>
                    )}
                    {isFetchingDetails && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Fetching customer details...
                      </p>
                    )}
                  </div>
                  {customerDetails && (
                    <div className="p-4 border rounded-md bg-muted/50">
                      <h4 className="font-medium mb-2">Customer Details</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-muted-foreground">Name:</span>
                        <span>{customerDetails.customerName}</span>
                        <span className="text-muted-foreground">Current Package:</span>
                        <span>{customerDetails.currentPackage}</span>
                        <span className="text-muted-foreground">Expiry Date:</span>
                        <span>{customerDetails.expiryDate}</span>
                        <span className="text-muted-foreground">Status:</span>
                        <span>{customerDetails.status}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: Package and Amount */}
              {step === 4 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="package_id">Select Package</Label>
                    <Controller
                      name="package_id"
                      control={control}
                      rules={{ required: "Package selection is required" }}
                      render={({ field }) => (
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select package" />
                          </SelectTrigger>
                          <SelectContent>
                            {gotvPackages.map((pkg) => (
                              <SelectItem
                                key={pkg.id}
                                value={pkg.id}
                              >
                                {pkg.name} {pkg.price > 0 ? `- ${pkg.price.toLocaleString()} UGX` : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.package_id && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.package_id.message}
                      </p>
                    )}
                  </div>

                  {packageId === "other" && (
                    <div>
                      <Label htmlFor="amount">Amount (UGX)</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="Enter amount"
                        {...register("amount", {
                          required: packageId === "other" ? "Amount is required" : false,
                          min: {
                            value: 1000,
                            message: "Minimum amount is 1,000 UGX",
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
                    <p className="font-medium">Confirm GOtv Payment</p>
                    <p className="text-sm text-muted-foreground">
                      Amount: {watch("amount")} UGX
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Customer ID: {watch("customer_id")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Customer Name: {watch("customer_name") || "GOtv Customer"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Package: {selectedPackage?.name || "Custom Package"}
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
                      disabled={step === 4 && !watch("package_id")}
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

export default GOtvPaymentDialog;
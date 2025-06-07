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
  FileText,
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

// Mock function to fetch Police payment details from reference number
const fetchPolicePaymentDetails = async (referenceNumber) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Mock response with Police payment details
      resolve({
        success: true,
        data: {
          referenceNumber,
          payerName: "John Doe",
          amount: 150000,
          serviceType: "Express Penalty Scheme (EPS)",
          paymentDate: new Date().toISOString(),
          status: "Pending Payment",
          offense: "Traffic Violation - Speeding"
        }
      });
    }, 800);
  });
};

const PolicePaymentDialog = ({ isOpen, onClose }) => {
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
  const [paymentDetails, setPaymentDetails] = useState(null);

  // Watch reference number to fetch details when it changes
  const referenceNumber = watch("reference_number");

  useEffect(() => {
    if (referenceNumber && referenceNumber.length >= 8) {
      const fetchDetails = async () => {
        setIsFetchingDetails(true);
        try {
          const details = await fetchPolicePaymentDetails(referenceNumber);
          if (details.success) {
            setPaymentDetails(details.data);
            setValue("amount", details.data.amount);
            setValue("payer_name", details.data.payerName);
            setValue("service_type", details.data.serviceType);
          } else {
            setPaymentDetails(null);
            toast({
              title: "Error",
              variant: "destructive",
              description: "Could not fetch payment details for this reference number",
            });
          }
        // eslint-disable-next-line no-unused-vars
        } catch (error) {
          toast({
            title: "Error",
            variant: "destructive",
            description: "Failed to fetch payment details",
          });
        } finally {
          setIsFetchingDetails(false);
        }
      };

      const debounceTimer = setTimeout(fetchDetails, 1000);
      return () => clearTimeout(debounceTimer);
    }
  }, [referenceNumber, setValue]);

  const mockPaymentAPI = async (data) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          data: {
            transaction_id: `POLICE_TXN_${Date.now()}`,
            reference_number: data.reference_number,
            payer_name: data.payer_name,
            amount: data.amount,
            service_type: data.service_type || "Express Penalty Scheme (EPS)",
            status: "completed",
            messages: "Police payment processed successfully",
            receipt_number: `POLICE_RCPT_${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
            offense: data.offense || "Traffic Violation"
          }
        });
      }, 1500);
    });
  };

  const validateStep = async () => {
    const fieldsToValidate = {
      1: ["member_id"],
      2: ["account_id"],
      3: ["reference_number"],
      4: ["amount", "payer_name"],
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
    { icon: <FileText className="w-5 h-5" />, label: "Reference" },
    { icon: <DollarSign className="w-5 h-5" />, label: "Details" },
    { icon: <LockKeyhole className="w-5 h-5" />, label: "PIN" },
  ];

  const handleClose = () => {
    reset();
    setStep(1);
    setIsSuccess(false);
    setTransactionDetails(null);
    setPaymentDetails(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        {isSuccess ? (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle>Police Payment Successful!</DialogTitle>
              <DialogDescription>
                Your payment to Uganda Police Force has been completed.
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
                  Reference Number:
                </span>
                <span className="text-sm font-medium">
                  {transactionDetails.reference_number}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Payer Name:
                </span>
                <span className="text-sm font-medium">
                  {transactionDetails.payer_name}
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
                  Service Type:
                </span>
                <span className="text-sm font-medium">
                  {transactionDetails.service_type}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Offense:
                </span>
                <span className="text-sm font-medium">
                  {transactionDetails.offense}
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
              <DialogTitle>Police Payment</DialogTitle>
              <DialogDescription>
                Follow the steps to complete your police payment (EPS, fines, etc.).
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

              {/* Step 3: Reference Number */}
              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="reference_number">Police Reference Number</Label>
                    <Input
                      id="reference_number"
                      type="text"
                      placeholder="Enter police reference number"
                      {...register("reference_number", {
                        required: "Reference number is required",
                        minLength: {
                          value: 8,
                          message: "Reference number should be at least 8 characters",
                        },
                      })}
                    />
                    {errors.reference_number && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.reference_number.message}
                      </p>
                    )}
                    {isFetchingDetails && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Fetching payment details...
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 4: Payment Details */}
              {step === 4 && (
                <div className="space-y-4">
                  {paymentDetails ? (
                    <>
                      <div>
                        <Label htmlFor="payer_name">Payer Name</Label>
                        <Input
                          id="payer_name"
                          type="text"
                          readOnly
                          {...register("payer_name", {
                            required: "Payer name is required",
                          })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="amount">Amount (UGX)</Label>
                        <Input
                          id="amount"
                          type="number"
                          readOnly
                          {...register("amount", {
                            required: "Amount is required",
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
                      <div className="p-4 border rounded-md bg-muted/50">
                        <h4 className="font-medium mb-2">Payment Details</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <span className="text-muted-foreground">Reference:</span>
                          <span>{paymentDetails.referenceNumber}</span>
                          <span className="text-muted-foreground">Service Type:</span>
                          <span>{paymentDetails.serviceType}</span>
                          <span className="text-muted-foreground">Offense:</span>
                          <span>{paymentDetails.offense}</span>
                          <span className="text-muted-foreground">Status:</span>
                          <span>{paymentDetails.status}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        No payment details found for this reference number
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 5: PIN Entry */}
              {step === 5 && (
                <div className="flex flex-col items-center space-y-4">
                  <div className="text-center">
                    <p className="font-medium">Confirm Police Payment</p>
                    <p className="text-sm text-muted-foreground">
                      Amount: {watch("amount")} UGX
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Reference: {watch("reference_number")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Payer: {watch("payer_name")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Service: {watch("service_type")}
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
                      disabled={step === 4 && !paymentDetails}
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

export default PolicePaymentDialog;
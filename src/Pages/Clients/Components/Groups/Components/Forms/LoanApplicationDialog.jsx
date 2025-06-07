/* eslint-disable react/prop-types */
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
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
import { useNavigate, useParams } from "react-router-dom";
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
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const LoanApplicationDialog = ({ isOpen, onClose, refetch }) => {
  const axiosPrivate = useAxiosPrivate();
  const { id: clientId, client_id: accountId } = useParams(); // ✅ Get client_id from params
  const navigate = useNavigate();

  // ✅ Fetch Loan Products
  const { data: loanProducts = [], isLoading } = useQuery({
    queryKey: ["loan-products"],
    queryFn: async () => {
      const controller = new AbortController();
      try {
        const response = await axiosPrivate.get("/settings/loans/products", {
          signal: controller.signal,
        });
        return response?.data?.data?.loan_products ?? [];
      } catch (error) {
        if (error?.response?.status === 401) {
          navigate("/", { state: { from: location }, replace: true });
        }
        throw error;
      }
    },
    keepPreviousData: true,
  });

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

      const response = await axiosPrivate.post("/loans/applications", payload, {
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

  const stepIcons = [
    {
      icon: <Info className="w-6 h-6 text-blue-500" />,
      label: "Loan Details",
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
          <DialogTitle>Loan Application</DialogTitle>
          <DialogDescription>
            Follow the steps to complete the loan application.
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
          {/* Step 1: Loan Details */}
          {step === 1 && (
            <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Loan Amount */}
              <div>
                <Label htmlFor="loan_application_amount">Loan Amount</Label>
                <Input
                  id="loan_application_amount"
                  type="number"
                  placeholder="Enter amount"
                  {...register("loan_application_amount", {
                    required: "Amount is required",
                  })}
                />
                {errors.loan_application_amount && (
                  <p className="text-red-500 text-sm">
                    {errors.loan_application_amount.message}
                  </p>
                )}
              </div>

              {/* Loan Tenure Period */}
              <div>
                <Label htmlFor="loan_application_tenure_period">
                  Tenure Period (months)
                </Label>
                <Input
                  id="loan_application_tenure_period"
                  type="number"
                  placeholder="Enter period in months"
                  {...register("loan_application_tenure_period", {
                    required: "Tenure period is required",
                  })}
                />
                {errors.loan_application_tenure_period && (
                  <p className="text-red-500 text-sm">
                    {errors.loan_application_tenure_period.message}
                  </p>
                )}
              </div>

              {/* Loan Product */}
              <div>
                <Label htmlFor="loan_product_id">Loan Product</Label>
                <Controller
                  name="loan_product_id"
                  control={control}
                  rules={{ required: "Loan product is required" }}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(value) => field.onChange(value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a product">
                          {loanProducts?.find(
                            (item) => String(item.id) === String(field.value)
                          )?.title || "Select Product"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {isLoading ? (
                          <SelectItem disabled>Loading...</SelectItem>
                        ) : (
                          loanProducts.map((product) => (
                            <SelectItem
                              key={product.id}
                              value={String(product.id)}
                            >
                              {product.title} ({product.interest_rate}%)
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.loan_product_id && (
                  <p className="text-red-500 text-sm">
                    {errors.loan_product_id.message}
                  </p>
                )}
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
            <Button type="button" onClick={prevStep} variant="secondary">
              <ArrowLeft className="mr-2" /> Back
            </Button>
            {step === 1 ? (
              <Button type="button" onClick={validateStep}>
                Next <ArrowRight className="ml-2" />
              </Button>
            ) : (
              ""
            )}
            {step === 2 && (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Processing..." : "Save"}{" "}
                <CheckCircle className="ml-2" />
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LoanApplicationDialog;

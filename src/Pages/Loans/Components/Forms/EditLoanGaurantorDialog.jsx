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
import { useParams } from "react-router-dom";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
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
import { Textarea } from "@/components/ui/textarea";

const EditLoanGaurantorDialog = ({
  isOpen,
  onClose,
  refetch,
  defaultValues,
}) => {
  const axiosPrivate = useAxiosPrivate();
  const { loanid: loanid } = useParams(); // ✅ Get loanid from params

  const {
    register,
    handleSubmit,
    control,
    trigger,
    reset,
    setValue,
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
        loan_application_id: loanid,
      };
      const response = await axiosPrivate.patch(
        `/loans/${defaultValues?.loan_guarantor_id}/guarantor`,
        payload,
        { signal: controller.signal }
      );

      toast({
        title: "Success",
        description: response.data.messages,
      });
      reset();
      refetch();
      onClose();
      setStep(1);
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
  useEffect(() => {
    if (defaultValues) {
      for (const [key, value] of Object.entries(defaultValues)) {
        setValue(key, value);
      }
    }
  }, [defaultValues, setValue]);

  const stepIcons = [
    {
      icon: <Info className="w-6 h-6 text-blue-500" />,
      label: "Details",
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
          <DialogTitle>Update Loan Gaurantor </DialogTitle>
          <DialogDescription>
            Follow the steps to update loan guarantor.
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
              {/* Loan Guarantor Type */}
              <div>
                <Label htmlFor="loan_guarantor_type">Guarantor Type</Label>
                <Select
                  defaultValue={defaultValues?.loan_guarantor_type}
                  onValueChange={(value) =>
                    setValue("loan_guarantor_type", value)
                  }
                >
                  <SelectTrigger className="w-full border rounded p-2">
                    <SelectValue placeholder="Select Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="savings">Savings</SelectItem>
                    <SelectItem value="colletral">Collateral</SelectItem>
                  </SelectContent>
                </Select>
                {errors.loan_guarantor_type && (
                  <p className="text-red-500 text-sm">
                    {errors.loan_guarantor_type.message}
                  </p>
                )}
              </div>

              {/* Loan Guarantor Amount */}
              <div>
                <Label htmlFor="loan_guarantor_amount">Guarantor Amount</Label>
                <Input
                  id="loan_guarantor_amount"
                  type="number"
                  placeholder="Enter amount"
                  {...register("loan_guarantor_amount", {
                    required: "Guarantor amount is required",
                  })}
                />
                {errors.loan_guarantor_amount && (
                  <p className="text-red-500 text-sm">
                    {errors.loan_guarantor_amount.message}
                  </p>
                )}
              </div>

              <>
                {/* Guarantor Gender */}
                <div>
                  <Label htmlFor="guarantor_gender">Guarantor Gender</Label>
                  <Select
                    defaultValue={defaultValues?.guarantor_gender}
                    onValueChange={(value) =>
                      setValue("guarantor_gender", value)
                    }
                  >
                    <SelectTrigger className="w-full border rounded p-2">
                      <SelectValue placeholder="Select Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.guarantor_gender && (
                    <p className="text-red-500 text-sm">
                      {errors.guarantor_gender.message}
                    </p>
                  )}
                </div>
                {/* guarantor Name */}
                <div>
                  <Label htmlFor="guranator_contact">Guarantor Name</Label>
                  <Input
                    id="loan_guarantor_name"
                    type="text"
                    placeholder="Enter name"
                    {...register("loan_guarantor_name", {
                      required: "Name is required",
                    })}
                  />
                  {errors.loan_guarantor_name && (
                    <p className="text-red-500 text-sm">
                      {errors.loan_guarantor_name.message}
                    </p>
                  )}
                </div>

                {/* Guarantor Contact */}
                <div>
                  <Label htmlFor="guranator_contact">Guarantor Contact</Label>
                  <Input
                    id="guranator_contact"
                    type="text"
                    placeholder="Enter contact number"
                    {...register("guranator_contact", {
                      required: "Contact is required",
                    })}
                  />
                  {errors.guranator_contact && (
                    <p className="text-red-500 text-sm">
                      {errors.guranator_contact.message}
                    </p>
                  )}
                </div>

                {/* Loan Guarantor Extra Notes */}
                <div className="col-span-2">
                  <Label htmlFor="loan_guarantor_extra_notes">
                    Extra Notes
                  </Label>
                  <Textarea
                    id="loan_guarantor_extra_notes"
                    placeholder="Enter any extra notes (optional)"
                    {...register("loan_guarantor_extra_notes")}
                  />
                  {errors.loan_guarantor_extra_notes && (
                    <p className="text-red-500 text-sm">
                      {errors.loan_guarantor_extra_notes.message}
                    </p>
                  )}
                </div>
              </>
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
                {isSubmitting ? "Processing..." : "Submit"}{" "}
                <CheckCircle className="ml-2" />
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditLoanGaurantorDialog;

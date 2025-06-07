/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useForm } from "react-hook-form";
import {
  ArrowRight,
  CheckCircle,
  ArrowLeft,
  Info,
  AlertTriangle,
  Check,
  X,
} from "lucide-react";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { toast } from "@/hooks/use-toast";

const EditLoanProductDialog = ({ isOpen, onClose, refetch, defaultValues }) => {
  const axiosPrivate = useAxiosPrivate();
  //   console.log(defaultValues)
  const {
    register,
    handleSubmit,
    setValue,
    trigger,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();
  const [step, setStep] = useState(1);

  useEffect(() => {
    // Populate form with default values
    if (defaultValues) {
      for (const [key, value] of Object.entries(defaultValues)) {
        setValue(key, value);
      }
    }
  }, [defaultValues, setValue]);

  const validateStep = async () => {
    const valid = await trigger();
    if (valid && step < 3) {
      setStep((prev) => prev + 1);
    }
  };

  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const onSubmit = async (data) => {
    const controller = new AbortController();

    const newData = {
      ...data,
      interval: data.product_interval,
    };
    try {
      const response = await axiosPrivate.patch(
        `/settings/loans/products/${defaultValues.id}`,
        newData,
        {
          signal: controller.signal,
        }
      );
      toast({ title: "Success", description: response?.data?.messages });
      onClose();
      refetch();
      reset();
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

  const stepIcons = [
    {
      icon: <Info className="w-6 h-6 text-blue-500" />,
      label: "Basic Details",
    },
    {
      icon: <AlertTriangle className="w-6 h-6 text-yellow-500" />,
      label: "Penalty Details",
    },
    {
      icon: <Check className="w-6 h-6 text-green-500" />,
      label: "Offset Period",
    },
  ];
  const penaltyMode = watch("penalty_mode");

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Loan Product</DialogTitle>
          <DialogDescription>
            Follow the steps to edit the loan product details.
          </DialogDescription>
          <DialogClose asChild>
            <button
              className="absolute right-4 top-4 rounded-sm opacity-70 
              ring-offset-background transition-opacity hover:opacity-100
               focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2
                disabled:pointer-events-none data-[state=open]:bg-accent
                 data-[state=open]:text-muted-foreground"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </button>
          </DialogClose>
        </DialogHeader>

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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {step === 1 && (
            <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  {...register("title", { required: "Title is required" })}
                />
                {errors.title && (
                  <p className="text-red-500 text-sm">{errors.title.message}</p>
                )}
              </div>
              <div>
                <Label>Type</Label>
                <Select
                  onValueChange={(value) => {
                    setValue("type", value, { shouldValidate: true });
                  }}
                  defaultValue={defaultValues?.type}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder="Select Type"
                      {...register("type", { required: "Type is required" })}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed</SelectItem>
                    <SelectItem value="reducing_balance">
                      Reducing Balance
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.type && (
                  <p className="text-red-500 text-sm">{errors.type.message}</p>
                )}
              </div>

              <div>
                <Label>Loan Interval</Label>
                <Select
                  onValueChange={(value) => {
                    setValue("product_interval", value, {
                      shouldValidate: true,
                    });
                  }}
                  defaultValue={defaultValues?.product_interval}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder="Select Loan Product Interval"
                      {...register("product_interval", {
                        required: "Loan Product Interval is required",
                      })}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
                {errors.product_interval && (
                  <p className="text-red-500 text-sm">
                    {errors.product_interval.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="interest_rate">Interest Rate</Label>
                <Input
                  id="interest_rate"
                  type="number"
                  step="0.01"
                  {...register("interest_rate", {
                    required: "Interest rate is required",
                  })}
                />
                {errors.interest_rate && (
                  <p className="text-red-500 text-sm">
                    {errors.interest_rate.message}
                  </p>
                )}
              </div>
            </fieldset>
          )}

          {step === 2 && (
            <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Penalty Interval</Label>
                <Select
                  onValueChange={(value) => {
                    setValue("penalty_interval", value, {
                      shouldValidate: true,
                    });
                  }}
                  defaultValue={defaultValues?.penalty_interval}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder="Select Penalty Interval"
                      {...register("penalty_interval", {
                        required: "Penalty Interval is required",
                      })}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
                {errors.penalty_interval && (
                  <p className="text-red-500 text-sm">
                    {errors.penalty_interval.message}
                  </p>
                )}
              </div>
              <div>
                <Label>Penalty Mode</Label>
                <Select
                  onValueChange={(value) => {
                    setValue("penalty_mode", value, { shouldValidate: true });
                  }}
                  defaultValue={defaultValues?.penalty_mode}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder="Select Penalty Mode"
                      {...register("penalty_mode", {
                        required: "Penalty mode is required",
                      })}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="value">Value</SelectItem>
                  </SelectContent>
                </Select>
                {errors.penalty_mode && (
                  <p className="text-red-500 text-sm">
                    {errors.penalty_mode.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="penalty_value">
                  {penaltyMode === "percentage"
                    ? "Percentage (%)"
                    : "Charge Amount"}
                </Label>
                <Input
                  id="penalty_value"
                  type="number"
                  step="0.01"
                  placeholder={
                    penaltyMode === "percentage"
                      ? "Enter Percentage (%)"
                      : "Enter Charge"
                  }
                  {...register("penalty_value", {
                    required: `${
                      penaltyMode === "percentage"
                        ? "Percentage is required"
                        : "Charge is required"
                    }`,
                  })}
                />
                {errors.penalty_value && (
                  <p className="text-red-500 text-sm">
                    {errors.penalty_value.message}
                  </p>
                )}
              </div>
            </fieldset>
          )}

          {step === 3 && (
            <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="penalty_offset_period">
                  Penalty Offset Period
                </Label>
                <Input
                  id="penalty_offset_period"
                  type="number"
                  {...register("penalty_offset_period", {
                    required: "Penalty offset period is required",
                  })}
                />
                {errors.penalty_offset_period && (
                  <p className="text-red-500 text-sm">
                    {errors.penalty_offset_period.message}
                  </p>
                )}
              </div>
              <div>
                <Label>Penalty Offset Interval</Label>
                <Select
                  onValueChange={(value) => {
                    setValue("penalty_offset_interval", value, {
                      shouldValidate: true,
                    });
                  }}
                  defaultValue={defaultValues?.penalty_offset_interval}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder="Select Penalty Offset Interval"
                      {...register("penalty_offset_interval", {
                        required: "Penalty offset interval is required",
                      })}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="days">Days</SelectItem>
                    <SelectItem value="weeks">Weeks</SelectItem>
                    <SelectItem value="months">Months</SelectItem>
                    <SelectItem value="years">Years</SelectItem>
                    <SelectItem value="one_time">One Time</SelectItem>
                  </SelectContent>
                </Select>
                {errors.penalty_offset_interval && (
                  <p className="text-red-500 text-sm">
                    {errors.penalty_offset_interval.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="penalty_grace_period">
                  Penalty Grace Period
                </Label>
                <Input
                  id="penalty_grace_period"
                  type="number"
                  //   step="any"
                  {...register("penalty_grace_period", {
                    required: "Penalty grace period is required",
                  })}
                />
                {errors.penalty_grace_period && (
                  <p className="text-red-500 text-sm">
                    {errors.penalty_grace_period.message}
                  </p>
                )}
              </div>
              <div>
                <Label>Penalty Grace Period Interval</Label>
                <Select
                  onValueChange={(value) => {
                    setValue("penalty_grace_period_interval", value, {
                      shouldValidate: true,
                    });
                  }}
                  defaultValue={defaultValues?.penalty_grace_period_interval}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder="Select Penalty Grace Period Interval"
                      {...register("penalty_grace_period_interval", {
                        required: "Penalty grace period interval is required",
                      })}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="days">Days</SelectItem>
                    <SelectItem value="weeks">Weeks</SelectItem>
                    <SelectItem value="months">Months</SelectItem>
                    <SelectItem value="years">Years</SelectItem>
                    <SelectItem value="one_time">One Time</SelectItem>
                  </SelectContent>
                </Select>
                {errors.penalty_grace_period_interval && (
                  <p className="text-red-500 text-sm">
                    {errors.penalty_grace_period_interval.message}
                  </p>
                )}
              </div>
            </fieldset>
          )}

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
                <Button type="submit">
                  {isSubmitting ? (
                    "Saving Please wait ..."
                  ) : (
                    <>
                      Save Changes <CheckCircle className="ml-2" />
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

export default EditLoanProductDialog;

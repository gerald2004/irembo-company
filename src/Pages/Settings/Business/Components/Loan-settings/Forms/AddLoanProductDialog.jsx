/* eslint-disable react/prop-types */
import { useState } from "react";
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
  Settings2,
} from "lucide-react";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { toast } from "@/hooks/use-toast";

const AddLoanProductDialog = ({ isOpen, onClose, refetch }) => {
  const axiosPrivate = useAxiosPrivate();
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

  // Watch fields used for conditional UI/validation
  const penaltyMode = watch("penalty_mode");
  const monitoringEnabled = watch("monitoring_fee_enabled"); // "on" | "off"
  const monitoringType = watch("monitoring_fee_type"); // "percentage" | "value"

  const validateStep = async () => {
    // We keep your pattern: fields are registered only when visible,
    // so `trigger()` won’t validate future steps.
    const valid = await trigger();
    if (valid && step < 4) {
      setStep((prev) => prev + 1);
    }
  };

  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const onSubmit = async (data) => {
    const controller = new AbortController();

    // If monitoring is ON, enforce minimal validation here as a guard
    if (data.monitoring_fee_enabled === "on") {
      if (!data.monitoring_fee_type) {
        toast({
          title: "Validation",
          variant: "destructive",
          description: "Monitoring fee type is required.",
        });
        return;
      }
      if (
        data.monitoring_fee_value === undefined ||
        data.monitoring_fee_value === "" ||
        Number(data.monitoring_fee_value) < 0
      ) {
        toast({
          title: "Validation",
          variant: "destructive",
          description: "Monitoring fee value must be a non-negative number.",
        });
        return;
      }
    }

    try {
      const response = await axiosPrivate.post(
        `/settings/loans/products`,
        data,
        { signal: controller.signal }
      );
      toast({ title: "Success", description: response?.data?.messages });
      reset();
      refetch?.();
      onClose?.();
    } catch (error) {
      const errorMessage =
        error?.response?.data?.messages || "No server response";
      toast({
        title: "Uh oh! Something went wrong.",
        variant: "destructive",
        description: Array.isArray(errorMessage)
          ? errorMessage.join(", ")
          : errorMessage,
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
    {
      icon: <Settings2 className="w-6 h-6 text-purple-500" />,
      label: "Monitoring Fee",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Add Loan Product</DialogTitle>
          <DialogDescription>
            Follow the steps to complete adding a new loan product.
          </DialogDescription>
          <DialogClose asChild>
            <button
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
              onClick={() => {
                reset();
                setStep(1);
                onClose?.();
              }}
            >
              <X className="h-4 w-4" />
            </button>
          </DialogClose>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center space-x-4 my-1">
          {stepIcons.map((s, i) => (
            <div
              key={i}
              className={`flex items-center ${
                step > i + 1 ? "opacity-100" : "opacity-50"
              } transition-opacity`}
            >
              {s.icon}
              <span className="ml-2 text-sm font-medium">{s.label}</span>
              {i < stepIcons.length - 1 && (
                <div className="h-[2px] w-8 bg-gray-300 mx-2" />
              )}
            </div>
          ))}
        </div>
        <Progress value={(step / 4) * 100} className="my-1" />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* STEP 1 */}
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
                  onValueChange={(value) =>
                    setValue("type", value, { shouldValidate: true })
                  }
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
                  onValueChange={(value) =>
                    setValue("interval", value, { shouldValidate: true })
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder="Select Loan Product Interval"
                      {...register("interval", {
                        required: "Loan Product is required",
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
                {errors.interval && (
                  <p className="text-red-500 text-sm">
                    {errors.interval.message}
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

              <div>
                <Label>Interest Rate Type</Label>
                <Select
                  onValueChange={(value) =>
                    setValue("interest_rate_type", value, { shouldValidate: true })
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder="Select Rate Type"
                      {...register("interest_rate_type", {
                        required: "Interest rate type is required",
                      })}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per_period">Per Period</SelectItem>
                    <SelectItem value="total_flat">Total Flat</SelectItem>
                  </SelectContent>
                </Select>
                {errors.interest_rate_type && (
                  <p className="text-red-500 text-sm">
                    {errors.interest_rate_type.message}
                  </p>
                )}
              </div>
            </fieldset>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Penalty Interval</Label>
                <Select
                  onValueChange={(value) =>
                    setValue("penalty_interval", value, {
                      shouldValidate: true,
                    })
                  }
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
                <Label htmlFor="penalty_amount">
                  {penaltyMode === "percentage"
                    ? "Percentage (%)"
                    : "Charge Amount"}
                </Label>
                <Input
                  id="penalty_amount"
                  type="number"
                  step="0.01"
                  placeholder={
                    penaltyMode === "percentage"
                      ? "Enter Percentage (%)"
                      : "Enter Charge"
                  }
                  {...register("penalty_amount", {
                    required: `${
                      penaltyMode === "percentage"
                        ? "Percentage is required"
                        : "Charge is required"
                    }`,
                  })}
                />
                {errors.penalty_amount && (
                  <p className="text-red-500 text-sm">
                    {errors.penalty_amount.message}
                  </p>
                )}
              </div>

              <div>
                <Label>Penalty Mode</Label>
                <Select
                  onValueChange={(value) =>
                    setValue("penalty_mode", value, { shouldValidate: true })
                  }
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

              {penaltyMode === "percentage" && (
                <div className="md:col-span-2">
                  <Label>Penalty Basis</Label>
                  <Select
                    onValueChange={(value) =>
                      setValue("penalty_basis", value, { shouldValidate: true })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder="Select what the % is applied to"
                        {...register("penalty_basis", {
                          validate: (v) =>
                            penaltyMode === "percentage"
                              ? !!v || "Penalty basis is required"
                              : true,
                        })}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="principal">Principal Only</SelectItem>
                      <SelectItem value="principal_interest">
                        Principal + Interest
                      </SelectItem>
                      <SelectItem value="outstanding_total">
                        Outstanding Total (Principal + Interest + Monitoring)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.penalty_basis && (
                    <p className="text-red-500 text-sm">
                      {errors.penalty_basis.message}
                    </p>
                  )}
                </div>
              )}
            </fieldset>
          )}

          {/* STEP 3 */}
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
                  onValueChange={(value) =>
                    setValue("penalty_offset_interval", value, {
                      shouldValidate: true,
                    })
                  }
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
                  onValueChange={(value) =>
                    setValue("penalty_grace_period_interval", value, {
                      shouldValidate: true,
                    })
                  }
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

          {/* STEP 4 — MONITORING FEE */}
          {step === 4 && (
            <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Monitoring Fee</Label>
                <Select
                  onValueChange={(value) =>
                    setValue("monitoring_fee_enabled", value, {
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder="Turn On or Off"
                      {...register("monitoring_fee_enabled", {
                        required: "Select On or Off",
                      })}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="off">Off</SelectItem>
                    <SelectItem value="on">On</SelectItem>
                  </SelectContent>
                </Select>
                {errors.monitoring_fee_enabled && (
                  <p className="text-red-500 text-sm">
                    {errors.monitoring_fee_enabled.message}
                  </p>
                )}
              </div>

              <div
                className={`${
                  monitoringEnabled === "on"
                    ? ""
                    : "opacity-50 pointer-events-none"
                }`}
              >
                <Label>Monitoring Fee Type</Label>
                <Select
                  onValueChange={(value) =>
                    setValue("monitoring_fee_type", value, {
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder="Select Type"
                      {...register("monitoring_fee_type", {
                        validate: (v) =>
                          monitoringEnabled === "on"
                            ? !!v || "Monitoring fee type is required"
                            : true,
                      })}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="value">Fixed</SelectItem>
                    <SelectItem value="percentage">Percentage</SelectItem>
                  </SelectContent>
                </Select>
                {errors.monitoring_fee_type && (
                  <p className="text-red-500 text-sm">
                    {errors.monitoring_fee_type.message}
                  </p>
                )}
              </div>

              <div
                className={`${
                  monitoringEnabled === "on"
                    ? ""
                    : "opacity-50 pointer-events-none"
                } md:col-span-2`}
              >
                <Label htmlFor="monitoring_fee_value">
                  {monitoringType === "percentage"
                    ? "Monitoring Percentage (%)"
                    : "Monitoring Amount"}
                </Label>
                <Input
                  id="monitoring_fee_value"
                  type="number"
                  step="0.01"
                  placeholder={
                    monitoringType === "percentage"
                      ? "Enter Percentage (%)"
                      : "Enter Amount"
                  }
                  {...register("monitoring_fee_value", {
                    validate: (v) => {
                      if (monitoringEnabled !== "on") return true;
                      const n = Number(v);
                      if (Number.isNaN(n)) return "Must be a number";
                      if (n < 0) return "Must be non-negative";
                      return true;
                    },
                  })}
                />
                {errors.monitoring_fee_value && (
                  <p className="text-red-500 text-sm">
                    {errors.monitoring_fee_value.message}
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

              {step < 4 ? (
                <Button type="button" onClick={validateStep}>
                  Next <ArrowRight className="ml-2" />
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    "Saving Please wait ..."
                  ) : (
                    <>
                      Submit <CheckCircle className="ml-2" />
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

export default AddLoanProductDialog;

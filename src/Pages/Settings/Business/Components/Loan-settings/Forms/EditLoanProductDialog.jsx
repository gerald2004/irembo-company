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
import { useForm, Controller } from "react-hook-form";
import {
  ArrowRight,
  CheckCircle,
  ArrowLeft,
  Info,
  AlertTriangle,
  Check,
  Settings2,
  X,
} from "lucide-react";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { toast } from "@/hooks/use-toast";

const FINAL_STEP = 4;

const EditLoanProductDialog = ({ isOpen, onClose, refetch, defaultValues }) => {
  const axiosPrivate = useAxiosPrivate();
  const [step, setStep] = useState(1);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    trigger,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      // Step 1
      title: "",
      type: "",
      product_interval: "",
      interest_rate: "",

      // Step 2
      penalty_interval: "",
      penalty_mode: "",
      penalty_value: "",

      // Step 3
      penalty_offset_period: "",
      penalty_offset_interval: "",
      penalty_grace_period: "",
      penalty_grace_period_interval: "",

      // Step 4 (Monitoring)
      monitoring_fee_enabled: "off", // "on" | "off"
      monitoring_fee_type: "", // "value" | "percentage" (UI terms)
      monitoring_fee_value: "",
    },
  });

  // Hydrate form when defaults change
  useEffect(() => {
    if (!defaultValues) return;

    // Basic
    setValue("title", defaultValues.title ?? "");
    setValue("type", defaultValues.type ?? "");
    setValue("product_interval", defaultValues.product_interval ?? "");
    setValue("interest_rate", defaultValues.interest_rate ?? "");

    // Penalties
    setValue("penalty_interval", defaultValues.penalty_interval ?? "");
    setValue("penalty_mode", defaultValues.penalty_mode ?? "");
    setValue(
      "penalty_value",
      defaultValues.penalty_value ?? defaultValues.penalty_amount ?? ""
    );
    setValue(
      "penalty_offset_period",
      defaultValues.penalty_offset_period ?? ""
    );
    setValue(
      "penalty_offset_interval",
      defaultValues.penalty_offset_interval ?? ""
    );
    setValue("penalty_grace_period", defaultValues.penalty_grace_period ?? "");
    setValue(
      "penalty_grace_period_interval",
      defaultValues.penalty_grace_period_interval ?? ""
    );

    // Monitoring: backend → UI
    const enabled =
      Number(defaultValues.monitoring_fee_enabled) === 1 ? "on" : "off";
    let uiType = "";
    if (defaultValues.monitoring_fee_type === "fixed") uiType = "value";
    else if (defaultValues.monitoring_fee_type === "percent")
      uiType = "percentage";

    setValue("monitoring_fee_enabled", enabled);
    setValue("monitoring_fee_type", uiType);
    setValue("monitoring_fee_value", defaultValues.monitoring_fee_value ?? "");
  }, [defaultValues, setValue]);

  const penaltyMode = watch("penalty_mode");
  const monitoringEnabled = watch("monitoring_fee_enabled"); // "on" | "off"
  const monitoringType = watch("monitoring_fee_type"); // "value" | "percentage"

  // Validate only currently visible fields
  const validateStep = async () => {
    const valid = await trigger();
    if (valid && step < FINAL_STEP) setStep((s) => s + 1);
  };

  const prevStep = () => setStep((s) => Math.max(1, s - 1));

  const onSubmit = async (data) => {
    const controller = new AbortController();

    const payload = {
      ...data,
      interval: data.product_interval, // backend expects "interval"
    };

    // Monitoring: UI → backend mapping
    payload.monitoring_fee_enabled =
      data.monitoring_fee_enabled === "on" ? 1 : 0;

    if (payload.monitoring_fee_enabled === 1) {
      if (!data.monitoring_fee_type) {
        toast({
          title: "Validation",
          variant: "destructive",
          description: "Monitoring fee type is required.",
        });
        return;
      }
      if (
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
      payload.monitoring_fee_type =
        data.monitoring_fee_type === "value" ? "fixed" : "percent";
      payload.monitoring_fee_value = Number(data.monitoring_fee_value);
    } else {
      payload.monitoring_fee_type = null;
      payload.monitoring_fee_value = null;
    }

    try {
      // Use your registered route; if .htaccess expects query (?productid=)
      // change to: `/settings/loans/products?productid=${defaultValues.id}`
      const url = `/settings/loans/products/${defaultValues.id}`;
      const response = await axiosPrivate.patch(url, payload, {
        signal: controller.signal,
      });

      toast({ title: "Success", description: response?.data?.messages });
      onClose?.();
      refetch?.();
      reset();
      setStep(1);
    } catch (error) {
      const msg =
        error?.response?.data?.messages ||
        error?.response?.data?.message ||
        "No server response";
      toast({
        title: "Uh oh! Something went wrong.",
        variant: "destructive",
        description: Array.isArray(msg) ? msg.join(", ") : msg,
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
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          reset();
          setStep(1);
          onClose?.();
        }
      }}
    >
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Edit Loan Product</DialogTitle>
          <DialogDescription>
            Follow the steps to edit the loan product details.
          </DialogDescription>

          <DialogClose asChild>
            <button
              className="absolute right-4 top-4 rounded-sm opacity-70 
              ring-offset-background transition-opacity hover:opacity-100
              focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
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
                <div className="h-[2px] w-8 bg-gray-300 mx-2"></div>
              )}
            </div>
          ))}
        </div>
        <Progress value={(step / FINAL_STEP) * 100} className="my-1" />

        {/* We NEVER let the browser submit this form. */}
        <form
          noValidate
          onSubmit={(e) => e.preventDefault()}
          onKeyDown={async (e) => {
            // Treat Enter as "Next" for steps 1-3; only allow at step 4
            if (e.key === "Enter") {
              if (step < FINAL_STEP) {
                e.preventDefault();
                await validateStep();
              } else {
                e.preventDefault();
                // Manually trigger save at final step
                await handleSubmit(onSubmit)();
              }
            }
          }}
          className="space-y-4"
        >
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
                <Controller
                  name="type"
                  control={control}
                  rules={{ required: "Type is required" }}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">Fixed</SelectItem>
                        <SelectItem value="reducing_balance">
                          Reducing Balance
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.type && (
                  <p className="text-red-500 text-sm">{errors.type.message}</p>
                )}
              </div>

              <div>
                <Label>Loan Interval</Label>
                <Controller
                  name="product_interval"
                  control={control}
                  rules={{ required: "Loan Product Interval is required" }}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Loan Product Interval" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
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

          {/* STEP 2 */}
          {step === 2 && (
            <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Penalty Interval</Label>
                <Controller
                  name="penalty_interval"
                  control={control}
                  rules={{ required: "Penalty Interval is required" }}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Penalty Interval" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.penalty_interval && (
                  <p className="text-red-500 text-sm">
                    {errors.penalty_interval.message}
                  </p>
                )}
              </div>

              <div>
                <Label>Penalty Mode</Label>
                <Controller
                  name="penalty_mode"
                  control={control}
                  rules={{ required: "Penalty mode is required" }}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Penalty Mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="value">Value</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.penalty_mode && (
                  <p className="text-red-500 text-sm">
                    {errors.penalty_mode.message}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
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
                    required:
                      penaltyMode === "percentage"
                        ? "Percentage is required"
                        : "Charge is required",
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
                <Controller
                  name="penalty_offset_interval"
                  control={control}
                  rules={{ required: "Penalty offset interval is required" }}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Penalty Offset Interval" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="days">Days</SelectItem>
                        <SelectItem value="weeks">Weeks</SelectItem>
                        <SelectItem value="months">Months</SelectItem>
                        <SelectItem value="years">Years</SelectItem>
                        <SelectItem value="one_time">One Time</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
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
                <Controller
                  name="penalty_grace_period_interval"
                  control={control}
                  rules={{
                    required: "Penalty grace period interval is required",
                  }}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Penalty Grace Period Interval" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="days">Days</SelectItem>
                        <SelectItem value="weeks">Weeks</SelectItem>
                        <SelectItem value="months">Months</SelectItem>
                        <SelectItem value="years">Years</SelectItem>
                        <SelectItem value="one_time">One Time</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
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
                <Controller
                  name="monitoring_fee_enabled"
                  control={control}
                  rules={{ required: "Select On or Off" }}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Turn On or Off" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="off">Off</SelectItem>
                        <SelectItem value="on">On</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
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
                <Controller
                  name="monitoring_fee_type"
                  control={control}
                  rules={{
                    validate: (v) =>
                      monitoringEnabled === "on"
                        ? !!v || "Monitoring fee type is required"
                        : true,
                  }}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="value">Fixed</SelectItem>
                        <SelectItem value="percentage">Percentage</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.monitoring_fee_type && (
                  <p className="text-red-500 text-sm">
                    {errors.monitoring_fee_type.message}
                  </p>
                )}
              </div>

              <div
                className={`md:col-span-2 ${
                  monitoringEnabled === "on"
                    ? ""
                    : "opacity-50 pointer-events-none"
                }`}
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

              {step < FINAL_STEP ? (
                <Button type="button" onClick={validateStep}>
                  Next <ArrowRight className="ml-2" />
                </Button>
              ) : (
                // 🚫 Not a submit button; we call handleSubmit manually.
                <Button
                  type="button"
                  onClick={handleSubmit(onSubmit)}
                  disabled={isSubmitting}
                >
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

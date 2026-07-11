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
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
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
  CheckCircle,
  X,
  Info,
  FileText,
  LockKeyhole,
} from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { EmployeeCombobox } from "@/Pages/Components/EmployeeCombobox";

const TOTAL_STEPS = 3;

const SalaryAdvanceApplicationDialog = ({ isOpen, onClose, refetch }) => {
  const axiosPrivate = useAxiosPrivate();

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["salary-advance-products", "active"],
    queryFn: async () => {
      const response = await axiosPrivate.get(`/settings/salary-advance/products`);
      return (response?.data?.data?.salary_advance_products ?? []).filter(
        (p) => p.status === "active"
      );
    },
    enabled: isOpen,
  });

  const {
    register,
    handleSubmit,
    control,
    trigger,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: { user_id: "", salary_advance_product_id: "", amount_requested: "", narration: "" },
  });

  const [step, setStep] = useState(1);
  const [selectedEmployee, setSelectedEmployee] = useState(null); // raw user object

  const watchedProductId = watch("salary_advance_product_id");
  const watchedAmount = parseFloat(watch("amount_requested")) || 0;

  const selectedProduct = products.find(
    (p) => String(p.id) === String(watchedProductId)
  );

  const maxEligible =
    selectedEmployee && selectedProduct
      ? Math.round(
          ((Number(selectedEmployee.user_salary) || 0) *
            (Number(selectedProduct.max_advance_percentage) || 0)) /
            100
        )
      : null;

  const handleClose = () => {
    reset();
    setStep(1);
    setSelectedEmployee(null);
    onClose?.();
  };

  const validateStep = async () => {
    if (step === 1) {
      const valid = await trigger([
        "user_id",
        "salary_advance_product_id",
        "amount_requested",
      ]);
      if (valid) setStep(2);
      return;
    }
    if (step === 2) {
      setStep(3);
    }
  };

  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const onSubmit = async (data) => {
    const controller = new AbortController();
    try {
      const payload = {
        user_id: Number(data.user_id),
        salary_advance_product_id: Number(data.salary_advance_product_id),
        amount_requested: Number(data.amount_requested),
        narration: data.narration || undefined,
        user_pincode: data.user_pincode,
      };
      const response = await axiosPrivate.post(
        `/salary-advance/applications`,
        payload,
        { signal: controller.signal }
      );
      toast({ title: "Success", description: response?.data?.messages });
      handleClose();
      refetch?.();
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
    { icon: <Info className="w-6 h-6 text-blue-500" />, label: "Application Details" },
    { icon: <FileText className="w-6 h-6 text-purple-500" />, label: "Narration" },
    { icon: <LockKeyhole className="w-6 h-6 text-yellow-500" />, label: "PIN" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Apply For Salary Advance</DialogTitle>
          <DialogDescription>
            Follow the steps to submit a salary advance application on behalf of a
            staff member.
          </DialogDescription>
          <DialogClose asChild>
            <button
              className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:outline-none"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </button>
          </DialogClose>
        </DialogHeader>

        <div className="flex items-center space-x-4 my-1">
          {stepIcons.map((s, index) => (
            <div
              key={index}
              className={`flex items-center ${
                step > index + 1 ? "opacity-100" : "opacity-50"
              } transition-opacity`}
            >
              {s.icon}
              <span className="ml-2 text-sm font-medium">{s.label}</span>
              {index < stepIcons.length - 1 && (
                <div className="h-[2px] w-8 bg-gray-300 mx-2" />
              )}
            </div>
          ))}
        </div>
        <Progress value={(step / TOTAL_STEPS) * 100} className="my-1" />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {step === 1 && (
            <fieldset className="grid grid-cols-1 gap-4">
              <Controller
                name="user_id"
                control={control}
                rules={{ required: "Staff member is required" }}
                render={({ field }) => (
                  <EmployeeCombobox
                    label="Staff Member"
                    selectedEmployee={field.value ? Number(field.value) : null}
                    onEmployeeSelect={(value, raw) => {
                      field.onChange(value);
                      setSelectedEmployee(raw);
                    }}
                  />
                )}
              />
              {errors.user_id && (
                <p className="text-red-500 text-sm">{errors.user_id.message}</p>
              )}

              <div>
                <Label htmlFor="salary_advance_product_id">Salary Advance Product</Label>
                <Controller
                  name="salary_advance_product_id"
                  control={control}
                  rules={{ required: "Product is required" }}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a product" />
                      </SelectTrigger>
                      <SelectContent>
                        {productsLoading ? (
                          <SelectItem value="loading" disabled>
                            Loading...
                          </SelectItem>
                        ) : (
                          products.map((product) => (
                            <SelectItem key={product.id} value={String(product.id)}>
                              {product.title} (max {product.max_advance_percentage}%)
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.salary_advance_product_id && (
                  <p className="text-red-500 text-sm">
                    {errors.salary_advance_product_id.message}
                  </p>
                )}
              </div>

              {selectedEmployee && selectedProduct && (
                <div className="flex flex-wrap gap-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-800/50 rounded-md px-3 py-2">
                  <Badge variant="outline" className="text-xs">
                    Salary: {Number(selectedEmployee.user_salary ?? 0).toLocaleString()}
                  </Badge>
                  <Badge variant="outline" className="text-xs text-blue-700">
                    Max eligible: {maxEligible?.toLocaleString() ?? "—"}
                  </Badge>
                </div>
              )}

              <div>
                <Label htmlFor="amount_requested">Amount Requested</Label>
                <Input
                  id="amount_requested"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Enter amount"
                  {...register("amount_requested", {
                    required: "Amount is required",
                    min: { value: 0.01, message: "Must be greater than 0" },
                    validate: (v) =>
                      maxEligible == null || Number(v) <= maxEligible
                        ? true
                        : `Cannot exceed the max eligible amount of ${maxEligible.toLocaleString()}`,
                  })}
                />
                {errors.amount_requested && (
                  <p className="text-red-500 text-sm">
                    {errors.amount_requested.message}
                  </p>
                )}
              </div>
            </fieldset>
          )}

          {step === 2 && (
            <div>
              <Label htmlFor="narration">Narration (optional)</Label>
              <Textarea
                id="narration"
                placeholder="Reason for this salary advance..."
                {...register("narration")}
              />
              <div className="text-xs text-muted-foreground border rounded-md p-3 bg-muted/30 mt-3 space-y-1">
                <p>
                  Staff:{" "}
                  <span className="font-medium text-foreground">
                    {selectedEmployee
                      ? `${selectedEmployee.user_firstname} ${selectedEmployee.user_lastname}`
                      : "—"}
                  </span>
                </p>
                <p>
                  Product:{" "}
                  <span className="font-medium text-foreground">
                    {selectedProduct?.title ?? "—"}
                  </span>
                </p>
                <p>
                  Amount:{" "}
                  <span className="font-medium text-foreground">
                    {watchedAmount.toLocaleString()}
                  </span>
                </p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col items-center">
              <Controller
                control={control}
                name="user_pincode"
                rules={{
                  required: "Pincode is required",
                  pattern: { value: /^\d{4}$/, message: "PIN must be exactly 4 digits" },
                }}
                render={({ field }) => (
                  <>
                    <Label>Enter Your Pincode to Authorize</Label>
                    <InputOTP maxLength={4} {...field}>
                      <InputOTPGroup className="flex space-x-3 py-4">
                        <InputOTPSlot index={0} className="h-10 w-10 text-center rounded-md" />
                        <InputOTPSlot index={1} className="h-10 w-10 text-center rounded-md" />
                        <InputOTPSeparator />
                        <InputOTPSlot index={2} className="h-10 w-10 text-center rounded-md" />
                        <InputOTPSlot index={3} className="h-10 w-10 text-center rounded-md" />
                      </InputOTPGroup>
                    </InputOTP>
                  </>
                )}
              />
              {errors.user_pincode && (
                <p className="text-red-500 text-sm mt-1">{errors.user_pincode.message}</p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" onClick={prevStep} variant="secondary" disabled={step === 1}>
              <ArrowLeft className="mr-2" /> Back
            </Button>
            {step < TOTAL_STEPS && (
              <Button type="button" onClick={validateStep}>
                Next <ArrowRight className="ml-2" />
              </Button>
            )}
            {step === TOTAL_STEPS && (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Processing..." : "Submit"} <CheckCircle className="ml-2" />
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SalaryAdvanceApplicationDialog;

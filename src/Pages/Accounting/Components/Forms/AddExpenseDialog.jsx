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
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  X,
  Info,
  LockKeyhole,
  CalendarIcon,
} from "lucide-react";
import { AccountCombobox } from "@/Pages/Components/AccountCombobox";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AddExpenseDialog = ({
  isOpen,
  onClose,
  refetch,
  accountsData,
  isLoadingAccounts,
  isErrorAccounts,
  refetchAccounts,
  isRefetchingAccounts,
}) => {
  const axiosPrivate = useAxiosPrivate();

  const {
    register,
    handleSubmit,
    control,
    trigger,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      vendor_bill_amount: "",
      vendor_bill_date: "",
      vendor_bill_due_date: "",
      vendor_id: "",
      vendor_bill_notes: "",
      user_pincode: "",
    },
    mode: "onTouched",
  });

  // ✅ format date as YYYY-MM-DD (LOCAL) to avoid timezone “day-before” issue
  const formatYMD = (date) => {
    if (!date) return "";
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  // ✅ Fetch vendors
  const { data: vendors = [], isLoading: isLoadingVendors } = useQuery({
    queryKey: ["vendors"],
    queryFn: async () => {
      const response = await axiosPrivate.get(`/accounting/vendors/account`);
      return response.data?.data?.vendors || [];
    },
  });

  const [selectedAccounts, setSelectedAccounts] = useState({
    expense_account_id: null,
  });

  const [step, setStep] = useState(1);

  const validateStep = async () => {
    // validate only step-1 fields
    const valid = await trigger([
      "vendor_bill_amount",
      "vendor_bill_date",
      "vendor_bill_due_date",
      "vendor_id",
      "vendor_bill_notes",
    ]);

    // also ensure expense account is selected
    if (!selectedAccounts.expense_account_id) {
      toast({
        title: "Missing expense account",
        variant: "destructive",
        description: "Please select an expense account.",
      });
      return;
    }

    if (valid && step < 2) setStep((prev) => prev + 1);
  };

  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        ...selectedAccounts,
      };

      const response = await axiosPrivate.post(
        "accounting/vendors/bills",
        payload,
      );

      toast({
        title: "Success",
        description: response.data.messages,
      });

      reset();
      setSelectedAccounts({ expense_account_id: null });
      setStep(1);
      refetch?.();
      onClose?.();
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
      label: "Expense Details",
    },
    {
      icon: <LockKeyhole className="w-6 h-6 text-yellow-500" />,
      label: "PinCode",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle>Expense Transaction</DialogTitle>
          <DialogDescription>
            Follow the steps to complete transaction.
          </DialogDescription>

          <DialogClose asChild>
            <button
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              onClick={() => {
                reset();
                setSelectedAccounts({ expense_account_id: null });
                setStep(1);
                onClose?.();
              }}
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </DialogClose>
        </DialogHeader>

        {/* Step Progress Indicator */}
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

        <Progress value={(step / 2) * 100} className="my-1" />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Step 1 */}
          {step === 1 && (
            <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Amount */}
              <div>
                <Label htmlFor="vendor_bill_amount">Expense Amount</Label>
                <Input
                  id="vendor_bill_amount"
                  type="number"
                  step="0.01"
                  placeholder="Enter expense amount"
                  {...register("vendor_bill_amount", {
                    required: "Expense amount is required",
                    validate: (v) =>
                      Number(v) > 0 || "Amount must be greater than 0",
                  })}
                />
                {errors.vendor_bill_amount && (
                  <p className="text-red-500 text-sm">
                    {errors.vendor_bill_amount.message}
                  </p>
                )}
              </div>

              {/* Expense Date */}
              <div>
                <Label htmlFor="vendor_bill_date">Expense Date</Label>
                <Controller
                  name="vendor_bill_date"
                  control={control}
                  rules={{ required: "Date is required" }}
                  render={({ field }) => {
                    const selected = field.value
                      ? new Date(field.value + "T00:00:00")
                      : null;

                    return (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant={"outline"}
                            className="w-full pl-3 text-left font-normal"
                          >
                            {field.value ? field.value : "Pick a date"}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>

                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={selected}
                            onSelect={(date) => field.onChange(formatYMD(date))}
                            disabled={(date) => date < new Date("2000-01-01")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    );
                  }}
                />
                {errors.vendor_bill_date && (
                  <p className="text-red-500 text-sm">
                    {errors.vendor_bill_date.message}
                  </p>
                )}
              </div>

              {/* Due Date */}
              <div>
                <Label htmlFor="vendor_bill_due_date">Expense Due Date</Label>
                <Controller
                  name="vendor_bill_due_date"
                  control={control}
                  rules={{
                    required: "Due date is required",
                    validate: (v) => {
                      const d1 = new Date(
                        (v || "").trim() + "T00:00:00",
                      ).getTime();
                      const d0 = new Date(
                        (control._formValues.vendor_bill_date || "").trim() +
                          "T00:00:00",
                      ).getTime();

                      if (!control._formValues.vendor_bill_date)
                        return "Select expense date first";
                      return (
                        d1 >= d0 || "Due date cannot be before expense date"
                      );
                    },
                  }}
                  render={({ field }) => {
                    const selected = field.value
                      ? new Date(field.value + "T00:00:00")
                      : null;

                    return (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant={"outline"}
                            className="w-full pl-3 text-left font-normal"
                          >
                            {field.value ? field.value : "Pick a date"}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>

                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={selected}
                            onSelect={(date) => field.onChange(formatYMD(date))}
                            disabled={(date) => date < new Date("2000-01-01")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    );
                  }}
                />
                {errors.vendor_bill_due_date && (
                  <p className="text-red-500 text-sm">
                    {errors.vendor_bill_due_date.message}
                  </p>
                )}
              </div>

              {/* Expense Account */}
              <AccountCombobox
                label="Expense Account"
                selectedAccount={selectedAccounts.expense_account_id}
                onAccountSelect={(value) =>
                  setSelectedAccounts((prev) => ({
                    ...prev,
                    expense_account_id: parseInt(value, 10),
                  }))
                }
                accountsData={accountsData}
                isLoading={isLoadingAccounts}
                isError={isErrorAccounts}
                refetch={refetchAccounts}
                isRefetching={isRefetchingAccounts}
              />

              {/* Vendor */}
              <div>
                <Label htmlFor="vendor_id">Vendor</Label>
                <Controller
                  name="vendor_id"
                  control={control}
                  rules={{ required: "Vendor is required" }}
                  render={({ field }) => (
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ""}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            isLoadingVendors ? "Loading..." : "Select vendor"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {vendors.map((vendor) => (
                          <SelectItem
                            key={vendor.vendor_id}
                            value={String(vendor.vendor_id)}
                          >
                            {`${vendor.vendor_firstname} ${vendor.vendor_lastname}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.vendor_id && (
                  <p className="text-red-500 text-sm">
                    {errors.vendor_id.message}
                  </p>
                )}
              </div>

              {/* Notes (required) */}
              <div>
                <Label htmlFor="vendor_bill_notes">Notes</Label>
                <Textarea
                  id="vendor_bill_notes"
                  placeholder="Add remarks / reason for expense..."
                  className="min-h-[5px]"
                  {...register("vendor_bill_notes", {
                    required: "Notes are required",
                    minLength: {
                      value: 3,
                      message: "Notes must be at least 3 characters",
                    },
                  })}
                />
                {errors.vendor_bill_notes && (
                  <p className="text-red-500 text-sm">
                    {errors.vendor_bill_notes.message}
                  </p>
                )}
              </div>
            </fieldset>
          )}

          {/* Step 2 */}
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

          {/* Footer */}
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

              {step === 1 ? (
                <Button type="button" onClick={validateStep}>
                  Next <ArrowRight className="ml-2" />
                </Button>
              ) : null}

              {step === 2 && (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    "Processing..."
                  ) : (
                    <>
                      Save <CheckCircle className="ml-2" />
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

export default AddExpenseDialog;

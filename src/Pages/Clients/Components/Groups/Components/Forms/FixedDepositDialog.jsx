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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  X,
  Info,
  LockKeyhole,
  CalendarIcon,
} from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
const FixedDepositDialog = ({ isOpen, onClose, refetch }) => {
  const axiosPrivate = useAxiosPrivate();
  const { id: clientId, client_id: accountId } = useParams(); // ✅ Get client_id from params
  const navigate = useNavigate();
  const { data = [] } = useQuery({
    queryKey: ["fixed-deposit-settings"],
    queryFn: async () => {
      const controller = new AbortController();

      const fetchURL = `/settings/fixed/settings`;
      try {
        const response = await axiosPrivate.get(fetchURL, {
          signal: controller.signal,
        });
        return response?.data?.data?.fixed_deposit_settings ?? [];
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
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const [step, setStep] = useState(1);

  const selectedSettingId = watch("setting_id");
  const selectedProduct = data?.find((item) => String(item.id) === String(selectedSettingId));
  const isUnitTrust = selectedProduct?.type === "unit_trust";

  const validateStep = async () => {
    const valid = await trigger();
    if (valid && step < 2) {
      setStep((prev) => prev + 1);
    }
  };

  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const toYmd = (v) => {
    if (!v) return null;
    const d = new Date(v);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const onSubmit = async (data) => {
    const controller = new AbortController();

    try {
      const payload = {
        ...data,
        start_date: toYmd(data.start_date),
        end_date: toYmd(data.end_date),
        client_id: clientId,
        client_account_id: accountId,
      };

      const response = await axiosPrivate.post(
        "/accounting/fixed/deposits",
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
      label: "Deposit Details",
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
          <DialogTitle>Fixed Deposit Transaction</DialogTitle>
          <DialogDescription>
            Follow the steps to complete the transaction.
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
          {/* Step 1: Deposit Details */}
          {step === 1 && (
            <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Deposit Amount */}
              <div>
                <Label htmlFor="amount">Deposit Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  {...register("amount", {
                    required: "Amount is required",
                  })}
                />
                {errors.amount && (
                  <p className="text-red-500 text-sm">
                    {errors.amount.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="setting_id">Deposit Product</Label>
                <Controller
                  name="setting_id"
                  control={control}
                  rules={{ required: "Deposit product is required" }}
                  render={({ field }) => (
                    <Select
                      value={field.value} // ✅ Ensure selected value is controlled
                      onValueChange={(value) => field.onChange(value)} // ✅ Update value properly
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Product">
                          {data?.find(
                            (item) => String(item.id) === String(field.value)
                          )?.title || "Select Product"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {data?.map((item) => (
                          <SelectItem key={item.id} value={String(item.id)}>
                            {item.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.setting_id && (
                  <p className="text-red-500 text-sm">
                    {errors.setting_id.message}
                  </p>
                )}
              </div>

              {/* Start Date */}
              <div>
                <Label htmlFor="start_date">Start Date</Label>
                <Controller
                  name="start_date"
                  control={control}
                  rules={{ required: "Start date is required" }}
                  render={({ field }) => (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className="w-full pl-3 text-left font-normal"
                        >
                          {field.value ? (
                            field.value.toLocaleDateString()
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date("2000-01-01")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                />

                {errors.start_date && (
                  <p className="text-red-500 text-sm">
                    {errors.start_date.message}
                  </p>
                )}
              </div>

              {/* End Date — hidden for unit trust */}
              {!isUnitTrust && (
                <div>
                  <Label htmlFor="end_date">End Date</Label>
                  <Controller
                    name="end_date"
                    control={control}
                    rules={{ required: isUnitTrust ? false : "End date is required" }}
                    render={({ field }) => {
                      const parsedDate = field.value ?? null;
                      return (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full pl-3 text-left font-normal">
                              {parsedDate ? parsedDate.toLocaleDateString() : "Pick a date"}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={parsedDate}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date("2000-01-01")}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      );
                    }}
                  />
                  {errors.end_date && (
                    <p className="text-red-500 text-sm">{errors.end_date.message}</p>
                  )}
                </div>
              )}

              {isUnitTrust && (
                <div className="flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 p-3 text-sm text-purple-700 col-span-1 md:col-span-2">
                  <span className="font-medium">Unit Trust product selected</span> — no fixed end date. Deposits and withdrawals can be made at any time.
                </div>
              )}
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

export default FixedDepositDialog;

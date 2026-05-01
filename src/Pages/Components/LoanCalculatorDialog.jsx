/* eslint-disable react/prop-types */
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
import { Badge } from "@/components/ui/badge";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { X, CalculatorIcon, CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  PopoverContent,
  Popover,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";
import LoanCalculator from "./LoanCalculator";

const intervalLabel = {
  daily: "days",
  weekly: "weeks",
  monthly: "months",
  yearly: "years",
};

const LoanCalculatorDialog = ({ isOpen, onClose }) => {
  const axiosPrivate = useAxiosPrivate();

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const { data: loanProducts = [] } = useQuery({
    queryKey: ["loanProducts"],
    queryFn: async () => {
      const controller = new AbortController();
      const response = await axiosPrivate.get("/settings/loans/products", {
        signal: controller.signal,
      });
      return response?.data?.data?.loan_products || [];
    },
  });

  const [showCalculatorDailog, setShowCalculatorDailog] = useState(false);
  const [data, setData] = useState([]);

  const watchedProductId = watch("loan_product");
  const selectedProduct = loanProducts.find(
    (p) => String(p.id) === String(watchedProductId)
  );
  const tenureUnit = intervalLabel[selectedProduct?.product_interval] ?? "periods";

  const handleOpenLoanCalculator = (loanCalculator, loanCharges) => {
    setData({ loanCalculator, loanCharges });
    setShowCalculatorDailog(true);
  };

  const handleCloseLoanCalculator = () => {
    setShowCalculatorDailog(false);
    setData({});
  };

  const onSubmit = async (data) => {
    const controller = new AbortController();
    try {
      const loanCharges = await axiosPrivate.get(
        `settings/loans/autocharges/${data.loan_product}/product`,
        { signal: controller.signal }
      );
      const response = await axiosPrivate.post("/loans/calculator", data, {
        signal: controller.signal,
      });
      reset();
      handleOpenLoanCalculator(
        response.data.data ?? [],
        loanCharges.data.data.auto_charges ?? []
      );
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Loan Calculator</DialogTitle>
            <DialogDescription>
              Enter loan details to calculate your repayment schedule.
            </DialogDescription>
            <DialogClose asChild>
              <button
                className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </button>
            </DialogClose>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Product selector first — drives period label */}
              <div className="md:col-span-2">
                <Label htmlFor="loan_product">Loan Product</Label>
                <Controller
                  name="loan_product"
                  control={control}
                  rules={{ required: "Loan product is required" }}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a product">
                          {loanProducts?.find(
                            (item) => String(item.id) === String(field.value)
                          )?.title || "Select Product"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {loanProducts.map((item) => (
                          <SelectItem key={item.id} value={String(item.id)}>
                            {item.title} ({item.interest_rate}%)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.loan_product && (
                  <p className="text-red-500 text-sm">{errors.loan_product.message}</p>
                )}
              </div>

              {/* Product info strip */}
              {selectedProduct && (
                <div className="md:col-span-2 flex flex-wrap gap-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-800/50 rounded-md px-3 py-2">
                  <Badge variant="outline" className="text-xs capitalize">
                    {selectedProduct.type?.replace("_", " ")}
                  </Badge>
                  <Badge variant="outline" className="text-xs capitalize">
                    {selectedProduct.product_interval} repayments
                  </Badge>
                  <Badge variant="outline" className="text-xs text-blue-700">
                    {selectedProduct.interest_rate}% interest
                  </Badge>
                  <span className="text-xs text-muted-foreground self-center ml-auto">
                    Period in <strong>{tenureUnit}</strong>
                  </span>
                </div>
              )}

              <div>
                <Label htmlFor="amount">Loan Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="Enter loan amount"
                  {...register("amount", { required: "Amount is required" })}
                />
                {errors.amount && (
                  <p className="text-red-500 text-sm">{errors.amount.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="period">Loan Period ({tenureUnit})</Label>
                <Input
                  id="period"
                  type="number"
                  min="1"
                  placeholder={`Enter number of ${tenureUnit}`}
                  {...register("period", {
                    required: "Loan period is required",
                    min: { value: 1, message: "Must be at least 1" },
                  })}
                />
                {errors.period && (
                  <p className="text-red-500 text-sm">{errors.period.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="date">Start Date</Label>
                <Controller
                  name="date"
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
                            new Date(field.value).toLocaleDateString()
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => field.onChange(date?.toISOString())}
                          disabled={(date) => date < new Date("1920-01-01")}
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                />
                {errors.date && (
                  <p className="text-red-500 text-sm">{errors.date.message}</p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                Calculate <CalculatorIcon className="ml-2" />
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {showCalculatorDailog && (
        <LoanCalculator
          isOpen={showCalculatorDailog}
          onClose={handleCloseLoanCalculator}
          data={data}
        />
      )}
    </>
  );
};

export default LoanCalculatorDialog;

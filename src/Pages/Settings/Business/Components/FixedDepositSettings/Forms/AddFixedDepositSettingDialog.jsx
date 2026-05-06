/* eslint-disable react/prop-types */
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { toast } from "@/hooks/use-toast";
import { AccountCombobox } from "@/Pages/Components/AccountCombobox";
import { useState } from "react";

const AddFixedDepositSettingDialog = ({
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
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const [selectedAccounts, setSelectedAccounts] = useState({
    account_fixed_deposits: null,
    account_interest_expense: null,
    account_payee: null,
  });

  const onSubmit = async (data) => {
          const controller = new AbortController();

    const payload = {
      ...data,
      ...selectedAccounts,
    };
    try {
      const response = await axiosPrivate.post(
        "/settings/fixed/settings",
        payload,
        { signal: controller.signal }
      );
      toast({
        title: "Success",
        description:
          response?.data?.messages ||
          "Fixed Deposit Setting added successfully",
      });
      reset();
      refetch?.();
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

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Fixed Deposit Setting</DialogTitle>
          <DialogDescription>
            Fill in the form below to add a new Fixed Deposit Setting.
          </DialogDescription>
          <DialogClose asChild>
            <button
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </button>
          </DialogClose>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Enter Fixed Deposit Settings Title"
                {...register("title", { required: "Title is required" })}
              />
              {errors.title && (
                <p className="text-red-500 text-sm">{errors.title.message}</p>
              )}
            </div>

            {/* Interest */}
            <div>
              <Label htmlFor="interest">Interest Rate (%)</Label>
              <Input
                id="interest"
                type="number"
                step="0.01"
                placeholder="Enter Interest Rate"
                {...register("interest", {
                  required: "Interest rate is required",
                })}
              />
              {errors.interest && (
                <p className="text-red-500 text-sm">
                  {errors.interest.message}
                </p>
              )}
            </div>

            {/* Product Type */}
            <div>
              <Label htmlFor="type">Product Type</Label>
              <Select
                onValueChange={(val) =>
                  setValue("type", val, { shouldValidate: true })
                }
              >
                <SelectTrigger
                  {...register("type", { required: "Product type is required" })}
                >
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal (Term Deposit)</SelectItem>
                  <SelectItem value="unit_trust">Unit Trust (Open-Ended)</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-red-500 text-sm">{errors.type.message}</p>
              )}
            </div>

            {/* Calculation Mode */}
            <div>
              <Label htmlFor="calculation_mode">Calculation Mode</Label>
              <Select
                onValueChange={(val) =>
                  setValue("calculation_mode", val, { shouldValidate: true })
                }
              >
                <SelectTrigger
                  {...register("calculation_mode", {
                    required: "Calculation Mode is required",
                  })}
                >
                  <SelectValue placeholder="Select Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">Simple</SelectItem>
                  <SelectItem value="compound">Compound</SelectItem>
                </SelectContent>
              </Select>
              {errors.calculation_mode && (
                <p className="text-red-500 text-sm">
                  {errors.calculation_mode.message}
                </p>
              )}
            </div>

            {/* Interval */}
            <div>
              <Label htmlFor="interval">Interval</Label>
              <Select
                onValueChange={(val) =>
                  setValue("interval", val, { shouldValidate: true })
                }
              >
                <SelectTrigger
                  {...register("interval", {
                    required: "Interval is required",
                  })}
                >
                  <SelectValue placeholder="Select Interval" />
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

            {/* Fixed Deposit Account */}
            <AccountCombobox
              label="Fixed Deposit Account"
              selectedAccount={selectedAccounts.account_fixed_deposits}
              onAccountSelect={(value) =>
                setSelectedAccounts((prev) => ({
                  ...prev,
                  account_fixed_deposits: parseInt(value),
                }))
              }
              accountsData={accountsData}
              isLoading={isLoadingAccounts}
              isError={isErrorAccounts}
              refetch={refetchAccounts}
              isRefetching={isRefetchingAccounts}
            />

            {/* Interest Expense Account */}
            <AccountCombobox
              label="Interest Expense Account"
              selectedAccount={selectedAccounts.account_interest_expense}
              onAccountSelect={(value) =>
                setSelectedAccounts((prev) => ({
                  ...prev,
                  account_interest_expense: parseInt(value),
                }))
              }
              accountsData={accountsData}
              isLoading={isLoadingAccounts}
              isError={isErrorAccounts}
              refetch={refetchAccounts}
              isRefetching={isRefetchingAccounts}
            />

            {/* Payee Account */}
            <AccountCombobox
              label="Interest Payable Account"
              selectedAccount={selectedAccounts.account_payee}
              onAccountSelect={(value) =>
                setSelectedAccounts((prev) => ({
                  ...prev,
                  account_payee: parseInt(value),
                }))
              }
              accountsData={accountsData}
              isLoading={isLoadingAccounts}
              isError={isErrorAccounts}
              refetch={refetchAccounts}
              isRefetching={isRefetchingAccounts}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddFixedDepositSettingDialog;

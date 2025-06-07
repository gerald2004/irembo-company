/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
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
import { toast } from "@/hooks/use-toast";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { AccountCombobox } from "@/Pages/Components/AccountCombobox";

const EditLoanFeeDialog = ({
  isOpen,
  onClose,
  refetch,
  defaultValues,
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
    watch,
    formState: { errors, isSubmitting },
  } = useForm();
  const [selectedAccounts, setSelectedAccounts] = useState({
    account: null,
    receivable_account: null,
  });
  useEffect(() => {
    if (defaultValues) {
      for (const [key, value] of Object.entries(defaultValues)) {
        setValue(key, value);
      }
      setSelectedAccounts({
        account_id: defaultValues.account?.account_id || null,
        receivable_account:
          defaultValues.receivable_account?.account_id || null,
      });
    }
  }, [defaultValues, setValue]);
  const onSubmit = async (data) => {
          const controller = new AbortController();

    const payload = {
      ...data,
      account_id: selectedAccounts.account_id,
      receivable_account: selectedAccounts.receivable_account,
    };
    try {
      const response = await axiosPrivate.patch(
        `/settings/loans/autocharges/${defaultValues?.id}`,
        payload,
        { signal: controller.signal }
      );
      toast({
        title: "Success",
        description:
          response?.data?.messages || "Loan fee updated successfully",
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
    const penaltyType = watch("type");

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Loan Fee</DialogTitle>
          <DialogDescription>
            Modify the fields below to update your Loan Fee.
          </DialogDescription>
          <DialogClose asChild>
            <button
              className="absolute right-4 top-4 rounded-sm opacity-70 
                ring-offset-background transition-opacity hover:opacity-100 
                focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 
                disabled:pointer-events-none"
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
                placeholder="Loan Fee Title"
                {...register("title", { required: "Title is required" })}
              />
              {errors.title && (
                <p className="text-red-500 text-sm">{errors.title.message}</p>
              )}
            </div>

            {/* Type (value/percentage) */}
            <div>
              <Label htmlFor="type">Charge Type</Label>
              <Select
                defaultValue={defaultValues?.type}
                onValueChange={(val) =>
                  setValue("type", val, { shouldValidate: true })
                }
              >
                <SelectTrigger
                  {...register("type", { required: "Charge Type is required" })}
                >
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="value">Value</SelectItem>
                  <SelectItem value="percentage">Percentage</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-red-500 text-sm">{errors.type.message}</p>
              )}
            </div>

            {/* Value */}
            <div>
              <Label htmlFor="value">
                {penaltyType === "percentage"
                  ? "Percentage (%)"
                  : "Charge Amount"}
              </Label>
              <Input
                id="value"
                type="number"
                step="0.01"
                placeholder={
                  penaltyType === "percentage"
                    ? "Enter Percentage (%)"
                    : "Enter Charge"
                }
                {...register("value", {
                  required: `${
                    penaltyType === "percentage"
                      ? "Percentage is required"
                      : "Charge is required"
                  }`,
                })}
              />
              {errors.value && (
                <p className="text-red-500 text-sm">{errors.value.message}</p>
              )}
            </div>

            {/* Nature (normal/saving) */}
            <div>
              <Label htmlFor="nature">Nature</Label>
              <Select
                defaultValue={defaultValues?.nature}
                onValueChange={(val) =>
                  setValue("nature", val, { shouldValidate: true })
                }
              >
                <SelectTrigger
                  {...register("nature", { required: "Nature is required" })}
                >
                  <SelectValue placeholder="Select Nature" />
                </SelectTrigger>
                <SelectContent>
                  {/* You had 'normal' in the example. If your DB is 'special/saving', adapt as needed */}
                  <SelectItem value="normal">Normal Charge</SelectItem>
                  <SelectItem value="saving">Saving Charge</SelectItem>
                </SelectContent>
              </Select>
              {errors.nature && (
                <p className="text-red-500 text-sm">{errors.nature.message}</p>
              )}
            </div>

            {/* Account Combobox */}
            <AccountCombobox
              label="Income Account"
              selectedAccount={selectedAccounts.account_id}
              onAccountSelect={(value) =>
                setSelectedAccounts((prev) => ({
                  ...prev,
                  account_id: parseInt(value, 10),
                }))
              }
              // pass in your loaded data
              accountsData={accountsData}
              isLoading={isLoadingAccounts}
              isError={isErrorAccounts}
              refetch={refetchAccounts}
              isRefetching={isRefetchingAccounts}
            />

            {/* Receivable Account Combobox */}
            <AccountCombobox
              label="Income Receivable Account"
              selectedAccount={selectedAccounts.receivable_account}
              onAccountSelect={(value) =>
                setSelectedAccounts((prev) => ({
                  ...prev,
                  receivable_account: parseInt(value, 10),
                }))
              }
              // pass in your loaded data
              accountsData={accountsData}
              isLoading={isLoadingAccounts}
              isError={isErrorAccounts}
              refetch={refetchAccounts}
              isRefetching={isRefetchingAccounts}
            />

            {/* Priority (mandatory/adjustment) */}
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                defaultValue={defaultValues?.priority}
                onValueChange={(val) =>
                  setValue("priority", val, { shouldValidate: true })
                }
              >
                <SelectTrigger
                  {...register("priority", {
                    required: "Priority is required",
                  })}
                >
                  <SelectValue placeholder="Select Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mandatory">Mandatory</SelectItem>
                  <SelectItem value="adjustment">Adjustment</SelectItem>
                </SelectContent>
              </Select>
              {errors.priority && (
                <p className="text-red-500 text-sm">
                  {errors.priority.message}
                </p>
              )}
            </div>

            {/* Trigger (manual, on_application, etc.) */}
            <div>
              <Label htmlFor="trigger">Trigger</Label>
              <Select
                defaultValue={defaultValues?.trigger}
                onValueChange={(val) =>
                  setValue("trigger", val, { shouldValidate: true })
                }
              >
                <SelectTrigger
                  {...register("trigger", { required: "Trigger is required" })}
                >
                  <SelectValue placeholder="Select Trigger" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="on_application">On Application</SelectItem>
                  <SelectItem value="on_disbursement">
                    On Disbursement
                  </SelectItem>
                  <SelectItem value="on_payoff">On Payoff</SelectItem>
                  <SelectItem value="on_reschedule">On Reschedule</SelectItem>
                  <SelectItem value="on_loan_top_up">On Loan Top-Up</SelectItem>
                  <SelectItem value="on_loan_reversal">
                    On Loan Reversal
                  </SelectItem>
                  <SelectItem value="on_rollover">On Rollover</SelectItem>
                  <SelectItem value="on_payment">On Payment</SelectItem>
                </SelectContent>
              </Select>
              {errors.trigger && (
                <p className="text-red-500 text-sm">{errors.trigger.message}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditLoanFeeDialog;

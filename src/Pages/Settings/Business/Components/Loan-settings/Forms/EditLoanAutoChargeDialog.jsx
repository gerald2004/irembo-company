/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { useFieldArray, useForm, Controller } from "react-hook-form";
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

const EMPTY_RANGES = [{ min: "", max: "", charge: "" }];

export default function EditLoanFeeDialog({
  isOpen,
  onClose,
  refetch,
  defaultValues,
  accountsData,
  isLoadingAccounts,
  isErrorAccounts,
  refetchAccounts,
  isRefetchingAccounts,
}) {
  const axiosPrivate = useAxiosPrivate();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      title: "",
      type: "", // "value" | "percentage" | "range"
      value: "",
      nature: "", // "normal" | "saving"
      priority: "", // "mandatory" | "adjustment"
      trigger: "", // etc...
      ranges: [],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "ranges",
  });

  const [selectedAccounts, setSelectedAccounts] = useState({
    account_id: null,
    receivable_account: null,
  });

  // Load defaults when dialog opens / defaults change
  useEffect(() => {
    if (!defaultValues) return;

    reset({
      title: defaultValues.title ?? "",
      type: defaultValues.type ?? "",
      value: defaultValues.type === "range" ? "" : defaultValues.value ?? "",
      nature: defaultValues.nature ?? "",
      priority: defaultValues.priority ?? "",
      trigger: defaultValues.trigger ?? "",
      ranges: defaultValues.type === "range" ? defaultValues.value ?? [] : [],
    });

    setSelectedAccounts({
      account_id: defaultValues.account?.account_id ?? null,
      receivable_account: defaultValues.receivable_account?.account_id ?? null,
    });
  }, [defaultValues, reset]);

  // Keep value/ranges in sync when type switches
  const chargeType = watch("type");
  useEffect(() => {
    if (chargeType === "range") {
      setValue("value", "");
      if (!fields.length) replace(EMPTY_RANGES);
    } else {
      replace([]); // clear ranges when not 'range'
    }
  }, [chargeType, fields.length, replace, setValue]);

  // Submit
  const onSubmit = async (data) => {
    const payload = {
      ...data,
      account_id: selectedAccounts.account_id,
      receivable_account: selectedAccounts.receivable_account,
      // ensure numbers where needed
      value: data.value === "" ? null : Number(data.value),
      ranges: (data.ranges || []).map((r) => ({
        min: r.min === "" ? null : Number(r.min),
        max: r.max === "" ? null : Number(r.max),
        charge: r.charge === "" ? null : Number(r.charge),
      })),
    };

    try {
      const res = await axiosPrivate.patch(
        `/settings/loans/autocharges/${defaultValues?.id}`,
        payload
      );

      toast({
        title: "Success",
        description: res?.data?.messages || "Loan fee updated successfully",
      });

      refetch?.();
      onClose?.();
    } catch (error) {
      const msg = error?.response?.data?.messages || "No server response";
      toast({
        title: "Uh oh! Something went wrong.",
        variant: "destructive",
        description: msg,
      });
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose?.();
      }}
    >
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
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
              type="button"
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

            {/* Charge Type */}
            <div>
              <Label>Charge Type</Label>
              <Controller
                name="type"
                control={control}
                rules={{ required: "Charge Type is required" }}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="value">Value</SelectItem>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="range">Range</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.type && (
                <p className="text-red-500 text-sm">{errors.type.message}</p>
              )}
            </div>

            {/* Value (hidden when range) */}
            {chargeType !== "range" && (
              <div>
                <Label htmlFor="value">
                  {chargeType === "percentage"
                    ? "Percentage (%)"
                    : "Charge Amount"}
                </Label>
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  placeholder={
                    chargeType === "percentage"
                      ? "Enter Percentage (%)"
                      : "Enter Charge"
                  }
                  {...register("value", {
                    required:
                      chargeType === "range"
                        ? false
                        : chargeType === "percentage"
                        ? "Percentage is required"
                        : "Charge is required",
                  })}
                />
                {errors.value && (
                  <p className="text-red-500 text-sm">{errors.value.message}</p>
                )}
              </div>
            )}

            {/* Nature */}
            <div>
              <Label>Nature</Label>
              <Controller
                name="nature"
                control={control}
                rules={{ required: "Nature is required" }}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Nature" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal Charge</SelectItem>
                      <SelectItem value="saving">Saving Charge</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.nature && (
                <p className="text-red-500 text-sm">{errors.nature.message}</p>
              )}
            </div>

            {/* Income Account */}
            <AccountCombobox
              label="Income Account"
              selectedAccount={selectedAccounts.account_id}
              onAccountSelect={(value) =>
                setSelectedAccounts((prev) => ({
                  ...prev,
                  account_id: value ? parseInt(value, 10) : null,
                }))
              }
              accountsData={accountsData}
              isLoading={isLoadingAccounts}
              isError={isErrorAccounts}
              refetch={refetchAccounts}
              isRefetching={isRefetchingAccounts}
            />

            {/* Receivable Account */}
            <AccountCombobox
              label="Income Receivable Account"
              selectedAccount={selectedAccounts.receivable_account}
              onAccountSelect={(value) =>
                setSelectedAccounts((prev) => ({
                  ...prev,
                  receivable_account: value ? parseInt(value, 10) : null,
                }))
              }
              accountsData={accountsData}
              isLoading={isLoadingAccounts}
              isError={isErrorAccounts}
              refetch={refetchAccounts}
              isRefetching={isRefetchingAccounts}
            />

            {/* Priority */}
            <div>
              <Label>Priority</Label>
              <Controller
                name="priority"
                control={control}
                rules={{ required: "Priority is required" }}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mandatory">Mandatory</SelectItem>
                      <SelectItem value="adjustment">Adjustment</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.priority && (
                <p className="text-red-500 text-sm">
                  {errors.priority.message}
                </p>
              )}
            </div>

            {/* Trigger */}
            <div>
              <Label>Trigger</Label>
              <Controller
                name="trigger"
                control={control}
                rules={{ required: "Trigger is required" }}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Trigger" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="on_application">
                        On Application
                      </SelectItem>
                      <SelectItem value="on_disbursement">
                        On Disbursement
                      </SelectItem>
                      <SelectItem value="on_payoff">On Payoff</SelectItem>
                      <SelectItem value="on_reschedule">
                        On Reschedule
                      </SelectItem>
                      <SelectItem value="on_loan_top_up">
                        On Loan Top-Up
                      </SelectItem>
                      <SelectItem value="on_loan_reversal">
                        On Loan Reversal
                      </SelectItem>
                      <SelectItem value="on_rollover">On Rollover</SelectItem>
                      <SelectItem value="on_payment">On Payment</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.trigger && (
                <p className="text-red-500 text-sm">{errors.trigger.message}</p>
              )}
            </div>
          </div>

          {/* Ranges */}
          {chargeType === "range" &&
            fields.map((field, index) => (
              <div
                key={field.id}
                className="grid grid-cols-4 gap-2 items-center"
              >
                <Input
                  placeholder="Min"
                  type="number"
                  step="0.01"
                  {...register(`ranges.${index}.min`)}
                />
                <Input
                  placeholder="Max"
                  type="number"
                  step="0.01"
                  {...register(`ranges.${index}.max`)}
                />
                <Input
                  placeholder="Charge"
                  type="number"
                  step="0.01"
                  {...register(`ranges.${index}.charge`)}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => remove(index)}
                  variant="destructive"
                >
                  Remove
                </Button>
              </div>
            ))}

          {chargeType === "range" && (
            <Button
              type="button"
              size="sm"
              onClick={() => append({ min: "", max: "", charge: "" })}
            >
              Add Range
            </Button>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

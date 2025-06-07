/* eslint-disable react/prop-types */
import { useForm, useFieldArray } from "react-hook-form";
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
import { useParams } from "react-router-dom";

const AddAccountProductFeeDialog = ({
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
  const params = useParams();

  const {
    register,
    handleSubmit,
    setValue,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  // Field array for managing range inputs
  const { fields, append, remove } = useFieldArray({
    control,
    name: "ranges",
  });

  const [selectedAccounts, setSelectedAccounts] = useState({
    account_id: null,
    receivable_account: null,
  });

  // Watch selected calculation method
  const calculatedAs = watch("calculated_as");

  const onSubmit = async (data) => {
          const controller = new AbortController();

    const payload = {
      title: data.title,
      type: data.type,
      calculated_as: data.calculated_as,
      value: data.value,
      product_id: params.id,
      account_id: selectedAccounts.account_id,
      receivable_account: selectedAccounts.receivable_account,
      trigger: data.trigger,
      ...(data.calculated_as === "range" ? { amount_ranges: data.ranges } : {}),
    };
    // console.log(payload);
    try {
      const response = await axiosPrivate.post(
        "/settings/saving-accounts/autocharges",
        payload,
        { signal: controller.signal }
      );
      toast({
        title: "Success",
        description:
          response?.data?.messages || "Auto Charge added successfully",
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
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Account Auto Charge</DialogTitle>
          <DialogDescription>
            Fill in the form below to add a new Account Auto Charge.
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
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Auto Charge Title"
                {...register("title", { required: "Title is required" })}
              />
              {errors.title && (
                <p className="text-red-500 text-sm">{errors.title.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="type">Charge Type</Label>
              <Select onValueChange={(val) => setValue("type", val)}>
                <SelectTrigger
                  {...register("type", { required: "Type is required" })}
                >
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mandatory">Mandatory</SelectItem>
                  <SelectItem value="adjustable">Adjustable</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-red-500 text-sm">{errors.type.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="calculated_as">Calculated As</Label>
              <Select onValueChange={(val) => setValue("calculated_as", val)}>
                <SelectTrigger
                  {...register("calculated_as", {
                    required: "Calculated as is required",
                  })}
                >
                  <SelectValue placeholder="Select Calculation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="range">Range</SelectItem>
                </SelectContent>
              </Select>
              {errors.calculated_as && (
                <p className="text-red-500 text-sm">
                  {errors.calculated_as.message}
                </p>
              )}
            </div>

            {calculatedAs !== "range" && (
              <div>
                <Label htmlFor="charge">
                  {calculatedAs === "percentage"
                    ? "Percentage (%)"
                    : "Charge Amount"}{" "}
                </Label>
                <Input
                  id="charge"
                  type="number"
                  step="0.01"
                  placeholder={
                    calculatedAs === "percentage"
                      ? "Enter Percentage (%)"
                      : "Enter Charge"
                  }
                  {...register("value", {
                    required: `${
                      calculatedAs === "percentage"
                        ? "Percentage is required"
                        : "Charge is required"
                    }`,
                  })}
                />
                {errors.value && (
                  <p className="text-red-500 text-sm">{errors.value.message}</p>
                )}
              </div>
            )}

            <AccountCombobox
              label="Income Account"
              selectedAccount={selectedAccounts.account_id}
              onAccountSelect={(value) =>
                setSelectedAccounts((prev) => ({
                  ...prev,
                  account_id: parseInt(value),
                }))
              }
              accountsData={accountsData}
              isLoading={isLoadingAccounts}
              isError={isErrorAccounts}
              refetch={refetchAccounts}
              isRefetching={isRefetchingAccounts}
            />

            <AccountCombobox
              label="Receivable Account"
              selectedAccount={selectedAccounts.receivable_account}
              onAccountSelect={(value) =>
                setSelectedAccounts((prev) => ({
                  ...prev,
                  receivable_account: parseInt(value),
                }))
              }
              accountsData={accountsData}
              isLoading={isLoadingAccounts}
              isError={isErrorAccounts}
              refetch={refetchAccounts}
              isRefetching={isRefetchingAccounts}
            />
            <div>
              <Label htmlFor="trigger">Trigger</Label>
              <Select onValueChange={(val) => setValue("trigger", val)}>
                <SelectTrigger
                  {...register("trigger", {
                    required: "Trigger is required",
                  })}
                >
                  <SelectValue placeholder="Select Trigger" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="on_saving">On Saving</SelectItem>
                  <SelectItem value="on_withdrawal">On Withdrawal</SelectItem>
                  <SelectItem value="on_membership">On Membership</SelectItem>
                  <SelectItem value="on_account_opening">
                    On Account Opening
                  </SelectItem>
                  <SelectItem value="on_account_transfer_out">
                    On Account Transfer Out
                  </SelectItem>
                  <SelectItem value="on_account_transfer_in">
                    On Account Transfer In
                  </SelectItem>
                </SelectContent>
              </Select>
              {errors.trigger && (
                <p className="text-red-500 text-sm">{errors.trigger.message}</p>
              )}
            </div>
          </div>

          {calculatedAs === "range" &&
            fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-3 gap-2">
                <Input placeholder="Min" {...register(`ranges.${index}.min`)} />
                <Input placeholder="Max" {...register(`ranges.${index}.max`)} />
                <Input
                  placeholder="Charge"
                  {...register(`ranges.${index}.charge`)}
                />
                <Button
                  size="sm"
                  onClick={() => remove(index)}
                  variant="destructive"
                >
                  Remove
                </Button>
              </div>
            ))}
          {calculatedAs === "range" && (
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
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddAccountProductFeeDialog;

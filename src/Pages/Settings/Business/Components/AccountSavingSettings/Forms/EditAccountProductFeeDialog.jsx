/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
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
import { toast } from "@/hooks/use-toast";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { AccountCombobox } from "@/Pages/Components/AccountCombobox";

const EditAccountProductFeeDialog = ({
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
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      title: "",
      type: "",
      calculated_as: "",
      trigger: "",
      charge: "",
      ranges: [],
    },
  });

  // Field array for managing range inputs
  const { fields, append, remove } = useFieldArray({
    control,
    name: "ranges",
  });

  const [selectedAccounts, setSelectedAccounts] = useState({
    account_id: null,
    receivable_account: null,
  });

  useEffect(() => {
    if (defaultValues) {
      reset({
        title: defaultValues?.title || "",
        type: defaultValues?.type || "",
        calculated_as: defaultValues?.calculated_as || "",
        trigger: defaultValues?.trigger || "",
        charge: defaultValues?.charge || "",
        value: defaultValues?.value || "",
        ranges:
          defaultValues?.calculated_as === "range"
            ? defaultValues?.value || []
            : [],
      });

      setSelectedAccounts({
        account_id: defaultValues.account?.account_id || null,
        receivable_account:
          defaultValues.receivable_account?.account_id || null,
      });
    }
  }, [defaultValues, setValue, reset]);

  // Watch selected calculation method
  const calculatedAs = watch("calculated_as");

  const onSubmit = async (data) => {
          const controller = new AbortController();

    const payload = {
      title: data.title,
      type: data.type,
      calculated_as: data.calculated_as,
      account_id: selectedAccounts.account_id,
      receivable_account: selectedAccounts.receivable_account,
      trigger: data.trigger,
      ...(data.calculated_as === "range"
        ? { ranges: data.ranges }
        : { value: data.value }),
    };

    try {
      const response = await axiosPrivate.patch(
        `/settings/saving-accounts/autocharges/${defaultValues?.id}`,
        payload,
        { signal: controller.signal }
      );
      toast({
        title: "Success",
        description:
          response?.data?.messages || "Account fee updated successfully",
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto ">
        <DialogHeader>
          <DialogTitle>Edit Account Fee</DialogTitle>
          <DialogDescription>
            Modify the fields below to update your Account Fee.
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
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Account Fee Title"
                {...register("title", { required: "Title is required" })}
              />
              {errors.title && (
                <p className="text-red-500 text-sm">{errors.title.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="type">Charge Type</Label>
              <Select
                defaultValue={defaultValues.type}
                onValueChange={(val) => setValue("type", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mandatory">Mandatory</SelectItem>
                  <SelectItem value="adjustable">Adjustable</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="calculated_as">Calculated As</Label>
              <Select
                defaultValue={defaultValues.calculated_as}
                onValueChange={(val) => setValue("calculated_as", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Calculation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="range">Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {calculatedAs !== "range" && (
              <div>
                <Label htmlFor="charge">
                  {" "}
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
                {errors.charge && (
                  <p className="text-red-500 text-sm">
                    {errors.charge.message}
                  </p>
                )}
              </div>
            )}

            <AccountCombobox
              label="Income Account"
              selectedAccount={selectedAccounts.account_id}
              onAccountSelect={(value) =>
                setSelectedAccounts((prev) => ({
                  ...prev,
                  account_id: parseInt(value, 10),
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
                  receivable_account: parseInt(value, 10),
                }))
              }
              accountsData={accountsData}
              isLoading={isLoadingAccounts}
              isError={isErrorAccounts}
              refetch={refetchAccounts}
              isRefetching={isRefetchingAccounts}
            />
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
                  type="button"
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
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditAccountProductFeeDialog;

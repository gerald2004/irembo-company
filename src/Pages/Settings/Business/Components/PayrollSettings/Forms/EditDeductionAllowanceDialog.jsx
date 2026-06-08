/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
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
import { useForm } from "react-hook-form";
import { CheckCircle, X } from "lucide-react";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { toast } from "@/hooks/use-toast";
import { AccountCombobox } from "@/Pages/Components/AccountCombobox";

const EditDeductionAllowanceDialog = ({
  isOpen,
  onClose,
  refetch,
  defaultValues,
  accountsData,
  isLoadingAccounts,
  isErrorAccounts,
  refetchAccounts,
}) => {
  const axiosPrivate = useAxiosPrivate();
  const [selectedAccountId, setSelectedAccountId] = useState(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  useEffect(() => {
    if (defaultValues) {
      setValue("name", defaultValues.name);
      setValue("type", defaultValues.type);
      setValue("value_type", defaultValues.value_type);
      setValue("value", defaultValues.value);
      setSelectedAccountId(defaultValues.account_id ?? null);
    }
  }, [defaultValues, setValue]);

  const valueType = watch("value_type", defaultValues?.value_type || "Fixed Amount");

  const onSubmit = async (data) => {
    const controller = new AbortController();
    try {
      const response = await axiosPrivate.patch(
        `/settings/payroll-config/${defaultValues.id}`,
        { ...data, account_id: selectedAccountId ?? null },
        { signal: controller.signal }
      );
      toast({ title: "Success", description: response?.data?.messages });
      refetch();
      onClose();
      reset();
    } catch (error) {
      toast({
        title: "Uh oh! Something went wrong.",
        variant: "destructive",
        description: error?.response?.data?.messages || "No server response",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Deduction / Allowance</DialogTitle>
          <DialogDescription>Update the details below.</DialogDescription>
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
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register("name", { required: "Name is required" })} />
            {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Type</Label>
              <Select defaultValue={defaultValues?.type} onValueChange={(v) => setValue("type", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Deduction">Deduction</SelectItem>
                  <SelectItem value="Allowance">Allowance</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && <p className="text-red-500 text-sm">{errors.type.message}</p>}
            </div>

            <div>
              <Label>Value Type</Label>
              <Select defaultValue={defaultValues?.value_type} onValueChange={(v) => setValue("value_type", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Value Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fixed Amount">Fixed Amount</SelectItem>
                  <SelectItem value="Percentage">Percentage</SelectItem>
                </SelectContent>
              </Select>
              {errors.value_type && <p className="text-red-500 text-sm">{errors.value_type.message}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="value">
              {valueType === "Percentage" ? "Percentage (%)" : "Amount"}
            </Label>
            <Input
              id="value"
              type="number"
              step="0.01"
              min="0"
              {...register("value", { required: "Value is required" })}
            />
            {errors.value && <p className="text-red-500 text-sm">{errors.value.message}</p>}
          </div>

          <AccountCombobox
            label="GL Account (optional)"
            selectedAccount={selectedAccountId}
            onAccountSelect={(v) => setSelectedAccountId(v ? parseInt(v, 10) : null)}
            accountsData={accountsData}
            isLoading={isLoadingAccounts}
            isError={isErrorAccounts}
            refetch={refetchAccounts}
          />

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : <><CheckCircle className="mr-2 h-4 w-4" /> Save Changes</>}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditDeductionAllowanceDialog;

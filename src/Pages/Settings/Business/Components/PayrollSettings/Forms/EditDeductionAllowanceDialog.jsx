/* eslint-disable react/prop-types */
import { useEffect } from "react";
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

const EditDeductionAllowanceDialog = ({
  isOpen,
  onClose,
  refetch,
  defaultValues,
}) => {
  const axiosPrivate = useAxiosPrivate();
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
      for (const [key, value] of Object.entries(defaultValues)) {
        setValue(key, value);
      }
    }
  }, [defaultValues, setValue]);

  const valueType = watch(
    "value_type",
    defaultValues?.value_type || "Fixed Amount"
  );

  const onSubmit = async (data) => {
          const controller = new AbortController();

    try {
      const response = await axiosPrivate.patch(
        `/settings/payroll-config/${defaultValues.id}`,
        data,
        { signal: controller.signal }
      );
      toast({ title: "Success", description: response?.data?.messages });
      refetch();
      onClose();
      reset();
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Deduction/Allowance</DialogTitle>
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
            <Input
              id="name"
              {...register("name", { required: "Name is required" })}
            />
            {errors.name && (
              <p className="text-red-500 text-sm">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label>Type</Label>
            <Select
              defaultValue={defaultValues?.type}
              onValueChange={(value) => setValue("type", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Deduction">Deduction</SelectItem>
                <SelectItem value="Allowance">Allowance</SelectItem>
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-red-500 text-sm">{errors.type.message}</p>
            )}
          </div>

          <div>
            <Label>Value Type</Label>
            <Select
              defaultValue={defaultValues?.value_type}
              onValueChange={(value) => setValue("value_type", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Value Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Fixed Amount">Fixed Amount</SelectItem>
                <SelectItem value="Percentage">Percentage</SelectItem>
              </SelectContent>
            </Select>
            {errors.value_type && (
              <p className="text-red-500 text-sm">
                {errors.value_type.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="value">
              {valueType === "Percentage"
                ? "Enter Percentage (%)"
                : "Enter Amount"}
            </Label>
            <Input
              id="value"
              type="number"
              step="0.01"
              {...register("value", { required: "Value is required" })}
            />
            {errors.value && (
              <p className="text-red-500 text-sm">
                {errors.value.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="submit">
              {isSubmitting ? (
                "Saving..."
              ) : (
                <>
                  Save Changes <CheckCircle className="ml-2" />
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditDeductionAllowanceDialog;

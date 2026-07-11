/* eslint-disable react/prop-types */
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
import { useForm, Controller } from "react-hook-form";
import { CheckCircle, X } from "lucide-react";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { toast } from "@/hooks/use-toast";

const AddSalaryAdvanceProductDialog = ({ isOpen, onClose, refetch }) => {
  const axiosPrivate = useAxiosPrivate();
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      title: "",
      code: "",
      max_advance_percentage: "",
      fee_type: "percent",
      fee_value: "",
      allow_multiple_active: "no",
    },
  });

  const handleClose = () => {
    reset();
    onClose?.();
  };

  const onSubmit = async (data) => {
    const controller = new AbortController();
    try {
      const payload = {
        ...data,
        max_advance_percentage: Number(data.max_advance_percentage),
        fee_value: Number(data.fee_value),
      };
      const response = await axiosPrivate.post(
        `/settings/salary-advance/products`,
        payload,
        { signal: controller.signal }
      );
      toast({ title: "Success", description: response?.data?.messages });
      reset();
      refetch?.();
      onClose?.();
    } catch (error) {
      const errorMessage =
        error?.response?.data?.messages || "No server response";
      toast({
        title: "Uh oh! Something went wrong.",
        variant: "destructive",
        description: Array.isArray(errorMessage)
          ? errorMessage.join(", ")
          : errorMessage,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Add Salary Advance Product</DialogTitle>
          <DialogDescription>
            Configure a new salary advance product for staff to apply against.
          </DialogDescription>
          <DialogClose asChild>
            <button
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </button>
          </DialogClose>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                {...register("title", { required: "Title is required" })}
              />
              {errors.title && (
                <p className="text-red-500 text-sm">{errors.title.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                {...register("code", { required: "Code is required" })}
              />
              {errors.code && (
                <p className="text-red-500 text-sm">{errors.code.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="max_advance_percentage">
                Max Advance (% of salary)
              </Label>
              <Input
                id="max_advance_percentage"
                type="number"
                step="0.01"
                min="0"
                max="100"
                {...register("max_advance_percentage", {
                  required: "Max advance percentage is required",
                  min: { value: 0.01, message: "Must be greater than 0" },
                  max: { value: 100, message: "Cannot exceed 100" },
                })}
              />
              {errors.max_advance_percentage && (
                <p className="text-red-500 text-sm">
                  {errors.max_advance_percentage.message}
                </p>
              )}
            </div>

            <div>
              <Label>Fee Type</Label>
              <Controller
                name="fee_type"
                control={control}
                rules={{ required: "Fee type is required" }}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Fee Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed</SelectItem>
                      <SelectItem value="percent">Percent</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.fee_type && (
                <p className="text-red-500 text-sm">
                  {errors.fee_type.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="fee_value">Fee Value</Label>
              <Input
                id="fee_value"
                type="number"
                step="0.01"
                min="0"
                {...register("fee_value", {
                  required: "Fee value is required",
                  min: { value: 0, message: "Cannot be negative" },
                })}
              />
              {errors.fee_value && (
                <p className="text-red-500 text-sm">
                  {errors.fee_value.message}
                </p>
              )}
            </div>

            <div>
              <Label>Allow Multiple Active Advances</Label>
              <Controller
                name="allow_multiple_active"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">No</SelectItem>
                      <SelectItem value="yes">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </fieldset>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                "Saving Please wait ..."
              ) : (
                <>
                  Submit <CheckCircle className="ml-2" />
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddSalaryAdvanceProductDialog;

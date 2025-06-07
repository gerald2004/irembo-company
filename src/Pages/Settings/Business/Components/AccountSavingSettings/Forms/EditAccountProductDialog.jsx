/* eslint-disable react/prop-types */
import { useEffect } from "react";
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
import { X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";

const EditAccountProductDialog = ({ isOpen, onClose, refetch, defaultValues }) => {
  const axiosPrivate = useAxiosPrivate();
  const {
    register,
    handleSubmit,
    setValue,
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

  const onSubmit = async (data) => {
          const controller = new AbortController();

    try {
      const response = await axiosPrivate.patch(
        `/settings/savings/accounts/${defaultValues?.id}`,
        data,
        { signal: controller.signal }
      );
      toast({
        title: "Success",
        description:
          response?.data?.messages || "Account Product updated successfully",
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Account Product</DialogTitle>
          <DialogDescription>
            Modify the fields below to update your Account Product.
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
                placeholder="Loan Product Title"
                {...register("title", { required: "Title is required" })}
              />
              {errors.title && (
                <p className="text-red-500 text-sm">{errors.title.message}</p>
              )}
            </div>

            {/* Code */}
            <div>
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                placeholder="Enter Product Code"
                {...register("code", { required: "Code is required" })}
              />
              {errors.code && (
                <p className="text-red-500 text-sm">{errors.code.message}</p>
              )}
            </div>

            {/* Minimal Balance */}
            <div>
              <Label htmlFor="minimal_balance">Minimal Balance</Label>
              <Input
                id="minimal_balance"
                type="number"
                step="0.01"
                placeholder="Minimal Balance"
                {...register("minimal_balance", {
                  required: "Minimal balance is required",
                })}
              />
              {errors.minimal_balance && (
                <p className="text-red-500 text-sm">
                  {errors.minimal_balance.message}
                </p>
              )}
            </div>

            {/* Minimal Deposit */}
            <div>
              <Label htmlFor="minimal_deposit">Minimal Deposit</Label>
              <Input
                id="minimal_deposit"
                type="number"
                step="0.01"
                placeholder="Minimal Deposit"
                {...register("minimal_deposit", {
                  required: "Minimal deposit is required",
                })}
              />
              {errors.minimal_deposit && (
                <p className="text-red-500 text-sm">
                  {errors.minimal_deposit.message}
                </p>
              )}
            </div>

            {/* Maximum Deposit */}
            <div>
              <Label htmlFor="maximum_deposit">Maximum Deposit</Label>
              <Input
                id="maximum_deposit"
                type="number"
                step="0.01"
                placeholder="Maximum Deposit"
                {...register("maximum_deposit", {
                  required: "Maximum deposit is required",
                })}
              />
              {errors.maximum_deposit && (
                <p className="text-red-500 text-sm">
                  {errors.maximum_deposit.message}
                </p>
              )}
            </div>

            {/* Minimal Withdraw */}
            <div>
              <Label htmlFor="minimal_withdraw">Minimal Withdraw</Label>
              <Input
                id="minimal_withdraw"
                type="number"
                step="0.01"
                placeholder="Minimal Withdraw"
                {...register("minimal_withdraw", {
                  required: "Minimal withdraw is required",
                })}
              />
              {errors.minimal_withdraw && (
                <p className="text-red-500 text-sm">
                  {errors.minimal_withdraw.message}
                </p>
              )}
            </div>

            {/* Maximum Withdraw */}
            <div>
              <Label htmlFor="maximum_withdraw">Maximum Withdraw</Label>
              <Input
                id="maximum_withdraw"
                type="number"
                step="0.01"
                placeholder="Maximum Withdraw"
                {...register("maximum_withdraw", {
                  required: "Maximum withdraw is required",
                })}
              />
              {errors.maximum_withdraw && (
                <p className="text-red-500 text-sm">
                  {errors.maximum_withdraw.message}
                </p>
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

export default EditAccountProductDialog;

/* eslint-disable react/prop-types */
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
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
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { toast } from "@/hooks/use-toast";
const AddAccountProductDialog = ({ isOpen, onClose }) => {
  const axiosPrivate = useAxiosPrivate();
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (data) => {
    const controller = new AbortController();

    try {
      const response = await axiosPrivate.post(
        "/settings/savings/accounts",
        data,
        { signal: controller.signal }
      );
      toast({
        title: "Success",
        description:
          response?.data?.messages || "Account product added successfully",
      });
      reset();
      onClose();
      queryClient.invalidateQueries({ queryKey: ["accounts-settings-data"] });
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
          <DialogTitle>Add Account Product</DialogTitle>
          <DialogDescription>
            Fill in the form below to add a new Accoutn Product.
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
                placeholder="Account Title"
                {...register("title", { required: "Title is required" })}
              />
              {errors.title && (
                <p className="text-red-500 text-sm">{errors.title.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="code">Account Code</Label>
              <Input
                id="code"
                placeholder="Enter Account Code"
                {...register("code", { required: "Code is required" })}
              />
              {errors.code && (
                <p className="text-red-500 text-sm">{errors.code.message}</p>
              )}
            </div>

            <div className="col-span-full">
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

            <div>
              <Label htmlFor="minimal_deposit">Minimal Deposit</Label>
              <Input
                id="minimal_deposit"
                type="number"
                step="0.01"
                placeholder="Minimal Deposit"
                {...register("minimal_deposit")}
              />
            </div>

            <div>
              <Label htmlFor="maximum_deposit">Maximum Deposit</Label>
              <Input
                id="maximum_deposit"
                type="number"
                step="0.01"
                placeholder="Maximum Deposit"
                {...register("maximum_deposit")}
              />
            </div>

            <div>
              <Label htmlFor="minimal_withdraw">Minimal Withdraw</Label>
              <Input
                id="minimal_withdraw"
                type="number"
                step="0.01"
                placeholder="Minimal Withdraw"
                {...register("minimal_withdraw")}
              />
            </div>

            <div>
              <Label htmlFor="maximum_withdraw">Maximum Withdraw</Label>
              <Input
                id="maximum_withdraw"
                type="number"
                step="0.01"
                placeholder="Maximum Withdraw"
                {...register("maximum_withdraw")}
              />
            </div>
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

export default AddAccountProductDialog;

/* eslint-disable react/prop-types */
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";

const AddTransactionTillDialog = ({
  isOpen,
  onClose,
  refetch,
  accountsData,
  isLoadingAccounts,
  isErrorAccounts,
  refetchAccounts,
  isRefetchingAccounts,
  staffList,
}) => {
  const axiosPrivate = useAxiosPrivate();
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm();

  const [selectedAccount, setSelectedAccount] = useState(null);

  // ✅ Handle Form Submission
  const onSubmit = async (data) => {
          const controller = new AbortController();

    const payload = {
      staff_id: data.staff_id,
      linked_account: selectedAccount,
      description: data.description,
    };
    try {
      const response = await axiosPrivate.post(
        "/settings/transaction-channels",
        payload,
        { signal: controller.signal }
      );
      toast({
        title: "Success",
        description:
          response?.data?.messages || "Transaction Till added successfully",
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
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Add Transaction Till</DialogTitle>
          <DialogDescription>
            Fill in the form below to create a new transaction till.
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
          {/* Staff Selection */}
          <div>
            <Label>Select Staff</Label>
            <Controller
              name="staff_id"
              control={control}
              rules={{ required: "Staff is required" }}
              render={({ field }) => (
                <Select
                  value={field.value || ""} // Ensure empty value shows placeholder
                  onValueChange={(value) => {
                    field.onChange(value); // Update react-hook-form state
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Staff"></SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {staffList.length > 0 ? (
                      staffList.map((staff) => (
                        <SelectItem
                          key={staff.user_id}
                          value={String(staff.user_id)}
                        >
                          {staff.user_firstname} {staff.user_lastname} (
                          {staff.user_identification_code})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="">No Staff Available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.staff_id && (
              <p className="text-red-500 text-sm">{errors.staff_id.message}</p>
            )}
          </div>

          {/* Account Selection */}
          <AccountCombobox
            label="Linked Account"
            selectedAccount={selectedAccount}
            onAccountSelect={(value) => setSelectedAccount(parseInt(value))}
            accountsData={accountsData}
            isLoading={isLoadingAccounts}
            isError={isErrorAccounts}
            refetch={refetchAccounts}
            isRefetching={isRefetchingAccounts}
          />

          {/* Description */}
          <div className="col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter description"
              {...register("description", {
                required: "Description is required",
              })}
            />
            {errors.description && (
              <p className="text-red-500 text-sm">
                {errors.description.message}
              </p>
            )}
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

export default AddTransactionTillDialog;

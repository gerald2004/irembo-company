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

export default function AddTransactionTillDialog({
  isOpen,
  onClose,
  refetch,
  accountsData,
  isLoadingAccounts,
  isErrorAccounts,
  refetchAccounts,
  isRefetchingAccounts,
  staffList,
}) {
  const axiosPrivate = useAxiosPrivate();
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting, isSubmitted },
  } = useForm();

  const [selectedAccount, setSelectedAccount] = useState(null);

  const onSubmit = async (data) => {
    const controller = new AbortController();
    const payload = {
      staff_id: data.staff_id,
      linked_account: selectedAccount, // expects linked_accounts.linked_account_id
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
      setSelectedAccount(null);
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

  const accountError = isSubmitted && !selectedAccount;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Add Transaction Till</DialogTitle>
          <DialogDescription>
            Fill in the form below to create a new transaction till.
          </DialogDescription>
          <DialogClose asChild>
            <button
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </button>
          </DialogClose>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Staff Selection */}
          <div>
            <Label>Staff</Label>
            <Controller
              name="staff_id"
              control={control}
              rules={{ required: "Staff is required" }}
              render={({ field }) => (
                <Select
                  value={field.value || ""}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Staff" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffList.length > 0 ? (
                      staffList.map((s) => (
                        <SelectItem key={s.user_id} value={String(s.user_id)}>
                          {s.user_firstname} {s.user_lastname} (
                          {s.user_identification_code})
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1 text-sm text-muted-foreground">
                        No Staff Available
                      </div>
                    )}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.staff_id && (
              <p className="text-red-500 text-xs">{errors.staff_id.message}</p>
            )}
          </div>

          {/* Linked Account (from COA via LinkedAccount) */}
          <AccountCombobox
            label="Linked Account (control)"
            selectedAccount={selectedAccount}
            onAccountSelect={(value) => setSelectedAccount(parseInt(value))}
            accountsData={accountsData}
            isLoading={isLoadingAccounts}
            isError={isErrorAccounts}
            refetch={refetchAccounts}
            isRefetching={isRefetchingAccounts}
          />
          {accountError && (
            <p className="text-red-500 text-xs">Linked account is required</p>
          )}

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter description"
              {...register("description", {
                required: "Description is required",
              })}
            />
            {errors.description && (
              <p className="text-red-500 text-xs">
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
}

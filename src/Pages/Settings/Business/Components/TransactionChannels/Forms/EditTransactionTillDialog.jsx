/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
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
import { toast } from "@/hooks/use-toast";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { AccountCombobox } from "@/Pages/Components/AccountCombobox";
import { Textarea } from "@/components/ui/textarea";

export default function EditTransactionTillDialog({
  isOpen,
  onClose,
  refetch,
  defaultValues,
  accountsData,
  isLoadingAccounts,
  isErrorAccounts,
  refetchAccounts,
  isRefetchingAccounts,
  staffList,
}) {
  const axiosPrivate = useAxiosPrivate();
  const {
    control,
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting, isSubmitted },
  } = useForm();

  const [selectedAccount, setSelectedAccount] = useState(null);

  useEffect(() => {
    if (defaultValues) {
      for (const [k, v] of Object.entries(defaultValues)) setValue(k, v);
      // set default staff_id in select
      if (defaultValues.staff?.user_id)
        setValue("staff_id", String(defaultValues.staff.user_id));
      // set linked account selection
      setSelectedAccount(
        defaultValues?.linked?.linked_account_id ||
          defaultValues?.linked_account ||
          null
      );
    }
  }, [defaultValues, setValue]);

  const onSubmit = async (data) => {
    const controller = new AbortController();
    const payload = {
      staff_id: data.staff_id,
      linked_account: selectedAccount,
      description: data.description,
    };
    try {
      const response = await axiosPrivate.patch(
        `/settings/transaction-channels/${defaultValues?.till_id}`,
        payload,
        { signal: controller.signal }
      );
      toast({
        title: "Success",
        description:
          response?.data?.messages || "Transaction Till updated successfully",
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
          <DialogTitle>Edit Transaction Till</DialogTitle>
          <DialogDescription>
            Modify the details below to update this Transaction Till.
          </DialogDescription>
          <DialogClose asChild>
            <button
              className="absolute right-4 top-4 rounded-sm opacity-70 
                ring-offset-background transition-opacity hover:opacity-100 
                focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </button>
          </DialogClose>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Staff */}
          <div>
            <Label>Staff</Label>
            <Controller
              name="staff_id"
              control={control}
              rules={{ required: "Staff selection is required" }}
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

          {/* Linked Account */}
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
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

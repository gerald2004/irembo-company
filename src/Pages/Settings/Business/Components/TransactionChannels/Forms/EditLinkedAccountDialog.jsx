/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { toast } from "@/hooks/use-toast";
import { AccountCombobox } from "@/Pages/Components/AccountCombobox";

const EditLinkedAccountDialog = ({
  isOpen,
  onClose,
  refetch,
  defaultValues, // expects mapLinkedAccountRow() (+ optional branches)
  accountsData,
  isLoadingAccounts,
  isErrorAccounts,
  refetchAccounts,
  isRefetchingAccounts,
  branchList,
}) => {
  const axiosPrivate = useAxiosPrivate();
  const {
    control,
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const [selectedAccount, setSelectedAccount] = useState(null);
  const isGlobal = watch("is_global");

  useEffect(() => {
    if (defaultValues) {
      setValue("type", defaultValues.type || "");
      setValue("provider_name", defaultValues.provider_name || "");
      setValue("provider_reference", defaultValues.provider_reference || "");
      setValue("is_global", !!defaultValues.is_global);
      setValue(
        "branches",
        (defaultValues.branches || []).map((b) => String(b.branch_id))
      );
      setSelectedAccount(defaultValues.account_id || null);
      setValue("description", defaultValues.description || "");
    }
  }, [defaultValues, setValue]);

  const onSubmit = async (data) => {
    const controller = new AbortController();
    const payload = {
      account_id: selectedAccount,
      type: data.type,
      provider_name: data.provider_name || null,
      provider_reference: data.provider_reference || null,
      is_global: data.is_global ? 1 : 0,
      branches: data.is_global
        ? []
        : (data.branches || []).map((v) => parseInt(v, 10)),
    };

    try {
      const res = await axiosPrivate.patch(
        `/settings/accounts/linked/${defaultValues.linked_account_id}`,
        payload,
        {
          signal: controller.signal,
        }
      );
      toast({
        title: "Success",
        description:
          res?.data?.messages || "Linked account updated successfully",
      });
      reset();
      refetch?.();
      onClose();
    } catch (error) {
      const msg = error?.response?.data?.messages || "No server response";
      toast({
        title: "Uh oh! Something went wrong.",
        variant: "destructive",
        description: msg,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Edit Linked Account</DialogTitle>
          <DialogDescription>
            Update mapping, visibility, or provider details.
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
          {/* Account */}
          <AccountCombobox
            label="Chart of Account"
            selectedAccount={selectedAccount}
            onAccountSelect={(value) => setSelectedAccount(parseInt(value))}
            accountsData={accountsData}
            isLoading={isLoadingAccounts}
            isError={isErrorAccounts}
            refetch={refetchAccounts}
            isRefetching={isRefetchingAccounts}
          />
          {!selectedAccount && (
            <p className="text-red-500 text-sm">Account is required</p>
          )}

          {/* Type */}
          <div>
            <Label>Type</Label>
            <Controller
              name="type"
              control={control}
              rules={{ required: "Type is required" }}
              render={({ field }) => (
                <Select
                  value={field.value || ""}
                  onValueChange={field.onChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem key="type-cash" value="cash">
                      Cash
                    </SelectItem>
                    <SelectItem key="type-bank" value="bank">
                      Bank
                    </SelectItem>
                    <SelectItem key="type-mm" value="mobile_money">
                      Mobile Money
                    </SelectItem>
                    <SelectItem key="type-safe" value="safe">
                      Cash Safe
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.type && (
              <p className="text-red-500 text-sm">{errors.type.message}</p>
            )}
          </div>

          {/* Provider */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Provider Name</Label>
              <Input
                placeholder="Stanbic / Airtel / MTN / Safe name"
                {...register("provider_name")}
              />
            </div>
            <div>
              <Label>Provider Reference</Label>
              <Input
                placeholder="Account No / Wallet ID / Safe Code"
                {...register("provider_reference")}
              />
            </div>
          </div>

          {/* Visibility */}
          <div className="flex items-center gap-2">
            <Controller
              name="is_global"
              control={control}
              render={({ field }) => (
                <Checkbox
                  checked={!!field.value}
                  onCheckedChange={(v) => field.onChange(!!v)}
                />
              )}
            />
            <Label>Global (visible to all branches)</Label>
          </div>

          {/* Branch mapping */}
          {!isGlobal && (
            <div>
              <Label>Allowed Branches</Label>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 max-h-56 overflow-auto border rounded p-2">
                <Controller
                  name="branches"
                  control={control}
                  render={({ field }) => (
                    <>
                      {branchList.length ? (
                        branchList.map((b) => (
                          <div
                            key={`edit-branch-${b.branch_id}`}
                            className="flex items-center gap-2"
                          >
                            <Checkbox
                              checked={(field.value || []).includes(
                                String(b.id)
                              )}
                              onCheckedChange={() => {
                                const set = new Set(field.value || []);
                                const k = String(b.id);
                                set.has(k) ? set.delete(k) : set.add(k);
                                field.onChange(Array.from(set));
                              }}
                            />
                            <span>{b.name}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          No branches found.
                        </div>
                      )}
                    </>
                  )}
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <Label>Notes</Label>
            <Textarea
              placeholder="Optional description / notes"
              {...register("description")}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting || !selectedAccount}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditLinkedAccountDialog;

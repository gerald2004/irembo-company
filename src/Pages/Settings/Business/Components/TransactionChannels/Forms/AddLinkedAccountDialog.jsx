/* eslint-disable react/prop-types */
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

const AddLinkedAccountDialog = ({
  isOpen,
  onClose,
  refetch,
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
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      account_id: null, // controlled via Controller + AccountCombobox
      type: "",
      provider_name: "",
      provider_reference: "",
      is_global: false,
      branches: [], // array of id strings
      description: "",
    },
    mode: "onSubmit", // show errors on submit (not immediately)
    reValidateMode: "onChange",
  });

  const isGlobal = watch("is_global");

  const onSubmit = async (data) => {
    const controller = new AbortController();
    const payload = {
      account_id: data.account_id, // ✅ now comes from RHF
      type: data.type,
      provider_name: data.provider_name || null,
      provider_reference: data.provider_reference || null,
      is_global: data.is_global ? 1 : 0,
      branches: data.is_global
        ? []
        : (data.branches || []).map((v) => parseInt(v, 10)),
    };

    try {
      const res = await axiosPrivate.post(
        `/settings/accounts/linked`,
        payload,
        {
          signal: controller.signal,
        }
      );
      toast({
        title: "Success",
        description:
          res?.data?.messages || "Linked account created successfully",
      });
      reset(); // clear form
      refetch?.(); // refresh table
      onClose(); // close dialog
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
          <DialogTitle>Add Linked Account</DialogTitle>
          <DialogDescription>
            Map a chart-of-account to a transaction channel.
          </DialogDescription>
          <DialogClose asChild>
            <button
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </DialogClose>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Account (controlled via RHF) */}
          <div>
            <Controller
              name="account_id"
              control={control}
              rules={{ required: "Account is required" }}
              render={({ field }) => (
                <>
                  <AccountCombobox
                    label="Chart of Account"
                    selectedAccount={field.value} // number | null
                    onAccountSelect={(value) =>
                      field.onChange(parseInt(value, 10))
                    }
                    accountsData={accountsData}
                    isLoading={isLoadingAccounts}
                    isError={isErrorAccounts}
                    refetch={refetchAccounts}
                    isRefetching={isRefetchingAccounts}
                  />
                  {errors.account_id && (
                    <p className="text-red-500 p-0 text-xs mt-1">
                      {errors.account_id.message}
                    </p>
                  )}
                </>
              )}
            />
          </div>

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
              <p className="text-red-500 text-xs mt-1">{errors.type.message}</p>
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
            <Checkbox
              id="is_global"
              checked={!!watch("is_global")}
              onCheckedChange={(v) =>
                setValue("is_global", !!v, { shouldValidate: true })
              }
            />
            <Label htmlFor="is_global">Global (visible to all branches)</Label>
          </div>

          {/* Branch mapping (only when NOT global) */}
          {!isGlobal && (
            <div>
              <Label>Allowed Branches</Label>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 max-h-56 overflow-auto border rounded p-2">
                <Controller
                  name="branches"
                  control={control}
                  render={({ field }) => (
                    <>
                      {Array.isArray(branchList) && branchList.length ? (
                        branchList.map((b) => {
                          const idStr = String(b.id); // ← adjust if your API returns `id`
                          const checked = (field.value || []).includes(idStr);
                          return (
                            <div
                              key={`add-branch-${b.id}`}
                              className="flex items-center gap-2"
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={() => {
                                  const set = new Set(field.value || []);
                                  set.has(idStr)
                                    ? set.delete(idStr)
                                    : set.add(idStr);
                                  field.onChange(Array.from(set));
                                }}
                              />
                              <span>{b.name}</span>
                            </div>
                          );
                        })
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddLinkedAccountDialog;

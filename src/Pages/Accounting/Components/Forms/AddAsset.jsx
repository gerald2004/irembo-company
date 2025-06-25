/* eslint-disable react/prop-types */
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { CheckCircle, X, CalendarIcon } from "lucide-react";
import { AccountCombobox } from "@/Pages/Components/AccountCombobox";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
const AddAsset = ({
  isOpen,
  onClose,
  refetch,
  accountsData,
  isLoadingAccounts,
  isErrorAccounts,
  refetchAccounts,
  isRefetchingAccounts,
}) => {
  const axiosPrivate = useAxiosPrivate();

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const [selectedAccounts, setSelectedAccounts] = useState({
    asset_debit_account: null,
    depreciation_expense_account: null,
    depreciation_loss_account: null,
    depreciation_gain_account: null,
    appreciation_account: null,
    appreciation_income_account: null,
    appreciation_loss_account: null,
    appreciation_gain_account: null,
  });

  const onSubmit = async (data) => {
      const controller = new AbortController();

    try {
      data.depreciation_method ??= "appreciation";
      const payload = {
        ...data,
        ...selectedAccounts,
      };

      // console.log(payload);
      const response = await axiosPrivate.post("/accounting/assets", payload, {
        signal: controller.signal,
      });
      toast({
        title: "Success",
        description: response.data.messages,
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

  const selectedType = watch("type");

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Asset</DialogTitle>
          <DialogDescription>
            Follow the steps to add new asset.
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

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="asset_name">Asset Name</Label>
              <Input
                id="asset_name"
                type="text"
                placeholder="Enter asset name"
                {...register("asset_name", {
                  required: "Asset name is required",
                })}
              />
              {errors.asset_name && (
                <p className="text-red-500 text-sm">
                  {errors.asset_name.message}
                </p>
              )}
            </div>

            {/* Identification No */}
            <div>
              <Label htmlFor="identification_no">Identification No</Label>
              <Input
                id="identification_no"
                type="text"
                placeholder="Enter ID No"
                {...register("identification_no", {
                  required: "Identification number is required",
                })}
              />
              {errors.identification_no && (
                <p className="text-red-500 text-sm">
                  {errors.identification_no.message}
                </p>
              )}
            </div>

            {/* Purchase Cost */}
            <div>
              <Label htmlFor="purchase_cost">Purchase Cost</Label>
              <Input
                id="purchase_cost"
                type="number"
                step="0.01"
                placeholder="Enter purchase cost"
                {...register("purchase_cost", {
                  required: "Purchase cost is required",
                })}
              />
              {errors.purchase_cost && (
                <p className="text-red-500 text-sm">
                  {errors.purchase_cost.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="purchase_date">Purchase Date</Label>
              <Controller
                name="purchase_date"
                control={control}
                rules={{ required: "Purchase date is required" }}
                render={({ field }) => {
                  const parsedDate = field.value ? new Date(field.value) : null;
                  return (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full pl-3 text-left font-normal"
                        >
                          {parsedDate
                            ? parsedDate.toLocaleDateString()
                            : "Pick a date"}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={parsedDate}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date("2000-01-01")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  );
                }}
              />
              {errors.purchase_date && (
                <p className="text-red-500 text-sm">
                  {errors.purchase_date.message}
                </p>
              )}
            </div>

            {/* Date Put to Use */}
            <div>
              <Label htmlFor="date_put_to_use">Date Put to Use</Label>
              <Controller
                name="date_put_to_use"
                control={control}
                rules={{ required: "Date put to use is required" }}
                render={({ field }) => {
                  const parsedDate = field.value ? new Date(field.value) : null;
                  return (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full pl-3 text-left font-normal"
                        >
                          {parsedDate
                            ? parsedDate.toLocaleDateString()
                            : "Pick a date"}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={parsedDate}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date("2000-01-01")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  );
                }}
              />
              {errors.date_put_to_use && (
                <p className="text-red-500 text-sm">
                  {errors.date_put_to_use.message}
                </p>
              )}
            </div>
            {/* Asset Debit Account */}
            <AccountCombobox
              label="Asset Debit Account"
              selectedAccount={selectedAccounts.asset_debit_account}
              onAccountSelect={(value) =>
                setSelectedAccounts((prev) => ({
                  ...prev,
                  asset_debit_account: parseInt(value),
                }))
              }
              accountsData={accountsData}
              isLoading={isLoadingAccounts}
              isError={isErrorAccounts}
              refetch={refetchAccounts}
              isRefetching={isRefetchingAccounts}
            />
            <div>
              <Label>Type</Label>
              <Select onValueChange={(value) => setValue("type", value)}>
                <SelectTrigger
                  {...register("type", {
                    required: "Type is required",
                  })}
                >
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="appreciation">Appreciation</SelectItem>
                  <SelectItem value="depreciation">Depreciation</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-red-500 text-sm">{errors.type.message}</p>
              )}
            </div>

            {selectedType === "depreciation" && (
              <>
                {/* Salvage Value */}
                <div>
                  <Label htmlFor="salvage_value">Salvage Value</Label>
                  <Input
                    id="salvage_value"
                    type="number"
                    step="0.01"
                    placeholder="Enter salvage value"
                    {...register("salvage_value", {
                      required: "Salvage value is required",
                    })}
                  />
                  {errors.salvage_value && (
                    <p className="text-red-500 text-sm">
                      {errors.salvage_value.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label>Depreciation Method</Label>
                  <Select
                    onValueChange={(value) =>
                      setValue("depreciation_method", value)
                    }
                  >
                    <SelectTrigger
                      {...register("depreciation_method", {
                        required: "Depreciation Method is required",
                      })}
                    >
                      <SelectValue placeholder="Select depreciation method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="straight_line">
                        Straight Line
                      </SelectItem>
                      <SelectItem value="double_declining">
                        Double Declining
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.depreciation_method && (
                    <p className="text-red-500 text-sm">
                      {errors.depreciation_method.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="depreciation_rate">
                    Depreciation Rate (%)
                  </Label>
                  <Input
                    id="depreciation_rate"
                    type="number"
                    step="0.01"
                    placeholder="e.g. 10"
                    {...register("depreciation_rate", {
                      required: "Depreciation rate is required",
                    })}
                  />
                  {errors.depreciation_rate && (
                    <p className="text-red-500 text-sm">
                      {errors.depreciation_rate.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="expected_useful_life">
                    Expected Useful Life (in years)
                  </Label>
                  <Input
                    id="expected_useful_life"
                    type="number"
                    placeholder="e.g. 5"
                    {...register("expected_useful_life", {
                      required: "Expected useful life is required",
                    })}
                  />
                  {errors.expected_useful_life && (
                    <p className="text-red-500 text-sm">
                      {errors.expected_useful_life.message}
                    </p>
                  )}
                </div>
                <AccountCombobox
                  label="Depreciation Expense Account"
                  selectedAccount={
                    selectedAccounts.depreciation_expense_account
                  }
                  onAccountSelect={(value) =>
                    setSelectedAccounts((prev) => ({
                      ...prev,
                      depreciation_expense_account: parseInt(value),
                    }))
                  }
                  accountsData={accountsData}
                  isLoading={isLoadingAccounts}
                  isError={isErrorAccounts}
                  refetch={refetchAccounts}
                  isRefetching={isRefetchingAccounts}
                />
                <AccountCombobox
                  label="Depreciation Loss Account"
                  selectedAccount={selectedAccounts.depreciation_loss_account}
                  onAccountSelect={(value) =>
                    setSelectedAccounts((prev) => ({
                      ...prev,
                      depreciation_loss_account: parseInt(value),
                    }))
                  }
                  accountsData={accountsData}
                  isLoading={isLoadingAccounts}
                  isError={isErrorAccounts}
                  refetch={refetchAccounts}
                  isRefetching={isRefetchingAccounts}
                />
                <AccountCombobox
                  label="Depreciation Gain Account"
                  selectedAccount={selectedAccounts.depreciation_gain_account}
                  onAccountSelect={(value) =>
                    setSelectedAccounts((prev) => ({
                      ...prev,
                      depreciation_gain_account: parseInt(value),
                    }))
                  }
                  accountsData={accountsData}
                  isLoading={isLoadingAccounts}
                  isError={isErrorAccounts}
                  refetch={refetchAccounts}
                  isRefetching={isRefetchingAccounts}
                />
              </>
            )}
            {selectedType === "appreciation" && (
              <>
                <div>
                  <Label htmlFor="appreciation_rate">
                    Appreciation Rate (%)
                  </Label>
                  <Input
                    id="appreciation_rate"
                    type="number"
                    step="0.01"
                    placeholder="e.g. 5"
                    {...register("appreciation_rate", {
                      required: "Appreciation rate is required",
                    })}
                  />
                  {errors.appreciation_rate && (
                    <p className="text-red-500 text-sm">
                      {errors.appreciation_rate.message}
                    </p>
                  )}
                </div>
                <AccountCombobox
                  label="Appreciation Account"
                  selectedAccount={selectedAccounts.appreciation_account}
                  onAccountSelect={(value) =>
                    setSelectedAccounts((prev) => ({
                      ...prev,
                      appreciation_account: parseInt(value),
                    }))
                  }
                  accountsData={accountsData}
                  isLoading={isLoadingAccounts}
                  isError={isErrorAccounts}
                  refetch={refetchAccounts}
                  isRefetching={isRefetchingAccounts}
                />
                <AccountCombobox
                  label="Appreciation Income Account"
                  selectedAccount={selectedAccounts.appreciation_income_account}
                  onAccountSelect={(value) =>
                    setSelectedAccounts((prev) => ({
                      ...prev,
                      appreciation_income_account: parseInt(value),
                    }))
                  }
                  accountsData={accountsData}
                  isLoading={isLoadingAccounts}
                  isError={isErrorAccounts}
                  refetch={refetchAccounts}
                  isRefetching={isRefetchingAccounts}
                />
                <AccountCombobox
                  label="Appreciation Loss Account"
                  selectedAccount={selectedAccounts.appreciation_loss_account}
                  onAccountSelect={(value) =>
                    setSelectedAccounts((prev) => ({
                      ...prev,
                      appreciation_loss_account: parseInt(value),
                    }))
                  }
                  accountsData={accountsData}
                  isLoading={isLoadingAccounts}
                  isError={isErrorAccounts}
                  refetch={refetchAccounts}
                  isRefetching={isRefetchingAccounts}
                />
                <AccountCombobox
                  label="Appreciation Gain Account"
                  selectedAccount={selectedAccounts.appreciation_gain_account}
                  onAccountSelect={(value) =>
                    setSelectedAccounts((prev) => ({
                      ...prev,
                      appreciation_gain_account: parseInt(value),
                    }))
                  }
                  accountsData={accountsData}
                  isLoading={isLoadingAccounts}
                  isError={isErrorAccounts}
                  refetch={refetchAccounts}
                  isRefetching={isRefetchingAccounts}
                />
              </>
            )}
          </div>

          {/* Footer Navigation */}
          <DialogFooter>
            <div className="flex justify-end w-full">
              <Button
                type="button"
                className="mx-2"
                variant="secondary"
                onClick={onClose}
              >
                Close
              </Button>

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  "Processing..."
                ) : (
                  <>
                    Save <CheckCircle className="ml-2" />
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddAsset;

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {CalendarIcon} from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { AccountCombobox } from "@/Pages/Components/AccountCombobox";
const PayrollSettingsForm = () => {
    const axiosPrivate = useAxiosPrivate();
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm();
  const [selectedAccounts, setSelectedAccounts] = useState({
    payroll_expense_account: null,
    payroll_income_account: null,
  });

  // ✅ Fetch Payroll Settings (Default Values)
  const {
    data: payrollSettingsData,
    isLoading: isLoadingPayroll,
    isError: isErrorPayroll,
    refetch: refetchPayrollSettings,
    isRefetching: isRefetchingPayrollSettings,
  } = useQuery({
    queryKey: ["payroll-settings"],
    queryFn: async () => {
            const controller = new AbortController();

      const response = await axiosPrivate.get("/settings/payroll-settings", {
        signal: controller.signal,
      });
      return response.data.data.payroll_settings;
    },
  });

  // ✅ Fetch Account List
  const {
    data: accountsData,
    isLoading: isLoadingAccounts,
    isError: isErrorAccounts,
    refetch: refetchAccounts,
  } = useQuery({
    queryKey: ["account-votes"],
    queryFn: async () => {
            const controller = new AbortController();

      const response = await axiosPrivate.get("/settings/accounts/account", {
        signal: controller.signal,
      });
      return response.data.data.accounts;
    },
  });

  // ✅ Set default values when payroll settings are fetched
  useEffect(() => {
    if (payrollSettingsData) {
      setValue(
        "payroll_auto_generate_payslip",
        payrollSettingsData.payroll_auto_generate_payslip
      );
      setValue(
        "payroll_auto_generate_date",
        payrollSettingsData.payroll_auto_generate_date
      );

      setSelectedAccounts({
        payroll_expense_account:
          payrollSettingsData.payroll_expense_account || null,
        payroll_income_account:
          payrollSettingsData.payroll_income_account || null,
      });
    }
  }, [payrollSettingsData, setValue]);

  // ✅ Submit Form Handler
  const onSubmit = async (data) => {
          const controller = new AbortController();

    try {
      const formData = {
        payroll_expense_account: selectedAccounts.payroll_expense_account,
        payroll_income_account: selectedAccounts.payroll_income_account,
        payroll_auto_generate_payslip: data.payroll_auto_generate_payslip,
        payroll_auto_generate_date: data.payroll_auto_generate_date,
      };

      const response = await axiosPrivate.patch(
        "/settings/payroll-settings",
        formData,
        { signal: controller.signal }
      );
      toast({ title: "Success", description: response?.data?.messages });
      refetchPayrollSettings();
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
    <>
      {isLoadingPayroll || isRefetchingPayrollSettings ? (
        <Skeleton className="h-[500px] rounded-xl" />
      ) : isErrorPayroll ? (
        <Button onClick={refetchPayrollSettings}>Retry</Button>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-4 md:grid-cols-4 gap-6">
            {/* Expense Account Combobox */}
            <div>
              <AccountCombobox
                label="Expense Account"
                selectedAccount={selectedAccounts.payroll_expense_account}
                onAccountSelect={(value) =>
                  setSelectedAccounts((prev) => ({
                    ...prev,
                    payroll_expense_account: parseInt(value, 10),
                  }))
                }
                accountsData={accountsData}
                isLoading={isLoadingAccounts}
                isError={isErrorAccounts}
                refetch={refetchAccounts}
              />
            </div>

            {/* Income Account Combobox */}
            <div>
              <AccountCombobox
                label="Income Account"
                selectedAccount={selectedAccounts.payroll_income_account}
                onAccountSelect={(value) =>
                  setSelectedAccounts((prev) => ({
                    ...prev,
                    payroll_income_account: parseInt(value, 10),
                  }))
                }
                accountsData={accountsData}
                isLoading={isLoadingAccounts}
                isError={isErrorAccounts}
                refetch={refetchAccounts}
              />
            </div>
            {/* Auto Generate Payslip */}
            <div>
              <Label>Auto Generate Payslip</Label>
              <Select
              defaultValue={payrollSettingsData.payroll_auto_generate_payslip}
                onValueChange={(value) =>
                  setValue("payroll_auto_generate_payslip", value, {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder="Select Option"
                    {...register("payroll_auto_generate_payslip", {
                      required: "Required",
                    })}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
              </Select>
              {errors.payroll_auto_generate_payslip && (
                <p className="text-red-500 text-sm">
                  {errors.payroll_auto_generate_payslip.message}
                </p>
              )}
            </div>
            {/* Auto Generate Date */}
            <div>
              <Label htmlFor="payroll_auto_generate_date">Pay Date</Label>
              <Controller
                name="payroll_auto_generate_date"
                control={control}
                rules={{ required: "Date of auto generate is required" }}
                render={({ field }) => {
                  const parsedDate = field.value ? new Date(field.value) : null;
                  return (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
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
                          onSelect={(date) =>
                            field.onChange(date?.toISOString().split("T")[0])
                          }
                          disabled={(date) => date < new Date("2000-01-01")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  );
                }}
              />

              {errors.date_of_birth && (
                <p className="text-red-500 text-sm">
                  {errors.date_of_birth.message}
                </p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <Button size="sm" type="submit">
            Save Payroll Settings
          </Button>
        </form>
      )}
    </>
  );
};

export default PayrollSettingsForm;

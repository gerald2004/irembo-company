import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { AccountCombobox } from "@/Pages/Components/AccountCombobox";

const PayrollSettingsForm = () => {
  const axiosPrivate = useAxiosPrivate();
  const { register, handleSubmit, setValue, watch, formState: { isSubmitting } } = useForm();
  const autoGenerate = watch("payroll_auto_generate_payslip", "No");

  const [selectedAccounts, setSelectedAccounts] = useState({
    payroll_expense_account: null,
    payroll_income_account: null,
  });

  const {
    data: settings,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["payroll-settings"],
    queryFn: async () => {
      const res = await axiosPrivate.get("/settings/payroll-settings");
      return res.data.data.payroll_settings ?? null;
    },
  });

  const {
    data: accountsData = [],
    isLoading: isLoadingAccounts,
    isError: isErrorAccounts,
    refetch: refetchAccounts,
  } = useQuery({
    queryKey: ["account-votes"],
    queryFn: async () => {
      const res = await axiosPrivate.get("/settings/accounts/account");
      return res.data.data.accounts ?? [];
    },
  });

  useEffect(() => {
    if (settings) {
      setValue("payroll_auto_generate_payslip", settings.payroll_auto_generate_payslip ?? "No");
      setValue("payroll_auto_generate_date",    settings.payroll_auto_generate_date    ?? "");
      setSelectedAccounts({
        payroll_expense_account: settings.payroll_expense_account ?? null,
        payroll_income_account:  settings.payroll_income_account  ?? null,
      });
    }
  }, [settings, setValue]);

  const onSubmit = async (data) => {
    try {
      await axiosPrivate.patch("/settings/payroll-settings", {
        payroll_expense_account:       selectedAccounts.payroll_expense_account,
        payroll_income_account:        selectedAccounts.payroll_income_account,
        payroll_auto_generate_payslip: data.payroll_auto_generate_payslip,
        payroll_auto_generate_date:    data.payroll_auto_generate_date || null,
      });
      toast({ title: "Saved", description: "Payroll settings updated." });
      refetch();
    } catch (err) {
      toast({
        title: "Error",
        variant: "destructive",
        description: err?.response?.data?.messages || "Could not save settings.",
      });
    }
  };

  if (isLoading || isRefetching) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-48 rounded-lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-sm text-muted-foreground space-y-2">
        <p>Could not load payroll settings.</p>
        <Button variant="outline" size="sm" onClick={refetch}>Retry</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Salary Expense Account</Label>
          <AccountCombobox
            selectedAccount={selectedAccounts.payroll_expense_account}
            onAccountSelect={(v) =>
              setSelectedAccounts((p) => ({ ...p, payroll_expense_account: v ? parseInt(v, 10) : null }))
            }
            accountsData={accountsData}
            isLoading={isLoadingAccounts}
            isError={isErrorAccounts}
            refetch={refetchAccounts}
          />
          <p className="text-[11px] text-muted-foreground">Debited when payroll is posted</p>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Cash / Bank Account</Label>
          <AccountCombobox
            selectedAccount={selectedAccounts.payroll_income_account}
            onAccountSelect={(v) =>
              setSelectedAccounts((p) => ({ ...p, payroll_income_account: v ? parseInt(v, 10) : null }))
            }
            accountsData={accountsData}
            isLoading={isLoadingAccounts}
            isError={isErrorAccounts}
            refetch={refetchAccounts}
          />
          <p className="text-[11px] text-muted-foreground">Credited for net salary paid out</p>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">Auto Generate Payslip</Label>
          <Select
            defaultValue={settings?.payroll_auto_generate_payslip ?? "No"}
            onValueChange={(v) => setValue("payroll_auto_generate_payslip", v, { shouldValidate: true })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select" {...register("payroll_auto_generate_payslip")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Yes">Yes</SelectItem>
              <SelectItem value="No">No</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {autoGenerate === "Yes" && (
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Auto Generate Date</Label>
            <Input type="date" {...register("payroll_auto_generate_date")} />
            <p className="text-[11px] text-muted-foreground">Date payslips are auto-generated</p>
          </div>
        )}
      </div>

      <Button size="sm" type="submit" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
        Save Settings
      </Button>
    </form>
  );
};

export default PayrollSettingsForm;

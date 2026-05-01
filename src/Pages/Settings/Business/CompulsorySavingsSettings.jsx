/* eslint-disable react/prop-types */
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { Percent, RefreshCw, Save, PiggyBank, Wallet } from "lucide-react";

const CompulsorySavingsSettings = () => {
  const axiosPrivate = useAxiosPrivate();
  const [exists, setExists] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["compulsory-savings-settings"],
    queryFn: async () => {
      const res = await axiosPrivate.get("/settings/compulsory-savings");
      return res.data?.data?.settings;
    },
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      group_account_id: "",
      recurring_amount: 2000,
      first_cycle_percent: 15,
      subsequent_cycle_percent: 10,
    },
  });

  useEffect(() => {
    if (data) {
      setExists(true);
      setIsActive(data.status === "active");
      reset({
        group_account_id:         data.group_account_id ?? "",
        recurring_amount:         data.recurring_amount ?? 2000,
        first_cycle_percent:      data.first_cycle_percent ?? 15,
        subsequent_cycle_percent: data.subsequent_cycle_percent ?? 10,
      });
    }
  }, [data, reset]);

  const onSubmit = async (formData) => {
    try {
      const payload = {
        ...formData,
        group_account_id: formData.group_account_id ? Number(formData.group_account_id) : null,
        recurring_amount:         Number(formData.recurring_amount),
        first_cycle_percent:      Number(formData.first_cycle_percent),
        subsequent_cycle_percent: Number(formData.subsequent_cycle_percent),
        status: isActive ? "active" : "inactive",
      };

      if (exists) {
        await axiosPrivate.patch("/settings/compulsory-savings", payload);
      } else {
        await axiosPrivate.post("/settings/compulsory-savings", payload);
        setExists(true);
      }

      toast({ title: "Saved", description: "Compulsory savings settings updated successfully." });
      refetch();
    } catch (err) {
      toast({
        title: "Error",
        variant: "destructive",
        description: err?.response?.data?.messages || "Failed to save settings.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="font-medium">Failed to load settings.</p>
        <Button variant="outline" className="mt-4" onClick={refetch}>
          <RefreshCw className="w-4 h-4 mr-2" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="/dashboard">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Compulsory Savings Settings</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col gap-6 pt-4 max-w-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h5 className="text-2xl font-bold tracking-tight">Compulsory Savings</h5>
            <p className="text-sm text-muted-foreground mt-1">
              Configure frozen savings on loan disbursement and recurring collections on repayment.
            </p>
          </div>
          <Badge variant={isActive ? "default" : "secondary"} className="capitalize">
            {isActive ? "Active" : "Inactive"}
          </Badge>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Recurring savings on repayment */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Wallet className="w-4 h-4 text-blue-500" />
                Recurring Savings (Per Repayment)
              </CardTitle>
              <CardDescription>
                A fixed amount collected from each member on every loan repayment and credited
                to the configured group savings account.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="recurring_amount">Amount per Repayment (UGX)</Label>
                <Input
                  id="recurring_amount"
                  type="number"
                  step="1"
                  placeholder="e.g. 2000"
                  {...register("recurring_amount", {
                    required: "Amount is required",
                    min: { value: 0, message: "Cannot be negative" },
                  })}
                />
                {errors.recurring_amount && (
                  <p className="text-red-500 text-sm mt-1">{errors.recurring_amount.message}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  The teller can override this per transaction.
                </p>
              </div>

              <div>
                <Label htmlFor="group_account_id">Group Savings Account ID</Label>
                <Input
                  id="group_account_id"
                  type="number"
                  placeholder="Enter client_account_id"
                  {...register("group_account_id")}
                />
                {data?.group_account && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Currently linked:{" "}
                    <span className="font-medium text-foreground">
                      {data.group_account.client?.client_firstname}{" "}
                      {data.group_account.client?.client_lastname} —{" "}
                      UGX {Number(data.group_account.client_account_balance ?? 0).toLocaleString()}
                    </span>
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Recurring savings are credited to this account. Leave blank to disable collection.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Compulsory freeze % on loan disbursement */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <PiggyBank className="w-4 h-4 text-green-600" />
                Frozen Savings on Group Loan Disbursement
              </CardTitle>
              <CardDescription>
                When a group loan is disbursed, a percentage of each member&apos;s allocated amount
                is automatically frozen in their sub-account. The rate changes after the first loan cycle.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="first_cycle_percent" className="flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5" /> First Cycle Rate (%)
                </Label>
                <Input
                  id="first_cycle_percent"
                  type="number"
                  step="0.01"
                  placeholder="e.g. 15"
                  {...register("first_cycle_percent", {
                    required: "Required",
                    min: { value: 0, message: "Cannot be negative" },
                    max: { value: 100, message: "Cannot exceed 100%" },
                  })}
                />
                {errors.first_cycle_percent && (
                  <p className="text-red-500 text-sm mt-1">{errors.first_cycle_percent.message}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">Applied on a member&apos;s first group loan.</p>
              </div>

              <div>
                <Label htmlFor="subsequent_cycle_percent" className="flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5" /> Subsequent Cycles Rate (%)
                </Label>
                <Input
                  id="subsequent_cycle_percent"
                  type="number"
                  step="0.01"
                  placeholder="e.g. 10"
                  {...register("subsequent_cycle_percent", {
                    required: "Required",
                    min: { value: 0, message: "Cannot be negative" },
                    max: { value: 100, message: "Cannot exceed 100%" },
                  })}
                />
                {errors.subsequent_cycle_percent && (
                  <p className="text-red-500 text-sm mt-1">{errors.subsequent_cycle_percent.message}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">Applied on second and subsequent group loans.</p>
              </div>
            </CardContent>
          </Card>

          {/* Status toggle + submit */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Switch
                checked={isActive}
                onCheckedChange={setIsActive}
                id="settings-status"
              />
              <Label htmlFor="settings-status" className="cursor-pointer">
                {isActive ? "Settings Active" : "Settings Inactive"}
              </Label>
            </div>
            <Button type="submit" disabled={isSubmitting}>
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? "Saving…" : exists ? "Update Settings" : "Create Settings"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
};

export default CompulsorySavingsSettings;

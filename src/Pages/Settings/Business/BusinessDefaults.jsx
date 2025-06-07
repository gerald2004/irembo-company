import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { AccountCombobox } from "@/Pages/Components/AccountCombobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
const BusinessDefaults = () => {
  const axiosPrivate = useAxiosPrivate();

  const {
    data: defaultsData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["business-defaults"],
    queryFn: async () => {
            const controller = new AbortController();

      const response = await axiosPrivate.get("/settings/business/defaults", {
        signal: controller.signal,
      });
      return response.data.data.business_defaults;
    },
  });

  // Fetch accounts data for dropdown
  const {
    data: accountsData,
    isLoading: isLoadingAccounts,
    isError: isErrorAccounts,
    refetch: refetchAccounts,
    isRefetching: isRefetchingAccounts,
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

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      currency: null,
      penalty_account: null,
      share_account: null,
      interest_account: null,
      disbursment_account: null,
      share_price: "",
      writeoff_expense_account: null,
      writeoff_income_account: null,
      loan_fund_account: null,
      bad_loans_account: null,
      transfer_clearing_account: null,
      onUpdate: null,
      member_saving_account: null,
      compulsory_saving_account: null,
      penalty_receivable_account: null,
      interest_receivable_account: null,
      frozen_funds_account: null,
      default_capital_account: null,
    },
  });

  const [selectedAccounts, setSelectedAccounts] = useState({
    penalty_account: null,
    penalty_receivable_account: null,
    interest_receivable_account: null,
    share_account: null,
    interest_account: null,
    disbursment_account: null,
    writeoff_expense_account: null,
    writeoff_income_account: null,
    bad_loans_account: null,
    transfer_clearing_account: null,
    member_saving_account: null,
    frozen_funds_account: null,
    default_capital_account: null,
  });

  // Initialize form with fetched defaults
  useEffect(() => {
    if (defaultsData) {
      reset({
        share_price: defaultsData.share_price || "",
        currency: defaultsData.currency,
        onUpdate: defaultsData.onUpdate,
      });
      setSelectedAccounts({
        penalty_account: defaultsData.penalty_account?.id || null,
        share_account: defaultsData.share_account?.id || null,
        interest_account: defaultsData.interest_account?.id || null,
        disbursment_account: defaultsData.disbursment_account?.id || null,
        bad_loans_account: defaultsData.bad_loans_account?.id || null,
        transfer_clearing_account:
          defaultsData.transfer_clearing_account?.id || null,
        writeoff_expense_account:
          defaultsData.writeoff_expense_account?.id || null,
        writeoff_income_account:
          defaultsData.writeoff_income_account?.id || null,
        member_saving_account: defaultsData.member_saving_account.id || null,
        penalty_receivable_account:
          defaultsData.penalty_receivable_account.id || null,
        interest_receivable_account:
          defaultsData.interest_receivable_account.id || null,
        frozen_funds_account: defaultsData.frozen_funds_account.id || null,
        default_capital_account:
          defaultsData.default_capital_account.id || null,
      });
    }
  }, [defaultsData, reset]);

  const onSubmit = async (data) => {
          const controller = new AbortController();

    const payload = {
      ...data,
      ...selectedAccounts,
    };
    try {
      const response = await axiosPrivate.patch(
        `/settings/business/defaults`,
        payload,
        { signal: controller.signal }
      );
      toast({ title: "Success", description: response?.data?.messages });
      reset();
      refetch();
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
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="/dashboard">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Business Defaults</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <div className="flex items-center justify-between space-y-2">
            <h5 className="text-2xl font-bold tracking-tight">
              Business Defaults
            </h5>
          </div>
          <div className="max-w-4xl mx-auto p-6 space-y-6">
            {isLoadingAccounts || isRefetchingAccounts ? (
              <Skeleton className="h-[500px] rounded-xl" />
            ) : isErrorAccounts ? (
              <Button onClick={refetchAccounts}>Retry</Button>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)}>
                <Card>
                  <CardHeader>
                    <CardTitle>Business Defaults</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {isLoading ? (
                        <>
                          <Skeleton className="h-10 w-full rounded-lg" />
                          <Skeleton className="h-10 w-full rounded-lg" />
                          <Skeleton className="h-10 w-full rounded-lg" />
                          <Skeleton className="h-10 w-full rounded-lg" />
                          <Skeleton className="h-10 w-full rounded-lg" />
                          <Skeleton className="h-10 w-full rounded-lg" />
                          <Skeleton className="h-10 w-full rounded-lg" />
                          <Skeleton className="h-10 w-full rounded-lg" />
                          <Skeleton className="h-10 w-full rounded-lg" />
                        </>
                      ) : isError ? (
                        <Button onClick={refetch}>Retry</Button>
                      ) : (
                        <>
                          <AccountCombobox
                            label="Member Savings Account"
                            selectedAccount={
                              selectedAccounts.member_saving_account
                            }
                            onAccountSelect={(value) =>
                              setSelectedAccounts((prev) => ({
                                ...prev,
                                member_saving_account: value,
                              }))
                            }
                            accountsData={accountsData}
                          />
                          {/* <AccountCombobox
                            label="Compulsory Savings Account"
                            selectedAccount={
                              selectedAccounts.compulsory_saving_account
                            }
                            onAccountSelect={(value) =>
                              setSelectedAccounts((prev) => ({
                                ...prev,
                                compulsory_saving_account: value,
                              }))
                            }
                            accountsData={accountsData}
                          /> */}
                          <AccountCombobox
                            label="Penalty Account"
                            selectedAccount={selectedAccounts.penalty_account}
                            onAccountSelect={(value) =>
                              setSelectedAccounts((prev) => ({
                                ...prev,
                                penalty_account: value,
                              }))
                            }
                            accountsData={accountsData}
                          />
                          <AccountCombobox
                            label="Receivable Penalty Account"
                            selectedAccount={
                              selectedAccounts.penalty_receivable_account
                            }
                            onAccountSelect={(value) =>
                              setSelectedAccounts((prev) => ({
                                ...prev,
                                penalty_receivable_account: value,
                              }))
                            }
                            accountsData={accountsData}
                          />
                          <AccountCombobox
                            label="Share Account"
                            selectedAccount={selectedAccounts.share_account}
                            onAccountSelect={(value) =>
                              setSelectedAccounts((prev) => ({
                                ...prev,
                                share_account: value,
                              }))
                            }
                            accountsData={accountsData}
                          />
                          <AccountCombobox
                            label="Interest Account"
                            selectedAccount={selectedAccounts.interest_account}
                            onAccountSelect={(value) =>
                              setSelectedAccounts((prev) => ({
                                ...prev,
                                interest_account: value,
                              }))
                            }
                            accountsData={accountsData}
                          />
                          <AccountCombobox
                            label="Receivable Interest Account"
                            selectedAccount={
                              selectedAccounts.interest_receivable_account
                            }
                            onAccountSelect={(value) =>
                              setSelectedAccounts((prev) => ({
                                ...prev,
                                interest_receivable_account: value,
                              }))
                            }
                            accountsData={accountsData}
                          />
                          <AccountCombobox
                            label="Frozen Funds Account"
                            selectedAccount={
                              selectedAccounts.frozen_funds_account
                            }
                            onAccountSelect={(value) =>
                              setSelectedAccounts((prev) => ({
                                ...prev,
                                frozen_funds_account: value,
                              }))
                            }
                            accountsData={accountsData}
                          />
                          <AccountCombobox
                            label="Loan Portfolio Account"
                            selectedAccount={
                              selectedAccounts.disbursment_account
                            }
                            onAccountSelect={(value) =>
                              setSelectedAccounts((prev) => ({
                                ...prev,
                                disbursment_account: value,
                              }))
                            }
                            accountsData={accountsData}
                          />
                          <AccountCombobox
                            label="Bad Loans Account"
                            selectedAccount={selectedAccounts.bad_loans_account}
                            onAccountSelect={(value) =>
                              setSelectedAccounts((prev) => ({
                                ...prev,
                                bad_loans_account: value,
                              }))
                            }
                            accountsData={accountsData}
                          />
                          <AccountCombobox
                            label="Transfer Clearing Account"
                            selectedAccount={
                              selectedAccounts.transfer_clearing_account
                            }
                            onAccountSelect={(value) =>
                              setSelectedAccounts((prev) => ({
                                ...prev,
                                transfer_clearing_account: value,
                              }))
                            }
                            accountsData={accountsData}
                          />
                          <AccountCombobox
                            label="Write Off Expense Account"
                            selectedAccount={
                              selectedAccounts.writeoff_expense_account
                            }
                            onAccountSelect={(value) =>
                              setSelectedAccounts((prev) => ({
                                ...prev,
                                writeoff_expense_account: value,
                              }))
                            }
                            accountsData={accountsData}
                          />
                          <AccountCombobox
                            label="Write Off Income Account"
                            selectedAccount={
                              selectedAccounts.writeoff_income_account
                            }
                            onAccountSelect={(value) =>
                              setSelectedAccounts((prev) => ({
                                ...prev,
                                writeoff_income_account: value,
                              }))
                            }
                            accountsData={accountsData}
                          />
                          <AccountCombobox
                            label="Business Default Account"
                            selectedAccount={
                              selectedAccounts.default_capital_account
                            }
                            onAccountSelect={(value) =>
                              setSelectedAccounts((prev) => ({
                                ...prev,
                                default_capital_account: value,
                              }))
                            }
                            accountsData={accountsData}
                          />

                          <div>
                            <Label htmlFor="share_price">Share Price</Label>
                            <Input
                              id="share_price"
                              placeholder="Enter share price"
                              className="mt-1"
                              {...register("share_price", {
                                required: "Share price is required",
                              })}
                            />
                            {errors.share_price && (
                              <p className="text-red-500 text-sm">
                                {errors.share_price.message}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor="currency">Currency</Label>
                            <Input
                              id="currency"
                              placeholder="Enter share price"
                              className="mt-1"
                              {...register("currency", {
                                required: "Currency is required",
                              })}
                            />
                            {errors.currency && (
                              <p className="text-red-500 text-sm">
                                {errors.currency.message}
                              </p>
                            )}
                          </div>
                          <div className="">
                            <Label htmlFor="timestamp">Last Updated</Label>
                            <Input
                              id="timestamp"
                              placeholder="Last Updated"
                              className="mt-1"
                              disabled={true}
                              {...register("onUpdate")}
                            />
                          </div>
                        </>
                      )}
                    </div>
                    <Button
                      className="mt-2"
                      type="submit"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Saving Please Wait..." : "Save Changes"}
                    </Button>
                  </CardContent>
                </Card>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default BusinessDefaults;

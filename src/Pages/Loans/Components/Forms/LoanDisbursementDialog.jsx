/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader,
  DialogTitle, DialogClose, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { useParams } from "react-router-dom";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { format } from "date-fns";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
  ArrowLeft, ArrowRight, CheckCircle, X, Info, LockKeyhole,
  CalendarIcon, Receipt, Wallet, LockIcon, ChevronDown, ChevronUp,
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot,
} from "@/components/ui/input-otp";
import { Calendar } from "@/components/ui/calendar";
import ChargesReviewStep from "@/Pages/Components/ChargesReviewStep";
import { useQuery } from "@tanstack/react-query";

const TOTAL_STEPS = 3;

const intervalLabel = {
  daily: "days",
  weekly: "weeks",
  monthly: "months",
  yearly: "years",
};

const fmt = (v) =>
  Number(v ?? 0).toLocaleString("en-UG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const LoanDisbursementDialog = ({ isOpen, onClose, refetch, defaultValues, action }) => {
  const axiosPrivate = useAxiosPrivate();
  const { loanid } = useParams();

  const { register, handleSubmit, control, trigger, reset, setValue, watch,
    formState: { errors, isSubmitting } } = useForm({
    defaultValues: { date: new Date().toISOString().split("T")[0] },
  });

  const [step, setStep] = useState(1);
  const [skipChargeIds, setSkipChargeIds] = useState([]);
  const [chargeOverrides, setChargeOverrides] = useState({});
  const [monFeeOverride, setMonFeeOverride] = useState(null); // { type, value, base } | null
  const [memberOverrides, setMemberOverrides] = useState({}); // { [allocation_id]: { tenure_period, interest_rate, loan_type } }
  const [showMemberOverrides, setShowMemberOverrides] = useState(false);

  const watchedAmount = parseFloat(watch("loan_application_amount")) || 0;
  const tenure        = parseInt(watch("loan_application_tenure_period")) || null;
  const loanProductId = defaultValues?.loan_product?.loan_product_id ?? null;

  // Derive product metadata for display
  const interval    = defaultValues?.loan_product?.loan_product_interval ?? null;
  const tenureUnit  = intervalLabel[interval] ?? "periods";
  const productType = defaultValues?.loan_product?.loan_product_type ?? "";

  // Detect group loan
  const isGroupLoan = defaultValues?.client?.client_type === "group";
  const groupId     = isGroupLoan ? (defaultValues?.client_id ?? defaultValues?.client?.client_id) : null;

  // Fetch member savings for group loans — shown as an info panel
  const { data: memberSavingsData } = useQuery({
    queryKey: ["group-member-savings", groupId],
    queryFn: async () => {
      const res = await axiosPrivate.get(`/clients/groups/${groupId}/member-savings`);
      return res.data.data;
    },
    enabled: !!groupId,
  });

  const allMembers = (memberSavingsData?.members ?? []).reduce((acc, m) => {
    if (!acc.find((x) => x.member_id === m.member_id)) acc.push(m);
    return acc;
  }, []);

  // Fetch group loan allocations for per-member override UI
  const { data: allocationsData } = useQuery({
    queryKey: ["group-loan-allocations", loanid],
    queryFn: async () => {
      const res = await axiosPrivate.get(`/loans/${loanid}/group-allocations`);
      return res.data.data ?? [];
    },
    enabled: !!isGroupLoan && !!loanid,
  });
  const allocations = allocationsData ?? [];

  const setMemberOverride = (allocId, field, value) => {
    setMemberOverrides((prev) => ({
      ...prev,
      [allocId]: { ...(prev[allocId] ?? {}), [field]: value },
    }));
  };

  useEffect(() => {
    if (defaultValues) {
      Object.entries(defaultValues).forEach(([k, v]) => setValue(k, v));
      if (defaultValues.loan_product?.loan_products_interest_rate) {
        setValue("loan_products_interest_rate", String(defaultValues.loan_product.loan_products_interest_rate));
      }
      // Pre-populate monitoring fee override from product defaults
      const p = defaultValues.loan_product;
      if (p?.monitoring_fee_enabled == 1 && parseFloat(p.monitoring_fee_value) > 0) {
        setMonFeeOverride({
          type:  p.monitoring_fee_type  || "fixed",
          value: String(p.monitoring_fee_value),
          base:  p.monitoring_fee_base  || "principal",
        });
      } else {
        setMonFeeOverride(null);
      }
    }
  }, [defaultValues, setValue]);

  const validateStep = async () => {
    const valid = await trigger();
    if (valid) setStep((p) => Math.min(p + 1, TOTAL_STEPS));
  };

  const handleClose = () => {
    reset();
    setStep(1);
    setSkipChargeIds([]);
    setChargeOverrides({});
    setMonFeeOverride(null);
    setMemberOverrides({});
    setShowMemberOverrides(false);
    onClose();
  };

  const onSubmit = async (data) => {
    try {
      // Build per-member override list — only include allocations with at least one override
      const member_overrides = Object.entries(memberOverrides)
        .filter(([, v]) => v.tenure_period || v.interest_rate || v.loan_type)
        .map(([allocId, v]) => ({
          allocation_id: parseInt(allocId),
          ...(v.tenure_period ? { tenure_period: parseInt(v.tenure_period) } : {}),
          ...(v.interest_rate ? { interest_rate: parseFloat(v.interest_rate) } : {}),
          ...(v.loan_type     ? { loan_type: v.loan_type } : {}),
        }));

      const payload = {
        loan_application_id: loanid,
        interest:     data.loan_products_interest_rate,
        amount:       data.loan_application_amount,
        date:         format(new Date(data.date), "yyyy-MM-dd"),
        tenure:       data.loan_application_tenure_period,
        action,
        user_pincode: data.user_pincode,
        skip_charge_ids: skipChargeIds,
        charge_overrides: chargeOverrides,
        monitoring_fee_override: monFeeOverride
          ? { ...monFeeOverride, value: parseFloat(monFeeOverride.value) || 0 }
          : null,
        ...(member_overrides.length > 0 ? { member_overrides } : {}),
      };
      const response = await axiosPrivate.patch("/loans/applications", payload);
      toast({ title: "Success", description: response.data.messages });
      reset();
      setStep(1);
      setSkipChargeIds([]);
      setChargeOverrides({});
      setMonFeeOverride(null);
      setMemberOverrides({});
      setShowMemberOverrides(false);
      refetch();
      onClose();
    } catch (error) {
      toast({
        title: "Uh oh! Something went wrong.",
        variant: "destructive",
        description: error?.response?.data?.messages || "No server response",
      });
    }
  };

  const stepIcons = [
    { icon: <Info className="w-6 h-6 text-blue-500" />,       label: "Loan Details" },
    { icon: <Receipt className="w-6 h-6 text-orange-500" />,  label: "Charges" },
    { icon: <LockKeyhole className="w-6 h-6 text-yellow-500" />, label: "PinCode" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[620px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Disburse Loan Application</DialogTitle>
          <DialogDescription>Follow the steps to disburse the loan.</DialogDescription>
          <DialogClose asChild>
            <button className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:outline-none" onClick={handleClose}>
              <X className="h-4 w-4" />
            </button>
          </DialogClose>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center space-x-3 my-1">
          {stepIcons.map((s, i) => (
            <div key={i} className={`flex items-center ${step >= i + 1 ? "opacity-100" : "opacity-50"} transition-opacity`}>
              {s.icon}
              <span className="ml-2 text-sm font-medium">{s.label}</span>
              {i < stepIcons.length - 1 && <div className="h-[2px] w-6 bg-gray-300 mx-2" />}
            </div>
          ))}
        </div>
        <Progress value={(step / TOTAL_STEPS) * 100} className="my-1" />

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden min-h-0">
          <div className="overflow-y-auto flex-1 min-h-0 space-y-4 pr-1">
          {/* ── Step 1: Loan Details ── */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Product info strip */}
              {(productType || interval) && (
                <div className="flex flex-wrap gap-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-800/50 rounded-md px-3 py-2">
                  {productType && (
                    <Badge variant="outline" className="text-xs capitalize">
                      {productType.replace("_", " ")}
                    </Badge>
                  )}
                  {interval && (
                    <Badge variant="outline" className="text-xs capitalize">
                      {interval} repayments
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs text-blue-700">
                    {defaultValues?.loan_product?.loan_products_interest_rate ?? "—"}% interest
                  </Badge>
                  <span className="text-xs text-muted-foreground self-center ml-auto">
                    Tenure in <strong>{tenureUnit}</strong>
                  </span>
                </div>
              )}

              <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="loan_application_amount">Loan Amount</Label>
                  <Input id="loan_application_amount" type="number" step="0.01" placeholder="Enter amount"
                    {...register("loan_application_amount", { required: "Amount is required" })} />
                  {errors.loan_application_amount && <p className="text-red-500 text-sm">{errors.loan_application_amount.message}</p>}
                </div>

                <div>
                  <Label htmlFor="loan_application_tenure_period">
                    Tenure Period ({tenureUnit})
                  </Label>
                  <Input id="loan_application_tenure_period" type="number" min="1"
                    placeholder={`Enter number of ${tenureUnit}`}
                    {...register("loan_application_tenure_period", {
                      required: "Tenure is required",
                      min: { value: 1, message: "Must be at least 1" },
                    })} />
                  {errors.loan_application_tenure_period && <p className="text-red-500 text-sm">{errors.loan_application_tenure_period.message}</p>}
                </div>

                <div>
                  <Label htmlFor="loan_products_interest_rate">Interest Rate (%)</Label>
                  <Input id="loan_products_interest_rate" type="number" step="0.01" placeholder="Interest rate"
                    {...register("loan_products_interest_rate", { required: "Interest is required" })} />
                  {errors.loan_products_interest_rate && <p className="text-red-500 text-sm">{errors.loan_products_interest_rate.message}</p>}
                </div>

                <div>
                  <Label htmlFor="date">Date Of Disbursement</Label>
                  <Controller name="date" control={control} rules={{ required: "Date is required" }}
                    render={({ field }) => (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full pl-3 text-left font-normal">
                            {field.value ? new Date(field.value).toLocaleDateString() : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange}
                            disabled={(d) => d < new Date("2000-01-01")} initialFocus />
                        </PopoverContent>
                      </Popover>
                    )} />
                  {errors.date && <p className="text-red-500 text-sm">{errors.date.message}</p>}
                </div>
              </fieldset>

              {/* Monitoring fee override */}
              {defaultValues?.loan_product?.monitoring_fee_enabled == 1 && (
                <div className="border rounded-md p-3 space-y-2 bg-muted/40">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Monitoring Fee</p>
                    <div className="flex gap-1">
                      <Badge variant="outline" className="text-xs capitalize">
                        {monFeeOverride?.type ?? defaultValues.loan_product.monitoring_fee_type ?? "fixed"}
                      </Badge>
                      <Badge variant="outline" className="text-xs capitalize">
                        per {monFeeOverride?.base ?? defaultValues.loan_product.monitoring_fee_base ?? "principal"}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="mon_fee_value" className="text-xs text-muted-foreground">
                      {monFeeOverride?.type === "percent"
                        ? "Fee (%)"
                        : "Fee Amount"}{" "}
                      — override if needed
                    </Label>
                    <Input
                      id="mon_fee_value"
                      type="number"
                      step="0.01"
                      min="0"
                      value={monFeeOverride?.value ?? ""}
                      onChange={(e) =>
                        setMonFeeOverride((prev) => ({
                          type:  prev?.type  ?? defaultValues.loan_product.monitoring_fee_type  ?? "fixed",
                          base:  prev?.base  ?? defaultValues.loan_product.monitoring_fee_base  ?? "principal",
                          value: e.target.value,
                        }))
                      }
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Set to 0 to disable monitoring fee for this disbursement.
                    </p>
                  </div>
                </div>
              )}

              {/* Group member savings preview */}
              {isGroupLoan && allMembers.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Member Savings at Disbursement
                  </p>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/60 text-muted-foreground dark:text-slate-400">
                        <tr>
                          <th className="text-left px-3 py-2 font-semibold">Member</th>
                          <th className="text-right px-3 py-2 font-semibold text-blue-700">
                            <Wallet className="w-3 h-3 inline mr-1" />Available
                          </th>
                          <th className="text-right px-3 py-2 font-semibold text-purple-700">
                            <LockIcon className="w-3 h-3 inline mr-1" />Frozen
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {allMembers.map((m) => {
                          const name = `${m.member?.client_firstname ?? ""} ${m.member?.client_lastname ?? ""}`.trim();
                          return (
                            <tr key={m.member_id} className="border-t dark:border-slate-700">
                              <td className="px-3 py-1.5 font-medium">{name || `Member #${m.member_id}`}</td>
                              <td className="px-3 py-1.5 text-right text-blue-700 font-medium">
                                UGX {fmt(m.actual_balance)}
                              </td>
                              <td className="px-3 py-1.5 text-right text-purple-700 font-medium">
                                UGX {fmt(m.frozen_balance)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    After disbursement, each member&apos;s allocated amount is deposited into their savings account and the compulsory % is frozen.
                  </p>
                </div>
              )}

              {/* Per-member rate / tenure overrides (group loans only) */}
              {isGroupLoan && allocations.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
                    onClick={() => setShowMemberOverrides((v) => !v)}
                  >
                    <span>Per-member rate / tenure overrides (optional)</span>
                    {showMemberOverrides
                      ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </button>

                  {showMemberOverrides && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-muted/30 text-muted-foreground">
                          <tr>
                            <th className="text-left px-3 py-2">Member</th>
                            <th className="text-left px-3 py-2">Allocation</th>
                            <th className="px-3 py-2">Tenure</th>
                            <th className="px-3 py-2">Rate (%)</th>
                            <th className="px-3 py-2">Type</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allocations.map((a) => {
                            const ovr = memberOverrides[a.id] ?? {};
                            const memberName = a.member
                              ? `${a.member.client_firstname ?? ""} ${a.member.client_lastname ?? ""}`.trim()
                              : `Member #${a.member_id}`;
                            return (
                              <tr key={a.id} className="border-t dark:border-slate-700">
                                <td className="px-3 py-1.5 font-medium whitespace-nowrap">{memberName}</td>
                                <td className="px-3 py-1.5 text-right whitespace-nowrap text-blue-700 font-medium">
                                  UGX {fmt(a.allocated_amount)}
                                </td>
                                <td className="px-2 py-1">
                                  <Input
                                    type="number"
                                    min="1"
                                    placeholder={String(tenure ?? "—")}
                                    value={ovr.tenure_period ?? ""}
                                    onChange={(e) => setMemberOverride(a.id, "tenure_period", e.target.value)}
                                    className="h-7 text-xs w-20"
                                  />
                                </td>
                                <td className="px-2 py-1">
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder={String(defaultValues?.loan_product?.loan_products_interest_rate ?? "—")}
                                    value={ovr.interest_rate ?? ""}
                                    onChange={(e) => setMemberOverride(a.id, "interest_rate", e.target.value)}
                                    className="h-7 text-xs w-20"
                                  />
                                </td>
                                <td className="px-2 py-1">
                                  <Select
                                    value={ovr.loan_type ?? ""}
                                    onValueChange={(v) => setMemberOverride(a.id, "loan_type", v)}
                                  >
                                    <SelectTrigger className="h-7 text-xs w-32">
                                      <SelectValue placeholder={productType || "default"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="">Use default</SelectItem>
                                      <SelectItem value="fixed">Fixed</SelectItem>
                                      <SelectItem value="reducing_balance">Reducing Balance</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      <p className="text-xs text-muted-foreground px-3 py-2">
                        Leave blank to use the loan-level defaults. Filled values generate an independent schedule for that member.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Step 2: Charges ── */}
          {step === 2 && (
            <ChargesReviewStep
              amount={watchedAmount}
              loanProductId={loanProductId}
              trigger="on_disbursement"
              onSkipChange={setSkipChargeIds}
              onOverrideChange={setChargeOverrides}
            />
          )}

          {/* ── Step 3: PIN ── */}
          {step === 3 && (
            <div className="flex flex-col items-center">
              <Controller control={control} name="user_pincode"
                rules={{ required: "Pincode is required", pattern: { value: /^\d{4}$/, message: "PIN must be exactly 4 digits" } }}
                render={({ field }) => (
                  <>
                    <Label>Enter Pincode</Label>
                    <InputOTP maxLength={4} {...field}>
                      <InputOTPGroup className="flex space-x-3 py-4">
                        <InputOTPSlot index={0} className="h-10 w-10 text-center rounded-md" />
                        <InputOTPSlot index={1} className="h-10 w-10 text-center rounded-md" />
                        <InputOTPSeparator />
                        <InputOTPSlot index={2} className="h-10 w-10 text-center rounded-md" />
                        <InputOTPSlot index={3} className="h-10 w-10 text-center rounded-md" />
                      </InputOTPGroup>
                    </InputOTP>
                  </>
                )} />
              {errors.user_pincode && <p className="text-red-500 text-sm mt-1">{errors.user_pincode.message}</p>}
            </div>
          )}

          </div>
          <DialogFooter className="pt-3">
            <div className="flex justify-end w-full gap-2">
              {step > 1 && (
                <Button type="button" variant="secondary" onClick={() => setStep((p) => Math.max(p - 1, 1))}>
                  <ArrowLeft className="mr-2" /> Back
                </Button>
              )}
              {step < TOTAL_STEPS && (
                <Button type="button" onClick={validateStep}>
                  Next <ArrowRight className="ml-2" />
                </Button>
              )}
              {step === TOTAL_STEPS && (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Processing..." : "Disburse"} <CheckCircle className="ml-2" />
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LoanDisbursementDialog;

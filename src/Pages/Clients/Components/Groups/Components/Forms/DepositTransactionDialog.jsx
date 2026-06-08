/* eslint-disable react/prop-types */
import { useState, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader,
  DialogTitle, DialogClose, DialogDescription,
} from "@/components/ui/dialog";
import {
  InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { useParams } from "react-router-dom";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { useQuery } from "@tanstack/react-query";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft, ArrowRight, CheckCircle, X, Info, LockKeyhole, Receipt,
} from "lucide-react";
import ChargesReviewStep from "@/Pages/Components/ChargesReviewStep";
import { LinkedChannelPicker } from "@/components/linked-channel-picker";

// Steps: 1 = Details, 2 = Charges (skipped if none), 3 = PIN
// We use logical step numbers 1/2/3 internally.
// When hasCharges===false we jump directly from 1→3 and display "2 of 2" etc.

const DepositTransactionDialog = ({ isOpen, onClose, refetch, accountId, handleOpenReceiptDialog }) => {
  const axiosPrivate = useAxiosPrivate();
  const { id: clientId } = useParams();

  const { register, handleSubmit, control, trigger, watch, reset,
    formState: { errors, isSubmitting } } = useForm();

  const [step, setStep] = useState(1);
  const [skipFeeIds, setSkipFeeIds] = useState([]);
  const [feeOverrides, setFeeOverrides] = useState({});
  const [selectedMemberId, setSelectedMemberId] = useState("none");
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [channelError, setChannelError] = useState("");
  // null = not yet loaded, number = count of applicable charges (fees + pending)
  const [chargesCount, setChargesCount] = useState(null);

  const watchedAmount = parseFloat(watch("deposit_transaction_amount")) || 0;

  // When charges step loads, it tells us how many items there are
  const handleChargesLoaded = useCallback((count) => {
    setChargesCount(count);
  }, []);

  // Whether the charges review step is needed
  const hasCharges = chargesCount === null || chargesCount > 0; // null = unknown, show by default

  // Visual step count for the progress bar / labels
  const totalVisualSteps = hasCharges ? 3 : 2;
  const visualStep = step === 3 ? totalVisualSteps : step;

  // Load group members for the "depositing member" selector
  const { data: memberSavingsData } = useQuery({
    queryKey: ["group-member-savings", clientId],
    queryFn: async () => {
      const res = await axiosPrivate.get(`/clients/groups/${clientId}/member-savings`);
      return res.data.data;
    },
    enabled: !!clientId,
  });

  const allMembers = (memberSavingsData?.members ?? []).reduce((acc, m) => {
    if (!acc.find((x) => x.member_id === m.member_id)) acc.push(m);
    return acc;
  }, []);

  const goNext = async () => {
    if (step === 1 && !selectedChannel) {
      setChannelError("Please select a payment channel");
      return;
    }
    setChannelError("");
    const valid = await trigger();
    if (!valid) return;

    if (step === 1 && !hasCharges) {
      // Skip the charges step entirely
      setStep(3);
    } else {
      setStep((p) => Math.min(p + 1, 3));
    }
  };

  const goBack = () => {
    if (step === 3 && !hasCharges) {
      setStep(1);
    } else {
      setStep((p) => Math.max(p - 1, 1));
    }
  };

  const handleClose = () => {
    reset();
    setStep(1);
    setSkipFeeIds([]);
    setFeeOverrides({});
    setSelectedMemberId("none");
    setSelectedChannel(null);
    setChannelError("");
    setChargesCount(null);
    onClose();
  };

  const onSubmit = async (data) => {
    if (!selectedChannel) {
      setChannelError("Please select a payment channel");
      return;
    }
    try {
      const payload = {
        ...data,
        client_id: clientId,
        client_account_id: accountId,
        deposit_transaction_method: selectedChannel.type,
        deposit_transaction_account_id: String(selectedChannel.linked_account_id),
        skip_fee_ids: skipFeeIds,
        fee_overrides: feeOverrides,
        ...(selectedMemberId && selectedMemberId !== "none" ? { member_id: Number(selectedMemberId) } : {}),
      };
      const response = await axiosPrivate.post("/accounting/savings/deposits", payload);
      toast({ title: "Success", description: response.data.messages });
      if (handleOpenReceiptDialog) handleOpenReceiptDialog(response.data.data, "savings");
      reset();
      setStep(1);
      setSkipFeeIds([]);
      setFeeOverrides({});
      setSelectedMemberId("none");
      setSelectedChannel(null);
      setChannelError("");
      setChargesCount(null);
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

  const stepLabels = hasCharges
    ? ["Deposit Details", "Charges", "Confirm"]
    : ["Deposit Details", "Confirm"];

  const stepIcons = hasCharges
    ? [
        <Info key="i" className="w-5 h-5 text-blue-500" />,
        <Receipt key="r" className="w-5 h-5 text-orange-500" />,
        <LockKeyhole key="l" className="w-5 h-5 text-yellow-500" />,
      ]
    : [
        <Info key="i" className="w-5 h-5 text-blue-500" />,
        <LockKeyhole key="l" className="w-5 h-5 text-yellow-500" />,
      ];

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Deposit Transaction</DialogTitle>
          <DialogDescription>Follow the steps to complete the transaction.</DialogDescription>
          <DialogClose asChild>
            <button
              className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:outline-none"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </button>
          </DialogClose>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center space-x-3 my-1">
          {stepLabels.map((label, i) => (
            <div
              key={label}
              className={`flex items-center ${visualStep >= i + 1 ? "opacity-100" : "opacity-50"} transition-opacity`}
            >
              {stepIcons[i]}
              <span className="ml-2 text-sm font-medium">{label}</span>
              {i < stepLabels.length - 1 && <div className="h-[2px] w-6 bg-gray-300 mx-2" />}
            </div>
          ))}
        </div>
        <Progress value={(visualStep / totalVisualSteps) * 100} className="my-1" />

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden min-h-0">
          <div className="overflow-y-auto flex-1 min-h-0 space-y-4 pr-1">
          {/* ── Step 1: Details ── */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="deposit_transaction_amount">Deposit Amount</Label>
                  <Input
                    id="deposit_transaction_amount"
                    type="number"
                    step="0.01"
                    placeholder="Enter amount"
                    {...register("deposit_transaction_amount", { required: "Amount is required" })}
                  />
                  {errors.deposit_transaction_amount && (
                    <p className="text-red-500 text-sm">{errors.deposit_transaction_amount.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="deposit_transaction_notary">Notary</Label>
                  <Input
                    id="deposit_transaction_notary"
                    defaultValue="Savings"
                    placeholder="Deposit Notary"
                    {...register("deposit_transaction_notary", { required: "Notary is required" })}
                  />
                  {errors.deposit_transaction_notary && (
                    <p className="text-red-500 text-sm">{errors.deposit_transaction_notary.message}</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="deposit_transaction_notes">Notes (Optional)</Label>
                  <Input
                    id="deposit_transaction_notes"
                    placeholder="Optional note"
                    {...register("deposit_transaction_notes")}
                  />
                </div>

                {allMembers.length > 0 && (
                  <div className="md:col-span-2">
                    <Label>Depositing Member (Optional)</Label>
                    <Select value={selectedMemberId || "none"} onValueChange={setSelectedMemberId}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select member contributing this deposit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— Group deposit (no specific member) —</SelectItem>
                        {allMembers.map((m) => (
                          <SelectItem key={m.member_id} value={String(m.member_id)}>
                            {m.member?.client_firstname} {m.member?.client_lastname}
                            {m.member?.client_account_number ? ` (${m.member.client_account_number})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      If selected, this deposit is also recorded in the member&apos;s individual savings statement.
                    </p>
                  </div>
                )}
              </div>
              <div>
                <Label className="mb-1.5 block">Payment Channel</Label>
                <LinkedChannelPicker
                  value={selectedChannel}
                  onChange={(acc) => { setSelectedChannel(acc); setChannelError(""); }}
                  error={channelError}
                  restrictCashToOwnTill
                />
              </div>
            </div>
          )}

          {/* ── Step 2: Charges ── */}
          {step === 2 && (
            <ChargesReviewStep
              amount={watchedAmount}
              clientAccountId={accountId}
              trigger="on_saving"
              onSkipChange={setSkipFeeIds}
              onOverrideChange={setFeeOverrides}
              onChargesLoaded={handleChargesLoaded}
            />
          )}

          {/* ── Step 3: PIN ── */}
          {step === 3 && (
            <div className="flex flex-col items-center">
              <Controller
                control={control}
                name="user_pincode"
                rules={{
                  required: "Pincode is required",
                  pattern: { value: /^\d{4}$/, message: "PIN must be exactly 4 digits" },
                }}
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
                )}
              />
              {errors.user_pincode && (
                <p className="text-red-500 text-sm mt-1">{errors.user_pincode.message}</p>
              )}
            </div>
          )}

          </div>
          <DialogFooter className="pt-3">
            <div className="flex justify-end w-full gap-2">
              {step > 1 && (
                <Button type="button" variant="secondary" onClick={goBack}>
                  <ArrowLeft className="mr-2" /> Back
                </Button>
              )}
              {step < 3 && (
                <Button type="button" onClick={goNext}>
                  Next <ArrowRight className="ml-2" />
                </Button>
              )}
              {step === 3 && (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Processing..." : <><span>Save</span> <CheckCircle className="ml-2" /></>}
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DepositTransactionDialog;

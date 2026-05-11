/* eslint-disable react/prop-types */
import { useState } from "react";
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
import {
  ArrowLeft, ArrowRight, CheckCircle, X, Info, LockKeyhole, Receipt,
} from "lucide-react";
import ChargesReviewStep from "@/Pages/Components/ChargesReviewStep";
import { LinkedChannelPicker } from "@/components/linked-channel-picker";

const TOTAL_STEPS = 3;

const DepositTransactionDialog = ({ isOpen, onClose, refetch, accountId, handleOpenReceiptDialog }) => {
  const axiosPrivate = useAxiosPrivate();
  const { id: clientId } = useParams();

  const { register, handleSubmit, control, trigger, watch, reset,
    formState: { errors, isSubmitting } } = useForm();

  const [step, setStep] = useState(1);
  const [skipFeeIds, setSkipFeeIds] = useState([]);
  const [feeOverrides, setFeeOverrides] = useState({});
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [channelError, setChannelError] = useState("");

  const watchedAmount = parseFloat(watch("deposit_transaction_amount")) || 0;

  const validateStep = async () => {
    if (step === 1 && !selectedChannel) {
      setChannelError("Please select a payment channel");
      return;
    }
    setChannelError("");
    const valid = await trigger();
    if (valid) setStep((p) => Math.min(p + 1, TOTAL_STEPS));
  };

  const handleClose = () => {
    reset(); setStep(1); setSkipFeeIds([]); setFeeOverrides({});
    setSelectedChannel(null); setChannelError("");
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
      };
      const response = await axiosPrivate.post("/accounting/savings/deposits", payload);
      toast({ title: "Success", description: response.data.messages });
      if (handleOpenReceiptDialog) handleOpenReceiptDialog(response.data.data, "savings");
      reset(); setStep(1); setSkipFeeIds([]); setFeeOverrides({});
      setSelectedChannel(null); setChannelError("");
      refetch(); onClose();
    } catch (error) {
      toast({
        title: "Uh oh! Something went wrong.",
        variant: "destructive",
        description: error?.response?.data?.messages || "No server response",
      });
    }
  };

  const stepIcons = [
    { icon: <Info className="w-6 h-6 text-blue-500" />,      label: "Deposit Details" },
    { icon: <Receipt className="w-6 h-6 text-orange-500" />, label: "Charges" },
    { icon: <LockKeyhole className="w-6 h-6 text-yellow-500" />, label: "PinCode" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Deposit Transaction</DialogTitle>
          <DialogDescription>Follow the steps to complete transaction.</DialogDescription>
          <DialogClose asChild>
            <button className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:outline-none" onClick={handleClose}>
              <X className="h-4 w-4" />
            </button>
          </DialogClose>
        </DialogHeader>

        <div className="flex items-center space-x-3 my-1">
          {stepIcons.map((s, i) => (
            <div key={i} className={`flex items-center ${step > i + 1 ? "opacity-100" : "opacity-50"} transition-opacity`}>
              {s.icon}
              <span className="ml-2 text-sm font-medium">{s.label}</span>
              {i < stepIcons.length - 1 && <div className="h-[2px] w-6 bg-gray-300 mx-2" />}
            </div>
          ))}
        </div>
        <Progress value={(step / TOTAL_STEPS) * 100} className="my-1" />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="deposit_transaction_amount">Deposit Amount</Label>
                  <Input id="deposit_transaction_amount" type="number" step="0.01" placeholder="Enter amount"
                    {...register("deposit_transaction_amount", { required: "Amount is required" })} />
                  {errors.deposit_transaction_amount && <p className="text-red-500 text-sm">{errors.deposit_transaction_amount.message}</p>}
                </div>
                <div>
                  <Label htmlFor="deposit_transaction_notary">Notary</Label>
                  <Input id="deposit_transaction_notary" defaultValue="Savings" placeholder="Deposit Notary"
                    {...register("deposit_transaction_notary", { required: "Notary is required" })} />
                  {errors.deposit_transaction_notary && <p className="text-red-500 text-sm">{errors.deposit_transaction_notary.message}</p>}
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="deposit_transaction_notes">Notes (Optional)</Label>
                  <Input id="deposit_transaction_notes" placeholder="Optional note" {...register("deposit_transaction_notes")} />
                </div>
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

          {step === 2 && (
            <ChargesReviewStep
              amount={watchedAmount}
              clientAccountId={accountId}
              trigger="on_saving"
              onSkipChange={setSkipFeeIds}
              onOverrideChange={setFeeOverrides}
            />
          )}

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

          <DialogFooter>
            <div className="flex justify-end w-full gap-2">
              {step > 1 && (
                <Button type="button" variant="secondary" onClick={() => setStep((p) => p - 1)}>
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

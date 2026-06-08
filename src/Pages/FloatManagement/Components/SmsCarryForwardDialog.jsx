/* eslint-disable react/prop-types */
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader,
  DialogTitle, DialogClose, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { X, CheckCircle } from "lucide-react";

const SmsCarryForwardDialog = ({
  isOpen,
  onClose,
  refetch,
  saccoId,
  smsAccountId,
  accountName,
  defaultChargePerSms,
  billingType,
}) => {
  const axiosPrivate = useAxiosPrivate();
  const [sendInvoice, setSendInvoice] = useState(false);

  const {
    register, handleSubmit, control, watch, reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      entry_type: billingType === "postpaid" ? "debt" : "credit",
      charge_per_sms: defaultChargePerSms ?? 50,
      carry_date: new Date().toISOString().slice(0, 10),
      notes: "Balance carried forward from previous manual SMS counting",
      period_label: new Date().toLocaleString("default", { month: "long", year: "numeric" }),
    },
  });

  const entryType = watch("entry_type");

  const handleClose = () => {
    reset();
    setSendInvoice(false);
    onClose();
  };

  const onSubmit = async (data) => {
    if (!saccoId) {
      toast({ title: "Error", description: "SACCO ID not available. Reload the page.", variant: "destructive" });
      return;
    }

    try {
      const cfPayload = {
        entry_type: data.entry_type,
        charge_per_sms: parseFloat(data.charge_per_sms),
        carry_date: data.carry_date,
        notes: data.notes || "Balance carried forward from previous manual SMS counting",
        ...(data.entry_type === "credit"
          ? { sms_units: parseInt(data.sms_units, 10) }
          : { debt_amount: parseFloat(data.debt_amount) }),
      };

      await axiosPrivate.post(
        `/admin/floats/${saccoId}/sms-carry-forward/${smsAccountId}`,
        cfPayload,
      );

      if (sendInvoice && data.emails?.trim()) {
        const emailList = data.emails
          .split(/[,\n]+/)
          .map((e) => e.trim())
          .filter(Boolean);

        if (emailList.length > 0) {
          await axiosPrivate.post(
            `/admin/floats/${saccoId}/sms-invoice/${smsAccountId}`,
            {
              emails: emailList,
              note: data.invoice_note || "",
              period_label: data.period_label || "",
            },
          );
          toast({ title: "Success", description: "Carry-forward recorded and invoice sent." });
        }
      } else {
        toast({ title: "Success", description: "Carry-forward entry recorded successfully." });
      }

      refetch();
      handleClose();
    } catch (err) {
      toast({
        title: "Error",
        variant: "destructive",
        description: err?.response?.data?.message || err?.response?.data?.messages || "Request failed",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>SMS Carry-Forward Entry</DialogTitle>
          <DialogDescription>
            {accountName ? `Record a carry-forward balance for ${accountName}.` : "Record a carry-forward balance."}
          </DialogDescription>
          <DialogClose asChild>
            <button
              className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:outline-none"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </button>
          </DialogClose>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
          {/* Entry type */}
          <div>
            <Label className="mb-1.5 block">Entry Type</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <Controller
                  control={control}
                  name="entry_type"
                  render={({ field }) => (
                    <input
                      type="radio"
                      value="credit"
                      checked={field.value === "credit"}
                      onChange={() => field.onChange("credit")}
                      className="accent-primary"
                    />
                  )}
                />
                <span className="text-sm font-medium">Credit (prepaid units)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Controller
                  control={control}
                  name="entry_type"
                  render={({ field }) => (
                    <input
                      type="radio"
                      value="debt"
                      checked={field.value === "debt"}
                      onChange={() => field.onChange("debt")}
                      className="accent-primary"
                    />
                  )}
                />
                <span className="text-sm font-medium">Debt (postpaid outstanding)</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Units or Debt Amount */}
            {entryType === "credit" ? (
              <div>
                <Label htmlFor="sms_units">SMS Units</Label>
                <Input
                  id="sms_units"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="e.g. 500"
                  {...register("sms_units", {
                    required: "SMS units are required",
                    min: { value: 1, message: "Must be at least 1" },
                  })}
                />
                {errors.sms_units && <p className="text-red-500 text-xs mt-1">{errors.sms_units.message}</p>}
              </div>
            ) : (
              <div>
                <Label htmlFor="debt_amount">Debt Amount (UGX)</Label>
                <Input
                  id="debt_amount"
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="e.g. 25000"
                  {...register("debt_amount", {
                    required: "Debt amount is required",
                    min: { value: 1, message: "Must be greater than 0" },
                  })}
                />
                {errors.debt_amount && <p className="text-red-500 text-xs mt-1">{errors.debt_amount.message}</p>}
              </div>
            )}

            {/* Charge per SMS */}
            <div>
              <Label htmlFor="charge_per_sms">Charge / SMS (UGX)</Label>
              <Input
                id="charge_per_sms"
                type="number"
                min="0.01"
                step="0.01"
                {...register("charge_per_sms", {
                  required: "Charge per SMS is required",
                  min: { value: 0.01, message: "Must be > 0" },
                })}
              />
              {errors.charge_per_sms && <p className="text-red-500 text-xs mt-1">{errors.charge_per_sms.message}</p>}
            </div>

            {/* As-of date */}
            <div>
              <Label htmlFor="carry_date">As-of Date</Label>
              <Input
                id="carry_date"
                type="date"
                {...register("carry_date", { required: "Date is required" })}
              />
              {errors.carry_date && <p className="text-red-500 text-xs mt-1">{errors.carry_date.message}</p>}
            </div>

            {/* Notes */}
            <div className="sm:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                placeholder="Balance carried forward from previous manual SMS counting"
                {...register("notes")}
              />
            </div>
          </div>

          {/* Send invoice toggle */}
          <div className="flex items-center gap-2 pt-1">
            <Checkbox
              id="send_invoice"
              checked={sendInvoice}
              onCheckedChange={setSendInvoice}
            />
            <Label htmlFor="send_invoice" className="cursor-pointer font-normal">
              Send invoice via email after recording
            </Label>
          </div>

          {/* Invoice fields */}
          {sendInvoice && (
            <div className="space-y-3 rounded-md border p-3 bg-muted/30">
              <div>
                <Label htmlFor="emails">Recipient Email(s)</Label>
                <Input
                  id="emails"
                  placeholder="email@example.com, another@example.com"
                  {...register("emails", { required: sendInvoice ? "At least one email is required" : false })}
                />
                <p className="text-xs text-muted-foreground mt-1">Separate multiple emails with commas.</p>
                {errors.emails && <p className="text-red-500 text-xs mt-1">{errors.emails.message}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="period_label">Period Label</Label>
                  <Input
                    id="period_label"
                    placeholder="e.g. June 2026"
                    {...register("period_label")}
                  />
                </div>
                <div>
                  <Label htmlFor="invoice_note">Invoice Note (optional)</Label>
                  <Input
                    id="invoice_note"
                    placeholder="Any note to include on invoice"
                    {...register("invoice_note")}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <div className="flex justify-end gap-2 w-full">
              <Button type="button" variant="secondary" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving…" : (
                  <>
                    <span>{sendInvoice ? "Save & Send Invoice" : "Save Entry"}</span>
                    <CheckCircle className="ml-2 h-4 w-4" />
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

export default SmsCarryForwardDialog;

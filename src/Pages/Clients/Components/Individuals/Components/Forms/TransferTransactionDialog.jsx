/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  ArrowRight,
  X,
  LockKeyhole,
  Info,
  User,
} from "lucide-react";
import { ClientCombobox } from "@/Pages/Components/ClientCombobox";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const TransferTransactionDialog = ({ isOpen, onClose, refetch, accountId, clientId }) => {
  const axiosPrivate = useAxiosPrivate();
  const {
    register,
    handleSubmit,
    trigger,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm();

  const [step, setStep] = useState(1);
  const [transferMode, setTransferMode] = useState(null); // "own" | "other"
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientAccounts, setClientAccounts] = useState([]);

  const stepIcons = [
    { icon: <User className="w-6 h-6 text-blue-500" />, label: "Select Destination" },
    { icon: <Info className="w-6 h-6 text-green-500" />, label: "Amount & Account" },
    { icon: <LockKeyhole className="w-6 h-6 text-yellow-500" />, label: "PIN" },
  ];

  // When "own account" mode is selected, auto-load the current client's accounts
  useEffect(() => {
    if (transferMode === "own" && clientId) {
      setSelectedClient(clientId);
    }
  }, [transferMode, clientId]);

  // Fetch accounts when a client is selected
  useEffect(() => {
    if (!selectedClient) return;
    const controller = new AbortController();
    axiosPrivate
      .get(`/accounts/attached/accounts/${selectedClient}`, { signal: controller.signal })
      .then((res) => {
        // Exclude the sending account so a client can't transfer to the same account
        const all = res.data.data.accounts ?? [];
        setClientAccounts(all.filter((a) => a.client_account_id !== accountId));
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          toast({
            title: "Error",
            variant: "destructive",
            description: err?.response?.data?.messages || "Failed to fetch accounts",
          });
        }
      });
    return () => controller.abort();
  }, [selectedClient, accountId, axiosPrivate]);

  const handleModeSelect = (mode) => {
    setTransferMode(mode);
    setSelectedClient(null);
    setClientAccounts([]);
    reset();
    setStep(mode === "own" ? 2 : 2); // both go to step 2, but "own" pre-fills client
  };

  const validateStep = async () => {
    if (step === 1) {
      if (!selectedClient) {
        toast({ title: "Please select a client", variant: "destructive" });
        return;
      }
      setStep(2);
      return;
    }
    const valid = await trigger();
    if (valid) setStep((prev) => prev + 1);
  };

  const prevStep = () => {
    if (step === 2) {
      setStep(1);
      if (transferMode !== "own") {
        setSelectedClient(null);
        setClientAccounts([]);
      }
      setTransferMode(null);
    } else {
      setStep((prev) => Math.max(prev - 1, 1));
    }
  };

  const handleClose = () => {
    reset();
    setStep(1);
    setTransferMode(null);
    setSelectedClient(null);
    setClientAccounts([]);
    onClose();
  };

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        account_sending: accountId,
      };
      const response = await axiosPrivate.post("/accounting/transfers/inbound", payload);
      toast({ title: "Success", description: response.data.messages });
      reset();
      refetch();
      handleClose();
    } catch (error) {
      toast({
        title: "Transfer failed",
        variant: "destructive",
        description: error?.response?.data?.messages || "No server response",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Internal Transfer</DialogTitle>
          <DialogDescription>Follow the steps to complete the transfer.</DialogDescription>
          <DialogClose asChild>
            <button
              className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </button>
          </DialogClose>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex items-center space-x-4 my-1">
          {stepIcons.map((s, i) => (
            <div
              key={i}
              className={`flex items-center transition-opacity ${step >= i + 1 ? "opacity-100" : "opacity-50"}`}
            >
              {s.icon}
              <span className="ml-2 text-sm font-medium">{s.label}</span>
              {i < stepIcons.length - 1 && <div className="h-[2px] w-8 bg-gray-300 mx-2" />}
            </div>
          ))}
        </div>
        <Progress value={(step / 3) * 100} className="my-1" />

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden min-h-0">
          <div className="overflow-y-auto flex-1 min-h-0 space-y-4 pr-1">
          {/* Step 1: Choose destination */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Own account shortcut */}
              {clientId && (
                <button
                  type="button"
                  onClick={() => handleModeSelect("own")}
                  className="w-full flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-left hover:bg-blue-100 transition-colors"
                >
                  <User className="w-5 h-5 text-blue-600 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-blue-800">Transfer to own account</p>
                    <p className="text-xs text-blue-600">Move funds between this client&apos;s accounts</p>
                  </div>
                </button>
              )}

              {/* Search for another client */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  {clientId ? "Or transfer to another member:" : "Select receiving client:"}
                </p>
                <ClientCombobox
                  label="Search client"
                  selectedClient={transferMode === "other" ? selectedClient : null}
                  onClientSelect={(id) => {
                    setTransferMode("other");
                    setSelectedClient(id);
                    setClientAccounts([]);
                  }}
                />
              </div>

              {selectedClient && transferMode === "other" && (
                <Button type="button" className="w-full" onClick={() => setStep(2)}>
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          {/* Step 2: Account + amount */}
          {step === 2 && (
            <>
              {clientAccounts.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  {selectedClient ? "No other accounts found for this client." : "Loading accounts…"}
                </p>
              ) : (
                <div>
                  <Label>Receiving Account</Label>
                  <Controller
                    name="account_receiving"
                    control={control}
                    rules={{ required: "Please select an account" }}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                        <SelectContent>
                          {clientAccounts.map((acc) => (
                            <SelectItem
                              key={acc.client_account_id}
                              value={String(acc.client_account_id)}
                            >
                              {acc.product_title}
                              {acc.client_account_balance !== undefined &&
                                ` — UGX ${Number(acc.client_account_balance).toLocaleString()}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.account_receiving && (
                    <p className="text-red-500 text-sm">{errors.account_receiving.message}</p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="transfer_amount">Transfer Amount</Label>
                  <Input
                    id="transfer_amount"
                    type="number"
                    step="0.01"
                    placeholder="Enter amount"
                    {...register("transfer_amount", { required: "Amount is required" })}
                  />
                  {errors.transfer_amount && (
                    <p className="text-red-500 text-sm">{errors.transfer_amount.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="transfer_reason">Transfer Reason</Label>
                  <Input
                    id="transfer_reason"
                    placeholder="Reason for transfer"
                    {...register("transfer_reason", { required: "Transfer reason is required" })}
                  />
                  {errors.transfer_reason && (
                    <p className="text-red-500 text-sm">{errors.transfer_reason.message}</p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Step 3: PIN */}
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
          {/* Footer */}
          <DialogFooter className="pt-3">
            <div className="flex justify-end w-full gap-2">
              {step > 1 && (
                <Button type="button" variant="secondary" onClick={prevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
              )}
              {step === 2 && (
                <Button type="button" onClick={validateStep}>
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
              {step === 3 && (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Processing…" : "Confirm Transfer"}
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TransferTransactionDialog;

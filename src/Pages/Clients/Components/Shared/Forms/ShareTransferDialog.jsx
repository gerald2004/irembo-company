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
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { useParams } from "react-router-dom";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { ArrowLeft, ArrowRight, CheckCircle, X, ArrowRightLeft, LockKeyhole, Search } from "lucide-react";

const ShareTransferDialog = ({ isOpen, onClose, refetch }) => {
  const axiosPrivate = useAxiosPrivate();
  const { id: fromClientId } = useParams();

  const { register, handleSubmit, control, trigger, reset, formState: { errors, isSubmitting } } = useForm();

  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  const searchMembers = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await axiosPrivate.get("/clients/individual", {
        params: { search: searchQuery, limit: 10 },
      });
      const clients = res.data?.data?.clients ?? res.data?.data ?? [];
      setSearchResults(Array.isArray(clients) ? clients.filter((c) => String(c.client_id) !== String(fromClientId)) : []);
    } catch {
      toast({ title: "Search failed", description: "Could not search members", variant: "destructive" });
    } finally {
      setIsSearching(false);
    }
  };

  const validateStep = async () => {
    if (step === 1 && !selectedMember) {
      toast({ title: "Select a member", description: "Choose a destination member first", variant: "destructive" });
      return;
    }
    const valid = await trigger();
    if (valid && step < 3) setStep((p) => p + 1);
  };

  const prevStep = () => setStep((p) => Math.max(p - 1, 1));

  const onSubmit = async (data) => {
    try {
      const res = await axiosPrivate.post("/accounting/shares/transfer", {
        from_client_id:  fromClientId,
        to_client_id:    selectedMember.client_id,
        number_of_shares: parseInt(data.number_of_shares, 10),
        narrative:       data.narrative || "Share Transfer",
        user_pincode:    data.user_pincode,
      });
      toast({ title: "Transfer Complete", description: res.data.messages });
      reset();
      setStep(1);
      setSelectedMember(null);
      setSearchResults([]);
      setSearchQuery("");
      refetch();
      onClose();
    } catch (err) {
      toast({
        title: "Transfer Failed",
        description: err?.response?.data?.messages ?? "An error occurred",
        variant: "destructive",
      });
    }
  };

  const stepIcons = [
    { icon: <Search className="w-5 h-5 text-blue-500" />,        label: "Find Member" },
    { icon: <ArrowRightLeft className="w-5 h-5 text-orange-500" />, label: "Transfer Details" },
    { icon: <LockKeyhole className="w-5 h-5 text-yellow-500" />, label: "PIN" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Transfer Shares</DialogTitle>
          <DialogDescription>Transfer shares to another member of this SACCO.</DialogDescription>
          <DialogClose asChild>
            <button onClick={onClose} className="absolute right-4 top-4 opacity-70 hover:opacity-100">
              <X className="h-4 w-4" />
            </button>
          </DialogClose>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex items-center space-x-3 my-1">
          {stepIcons.map((s, i) => (
            <div key={i} className={`flex items-center ${step > i + 1 ? "opacity-100" : "opacity-50"} transition-opacity`}>
              {s.icon}
              <span className="ml-1 text-xs font-medium">{s.label}</span>
              {i < stepIcons.length - 1 && <div className="h-px w-6 bg-gray-300 mx-2" />}
            </div>
          ))}
        </div>
        <Progress value={(step / 3) * 100} className="my-1" />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Step 1 — Find destination member */}
          {step === 1 && (
            <div className="space-y-3">
              <Label>Search Destination Member</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Name or account number…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), searchMembers())}
                />
                <Button type="button" variant="outline" onClick={searchMembers} disabled={isSearching}>
                  {isSearching ? "…" : <Search className="h-4 w-4" />}
                </Button>
              </div>

              {searchResults.length > 0 && (
                <div className="border rounded-md divide-y max-h-48 overflow-y-auto">
                  {searchResults.map((c) => {
                    const name = c.client_group_name || `${c.client_firstname ?? ""} ${c.client_lastname ?? ""}`.trim();
                    const isSelected = selectedMember?.client_id === c.client_id;
                    return (
                      <button
                        key={c.client_id}
                        type="button"
                        onClick={() => setSelectedMember(c)}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-muted/50 flex items-center justify-between ${isSelected ? "bg-primary/10" : ""}`}
                      >
                        <span className="font-medium">{name}</span>
                        <span className="text-xs text-muted-foreground font-mono">{c.client_account_number}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {selectedMember && (
                <div className="flex items-center justify-between p-2 rounded-md border bg-emerald-50 dark:bg-emerald-950/30">
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                    {selectedMember.client_group_name ||
                      `${selectedMember.client_firstname ?? ""} ${selectedMember.client_lastname ?? ""}`.trim()}
                  </span>
                  <Badge variant="outline" className="font-mono text-xs">{selectedMember.client_account_number}</Badge>
                </div>
              )}
            </div>
          )}

          {/* Step 2 — Transfer details */}
          {step === 2 && (
            <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Number of Shares</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="e.g. 10"
                  {...register("number_of_shares", {
                    required: "Number of shares is required",
                    min: { value: 1, message: "Minimum 1 share" },
                  })}
                />
                {errors.number_of_shares && <p className="text-red-500 text-xs mt-1">{errors.number_of_shares.message}</p>}
              </div>
              <div>
                <Label>Narrative</Label>
                <Input
                  defaultValue="Share Transfer"
                  placeholder="Reason / reference"
                  {...register("narrative")}
                />
              </div>
              {selectedMember && (
                <div className="col-span-2 text-sm text-muted-foreground">
                  Transferring to:{" "}
                  <span className="font-semibold text-foreground">
                    {selectedMember.client_group_name ||
                      `${selectedMember.client_firstname ?? ""} ${selectedMember.client_lastname ?? ""}`.trim()}
                  </span>
                </div>
              )}
            </fieldset>
          )}

          {/* Step 3 — PIN */}
          {step === 3 && (
            <div className="flex flex-col items-center gap-2">
              <Controller
                control={control}
                name="user_pincode"
                rules={{
                  required: "PIN is required",
                  pattern: { value: /^\d{4}$/, message: "PIN must be 4 digits" },
                }}
                render={({ field }) => (
                  <>
                    <Label>Enter Your Transaction PIN</Label>
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
              {errors.user_pincode && <p className="text-red-500 text-xs">{errors.user_pincode.message}</p>}
            </div>
          )}

          <DialogFooter>
            <div className="flex justify-end w-full gap-2">
              {step > 1 && (
                <Button type="button" variant="secondary" onClick={prevStep}>
                  <ArrowLeft className="mr-1 h-4 w-4" /> Back
                </Button>
              )}
              {step < 3 ? (
                <Button type="button" onClick={validateStep}>
                  Next <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Processing…" : <><CheckCircle className="mr-1 h-4 w-4" /> Transfer</>}
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ShareTransferDialog;

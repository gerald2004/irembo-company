import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { useParams } from "react-router-dom";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Wallet,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  ArrowDownToLine,
  ArrowUpFromLine,
  Info,
  LockKeyhole,
  Receipt,
  X,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import ChargesReviewStep from "@/Pages/Components/ChargesReviewStep";

const fmt = (v) =>
  Number(v ?? 0).toLocaleString("en-UG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const TOTAL_STEPS = 3;

// ── Inline transaction dialog (deposit or withdraw) ───────────────────────────
const MemberTransactionDialog = ({
  isOpen,
  onClose,
  type, // 'deposit' | 'withdraw'
  memberId,
  groupId,
  accountId,
  memberName,
}) => {
  const axiosPrivate = useAxiosPrivate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [skipFeeIds, setSkipFeeIds] = useState([]);
  const [feeOverrides, setFeeOverrides] = useState({});

  const isDeposit = type === "deposit";

  const {
    register,
    handleSubmit,
    control,
    trigger,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const amountField = isDeposit ? "deposit_transaction_amount" : "withdraw_transaction_amount";
  const methodField = isDeposit ? "deposit_transaction_method" : "withdraw_transaction_method";
  const notaryField = isDeposit ? "deposit_transaction_notary" : "withdraw_transaction_notary";
  const notesField  = isDeposit ? "deposit_transaction_notes"  : "withdraw_transaction_notes";

  const watchedAmount = parseFloat(watch(amountField)) || 0;

  const handleClose = () => {
    reset();
    setStep(1);
    setSkipFeeIds([]);
    setFeeOverrides({});
    onClose();
  };

  const validateStep = async () => {
    const valid = await trigger();
    if (valid) setStep((p) => Math.min(p + 1, TOTAL_STEPS));
  };

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        client_id: memberId,
        client_account_id: accountId,
        member_id: memberId,
        group_id: groupId,
        skip_fee_ids: skipFeeIds,
        fee_overrides: feeOverrides,
      };

      const url = isDeposit
        ? "/accounting/savings/deposits"
        : "/accounting/withdraw/withdraws";

      const res = await axiosPrivate.post(url, payload);

      toast({ title: "Success", description: res.data.messages });
      queryClient.invalidateQueries({ queryKey: ["group-member-savings"] });
      reset();
      setStep(1);
      setSkipFeeIds([]);
      setFeeOverrides({});
      onClose();
    } catch (err) {
      toast({
        title: "Uh oh! Something went wrong.",
        variant: "destructive",
        description: err?.response?.data?.messages || "No server response",
      });
    }
  };

  const stepIcons = [
    { icon: <Info className="w-5 h-5 text-blue-500" />,    label: isDeposit ? "Deposit Details" : "Withdraw Details" },
    { icon: <Receipt className="w-5 h-5 text-orange-500" />, label: "Charges" },
    { icon: <LockKeyhole className="w-5 h-5 text-yellow-500" />, label: "PinCode" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>
            {isDeposit ? "Member Deposit" : "Member Withdrawal"} — {memberName}
          </DialogTitle>
          <DialogDescription>
            {isDeposit ? "Credit" : "Debit"} this member&apos;s sub-account.
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

        <div className="flex items-center space-x-3 my-1">
          {stepIcons.map((s, i) => (
            <div
              key={i}
              className={`flex items-center ${step > i + 1 ? "opacity-100" : "opacity-50"} transition-opacity`}
            >
              {s.icon}
              <span className="ml-2 text-sm font-medium">{s.label}</span>
              {i < stepIcons.length - 1 && <div className="h-[2px] w-6 bg-gray-300 mx-2" />}
            </div>
          ))}
        </div>
        <Progress value={(step / TOTAL_STEPS) * 100} className="my-1" />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {step === 1 && (
            <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={amountField}>
                  {isDeposit ? "Deposit" : "Withdraw"} Amount
                </Label>
                <Input
                  id={amountField}
                  type="number"
                  step="0.01"
                  placeholder="Enter amount"
                  {...register(amountField, { required: "Amount is required" })}
                />
                {errors[amountField] && (
                  <p className="text-red-500 text-sm">{errors[amountField].message}</p>
                )}
              </div>

              <div>
                <Label>{isDeposit ? "Deposit" : "Withdraw"} Method</Label>
                <Controller
                  name={methodField}
                  control={control}
                  rules={{ required: "Method is required" }}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="mobile_money">Mobile Money</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors[methodField] && (
                  <p className="text-red-500 text-sm">{errors[methodField].message}</p>
                )}
              </div>

              <div>
                <Label htmlFor={notaryField}>Notary</Label>
                <Input
                  id={notaryField}
                  defaultValue={isDeposit ? "Savings" : "Withdrawal"}
                  placeholder="Notary"
                  {...register(notaryField, { required: "Notary is required" })}
                />
                {errors[notaryField] && (
                  <p className="text-red-500 text-sm">{errors[notaryField].message}</p>
                )}
              </div>

              <div>
                <Label htmlFor={notesField}>Notes (Optional)</Label>
                <Input id={notesField} placeholder="Optional note" {...register(notesField)} />
              </div>
            </fieldset>
          )}

          {step === 2 && (
            <ChargesReviewStep
              amount={watchedAmount}
              clientAccountId={accountId}
              trigger={isDeposit ? "on_saving" : "on_withdrawal"}
              onSkipChange={setSkipFeeIds}
              onOverrideChange={setFeeOverrides}
            />
          )}

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

// ── Product section (collapsible) ─────────────────────────────────────────────
const ProductSection = ({ entry, onTransaction, groupId }) => {
  const [open, setOpen] = useState(true);
  const { product, total_balance, members } = entry;

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          {open ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
          <Wallet className="w-4 h-4 text-blue-500" />
          <span className="font-semibold text-sm">
            {product?.product_title ?? `Product #${entry.product_id}`}
          </span>
          <Badge variant="secondary" className="text-xs">
            {members.length} member{members.length !== 1 ? "s" : ""}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <TrendingUp className="w-3.5 h-3.5" />
          <span className="font-medium text-foreground">UGX {fmt(total_balance)}</span>
        </div>
      </button>

      {open && (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-white dark:bg-slate-900">
                <TableHead>Member</TableHead>
                <TableHead>Account No.</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Actual Balance</TableHead>
                <TableHead className="text-right">Frozen Balance</TableHead>
                <TableHead className="text-right">Available Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => {
                const name = `${m.member?.client_firstname ?? ""} ${m.member?.client_lastname ?? ""}`.trim();
                return (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium text-sm">{name || "—"}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {m.member?.client_account_number ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {m.member?.client_contact ?? "—"}
                    </TableCell>
                    <TableCell className="text-right font-medium text-sm">
                      UGX {fmt(m.actual_balance)}
                    </TableCell>
                    <TableCell className="text-right text-sm text-orange-700 font-medium">
                      UGX {fmt(m.frozen_balance)}
                    </TableCell>
                    <TableCell className="text-right text-sm text-green-700 font-medium">
                      UGX {fmt(m.available_balance)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={m.account_status === "active" ? "default" : "secondary"}
                        className="capitalize text-xs"
                      >
                        {m.account_status ?? m.status ?? "active"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs text-green-700 border-green-200 hover:bg-green-50"
                          onClick={() =>
                            onTransaction({
                              type: "deposit",
                              memberId: m.member_id,
                              accountId: m.client_account_id,
                              memberName: name,
                              groupId,
                            })
                          }
                        >
                          <ArrowDownToLine className="w-3 h-3 mr-1" />
                          Deposit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs text-orange-700 border-orange-200 hover:bg-orange-50"
                          onClick={() =>
                            onTransaction({
                              type: "withdraw",
                              memberId: m.member_id,
                              accountId: m.client_account_id,
                              memberName: name,
                              groupId,
                            })
                          }
                        >
                          <ArrowUpFromLine className="w-3 h-3 mr-1" />
                          Withdraw
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const GroupMemberSavings = () => {
  const axiosPrivate = useAxiosPrivate();
  const { id: groupId } = useParams();

  const [txn, setTxn] = useState(null); // { type, memberId, accountId, memberName }

  const { data, isLoading, isError } = useQuery({
    queryKey: ["group-member-savings", groupId],
    queryFn: async () => {
      const res = await axiosPrivate.get(`/clients/groups/${groupId}/member-savings`);
      return res.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="font-medium">Failed to load member savings data.</p>
      </div>
    );
  }

  const byProduct = data?.by_product ?? [];
  const totalAll = byProduct.reduce((s, p) => s + (p.total_balance ?? 0), 0);

  return (
    <div className="space-y-4 p-1">
      {/* Summary strip */}
      <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-800/50 rounded-lg px-4 py-3">
        <div>
          <p className="text-xs text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wide">
            Total Group Savings
          </p>
          <p className="text-xl font-bold text-blue-900 dark:text-blue-100 mt-0.5">UGX {fmt(totalAll)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Products</p>
          <p className="text-lg font-semibold">{byProduct.length}</p>
        </div>
      </div>

      {byProduct.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Wallet className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No member sub-accounts yet.</p>
          <p className="text-xs mt-1">
            Attach a savings account to this group to auto-provision member accounts.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {byProduct.map((entry) => (
            <ProductSection
              key={entry.product_id}
              entry={entry}
              onTransaction={setTxn}
              groupId={groupId}
            />
          ))}
        </div>
      )}

      {/* Transaction dialog */}
      {txn && (
        <MemberTransactionDialog
          isOpen={true}
          onClose={() => setTxn(null)}
          type={txn.type}
          memberId={txn.memberId}
          groupId={txn.groupId}
          accountId={txn.accountId}
          memberName={txn.memberName}
        />
      )}
    </div>
  );
};

export default GroupMemberSavings;

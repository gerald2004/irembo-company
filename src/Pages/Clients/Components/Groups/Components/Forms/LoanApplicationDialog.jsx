/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import ChargesReviewStep from "@/Pages/Components/ChargesReviewStep";
import { useQuery } from "@tanstack/react-query";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { useNavigate, useParams } from "react-router-dom";
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
  CheckCircle,
  X,
  Info,
  LockKeyhole,
  Users,
  Receipt,
} from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const TOTAL_STEPS = 4;

const intervalLabel = {
  daily: "days",
  weekly: "weeks",
  monthly: "months",
  yearly: "years",
};

const LoanApplicationDialog = ({ isOpen, onClose, refetch }) => {
  const axiosPrivate = useAxiosPrivate();
  const { id: clientId, client_id: accountId } = useParams();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [allocations, setAllocations] = useState({});
  const [loanAmount, setLoanAmount] = useState(0);
  const [skipChargeIds, setSkipChargeIds] = useState([]);
  const [chargeOverrides, setChargeOverrides] = useState({});

  const { data: loanProducts = [], isLoading: productsLoading } = useQuery({
    queryKey: ["loan-products"],
    queryFn: async () => {
      const res = await axiosPrivate.get("/settings/loans/products").catch((e) => {
        if (e?.response?.status === 401) navigate("/", { replace: true });
        throw e;
      });
      return res?.data?.data?.loan_products ?? [];
    },
    keepPreviousData: true,
  });

  const { data: groupMembers = [], isLoading: membersLoading } = useQuery({
    queryKey: ["group-attaches", clientId],
    queryFn: async () => {
      const res = await axiosPrivate.get(`/clients/groups/${clientId}/attaches`);
      return res?.data?.data?.members ?? [];
    },
    enabled: !!clientId,
  });

  const {
    register,
    handleSubmit,
    control,
    trigger,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const watchedAmount = watch("loan_application_amount");
  const watchedProductId = watch("loan_product_id");

  const selectedProduct = loanProducts.find(
    (p) => String(p.id) === String(watchedProductId)
  );
  const tenureUnit = intervalLabel[selectedProduct?.product_interval] ?? "periods";

  useEffect(() => {
    setLoanAmount(parseFloat(watchedAmount) || 0);
  }, [watchedAmount]);

  const totalAllocated = Object.values(allocations).reduce(
    (sum, v) => sum + (parseFloat(v) || 0),
    0
  );
  const remaining = loanAmount - totalAllocated;

  const validateStep = async () => {
    if (step === 1) {
      const valid = await trigger(["loan_application_amount", "loan_application_tenure_period", "loan_product_id"]);
      if (valid) setStep(2);
      return;
    }
    if (step === 2) {
      if (totalAllocated > loanAmount) {
        toast({
          title: "Allocation exceeds loan amount",
          variant: "destructive",
          description: `Total allocated (${totalAllocated.toLocaleString()}) exceeds loan amount (${loanAmount.toLocaleString()})`,
        });
        return;
      }
      setStep(3);
      return;
    }
    if (step === 3) { setStep(4); return; }
  };

  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleClose = () => {
    reset();
    setAllocations({});
    setSkipChargeIds([]);
    setChargeOverrides({});
    setStep(1);
    onClose();
  };

  const onSubmit = async (data) => {
    try {
      const memberAllocations = Object.entries(allocations)
        .filter(([, v]) => parseFloat(v) > 0)
        .map(([member_id, allocated_amount]) => ({
          member_id: parseInt(member_id),
          allocated_amount: parseFloat(allocated_amount),
        }));

      const payload = {
        ...data,
        client_id: clientId,
        client_account_id: accountId,
        skip_charge_ids: skipChargeIds,
        charge_overrides: chargeOverrides,
        ...(memberAllocations.length > 0 ? { member_allocations: memberAllocations } : {}),
      };

      const res = await axiosPrivate.post("/loans/applications", payload);
      toast({ title: "Success", description: res.data.messages });
      reset();
      setAllocations({});
      setSkipChargeIds([]);
      setChargeOverrides({});
      setStep(1);
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
    { icon: <Info className="w-6 h-6 text-blue-500" />, label: "Loan Details" },
    { icon: <Users className="w-6 h-6 text-green-500" />, label: "Allocations" },
    { icon: <Receipt className="w-6 h-6 text-purple-500" />, label: "Charges" },
    { icon: <LockKeyhole className="w-6 h-6 text-yellow-500" />, label: "PinCode" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle>Group Loan Application</DialogTitle>
          <DialogDescription>
            Allocate the loan amount to group members before submitting.
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

        <div className="flex items-center space-x-2 my-1">
          {stepIcons.map((s, i) => (
            <div key={i} className={`flex items-center ${step > i + 1 ? "opacity-100" : "opacity-50"} transition-opacity`}>
              {s.icon}
              <span className="ml-1 text-sm font-medium">{s.label}</span>
              {i < stepIcons.length - 1 && <div className="h-[2px] w-6 bg-gray-300 mx-2" />}
            </div>
          ))}
        </div>
        <Progress value={(step / TOTAL_STEPS) * 100} className="my-1" />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Step 1: Loan Details */}
          {step === 1 && (
            <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Product selector first — drives tenure label */}
              <div className="md:col-span-2">
                <Label htmlFor="loan_product_id">Loan Product</Label>
                <Controller
                  name="loan_product_id"
                  control={control}
                  rules={{ required: "Loan product is required" }}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a product">
                          {loanProducts?.find((p) => String(p.id) === String(field.value))?.title || "Select Product"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {productsLoading ? (
                          <SelectItem value="loading" disabled>Loading...</SelectItem>
                        ) : (
                          loanProducts.map((p) => (
                            <SelectItem key={p.id} value={String(p.id)}>
                              {p.title} ({p.interest_rate}%)
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.loan_product_id && (
                  <p className="text-red-500 text-sm">{errors.loan_product_id.message}</p>
                )}
              </div>

              {/* Product info strip */}
              {selectedProduct && (
                <div className="md:col-span-2 flex flex-wrap gap-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-800/50 rounded-md px-3 py-2">
                  <Badge variant="outline" className="text-xs capitalize">
                    {selectedProduct.type?.replace("_", " ")}
                  </Badge>
                  <Badge variant="outline" className="text-xs capitalize">
                    {selectedProduct.product_interval} repayments
                  </Badge>
                  <Badge variant="outline" className="text-xs text-blue-700">
                    {selectedProduct.interest_rate}% interest
                  </Badge>
                  <span className="text-xs text-muted-foreground self-center ml-auto">
                    Enter tenure in <strong>{tenureUnit}</strong>
                  </span>
                </div>
              )}

              <div>
                <Label htmlFor="loan_application_amount">Loan Amount</Label>
                <Input
                  id="loan_application_amount"
                  type="number"
                  step="0.01"
                  placeholder="Enter amount"
                  {...register("loan_application_amount", { required: "Amount is required" })}
                />
                {errors.loan_application_amount && (
                  <p className="text-red-500 text-sm">{errors.loan_application_amount.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="loan_application_tenure_period">
                  Tenure Period ({tenureUnit})
                </Label>
                <Input
                  id="loan_application_tenure_period"
                  type="number"
                  min="1"
                  placeholder={`Enter number of ${tenureUnit}`}
                  {...register("loan_application_tenure_period", {
                    required: "Tenure period is required",
                    min: { value: 1, message: "Must be at least 1" },
                  })}
                />
                {errors.loan_application_tenure_period && (
                  <p className="text-red-500 text-sm">{errors.loan_application_tenure_period.message}</p>
                )}
              </div>
            </fieldset>
          )}

          {/* Step 2: Member Allocations */}
          {step === 2 && (
            <div className="space-y-3">
              <div className="flex justify-between text-sm text-muted-foreground bg-muted px-3 py-2 rounded-md">
                <span>Loan Total: <strong>{loanAmount.toLocaleString()}</strong></span>
                <span>Allocated: <strong className={totalAllocated > loanAmount ? "text-red-500" : "text-green-600"}>{totalAllocated.toLocaleString()}</strong></span>
                <span>Remaining: <strong className={remaining < 0 ? "text-red-500" : ""}>{remaining.toLocaleString()}</strong></span>
              </div>

              {membersLoading ? (
                <p className="text-sm text-muted-foreground">Loading members...</p>
              ) : groupMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No members found. You can skip allocations.</p>
              ) : (
                <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                  {groupMembers.map((m) => {
                    const mid = m.client_id;
                    const name = m.member
                      ? `${m.member.client_firstname ?? ""} ${m.member.client_lastname ?? ""}`.trim()
                      : `Member #${mid}`;
                    return (
                      <div key={mid} className="flex items-center gap-3">
                        <span className="text-sm flex-1 truncate">{name}</span>
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          className="w-40"
                          value={allocations[mid] ?? ""}
                          onChange={(e) =>
                            setAllocations((prev) => ({ ...prev, [mid]: e.target.value }))
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              )}
              {totalAllocated > loanAmount && (
                <p className="text-red-500 text-sm">
                  Total allocated exceeds loan amount by {(totalAllocated - loanAmount).toLocaleString()}.
                </p>
              )}
            </div>
          )}

          {/* Step 3: Charges */}
          {step === 3 && (
            <ChargesReviewStep
              amount={parseFloat(watchedAmount) || 0}
              loanProductId={watchedProductId}
              trigger="on_application"
              onSkipChange={setSkipChargeIds}
              onOverrideChange={setChargeOverrides}
            />
          )}

          {/* Step 4: PIN */}
          {step === 4 && (
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
            <Button type="button" onClick={prevStep} variant="secondary" disabled={step === 1}>
              <ArrowLeft className="mr-2" /> Back
            </Button>
            {step < TOTAL_STEPS && (
              <Button type="button" onClick={validateStep} disabled={totalAllocated > loanAmount && step === 2}>
                Next <ArrowRight className="ml-2" />
              </Button>
            )}
            {step === TOTAL_STEPS && (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Processing..." : "Save"} <CheckCircle className="ml-2" />
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LoanApplicationDialog;

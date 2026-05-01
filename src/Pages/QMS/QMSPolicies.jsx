import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Save, AlertCircle } from "lucide-react";

const MODULE_LABELS = {
  deposit:               "Deposit",
  withdrawal:            "Withdrawal",
  loan_disbursement:     "Loan Disbursement",
  loan_repayment:        "Loan Repayment",
  cash_transfer:         "Cash Transfer",
  inter_branch_transfer: "Inter-Branch Transfer",
  journal_entry:         "Manual Journal Entry",
  income:                "External Income",
  expense:               "Expense",
  shares:                "Shares",
  fixed_deposit:         "Fixed Deposit",
  asset:                 "Asset Registration",
  vendor_payment:        "Vendor Payment",
  compulsory_saving:     "Compulsory Saving",
};

const PolicyRow = ({ policy, onSave, savingId }) => {
  const [form, setForm] = useState({
    requires_approval: !!policy.requires_approval,
    is_active:         !!policy.is_active,
    min_amount:        String(policy.min_amount ?? "0"),
    max_amount:        policy.max_amount != null ? String(policy.max_amount) : "",
    auto_approve_self: !!policy.auto_approve_self,
  });
  const [dirty, setDirty] = useState(false);

  const set = (k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    setDirty(true);
  };

  const handleSave = () => {
    onSave(policy.id, {
      requires_approval: form.requires_approval,
      is_active:         form.is_active,
      auto_approve_self: form.auto_approve_self,
      min_amount:        parseFloat(form.min_amount) || 0,
      max_amount:        form.max_amount !== "" ? parseFloat(form.max_amount) : null,
    });
    setDirty(false);
  };

  const isSaving = savingId === policy.id;

  return (
    <Card className={!form.is_active ? "opacity-60" : ""}>
      <CardContent className="p-3">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="min-w-[180px] flex-1">
            <p className="text-sm font-medium">
              {MODULE_LABELS[policy.source_module] ?? policy.source_module}
            </p>
            <p className="text-xs text-muted-foreground font-mono">{policy.source_module}</p>
          </div>

          <div className="flex items-center gap-1.5">
            <Switch
              checked={form.requires_approval}
              onCheckedChange={(v) => set("requires_approval", v)}
            />
            <span className="text-xs whitespace-nowrap">Requires Approval</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Switch
              checked={form.auto_approve_self}
              onCheckedChange={(v) => set("auto_approve_self", v)}
            />
            <span className="text-xs whitespace-nowrap">Self-Approve</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Min</span>
            <Input
              type="number" min={0} step="any"
              value={form.min_amount}
              onChange={(e) => set("min_amount", e.target.value)}
              className="h-7 w-28 text-xs"
              placeholder="0"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">Max</span>
            <Input
              type="number" min={0} step="any"
              value={form.max_amount}
              onChange={(e) => set("max_amount", e.target.value)}
              className="h-7 w-28 text-xs"
              placeholder="Unlimited"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Switch
              checked={form.is_active}
              onCheckedChange={(v) => set("is_active", v)}
            />
            {form.is_active
              ? <Badge variant="default"    className="text-xs">Active</Badge>
              : <Badge variant="secondary"  className="text-xs">Inactive</Badge>
            }
          </div>

          <Button
            size="sm"
            variant={dirty ? "default" : "ghost"}
            className="h-7 text-xs"
            onClick={handleSave}
            disabled={!dirty || isSaving}
          >
            <Save className="h-3.5 w-3.5 mr-1" />
            {isSaving ? "Saving…" : "Save"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const QMSPolicies = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate     = useNavigate();
  const queryClient  = useQueryClient();
  const [savingId,   setSavingId]  = useState(null);

  const { data: policies = [], isLoading, isError } = useQuery({
    queryKey: ["qms-policies"],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get("/qms/policies");
        return Array.isArray(res?.data?.data) ? res.data.data : [];
      } catch (e) {
        if (e?.response?.status === 401) navigate("/", { replace: true });
        throw e;
      }
    },
    retry: 1,
  });

  const updateMut = useMutation({
    mutationFn: ({ id, payload }) => axiosPrivate.put(`/qms/policies/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qms-policies"] });
      setSavingId(null);
      toast({ title: "Policy updated", variant: "success" });
    },
    onError: () => {
      setSavingId(null);
      toast({ title: "Failed to update policy", variant: "destructive" });
    },
  });

  const handleSave = (id, payload) => {
    setSavingId(id);
    updateMut.mutate({ id, payload });
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center gap-2 text-destructive text-sm py-6">
        <AlertCircle className="h-4 w-4" /> Failed to load QMS policies.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <h3 className="font-semibold text-base">Checker-Maker Policies</h3>
        <p className="text-xs text-muted-foreground">
          Configure which modules require second-eye approval before journal entries post.
          Inactive policies auto-complete all entries for that module.
        </p>
      </div>

      <div className="space-y-2">
        {policies.length === 0 ? (
          <Card><CardContent className="text-center py-10 text-muted-foreground text-sm">No policies configured.</CardContent></Card>
        ) : (
          policies.map((p) => (
            <PolicyRow
              key={p.id}
              policy={p}
              onSave={handleSave}
              savingId={savingId}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default QMSPolicies;

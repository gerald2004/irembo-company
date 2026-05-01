import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, AlertCircle } from "lucide-react";

const TXN_TYPES  = ["all", "deposit", "withdrawal", "loan", "transfer", "shares"];
const SEVERITIES = ["low", "medium", "high", "critical"];
const ACTIONS    = ["alert", "block", "flag"];

const severityColor = {
  low:      "bg-blue-50 text-blue-700",
  medium:   "bg-amber-50 text-amber-700",
  high:     "bg-orange-50 text-orange-700",
  critical: "bg-red-50 text-red-700",
};

const emptyForm = () => ({
  code: "", name: "", description: "",
  txn_type: "all", severity: "medium", action: "alert",
  score_points: 10, is_active: true,
});

const PolicyForm = ({ initial, onClose, onSave, isSaving }) => {
  const [form, setForm] = useState(() =>
    initial
      ? { code: initial.code ?? "", name: initial.name ?? "", description: initial.description ?? "",
          txn_type: initial.txn_type ?? "all", severity: initial.severity ?? "medium",
          action: initial.action ?? "alert", score_points: initial.score_points ?? 10,
          is_active: !!initial.is_active }
      : emptyForm()
  );

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.code.trim() || !form.name.trim()) {
      toast({ title: "Code and Name are required", variant: "destructive" });
      return;
    }
    onSave(form);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Policy" : "New AML Policy"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 pt-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Code *</label>
              <Input value={form.code} disabled={!!initial} onChange={(e) => set("code", e.target.value)} placeholder="e.g. LARGE_TXN" className="h-8 text-xs" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Name *</label>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Policy name" className="h-8 text-xs" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium">Description</label>
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} className="text-xs resize-none" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Transaction Type</label>
              <Select value={form.txn_type} onValueChange={(v) => set("txn_type", v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{TXN_TYPES.map((t) => <SelectItem key={t} value={t} className="text-xs capitalize">{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Severity</label>
              <Select value={form.severity} onValueChange={(v) => set("severity", v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{SEVERITIES.map((s) => <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Action</label>
              <Select value={form.action} onValueChange={(v) => set("action", v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{ACTIONS.map((a) => <SelectItem key={a} value={a} className="text-xs capitalize">{a}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Score Points</label>
              <Input type="number" value={form.score_points} min={1} max={100} onChange={(e) => set("score_points", Number(e.target.value))} className="h-8 text-xs" />
            </div>
            <div className="flex items-center gap-2 pt-5">
              <Switch id="is_active_form" checked={form.is_active} onCheckedChange={(v) => set("is_active", v)} />
              <label htmlFor="is_active_form" className="text-xs">Active</label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" size="sm" disabled={isSaving}>{isSaving ? "Saving…" : "Save Policy"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const AMLPolicies = () => {
  const axiosPrivate  = useAxiosPrivate();
  const navigate      = useNavigate();
  const queryClient   = useQueryClient();

  const [showNew,     setShowNew]     = useState(false);
  const [editTarget,  setEditTarget]  = useState(null);

  const { data: policies = [], isLoading, isError } = useQuery({
    queryKey: ["aml-policies"],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get("/aml/policies");
        return Array.isArray(res?.data?.data) ? res.data.data : [];
      } catch (e) {
        if (e?.response?.status === 401) navigate("/", { replace: true });
        throw e;
      }
    },
    retry: 1,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["aml-policies"] });

  const createMut = useMutation({
    mutationFn: (payload) => axiosPrivate.post("/aml/policies", payload),
    onSuccess: () => { invalidate(); setShowNew(false); toast({ title: "Policy created", variant: "success" }); },
    onError:   (e) => toast({ title: e?.response?.data?.messages?.[0] ?? "Failed to create policy", variant: "destructive" }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, payload }) => axiosPrivate.put(`/aml/policies/${id}`, payload),
    onSuccess: () => { invalidate(); setEditTarget(null); toast({ title: "Policy updated", variant: "success" }); },
    onError:   () => toast({ title: "Failed to update policy", variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => axiosPrivate.delete(`/aml/policies/${id}`),
    onSuccess: () => { invalidate(); toast({ title: "Policy deleted", variant: "success" }); },
    onError:   () => toast({ title: "Failed to delete policy", variant: "destructive" }),
  });

  const toggleActive = (p) =>
    updateMut.mutate({ id: p.id, payload: { is_active: !p.is_active } });

  if (isLoading) {
    return <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>;
  }

  if (isError) {
    return (
      <div className="flex items-center gap-2 text-destructive text-sm py-6">
        <AlertCircle className="h-4 w-4" /> Failed to load AML policies.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-base">AML Policies</h3>
          <p className="text-xs text-muted-foreground">{policies.length} polic{policies.length === 1 ? "y" : "ies"} configured</p>
        </div>
        <Button size="sm" onClick={() => setShowNew(true)}>
          <Plus className="h-4 w-4 mr-1" /> New Policy
        </Button>
      </div>

      {policies.length === 0 ? (
        <Card><CardContent className="text-center py-10 text-muted-foreground text-sm">No policies configured yet.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {policies.map((p) => (
            <Card key={p.id} className={!p.is_active ? "opacity-60" : ""}>
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{p.name ?? "—"}</span>
                      <span className="text-xs text-muted-foreground font-mono">{p.code ?? "—"}</span>
                      <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${severityColor[p.severity] ?? "bg-gray-100 text-gray-700"}`}>
                        {p.severity ?? "—"}
                      </span>
                      <span className="text-xs font-medium capitalize text-blue-600">{p.action ?? "—"}</span>
                    </div>
                    {p.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{p.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>Type: <strong className="text-foreground capitalize">{p.txn_type ?? "all"}</strong></span>
                      <span>Score: <strong className="text-foreground">{p.score_points ?? 0} pts</strong></span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Switch checked={!!p.is_active} onCheckedChange={() => toggleActive(p)} />
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditTarget(p)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost" size="icon" className="h-7 w-7 text-red-500"
                      onClick={() => { if (window.confirm("Delete this policy?")) deleteMut.mutate(p.id); }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showNew && (
        <PolicyForm
          onClose={() => setShowNew(false)}
          onSave={(payload) => createMut.mutate(payload)}
          isSaving={createMut.isPending}
        />
      )}

      {editTarget && (
        <PolicyForm
          initial={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={(payload) => updateMut.mutate({ id: editTarget.id, payload })}
          isSaving={updateMut.isPending}
        />
      )}
    </div>
  );
};

export default AMLPolicies;

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
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
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, AlertCircle, X } from "lucide-react";

const TXN_TYPES  = ["all", "deposit", "withdrawal", "loan", "transfer", "shares"];
const SEVERITIES = ["low", "medium", "high", "critical"];
const ACTIONS    = ["alert", "flag", "block"];
const FIELDS     = [
  { value: "amount",         label: "Transaction Amount" },
  { value: "txn_count_24h",  label: "Txn Count (24 h)" },
  { value: "txn_amount_24h", label: "Total Volume (24 h)" },
];
const OPS = [">=", ">", "<=", "<", "==", "!="];

const severityColor = {
  low:      "bg-blue-50 text-blue-700",
  medium:   "bg-amber-50 text-amber-700",
  high:     "bg-orange-50 text-orange-700",
  critical: "bg-red-50 text-red-700",
};

const emptyConditions = () => ({ operator: "AND", conditions: [{ field: "amount", op: ">=", value: "" }] });

const emptyForm = () => ({
  code: "", name: "", description: "",
  txn_type: "all", severity: "medium", action: "alert",
  score_points: 10, is_active: true,
  category_id: "__none__", notify_roles: [],
  conditions: emptyConditions(),
});

/* ── Conditions builder ─────────────────────────────────────────── */
const ConditionsBuilder = ({ value, onChange }) => {
  const setOperator = (op) => onChange({ ...value, operator: op });

  const setRow = (i, key, val) => {
    const rows = value.conditions.map((r, idx) =>
      idx === i ? { ...r, [key]: val } : r
    );
    onChange({ ...value, conditions: rows });
  };

  const addRow = () =>
    onChange({ ...value, conditions: [...value.conditions, { field: "amount", op: ">=", value: "" }] });

  const removeRow = (i) =>
    onChange({ ...value, conditions: value.conditions.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Match</span>
        <div className="flex rounded border overflow-hidden">
          {["AND", "OR"].map((op) => (
            <button
              key={op}
              type="button"
              onClick={() => setOperator(op)}
              className={`px-3 py-0.5 text-xs font-medium transition-colors ${
                value.operator === op
                  ? "bg-primary text-primary-foreground"
                  : "bg-background hover:bg-muted"
              }`}
            >
              {op}
            </button>
          ))}
        </div>
        <span className="text-xs text-muted-foreground">of the following conditions</span>
      </div>

      <div className="space-y-1.5">
        {value.conditions.map((row, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <Select value={row.field} onValueChange={(v) => setRow(i, "field", v)}>
              <SelectTrigger className="h-7 text-xs w-44 shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FIELDS.map((f) => (
                  <SelectItem key={f.value} value={f.value} className="text-xs">{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={row.op} onValueChange={(v) => setRow(i, "op", v)}>
              <SelectTrigger className="h-7 text-xs w-16 shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OPS.map((o) => (
                  <SelectItem key={o} value={o} className="text-xs font-mono">{o}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="number"
              value={row.value}
              onChange={(e) => setRow(i, "value", e.target.value)}
              placeholder="value"
              className="h-7 text-xs flex-1 min-w-0"
            />

            <button
              type="button"
              onClick={() => removeRow(i)}
              disabled={value.conditions.length === 1}
              className="h-7 w-7 flex items-center justify-center rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive disabled:opacity-30 shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={addRow}>
        <Plus className="h-3 w-3 mr-1" /> Add condition
      </Button>
    </div>
  );
};

/* ── Policy form dialog ─────────────────────────────────────────── */
const PolicyForm = ({ initial, categories, roles = [], onClose, onSave, isSaving }) => {
  const initConditions = () => {
    if (!initial?.conditions) return emptyConditions();
    const c = initial.conditions;
    if (c && typeof c === "object" && Array.isArray(c.conditions) && c.conditions.length > 0) return c;
    return emptyConditions();
  };

  const [form, setForm] = useState(() =>
    initial
      ? {
          code:         initial.code         ?? "",
          name:         initial.name         ?? "",
          description:  initial.description  ?? "",
          txn_type:     initial.txn_type      ?? "all",
          severity:     initial.severity      ?? "medium",
          action:       initial.action        ?? "alert",
          score_points: initial.score_points  ?? 10,
          is_active:    !!initial.is_active,
          category_id:  initial.category_id   ? String(initial.category_id) : "__none__",
          notify_roles: initial.notify_roles
            ? initial.notify_roles.split(",").map((s) => s.trim()).filter(Boolean)
            : [],
          conditions:   initConditions(),
        }
      : emptyForm()
  );

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.code.trim() || !form.name.trim()) {
      toast({ title: "Code and Name are required", variant: "destructive" });
      return;
    }
    const hasIncomplete = form.conditions.conditions.some(
      (r) => !r.field || !r.op || r.value === "" || r.value === null
    );
    if (hasIncomplete) {
      toast({ title: "Complete all condition rows or remove empty ones", variant: "destructive" });
      return;
    }

    const payload = {
      ...form,
      score_points: Number(form.score_points),
      category_id:  form.category_id && form.category_id !== "__none__" ? Number(form.category_id) : null,
      notify_roles: form.notify_roles.length ? form.notify_roles.join(",") : null,
      conditions: {
        operator: form.conditions.operator,
        conditions: form.conditions.conditions.map((r) => ({
          field: r.field,
          op:    r.op,
          value: Number(r.value),
        })),
      },
    };
    onSave(payload);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">{initial ? "Edit AML Rule" : "New AML Rule"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* Basic info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Code *</label>
              <Input
                value={form.code}
                disabled={!!initial}
                onChange={(e) => set("code", e.target.value)}
                placeholder="e.g. LARGE_TXN"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Name *</label>
              <Input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Rule name"
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium">Description</label>
            <Textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={2}
              className="text-xs resize-none"
            />
          </div>

          {/* Type / Severity / Action */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Transaction Type</label>
              <Select value={form.txn_type} onValueChange={(v) => set("txn_type", v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TXN_TYPES.map((t) => <SelectItem key={t} value={t} className="text-xs capitalize">{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Severity</label>
              <Select value={form.severity} onValueChange={(v) => set("severity", v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SEVERITIES.map((s) => <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Action on Trigger</label>
              <Select value={form.action} onValueChange={(v) => set("action", v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACTIONS.map((a) => <SelectItem key={a} value={a} className="text-xs capitalize">{a}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Score / Category / Active */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium">Score Points</label>
              <Input
                type="number"
                value={form.score_points}
                min={1}
                max={100}
                onChange={(e) => set("score_points", Number(e.target.value))}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Category</label>
              <Select value={form.category_id} onValueChange={(v) => set("category_id", v)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__" className="text-xs">None</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)} className="text-xs">{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 pt-5">
              <Switch
                id="is_active_form"
                checked={form.is_active}
                onCheckedChange={(v) => set("is_active", v)}
              />
              <label htmlFor="is_active_form" className="text-xs">Active</label>
            </div>
          </div>

          {/* Notify roles */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium">Notify Roles</label>
            {roles.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No roles found</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {roles.map((r) => {
                  const selected = form.notify_roles.includes(String(r.id));
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() =>
                        set("notify_roles", selected
                          ? form.notify_roles.filter((id) => id !== String(r.id))
                          : [...form.notify_roles, String(r.id)]
                        )
                      }
                      className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${
                        selected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-dashed border-muted-foreground/40 text-muted-foreground hover:border-primary/50 hover:text-foreground"
                      }`}
                    >
                      {selected && "✓ "}{r.name}
                    </button>
                  );
                })}
              </div>
            )}
            <p className="text-[10px] text-muted-foreground">
              Users holding selected roles receive an in-app notification when this rule fires.
            </p>
          </div>

          <Separator />

          {/* Conditions builder */}
          <div className="space-y-2">
            <div>
              <label className="text-xs font-medium">Trigger Conditions</label>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                The rule fires when the transaction matches these conditions.
              </p>
            </div>
            <ConditionsBuilder
              value={form.conditions}
              onChange={(v) => set("conditions", v)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button type="submit" size="sm" disabled={isSaving}>
              {isSaving ? "Saving…" : "Save Rule"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

/* ── Main component ─────────────────────────────────────────────── */
const AMLPolicies = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate     = useNavigate();
  const queryClient  = useQueryClient();

  const [showNew,    setShowNew]    = useState(false);
  const [editTarget, setEditTarget] = useState(null);

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

  const { data: categories = [] } = useQuery({
    queryKey: ["aml-categories"],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get("/aml/categories");
        return Array.isArray(res?.data?.data) ? res.data.data : [];
      } catch { return []; }
    },
  });

  const { data: roles = [] } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get("/settings/rights/roles");
        return res?.data?.data?.roles ?? [];
      } catch { return []; }
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["aml-policies"] });

  const createMut = useMutation({
    mutationFn: (payload) => axiosPrivate.post("/aml/policies", payload),
    onSuccess: () => { invalidate(); setShowNew(false); toast({ title: "Rule created", variant: "success" }); },
    onError:   (e) => toast({ title: e?.response?.data?.messages?.[0] ?? "Failed to create rule", variant: "destructive" }),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, payload }) => axiosPrivate.put(`/aml/policies/${id}`, payload),
    onSuccess: () => { invalidate(); setEditTarget(null); toast({ title: "Rule updated", variant: "success" }); },
    onError:   () => toast({ title: "Failed to update rule", variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => axiosPrivate.delete(`/aml/policies/${id}`),
    onSuccess: () => { invalidate(); toast({ title: "Rule deleted", variant: "success" }); },
    onError:   () => toast({ title: "Failed to delete rule", variant: "destructive" }),
  });

  const toggleActive = (p) =>
    updateMut.mutate({ id: p.id, payload: { is_active: !p.is_active } });

  if (isLoading) {
    return <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>;
  }

  if (isError) {
    return (
      <div className="flex items-center gap-2 text-destructive text-sm py-6">
        <AlertCircle className="h-4 w-4" /> Failed to load AML rules.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-base">AML Rules</h3>
          <p className="text-xs text-muted-foreground">
            {policies.length} rule{policies.length === 1 ? "" : "s"} configured
          </p>
        </div>
        <Button size="sm" onClick={() => setShowNew(true)}>
          <Plus className="h-4 w-4 mr-1" /> New Rule
        </Button>
      </div>

      {policies.length === 0 ? (
        <Card>
          <CardContent className="text-center py-10 text-muted-foreground text-sm">
            No rules configured yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {policies.map((p) => {
            const condCount = p.conditions?.conditions?.length ?? 0;
            return (
              <Card key={p.id} className={!p.is_active ? "opacity-60" : ""}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{p.name ?? "—"}</span>
                        <span className="text-xs text-muted-foreground font-mono">{p.code ?? "—"}</span>
                        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${severityColor[p.severity] ?? "bg-gray-100 text-gray-700"}`}>
                          {p.severity ?? "—"}
                        </span>
                        <span className="text-xs font-medium capitalize text-blue-600">{p.action ?? "—"}</span>
                        {p.category && (
                          <span className="text-xs text-muted-foreground border rounded px-1">{p.category.name}</span>
                        )}
                      </div>
                      {p.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{p.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                        <span>Type: <strong className="text-foreground capitalize">{p.txn_type ?? "all"}</strong></span>
                        <span>Score: <strong className="text-foreground">{p.score_points ?? 0} pts</strong></span>
                        <span className={condCount === 0 ? "text-destructive font-medium" : ""}>
                          {condCount === 0 ? "⚠ No conditions — rule will not fire" : `${condCount} condition${condCount === 1 ? "" : "s"} (${p.conditions?.operator ?? "AND"})`}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Switch checked={!!p.is_active} onCheckedChange={() => toggleActive(p)} />
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditTarget(p)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-7 w-7 text-red-500"
                        onClick={() => { if (window.confirm("Delete this rule?")) deleteMut.mutate(p.id); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {showNew && (
        <PolicyForm
          categories={categories}
          roles={roles}
          onClose={() => setShowNew(false)}
          onSave={(payload) => createMut.mutate(payload)}
          isSaving={createMut.isPending}
        />
      )}

      {editTarget && (
        <PolicyForm
          initial={editTarget}
          categories={categories}
          roles={roles}
          onClose={() => setEditTarget(null)}
          onSave={(payload) => updateMut.mutate({ id: editTarget.id, payload })}
          isSaving={updateMut.isPending}
        />
      )}
    </div>
  );
};

export default AMLPolicies;

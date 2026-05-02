/* eslint-disable react/prop-types */
import { useState } from "react";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { toast } from "@/hooks/use-toast";
import {
  Percent, RefreshCw, Save, PiggyBank, Wallet,
  Plus, Pencil, Trash2,
} from "lucide-react";

// ── Fetch helpers ─────────────────────────────────────────────────────────────

function useSettings() {
  const ax = useAxiosPrivate();
  return useQuery({
    queryKey: ["compulsory-savings-settings"],
    queryFn: async () => {
      const res = await ax.get("/settings/compulsory-savings");
      return res.data?.data?.settings ?? [];
    },
  });
}

function useGroups() {
  const ax = useAxiosPrivate();
  return useQuery({
    queryKey: ["group-clients-list"],
    queryFn: async () => {
      const res = await ax.get("/clients/groups");
      return res.data?.data?.clients ?? [];
    },
  });
}

// ── Form dialog (add / edit) ──────────────────────────────────────────────────

const FORM_DEFAULTS = {
  group_client_id: "",
  group_account_id: "",
  recurring_amount: 2000,
  first_cycle_percent: 15,
  subsequent_cycle_percent: 10,
  status: "active",
};

function SettingFormDialog({ open, onClose, editing }) {
  const ax = useAxiosPrivate();
  const qc = useQueryClient();
  const { data: groups = [], isLoading: loadingGroups } = useGroups();
  const [isActive, setIsActive] = useState(editing ? editing.status === "active" : true);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: editing
      ? {
          group_client_id:          editing.group_client_id ?? "",
          group_account_id:         editing.group_account_id ?? "",
          recurring_amount:         editing.recurring_amount ?? 2000,
          first_cycle_percent:      editing.first_cycle_percent ?? 15,
          subsequent_cycle_percent: editing.subsequent_cycle_percent ?? 10,
        }
      : FORM_DEFAULTS,
  });

  const selectedGroupId = watch("group_client_id");

  const onSubmit = async (data) => {
    try {
      const payload = {
        group_client_id:          data.group_client_id ? Number(data.group_client_id) : null,
        group_account_id:         data.group_account_id ? Number(data.group_account_id) : null,
        recurring_amount:         Number(data.recurring_amount),
        first_cycle_percent:      Number(data.first_cycle_percent),
        subsequent_cycle_percent: Number(data.subsequent_cycle_percent),
        status:                   isActive ? "active" : "inactive",
      };

      if (editing) {
        await ax.patch(`/settings/compulsory-savings/${editing.id}`, payload);
        toast({ title: "Updated", description: "Compulsory savings settings updated." });
      } else {
        await ax.post("/settings/compulsory-savings", payload);
        toast({ title: "Created", description: "Compulsory savings settings created." });
      }

      qc.invalidateQueries({ queryKey: ["compulsory-savings-settings"] });
      reset();
      onClose();
    } catch (err) {
      toast({
        title: "Error",
        variant: "destructive",
        description: err?.response?.data?.messages?.[0] ?? "Failed to save settings.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[540px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit" : "Add"} Group Compulsory Savings</DialogTitle>
          <DialogDescription>
            Configure compulsory savings parameters for a group.
          </DialogDescription>
          <DialogClose asChild>
            <button className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100" onClick={onClose} />
          </DialogClose>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-2">
          {/* Group selection */}
          <div>
            <Label>Group</Label>
            <Select
              defaultValue={String(editing?.group_client_id ?? "")}
              onValueChange={(v) => setValue("group_client_id", v)}
              disabled={loadingGroups}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingGroups ? "Loading groups…" : "Select group"} />
              </SelectTrigger>
              <SelectContent>
                {groups.map((g) => (
                  <SelectItem key={g.client_id} value={String(g.client_id)}>
                    {g.client_group_name || `${g.client_firstname} ${g.client_lastname ?? ""}`.trim()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Group savings account ID */}
          <div>
            <Label>Group Savings Account ID</Label>
            <Input
              type="number"
              placeholder="client_account_id of the group savings account"
              {...register("group_account_id")}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Recurring collections are credited to this account.
            </p>
          </div>

          {/* Recurring + percentages */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="flex items-center gap-1">
                <Wallet className="w-3.5 h-3.5" /> Amount / Repayment
              </Label>
              <Input
                type="number"
                step="1"
                placeholder="e.g. 2000"
                {...register("recurring_amount", {
                  required: "Required",
                  min: { value: 0, message: "Must be ≥ 0" },
                })}
              />
              {errors.recurring_amount && (
                <p className="text-red-500 text-xs mt-1">{errors.recurring_amount.message}</p>
              )}
            </div>

            <div>
              <Label className="flex items-center gap-1">
                <Percent className="w-3.5 h-3.5" /> 1st Cycle %
              </Label>
              <Input
                type="number"
                step="0.01"
                placeholder="e.g. 15"
                {...register("first_cycle_percent", {
                  required: "Required",
                  min: { value: 0, message: "Must be ≥ 0" },
                  max: { value: 100, message: "Must be ≤ 100" },
                })}
              />
              {errors.first_cycle_percent && (
                <p className="text-red-500 text-xs mt-1">{errors.first_cycle_percent.message}</p>
              )}
            </div>

            <div>
              <Label className="flex items-center gap-1">
                <Percent className="w-3.5 h-3.5" /> Subsequent %
              </Label>
              <Input
                type="number"
                step="0.01"
                placeholder="e.g. 10"
                {...register("subsequent_cycle_percent", {
                  required: "Required",
                  min: { value: 0, message: "Must be ≥ 0" },
                  max: { value: 100, message: "Must be ≤ 100" },
                })}
              />
              {errors.subsequent_cycle_percent && (
                <p className="text-red-500 text-xs mt-1">{errors.subsequent_cycle_percent.message}</p>
              )}
            </div>
          </div>

          {/* Status toggle */}
          <div className="flex items-center gap-3">
            <Switch id="status" checked={isActive} onCheckedChange={setIsActive} />
            <Label htmlFor="status" className="cursor-pointer">
              {isActive ? "Active" : "Inactive"}
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              <Save className="w-3.5 h-3.5 mr-1.5" />
              {isSubmitting ? "Saving…" : editing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const CompulsorySavingsSettings = () => {
  const { data: settings = [], isLoading, isError, refetch } = useSettings();
  const ax = useAxiosPrivate();
  const qc = useQueryClient();

  const [addOpen,    setAddOpen]    = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const deleteMutation = useMutation({
    mutationFn: (id) => ax.delete(`/settings/compulsory-savings/${id}`),
    onSuccess: () => {
      toast({ title: "Deleted" });
      qc.invalidateQueries({ queryKey: ["compulsory-savings-settings"] });
    },
    onError: (err) => {
      toast({
        title: "Error",
        variant: "destructive",
        description: err?.response?.data?.messages?.[0] ?? "Delete failed.",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="font-medium">Failed to load settings.</p>
        <Button variant="outline" className="mt-4" onClick={refetch}>
          <RefreshCw className="w-4 h-4 mr-2" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink to="/dashboard">Home</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Compulsory Savings Settings</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col gap-6 pt-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h5 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <PiggyBank className="w-6 h-6 text-green-600" /> Compulsory Savings
            </h5>
            <p className="text-sm text-muted-foreground mt-1">
              Configure frozen savings on loan disbursement and recurring collections per group.
            </p>
          </div>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" /> Add Group Configuration
          </Button>
        </div>

        {/* Legend card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-blue-100 bg-blue-50/50 dark:bg-blue-900/10">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Wallet className="w-4 h-4 text-blue-500" /> Recurring Savings
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              A fixed amount collected from each member on every loan repayment and credited
              to the configured group savings account.
            </CardContent>
          </Card>
          <Card className="border-green-100 bg-green-50/50 dark:bg-green-900/10">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <PiggyBank className="w-4 h-4 text-green-600" /> Frozen Savings on Disbursement
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              A percentage of each member&apos;s loan allocation is frozen on disbursement.
              Rate changes after the first loan cycle.
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Group</TableHead>
                  <TableHead>Savings Account</TableHead>
                  <TableHead className="text-right">Amount / Repayment</TableHead>
                  <TableHead className="text-right">1st Cycle %</TableHead>
                  <TableHead className="text-right">Subsequent %</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {settings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground text-sm">
                      No group configurations yet. Click &ldquo;Add Group Configuration&rdquo; to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  settings.map((s) => {
                    const groupName =
                      s.group?.client_group_name ||
                      s.group_account?.client?.client_group_name ||
                      `Group #${s.group_client_id ?? s.id}`;
                    const accountLabel = s.group_account
                      ? `${s.group_account.client?.client_group_name ?? "Account"} — UGX ${Number(s.group_account.client_account_balance ?? 0).toLocaleString()}`
                      : s.group_account_id ? `Account #${s.group_account_id}` : "—";

                    return (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium text-sm">{groupName}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{accountLabel}</TableCell>
                        <TableCell className="text-right tabular-nums text-sm">
                          {Number(s.recurring_amount).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-sm">
                          {Number(s.first_cycle_percent).toFixed(2)}%
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-sm">
                          {Number(s.subsequent_cycle_percent).toFixed(2)}%
                        </TableCell>
                        <TableCell>
                          <Badge variant={s.status === "active" ? "default" : "secondary"} className="capitalize text-xs">
                            {s.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 justify-end">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => setEditTarget(s)}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => setDeleteTarget(s)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Add dialog */}
      {addOpen && (
        <SettingFormDialog open={addOpen} onClose={() => setAddOpen(false)} editing={null} />
      )}

      {/* Edit dialog */}
      {editTarget && (
        <SettingFormDialog open={!!editTarget} onClose={() => setEditTarget(null)} editing={editTarget} />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this configuration?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the compulsory savings settings for this group.
              Existing transactions are not affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                deleteMutation.mutate(deleteTarget.id);
                setDeleteTarget(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CompulsorySavingsSettings;

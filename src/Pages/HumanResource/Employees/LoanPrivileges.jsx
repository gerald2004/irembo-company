/* eslint-disable react/prop-types */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Trash2, Plus, X } from "lucide-react";

const PRIVILEGE_LABELS = {
  loan_officer:        "Loan Officer",
  first_approver:      "First Approver",
  second_approver:     "Second Approver",
  final_approver:      "Final Approver",
  disbursement_officer:"Disbursement Officer",
};

const PRIVILEGE_COLORS = {
  loan_officer:        "bg-gray-100 text-gray-800 border-gray-300",
  first_approver:      "bg-sky-100 text-sky-800 border-sky-300",
  second_approver:     "bg-indigo-100 text-indigo-800 border-indigo-300",
  final_approver:      "bg-violet-100 text-violet-800 border-violet-300",
  disbursement_officer:"bg-emerald-100 text-emerald-800 border-emerald-300",
};

export default function LoanPrivileges() {
  const axiosPrivate = useAxiosPrivate();
  const queryClient  = useQueryClient();

  const [showAssign, setShowAssign] = useState(false);
  const [form, setForm] = useState({ user_id: "", privilege_type: "", branch_id: "" });

  // ── Fetch privileges ────────────────────────────────────────────────────────
  const { data: privileges = [], isLoading } = useQuery({
    queryKey: ["loan-privileges"],
    queryFn: () =>
      axiosPrivate.get("/hr/loan-privileges").then((r) => r.data?.data ?? []),
  });

  // ── Fetch staff list for assignment dialog ───────────────────────────────────
  const { data: staffList = [] } = useQuery({
    queryKey: ["staff-list"],
    queryFn: () =>
      axiosPrivate.get("/business/employees").then((r) => r.data?.data ?? []),
    enabled: showAssign,
  });

  // ── Fetch branches ───────────────────────────────────────────────────────────
  const { data: branches = [] } = useQuery({
    queryKey: ["branches-list"],
    queryFn: () =>
      axiosPrivate.get("/settings/branches").then((r) => r.data?.data ?? []),
    enabled: showAssign,
  });

  // ── Assign mutation ──────────────────────────────────────────────────────────
  const assignMutation = useMutation({
    mutationFn: (body) => axiosPrivate.post("/hr/loan-privileges", body),
    onSuccess: () => {
      toast({ title: "Privilege assigned successfully" });
      queryClient.invalidateQueries({ queryKey: ["loan-privileges"] });
      setShowAssign(false);
      setForm({ user_id: "", privilege_type: "", branch_id: "" });
    },
    onError: (err) => {
      toast({
        title: "Error",
        variant: "destructive",
        description: err?.response?.data?.messages?.[0] ?? "Failed to assign privilege",
      });
    },
  });

  // ── Toggle active mutation ────────────────────────────────────────────────────
  const toggleMutation = useMutation({
    mutationFn: (privilegeId) =>
      axiosPrivate.patch(`/hr/loan-privileges/${privilegeId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loan-privileges"] });
    },
    onError: () => toast({ title: "Failed to update", variant: "destructive" }),
  });

  // ── Delete mutation ───────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (privilegeId) =>
      axiosPrivate.delete(`/hr/loan-privileges/${privilegeId}`),
    onSuccess: () => {
      toast({ title: "Privilege removed" });
      queryClient.invalidateQueries({ queryKey: ["loan-privileges"] });
    },
    onError: () => toast({ title: "Failed to remove", variant: "destructive" }),
  });

  const handleAssign = () => {
    if (!form.user_id || !form.privilege_type) {
      toast({ title: "Please select a staff member and privilege type", variant: "destructive" });
      return;
    }
    assignMutation.mutate({
      user_id:        parseInt(form.user_id),
      privilege_type: form.privilege_type,
      branch_id:      form.branch_id ? parseInt(form.branch_id) : null,
    });
  };

  return (
    <div className="p-4 space-y-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/staff-management">Staff Management</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Loan Workflow Privileges</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Loan Workflow Privileges</h2>
          <p className="text-sm text-muted-foreground">
            Assign staff to roles in the loan approval pipeline.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowAssign(true)}>
          <Plus className="h-4 w-4 mr-1" /> Assign Privilege
        </Button>
      </div>

      {/* ── Privilege table ─────────────────────────────────────────────────── */}
      <div className="border rounded-lg shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Staff Member</TableHead>
              <TableHead>Privilege</TableHead>
              <TableHead>Branch Scope</TableHead>
              <TableHead className="text-center">Active</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && privileges.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No privileges assigned yet. Click "Assign Privilege" to get started.
                </TableCell>
              </TableRow>
            )}
            {privileges.map((p) => (
              <TableRow key={p.privilege_id}>
                <TableCell>
                  <div className="font-medium">{p.user_name}</div>
                  <div className="text-xs text-muted-foreground">{p.user_email}</div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`capitalize text-xs ${PRIVILEGE_COLORS[p.privilege_type] ?? ""}`}
                  >
                    {PRIVILEGE_LABELS[p.privilege_type] ?? p.privilege_type}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {p.branch_name ?? <span className="text-muted-foreground italic">All branches</span>}
                </TableCell>
                <TableCell className="text-center">
                  <Switch
                    checked={!!p.is_active}
                    onCheckedChange={() => toggleMutation.mutate(p.privilege_id)}
                    disabled={toggleMutation.isPending}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => deleteMutation.mutate(p.privilege_id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* ── Assign dialog ───────────────────────────────────────────────────── */}
      <Dialog open={showAssign} onOpenChange={setShowAssign}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Assign Loan Privilege</DialogTitle>
            <DialogClose asChild>
              <button
                className="absolute right-4 top-4 opacity-70 hover:opacity-100"
                onClick={() => setShowAssign(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </DialogClose>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Staff Member</Label>
              <Select
                value={form.user_id}
                onValueChange={(v) => setForm((f) => ({ ...f, user_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select staff member…" />
                </SelectTrigger>
                <SelectContent>
                  {staffList.map((s) => (
                    <SelectItem key={s.user_id} value={String(s.user_id)}>
                      {s.user_firstname} {s.user_lastname}
                      {s.user_email ? ` — ${s.user_email}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Privilege Type</Label>
              <Select
                value={form.privilege_type}
                onValueChange={(v) => setForm((f) => ({ ...f, privilege_type: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select privilege…" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIVILEGE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Branch Scope <span className="text-muted-foreground text-xs">(leave blank for all branches)</span></Label>
              <Select
                value={form.branch_id}
                onValueChange={(v) => setForm((f) => ({ ...f, branch_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All branches (sacco-wide)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All branches</SelectItem>
                  {branches.map((b) => (
                    <SelectItem key={b.branch_id} value={String(b.branch_id)}>
                      {b.branch_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssign(false)}>Cancel</Button>
            <Button onClick={handleAssign} disabled={assignMutation.isPending}>
              {assignMutation.isPending ? "Assigning…" : "Assign Privilege"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

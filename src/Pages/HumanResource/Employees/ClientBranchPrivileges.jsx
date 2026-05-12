/* eslint-disable react/prop-types */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Trash2, Plus, X, PencilLine, Info } from "lucide-react";

const PRIV_META = {
  sacco:    { label: "All Branches",    color: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  branch:   { label: "Specific Branches", color: "bg-sky-100 text-sky-800 border-sky-300" },
  personal: { label: "Own Records Only", color: "bg-amber-100 text-amber-800 border-amber-300" },
};

function PrivBadge({ level }) {
  const meta = PRIV_META[level] ?? { label: level, color: "bg-gray-100 text-gray-700 border-gray-300" };
  return (
    <Badge variant="outline" className={`capitalize text-xs ${meta.color}`}>
      {meta.label}
    </Badge>
  );
}

export default function ClientBranchPrivileges() {
  const axiosPrivate = useAxiosPrivate();
  const queryClient  = useQueryClient();

  const [showAssign,    setShowAssign]    = useState(false);
  const [showEditPriv,  setShowEditPriv]  = useState(false);
  const [editUser,      setEditUser]      = useState(null); // { user_id, user_name, client_data_privileges }
  const [form, setForm]  = useState({ user_id: "", branch_id: "" });
  const [newPriv, setNewPriv] = useState("");

  // ── Fetch all branch access rows ────────────────────────────────────────────
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["client-branch-access"],
    queryFn: () =>
      axiosPrivate.get("/hr/client-branch-access").then((r) => r.data?.data ?? []),
  });

  // ── Fetch staff list (for assign dialog) ────────────────────────────────────
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
    enabled: showAssign || showEditPriv,
  });

  // ── Grant branch mutation ────────────────────────────────────────────────────
  const grantMutation = useMutation({
    mutationFn: (body) => axiosPrivate.post("/hr/client-branch-access", body),
    onSuccess: () => {
      toast({ title: "Branch access granted" });
      queryClient.invalidateQueries({ queryKey: ["client-branch-access"] });
      setShowAssign(false);
      setForm({ user_id: "", branch_id: "" });
    },
    onError: (err) =>
      toast({
        title: "Error",
        variant: "destructive",
        description: err?.response?.data?.messages?.[0] ?? "Failed to grant access",
      }),
  });

  // ── Revoke branch mutation ───────────────────────────────────────────────────
  const revokeMutation = useMutation({
    mutationFn: ({ user_id, branch_id }) =>
      axiosPrivate.delete("/hr/client-branch-access", { data: { user_id, branch_id } }),
    onSuccess: () => {
      toast({ title: "Branch access revoked" });
      queryClient.invalidateQueries({ queryKey: ["client-branch-access"] });
    },
    onError: () => toast({ title: "Failed to revoke access", variant: "destructive" }),
  });

  // ── Update privilege level mutation ──────────────────────────────────────────
  const updatePrivMutation = useMutation({
    mutationFn: ({ userId, privilege }) =>
      axiosPrivate.patch(`/hr/client-branch-access/${userId}`, {
        client_data_privileges: privilege,
      }),
    onSuccess: () => {
      toast({ title: "Data privilege updated" });
      queryClient.invalidateQueries({ queryKey: ["client-branch-access"] });
      setShowEditPriv(false);
      setEditUser(null);
    },
    onError: (err) =>
      toast({
        title: "Error",
        variant: "destructive",
        description: err?.response?.data?.messages?.[0] ?? "Failed to update privilege",
      }),
  });

  const handleGrant = () => {
    if (!form.user_id || !form.branch_id) {
      toast({ title: "Please select a staff member and a branch", variant: "destructive" });
      return;
    }
    grantMutation.mutate({
      user_id:   parseInt(form.user_id),
      branch_id: parseInt(form.branch_id),
    });
  };

  const openEditPriv = (row) => {
    setEditUser(row);
    setNewPriv(row.client_data_privileges ?? "branch");
    setShowEditPriv(true);
  };

  // Group rows by user for a cleaner display
  const grouped = rows.reduce((acc, r) => {
    if (!acc[r.user_id]) {
      acc[r.user_id] = {
        user_id:                r.user_id,
        user_name:              r.user_name,
        user_email:             r.user_email,
        client_data_privileges: r.client_data_privileges,
        branches:               [],
      };
    }
    acc[r.user_id].branches.push({ branch_id: r.branch_id, branch_name: r.branch_name });
    return acc;
  }, {});
  const groupedRows = Object.values(grouped);

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
            <BreadcrumbPage>Client Branch Access</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Client Branch Access</h2>
          <p className="text-sm text-muted-foreground max-w-lg">
            Control which branches each staff member can access client records from.
            Staff set to <strong>Specific Branches</strong> can only see clients from their
            assigned branches.
          </p>
        </div>
        <Button size="sm" onClick={() => setShowAssign(true)}>
          <Plus className="h-4 w-4 mr-1" /> Grant Branch Access
        </Button>
      </div>

      {/* ── Legend ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground items-center">
        <span className="font-medium text-foreground">Access levels:</span>
        <PrivBadge level="sacco" />   <span>— sees all branches in the organisation</span>
        <PrivBadge level="branch" />  <span>— sees only the branches listed below</span>
        <PrivBadge level="personal" /><span>— sees only their own created records</span>
      </div>

      {/* ── Table ────────────────────────────────────────────────────────────── */}
      <div className="border rounded-lg shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Staff Member</TableHead>
              <TableHead>Data Access Level</TableHead>
              <TableHead>Allowed Branches</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && groupedRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  No branch access records found. Click "Grant Branch Access" to get started.
                </TableCell>
              </TableRow>
            )}
            {groupedRows.map((u) => (
              <TableRow key={u.user_id}>
                <TableCell>
                  <div className="font-medium">{u.user_name}</div>
                  <div className="text-xs text-muted-foreground">{u.user_email}</div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <PrivBadge level={u.client_data_privileges} />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            className="text-muted-foreground hover:text-foreground"
                            onClick={() => openEditPriv(u)}
                          >
                            <PencilLine className="h-3.5 w-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Change access level</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableCell>
                <TableCell>
                  {u.client_data_privileges === "sacco" ? (
                    <span className="text-sm text-muted-foreground italic">All branches</span>
                  ) : u.branches.length === 0 ? (
                    <span className="text-sm text-muted-foreground italic">None assigned</span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {u.branches.map((b) => (
                        <span
                          key={b.branch_id}
                          className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-0.5 rounded-full"
                        >
                          {b.branch_name}
                          <button
                            className="text-muted-foreground hover:text-red-500 ml-0.5"
                            onClick={() =>
                              revokeMutation.mutate({ user_id: u.user_id, branch_id: b.branch_id })
                            }
                            disabled={revokeMutation.isPending}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-sky-600 hover:text-sky-800"
                          onClick={() => {
                            setForm({ user_id: String(u.user_id), branch_id: "" });
                            setShowAssign(true);
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Add branch to this staff member</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* ── Grant branch dialog ─────────────────────────────────────────────── */}
      <Dialog open={showAssign} onOpenChange={(v) => { setShowAssign(v); if (!v) setForm({ user_id: "", branch_id: "" }); }}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Grant Branch Access</DialogTitle>
            <DialogClose asChild>
              <button
                className="absolute right-4 top-4 opacity-70 hover:opacity-100"
                onClick={() => { setShowAssign(false); setForm({ user_id: "", branch_id: "" }); }}
              >
                <X className="h-4 w-4" />
              </button>
            </DialogClose>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex items-start gap-2 p-3 rounded-md bg-sky-50 border border-sky-200 text-sky-800 text-sm">
              <Info className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                Granting a branch automatically sets the staff member's access level to
                <strong> Specific Branches</strong> if it was not already.
              </span>
            </div>

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
              <Label>Branch to Grant Access To</Label>
              <Select
                value={form.branch_id}
                onValueChange={(v) => setForm((f) => ({ ...f, branch_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select branch…" />
                </SelectTrigger>
                <SelectContent>
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
            <Button variant="outline" onClick={() => { setShowAssign(false); setForm({ user_id: "", branch_id: "" }); }}>
              Cancel
            </Button>
            <Button onClick={handleGrant} disabled={grantMutation.isPending}>
              {grantMutation.isPending ? "Granting…" : "Grant Access"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit privilege level dialog ─────────────────────────────────────── */}
      <Dialog open={showEditPriv} onOpenChange={setShowEditPriv}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Change Data Access Level</DialogTitle>
            <DialogClose asChild>
              <button
                className="absolute right-4 top-4 opacity-70 hover:opacity-100"
                onClick={() => setShowEditPriv(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </DialogClose>
          </DialogHeader>

          {editUser && (
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">
                Changing access level for <strong>{editUser.user_name}</strong>.
              </p>

              <div className="space-y-1">
                <Label>Data Access Level</Label>
                <Select value={newPriv} onValueChange={setNewPriv}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sacco">
                      All Branches — sees every branch in the organisation
                    </SelectItem>
                    <SelectItem value="branch">
                      Specific Branches — sees only assigned branches below
                    </SelectItem>
                    <SelectItem value="personal">
                      Own Records Only — sees only records they created
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newPriv === "branch" && editUser.branches?.length === 0 && (
                <div className="flex items-start gap-2 p-3 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-sm">
                  <Info className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>
                    This staff member has no branches assigned yet. Use "Grant Branch Access" to
                    add specific branches after saving.
                  </span>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditPriv(false)}>Cancel</Button>
            <Button
              onClick={() => updatePrivMutation.mutate({ userId: editUser.user_id, privilege: newPriv })}
              disabled={updatePrivMutation.isPending}
            >
              {updatePrivMutation.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* eslint-disable react/prop-types */
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { toast } from "@/hooks/use-toast";
import { DateField } from "@/components/DateField";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Plus, X, Check, XCircle } from "lucide-react";
import { formatDateTimestamp } from "@/lib/utils";

const LEAVE_TYPES = ["annual","sick","maternity","paternity","emergency","unpaid","study","other"];

const statusVariant = {
  pending:  "secondary",
  approved: "default",
  rejected: "destructive",
  cancelled:"outline",
};

function ApplyLeaveDialog({ isOpen, onClose, onSuccess }) {
  const axiosPrivate = useAxiosPrivate();
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    leave_type: "annual",
    start_date: today,
    end_date:   today,
    reason:     "",
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const res = await axiosPrivate.post("/hr/leave", form);
      return res.data;
    },
    onSuccess: () => {
      toast({ title: "Submitted", description: "Leave request submitted successfully" });
      onSuccess?.();
      onClose();
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err?.response?.data?.messages ?? "Failed to submit",
        variant: "destructive",
      });
    },
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Apply for Leave</DialogTitle>
          <DialogClose asChild>
            <button type="button" onClick={onClose} className="absolute right-4 top-4 opacity-70 hover:opacity-100">
              <X className="h-4 w-4" />
            </button>
          </DialogClose>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Leave Type</Label>
            <Select value={form.leave_type} onValueChange={(v) => set("leave_type", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LEAVE_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <DateField label="Start Date" value={form.start_date} onChange={(v) => set("start_date", v)} />
            <DateField label="End Date" value={form.end_date} onChange={(v) => set("end_date", v)} />
          </div>
          <div>
            <Label>Reason *</Label>
            <Textarea
              placeholder="Briefly describe the reason for leave..."
              value={form.reason}
              onChange={(e) => set("reason", e.target.value)}
              className="min-h-[80px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => mutate()} disabled={isPending || !form.reason.trim()}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function LeaveManagement() {
  const axiosPrivate = useAxiosPrivate();
  const queryClient  = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [showDialog, setShowDialog]     = useState(false);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["leave-requests", statusFilter],
    queryFn: async () => {
      const res = await axiosPrivate.get("/hr/leave", {
        params: { start: 0, size: 100, ...(statusFilter !== "all" ? { status: statusFilter } : {}) },
      });
      return res.data?.data ?? {};
    },
  });

  const { mutate: updateStatus, isPending: isUpdating } = useMutation({
    mutationFn: async ({ leaveId, action, rejection_reason }) => {
      const res = await axiosPrivate.patch(`/hr/leave?leave_id=${leaveId}`, { action, rejection_reason });
      return res.data;
    },
    onSuccess: (_, vars) => {
      toast({ title: "Updated", description: `Leave request ${vars.action}d` });
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
    },
    onError: (err) => {
      toast({
        title: "Error",
        description: err?.response?.data?.messages ?? "Failed to update",
        variant: "destructive",
      });
    },
  });

  const records = data?.data ?? [];

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink to="/dashboard">Home</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Leave Management</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="space-y-4 pt-4">
        <div className="flex flex-wrap items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={refetch}>
            {isRefetching ? "Refreshing…" : "Refresh"}
          </Button>
          <Button size="sm" className="ml-auto gap-1" onClick={() => setShowDialog(true)}>
            <Plus className="h-4 w-4" /> Apply for Leave
          </Button>
        </div>

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead className="text-center">Days</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(8)].map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-5 rounded" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">No leave requests found.</TableCell>
                </TableRow>
              ) : (
                records.map((lr) => (
                  <TableRow key={lr.leave_id}>
                    <TableCell className="font-medium whitespace-nowrap">{lr.user_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize text-xs">{lr.leave_type}</Badge>
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{formatDateTimestamp(lr.start_date)}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{formatDateTimestamp(lr.end_date)}</TableCell>
                    <TableCell className="text-center text-sm">{lr.days_requested}</TableCell>
                    <TableCell className="text-xs max-w-[160px] truncate" title={lr.reason}>{lr.reason}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[lr.status] ?? "secondary"} className="capitalize text-xs">
                        {lr.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {lr.status === "pending" && (
                        <div className="flex gap-1">
                          <Button
                            size="icon" variant="ghost" className="h-7 w-7 text-green-600"
                            onClick={() => updateStatus({ leaveId: lr.leave_id, action: "approve" })}
                            disabled={isUpdating}
                            title="Approve"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon" variant="ghost" className="h-7 w-7 text-red-600"
                            onClick={() => updateStatus({ leaveId: lr.leave_id, action: "reject" })}
                            disabled={isUpdating}
                            title="Reject"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                      {lr.status === "approved" && (
                        <Button
                          size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground"
                          onClick={() => updateStatus({ leaveId: lr.leave_id, action: "cancel" })}
                          disabled={isUpdating}
                        >
                          Cancel
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {showDialog && (
        <ApplyLeaveDialog
          isOpen={showDialog}
          onClose={() => setShowDialog(false)}
          onSuccess={refetch}
        />
      )}
    </>
  );
}

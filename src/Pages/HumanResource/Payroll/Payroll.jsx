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
import {
  InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot,
} from "@/components/ui/input-otp";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Plus, Eye, CheckCircle, Send, X, DollarSign, Users, TrendingDown } from "lucide-react";
import { formatDateTimestamp } from "@/lib/utils";

const statusVariant = {
  draft:     "secondary",
  approved:  "default",
  posted:    "outline",
  cancelled: "destructive",
};

function GenerateRunDialog({ isOpen, onClose, onSuccess }) {
  const axiosPrivate = useAxiosPrivate();
  const thisMonth = new Date().toISOString().slice(0, 7);
  const today     = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ payroll_month: thisMonth, payment_date: today, notes: "" });

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const res = await axiosPrivate.post("/hr/payroll", form);
      return res.data;
    },
    onSuccess: (d) => {
      toast({ title: "Generated", description: d?.messages ?? "Payroll run generated" });
      onSuccess?.();
      onClose();
    },
    onError: (err) => {
      toast({ title: "Error", description: err?.response?.data?.messages ?? "Failed to generate", variant: "destructive" });
    },
  });

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Generate Payroll Run</DialogTitle>
          <DialogClose asChild>
            <button type="button" onClick={onClose} className="absolute right-4 top-4 opacity-70 hover:opacity-100"><X className="h-4 w-4" /></button>
          </DialogClose>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Payroll Month *</Label>
            <input type="month" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.payroll_month} onChange={(e) => set("payroll_month", e.target.value)} />
          </div>
          <DateField label="Payment Date *" value={form.payment_date} onChange={(v) => set("payment_date", v)} />
          <div>
            <Label>Notes (optional)</Label>
            <Textarea placeholder="Any remarks..." value={form.notes} onChange={(e) => set("notes", e.target.value)} className="min-h-[60px]" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => mutate()} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Generate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PostRunDialog({ isOpen, run, onClose, onSuccess }) {
  const axiosPrivate = useAxiosPrivate();
  const [pin, setPin] = useState("");

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const res = await axiosPrivate.post("/hr/payroll?action=post", { payroll_run_id: run?.payroll_run_id, user_pincode: pin });
      return res.data;
    },
    onSuccess: () => {
      toast({ title: "Posted", description: "Payroll disbursed and journal entry created" });
      onSuccess?.();
      onClose();
    },
    onError: (err) => {
      toast({ title: "Error", description: err?.response?.data?.messages ?? "Failed to post", variant: "destructive" });
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[360px]">
        <DialogHeader>
          <DialogTitle>Post Payroll — {run?.payroll_month}</DialogTitle>
          <DialogClose asChild>
            <button type="button" onClick={onClose} className="absolute right-4 top-4 opacity-70 hover:opacity-100"><X className="h-4 w-4" /></button>
          </DialogClose>
        </DialogHeader>
        <div className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            Net payout: <span className="font-bold text-foreground">{parseFloat(run?.total_net ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </p>
          <div>
            <Label>Enter PIN to Confirm</Label>
            <div className="flex justify-center mt-2">
              <InputOTP maxLength={4} value={pin} onChange={setPin}>
                <InputOTPGroup className="flex space-x-3 py-4">
                  <InputOTPSlot index={0} className="h-10 w-10 text-center rounded-md" />
                  <InputOTPSlot index={1} className="h-10 w-10 text-center rounded-md" />
                  <InputOTPSeparator />
                  <InputOTPSlot index={2} className="h-10 w-10 text-center rounded-md" />
                  <InputOTPSlot index={3} className="h-10 w-10 text-center rounded-md" />
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => mutate()} disabled={isPending || pin.length < 4}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Post Payroll
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RunItemsDialog({ isOpen, run, onClose }) {
  const axiosPrivate = useAxiosPrivate();
  const { data, isLoading } = useQuery({
    queryKey: ["payroll-items", run?.payroll_run_id],
    queryFn: async () => {
      const res = await axiosPrivate.get("/hr/payroll?action=items", { params: { payroll_run_id: run.payroll_run_id } });
      return res.data?.data ?? {};
    },
    enabled: isOpen && !!run?.payroll_run_id,
  });
  const items = data?.items ?? [];

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[780px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Payslips — {run?.payroll_month}</DialogTitle>
          <DialogClose asChild>
            <button type="button" onClick={onClose} className="absolute right-4 top-4 opacity-70 hover:opacity-100"><X className="h-4 w-4" /></button>
          </DialogClose>
        </DialogHeader>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Job Title</TableHead>
                <TableHead className="text-right">Basic</TableHead>
                <TableHead className="text-right">Allowances</TableHead>
                <TableHead className="text-right">Deductions</TableHead>
                <TableHead className="text-right">Tax</TableHead>
                <TableHead className="text-right font-bold">Net Pay</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(4)].map((_, i) => <TableRow key={i}>{[...Array(8)].map((_, j) => <TableCell key={j}><Skeleton className="h-5 rounded" /></TableCell>)}</TableRow>)
              ) : items.map((item) => (
                <TableRow key={item.item_id}>
                  <TableCell className="font-medium">{item.user_name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{item.job_title || "—"}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{item.basic_salary.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className="text-right font-mono text-sm text-blue-600">+{item.allowances.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className="text-right font-mono text-sm text-red-600">-{item.deductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className="text-right font-mono text-sm text-orange-600">-{item.tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className="text-right font-mono font-bold text-sm">{item.net_salary.toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell><Badge variant={item.status === "paid" ? "default" : "secondary"} className="text-xs capitalize">{item.status}</Badge></TableCell>
                </TableRow>
              ))}
              {items.length > 0 && (
                <TableRow className="bg-muted/40 font-semibold">
                  <TableCell colSpan={2}>Totals</TableCell>
                  <TableCell className="text-right font-mono">{items.reduce((s, i) => s + i.basic_salary, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className="text-right font-mono text-blue-600">+{items.reduce((s, i) => s + i.allowances, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className="text-right font-mono text-red-600">-{items.reduce((s, i) => s + i.deductions, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className="text-right font-mono text-orange-600">-{items.reduce((s, i) => s + i.tax, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className="text-right font-mono">{items.reduce((s, i) => s + i.net_salary, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function PayrollManagement() {
  const axiosPrivate = useAxiosPrivate();
  const queryClient  = useQueryClient();
  const [showGenerate, setShowGenerate] = useState(false);
  const [postRun, setPostRun]           = useState(null);
  const [viewRun, setViewRun]           = useState(null);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["payroll-runs"],
    queryFn: async () => {
      const res = await axiosPrivate.get("/hr/payroll");
      return res.data?.data?.runs ?? [];
    },
  });

  const { mutate: approveRun, isPending: isApproving } = useMutation({
    mutationFn: async (runId) => {
      const res = await axiosPrivate.post("/hr/payroll?action=approve", { payroll_run_id: runId });
      return res.data;
    },
    onSuccess: () => {
      toast({ title: "Approved", description: "Payroll run approved" });
      queryClient.invalidateQueries({ queryKey: ["payroll-runs"] });
    },
    onError: (err) => {
      toast({ title: "Error", description: err?.response?.data?.messages ?? "Failed", variant: "destructive" });
    },
  });

  const runs = data ?? [];
  const totalPosted = runs.filter((r) => r.status === "posted").reduce((s, r) => s + r.total_net, 0);
  const draftCount  = runs.filter((r) => r.status === "draft").length;

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink to="/dashboard">Home</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Payroll</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="space-y-4 pt-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2 flex-row items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Total Posted (Net)</CardTitle>
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{totalPosted.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 flex-row items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{runs.length}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 flex-row items-center gap-2">
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{draftCount}</p></CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={refetch}>{isRefetching ? "Refreshing…" : "Refresh"}</Button>
          <Button size="sm" className="ml-auto gap-1" onClick={() => setShowGenerate(true)}>
            <Plus className="h-4 w-4" /> Generate Payroll Run
          </Button>
        </div>

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Month</TableHead>
                <TableHead>Payment Date</TableHead>
                <TableHead className="text-right">Gross</TableHead>
                <TableHead className="text-right">Deductions</TableHead>
                <TableHead className="text-right font-bold">Net Pay</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(3)].map((_, i) => <TableRow key={i}>{[...Array(9)].map((_, j) => <TableCell key={j}><Skeleton className="h-5 rounded" /></TableCell>)}</TableRow>)
              ) : runs.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No payroll runs yet. Click &ldquo;Generate Payroll Run&rdquo; to start.</TableCell></TableRow>
              ) : runs.map((run) => (
                <TableRow key={run.payroll_run_id}>
                  <TableCell className="font-mono text-xs">{run.payroll_run_code}</TableCell>
                  <TableCell className="font-medium">{run.payroll_month}</TableCell>
                  <TableCell className="text-xs whitespace-nowrap">{formatDateTimestamp(run.payment_date)}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{parseFloat(run.total_gross).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className="text-right font-mono text-sm text-red-600">-{parseFloat(run.total_deductions).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className="text-right font-mono font-bold text-sm">{parseFloat(run.total_net).toLocaleString(undefined, { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell><Badge variant={statusVariant[run.status] ?? "secondary"} className="capitalize text-xs">{run.status}</Badge></TableCell>
                  <TableCell className="text-xs">{run.created_by}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="View Payslips" onClick={() => setViewRun(run)}><Eye className="h-3.5 w-3.5" /></Button>
                      {run.status === "draft" && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-600" title="Approve" onClick={() => approveRun(run.payroll_run_id)} disabled={isApproving}><CheckCircle className="h-3.5 w-3.5" /></Button>
                      )}
                      {run.status === "approved" && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600" title="Post & Disburse" onClick={() => setPostRun(run)}><Send className="h-3.5 w-3.5" /></Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {showGenerate && <GenerateRunDialog isOpen={showGenerate} onClose={() => setShowGenerate(false)} onSuccess={() => queryClient.invalidateQueries({ queryKey: ["payroll-runs"] })} />}
      {postRun && <PostRunDialog isOpen={!!postRun} run={postRun} onClose={() => setPostRun(null)} onSuccess={() => queryClient.invalidateQueries({ queryKey: ["payroll-runs"] })} />}
      {viewRun && <RunItemsDialog isOpen={!!viewRun} run={viewRun} onClose={() => setViewRun(null)} />}
    </>
  );
}

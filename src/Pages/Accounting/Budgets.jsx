import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Plus, TrendingUp, BarChart3, FileText, CheckCircle2, Clock, XCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const fmt = (n) => new Intl.NumberFormat("en-UG", { maximumFractionDigits: 0 }).format(n ?? 0);

const statusConfig = {
  draft:     { label: "Draft",     variant: "secondary",    icon: <FileText size={12} /> },
  submitted: { label: "Submitted", variant: "outline",      icon: <Clock size={12} /> },
  approved:  { label: "Approved",  variant: "default",      icon: <CheckCircle2 size={12} /> },
  rejected:  { label: "Rejected",  variant: "destructive",  icon: <XCircle size={12} /> },
};

function StatusBadge({ status }) {
  const cfg = statusConfig[status] ?? statusConfig.draft;
  return (
    <Badge variant={cfg.variant} className="flex items-center gap-1 w-fit text-xs">
      {cfg.icon} {cfg.label}
    </Badge>
  );
}

export default function Budgets() {
  const axios = useAxiosPrivate();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ budget_name: "", budget_year: new Date().getFullYear().toString(), budget_description: "" });

  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ["budgets"],
    queryFn: async () => {
      const res = await axios.get("accounting/budgets");
      return res.data?.data ?? [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload) => axios.post("accounting/budgets", payload),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["budgets"] });
      setOpen(false);
      navigate(`/budgets/${res.data?.data?.budget_id}`);
    },
  });

  const years = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 1 + i);

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink to="/dashboard">Home</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Budgets</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-1 space-y-4 p-0 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h5 className="text-2xl font-bold tracking-tight">Budget Management</h5>
            <p className="text-sm text-muted-foreground">Create and manage annual income &amp; expense budgets</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus size={16} className="mr-1" /> New Budget</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Budget</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label>Budget Name</Label>
                  <Input placeholder="e.g. FY2025 Operating Budget" value={form.budget_name}
                    onChange={e => setForm(f => ({ ...f, budget_name: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Budget Year</Label>
                  <Select value={form.budget_year} onValueChange={v => setForm(f => ({ ...f, budget_year: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Description <span className="text-muted-foreground text-xs">(optional)</span></Label>
                  <Textarea rows={2} value={form.budget_description}
                    onChange={e => setForm(f => ({ ...f, budget_description: e.target.value }))} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={() => createMutation.mutate({ ...form, budget_year: parseInt(form.budget_year) })}
                  disabled={!form.budget_name || createMutation.isPending}>
                  {createMutation.isPending ? "Creating…" : "Create Budget"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => <Card key={i} className="h-40 animate-pulse bg-muted/20" />)}
          </div>
        ) : budgets.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <BarChart3 size={40} className="text-muted-foreground/40 mb-3" />
              <p className="font-medium text-muted-foreground">No budgets yet</p>
              <p className="text-xs text-muted-foreground mt-1">Create your first annual budget to start tracking income and expenses</p>
              <Button size="sm" className="mt-4" onClick={() => setOpen(true)}><Plus size={14} className="mr-1" /> Create Budget</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {budgets.map(b => (
              <Link key={b.budget_id} to={`/budgets/${b.budget_id}`}>
                <Card className="h-full hover:shadow-md hover:border-primary/30 transition-all cursor-pointer group">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base group-hover:text-primary transition-colors">{b.budget_name}</CardTitle>
                        <CardDescription className="text-xs mt-0.5">{b.budget_year} · {b.created_by_name}</CardDescription>
                      </div>
                      <StatusBadge status={b.budget_status} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 p-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Income Budget</p>
                        <p className="text-sm font-bold tabular-nums text-emerald-700 dark:text-emerald-400">UGX {fmt(b.total_income_budget)}</p>
                      </div>
                      <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-red-700 dark:text-red-400">Expense Budget</p>
                        <p className="text-sm font-bold tabular-nums text-red-700 dark:text-red-400">UGX {fmt(b.total_expense_budget)}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Net surplus: <span className={`font-semibold ${(b.total_income_budget - b.total_expense_budget) >= 0 ? "text-emerald-600" : "text-red-600"}`}>UGX {fmt(b.total_income_budget - b.total_expense_budget)}</span></span>
                      <span className="flex items-center gap-1 text-primary group-hover:underline">View <ArrowRight size={12} /></span>
                    </div>
                    {b.budget_status === 'approved' && (
                      <Link to={`/budgets/${b.budget_id}/variance`} onClick={e => e.stopPropagation()}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                        <TrendingUp size={12} /> View variance report
                      </Link>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

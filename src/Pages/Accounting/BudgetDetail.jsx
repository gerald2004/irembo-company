/* eslint-disable react/prop-types */
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useState, useMemo, useCallback } from "react";
import {
  Save, Send, CheckCircle2, XCircle, TrendingUp, Loader2,
  ChevronDown, ChevronRight, Info,
} from "lucide-react";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const fmt  = (n) => new Intl.NumberFormat("en-UG", { maximumFractionDigits: 0 }).format(n ?? 0);
const nfmt = (n) => (n == null || n === "" || n === 0) ? "" : fmt(n);

const statusBadge = {
  draft:     <Badge variant="secondary">Draft</Badge>,
  submitted: <Badge variant="outline">Submitted</Badge>,
  approved:  <Badge variant="default">Approved</Badge>,
  rejected:  <Badge variant="destructive">Rejected</Badge>,
};

function AmountCell({ value, onChange, readOnly }) {
  const [raw, setRaw] = useState("");
  const [focused, setFocused] = useState(false);

  const display = focused ? raw : (value ? nfmt(value) : "");

  return (
    <input
      type="text"
      readOnly={readOnly}
      value={display}
      onFocus={() => { setRaw(value ? String(value) : ""); setFocused(true); }}
      onBlur={() => { setFocused(false); onChange(parseFloat(raw.replace(/,/g, "")) || 0); }}
      onChange={e => setRaw(e.target.value.replace(/[^0-9.]/g, ""))}
      className={`w-full text-right text-xs tabular-nums px-1 py-1 rounded border-0 outline-none focus:ring-1 focus:ring-primary bg-transparent ${readOnly ? "cursor-default text-muted-foreground" : "hover:bg-muted/40 focus:bg-background focus:ring-inset"}`}
    />
  );
}

function AccountGroup({ groupName, accountType, accounts, budgetData, onAmountChange, readOnly, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  const groupMonthTotals = useMemo(() =>
    Array.from({ length: 12 }, (_, mi) =>
      accounts.reduce((s, a) => s + (budgetData[a.account_id]?.[mi + 1] ?? 0), 0)
    ), [accounts, budgetData]);
  const groupAnnual = groupMonthTotals.reduce((s, v) => s + v, 0);

  return (
    <tbody>
      <tr className="bg-muted/30 cursor-pointer" onClick={() => setOpen(o => !o)}>
        <td colSpan={15} className="px-3 py-2 text-xs font-semibold text-foreground sticky left-0 bg-muted/30">
          <span className="flex items-center gap-1.5">
            {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            {groupName}
            <span className="font-normal text-muted-foreground ml-1">({accounts.length} accounts)</span>
          </span>
        </td>
      </tr>
      {open && accounts.map(acc => {
        const months = budgetData[acc.account_id] ?? {};
        const annual = Object.values(months).reduce((s, v) => s + (v ?? 0), 0);
        return (
          <tr key={acc.account_id} className="border-b hover:bg-muted/10 transition-colors">
            <td className="sticky left-0 bg-background px-3 py-1 z-10 min-w-[240px] max-w-[260px]">
              <p className="text-xs font-medium truncate" title={acc.account_title}>{acc.account_title}</p>
              <p className="text-[10px] text-muted-foreground">{acc.account_code}</p>
            </td>
            {Array.from({ length: 12 }, (_, mi) => (
              <td key={mi} className="min-w-[90px] px-0.5">
                <AmountCell
                  value={months[mi + 1] ?? 0}
                  readOnly={readOnly}
                  onChange={v => onAmountChange(acc.account_id, mi + 1, v)}
                />
              </td>
            ))}
            <td className="min-w-[110px] px-2 text-right text-xs font-semibold tabular-nums">
              {fmt(annual)}
            </td>
          </tr>
        );
      })}
      {open && (
        <tr className={`font-semibold text-xs ${accountType === 'Income' ? 'bg-emerald-50/60 dark:bg-emerald-900/10' : 'bg-red-50/60 dark:bg-red-900/10'}`}>
          <td className="sticky left-0 px-3 py-1.5 text-xs font-semibold bg-inherit z-10">Subtotal — {groupName}</td>
          {groupMonthTotals.map((t, mi) => (
            <td key={mi} className="px-2 text-right text-xs tabular-nums">{t > 0 ? fmt(t) : "—"}</td>
          ))}
          <td className="px-2 text-right text-xs tabular-nums font-bold">{fmt(groupAnnual)}</td>
        </tr>
      )}
    </tbody>
  );
}

export default function BudgetDetail() {
  const { budgetId } = useParams();
  const axios = useAxiosPrivate();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [budgetData, setBudgetData] = useState({});  // { account_id: { 1: amt, ..., 12: amt } }
  const [dirty, setDirty] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [activeType, setActiveType] = useState("Income");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["budget-detail", budgetId],
    queryFn: async () => {
      const res = await axios.get(`accounting/budgets/${budgetId}/detail`);
      return res.data?.data;
    },
    onSuccess: (d) => {
      // Seed local state from API data
      const initial = {};
      for (const acc of (d?.accounts ?? [])) {
        initial[acc.account_id] = { ...acc.months };
      }
      setBudgetData(initial);
      setDirty(false);
    },
  });

  // Also seed when data first arrives
  useMemo(() => {
    if (!data) return;
    const initial = {};
    for (const acc of (data?.accounts ?? [])) {
      initial[acc.account_id] = { ...acc.months };
    }
    setBudgetData(initial);
  }, [data]);

  const budget   = data?.budget;
  const accounts = data?.accounts ?? [];
  const summary  = data?.summary ?? {};
  const readOnly = budget?.budget_status === 'approved';

  const incomeAccounts  = useMemo(() => accounts.filter(a => a.account_type === 'Income'), [accounts]);
  const expenseAccounts = useMemo(() => accounts.filter(a => a.account_type === 'Expenses'), [accounts]);

  // Group by sub_group within each type
  const groupBy = (accs) => {
    const map = {};
    for (const a of accs) {
      if (!map[a.sub_group]) map[a.sub_group] = [];
      map[a.sub_group].push(a);
    }
    return map;
  };

  const incomeGroups  = useMemo(() => groupBy(incomeAccounts),  [incomeAccounts]);
  const expenseGroups = useMemo(() => groupBy(expenseAccounts), [expenseAccounts]);

  const onAmountChange = useCallback((accountId, month, value) => {
    setBudgetData(prev => ({
      ...prev,
      [accountId]: { ...(prev[accountId] ?? {}), [month]: value },
    }));
    setDirty(true);
  }, []);

  // Compute live totals from budgetData
  const liveMonthTotals = useMemo(() => {
    const income  = Array(12).fill(0);
    const expense = Array(12).fill(0);
    for (const acc of incomeAccounts) {
      for (let m = 1; m <= 12; m++) income[m-1]  += budgetData[acc.account_id]?.[m] ?? 0;
    }
    for (const acc of expenseAccounts) {
      for (let m = 1; m <= 12; m++) expense[m-1] += budgetData[acc.account_id]?.[m] ?? 0;
    }
    return { income, expense };
  }, [budgetData, incomeAccounts, expenseAccounts]);

  const totalIncome  = liveMonthTotals.income.reduce((s, v) => s + v, 0);
  const totalExpense = liveMonthTotals.expense.reduce((s, v) => s + v, 0);

  const saveMutation = useMutation({
    mutationFn: () => {
      const lines = [];
      for (const [accountId, months] of Object.entries(budgetData)) {
        for (const [month, amount] of Object.entries(months)) {
          if (amount > 0) lines.push({ account_id: parseInt(accountId), period_month: parseInt(month), budgeted_amount: amount });
        }
      }
      return axios.post(`accounting/budgets/${budgetId}/lines`, { lines });
    },
    onSuccess: () => { setDirty(false); qc.invalidateQueries({ queryKey: ["budget-detail", budgetId] }); },
  });

  const statusMutation = useMutation({
    mutationFn: ({ action, payload }) => axios.post(`accounting/budgets/${budgetId}/status/${action}`, payload ?? {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["budget-detail", budgetId] }); qc.invalidateQueries({ queryKey: ["budgets"] }); },
  });

  if (isLoading) return <div className="flex items-center justify-center py-24"><Loader2 className="animate-spin text-muted-foreground" /></div>;
  if (isError || !budget) return <div className="py-10 text-center text-muted-foreground">Budget not found.</div>;

  const activeGroups  = activeType === 'Income' ? incomeGroups : expenseGroups;
  const activeAccType = activeType;

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink to="/dashboard">Home</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink to="/budgets">Budgets</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>{budget.budget_name}</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-1 space-y-4 pt-2">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h5 className="text-2xl font-bold tracking-tight">{budget.budget_name}</h5>
              {statusBadge[budget.budget_status]}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{budget.budget_year} · {budget.budget_description}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {budget.budget_status === 'approved' && (
              <Link to={`/budgets/${budgetId}/variance`}>
                <Button variant="outline" size="sm"><TrendingUp size={14} className="mr-1" /> Variance Report</Button>
              </Link>
            )}
            {!readOnly && dirty && (
              <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? <><Loader2 size={14} className="mr-1 animate-spin" /> Saving…</> : <><Save size={14} className="mr-1" /> Save Changes</>}
              </Button>
            )}
            {budget.budget_status === 'draft' && (
              <Button size="sm" variant="secondary" onClick={() => statusMutation.mutate({ action: 'submit' })} disabled={statusMutation.isPending}>
                <Send size={14} className="mr-1" /> Submit for Approval
              </Button>
            )}
            {budget.budget_status === 'submitted' && (
              <>
                <Button size="sm" onClick={() => statusMutation.mutate({ action: 'approve' })} disabled={statusMutation.isPending}>
                  <CheckCircle2 size={14} className="mr-1" /> Approve
                </Button>
                <Button size="sm" variant="destructive" onClick={() => setRejectDialog(true)}>
                  <XCircle size={14} className="mr-1" /> Reject
                </Button>
              </>
            )}
          </div>
        </div>

        {budget.budget_status === 'rejected' && (
          <Alert variant="destructive">
            <AlertDescription>Rejected: {budget.rejection_reason}</AlertDescription>
          </Alert>
        )}

        {/* KPI Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-lg border bg-card p-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Total Income Budget</p>
            <p className="text-xl font-bold text-emerald-600 tabular-nums mt-0.5">UGX {fmt(totalIncome)}</p>
            <p className="text-[10px] text-muted-foreground">{incomeAccounts.length} income accounts</p>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Total Expense Budget</p>
            <p className="text-xl font-bold text-red-600 tabular-nums mt-0.5">UGX {fmt(totalExpense)}</p>
            <p className="text-[10px] text-muted-foreground">{expenseAccounts.length} expense accounts</p>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Net Surplus / Deficit</p>
            <p className={`text-xl font-bold tabular-nums mt-0.5 ${totalIncome - totalExpense >= 0 ? "text-blue-600" : "text-orange-600"}`}>
              UGX {fmt(Math.abs(totalIncome - totalExpense))}
            </p>
            <p className="text-[10px] text-muted-foreground">{totalIncome - totalExpense >= 0 ? "Surplus" : "Deficit"}</p>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Cost Ratio</p>
            <p className="text-xl font-bold tabular-nums mt-0.5">
              {totalIncome > 0 ? ((totalExpense / totalIncome) * 100).toFixed(1) : 0}%
            </p>
            <p className="text-[10px] text-muted-foreground">Expenses / Income</p>
          </div>
        </div>

        {/* Tab toggle */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1 w-fit">
          {["Income", "Expenses"].map(t => (
            <button key={t} onClick={() => setActiveType(t)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeType === t ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Spreadsheet */}
        <div className="border rounded-lg overflow-auto max-h-[calc(100vh-380px)]">
          <table className="text-xs w-full border-collapse" style={{ minWidth: 1400 }}>
            <thead className="sticky top-0 z-20 bg-background border-b">
              <tr>
                <th className="sticky left-0 bg-background z-30 px-3 py-2.5 text-left font-semibold min-w-[240px]">Account</th>
                {MONTHS.map(m => <th key={m} className="px-1 py-2.5 text-right font-semibold min-w-[90px]">{m}</th>)}
                <th className="px-2 py-2.5 text-right font-semibold min-w-[110px]">Annual Total</th>
              </tr>
            </thead>

            {Object.entries(activeGroups).map(([groupName, accs]) => (
              <AccountGroup
                key={groupName}
                groupName={groupName}
                accountType={activeAccType}
                accounts={accs}
                budgetData={budgetData}
                onAmountChange={onAmountChange}
                readOnly={readOnly}
              />
            ))}

            {/* Grand total row */}
            <tfoot className="sticky bottom-0 z-20">
              <tr className={`font-bold text-sm border-t-2 ${activeType === 'Income' ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                <td className="sticky left-0 px-3 py-2 font-bold z-10 bg-inherit">Total {activeType}</td>
                {liveMonthTotals[activeType === 'Income' ? 'income' : 'expense'].map((t, mi) => (
                  <td key={mi} className="px-2 text-right tabular-nums">{t > 0 ? fmt(t) : "—"}</td>
                ))}
                <td className="px-2 text-right tabular-nums font-bold">{fmt(activeType === 'Income' ? totalIncome : totalExpense)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {!readOnly && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Info size={12} />
            Click any cell to edit the budgeted amount. Changes are saved when you click Save.
          </div>
        )}
      </div>

      {/* Reject dialog */}
      <Dialog open={rejectDialog} onOpenChange={setRejectDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject Budget</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Reason for rejection</Label>
            <Textarea rows={3} value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Explain why this budget is being rejected…" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(false)}>Cancel</Button>
            <Button variant="destructive" disabled={!rejectReason || statusMutation.isPending}
              onClick={() => { statusMutation.mutate({ action: 'reject', payload: { rejection_reason: rejectReason } }); setRejectDialog(false); }}>
              Reject Budget
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

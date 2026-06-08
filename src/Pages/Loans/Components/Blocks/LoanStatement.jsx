/* eslint-disable react/prop-types */
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import {
  FileDown, FileSpreadsheet, RefreshCw,
  ArrowDownLeft, ArrowUpRight, Printer,
  CheckCircle2, Clock, AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import useAxiosPrivate from '@/MiddleWares/Hooks/useAxiosPrivate';
import { useToast } from '@/hooks/use-toast';
import fileDownload from 'js-file-download';

// ─── helpers ─────────────────────────────────────────────────────────────────

const fmt = (n) =>
  Number(n ?? 0).toLocaleString('en-UG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  return isNaN(dt) ? d : dt.toLocaleDateString('en-UG', { day: '2-digit', month: 'short', year: 'numeric' });
};

const pct = (paid, total) => {
  const t = Number(total);
  if (!t) return 0;
  return Math.min(100, Math.round((Number(paid) / t) * 100));
};

// Map raw transaction types to human-readable labels
const TX_LABEL = {
  disbursement:    'Loan Disbursed',
  principal:       'Principal Repayment',
  interest:        'Interest Repayment',
  penalty:         'Penalty Payment',
  penalty_accrual: 'Penalty Charged',
  penalty_waiver:  'Penalty Waived',
  monitoring:      'Monitoring Fee Paid',
};

// Types that REDUCE the outstanding balance (repayments / waivers)
const CREDIT_TYPES = new Set(['principal', 'interest', 'penalty', 'penalty_waiver', 'monitoring']);

// Types that INCREASE the outstanding balance
const DEBIT_TYPES  = new Set(['disbursement', 'penalty_accrual']);

const scheduleStatusConfig = {
  paid:    { label: 'Paid',    cls: 'bg-emerald-100 text-emerald-800' },
  partial: { label: 'Partial', cls: 'bg-amber-100  text-amber-800'   },
  notpaid: { label: 'Unpaid',  cls: 'bg-red-100    text-red-700'     },
};

function StatusBadge({ status }) {
  const cfg = scheduleStatusConfig[status] ?? { label: status, cls: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

// ─── sub-components ───────────────────────────────────────────────────────────

function ComponentCard({ label, total, paid }) {
  const remaining = Math.max(0, Number(total) - Number(paid));
  const progress  = pct(paid, total);
  return (
    <Card className="flex-1 min-w-[160px]">
      <CardHeader className="pb-1 pt-3 px-4">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3 space-y-2">
        <p className="text-base font-bold tabular-nums">UGX {fmt(total)}</p>
        <Progress value={progress} className="h-1.5" />
        <div className="flex justify-between text-xs">
          <span className="text-emerald-600 font-medium">Paid: {fmt(paid)}</span>
          <span className="text-red-500 font-medium">Due: {fmt(remaining)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── build running-balance ledger from flat transactions ──────────────────────
function buildLedger(transactions) {
  let balance = 0;
  return transactions.map((tx) => {
    if (DEBIT_TYPES.has(tx.type)) {
      balance += Number(tx.amount);
    } else if (CREDIT_TYPES.has(tx.type)) {
      balance -= Number(tx.amount);
    }
    return { ...tx, runningBalance: Math.max(0, balance) };
  });
}

// Group individual component rows that share a transaction code into one
function groupTransactions(transactions) {
  const order = [];
  const map   = {};
  for (const tx of transactions) {
    if (!map[tx.code]) {
      map[tx.code] = { ...tx, _parts: [tx] };
      order.push(map[tx.code]);
    } else {
      map[tx.code]._parts.push(tx);
      // Use the LAST running balance in the group (the fully-applied balance)
      map[tx.code].runningBalance = tx.runningBalance;
      // Keep debit / credit amounts per component
    }
  }
  return order;
}

// ─── main component ───────────────────────────────────────────────────────────

export default function LoanStatement({ loanId }) {
  const axios = useAxiosPrivate();
  const { toast } = useToast();
  const [exporting, setExporting] = useState(null);

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ['loan-statement', loanId],
    queryFn: async () => {
      const res = await axios.get(`loans/${loanId}/statement`);
      return res.data?.data;
    },
    enabled: !!loanId,
  });

  const handleExport = async (format) => {
    setExporting(format);
    try {
      const res = await axios.get(
        `export/loan-statement/${format}?loan_application_id=${loanId}`,
        { responseType: 'blob' }
      );
      const ext  = format === 'pdf' ? 'pdf' : 'xlsx';
      const code = data?.loan?.code ?? loanId;
      fileDownload(res.data, `loan-statement-${code}.${ext}`);
    } catch {
      toast({ title: 'Export failed', description: 'Could not generate the export.', variant: 'destructive' });
    } finally {
      setExporting(null);
    }
  };

  if (isLoading || isRefetching) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
        <RefreshCw className="w-5 h-5 animate-spin" /> Loading statement…
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-muted-foreground">
        <p>Failed to load loan statement.</p>
        <Button size="sm" variant="outline" onClick={refetch}>Retry</Button>
      </div>
    );
  }

  const { loan, client, summary, transactions, schedules } = data;

  // Overall repayment progress
  const totalDue  = summary.total_principal + summary.total_interest + summary.total_penalties + summary.total_monitoring;
  const totalPaid = summary.paid_principal  + summary.paid_interest  + summary.paid_penalties  + summary.paid_monitoring;
  const overallPct = pct(totalPaid, totalDue);

  // Build running balance ledger then group
  const ledger  = buildLedger(transactions);
  const grouped = groupTransactions(ledger);

  // Schedule totals footer
  const schTotals = (schedules ?? []).reduce(
    (acc, s) => ({
      principal:        acc.principal        + s.principal,
      interest:         acc.interest         + s.interest,
      penalties:        acc.penalties        + s.penalties,
      monitoring:       acc.monitoring       + s.monitoring,
      principal_paid:   acc.principal_paid   + s.principal_paid,
      interest_paid:    acc.interest_paid    + s.interest_paid,
      penalty_paid:     acc.penalty_paid     + s.penalty_paid,
      monitoring_paid:  acc.monitoring_paid  + s.monitoring_paid,
    }),
    { principal: 0, interest: 0, penalties: 0, monitoring: 0,
      principal_paid: 0, interest_paid: 0, penalty_paid: 0, monitoring_paid: 0 }
  );

  const loanStatus = (loan.status_after_disbursement ?? loan.status ?? '').toLowerCase();
  const statusColor = {
    disbursed:  'bg-blue-100  text-blue-800',
    settled:    'bg-emerald-100 text-emerald-800',
    paid_off:   'bg-green-100 text-green-800',
    writtenoff: 'bg-gray-100  text-gray-600',
    defaulted:  'bg-red-100   text-red-700',
    overdue:    'bg-orange-100 text-orange-800',
  }[loanStatus] ?? 'bg-muted text-muted-foreground';

  return (
    <div className="space-y-6 pb-8">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-bold">Loan Account Statement</h2>
            <Badge className={`capitalize text-xs ${statusColor}`}>{loanStatus.replace(/_/g, ' ')}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{client.name}</span>
            {' · '}Account: <span className="font-medium">{client.account_number}</span>
            {' · '}Ref: <span className="font-mono text-xs">{loan.code}</span>
          </p>
          <p className="text-xs text-muted-foreground">Statement generated: {fmtDate(new Date())}</p>
        </div>

        <div className="flex gap-2 flex-wrap shrink-0">
          <Button size="sm" variant="outline" onClick={() => window.print()} className="print:hidden">
            <Printer className="w-4 h-4 mr-1" /> Print
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleExport('pdf')} disabled={!!exporting}>
            <FileDown className="w-4 h-4 mr-1" />
            {exporting === 'pdf' ? 'Exporting…' : 'PDF'}
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleExport('excel')} disabled={!!exporting}>
            <FileSpreadsheet className="w-4 h-4 mr-1" />
            {exporting === 'excel' ? 'Exporting…' : 'Excel'}
          </Button>
          <Button size="sm" variant="ghost" onClick={refetch} disabled={isRefetching}>
            <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* ── Loan Details ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {[
          { label: 'Loan Product',      value: loan.product ?? '—' },
          { label: 'Amount Disbursed',  value: `UGX ${fmt(loan.amount)}` },
          { label: 'Disbursement Date', value: fmtDate(loan.disbursement_date) },
          { label: 'Tenure',            value: `${loan.tenure} months` },
          { label: 'Interest Rate',     value: `${fmt(loan.interest_rate)}% p.a.` },
        ].map(({ label, value }) => (
          <div key={label} className="bg-muted/30 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
            <p className="text-sm font-semibold">{value}</p>
          </div>
        ))}
      </div>

      {/* ── Outstanding Balance ─────────────────────────────────────── */}
      <Card className="border-2 border-primary/20 bg-primary/3">
        <CardContent className="pt-4 pb-4 px-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Outstanding Balance</p>
              <p className="text-3xl font-bold text-primary">UGX {fmt(summary.outstanding)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {overallPct}% of UGX {fmt(totalDue)} repaid
              </p>
            </div>
            <div className="sm:w-56 space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Repaid</span>
                <span>UGX {fmt(totalPaid)}</span>
              </div>
              <Progress value={overallPct} className="h-3 rounded-full" />
              <div className="flex justify-between text-xs">
                <span className="text-emerald-600 font-medium">0</span>
                <span className="text-red-500 font-medium">UGX {fmt(totalDue)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Component Breakdown ─────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3">
        <ComponentCard label="Principal"      total={summary.total_principal}  paid={summary.paid_principal}  />
        <ComponentCard label="Interest"       total={summary.total_interest}   paid={summary.paid_interest}   />
        <ComponentCard label="Penalties"      total={summary.total_penalties}  paid={summary.paid_penalties}  />
        <ComponentCard label="Monitoring Fee" total={summary.total_monitoring} paid={summary.paid_monitoring} />
      </div>

      {/* ── Tabs: Ledger / Schedule ─────────────────────────────────── */}
      <Tabs defaultValue="ledger">
        <TabsList className="mb-3">
          <TabsTrigger value="ledger">Repayment History ({grouped.length})</TabsTrigger>
          <TabsTrigger value="schedule">Installment Schedule ({(schedules ?? []).length})</TabsTrigger>
        </TabsList>

        {/* ── Transaction Ledger ────────────────────────────────────── */}
        <TabsContent value="ledger">
          {grouped.length === 0 ? (
            <div className="border rounded-lg py-14 text-center text-sm text-muted-foreground">
              No transactions recorded yet.
            </div>
          ) : (
            <div className="border rounded-lg overflow-auto">
              <table className="w-full text-xs min-w-[640px]">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">#</th>
                    <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">Date</th>
                    <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground">Description</th>
                    <th className="px-4 py-2.5 text-right font-semibold text-blue-600">Loan Drawn</th>
                    <th className="px-4 py-2.5 text-right font-semibold text-emerald-600">Amount Paid</th>
                    <th className="px-4 py-2.5 text-right font-semibold text-muted-foreground">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {grouped.map((g, i) => {
                    const isDisbursement = g.type === 'disbursement' && g._parts.length === 1;
                    const isAccrual      = g.type === 'penalty_accrual' && g._parts.length === 1;
                    const isRepayment    = g._parts.some(p => CREDIT_TYPES.has(p.type));

                    // Build readable description
                    let description;
                    if (g._parts.length > 1) {
                      // Multi-component repayment: list each part
                      const parts = g._parts.map(p =>
                        `${TX_LABEL[p.type] ?? p.type} — UGX ${fmt(p.amount)}`
                      );
                      description = parts.join(', ');
                    } else {
                      description = TX_LABEL[g.type] ?? g.type;
                    }

                    // Total drawn vs paid for this group
                    const drawnAmt = g._parts
                      .filter(p => DEBIT_TYPES.has(p.type))
                      .reduce((s, p) => s + Number(p.amount), 0);
                    const paidAmt = g._parts
                      .filter(p => CREDIT_TYPES.has(p.type))
                      .reduce((s, p) => s + Number(p.amount), 0);

                    return (
                      <tr key={g.code + i} className="border-b hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-2 text-muted-foreground">{i + 1}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-muted-foreground">
                          {fmtDate(g.date)}
                        </td>
                        <td className="px-4 py-2 max-w-xs">
                          <div className="flex items-start gap-1.5">
                            {isDisbursement && (
                              <ArrowDownLeft className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                            )}
                            {isRepayment && !isDisbursement && (
                              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                            )}
                            {isAccrual && (
                              <AlertTriangle className="w-3.5 h-3.5 text-orange-500 mt-0.5 shrink-0" />
                            )}
                            <span className="text-foreground leading-relaxed">{description}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-right font-medium tabular-nums text-blue-700">
                          {drawnAmt > 0 ? `UGX ${fmt(drawnAmt)}` : '—'}
                        </td>
                        <td className="px-4 py-2 text-right font-medium tabular-nums text-emerald-700">
                          {paidAmt > 0 ? `UGX ${fmt(paidAmt)}` : '—'}
                        </td>
                        <td className="px-4 py-2 text-right font-semibold tabular-nums">
                          UGX {fmt(g.runningBalance)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-muted/40 border-t">
                  <tr>
                    <td colSpan={3} className="px-4 py-2.5 font-semibold text-right text-sm">Totals</td>
                    <td className="px-4 py-2.5 text-right font-bold tabular-nums text-blue-700">
                      UGX {fmt(transactions.filter(t => DEBIT_TYPES.has(t.type)).reduce((s, t) => s + Number(t.amount), 0))}
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold tabular-nums text-emerald-700">
                      UGX {fmt(transactions.filter(t => CREDIT_TYPES.has(t.type)).reduce((s, t) => s + Number(t.amount), 0))}
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold tabular-nums text-primary">
                      UGX {fmt(summary.outstanding)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </TabsContent>

        {/* ── Installment Schedule ──────────────────────────────────── */}
        <TabsContent value="schedule">
          {!schedules?.length ? (
            <div className="border rounded-lg py-14 text-center text-sm text-muted-foreground">
              No schedule found.
            </div>
          ) : (
            <div className="border rounded-lg overflow-auto">
              <table className="w-full text-xs min-w-[700px]">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground">#</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground">Due Date</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-muted-foreground">Principal</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-muted-foreground">Interest</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-muted-foreground">Penalties</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-muted-foreground">Monitoring</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-muted-foreground">Total Due</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-emerald-600">Paid</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-red-500">Balance</th>
                    <th className="px-3 py-2.5 text-center font-semibold text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((s, i) => {
                    const totalInstalment = s.principal + s.interest + s.penalties + s.monitoring;
                    const paidInstalment  = s.principal_paid + s.interest_paid + s.penalty_paid + s.monitoring_paid;
                    const balance         = Math.max(0, totalInstalment - paidInstalment);
                    const isFullyPaid     = balance === 0 && paidInstalment > 0;
                    const isPast          = new Date(s.due_date) < new Date() && s.status !== 'paid';
                    return (
                      <tr
                        key={i}
                        className={`border-b transition-colors ${
                          isFullyPaid ? 'bg-emerald-50/40 hover:bg-emerald-50/60 dark:bg-emerald-950/10' :
                          isPast      ? 'bg-red-50/30    hover:bg-red-50/50    dark:bg-red-950/10' :
                                        'hover:bg-muted/20'
                        }`}
                      >
                        <td className="px-3 py-2 text-muted-foreground">{s.no}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            {isFullyPaid && <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />}
                            {isPast      && <Clock className="w-3 h-3 text-red-500 shrink-0" />}
                            {fmtDate(s.due_date)}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">{fmt(s.principal)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{fmt(s.interest)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {s.penalties > 0 ? <span className="text-orange-600">{fmt(s.penalties)}</span> : '—'}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {s.monitoring > 0 ? fmt(s.monitoring) : '—'}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums font-semibold">
                          {fmt(totalInstalment)}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-emerald-700 font-medium">
                          {paidInstalment > 0 ? fmt(paidInstalment) : '—'}
                        </td>
                        <td className={`px-3 py-2 text-right tabular-nums font-semibold ${balance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                          {balance > 0 ? fmt(balance) : '✓'}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <StatusBadge status={s.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-muted/40 border-t font-semibold text-xs">
                  <tr>
                    <td colSpan={2} className="px-3 py-2.5 text-right">Totals</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{fmt(schTotals.principal)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{fmt(schTotals.interest)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-orange-600">{fmt(schTotals.penalties)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{fmt(schTotals.monitoring)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-bold">
                      {fmt(schTotals.principal + schTotals.interest + schTotals.penalties + schTotals.monitoring)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-emerald-700">
                      {fmt(schTotals.principal_paid + schTotals.interest_paid + schTotals.penalty_paid + schTotals.monitoring_paid)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-red-600 font-bold">
                      {fmt(summary.outstanding)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

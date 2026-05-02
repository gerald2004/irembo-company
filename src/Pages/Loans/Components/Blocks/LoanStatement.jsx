/* eslint-disable react/prop-types */
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { FileDown, FileSpreadsheet, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import useAxiosPrivate from '@/MiddleWares/Hooks/useAxiosPrivate';
import { useToast } from '@/hooks/use-toast';
import fileDownload from 'js-file-download';

const TYPE_LABELS = {
  disbursement:    'Disbursement',
  principal:       'Principal Payment',
  interest:        'Interest Payment',
  penalty:         'Penalty Payment',
  penalty_accrual: 'Penalty Accrual',
  monitoring:      'Monitoring Fee',
};

const TYPE_BADGE = {
  disbursement:    'bg-blue-100 text-blue-800',
  principal:       'bg-emerald-100 text-emerald-800',
  interest:        'bg-amber-100 text-amber-800',
  penalty:         'bg-orange-100 text-orange-800',
  penalty_accrual: 'bg-red-100 text-red-800',
  monitoring:      'bg-purple-100 text-purple-800',
};

const fmt = (n) => Number(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function SummaryCard({ label, total, paid, color = 'blue' }) {
  const remaining = (Number(total) - Number(paid)).toFixed(2);
  return (
    <Card className="flex-1 min-w-[180px]">
      <CardHeader className="pb-1 pt-3 px-4">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3 space-y-1">
        <p className="text-lg font-bold">{fmt(total)}</p>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span className="text-emerald-600">Paid: {fmt(paid)}</span>
          <span className="text-red-500">Due: {fmt(remaining)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

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
      const ext = format === 'pdf' ? 'pdf' : 'xlsx';
      const code = data?.loan?.code ?? loanId;
      fileDownload(res.data, `loan-statement-${code}.${ext}`);
    } catch {
      toast({
        title: 'Export failed',
        description: 'Could not generate the export file.',
        variant: 'destructive',
      });
    } finally {
      setExporting(null);
    }
  };

  if (isLoading || isRefetching) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading statement…
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
        <p>Failed to load loan statement.</p>
        <Button size="sm" variant="outline" onClick={refetch}>Retry</Button>
      </div>
    );
  }

  const { loan, client, summary, transactions } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Loan Statement</h2>
          <p className="text-sm text-muted-foreground">
            {client.name} · {client.account_number} · {loan.code}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm" variant="outline"
            onClick={() => handleExport('pdf')}
            disabled={!!exporting}
          >
            <FileDown className="w-4 h-4 mr-1" />
            {exporting === 'pdf' ? 'Exporting…' : 'Export PDF'}
          </Button>
          <Button
            size="sm" variant="outline"
            onClick={() => handleExport('excel')}
            disabled={!!exporting}
          >
            <FileSpreadsheet className="w-4 h-4 mr-1" />
            {exporting === 'excel' ? 'Exporting…' : 'Export Excel'}
          </Button>
          <Button size="sm" variant="ghost" onClick={refetch}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Loan Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        {[
          ['Product', loan.product],
          ['Loan Amount', fmt(loan.amount)],
          ['Interest Rate', `${fmt(loan.interest_rate)}%`],
          ['Status', <Badge key="s" className="capitalize">{loan.status_after_disbursement ?? loan.status}</Badge>],
          ['Tenure', `${loan.tenure} months`],
          ['Total Penalties Accrued', fmt(loan.penalties)],
          ['Outstanding Balance', <span key="o" className="font-bold text-red-600">{fmt(summary.outstanding)}</span>],
          ['Client Phone', client.phone],
        ].map(([label, value]) => (
          <div key={label} className="bg-muted/30 rounded-lg p-3 space-y-0.5">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="font-medium">{value}</p>
          </div>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="flex flex-wrap gap-3">
        <SummaryCard label="Principal" total={summary.total_principal} paid={summary.paid_principal} />
        <SummaryCard label="Interest" total={summary.total_interest} paid={summary.paid_interest} />
        <SummaryCard label="Penalties" total={summary.total_penalties} paid={summary.paid_penalties} />
        <SummaryCard label="Monitoring" total={summary.total_monitoring} paid={summary.paid_monitoring} />
      </div>

      {/* Transaction Ledger */}
      <div>
        <h3 className="text-sm font-semibold mb-2">Transaction Ledger ({transactions.length} entries)</h3>
        {transactions.length === 0 ? (
          <div className="border rounded-lg py-10 text-center text-sm text-muted-foreground">
            No transactions recorded yet.
          </div>
        ) : (
          <div className="border rounded-lg overflow-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/50 border-b sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Reference</th>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-left">Narrative</th>
                  <th className="px-3 py-2 text-right text-blue-600">Disbursed</th>
                  <th className="px-3 py-2 text-right text-emerald-600">Repaid / Accrued</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const isCredit = tx.type === 'disbursement';
                  const isDebit = !isCredit;
                  return (
                    <tr key={tx.id} className="border-b hover:bg-muted/20">
                      <td className="px-3 py-1.5 text-muted-foreground whitespace-nowrap">
                        {new Date(tx.date).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-1.5 font-mono">{tx.code}</td>
                      <td className="px-3 py-1.5">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${TYPE_BADGE[tx.type] ?? 'bg-gray-100 text-gray-700'}`}>
                          {TYPE_LABELS[tx.type] ?? tx.type}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 text-muted-foreground">{tx.narrative}</td>
                      <td className="px-3 py-1.5 text-right font-medium">
                        {isCredit ? (
                          <span className="flex items-center justify-end gap-1 text-blue-700">
                            <TrendingUp className="w-3 h-3" />
                            {fmt(tx.amount)}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="px-3 py-1.5 text-right font-medium">
                        {isDebit ? (
                          <span className="flex items-center justify-end gap-1 text-emerald-700">
                            <TrendingDown className="w-3 h-3" />
                            {fmt(tx.amount)}
                          </span>
                        ) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-muted/40 border-t">
                <tr>
                  <td colSpan={4} className="px-3 py-2 font-semibold text-right">Totals</td>
                  <td className="px-3 py-2 text-right font-bold text-blue-700">
                    {fmt(transactions.filter(t => t.type === 'disbursement').reduce((s, t) => s + t.amount, 0))}
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-emerald-700">
                    {fmt(transactions.filter(t => t.type !== 'disbursement').reduce((s, t) => s + t.amount, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

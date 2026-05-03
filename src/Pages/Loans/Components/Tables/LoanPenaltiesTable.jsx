/* eslint-disable react/prop-types */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Plus, Trash2, RefreshCw, X } from 'lucide-react';
import useAxiosPrivate from '@/MiddleWares/Hooks/useAxiosPrivate';

const fmt = (n) =>
  Number(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function LoanPenaltiesTable({ schedules = [], hasManagePermission = false }) {
  const axios        = useAxiosPrivate();
  const queryClient  = useQueryClient();
  const { loanid }   = useParams();
  const [addOpen, setAddOpen]           = useState(false);
  const [waiveTarget, setWaiveTarget]   = useState(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  const { data, isLoading, isRefetching, isError } = useQuery({
    queryKey: ['loan-penalties', loanid],
    queryFn: async () => {
      const res = await axios.get(`loans/${loanid}/penalties`);
      return res.data?.data;
    },
    enabled: !!loanid,
  });

  const addMutation = useMutation({
    mutationFn: (payload) => axios.post(`loans/${loanid}/penalties`, payload),
    onSuccess: () => {
      toast({ title: 'Penalty added' });
      queryClient.invalidateQueries(['loan-penalties', loanid]);
      reset();
      setAddOpen(false);
    },
    onError: (err) =>
      toast({
        title: 'Failed',
        variant: 'destructive',
        description: err?.response?.data?.messages || 'Could not add penalty',
      }),
  });

  const waiveMutation = useMutation({
    mutationFn: (penaltyId) =>
      axios.delete(`loans/${loanid}/penalties/${penaltyId}`),
    onSuccess: () => {
      toast({ title: 'Penalty waived' });
      queryClient.invalidateQueries(['loan-penalties', loanid]);
      setWaiveTarget(null);
    },
    onError: (err) =>
      toast({
        title: 'Failed',
        variant: 'destructive',
        description: err?.response?.data?.messages || 'Could not waive penalty',
      }),
  });

  const onAddSubmit = (values) =>
    addMutation.mutate({
      amount:          parseFloat(values.amount),
      loan_schedule_id: values.loan_schedule_id ? parseInt(values.loan_schedule_id) : null,
      narration:       values.narration || 'Manual penalty adjustment',
    });

  if (isLoading || isRefetching) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full rounded" />)}
      </div>
    );
  }

  if (isError) {
    return <p className="text-red-500 text-sm py-6 text-center">Failed to load penalties.</p>;
  }

  const penalties    = data?.penalties ?? [];
  const totalPenalty = data?.total_penalties ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Loan Penalties</h3>
          <p className="text-xs text-muted-foreground">
            Total accrued: <span className="font-medium text-red-600">{fmt(totalPenalty)}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => queryClient.invalidateQueries(['loan-penalties', loanid])}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          {hasManagePermission && (
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="w-4 h-4 mr-1" /> Add Penalty
            </Button>
          )}
        </div>
      </div>

      {penalties.length === 0 ? (
        <div className="border rounded-lg py-12 text-center text-sm text-muted-foreground">
          No penalties recorded for this loan.
        </div>
      ) : (
        <div className="border rounded-lg overflow-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">Instalment Date</th>
                <th className="px-3 py-2 text-left">Narration</th>
                <th className="px-3 py-2 text-right text-red-600">Amount</th>
                {hasManagePermission && <th className="px-3 py-2" />}
              </tr>
            </thead>
            <tbody>
              {penalties.map((p, idx) => (
                <tr key={p.loan_penality_id} className="border-b hover:bg-muted/20">
                  <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {p.loan_schedule
                      ? new Date(p.loan_schedule.loan_schedule_date).toLocaleDateString()
                      : <Badge variant="outline" className="text-xs">Manual</Badge>
                    }
                  </td>
                  <td className="px-3 py-2">{p.loan_penality_narration}</td>
                  <td className="px-3 py-2 text-right font-medium text-red-600">
                    {fmt(p.loan_penality_amount)}
                  </td>
                  {hasManagePermission && (
                    <td className="px-3 py-2 text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-red-500 hover:text-red-700"
                        onClick={() => setWaiveTarget(p)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Penalty Dialog */}
      <Dialog open={addOpen} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Manual Penalty</DialogTitle>
            <DialogClose asChild>
              <button
                className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100"
                onClick={() => setAddOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </DialogClose>
          </DialogHeader>
          <form onSubmit={handleSubmit(onAddSubmit)} className="space-y-4">
            <div>
              <Label>Penalty Amount</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('amount', {
                  required: 'Amount is required',
                  min: { value: 0.01, message: 'Must be greater than 0' },
                })}
              />
              {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
            </div>
            <div>
              <Label>Link to Instalment (optional)</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                {...register('loan_schedule_id')}
              >
                <option value="">— None (standalone penalty) —</option>
                {schedules.map((s) => (
                  <option key={s.loan_schedule_id} value={s.loan_schedule_id}>
                    {new Date(s.loan_schedule_date).toLocaleDateString()} — Principal: {fmt(s.loan_schedule_principal)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Narration</Label>
              <Input
                placeholder="Reason for penalty"
                {...register('narration')}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => { reset(); setAddOpen(false); }}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Adding…' : 'Add Penalty'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Waive Confirm Dialog */}
      <Dialog open={!!waiveTarget} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Waive Penalty</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Waive penalty of <span className="font-bold text-red-600">{fmt(waiveTarget?.loan_penality_amount)}</span>?
            This will reverse the amount from the loan balance and create a journal reversal entry.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setWaiveTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={waiveMutation.isLoading}
              onClick={() => waiveMutation.mutate(waiveTarget.loan_penality_id)}
            >
              {waiveMutation.isLoading ? 'Waiving…' : 'Waive'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

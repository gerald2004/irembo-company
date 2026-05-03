/* eslint-disable react/prop-types */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Send, RefreshCw, Filter } from 'lucide-react';
import useAxiosPrivate from '@/MiddleWares/Hooks/useAxiosPrivate';

const STATUS_BADGE = {
  pending: 'bg-amber-100 text-amber-800',
  sent:    'bg-emerald-100 text-emerald-800',
  failed:  'bg-red-100 text-red-800',
};

const TYPE_LABEL = {
  overdue_alert: 'Overdue Alert',
  reminder:      'Reminder',
};

export function LoanNotificationQueueTable() {
  const axios       = useAxiosPrivate();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState('pending');
  const [typeFilter,   setTypeFilter]   = useState('');
  const [selected,     setSelected]     = useState([]);
  const [page, setPage] = useState(1);

  const { data, isLoading, isRefetching } = useQuery({
    queryKey: ['loan-notif-queue', statusFilter, typeFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page, limit: 25 });
      if (statusFilter) params.set('status', statusFilter);
      if (typeFilter)   params.set('type', typeFilter);
      const res = await axios.get(`/loans/notification-queue?${params}`);
      return res.data?.data;
    },
    keepPreviousData: true,
  });

  const sendMutation = useMutation({
    mutationFn: (ids) => axios.post('/loans/notification-queue', { ids }),
    onSuccess: (res) => {
      toast({ title: 'Done', description: res.data?.messages });
      setSelected([]);
      queryClient.invalidateQueries(['loan-notif-queue']);
    },
    onError: (err) =>
      toast({
        title: 'Send failed',
        variant: 'destructive',
        description: err?.response?.data?.messages || 'Error sending notifications',
      }),
  });

  const queue       = data?.queue       ?? [];
  const total       = data?.total       ?? 0;
  const totalPages  = data?.total_pages ?? 1;

  const toggleSelect = (id) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const selectAllPending = () =>
    setSelected(queue.filter((q) => q.status === 'pending').map((q) => q.id));

  const isAllSelected = queue.length > 0 && queue
    .filter((q) => q.status === 'pending')
    .every((q) => selected.includes(q.id));

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Filter className="w-4 h-4" />
          <span>Filter:</span>
        </div>
        <div className="flex gap-1">
          {['', 'pending', 'sent', 'failed'].map((s) => (
            <Button
              key={s}
              size="sm"
              variant={statusFilter === s ? 'default' : 'outline'}
              onClick={() => { setStatusFilter(s); setPage(1); setSelected([]); }}
              className="h-7 text-xs"
            >
              {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </Button>
          ))}
        </div>
        <div className="flex gap-1">
          {['', 'overdue_alert', 'reminder'].map((t) => (
            <Button
              key={t}
              size="sm"
              variant={typeFilter === t ? 'secondary' : 'outline'}
              onClick={() => { setTypeFilter(t); setPage(1); }}
              className="h-7 text-xs"
            >
              {t === '' ? 'All Types' : TYPE_LABEL[t]}
            </Button>
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => queryClient.invalidateQueries(['loan-notif-queue'])}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          {selected.length > 0 && (
            <Button
              size="sm"
              disabled={sendMutation.isLoading}
              onClick={() => sendMutation.mutate(selected)}
            >
              <Send className="w-4 h-4 mr-1" />
              {sendMutation.isLoading ? 'Sending…' : `Send (${selected.length})`}
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      {isLoading || isRefetching ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full rounded" />)}
        </div>
      ) : queue.length === 0 ? (
        <div className="border rounded-lg py-12 text-center text-sm text-muted-foreground">
          No items in queue.
        </div>
      ) : (
        <div className="border rounded-lg overflow-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-3 py-2 w-8">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={isAllSelected ? () => setSelected([]) : selectAllPending}
                  />
                </th>
                <th className="px-3 py-2 text-left">Loan</th>
                <th className="px-3 py-2 text-left">Type</th>
                <th className="px-3 py-2 text-left">Channel</th>
                <th className="px-3 py-2 text-left">Recipient</th>
                <th className="px-3 py-2 text-left">Message</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {queue.map((item) => (
                <tr key={item.id} className="border-b hover:bg-muted/20">
                  <td className="px-3 py-2">
                    {item.status === 'pending' && (
                      <input
                        type="checkbox"
                        checked={selected.includes(item.id)}
                        onChange={() => toggleSelect(item.id)}
                      />
                    )}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {item.loan_application?.loan_application_code ?? `#${item.loan_application_id}`}
                  </td>
                  <td className="px-3 py-2">{TYPE_LABEL[item.notification_type] ?? item.notification_type}</td>
                  <td className="px-3 py-2 capitalize">{item.channel}</td>
                  <td className="px-3 py-2 text-muted-foreground">{item.recipient}</td>
                  <td className="px-3 py-2 max-w-xs truncate text-muted-foreground" title={item.message}>
                    {item.message}
                  </td>
                  <td className="px-3 py-2">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[item.status] ?? 'bg-gray-100 text-gray-700'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                    {new Date(item.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{total} total items</span>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" className="h-7" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
            <span className="px-2 py-1">Page {page} / {totalPages}</span>
            <Button size="sm" variant="outline" className="h-7" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}

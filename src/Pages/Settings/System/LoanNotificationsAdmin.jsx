import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Bell, AlertCircle, Clock, Save } from 'lucide-react';
import useAxiosPrivate from '@/MiddleWares/Hooks/useAxiosPrivate';
import { LoanNotificationQueueTable } from './Components/Tables/LoanNotificationQueueTable';

export default function LoanNotificationsAdmin() {
  const axiosPrivate = useAxiosPrivate();
  const queryClient  = useQueryClient();
  const [reminderDays, setReminderDays] = useState('');
  const [reminderDaysEdited, setReminderDaysEdited] = useState(false);

  // ── Fetch system triggers ────────────────────────────────────────────────
  const { data: triggers = {}, isLoading: triggersLoading } = useQuery({
    queryKey: ['sacco_system_settings'],
    queryFn: async () => {
      const res = await axiosPrivate.get('/settings/general-triggers');
      return res?.data?.data?.settings ?? {};
    },
  });

  // ── Fetch notification messages (for loan_reminder_before) ───────────────
  const { data: notifMsgs = {}, isLoading: notifLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await axiosPrivate.get('/settings/notifications');
      return res?.data?.data?.notification_messages ?? {};
    },
    onSuccess: (d) => {
      if (!reminderDaysEdited) {
        setReminderDays(d.loan_reminder_before ?? '');
      }
    },
  });

  // ── Toggle mutation (reuses general-triggers PATCH) ──────────────────────
  const toggleMutation = useMutation({
    mutationFn: ({ key, value }) =>
      axiosPrivate.patch(`/settings/general-triggers/${key}`, { value }),
    onSuccess: () => {
      toast({ title: 'Setting updated' });
      queryClient.invalidateQueries(['sacco_system_settings']);
    },
    onError: (err) =>
      toast({
        title: 'Update failed',
        variant: 'destructive',
        description: err?.response?.data?.messages || 'Unable to update',
      }),
  });

  // ── Save reminder days ────────────────────────────────────────────────────
  const reminderDaysMutation = useMutation({
    mutationFn: (days) =>
      axiosPrivate.patch('/settings/notifications', { loan_reminder_before: days }),
    onSuccess: () => {
      toast({ title: 'Saved', description: 'Reminder days updated.' });
      queryClient.invalidateQueries(['notifications']);
      setReminderDaysEdited(false);
    },
    onError: (err) =>
      toast({
        title: 'Save failed',
        variant: 'destructive',
        description: err?.response?.data?.messages || 'Could not save',
      }),
  });

  const handleToggle = (key) => {
    const current  = triggers[key] ?? 'no';
    const newValue = current === 'yes' ? 'no' : 'yes';
    toggleMutation.mutate({ key, value: newValue });
  };

  const isLoading = triggersLoading || notifLoading;

  const loanReminderBeforeValue = reminderDaysEdited
    ? reminderDays
    : (notifMsgs.loan_reminder_before ?? '');

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="/dashboard">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink to="/general-config">System Settings</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Loan Notifications Admin</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="space-y-6 pt-4">
        <div>
          <h5 className="text-2xl font-bold tracking-tight">Loan Notifications Admin</h5>
          <p className="text-sm text-muted-foreground mt-1">
            Control whether the system automatically sends loan alerts and reminders, and configure how many days in advance to notify clients.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Overdue Loan Alerts */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <CardTitle className="text-base">Overdue Loan Alerts</CardTitle>
                </div>
                <CardDescription>
                  When enabled, the cron job automatically sends SMS/email notifications to clients whose loans are overdue.
                  Uses the <strong>Loan Defaulters</strong> message template.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between pt-2">
                <span className="text-sm text-muted-foreground">
                  {triggers.sacco_sacco_loan_alerts === 'yes' ? 'Automatic (active)' : 'Manual / disabled'}
                </span>
                <Switch
                  checked={triggers.sacco_sacco_loan_alerts === 'yes'}
                  onCheckedChange={() => handleToggle('sacco_sacco_loan_alerts')}
                  disabled={toggleMutation.isLoading}
                />
              </CardContent>
            </Card>

            {/* Upcoming Instalment Reminders */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-blue-500" />
                  <CardTitle className="text-base">Instalment Reminders</CardTitle>
                </div>
                <CardDescription>
                  When enabled, the cron job sends reminder notifications to clients with upcoming instalments.
                  Uses the <strong>Loan Reminder Before</strong> template or a default message.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between pt-2">
                <span className="text-sm text-muted-foreground">
                  {triggers.sacco_loan_alerts === 'yes' ? 'Automatic (active)' : 'Manual / disabled'}
                </span>
                <Switch
                  checked={triggers.sacco_loan_alerts === 'yes'}
                  onCheckedChange={() => handleToggle('sacco_loan_alerts')}
                  disabled={toggleMutation.isLoading}
                />
              </CardContent>
            </Card>

            {/* Days Before Due Date */}
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-500" />
                  <CardTitle className="text-base">Days Before Due Date</CardTitle>
                </div>
                <CardDescription>
                  Number of days before an instalment is due that the reminder is sent.
                  If the <em>Loan Reminder Before</em> message template field contains a message string instead,
                  the cron defaults to 3 days. Set a plain number here to control the lead time.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="flex items-end gap-3 max-w-xs">
                  <div className="flex-1 space-y-1">
                    <Label htmlFor="reminder-days">Days ahead</Label>
                    <Input
                      id="reminder-days"
                      type="number"
                      min={1}
                      max={30}
                      placeholder="e.g. 3"
                      value={loanReminderBeforeValue}
                      onChange={(e) => {
                        setReminderDays(e.target.value);
                        setReminderDaysEdited(true);
                      }}
                    />
                  </div>
                  <Button
                    size="sm"
                    disabled={!reminderDaysEdited || reminderDaysMutation.isLoading}
                    onClick={() => reminderDaysMutation.mutate(reminderDays)}
                  >
                    <Save className="w-4 h-4 mr-1" />
                    {reminderDaysMutation.isLoading ? 'Saving…' : 'Save'}
                  </Button>
                </div>
              </CardContent>
            </Card>

          </div>
        )}

        {/* Notification Queue */}
        <div className="space-y-2">
          <h6 className="text-base font-semibold">Notification Queue</h6>
          <p className="text-xs text-muted-foreground">
            All generated notifications are stored here. Pending items were queued but not yet sent (manual mode).
            Select items and click <strong>Send</strong> to dispatch them now.
          </p>
          <LoanNotificationQueueTable />
        </div>

      </div>
    </>
  );
}

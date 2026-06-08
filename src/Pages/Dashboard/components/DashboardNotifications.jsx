/* eslint-disable react/prop-types */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  MessageSquare, Mail, Coins, AlertTriangle, ShieldAlert, Bell,
  Clock, FileText, CheckCircle, XCircle, Activity, Users,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import useBranchFilter from "@/MiddleWares/Hooks/useBranchFilter";
import StatCard from "./StatCard";

const fmt = (n) => (n != null ? Number(n).toLocaleString() : "—");

function AlertRow({ icon: Icon, label, value, level = "default" }) {
  const color = {
    danger: "text-rose-600 dark:text-rose-400",
    warn:   "text-amber-600 dark:text-amber-400",
    info:   "text-sky-600 dark:text-sky-400",
    ok:     "text-emerald-600 dark:text-emerald-400",
    default: "text-foreground",
  }[level];

  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b last:border-0 text-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className={`h-4 w-4 shrink-0 ${color}`} />
        <span>{label}</span>
      </div>
      <span className={`font-bold tabular-nums ${color}`}>{fmt(value)}</span>
    </div>
  );
}

const LEVEL_CONFIG = {
  critical: { bg: "bg-rose-100 dark:bg-rose-900/20", text: "text-rose-700 dark:text-rose-300", variant: "destructive" },
  error:    { bg: "bg-rose-50 dark:bg-rose-900/10",  text: "text-rose-600 dark:text-rose-400",  variant: "destructive" },
  warning:  { bg: "bg-amber-50 dark:bg-amber-900/10", text: "text-amber-700 dark:text-amber-300", variant: "secondary" },
  success:  { bg: "bg-emerald-50 dark:bg-emerald-900/10", text: "text-emerald-700 dark:text-emerald-300", variant: "secondary" },
  info:     { bg: "bg-sky-50 dark:bg-sky-900/10", text: "text-sky-700 dark:text-sky-300", variant: "outline" },
};

const DashboardNotifications = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate     = useNavigate();
  const { branchKey, branchParams } = useBranchFilter();

  const { data = {}, isLoading } = useQuery({
    queryKey: ["dashboard-notifications-data", branchKey],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get("/dashboards/notifications", { params: branchParams });
        return res.data.data ?? {};
      } catch (err) {
        if (err?.response?.status === 401) navigate("/", { replace: true });
      }
    },
  });

  const sms      = data?.sms ?? {};
  const emails   = data?.emails ?? {};
  const balance  = data?.sms_balance ?? {};
  const ops      = data?.operational_alerts ?? {};
  const comp     = data?.compliance_alerts ?? {};
  const sec      = data?.security_alerts ?? {};
  const recent   = data?.recent_notifications ?? [];

  const smsSent    = sms?.statusCounts?.sent_sms ?? 0;
  const smsPending = sms?.statusCounts?.pending_sms ?? 0;
  const emailSent  = emails?.statusCounts?.sent_emails ?? 0;
  const emailPend  = emails?.statusCounts?.pending_emails ?? 0;
  const smsTrend   = sms?.smsByMonth ?? [];

  const totalOpsAlerts =
    (ops.unposted_journals ?? 0) +
    (ops.pending_journals ?? 0) +
    (ops.day_open_pending ? 1 : 0) +
    (ops.day_close_pending ? 1 : 0) +
    (ops.pending_approvals ?? 0);

  const totalCompAlerts = (comp.aml_open_alerts ?? 0) + (comp.dormant_accounts ?? 0);

  return (
    <div className="space-y-6">

      {/* ── Communication Stats ───────────────────────────────────────────── */}
      <section>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Communication
        </p>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[108px] rounded-xl" />) : (
            <>
              <StatCard
                label="SMS Sent"
                value={fmt(smsSent)}
                subtitle={`${fmt(smsPending)} pending`}
                icon={MessageSquare}
                colorClass="text-indigo-600 dark:text-indigo-400"
                bgClass="bg-indigo-100 dark:bg-indigo-900/30"
              />
              <StatCard
                label="Emails Sent"
                value={fmt(emailSent)}
                subtitle={`${fmt(emailPend)} pending`}
                icon={Mail}
                colorClass="text-cyan-600 dark:text-cyan-400"
                bgClass="bg-cyan-100 dark:bg-cyan-900/30"
              />
              <StatCard
                label="SMS Balance"
                value={fmt(balance?.sacco_sms_balance)}
                subtitle="Available credits"
                icon={Coins}
                colorClass="text-emerald-600 dark:text-emerald-400"
                bgClass="bg-emerald-100 dark:bg-emerald-900/30"
              />
              <Card className="border shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5 min-w-0">
                      <p className="text-sm font-medium text-muted-foreground">Pending Delivery</p>
                      <p className="text-sm font-semibold tabular-nums text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5 shrink-0" /> {fmt(smsPending)} SMS
                      </p>
                      <p className="text-sm font-semibold tabular-nums text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 shrink-0" /> {fmt(emailPend)} Emails
                      </p>
                    </div>
                    <div className="p-2.5 rounded-xl shrink-0 bg-amber-100 dark:bg-amber-900/30">
                      <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </section>

      {/* ── Alert Panels ─────────────────────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[280px] rounded-xl" />)
        ) : (
          <>
            {/* Operational Alerts */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Activity className="h-4 w-4 text-amber-500" /> Operational Alerts
                  {totalOpsAlerts > 0 && (
                    <Badge variant="secondary" className="ml-auto">{totalOpsAlerts}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AlertRow icon={FileText} label="Unposted Journals" value={ops.unposted_journals} level={ops.unposted_journals > 0 ? "warn" : "ok"} />
                <AlertRow icon={Clock}    label="Pending Journals"  value={ops.pending_journals}  level={ops.pending_journals > 0 ? "warn" : "ok"} />
                <AlertRow icon={CheckCircle} label="Day Open Pending" value={ops.day_open_pending ? 1 : 0} level={ops.day_open_pending ? "danger" : "ok"} />
                <AlertRow icon={CheckCircle} label="Day Close Pending" value={ops.day_close_pending ? 1 : 0} level={ops.day_close_pending ? "warn" : "ok"} />
                <AlertRow icon={Clock}    label="Loans Due Today"   value={ops.loans_due_today}   level={ops.loans_due_today > 0 ? "warn" : "ok"} />
                <AlertRow icon={AlertTriangle} label="Overdue Loans" value={ops.overdue_loans}   level={(ops.overdue_loans ?? 0) > 10 ? "danger" : (ops.overdue_loans ?? 0) > 0 ? "warn" : "ok"} />
                <AlertRow icon={Clock}    label="Pending Approvals" value={ops.pending_approvals} level={ops.pending_approvals > 0 ? "info" : "ok"} />
              </CardContent>
            </Card>

            {/* Compliance Alerts */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-rose-500" /> Compliance Alerts
                  {totalCompAlerts > 0 && (
                    <Badge variant="destructive" className="ml-auto">{totalCompAlerts}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AlertRow icon={Bell}     label="AML Open Alerts"   value={comp.aml_open_alerts}  level={(comp.aml_open_alerts ?? 0) > 0 ? "danger" : "ok"} />
                <AlertRow icon={Users}    label="Dormant Accounts"  value={comp.dormant_accounts}  level={(comp.dormant_accounts ?? 0) > 50 ? "warn" : "info"} />
              </CardContent>
            </Card>

            {/* Security Alerts */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-sky-500" /> Security Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AlertRow icon={XCircle} label="Failed Logins (24h)" value={sec.failed_logins_24h} level={(sec.failed_logins_24h ?? 0) > 5 ? "danger" : (sec.failed_logins_24h ?? 0) > 0 ? "warn" : "ok"} />
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* ── SMS Activity Chart ────────────────────────────────────────────── */}
      {!isLoading && smsTrend.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">SMS Activity</CardTitle>
            <p className="text-xs text-muted-foreground">Messages sent per month</p>
          </CardHeader>
          <CardContent className="pl-1">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={smsTrend} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} tickFormatter={(v) => v?.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [Number(v).toLocaleString(), "SMS"]} />
                <Bar dataKey="count" name="SMS Sent" fill="hsl(var(--chart-1))" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* ── Recent System Notifications ───────────────────────────────────── */}
      {!isLoading && recent.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Bell className="h-4 w-4" /> Recent Unread Notifications
            </CardTitle>
            <p className="text-xs text-muted-foreground">{recent.length} unread</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recent.map((n) => {
                const cfg = LEVEL_CONFIG[n.level] ?? LEVEL_CONFIG.info;
                return (
                  <div key={n.id} className={`rounded-lg px-3 py-2.5 ${cfg.bg} flex items-start gap-3`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className={`text-sm font-semibold ${cfg.text}`}>{n.title}</p>
                        <Badge variant={cfg.variant} className="text-[10px] capitalize">{n.level}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate" dangerouslySetInnerHTML={{ __html: n.message }} />
                    </div>
                    <p className="text-[10px] text-muted-foreground shrink-0">{n.created_at?.slice(0, 10)}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state when no alerts */}
      {!isLoading && totalOpsAlerts === 0 && totalCompAlerts === 0 && recent.length === 0 && (
        <Card className="shadow-sm">
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
            <p className="text-base font-semibold">All Clear</p>
            <p className="text-sm text-muted-foreground mt-1">No active alerts or pending items.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardNotifications;

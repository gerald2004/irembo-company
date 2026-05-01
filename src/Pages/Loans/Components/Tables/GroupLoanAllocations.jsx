import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, ChevronDown, ChevronRight, CalendarDays, Wallet, LockKeyhole } from "lucide-react";

const fmt = (v) =>
  Number(v ?? 0).toLocaleString("en-UG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const pct = (paid, total) =>
  total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;

const statusVariant = (s) => {
  if (s === "paid") return "default";
  if (s === "overdue" || s === "defaulted") return "destructive";
  if (s === "partial") return "secondary";
  return "outline";
};

const schedStatusVariant = (s) => {
  if (s === "paid") return "default";
  if (s === "overdue") return "destructive";
  if (s === "partial") return "secondary";
  return "outline";
};

const MemberScheduleRows = ({ memberId, loanid, axiosPrivate }) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["group-member-schedules", loanid, memberId],
    queryFn: async () => {
      const res = await axiosPrivate.get(
        `/loans/${loanid}/group-member-schedules?member_id=${memberId}`
      );
      const byMember = res.data?.data?.by_member ?? [];
      return byMember.find((m) => m.member_id === memberId)?.schedules ?? [];
    },
  });

  if (isLoading)
    return (
      <TableRow>
        <TableCell colSpan={10} className="py-3 pl-10 bg-slate-50 dark:bg-slate-800/50">
          <Skeleton className="h-8 w-full" />
        </TableCell>
      </TableRow>
    );

  if (isError || !data?.length)
    return (
      <TableRow>
        <TableCell colSpan={10} className="py-3 pl-10 bg-slate-50 text-xs text-muted-foreground">
          No schedule found for this member.
        </TableCell>
      </TableRow>
    );

  return (
    <>
      <TableRow className="bg-slate-50 dark:bg-slate-800/50">
        <TableCell colSpan={10} className="pl-10 py-1">
          <div className="flex items-center gap-1 text-xs text-muted-foreground font-semibold uppercase tracking-wide">
            <CalendarDays className="w-3 h-3" /> Repayment Schedule
          </div>
        </TableCell>
      </TableRow>
      <TableRow className="bg-slate-100 dark:bg-slate-700/60">
        <TableCell className="pl-10 py-1 text-xs font-semibold text-muted-foreground">#</TableCell>
        <TableCell className="py-1 text-xs font-semibold text-muted-foreground">Due Date</TableCell>
        <TableCell className="py-1 text-right text-xs font-semibold text-muted-foreground">Principal</TableCell>
        <TableCell className="py-1 text-right text-xs font-semibold text-muted-foreground">Interest</TableCell>
        <TableCell className="py-1 text-right text-xs font-semibold text-muted-foreground">Monitoring</TableCell>
        <TableCell className="py-1 text-right text-xs font-semibold text-muted-foreground">Paid</TableCell>
        <TableCell className="py-1 text-right text-xs font-semibold text-muted-foreground">Balance</TableCell>
        <TableCell className="py-1 text-xs font-semibold text-muted-foreground" colSpan={3}>Status</TableCell>
      </TableRow>
      {data.map((s) => {
        const totalDue  = (s.principal ?? 0) + (s.interest ?? 0) + (s.monitoring_amount ?? 0) + (s.penalties ?? 0);
        const totalPaid = (s.principal_paid ?? 0) + (s.interest_paid ?? 0) + (s.monitoring_paid ?? 0) + (s.penalties_paid ?? 0);
        const balance   = Math.max(0, totalDue - totalPaid);
        return (
          <TableRow key={s.id} className="bg-slate-50 dark:bg-slate-800/40 text-xs">
            <TableCell className="pl-10 py-1.5">{s.period}</TableCell>
            <TableCell className="py-1.5">{s.due_date}</TableCell>
            <TableCell className="py-1.5 text-right">{fmt(s.principal)}</TableCell>
            <TableCell className="py-1.5 text-right">{fmt(s.interest)}</TableCell>
            <TableCell className="py-1.5 text-right">{fmt(s.monitoring_amount)}</TableCell>
            <TableCell className="py-1.5 text-right text-green-700 font-medium">{fmt(totalPaid)}</TableCell>
            <TableCell className="py-1.5 text-right text-orange-600 font-medium">{fmt(balance)}</TableCell>
            <TableCell className="py-1.5" colSpan={3}>
              <Badge variant={schedStatusVariant(s.status)} className="text-xs capitalize">
                {s.status}
              </Badge>
            </TableCell>
          </TableRow>
        );
      })}
    </>
  );
};

const GroupLoanAllocations = () => {
  const axiosPrivate = useAxiosPrivate();
  const { loanid } = useParams();
  const [expandedMember, setExpandedMember] = useState(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["group-loan-allocations", loanid],
    queryFn: async () => {
      const res = await axiosPrivate.get(`/loans/${loanid}/group-allocations`);
      return res.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Failed to load group loan allocations.</p>
      </div>
    );
  }

  const allocations = data?.allocations ?? [];
  const totals      = data?.totals ?? {};

  if (allocations.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="font-medium">No member allocations recorded for this loan.</p>
        <p className="text-xs mt-1">
          Submit loan with <code className="bg-muted px-1 rounded">member_allocations</code> to create per-member splits.
        </p>
      </div>
    );
  }

  const overallPct       = pct(totals.total_paid, totals.total_allocated);
  const totalSavings     = allocations.reduce((s, a) => s + (a.savings_balance ?? 0), 0);
  const totalFrozen      = allocations.reduce((s, a) => s + (a.frozen_balance ?? 0), 0);

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total Allocated", value: totals.total_allocated, accent: "text-foreground" },
          { label: "Total Paid",      value: totals.total_paid,      accent: "text-green-700" },
          { label: "Loan Balance",    value: totals.total_balance,   accent: "text-orange-600" },
          { label: "Savings (Total)", value: totalSavings,           accent: "text-blue-700",   icon: <Wallet className="w-3.5 h-3.5 mr-1 inline" /> },
          { label: "Frozen (Total)",  value: totalFrozen,            accent: "text-purple-700", icon: <LockKeyhole className="w-3.5 h-3.5 mr-1 inline" /> },
        ].map((c) => (
          <div key={c.label} className="border rounded-lg p-3 bg-white dark:bg-slate-900">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              {c.icon}{c.label}
            </p>
            <p className={`text-base font-bold mt-1 ${c.accent}`}>UGX {fmt(c.value)}</p>
          </div>
        ))}
      </div>

      {/* Overall progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Group Repayment Progress</span>
          <span>{overallPct}%</span>
        </div>
        <Progress value={overallPct} className="h-2" />
      </div>

      {/* Per-member table */}
      <p className="text-xs text-muted-foreground">Click a member row to view their repayment schedule.</p>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50 dark:bg-slate-800/60">
            <TableRow>
              <TableHead className="w-6" />
              <TableHead>Member</TableHead>
              <TableHead>Account No.</TableHead>
              <TableHead className="text-right">Allocated</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Loan Bal.</TableHead>
              <TableHead className="text-right text-blue-700">Savings</TableHead>
              <TableHead className="text-right text-purple-700">Frozen</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allocations.map((a) => {
              const memberPct = pct(a.amount_paid, a.allocated_amount);
              const isOpen    = expandedMember === a.member_id;
              return (
                <>
                  <TableRow
                    key={a.id}
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    onClick={() => setExpandedMember(isOpen ? null : a.member_id)}
                  >
                    <TableCell className="w-6 py-3">
                      {isOpen
                        ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      {a.member?.client_firstname} {a.member?.client_lastname}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {a.member?.client_account_number ?? "—"}
                    </TableCell>
                    <TableCell className="text-right text-sm">{fmt(a.allocated_amount)}</TableCell>
                    <TableCell className="text-right text-sm text-green-700 font-medium">{fmt(a.amount_paid)}</TableCell>
                    <TableCell className="text-right text-sm text-orange-600 font-medium">{fmt(a.balance)}</TableCell>
                    <TableCell className="text-right text-sm text-blue-700 font-medium">{fmt(a.savings_balance)}</TableCell>
                    <TableCell className="text-right text-sm text-purple-700 font-medium">{fmt(a.frozen_balance)}</TableCell>
                    <TableCell className="w-28">
                      <div className="space-y-0.5">
                        <Progress value={memberPct} className="h-1.5" />
                        <p className="text-xs text-muted-foreground text-right">{memberPct}%</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(a.status)} className="capitalize text-xs">
                        {a.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                  {isOpen && (
                    <MemberScheduleRows
                      key={`schedule-${a.member_id}`}
                      memberId={a.member_id}
                      loanid={loanid}
                      axiosPrivate={axiosPrivate}
                    />
                  )}
                </>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default GroupLoanAllocations;

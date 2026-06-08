import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import useBranchFilter from "@/MiddleWares/Hooks/useBranchFilter";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Printer, RefreshCw, ChevronDown, ChevronUp,
  ChevronsUpDown, Check, X, Users, CalendarDays,
  CircleCheck, AlertCircle, Clock, MinusCircle,
} from "lucide-react";

// ─── helpers ────────────────────────────────────────────────

const fmtMoney = (v) =>
  new Intl.NumberFormat("en-UG", { maximumFractionDigits: 0 }).format(v ?? 0);

const parseDate = (s) => new Date(s + "T00:00:00");

const fmtDay = (s) =>
  s ? parseDate(s).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) : "—";

const fmtDayFull = (s) =>
  s ? parseDate(s).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" }) : "—";

const today = new Date().toISOString().split("T")[0];

// Derive a period-level status from its member rows
function getPeriodStatus(rows) {
  const statuses = rows.map((r) => r.status);
  if (statuses.every((s) => s === "paid")) return "paid";
  if (statuses.some((s) => s === "overdue")) return "overdue";
  if (statuses.some((s) => s === "partial")) return "partial";
  return "notpaid";
}

// Pivot loan (members → installments) into (periods → members)
function buildPeriods(loan) {
  const map = {};
  for (const member of loan.members) {
    for (const inst of member.installments) {
      if (!map[inst.period]) {
        map[inst.period] = {
          period:   inst.period,
          due_date: inst.due_date,
          rows:     [],
          totals:   { expected: 0, paid: 0, outstanding: 0 },
        };
      }
      const outstanding = Math.max(0, inst.total_expected - inst.total_paid);
      map[inst.period].rows.push({
        member_id:    member.member_id,
        member_name:  member.member_name,
        account_number: member.account_number,
        cycle_number: member.cycle_number,
        status:       inst.status,
        expected:     inst.total_expected,
        paid:         inst.total_paid,
        outstanding,
      });
      map[inst.period].totals.expected    += inst.total_expected;
      map[inst.period].totals.paid        += inst.total_paid;
      map[inst.period].totals.outstanding += outstanding;
    }
  }
  return Object.values(map)
    .sort((a, b) => a.period - b.period)
    .map((p) => ({ ...p, period_status: getPeriodStatus(p.rows) }));
}

// ─── period status config ────────────────────────────────────

const PERIOD_CFG = {
  paid: {
    border: "border-green-200 dark:border-green-800",
    header: "bg-green-50 dark:bg-green-950/30",
    badge:  "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    icon:   <CircleCheck className="w-4 h-4 text-green-600" />,
    label:  "Collected",
  },
  overdue: {
    border: "border-red-200 dark:border-red-800",
    header: "bg-red-50 dark:bg-red-950/30",
    badge:  "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    icon:   <AlertCircle className="w-4 h-4 text-red-600" />,
    label:  "Overdue",
  },
  partial: {
    border: "border-amber-200 dark:border-amber-800",
    header: "bg-amber-50 dark:bg-amber-950/30",
    badge:  "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    icon:   <MinusCircle className="w-4 h-4 text-amber-600" />,
    label:  "Partial",
  },
  notpaid: {
    border: "border-slate-200 dark:border-slate-700",
    header: "bg-slate-50 dark:bg-slate-800/40",
    badge:  "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    icon:   <Clock className="w-4 h-4 text-slate-400" />,
    label:  "Pending",
  },
};

const MEMBER_STATUS_BADGE = {
  paid:    "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  overdue: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  partial: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  notpaid: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

const MEMBER_STATUS_LABEL = { paid: "Paid", overdue: "Overdue", partial: "Partial", notpaid: "Pending" };

// ─── period card ─────────────────────────────────────────────

function PeriodCard({ period, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const cfg = PERIOD_CFG[period.period_status] ?? PERIOD_CFG.notpaid;
  const isPaid = period.period_status === "paid";

  const pctCollected = period.totals.expected > 0
    ? Math.round((period.totals.paid / period.totals.expected) * 100)
    : 0;

  return (
    <div className={`rounded-lg border overflow-hidden ${cfg.border}`}>
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between px-4 py-3 gap-3 ${cfg.header} transition-colors hover:brightness-95`}
      >
        <div className="flex items-center gap-3 flex-wrap min-w-0">
          {cfg.icon}
          <span className="font-semibold text-sm">Period {period.period}</span>
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <CalendarDays className="w-3.5 h-3.5 shrink-0" />
            {fmtDayFull(period.due_date)}
          </span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.badge}`}>
            {cfg.label}
          </span>
        </div>

        <div className="flex items-center gap-4 shrink-0 text-right">
          <div className="hidden sm:block text-xs text-right space-y-0.5">
            <div className="text-muted-foreground">
              Expected: <span className="font-medium text-foreground">{fmtMoney(period.totals.expected)}</span>
            </div>
            {!isPaid && (
              <div className="text-muted-foreground">
                Collected: <span className="font-medium text-green-600">{fmtMoney(period.totals.paid)}</span>
                {period.totals.outstanding > 0 && (
                  <span className="ml-2 text-red-600">
                    Balance: {fmtMoney(period.totals.outstanding)}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="hidden md:flex flex-col items-end gap-1 w-24">
            <div className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${isPaid ? "bg-green-500" : pctCollected > 0 ? "bg-amber-500" : "bg-red-400"}`}
                style={{ width: `${pctCollected}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{pctCollected}% collected</span>
          </div>

          {open
            ? <ChevronUp className="w-4 h-4 text-muted-foreground ml-1 shrink-0" />
            : <ChevronDown className="w-4 h-4 text-muted-foreground ml-1 shrink-0" />}
        </div>
      </button>

      {/* Members table */}
      {open && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 border-t text-xs text-muted-foreground">
                <th className="text-left px-4 py-2 font-medium">Member</th>
                <th className="text-center px-3 py-2 font-medium">Cycle</th>
                <th className="text-right px-3 py-2 font-medium">Expected</th>
                <th className="text-right px-3 py-2 font-medium">Paid</th>
                <th className="text-right px-3 py-2 font-medium">Balance</th>
                <th className="text-center px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {period.rows.map((row) => (
                <tr
                  key={row.member_id}
                  className={`border-t transition-colors hover:bg-muted/20 ${
                    row.status === "paid" ? "opacity-60" : ""
                  }`}
                >
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-sm">{row.member_name}</div>
                    {row.account_number && (
                      <div className="text-xs text-muted-foreground">{row.account_number}</div>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {row.cycle_number != null
                      ? <span className="text-xs font-bold text-blue-600 dark:text-blue-400">#{row.cycle_number}</span>
                      : <span className="text-xs text-muted-foreground">—</span>}
                  </td>
                  <td className="px-3 py-2.5 text-right text-sm font-medium">
                    {fmtMoney(row.expected)}
                  </td>
                  <td className="px-3 py-2.5 text-right text-sm text-green-600 dark:text-green-400 font-medium">
                    {row.paid > 0 ? fmtMoney(row.paid) : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-3 py-2.5 text-right text-sm font-semibold">
                    {row.outstanding > 0
                      ? <span className="text-red-600 dark:text-red-400">{fmtMoney(row.outstanding)}</span>
                      : <span className="text-green-600">—</span>}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${MEMBER_STATUS_BADGE[row.status] ?? MEMBER_STATUS_BADGE.notpaid}`}>
                      {MEMBER_STATUS_LABEL[row.status] ?? row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 bg-muted/40 font-semibold text-sm">
                <td className="px-4 py-2 text-muted-foreground text-xs italic" colSpan={2}>
                  Period {period.period} total
                </td>
                <td className="px-3 py-2 text-right">{fmtMoney(period.totals.expected)}</td>
                <td className="px-3 py-2 text-right text-green-600">{fmtMoney(period.totals.paid)}</td>
                <td className="px-3 py-2 text-right text-red-600">
                  {period.totals.outstanding > 0 ? fmtMoney(period.totals.outstanding) : "—"}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── main component ──────────────────────────────────────────

const GroupCollectionSheetReport = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate     = useNavigate();
  const { branchKey } = useBranchFilter();

  const [groupOpen, setGroupOpen]         = useState(false);
  const [groupSearch, setGroupSearch]     = useState("");
  const [selectedGroup, setSelectedGroup] = useState(null);

  const [filters] = useState({
    due_date:  today,
    branch_id: String(branchKey ?? ""),
  });

  // Load all groups once (client-side filter)
  const { data: groupsRaw = [] } = useQuery({
    queryKey: ["groups-list-collection"],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get("/clients/groups");
        return res?.data?.data?.clients ?? [];
      } catch { return []; }
    },
    staleTime: 5 * 60 * 1000,
  });

  const filteredGroupOptions = useMemo(() => {
    if (!groupSearch) return groupsRaw;
    const q = groupSearch.toLowerCase();
    return groupsRaw.filter(
      (g) =>
        (g.client_group_name ?? "").toLowerCase().includes(q) ||
        (g.client_account_number ?? "").toLowerCase().includes(q)
    );
  }, [groupsRaw, groupSearch]);

  const handleGroupSelect = (group) => {
    setSelectedGroup(group);
    setGroupOpen(false);
    setGroupSearch("");
  };

  const clearGroup = (e) => { e.stopPropagation(); setSelectedGroup(null); };

  const { data, isLoading, refetch, isRefetching, isError } = useQuery({
    queryKey: ["group-collection-sheet", selectedGroup?.client_id],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get("reports/groups/collection-sheet", {
          params: {
            group_id:  selectedGroup.client_id,
            show_all:  "1",
            branch_id: filters.branch_id || undefined,
          },
        });
        return res?.data?.data ?? { collection_sheet: [] };
      } catch (error) {
        if (error?.response?.status === 401)
          navigate("/", { state: { from: location }, replace: true });
        throw error;
      }
    },
    enabled: !!selectedGroup,
    placeholderData: (prev) => prev,
  });

  const sheet = data?.collection_sheet ?? [];

  // Pre-build periods for each loan, compute grand totals
  const loansWithPeriods = useMemo(() =>
    sheet.map((loan) => ({ ...loan, periods: buildPeriods(loan) })),
    [sheet]
  );

  const grandTotals = useMemo(() =>
    loansWithPeriods.reduce(
      (acc, loan) => {
        acc.expected    += loan.totals.total_expected;
        acc.paid        += loan.totals.total_paid;
        acc.outstanding += loan.totals.total_due;
        return acc;
      },
      { expected: 0, paid: 0, outstanding: 0 }
    ),
    [loansWithPeriods]
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink to="/dashboard">Home</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink to="/group-reports">Group Reports</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Collection Sheet</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="space-y-4 pt-2 pb-10">
        {/* Page title */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h5 className="text-2xl font-bold tracking-tight">Group Collection Sheet</h5>
          <div className="flex gap-2">
            <Button
              variant="outline" size="sm"
              onClick={() => refetch()}
              disabled={isRefetching || !selectedGroup}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint} disabled={!sheet.length}>
              <Printer className="w-4 h-4 mr-2" /> Print
            </Button>
          </div>
        </div>

        {/* Group selector */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> Select Group
          </Label>
          <Popover open={groupOpen} onOpenChange={setGroupOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={groupOpen}
                className="w-full justify-between font-normal h-10 text-sm"
              >
                {selectedGroup ? (
                  <span className="flex items-center gap-2 truncate">
                    <span className="font-semibold">{selectedGroup.client_group_name}</span>
                    <span className="text-muted-foreground text-xs">{selectedGroup.client_account_number}</span>
                  </span>
                ) : (
                  <span className="text-muted-foreground">Search and select a group…</span>
                )}
                <span className="flex items-center gap-1 shrink-0 ml-2">
                  {selectedGroup && (
                    <X
                      className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground"
                      onClick={clearGroup}
                    />
                  )}
                  <ChevronsUpDown className="w-4 h-4 opacity-50" />
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder="Type group name or account number…"
                  className="h-9"
                  value={groupSearch}
                  onValueChange={setGroupSearch}
                />
                <CommandList className="max-h-64">
                  {groupsRaw.length === 0 && <CommandEmpty>No groups found.</CommandEmpty>}
                  {groupsRaw.length > 0 && filteredGroupOptions.length === 0 && (
                    <CommandEmpty>No match for "{groupSearch}".</CommandEmpty>
                  )}
                  <CommandGroup>
                    {filteredGroupOptions.map((g) => (
                      <CommandItem
                        key={g.client_id}
                        value={String(g.client_id)}
                        onSelect={() => handleGroupSelect(g)}
                        className="flex items-center justify-between gap-2"
                      >
                        <span>
                          <span className="font-medium">{g.client_group_name}</span>
                          <span className="ml-2 text-xs text-muted-foreground">{g.client_account_number}</span>
                        </span>
                        <Check
                          className={`w-4 h-4 shrink-0 ${selectedGroup?.client_id === g.client_id ? "opacity-100" : "opacity-0"}`}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Empty prompt */}
        {!selectedGroup && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <Users className="w-12 h-12 text-muted-foreground/30" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">Select a group above</p>
              <p className="text-xs text-muted-foreground mt-1">
                All meeting days and their collection status will be shown
              </p>
            </div>
          </div>
        )}

        {selectedGroup && isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg border h-14 bg-muted/30 animate-pulse" />
            ))}
          </div>
        )}

        {selectedGroup && isError && (
          <p className="text-sm text-red-500 py-4 text-center">Failed to load collection sheet. Please retry.</p>
        )}

        {selectedGroup && !isLoading && sheet.length === 0 && (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No active loan found for <strong>{selectedGroup.client_group_name}</strong>.
          </p>
        )}

        {/* Report */}
        {loansWithPeriods.map((loan) => {
          const memberCount = loan.members.length;
          const cycleNumbers = [...new Set(loan.members.map((m) => m.cycle_number).filter(Boolean))];
          const pctCollected = loan.totals.total_expected > 0
            ? Math.round((loan.totals.total_paid / loan.totals.total_expected) * 100)
            : 0;

          return (
            <div key={loan.loan_application_id} className="space-y-3">
              {/* Loan summary header */}
              <div className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h6 className="text-base font-bold">{loan.group_name}</h6>
                    <div className="flex flex-wrap gap-2 items-center">
                      <Badge variant="outline" className="text-xs font-mono">{loan.loan_code}</Badge>
                      {loan.loan_product && (
                        <Badge variant="secondary" className="text-xs">{loan.loan_product}</Badge>
                      )}
                      {cycleNumbers.map((c) => (
                        <Badge key={c} className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-0">
                          Cycle #{c}
                        </Badge>
                      ))}
                      <span className="text-xs text-muted-foreground">{memberCount} members</span>
                    </div>
                  </div>

                  {/* Totals strip */}
                  <div className="flex gap-4 flex-wrap text-right">
                    <div>
                      <div className="text-xs text-muted-foreground">Loan Amount</div>
                      <div className="text-sm font-semibold">UGX {fmtMoney(loan.loan_amount)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Total Expected</div>
                      <div className="text-sm font-semibold">UGX {fmtMoney(loan.totals.total_expected)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Collected</div>
                      <div className="text-sm font-semibold text-green-600">UGX {fmtMoney(loan.totals.total_paid)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Outstanding</div>
                      <div className="text-sm font-semibold text-red-600">UGX {fmtMoney(loan.totals.total_due)}</div>
                    </div>
                  </div>
                </div>

                {/* Overall progress */}
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Overall collection progress</span>
                    <span className="font-medium">{pctCollected}%</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        pctCollected === 100 ? "bg-green-500" :
                        pctCollected > 50    ? "bg-amber-500" : "bg-red-500"
                      }`}
                      style={{ width: `${pctCollected}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Period cards */}
              <div className="space-y-2">
                {loan.periods.map((period) => (
                  <PeriodCard
                    key={period.period}
                    period={period}
                    // Expand overdue/partial/notpaid by default; collapse paid
                    defaultOpen={period.period_status !== "paid"}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {/* Grand summary (multiple loans) */}
        {loansWithPeriods.length > 1 && (
          <div className="rounded-xl border bg-muted/30 p-4 grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Total Expected</div>
              <div className="font-bold">UGX {fmtMoney(grandTotals.expected)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Total Collected</div>
              <div className="font-bold text-green-600">UGX {fmtMoney(grandTotals.paid)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Total Outstanding</div>
              <div className="font-bold text-red-600">UGX {fmtMoney(grandTotals.outstanding)}</div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default GroupCollectionSheetReport;

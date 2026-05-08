/* eslint-disable react/prop-types */
import { useState, useEffect, useRef } from "react";
import { formatDateTimestamp } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeftCircle,
  Banknote,
  FileText,
  AlertCircle,
  TrendingUp,
  CreditCard,
  Settings,
  User,
  ChevronDown,
  GitBranch,
} from "lucide-react";

const ACTION_META = {
  applied:              { label: "Applied",              color: "bg-blue-100 text-blue-700 border-blue-200",       dot: "bg-blue-400",    icon: FileText        },
  processed:            { label: "Processed",            color: "bg-blue-100 text-blue-700 border-blue-200",       dot: "bg-blue-400",    icon: Settings        },
  submitted_for_review: { label: "Submitted for Review", color: "bg-sky-100 text-sky-700 border-sky-200",          dot: "bg-sky-400",     icon: FileText        },
  first_approved:       { label: "1st Approval",         color: "bg-teal-100 text-teal-700 border-teal-200",       dot: "bg-teal-500",    icon: CheckCircle2    },
  second_approved:      { label: "2nd Approval",         color: "bg-teal-100 text-teal-700 border-teal-200",       dot: "bg-teal-500",    icon: CheckCircle2    },
  final_approved:       { label: "Final Approval",       color: "bg-teal-100 text-teal-700 border-teal-200",       dot: "bg-teal-600",    icon: CheckCircle2    },
  approved:             { label: "Approved",             color: "bg-green-100 text-green-700 border-green-200",    dot: "bg-green-500",   icon: CheckCircle2    },
  sent_back:            { label: "Sent Back",            color: "bg-amber-100 text-amber-700 border-amber-200",    dot: "bg-amber-400",   icon: ArrowLeftCircle },
  rejected:             { label: "Rejected",             color: "bg-red-100 text-red-700 border-red-200",          dot: "bg-red-500",     icon: XCircle         },
  disbursed:            { label: "Disbursed",            color: "bg-green-100 text-green-700 border-green-200",    dot: "bg-green-600",   icon: Banknote        },
  top_up:               { label: "Top-Up",               color: "bg-purple-100 text-purple-700 border-purple-200", dot: "bg-purple-500",  icon: TrendingUp      },
  payment:              { label: "Payment",              color: "bg-green-100 text-green-700 border-green-200",    dot: "bg-green-400",   icon: CreditCard      },
  penalty_applied:      { label: "Penalty Applied",      color: "bg-red-100 text-red-700 border-red-200",          dot: "bg-red-400",     icon: AlertCircle     },
  restructured:         { label: "Restructured",         color: "bg-indigo-100 text-indigo-700 border-indigo-200", dot: "bg-indigo-400",  icon: Settings        },
  writtenoff:           { label: "Written Off",          color: "bg-gray-100 text-gray-600 border-gray-200",       dot: "bg-gray-400",    icon: XCircle         },
  waivedoff:            { label: "Waived Off",           color: "bg-gray-100 text-gray-600 border-gray-200",       dot: "bg-gray-400",    icon: XCircle         },
  settled:              { label: "Settled",              color: "bg-green-100 text-green-700 border-green-200",    dot: "bg-green-500",   icon: CheckCircle2    },
  adjustment:           { label: "Adjustment",           color: "bg-slate-100 text-slate-700 border-slate-200",    dot: "bg-slate-400",   icon: Settings        },
  interest_adjusted:    { label: "Interest Adjusted",    color: "bg-slate-100 text-slate-700 border-slate-200",    dot: "bg-slate-400",   icon: Settings        },
  penalty_adjusted:     { label: "Penalty Adjusted",     color: "bg-slate-100 text-slate-700 border-slate-200",    dot: "bg-slate-400",   icon: Settings        },
  monitoring_adjusted:  { label: "Monitoring Adjusted",  color: "bg-slate-100 text-slate-700 border-slate-200",    dot: "bg-slate-400",   icon: Settings        },
};

const DEFAULT_META = { label: null, color: "bg-gray-100 text-gray-600 border-gray-200", dot: "bg-gray-300", icon: Clock };

function ActionBadge({ actionType }) {
  const meta  = ACTION_META[actionType] ?? DEFAULT_META;
  const label = meta.label ?? (actionType ?? "—").replace(/_/g, " ");
  const Icon  = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold whitespace-nowrap ${meta.color}`}>
      <Icon className="h-3 w-3 shrink-0" />
      {label}
    </span>
  );
}

function ReasonContent({ reason }) {
  if (!reason) return null;

  // Try to parse as JSON
  let parsed = null;
  try {
    const candidate = JSON.parse(reason);
    if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) {
      parsed = candidate;
    }
  } catch {}

  if (parsed) {
    return (
      <div className="flex flex-wrap gap-1.5 mt-1 mb-1">
        {Object.entries(parsed).map(([k, v]) => (
          <span
            key={k}
            className="inline-flex items-center gap-1 bg-muted border border-border/50 px-2 py-0.5 rounded text-[11px]"
          >
            <span className="text-muted-foreground capitalize">{k.replace(/_/g, " ")}:</span>
            <span className="font-medium text-foreground">{String(v)}</span>
          </span>
        ))}
      </div>
    );
  }

  return (
    <p className="text-xs text-foreground/80 leading-relaxed mt-1 mb-1">
      {reason}
    </p>
  );
}

function HistoryRow({ entry, isLast }) {
  const meta       = ACTION_META[entry.action_type] ?? DEFAULT_META;
  const user       = entry.user   ?? {};
  const branch     = entry.branch ?? {};
  const userName   = [user.user_firstname, user.user_lastname].filter(Boolean).join(" ") || "System";
  const branchName = branch.branch_name ?? null;

  return (
    <div className="flex gap-3 group">
      {/* Timeline spine */}
      <div className="flex flex-col items-center shrink-0 pt-0.5">
        <div className={`h-2.5 w-2.5 rounded-full ring-2 ring-background shadow-sm ${meta.dot}`} />
        {!isLast && <div className="w-px flex-1 bg-border/60 mt-1 min-h-[24px]" />}
      </div>

      {/* Card */}
      <div className={`pb-4 min-w-0 flex-1 rounded-lg px-3 py-2 mb-1 border bg-card/60 shadow-sm transition-colors group-hover:bg-muted/40 ${isLast ? "mb-0" : ""}`}>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-0.5">
          <ActionBadge actionType={entry.action_type} />
          <span className="text-[10px] text-muted-foreground tabular-nums">
            {formatDateTimestamp(entry.action_timestamp) || "—"}
          </span>
        </div>

        <ReasonContent reason={entry.action_reason} />

        <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground mt-1">
          <span className="flex items-center gap-1">
            <User className="h-2.5 w-2.5" />
            {userName}
          </span>
          {branchName && (
            <span className="flex items-center gap-1">
              <GitBranch className="h-2.5 w-2.5" />
              {branchName}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function LoanHistory({ data = [], initialCount = 3, isLoading, isError }) {
  const sorted  = [...data].reverse();
  const PAGE    = 3;
  const [visible, setVisible] = useState(initialCount);
  const sentinelRef = useRef(null);

  useEffect(() => { setVisible(initialCount); }, [data, initialCount]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || visible >= sorted.length) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible((v) => Math.min(v + PAGE, sorted.length)); },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible, sorted.length]);

  if (isLoading) {
    return (
      <div className="space-y-3 p-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="mt-0.5 h-2.5 w-2.5 rounded-full shrink-0" />
            <div className="flex-1 rounded-lg border p-3 space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive">
        <AlertCircle className="h-4 w-4" />
        Failed to load history.
      </div>
    );
  }

  if (!sorted.length) {
    return <p className="text-sm text-muted-foreground">No history recorded yet.</p>;
  }

  const shown     = sorted.slice(0, visible);
  const remaining = sorted.length - visible;

  return (
    <div className="pt-1">
      {shown.map((entry, idx) => (
        <HistoryRow
          key={entry.history_id ?? idx}
          entry={entry}
          isLast={idx === shown.length - 1 && remaining === 0}
        />
      ))}

      {remaining > 0 && (
        <div ref={sentinelRef} className="flex items-center justify-center pt-1">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground gap-1 h-7"
            onClick={() => setVisible((v) => Math.min(v + PAGE, sorted.length))}
          >
            <ChevronDown className="h-3.5 w-3.5" />
            Show {Math.min(PAGE, remaining)} more
            <span className="opacity-50">({remaining} remaining)</span>
          </Button>
        </div>
      )}
    </div>
  );
}

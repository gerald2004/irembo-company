/* eslint-disable react/prop-types */
import { cn } from "@/lib/utils";

/**
 * ReportKpi — compact KPI card used across all loan/savings report pages.
 *
 * Props
 *  label   {string}          — metric name (small caps label above the value)
 *  value   {string|number}   — main display value (already formatted)
 *  hint    {string}          — small muted line below value
 *  icon    {ReactNode}       — lucide icon (16 × 16 works best)
 *  accent  {string}          — Tailwind bg-* class for the left border strip
 *  className {string}        — extra wrapper classes
 */
export default function ReportKpi({ label, value, hint, icon, accent = "bg-slate-400", className }) {
  return (
    <div className={cn("relative rounded-lg border bg-card shadow-sm overflow-hidden flex flex-col", className)}>
      {/* Left accent bar */}
      <div className={cn("absolute inset-y-0 left-0 w-1 rounded-l-lg", accent)} />
      <div className="pl-4 pr-3 pt-3 pb-3 flex flex-col gap-1 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground leading-none">
            {label}
          </p>
          {icon && (
            <span className="text-muted-foreground/60 shrink-0">{icon}</span>
          )}
        </div>
        <p className="text-xl font-bold tabular-nums leading-tight truncate">{value}</p>
        {hint && (
          <p className="text-[11px] text-muted-foreground leading-none truncate">{hint}</p>
        )}
      </div>
    </div>
  );
}

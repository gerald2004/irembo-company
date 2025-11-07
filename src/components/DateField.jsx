/* eslint-disable react/prop-types */
import * as React from "react";
import { format, parseISO, isValid } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

function toIsoDate(d) {
  if (!d || !(d instanceof Date) || isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function fromIsoDate(s) {
  if (!s) return undefined;
  const d = parseISO(s);
  return isValid(d) ? d : undefined;
}

/** Shadcn Date popover that reads/writes "YYYY-MM-DD" */
export function DateField({ value, onChange, label = "", className = "" }) {
  const dateObj = React.useMemo(() => fromIsoDate(value), [value]);
  const [open, setOpen] = React.useState(false);
  const hasLabel = typeof label === "string" && label.trim().length > 0;

  return (
    <div className="flex flex-col gap-1">
      {hasLabel && (
        <label className="text-sm font-medium text-foreground">{label}</label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={`${className} justify-start`}
            aria-label={hasLabel ? label : "Pick a date"}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateObj ? format(dateObj, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={dateObj}
            onSelect={(d) => {
              onChange && onChange(toIsoDate(d));
              setOpen(false);
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

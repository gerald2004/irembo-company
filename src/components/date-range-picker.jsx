/* eslint-disable react/prop-types */
import { CalendarIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import useAuth from "@/MiddleWares/Hooks/useAuth";

export const CalendarDateRangePicker = ({
  className,
  onChange,
  defaultValue,
}) => {
  const { auth } = useAuth();

  // Initialize date state with fiscal year or today's date
  const [date, setDate] = useState({
    from: defaultValue?.from
      ? new Date(defaultValue.from)
      : parseISO(auth?.fiscalYear?.start_date),
    to: defaultValue?.to ? new Date(defaultValue.to) : new Date(),
  });

  // ✅ Handle Date Selection
  const handleSelect = (range) => {
    if (!range) {
      // If range is undefined, reset state
      setDate({ from: undefined, to: undefined });
      onChange?.({ from: undefined, to: undefined });
      return;
    }

    if (range?.from && range?.to) {
      // Handle swapping if "from" is greater than "to"
      const fromDate = new Date(range.from);
      const toDate = new Date(range.to);

      if (fromDate > toDate) {
        setDate({ from: toDate, to: fromDate });
        onChange?.({ from: toDate, to: fromDate });
      } else {
        setDate(range);
        onChange?.(range);
      }
    } else {
      setDate(range);
      onChange?.(range);
    }
  };

  // ✅ Display Logic
  const displayDate = date.from
    ? date.to
      ? `${format(new Date(date.from), "LLL dd, y")} - ${format(
          new Date(date.to),
          "LLL dd, y"
        )}`
      : format(new Date(date.from), "LLL dd, y")
    : "Pick a date";

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {displayDate}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

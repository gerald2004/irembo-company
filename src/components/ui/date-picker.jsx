/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import { format, getMonth, getYear, setMonth, setYear } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function DatePicker(props) {
  const {
    startYear = getYear(new Date()) - 100,
    endYear = getYear(new Date()) + 100,
    selectedDate,
    onChange,
    placeholder = "Pick a date",
  } = props;

  // Whether the user has made an explicit selection (or a value was pre-provided)
  const [selected, setSelected] = useState(!!selectedDate);
  // Internal calendar navigation state — starts at selectedDate or today
  const [date, setDate] = useState(selectedDate || new Date());

  useEffect(() => {
    if (selectedDate) {
      setDate(selectedDate);
      setSelected(true);
    }
  }, [selectedDate]);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const years = Array.from(
    { length: endYear - startYear + 1 },
    (_, i) => startYear + i
  );

  // Month/year dropdowns are navigation only — update the calendar view but do NOT
  // commit a value to the parent form until the user clicks an actual day.
  const handleMonthChange = (month) => {
    setDate((prev) => setMonth(prev, months.indexOf(month)));
  };

  const handleYearChange = (year) => {
    setDate((prev) => setYear(prev, parseInt(year)));
  };

  // Day click — this is the real selection event.
  const handleSelect = (day) => {
    if (day) {
      setDate(day);
      setSelected(true);
      if (onChange) onChange(day);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full pl-3 justify-start text-left font-normal",
            !selected && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selected ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <div className="flex justify-between p-2">
          <Select
            onValueChange={handleMonthChange}
            value={months[getMonth(date)]}
          >
            <SelectTrigger className="w-[110px]">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month} value={month}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            onValueChange={handleYearChange}
            value={getYear(date).toString()}
          >
            <SelectTrigger className="w-[110px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Calendar
          mode="single"
          selected={selected ? date : undefined}
          onSelect={handleSelect}
          initialFocus
          month={date}
          onMonthChange={setDate}
        />
      </PopoverContent>
    </Popover>
  );
}

/**
 * DatePickerField — bridges ISO strings ("YYYY-MM-DD") to the shadcn DatePicker.
 *
 * Props:
 *   value      — ISO date string or "" / undefined
 *   onChange   — called with an ISO string ("YYYY-MM-DD") or "" when cleared
 *   placeholder— text shown when nothing is selected
 *   clearable  — shows an × button when a value is present
 *   className  — optional wrapper class
 */
export function DatePickerField({ value, onChange, placeholder = "Pick a date", clearable = false, className }) {
  const selectedDate = value ? new Date(value + "T00:00:00") : undefined;

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex-1 min-w-0">
        <DatePicker
          selectedDate={selectedDate}
          placeholder={placeholder}
          onChange={(d) => onChange(d ? format(d, "yyyy-MM-dd") : "")}
        />
      </div>
      {clearable && value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label="Clear date"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

/* eslint-disable react/prop-types */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";

// The `/business/employees` endpoint always returns the full branch-scoped
// staff list (no `?search=` support), so — unlike the other *Combobox
// components — this one fetches once and filters client-side.
export function EmployeeCombobox({ label, selectedEmployee, onEmployeeSelect }) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const axiosPrivate = useAxiosPrivate();

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ["employees-combobox"],
    queryFn: async () => {
      const response = await axiosPrivate.get(`/business/employees`);
      return response.data.data.users ?? [];
    },
    staleTime: 60_000,
  });

  const employeeOptions = employees.map((u) => {
    const name = [u.user_firstname, u.user_lastname].filter(Boolean).join(" ");
    return {
      value: u.user_id,
      label: u.user_identification_code
        ? `${name} (${u.user_identification_code})`
        : name,
      raw: u,
    };
  });

  const filteredOptions = searchTerm
    ? employeeOptions.filter((e) =>
        e.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : employeeOptions;

  const selectedLabel = employeeOptions.find(
    (e) => e.value === selectedEmployee
  )?.label;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">{label}</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            <span className="truncate">
              {selectedLabel ?? "Search & select staff..."}
            </span>
            <ChevronsUpDown className="ml-2 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Type staff name or code..."
              className="h-9"
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList>
              {isLoading && (
                <div className="flex items-center justify-center py-3 text-sm text-muted-foreground gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading staff...
                </div>
              )}
              {!isLoading && filteredOptions.length === 0 && (
                <CommandEmpty>No staff found.</CommandEmpty>
              )}
              <CommandGroup>
                {filteredOptions.map((employee) => (
                  <CommandItem
                    key={employee.value}
                    value={employee.label}
                    onSelect={() => {
                      onEmployeeSelect(employee.value, employee.raw);
                      setOpen(false);
                    }}
                  >
                    {employee.label}
                    <Check
                      className={`ml-auto ${
                        selectedEmployee === employee.value
                          ? "opacity-100"
                          : "opacity-0"
                      }`}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

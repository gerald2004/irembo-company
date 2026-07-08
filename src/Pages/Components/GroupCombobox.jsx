/* eslint-disable react/prop-types */
import { useState, useEffect, useRef } from "react";
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

export function GroupCombobox({ 
  label = "Search Group", 
  selectedClient, 
  onClientSelect, 
  searchUrl = '/clients/groups'   // Updated to your actual endpoint
}) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const axiosPrivate = useAxiosPrivate();
  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (searchTerm.length < 2) {
      setGroups([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await axiosPrivate.get(
          `${searchUrl}?search=${encodeURIComponent(searchTerm)}`
        );
        // Using the exact response structure you provided
        setGroups(response.data.data.clients ?? []);
      } catch {
        setGroups([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [searchTerm, axiosPrivate, searchUrl]);

  // Optimized mapping based on your actual group data
  const groupOptions = groups.map((g) => {
    const groupName = g.client_group_name || g.client_firstname || "Unnamed Group";
    const accountNumber = g.client_account_number;

    return {
      value: g.client_id,
      label: `${groupName}${accountNumber ? ` (${accountNumber})` : ''}`,
    };
  });

  const selectedLabel = groupOptions.find((g) => g.value === selectedClient)?.label;

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
              {selectedLabel ?? "Search & select group..."}
            </span>
            <ChevronsUpDown className="ml-2 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Type group name or account number..."
              className="h-9"
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList>
              {isLoading && (
                <div className="flex items-center justify-center py-3 text-sm text-muted-foreground gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching...
                </div>
              )}
              {!isLoading && searchTerm.length < 2 && (
                <CommandEmpty>Type at least 2 characters to search.</CommandEmpty>
              )}
              {!isLoading && searchTerm.length >= 2 && groupOptions.length === 0 && (
                <CommandEmpty>No group found.</CommandEmpty>
              )}
              <CommandGroup>
                {groupOptions.map((group) => (
                  <CommandItem
                    key={group.value}
                    value={group.label}
                    onSelect={() => {
                      onClientSelect(group.value);
                      setOpen(false);
                    }}
                  >
                    {group.label}
                    <Check
                      className={`ml-auto ${
                        selectedClient === group.value ? "opacity-100" : "opacity-0"
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
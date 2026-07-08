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

export function JointAccountCombobox({ 
  label = "Search Joint Account", 
  selectedClient, 
  onClientSelect, 
  searchUrl = '/clients/joint-account'   // Updated to your actual endpoint
}) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const axiosPrivate = useAxiosPrivate();
  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (searchTerm.length < 2) {
      setItems([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await axiosPrivate.get(
          `${searchUrl}?search=${encodeURIComponent(searchTerm)}`
        );
        // Using the exact response structure you provided
        setItems(response.data.data.clients ?? []);
      } catch {
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [searchTerm, axiosPrivate, searchUrl]);

  // Optimized mapping for Joint Accounts
  const options = items.map((item) => {
    const fullName = [item.client_firstname, item.client_lastname]
      .filter(Boolean)
      .join(' ') || "Joint Account";

    const accountNumber = item.client_account_number;

    return {
      value: item.client_id,
      label: `${fullName}${accountNumber ? ` (${accountNumber})` : ''}`,
    };
  });

  const selectedLabel = options.find((o) => o.value === selectedClient)?.label;

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
              {selectedLabel ?? "Search & select joint account..."}
            </span>
            <ChevronsUpDown className="ml-2 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Type joint account name or number..."
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
              {!isLoading && searchTerm.length >= 2 && options.length === 0 && (
                <CommandEmpty>No joint account found.</CommandEmpty>
              )}
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => {
                      onClientSelect(option.value);
                      setOpen(false);
                    }}
                  >
                    {option.label}
                    <Check
                      className={`ml-auto ${
                        selectedClient === option.value ? "opacity-100" : "opacity-0"
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
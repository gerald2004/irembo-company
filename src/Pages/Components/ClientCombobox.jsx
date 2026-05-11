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

export function ClientCombobox({ label, selectedClient, onClientSelect }) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const axiosPrivate = useAxiosPrivate();
  const debounceRef = useRef(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (searchTerm.length < 2) {
      setClients([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await axiosPrivate.get(
          `/clients/individual?search=${encodeURIComponent(searchTerm)}`
        );
        setClients(response.data.data.clients ?? []);
      } catch {
        setClients([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [searchTerm, axiosPrivate]);

  const clientOptions = clients.map((c) => ({
    value: c.client_id,
    label: `${c.client_firstname} ${c.client_lastname} (${c.client_account_number})`,
  }));

  const selectedLabel = clientOptions.find((c) => c.value === selectedClient)?.label;

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
              {selectedLabel ?? "Search & select client..."}
            </span>
            <ChevronsUpDown className="ml-2 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Type name, contact or account no..."
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
              {!isLoading && searchTerm.length >= 2 && clientOptions.length === 0 && (
                <CommandEmpty>No client found.</CommandEmpty>
              )}
              <CommandGroup>
                {clientOptions.map((client) => (
                  <CommandItem
                    key={client.value}
                    value={client.label}
                    onSelect={() => {
                      onClientSelect(client.value);
                      setOpen(false);
                    }}
                  >
                    {client.label}
                    <Check
                      className={`ml-auto ${
                        selectedClient === client.value ? "opacity-100" : "opacity-0"
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

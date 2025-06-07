/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";

export function ClientCombobox({ label, selectedClient, onClientSelect }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState(""); // ✅ Local search term
  const axiosPrivate = useAxiosPrivate();

  // ✅ API Query with Search
  const { data: clients = [], refetch } = useQuery({
    queryKey: ["individuals-data"], // ✅ Trigger API on search term update
    queryFn: async () => {
      const controller = new AbortController();

      const fetchURL = `/clients/individual`;
      try {
        const response = await axiosPrivate.get(fetchURL, {
          signal: controller.signal,
        });
        return response.data.data.clients ?? [];
      } catch (error) {
        if (error?.response?.status === 401) {
          navigate("/", { state: { from: location }, replace: true });
        }
        return error;
      }
    },
    keepPreviousData: true,
  });

  // ✅ Debounce API Calls (Wait 500ms before making a request)
  useEffect(() => {
    const timeout = setTimeout(() => {
      refetch();
    }, 10000);
    return () => clearTimeout(timeout);
  }, [searchTerm, refetch]);

  // ✅ Map Clients for Display
  const clientOptions =
    clients?.map((client) => ({
      value: client.client_id,
      label: `${client.client_firstname} ${client.client_lastname} (${client.client_account_number})`,
    })) ?? [];

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">{label}</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedClient
              ? clientOptions.find((client) => client.value === selectedClient)
                  ?.label
              : "Search & select client..."}
            <ChevronsUpDown className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            {/* ✅ FIXED: Now search updates properly */}
            <CommandInput
              placeholder="Search client..."
              className="h-9 px-10"
              value={searchTerm}
              onValueChange={setSearchTerm} // ✅ FIX: Properly updates state
            />
            <CommandList>
              <CommandEmpty>No client found.</CommandEmpty>
              <CommandGroup>
                {clientOptions.map((client) => (
                  <CommandItem
                    className="capitalize"
                    key={client.value}
                    value={client.value}
                    onSelect={() => {
                      onClientSelect(client.value);
                      setOpen(false);
                    }}
                  >
                    {client.label}
                    <Check
                      className={`ml-auto capitalize ${
                        selectedClient === client.value
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

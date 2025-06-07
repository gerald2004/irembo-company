/* eslint-disable react/prop-types */
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
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
import { useState } from "react";

export function AccountCombobox({
  label,
  selectedAccount,
  onAccountSelect,
  accountsData,
  isLoading,
  isError,
  refetch,
}) {
  const [open, setOpen] = useState(false);

  const accounts = accountsData?.map((account) => ({
    value: account.id,
    label: `${account.title} (${account.code})`,
  }));

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
            {selectedAccount
              ? accounts?.find((acc) => acc.value === selectedAccount)?.label
              : "Select account..."}
            <ChevronsUpDown className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          {isLoading ? (
            <div className="p-4 text-sm text-gray-500">Loading...</div>
          ) : isError ? (
            <div className="p-4 text-sm text-red-500">
              Error loading accounts.
              <Button onClick={refetch} className="mt-2">
                Retry
              </Button>
            </div>
          ) : (
            <Command>
              <CommandInput placeholder="Search account..." className="h-9" />
              <CommandList>
                <CommandEmpty>No account found.</CommandEmpty>
                <CommandGroup>
                  {accounts?.map((account) => (
                    <CommandItem
                      key={account.value}
                      value={account.value} // Pass the account ID
                      onSelect={() => {
                        onAccountSelect(account.value); // Update selected account
                        setOpen(false); // Close the dropdown
                      }}
                    >
                      {account.label}
                      <Check
                        className={cn(
                          "ml-auto",
                          selectedAccount === account.value
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}

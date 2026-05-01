/* eslint-disable react/prop-types */
import * as React from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { toast } from "@/hooks/use-toast";
import { DateField } from "@/components/DateField";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { X, Plus, Trash2, Loader2, CheckCircle2, AlertCircle, ChevronsUpDown, Check } from "lucide-react";

/* Compact searchable account picker for table rows */
function AccountSearchCombobox({ accounts, loading, value, onChange }) {
  const [open, setOpen] = React.useState(false);
  const selected = accounts.find((a) => String(a.id) === String(value));
  const label = selected
    ? `${selected.code ? `[${selected.code}] ` : ""}${selected.title}`
    : null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-8 w-full items-center justify-between rounded-md border border-input bg-background px-2 py-1 text-xs ring-offset-background",
            "hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
            !label && "text-muted-foreground"
          )}
          disabled={loading}
        >
          <span className="truncate">{loading ? "Loading…" : label ?? "Search account…"}</span>
          <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search by name or code…" className="h-8 text-xs" />
          <CommandList className="max-h-56">
            <CommandEmpty className="py-3 text-xs text-center text-muted-foreground">
              No account found.
            </CommandEmpty>
            <CommandGroup>
              {accounts.map((a) => (
                <CommandItem
                  key={a.id}
                  value={`${a.code ?? ""} ${a.title}`}
                  onSelect={() => {
                    onChange(String(a.id));
                    setOpen(false);
                  }}
                  className="text-xs"
                >
                  <Check
                    className={cn(
                      "mr-2 h-3 w-3 shrink-0",
                      String(value) === String(a.id) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {a.code && (
                    <span className="mr-1 text-muted-foreground font-mono">[{a.code}]</span>
                  )}
                  {a.title}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

let _lineId = 0;
const newLine = () => ({ id: ++_lineId, account_id: "", debit: "", credit: "", memo: "" });

const fmt = (n) => {
  const num = Number(n || 0);
  return Number.isNaN(num) ? "0.00" : num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const parseNum = (v) => {
  const n = parseFloat(String(v || "").replace(/,/g, ""));
  return Number.isNaN(n) ? 0 : n;
};

export default function JournalEntryDialog({ isOpen, onClose, refetch }) {
  const axiosPrivate = useAxiosPrivate();

  const [transactionDate, setTransactionDate] = React.useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [description, setDescription] = React.useState("");
  const [reference, setReference] = React.useState("");
  const [lines, setLines] = React.useState(() => [newLine(), newLine()]);

  const reset = () => {
    setTransactionDate(new Date().toISOString().slice(0, 10));
    setDescription("");
    setReference("");
    setLines([newLine(), newLine()]);
  };

  React.useEffect(() => {
    if (isOpen) reset();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // ── accounts
  const { data: accountsRaw = [], isLoading: loadingAccounts } = useQuery({
    queryKey: ["chart-of-accounts"],
    queryFn: async () => {
      const ctrl = new AbortController();
      const r = await axiosPrivate.get("/settings/accounts/account", { signal: ctrl.signal });
      return r.data?.data?.accounts ?? [];
    },
    enabled: isOpen,
    staleTime: 60_000,
  });

  // ── line helpers
  const updateLine = (id, field, value) =>
    setLines((prev) =>
      prev.map((l) => {
        if (l.id !== id) return l;
        const updated = { ...l, [field]: value };
        // mutual exclusivity: entering debit clears credit and vice versa
        if (field === "debit" && value !== "") updated.credit = "";
        if (field === "credit" && value !== "") updated.debit = "";
        return updated;
      })
    );

  const removeLine = (id) =>
    setLines((prev) => (prev.length > 2 ? prev.filter((l) => l.id !== id) : prev));

  const addLine = () => setLines((prev) => [...prev, newLine()]);

  // ── totals
  const totalDebit  = lines.reduce((s, l) => s + parseNum(l.debit),  0);
  const totalCredit = lines.reduce((s, l) => s + parseNum(l.credit), 0);
  const diff        = Math.abs(totalDebit - totalCredit);
  const balanced    = diff < 0.005 && totalDebit > 0;

  const hasAllAccounts = lines.every((l) => l.account_id !== "");
  const canSubmit = balanced && hasAllAccounts && description.trim().length > 0;

  // ── mutation
  const { mutate: submit, isPending } = useMutation({
    mutationFn: async () => {
      const payload = {
        transaction_date: transactionDate,
        description:      description.trim(),
        reference:        reference.trim() || undefined,
        lines: lines.map((l) => ({
          account_id:    parseInt(l.account_id, 10),
          debit_amount:  parseNum(l.debit),
          credit_amount: parseNum(l.credit),
          memo:          l.memo.trim() || undefined,
        })),
      };
      const ctrl = new AbortController();
      const r = await axiosPrivate.post("/accounting/journals", payload, { signal: ctrl.signal });
      return r.data;
    },
    onSuccess: (d) => {
      toast({
        title: "Journal Posted",
        description: `Code: ${d?.data?.transaction_code ?? "—"} | ${fmt(totalDebit)} balanced`,
      });
      refetch?.();
      onClose();
    },
    onError: (err) => {
      const msg = err?.response?.data?.messages ?? err?.message ?? "Failed to post entry";
      toast({
        title: "Error",
        description: Array.isArray(msg) ? msg.join(", ") : msg,
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[860px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Journal Entry</DialogTitle>
          <DialogDescription>
            Enter debit and credit lines. The entry must balance (total DR = total CR) before it can be posted.
          </DialogDescription>
          <DialogClose asChild>
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:outline-none"
            >
              <X className="h-4 w-4" />
            </button>
          </DialogClose>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <DateField
              label="Transaction Date"
              value={transactionDate}
              onChange={setTransactionDate}
            />
            <div className="md:col-span-2">
              <Label>Description *</Label>
              <Input
                placeholder="e.g. Accrued interest adjustment"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Reference / Narration (optional)</Label>
            <Input
              placeholder="e.g. INV-001, cheque #1234"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>

          {/* Lines table */}
          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-3 py-2 font-medium w-[35%]">Account</th>
                  <th className="text-right px-3 py-2 font-medium w-[15%]">Debit</th>
                  <th className="text-right px-3 py-2 font-medium w-[15%]">Credit</th>
                  <th className="text-left px-3 py-2 font-medium">Memo</th>
                  <th className="px-2 py-2 w-8" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {lines.map((line, idx) => (
                  <tr key={line.id} className="hover:bg-muted/20">
                    {/* Account — searchable combobox */}
                    <td className="px-2 py-1.5">
                      <AccountSearchCombobox
                        accounts={accountsRaw}
                        loading={loadingAccounts}
                        value={line.account_id}
                        onChange={(v) => updateLine(line.id, "account_id", v)}
                      />
                    </td>

                    {/* Debit */}
                    <td className="px-2 py-1.5">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={line.debit}
                        onChange={(e) => updateLine(line.id, "debit", e.target.value)}
                        className="h-8 text-right text-xs"
                      />
                    </td>

                    {/* Credit */}
                    <td className="px-2 py-1.5">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={line.credit}
                        onChange={(e) => updateLine(line.id, "credit", e.target.value)}
                        className="h-8 text-right text-xs"
                      />
                    </td>

                    {/* Memo */}
                    <td className="px-2 py-1.5">
                      <Input
                        placeholder="Optional note"
                        value={line.memo}
                        onChange={(e) => updateLine(line.id, "memo", e.target.value)}
                        className="h-8 text-xs"
                      />
                    </td>

                    {/* Delete */}
                    <td className="px-1 py-1.5 text-center">
                      <button
                        type="button"
                        onClick={() => removeLine(line.id)}
                        disabled={lines.length <= 2}
                        className="text-muted-foreground hover:text-destructive disabled:opacity-30 transition-colors"
                        title={`Remove line ${idx + 1}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>

              {/* Totals row */}
              <tfoot className="bg-muted/30 border-t-2">
                <tr>
                  <td className="px-3 py-2 text-xs font-semibold text-muted-foreground">TOTALS</td>
                  <td className="px-2 py-2 text-right font-mono font-semibold text-sm">
                    {fmt(totalDebit)}
                  </td>
                  <td className="px-2 py-2 text-right font-mono font-semibold text-sm">
                    {fmt(totalCredit)}
                  </td>
                  <td colSpan={2} className="px-3 py-2">
                    {totalDebit === 0 && totalCredit === 0 ? null : balanced ? (
                      <Badge variant="default" className="gap-1 bg-green-600 text-white text-xs">
                        <CheckCircle2 className="h-3 w-3" /> Balanced
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="gap-1 text-xs">
                        <AlertCircle className="h-3 w-3" /> Off by {fmt(diff)}
                      </Badge>
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Add line */}
          <Button type="button" variant="outline" size="sm" onClick={addLine} className="gap-1">
            <Plus className="h-4 w-4" /> Add Line
          </Button>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => submit()}
            disabled={isPending || !canSubmit}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending ? "Posting…" : "Post Journal Entry"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

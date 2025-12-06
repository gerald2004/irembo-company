import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn, formatDateTimestamp } from "@/lib/utils";
import { AccountCombobox } from "@/Pages/Components/AccountCombobox";
import { toast } from "@/hooks/use-toast";

const BASE_URL = "/accounting/shares/dividends"; // /accounting/... with ?action=...

const statusColor = {
  draft: "bg-slate-200 text-slate-800",
  generated: "bg-blue-100 text-blue-800",
  approved: "bg-indigo-100 text-indigo-800",
  posted: "bg-emerald-100 text-emerald-800",
  reversed: "bg-red-100 text-red-800",
  cancelled: "bg-zinc-200 text-zinc-800",
};

const DividendDeclarations = () => {
  const navigate = useNavigate();
  const axiosPrivate = useAxiosPrivate();

  const [error, setError] = useState(null);
  const [loadingAction, setLoadingAction] = useState(null);

  // Dialog + form state
  const [openDialog, setOpenDialog] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    record_date: "",
    period_start_date: "",
    period_end_date: "",
    dividend_rate_per_share: "",
  });

  // ✅ Selected GL accounts (copied pattern from JournalEntryDialog)
  const [selectedAccounts, setSelectedAccounts] = useState({
    funding_account_id: null,
    counterparty_account_id: null,
  });

  // ===== Fetch dividend declarations (react-query + axiosPrivate) =====
  const {
    data: declarations = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["dividend-declarations"],
    queryFn: async () => {
      const controller = new AbortController();
      const fetchURL = `${BASE_URL}?action=declarations`;

      try {
        const response = await axiosPrivate.get(fetchURL, {
          signal: controller.signal,
        });
        return response?.data?.data?.declarations ?? [];
      } catch (error) {
        if (error?.response?.status === 401) {
          navigate("/", { state: { from: location }, replace: true });
        }
        throw error;
      }
    },
    keepPreviousData: true,
  });

  // ===== Fetch accounts for combobox (copied from JournalEntryDialog) =====
  const {
    data: accountsData,
    isLoading: isLoadingAccounts,
    isError: isErrorAccounts,
    refetch: refetchAccounts,
    isRefetching: isRefetchingAccounts,
  } = useQuery({
    queryKey: ["accounts-all"],
    queryFn: async () => {
      const controller = new AbortController();
      const response = await axiosPrivate.get("/settings/accounts/account", {
        signal: controller.signal,
      });
      return response.data.data.accounts;
    },
  });

  // ===== Create declaration (uses selected GL accounts) =====
  const handleCreate = async () => {
    try {
      setSaving(true);
      setError(null);

      if (
        !selectedAccounts.funding_account_id ||
        !selectedAccounts.counterparty_account_id
      ) {
        throw new Error("Please select both Funding and Counterparty accounts");
      }

      const payload = {
        title: form.title,
        description: form.description || undefined,
        record_date: form.record_date,
        period_start_date: form.period_start_date || undefined,
        period_end_date: form.period_end_date || undefined,
        dividend_rate_per_share: Number(form.dividend_rate_per_share || 0),
        funding_account_id: Number(selectedAccounts.funding_account_id),
        counterparty_account_id: Number(
          selectedAccounts.counterparty_account_id
        ),
      };

      const response = await axiosPrivate.post(
        `${BASE_URL}?action=declare`,
        payload
      );

      if (response?.data?.success === false) {
        const msg =
          response?.data?.messages?.[0] || "Failed to create declaration";
        throw new Error(msg);
      }

      toast({
        title: "Success",
        description: response?.data?.messages || "Dividend declaration created",
      });

      // Reset form + accounts + close dialog
      setOpenDialog(false);
      setForm({
        title: "",
        description: "",
        record_date: "",
        period_start_date: "",
        period_end_date: "",
        dividend_rate_per_share: "",
      });
      setSelectedAccounts({
        funding_account_id: null,
        counterparty_account_id: null,
      });

      refetch();
    } catch (error) {
      if (error?.response?.status === 401) {
        navigate("/", { state: { from: location }, replace: true });
      }
      setError(error?.message || "Failed to create declaration");
      toast({
        title: "Uh oh! Something went wrong.",
        variant: "destructive",
        description: error?.message || "Failed to create declaration",
      });
    } finally {
      setSaving(false);
    }
  };

  // ===== Generate snapshot =====
  const handleGenerate = async (id) => {
    try {
      setLoadingAction(id);
      setError(null);

      const payload = { dividend_declaration_id: id };

      const response = await axiosPrivate.post(
        `${BASE_URL}?action=generate`,
        payload
      );

      if (response?.data?.success === false) {
        const msg =
          response?.data?.messages?.[0] || "Failed to generate dividends";
        throw new Error(msg);
      }

      toast({
        title: "Success",
        description:
          response?.data?.messages ||
          "Dividend transactions generated successfully",
      });

      refetch();
    } catch (error) {
      if (error?.response?.status === 401) {
        navigate("/", { state: { from: location }, replace: true });
      }
      setError(error?.message || "Failed to generate dividends");
      toast({
        title: "Uh oh! Something went wrong.",
        variant: "destructive",
        description: error?.message || "Failed to generate dividends",
      });
    } finally {
      setLoadingAction(null);
    }
  };

  // ===== Post dividends (still using PIN prompt for now) =====
  const handlePost = async (id) => {
    const pin = window.prompt("Enter your PIN to post dividends");
    if (!pin) return;

    try {
      setLoadingAction(id);
      setError(null);

      const payload = {
        dividend_declaration_id: id,
        user_pincode: pin,
      };

      const response = await axiosPrivate.post(
        `${BASE_URL}?action=post`,
        payload
      );

      if (response?.data?.success === false) {
        const msg = response?.data?.messages?.[0] || "Failed to post dividends";
        throw new Error(msg);
      }

      toast({
        title: "Success",
        description:
          response?.data?.messages || "Dividend posting completed successfully",
      });

      refetch();
    } catch (error) {
      if (error?.response?.status === 401) {
        navigate("/", { state: { from: location }, replace: true });
      }
      setError(error?.message || "Failed to post dividends");
      toast({
        title: "Uh oh! Something went wrong.",
        variant: "destructive",
        description: error?.message || "Failed to post dividends",
      });
    } finally {
      setLoadingAction(null);
    }
  };

  // ===== Reverse dividends =====
  const handleReverse = async (id) => {
    const confirmReverse = window.confirm(
      "Are you sure you want to reverse this dividend declaration? This will debit member accounts."
    );
    if (!confirmReverse) return;

    const pin = window.prompt("Enter your PIN to reverse dividends");
    if (!pin) return;

    try {
      setLoadingAction(id);
      setError(null);

      const payload = {
        dividend_declaration_id: id,
        user_pincode: pin,
      };

      const response = await axiosPrivate.post(
        `${BASE_URL}?action=reverse`,
        payload
      );

      if (response?.data?.success === false) {
        const msg =
          response?.data?.messages?.[0] ||
          "Failed to reverse dividend declaration";
        throw new Error(msg);
      }

      toast({
        title: "Success",
        description:
          response?.data?.messages || "Dividend declaration reversed",
      });

      refetch();
    } catch (error) {
      if (error?.response?.status === 401) {
        navigate("/", { state: { from: location }, replace: true });
      }
      setError(error?.message || "Failed to reverse dividend declaration");
      toast({
        title: "Uh oh! Something went wrong.",
        variant: "destructive",
        description: error?.message || "Failed to reverse declaration",
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const disabledAction = (id) => loadingAction === id || isRefetching;

  return (
    <div className="space-y-4">
      {/* Header + New button */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">Dividend Declarations</h2>
          <p className="text-xs text-muted-foreground">
            Create, generate and post dividend distributions to shareholders.
          </p>
        </div>

        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button size="sm">New Declaration</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[650px]">
            <DialogHeader>
              <DialogTitle>New Dividend Declaration</DialogTitle>
              <DialogDescription>
                Define the dividend period, rate and funding accounts.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, title: e.target.value }))
                    }
                    placeholder="e.g. FY 2024 Final Dividend"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="record_date">Record Date</Label>
                  <Input
                    id="record_date"
                    type="date"
                    value={form.record_date}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, record_date: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Input
                  id="description"
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="e.g. Annual dividend payout based on 2024 profits"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="rate">Rate per Share</Label>
                  <Input
                    id="rate"
                    type="number"
                    min={0}
                    value={form.dividend_rate_per_share}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        dividend_rate_per_share: e.target.value,
                      }))
                    }
                    placeholder="e.g. 500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="period_start_date">Period Start</Label>
                  <Input
                    id="period_start_date"
                    type="date"
                    value={form.period_start_date}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        period_start_date: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="period_end_date">Period End</Label>
                  <Input
                    id="period_end_date"
                    type="date"
                    value={form.period_end_date}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        period_end_date: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              {/* 🔥 Accounts from AccountCombobox (same pattern as JournalEntryDialog) */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <AccountCombobox
                  label="Funding Account (e.g. Retained Earnings)"
                  selectedAccount={selectedAccounts.funding_account_id}
                  onAccountSelect={(value) =>
                    setSelectedAccounts((prev) => ({
                      ...prev,
                      funding_account_id: parseInt(value, 10),
                    }))
                  }
                  accountsData={accountsData}
                  isLoading={isLoadingAccounts}
                  isError={isErrorAccounts}
                  refetch={refetchAccounts}
                  isRefetching={isRefetchingAccounts}
                />

                <AccountCombobox
                  label="Counterparty Account (Dividend Payable / Savings Control)"
                  selectedAccount={selectedAccounts.counterparty_account_id}
                  onAccountSelect={(value) =>
                    setSelectedAccounts((prev) => ({
                      ...prev,
                      counterparty_account_id: parseInt(value, 10),
                    }))
                  }
                  accountsData={accountsData}
                  isLoading={isLoadingAccounts}
                  isError={isErrorAccounts}
                  refetch={refetchAccounts}
                  isRefetching={isRefetchingAccounts}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setOpenDialog(false)}
                type="button"
              >
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={saving} type="button">
                {saving ? "Saving..." : "Save Declaration"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Declarations table */}
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Record Date</TableHead>
              <TableHead className="text-right">Rate / Share</TableHead>
              <TableHead className="text-right">Total Shares</TableHead>
              <TableHead className="text-right">Total Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(isLoading || isRefetching) && (
              <TableRow>
                <TableCell colSpan={8} className="py-6 text-center text-sm">
                  Loading dividend declarations...
                </TableCell>
              </TableRow>
            )}

            {!isLoading && !isRefetching && declarations.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-6 text-center text-sm">
                  No dividend declarations found.
                </TableCell>
              </TableRow>
            )}

            {declarations.map((d) => (
              <TableRow key={d.dividend_declaration_id}>
                <TableCell className="font-mono text-xs">
                  {d.dividend_declaration_code}
                </TableCell>
                <TableCell className="max-w-[220px] truncate">
                  <div className="font-medium">{d.title}</div>
                  {d.description && (
                    <div className="text-xs text-muted-foreground">
                      {d.description}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-xs">
                    {d.record_date ? formatDateTimestamp(d.record_date) : "-"}
                  </span>
                </TableCell>
                <TableCell className="text-right text-xs">
                  {Number(d.dividend_rate_per_share || 0).toLocaleString()}
                </TableCell>
                <TableCell className="text-right text-xs">
                  {Number(d.total_shares_at_record_date || 0).toLocaleString()}
                </TableCell>
                <TableCell className="text-right text-xs">
                  {Number(d.total_dividend_amount || 0).toLocaleString()}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      "border-none px-2 py-0.5 text-[10px] font-medium",
                      statusColor[d.status] || ""
                    )}
                  >
                    {String(d.status || "").toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell className="space-x-1 text-right">
                  {(d.status === "draft" || d.status === "generated") && (
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => handleGenerate(d.dividend_declaration_id)}
                      disabled={disabledAction(d.dividend_declaration_id)}
                    >
                      {loadingAction === d.dividend_declaration_id
                        ? "Generating..."
                        : "Generate"}
                    </Button>
                  )}

                  {d.status === "generated" && (
                    <Button
                      size="xs"
                      onClick={() => handlePost(d.dividend_declaration_id)}
                      disabled={disabledAction(d.dividend_declaration_id)}
                    >
                      {loadingAction === d.dividend_declaration_id
                        ? "Posting..."
                        : "Post"}
                    </Button>
                  )}

                  {d.status === "posted" && (
                    <Button
                      size="xs"
                      variant="destructive"
                      onClick={() => handleReverse(d.dividend_declaration_id)}
                      disabled={disabledAction(d.dividend_declaration_id)}
                    >
                      {loadingAction === d.dividend_declaration_id
                        ? "Reversing..."
                        : "Reverse"}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default DividendDeclarations;

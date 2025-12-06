// src/Pages/Shares/Components/Dividends/DividendTransactions.jsx
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const BASE_URL = "/accounting/shares/dividends"; // 🔁 change if needed

const statusColorTx = {
  pending: "bg-amber-100 text-amber-800",
  posted: "bg-emerald-100 text-emerald-800",
  reversed: "bg-red-100 text-red-800",
  failed: "bg-rose-100 text-rose-800",
};

const DividendTransactions = () => {
  const navigate = useNavigate();
  const axiosPrivate = useAxiosPrivate();

  const [selectedId, setSelectedId] = useState("");
  const [error, setError] = useState(null);

  // ===== Get declarations (for select) =====
  const { data: declarations = [], isLoading: loadingDeclarations } = useQuery({
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

  // Auto-select first declaration when list loads
  useEffect(() => {
    if (declarations.length > 0 && !selectedId) {
      setSelectedId(String(declarations[0].dividend_declaration_id));
    }
  }, [declarations, selectedId]);

  // ===== Get transactions for selected declaration =====
  const {
    data: transactions = [],
    isLoading: loadingTransactions,
    isRefetching: refetchingTransactions,
  } = useQuery({
    queryKey: ["dividend-transactions", selectedId],
    enabled: !!selectedId,
    queryFn: async () => {
      if (!selectedId) return [];

      const controller = new AbortController();
      const fetchURL = `${BASE_URL}?action=transactions&dividend_declaration_id=${selectedId}`;

      try {
        const response = await axiosPrivate.get(fetchURL, {
          signal: controller.signal,
        });
        return response?.data?.data?.transactions ?? [];
      } catch (error) {
        if (error?.response?.status === 401) {
          navigate("/", { state: { from: location }, replace: true });
        }
        throw error;
      }
    },
    keepPreviousData: true,
  });

  useEffect(() => {
    setError(null);
  }, [selectedId]);

  const selectedDeclaration = declarations.find(
    (d) => String(d.dividend_declaration_id) === selectedId
  );

  const showTransactionsLoading = loadingTransactions || refetchingTransactions;

  return (
    <div className="space-y-4">
      {/* Header + Select */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Dividend Transactions</h2>
          <p className="text-xs text-muted-foreground">
            View generated dividend distribution per member for a declaration.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Declaration:</span>
          <Select
            value={selectedId}
            onValueChange={(v) => setSelectedId(v)}
            disabled={loadingDeclarations || declarations.length === 0}
          >
            <SelectTrigger className="w-[260px]">
              <SelectValue placeholder="Select declaration" />
            </SelectTrigger>
            <SelectContent>
              {declarations.map((d) => (
                <SelectItem
                  key={d.dividend_declaration_id}
                  value={String(d.dividend_declaration_id)}
                >
                  {d.dividend_declaration_code} — {d.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedDeclaration && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div>
            <span className="font-medium">Status:</span>{" "}
            <span>
              {String(selectedDeclaration.status || "").toUpperCase()}
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Transactions table */}
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Code</TableHead>
              <TableHead className="text-right">Shares @ Record</TableHead>
              <TableHead className="text-right">Dividend Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {showTransactionsLoading && (
              <TableRow>
                <TableCell colSpan={6} className="py-6 text-center text-sm">
                  Loading transactions...
                </TableCell>
              </TableRow>
            )}

            {!showTransactionsLoading && !selectedId && (
              <TableRow>
                <TableCell colSpan={6} className="py-6 text-center text-sm">
                  Select a declaration to view its transactions.
                </TableCell>
              </TableRow>
            )}

            {!showTransactionsLoading &&
              selectedId &&
              transactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-6 text-center text-sm">
                    No dividend transactions found for this declaration.
                  </TableCell>
                </TableRow>
              )}

            {transactions.map((t) => {
              const client = t.client || {};
              const hasName =
                (client.client_firstname || "").length > 0 ||
                (client.client_lastname || "").length > 0;

              const name = hasName
                ? `${client.client_firstname || ""} ${
                    client.client_lastname || ""
                  }`.trim()
                : `Client #${t.client_id}`;

              return (
                <TableRow key={t.dividend_transaction_id}>
                  <TableCell>
                    <div className="text-xs font-medium">{name}</div>
                  </TableCell>
                  <TableCell className="text-xs">
                    {client.client_account_number || t.client_account_id}
                  </TableCell>
                  <TableCell className="font-mono text-[11px]">
                    {t.dividend_transaction_code}
                  </TableCell>
                  <TableCell className="text-right text-xs">
                    {Number(t.shares_at_record_date || 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-xs">
                    {Number(t.dividend_amount || 0).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={statusColorTx[t.status] || ""}
                      variant="outline"
                    >
                      {String(t.status || "").toUpperCase()}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default DividendTransactions;

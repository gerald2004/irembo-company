/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import {
  Banknote, Building2, Smartphone, Monitor, CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import useAuth from "@/MiddleWares/Hooks/useAuth";

const TYPE_ORDER = ["cash", "bank", "mobile_money", "till"];

const TYPE_CONFIG = {
  cash:         { label: "Cash",         Icon: Banknote },
  bank:         { label: "Bank",         Icon: Building2 },
  mobile_money: { label: "Mobile Money", Icon: Smartphone },
  till:         { label: "Till",         Icon: Monitor },
};

/**
 * Two-step linked account picker: pick type → pick specific account.
 *
 * Props:
 *   value      – currently selected linked_account object (or null)
 *   onChange   – (account | null) => void
 *   error      – string (validation message from parent)
 */
export function LinkedChannelPicker({ value, onChange, error }) {
  const axiosPrivate = useAxiosPrivate();
  const { auth } = useAuth();
  const branchId = auth?.current_branch_id ?? auth?.user?.branch_id;

  const [accounts, setAccounts]   = useState([]);
  const [loading, setLoading]     = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [activeType, setActiveType] = useState(value?.type ?? null);

  useEffect(() => {
    setLoading(true);
    setFetchError(null);
    const params = branchId ? { branch_id: branchId } : {};
    axiosPrivate
      .get("/settings/accounts/linked", { params })
      .then((r) => setAccounts(r.data?.data?.linked_accounts ?? []))
      .catch((e) => {
        const msg = e?.response?.data?.messages?.[0]
          ?? e?.response?.data?.message
          ?? e?.message
          ?? "Failed to load channels";
        setFetchError(msg);
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  // Sync active type when value is cleared externally
  useEffect(() => {
    if (!value) setActiveType(null);
    else if (value.type) setActiveType(value.type);
  }, [value]);

  const availableTypes = TYPE_ORDER.filter((t) =>
    accounts.some((a) => a.type === t)
  );

  const handleTypeClick = (type) => {
    setActiveType(type);
    const filtered = accounts.filter((a) => a.type === type);
    if (filtered.length === 1) {
      onChange?.(filtered[0]);
    } else {
      onChange?.(null);
    }
  };

  const handleAccountClick = (acc) => {
    onChange?.(acc);
  };

  const filtered = activeType
    ? accounts.filter((a) => a.type === activeType)
    : [];

  if (loading)
    return (
      <p className="text-sm text-muted-foreground py-2">
        Loading channels…
      </p>
    );

  if (fetchError)
    return (
      <div className="text-sm text-destructive border border-destructive/30 rounded-lg p-3">
        {fetchError}
      </div>
    );

  if (!accounts.length)
    return (
      <div className="text-sm text-muted-foreground border rounded-lg p-3">
        No transaction channels configured. Contact your administrator.
      </div>
    );

  return (
    <div className="space-y-3">
      {/* Type buttons */}
      <div className="flex flex-wrap gap-2">
        {availableTypes.map((type) => {
          const { label, Icon } = TYPE_CONFIG[type];
          const isActive = activeType === type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => handleTypeClick(type)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors",
                isActive
                  ? "bg-foreground text-background border-foreground"
                  : "border-border hover:bg-muted"
              )}
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          );
        })}
      </div>

      {/* Account list */}
      {activeType && filtered.length > 1 && (
        <div className="space-y-1.5">
          {filtered.map((acc) => {
            const isSelected =
              value?.linked_account_id === acc.linked_account_id;
            const label =
              acc.provider_name || acc.account_title || "Account";
            const sub =
              acc.account_title && acc.account_title !== acc.provider_name
                ? acc.account_title
                : null;

            return (
              <button
                key={acc.linked_account_id}
                type="button"
                onClick={() => handleAccountClick(acc)}
                className={cn(
                  "w-full flex items-center gap-3 p-2.5 rounded-lg border text-left text-sm transition-colors",
                  isSelected
                    ? "border-foreground bg-foreground/5 font-medium"
                    : "border-border hover:bg-muted"
                )}
              >
                <span className="flex-1 min-w-0">
                  <span className="block truncate">{label}</span>
                  {sub && (
                    <span className="block text-xs text-muted-foreground truncate">
                      {sub}
                    </span>
                  )}
                  {!acc.is_global && acc.branches?.length > 0 && (
                    <span className="block text-xs text-muted-foreground truncate">
                      {acc.branches.map((b) => b.branch_name).join(", ")}
                    </span>
                  )}
                </span>
                {acc.is_global && (
                  <span className="shrink-0 text-xs text-muted-foreground">
                    All branches
                  </span>
                )}
                {isSelected && (
                  <CheckCircle className="size-4 shrink-0 text-green-600" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Auto-selected single account */}
      {activeType && filtered.length === 1 && value && (
        <div className="flex items-center gap-2 text-sm border rounded-lg p-2.5 bg-foreground/5 border-foreground/20">
          <CheckCircle className="size-4 text-green-600 shrink-0" />
          <span className="flex-1 truncate font-medium">
            {value.provider_name || value.account_title || "Account"}
          </span>
          {value.is_global ? (
            <span className="text-xs text-muted-foreground">All branches</span>
          ) : value.branches?.length > 0 ? (
            <span className="text-xs text-muted-foreground">
              {value.branches.map((b) => b.branch_name).join(", ")}
            </span>
          ) : null}
        </div>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
}

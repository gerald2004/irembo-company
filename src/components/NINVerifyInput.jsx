/* eslint-disable react/prop-types */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Loader,
  ScanSearch,
  ShieldCheck,
  ShieldX,
  ShieldAlert,
  AlertTriangle,
  Banknote,
  CheckCircle,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";

const NINResultCard = ({ data, onAccept }) => {
  if (!data) return null;
  const v = data.validation;
  const isValid = v.nin_status === "VALID" && v.status === "SUCCESSFUL";
  const isInvalid = v.nin_status === "INVALID";

  return (
    <div
      className={`rounded-lg border p-4 text-sm space-y-3 ${
        isValid
          ? "border-green-300 bg-green-50 dark:bg-green-950/30"
          : isInvalid
          ? "border-red-300 bg-red-50 dark:bg-red-950/30"
          : "border-amber-300 bg-amber-50 dark:bg-amber-950/30"
      }`}
    >
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 font-semibold">
          {isValid ? (
            <ShieldCheck className="w-5 h-5 text-green-600" />
          ) : isInvalid ? (
            <ShieldX className="w-5 h-5 text-red-600" />
          ) : (
            <ShieldAlert className="w-5 h-5 text-amber-600" />
          )}
          NIN Verification Result
        </div>
        <div className="flex gap-2">
          <Badge variant={isValid ? "success" : isInvalid ? "destructive" : "warning"}>
            {v.nin_status}
          </Badge>
          <Badge variant="outline">{v.status}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
        <div>
          <span className="text-muted-foreground">NIN: </span>
          <span className="font-mono font-medium">{v.nin}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Name: </span>
          <span className="font-medium">{v.name}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Date of Birth: </span>
          <span className="font-medium">{v.date_of_birth}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Reference: </span>
          <span className="font-mono text-xs">{v.reference}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Timestamp: </span>
          <span>{v.timestamp}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1 border-t text-xs text-muted-foreground">
        <Banknote className="w-4 h-4 shrink-0" />
        <span>
          Charge:{" "}
          <strong>
            {v.currency} {v.charge?.toLocaleString()}
          </strong>{" "}
          + VAT{" "}
          <strong>
            {v.currency} {(v.cost - v.charge)?.toLocaleString()}
          </strong>{" "}
          = Total{" "}
          <strong>
            {v.currency} {v.cost?.toLocaleString()}
          </strong>
        </span>
      </div>

      {isValid && onAccept && (
        <Button size="sm" className="w-full" onClick={() => onAccept(v)}>
          <CheckCircle className="w-4 h-4 mr-2" />
          Accept &amp; Auto-fill Name / Date of Birth
        </Button>
      )}
    </div>
  );
};

/**
 * NINVerifyInput — controlled identification input with integrated NIN verification.
 *
 * Props:
 *   value       - controlled value (string)
 *   onChange    - called with the new string value on input change
 *   onAccept    - optional, called with the validation object when user accepts
 *   maxLength   - defaults to 14
 *   placeholder - defaults to "Enter National ID number"
 *   error       - RHF error message string to display below the input
 */
export function NINVerifyInput({
  value = "",
  onChange,
  onAccept,
  maxLength = 14,
  placeholder = "Enter National ID number",
  error,
}) {
  const axiosPrivate = useAxiosPrivate();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [verifyError, setVerifyError] = useState(null);

  const handleInput = (e) => {
    const val = e.target.value.toUpperCase();
    if (onChange) onChange(val);
    setResult(null);
    setVerifyError(null);
  };

  const handleVerify = async () => {
    if (!value || value.length < 8) {
      toast({ title: "Enter an ID number first", variant: "destructive" });
      return;
    }
    setLoading(true);
    setResult(null);
    setVerifyError(null);
    try {
      const res = await axiosPrivate.post("/credit-enquiry/nin-validation", {
        identifier: value,
      });
      setResult(res.data.data);
    } catch (err) {
      const msg =
        err?.response?.data?.messages?.[0] ||
        err?.response?.data?.message ||
        "Verification failed — continue manually.";
      setVerifyError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={handleInput}
          placeholder={placeholder}
          maxLength={maxLength}
          className="uppercase flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 whitespace-nowrap"
          onClick={handleVerify}
          disabled={loading || !value}
        >
          {loading ? (
            <>
              <Loader className="w-4 h-4 animate-spin mr-1" /> Verifying...
            </>
          ) : (
            <>
              <ScanSearch className="w-4 h-4 mr-1" /> Verify NIN
            </>
          )}
        </Button>
      </div>

      {error && <p className="text-red-500 text-xs">{error}</p>}

      {!result && !verifyError && !loading && (
        <div className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground bg-muted/30">
          <p className="font-medium mb-1 flex items-center gap-1.5">
            <Banknote className="w-4 h-4" /> NIN Verification Notice
          </p>
          <p>
            Clicking <strong>Verify NIN</strong> queries the national identity
            database. A fee applies per query regardless of result. Only verify
            when ready to proceed.
          </p>
        </div>
      )}

      {loading && (
        <p className="text-blue-600 text-xs flex items-center gap-1">
          <Loader className="w-3 h-3 animate-spin" /> Querying national
          database — fee will be charged...
        </p>
      )}

      {verifyError && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-3 text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800">Verification unavailable</p>
            <p className="text-amber-700 mt-0.5">{verifyError}</p>
            <p className="text-amber-600 mt-1">
              You may continue and fill in details manually.
            </p>
          </div>
        </div>
      )}

      {result && <NINResultCard data={result} onAccept={onAccept} />}
    </div>
  );
}

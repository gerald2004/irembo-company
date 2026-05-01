/* eslint-disable react/prop-types */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader,
  Phone,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";

/**
 * PhoneVerifyInput — controlled phone input with integrated name lookup.
 *
 * Props:
 *   value       - controlled value (string)
 *   onChange    - called with the new string value on input change
 *   onAccept    - optional, called with { firstname, lastname, phone } on accept
 *   error       - RHF error message string
 *   placeholder - defaults to "Enter phone number e.g. 2567XXXXXXXX"
 */
export function PhoneVerifyInput({
  value = "",
  onChange,
  onAccept,
  error,
  placeholder = "Enter phone number e.g. 2567XXXXXXXX",
}) {
  const axiosPrivate = useAxiosPrivate();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [verifyError, setVerifyError] = useState(null);

  const handleInput = (e) => {
    const val = e.target.value;
    if (onChange) onChange(val);
    setResult(null);
    setVerifyError(null);
  };

  const handleVerify = async () => {
    if (!value || value.length < 10) {
      toast({ title: "Enter a valid phone number first", variant: "destructive" });
      return;
    }
    setLoading(true);
    setResult(null);
    setVerifyError(null);
    try {
      const res = await axiosPrivate.post("/phone-name-verification", {
        phone: value,
      });
      if (res.data.success) {
        setResult(res.data);
      } else {
        setVerifyError(res.data.error || "Could not retrieve name for this number.");
      }
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Verification failed — continue manually.";
      setVerifyError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    if (onAccept && result) onAccept(result);
    toast({
      title: "Applied",
      description: `Name pre-filled: ${result.firstname} ${result.lastname}`,
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          type="tel"
          value={value}
          onChange={handleInput}
          placeholder={placeholder}
          maxLength={12}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 whitespace-nowrap"
          onClick={handleVerify}
          disabled={loading || !value || value.length < 10}
        >
          {loading ? (
            <>
              <Loader className="w-4 h-4 animate-spin mr-1" /> Verifying...
            </>
          ) : (
            <>
              <Phone className="w-4 h-4 mr-1" /> Verify
            </>
          )}
        </Button>
      </div>

      {error && <p className="text-red-500 text-xs">{error}</p>}

      {loading && (
        <p className="text-blue-600 text-xs flex items-center gap-1">
          <Loader className="w-3 h-3 animate-spin" /> Looking up name...
        </p>
      )}

      {result && (
        <div className="rounded-lg border border-green-300 bg-green-50 dark:bg-green-950/30 p-3 text-xs space-y-2">
          <div className="flex items-center gap-2 font-semibold text-green-800 dark:text-green-300">
            <CheckCircle className="w-4 h-4" />
            Name Found
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <div>
              <span className="text-muted-foreground">First Name: </span>
              <span className="font-medium">{result.firstname}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Last Name: </span>
              <span className="font-medium">{result.lastname}</span>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">Phone: </span>
              <span className="font-mono">{result.phone}</span>
            </div>
          </div>
          {onAccept && (
            <Button size="sm" className="w-full" onClick={handleAccept}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Accept &amp; Auto-fill Name
            </Button>
          )}
        </div>
      )}

      {verifyError && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-3 text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800">Lookup unavailable</p>
            <p className="text-amber-700 mt-0.5">{verifyError}</p>
            <p className="text-amber-600 mt-1">
              You may continue and enter the name manually.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

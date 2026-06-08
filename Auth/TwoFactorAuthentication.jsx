import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "@/MiddleWares/Hooks/useAuth";
import useLogout from "@/MiddleWares/Hooks/useLogout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/icons";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import AlertModal from "@/components/AlertModal";
import axios from "@/Config/Axios";
import {
  Smartphone, MessageSquare, Mail, KeyRound, RefreshCw,
  ShieldCheck, Eye, EyeOff, Copy, LogOut,
} from "lucide-react";

/* ── Digit-jumping OTP input ─────────────────────────────────────────────── */
const OtpInput = ({ value, onChange, disabled }) => {
  const digits = Array(6).fill("").map((_, i) => value[i] ?? "");

  const handleChange = (i, v) => {
    const d = v.replace(/\D/g, "");
    const next = digits.map((c, idx) => (idx === i ? d.slice(-1) : c)).join("");
    onChange(next);
    if (d && i < 5) document.getElementById(`lv-otp-${i + 1}`)?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !digits[i] && i > 0)
      document.getElementById(`lv-otp-${i - 1}`)?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) { onChange(pasted); document.getElementById("lv-otp-5")?.focus(); }
    e.preventDefault();
  };

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {Array(6).fill(0).map((_, i) => (
        <Input
          key={i}
          id={`lv-otp-${i}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          disabled={disabled}
          value={digits[i] ?? ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="w-12 h-14 text-center text-xl font-mono font-bold"
          autoFocus={i === 0}
        />
      ))}
    </div>
  );
};

/* ── Main page ───────────────────────────────────────────────────────────── */
const TwoFactorAuthentication = () => {
  const { auth, setAuth } = useAuth();
  const navigate          = useNavigate();
  const logout            = useLogout();

  const [code,             setCode]             = useState("");
  const [isLoading,        setIsLoading]        = useState(false);
  const [showSecret,       setShowSecret]       = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [resendDisabled,   setResendDisabled]   = useState(true);
  const [counter,          setCounter]          = useState(30);
  const [attemptCount,     setAttemptCount]     = useState(1);

  const method          = auth?.twoFactorMethod ?? "sms";
  const isApp           = method === "app";
  const setupData       = auth?.twoFactorSetup ?? null;  // { secret, qr_code, issuer, account }
  const isFirstTimeSetup = auth?.requiresTotpSetup === true && !!setupData;

  // Guard
  useEffect(() => {
    if (!auth?.sessionid) navigate("/", { replace: true });
  }, [auth?.sessionid, navigate]);

  // Resend countdown (SMS / Email only)
  useEffect(() => {
    if (!isApp && resendDisabled) {
      const timer = setInterval(() => {
        setCounter((prev) => {
          if (prev <= 1) { clearInterval(timer); setResendDisabled(false); return 0; }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [resendDisabled, isApp]);

  /* ── Submit code ── */
  const onSubmit = async (e) => {
    e?.preventDefault();
    if (code.length < 6) return;
    try {
      setIsLoading(true);
      const res = await axios.post(
        "/auth/advanced/two-factor",
        { sessionId: auth.sessionid, code },
        { withCredentials: true }
      );

      const {
        accessToken, sessionId, roles, user,
        fiscal_year, current_branch_id, allowed_branches,
      } = res.data.data;

      setAuth({
        sessionid: sessionId, accessToken, roles, user,
        fiscalYear: fiscal_year, current_branch_id, allowed_branches,
        otpVerified: true,
        twoFactorMethod: undefined, twoFactorSetup: undefined, requiresTotpSetup: undefined,
      });

      setIsLoading(false);
      navigate("/dashboard", { replace: true });

    } catch (err) {
      setIsLoading(false);
      setCode("");
      document.getElementById("lv-otp-0")?.focus();
      const msg = err?.response?.data?.messages?.[0] ?? err?.response?.data?.messages ?? "Verification failed";
      toast({
        title: "Incorrect code",
        variant: "destructive",
        description: Array.isArray(msg) ? msg.join(" ") : msg,
      });
    }
  };

  /* ── Resend OTP (SMS / Email) ── */
  const handleResend = async () => {
    if (attemptCount >= 2) { setShowLogoutDialog(true); return; }
    try {
      setIsLoading(true);
      const res = await axios.patch(
        "/auth/advanced/two-factor",
        { sessionId: auth?.sessionid },
      );
      setAttemptCount((prev) => prev + 1);
      setCounter(attemptCount * 30);
      setResendDisabled(true);
      setIsLoading(false);
      toast({ title: "New code sent", description: res?.data?.messages?.[0] ?? "Check your phone/email." });
    } catch (err) {
      setIsLoading(false);
      toast({
        title: "Resend failed",
        variant: "destructive",
        description: err?.response?.data?.messages?.[0] ?? "Server error",
        action: <ToastAction altText="Retry">Retry</ToastAction>,
      });
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(setupData?.secret ?? "");
    toast({ title: "Secret copied to clipboard" });
  };

  const signOut = async () => { await logout(); navigate("/"); };

  /* ── Method icon + label ── */
  const MethodIcon = isApp ? Smartphone : method === "email" ? Mail : MessageSquare;
  const methodLabel = isApp ? "Authenticator App"
    : method === "email" ? "Email"
    : "SMS / Phone";

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md space-y-4">

        {/* Header */}
        <div className="text-center space-y-1">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Two-Factor Authentication</h1>
          <p className="text-sm text-muted-foreground">
            {isFirstTimeSetup
              ? "Set up your Google Authenticator to continue"
              : `Verify your identity via ${methodLabel}`}
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <MethodIcon className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-sm font-semibold">
                {isFirstTimeSetup ? "Connect Google Authenticator" : "Enter Verification Code"}
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              {isFirstTimeSetup
                ? "Scan the QR code with Google Authenticator, then enter the 6-digit code to confirm."
                : isApp
                  ? "Open Google Authenticator and enter the current 6-digit code for this account."
                  : `Enter the 6-digit code sent to your ${method === "email" ? "email address" : "phone number"}.`}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">

            {/* ── First-time TOTP setup: show QR code ── */}
            {isFirstTimeSetup && setupData && (
              <div className="space-y-4">
                {/* Step 1: Scan */}
                <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 text-xs text-blue-800 dark:text-blue-300">
                  <strong>Step 1:</strong> Open Google Authenticator → tap <strong>+</strong> → <strong>Scan a QR code</strong>
                </div>

                {/* QR code image */}
                <div className="flex justify-center">
                  <div className="p-3 bg-white rounded-xl border-2 shadow-sm inline-block">
                    <img
                      src={setupData.qr_code}
                      alt="Scan with Google Authenticator"
                      className="w-48 h-48"
                      draggable={false}
                    />
                  </div>
                </div>

                {/* Manual entry key */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    Can&apos;t scan? Enter this key in your app:
                  </Label>
                  <div className="flex gap-1.5">
                    <Input
                      readOnly
                      type={showSecret ? "text" : "password"}
                      value={setupData.secret ?? ""}
                      className="font-mono text-xs h-8 tracking-widest"
                    />
                    <Button size="sm" variant="ghost" className="h-8 px-2" type="button"
                      onClick={() => setShowSecret(v => !v)}>
                      {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 px-2" type="button"
                      onClick={copySecret}>
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Choose <strong>Time-based</strong> when adding manually. Account: <strong>{setupData.account}</strong>
                  </p>
                </div>

                <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 text-xs text-blue-800 dark:text-blue-300">
                  <strong>Step 2:</strong> Enter the 6-digit code shown in the app below to activate 2FA.
                </div>
              </div>
            )}

            {/* ── OTP Input ── */}
            <form onSubmit={onSubmit} className="space-y-4">
              <OtpInput value={code} onChange={setCode} disabled={isLoading} />

              <Button
                type="submit"
                className="w-full h-11"
                disabled={code.length < 6 || isLoading}
              >
                {isLoading
                  ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Verifying…</>
                  : <><KeyRound className="w-4 h-4 mr-2" /> {isFirstTimeSetup ? "Verify &amp; Activate" : "Verify"}</>
                }
              </Button>
            </form>

            {/* ── Resend — SMS / Email only ── */}
            {!isApp && (
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                <span>Didn&apos;t receive the code?</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={handleResend}
                  disabled={resendDisabled || isLoading}
                >
                  {resendDisabled ? `Resend in ${counter}s` : "Resend Code"}
                </Button>
              </div>
            )}

            {/* ── Sign out ── */}
            <div className="pt-1 border-t">
              <Button
                size="sm"
                variant="ghost"
                className="w-full h-8 text-xs text-muted-foreground"
                onClick={() => setShowLogoutDialog(true)}
              >
                <LogOut className="w-3.5 h-3.5 mr-1.5" /> Sign in with a different account
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Protected by two-factor authentication
        </p>
      </div>

      <AlertModal
        showDialog={showLogoutDialog}
        setShowDialog={setShowLogoutDialog}
        title="Sign Out?"
        message="This will cancel the current login attempt. You will be returned to the login page."
        method={signOut}
        buttonName="Sign Out"
      />
    </div>
  );
};

export default TwoFactorAuthentication;

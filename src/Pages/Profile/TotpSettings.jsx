/* eslint-disable react/prop-types */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Shield, ShieldCheck, ShieldOff, Smartphone, MessageSquare, Mail,
  KeyRound, CheckCircle2, AlertTriangle, Copy, RefreshCw, Eye, EyeOff,
} from "lucide-react";

// ── OTP input ────────────────────────────────────────────────────────────────
const OtpInput = ({ value, onChange, disabled }) => {
  const digits = Array(6).fill("").map((_, i) => value[i] ?? "");

  const handleChange = (i, v) => {
    const d = v.replace(/\D/g, "");
    const next = digits.map((c, idx) => (idx === i ? d.slice(-1) : c)).join("");
    onChange(next);
    if (d && i < 5) document.getElementById(`otp-${i + 1}`)?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !digits[i] && i > 0)
      document.getElementById(`otp-${i - 1}`)?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) { onChange(pasted); document.getElementById("otp-5")?.focus(); }
    e.preventDefault();
  };

  return (
    <div className="flex gap-2 justify-center" onPaste={handlePaste}>
      {Array(6).fill(0).map((_, i) => (
        <Input
          key={i}
          id={`otp-${i}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          disabled={disabled}
          value={digits[i] ?? ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="w-11 h-12 text-center text-lg font-mono font-bold"
        />
      ))}
    </div>
  );
};

// ── Method definitions ────────────────────────────────────────────────────────
const METHODS = [
  {
    id: "sms",
    label: "SMS",
    description: "One-time code sent to your phone",
    icon: MessageSquare,
    accent: "bg-blue-500",
    iconBg: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  },
  {
    id: "email",
    label: "Email",
    description: "One-time code sent to your email",
    icon: Mail,
    accent: "bg-violet-500",
    iconBg: "bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
  },
  {
    id: "app",
    label: "Authenticator App",
    description: "Google Authenticator or any TOTP app",
    icon: Smartphone,
    accent: "bg-emerald-500",
    iconBg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
];

// ── Step state ────────────────────────────────────────────────────────────────
const STEP = {
  IDLE:              "idle",
  METHOD_SELECT:     "method_select",
  OTP_SENT:          "otp_sent",
  APP_SCANNING:      "app_scanning",
  VERIFYING:         "verifying",
  DONE:              "done",
  DISABLE_REQUEST:   "disable_request",
  DISABLE_OTP_SENT:  "disable_otp_sent",
  DISABLE_VERIFY:    "disable_verify",
};

// ─────────────────────────────────────────────────────────────────────────────
const TotpSettings = () => {
  const axiosPrivate = useAxiosPrivate();
  const queryClient  = useQueryClient();

  const [step,         setStep]         = useState(STEP.IDLE);
  const [pickMethod,   setPickMethod]   = useState(null);   // method being set up
  const [code,         setCode]         = useState("");
  const [disableCode,  setDisableCode]  = useState("");
  const [showSecret,   setShowSecret]   = useState(false);
  const [setupData,    setSetupData]    = useState(null);   // { secret, qr_code, sent_to }
  const [showDisable,  setShowDisable]  = useState(false);

  // ── Fetch status ────────────────────────────────────────────────────────────
  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ["totp-status"],
    queryFn: async () => {
      const res = await axiosPrivate.get("/accounts/profile/2fa");
      return res.data.data;
    },
  });

  const isEnabled   = status?.enabled === "yes" && status?.is_verified === "yes";
  const activeMethod = isEnabled ? status?.method : null;

  // ── Initiate setup / send OTP ────────────────────────────────────────────────
  const initMutation = useMutation({
    mutationFn: ({ method }) =>
      axiosPrivate.post("/accounts/profile/2fa", { method, purpose: "setup" }),
    onSuccess: (res, { method }) => {
      const d = res.data.data;
      setSetupData(d);
      setCode("");
      if (method === "app") setStep(STEP.APP_SCANNING);
      else                  setStep(STEP.OTP_SENT);
    },
    onError: (e) => toast({
      title: "Setup failed",
      description: e?.response?.data?.messages?.[0] ?? "Server error",
      variant: "destructive",
    }),
  });

  // ── Confirm / activate ───────────────────────────────────────────────────────
  const confirmMutation = useMutation({
    mutationFn: (otp) => axiosPrivate.put("/accounts/profile/2fa", { code: otp }),
    onSuccess: () => {
      queryClient.invalidateQueries(["totp-status"]);
      setStep(STEP.DONE);
      setCode("");
      toast({ title: "Two-factor authentication enabled!", variant: "success" });
    },
    onError: (e) => {
      setCode("");
      toast({
        title: "Verification failed",
        description: e?.response?.data?.messages?.[0] ?? "Invalid code",
        variant: "destructive",
      });
    },
  });

  // ── Request disable OTP (sms / email) ───────────────────────────────────────
  const disableRequestMutation = useMutation({
    mutationFn: () =>
      axiosPrivate.post("/accounts/profile/2fa", { method: activeMethod, purpose: "disable" }),
    onSuccess: (res) => {
      setSetupData(res.data.data);
      setStep(STEP.DISABLE_OTP_SENT);
      toast({ title: "Verification code sent", description: `Sent to ${res.data.data?.sent_to}` });
    },
    onError: (e) => toast({
      title: "Failed to send code",
      description: e?.response?.data?.messages?.[0] ?? "Server error",
      variant: "destructive",
    }),
  });

  // ── Disable ──────────────────────────────────────────────────────────────────
  const disableMutation = useMutation({
    mutationFn: (otp) => axiosPrivate.delete("/accounts/profile/2fa", { data: { code: otp } }),
    onSuccess: () => {
      queryClient.invalidateQueries(["totp-status"]);
      setShowDisable(false);
      setDisableCode("");
      setStep(STEP.IDLE);
      toast({ title: "Two-factor authentication disabled" });
    },
    onError: (e) => {
      setDisableCode("");
      toast({
        title: "Failed to disable",
        description: e?.response?.data?.messages?.[0] ?? "Invalid code",
        variant: "destructive",
      });
    },
  });

  const copySecret = () => {
    navigator.clipboard.writeText(setupData?.secret ?? "");
    toast({ title: "Secret key copied to clipboard" });
  };

  const resetFlow = () => {
    setStep(STEP.IDLE);
    setPickMethod(null);
    setCode("");
    setSetupData(null);
    setShowSecret(false);
  };

  const startSetup = (method) => {
    setPickMethod(method);
    setCode("");
    setStep(STEP.METHOD_SELECT);
  };

  if (statusLoading) {
    return <div className="h-36 rounded-xl border bg-muted/30 animate-pulse" />;
  }

  return (
    <>
      <Card className="border-2 border-dashed border-muted">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isEnabled
                ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                : "bg-muted text-muted-foreground"}`}>
                {isEnabled ? <ShieldCheck className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
              </div>
              <div>
                <CardTitle className="text-base">Two-Factor Authentication</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Add an extra layer of security to your account
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className={isEnabled
              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800"
              : "bg-muted text-muted-foreground"}>
              {isEnabled ? `Enabled · ${METHODS.find(m => m.id === activeMethod)?.label ?? activeMethod}` : "Disabled"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-0 space-y-4">

          {/* ── Active info strip ── */}
          {isEnabled && step === STEP.IDLE && (
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground border rounded-lg p-3 bg-muted/30">
              {status?.confirmed_at && (
                <span><strong>Enabled:</strong> {new Date(status.confirmed_at).toLocaleDateString()}</span>
              )}
              {status?.last_used_at && (
                <span><strong>Last used:</strong> {new Date(status.last_used_at).toLocaleDateString()}</span>
              )}
            </div>
          )}

          {/* ── STEP: IDLE — method selector ── */}
          {step === STEP.IDLE && (
            <div className="space-y-3">
              {!isEnabled && (
                <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 flex gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 dark:text-amber-300">
                    <strong>Enhance your security.</strong> Choose a verification method below to protect your account.
                  </p>
                </div>
              )}

              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {isEnabled ? "Switch verification method" : "Choose verification method"}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {METHODS.map(({ id, label, description, icon: Icon, accent, iconBg }) => {
                  const isActive = activeMethod === id;
                  return (
                    <button
                      key={id}
                      onClick={() => !isActive && startSetup(id)}
                      className={`relative text-left rounded-xl border-2 p-4 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring
                        ${isActive
                          ? "border-emerald-400 dark:border-emerald-600 bg-emerald-50/50 dark:bg-emerald-900/20 cursor-default"
                          : "border-muted hover:border-primary/40 hover:bg-muted/40 cursor-pointer"}`}
                    >
                      <div className={`h-0.5 absolute top-0 left-0 right-0 rounded-t-xl ${isActive ? "bg-emerald-500" : accent}`} />
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2.5 ${iconBg}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <p className="text-sm font-semibold leading-tight">{label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                      {isActive && (
                        <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {isEnabled && (
                <div className="pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5"
                    onClick={() => { setShowDisable(true); setDisableCode(""); setStep(STEP.DISABLE_REQUEST); }}
                  >
                    <ShieldOff className="w-3.5 h-3.5 mr-1.5" /> Disable 2FA
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* ── STEP: METHOD_SELECT — confirm selection before sending ── */}
          {step === STEP.METHOD_SELECT && pickMethod && (() => {
            const m = METHODS.find(x => x.id === pickMethod);
            const Icon = m.icon;
            return (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 rounded-xl border bg-muted/30">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${m.iconBg}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{m.label}</p>
                    <p className="text-xs text-muted-foreground">{m.description}</p>
                  </div>
                </div>

                {pickMethod === "sms" && (
                  <p className="text-xs text-muted-foreground">
                    A 6-digit code will be sent to <strong>{status?.phone_hint}</strong>
                  </p>
                )}
                {pickMethod === "email" && (
                  <p className="text-xs text-muted-foreground">
                    A 6-digit code will be sent to <strong>{status?.email_hint}</strong>
                  </p>
                )}
                {pickMethod === "app" && (
                  <p className="text-xs text-muted-foreground">
                    You will scan a QR code with your authenticator app (Google Authenticator, Authy, etc.)
                  </p>
                )}

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="h-9"
                    onClick={() => initMutation.mutate({ method: pickMethod })}
                    disabled={initMutation.isPending}
                  >
                    {initMutation.isPending
                      ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Sending…</>
                      : pickMethod === "app" ? "Generate QR Code" : "Send Verification Code"
                    }
                  </Button>
                  <Button size="sm" variant="ghost" className="h-9" onClick={resetFlow}>Cancel</Button>
                </div>
              </div>
            );
          })()}

          {/* ── STEP: OTP_SENT (sms/email) ── */}
          {step === STEP.OTP_SENT && (
            <div className="space-y-4">
              <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 text-xs text-blue-800 dark:text-blue-300">
                Enter the 6-digit code sent to <strong>{setupData?.sent_to}</strong>
              </div>
              <div className="space-y-3">
                <OtpInput value={code} onChange={setCode} disabled={confirmMutation.isPending} />
                <div className="flex gap-2 justify-center">
                  <Button
                    size="sm"
                    className="h-9 px-6"
                    onClick={() => confirmMutation.mutate(code)}
                    disabled={code.length < 6 || confirmMutation.isPending}
                  >
                    {confirmMutation.isPending
                      ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Verifying…</>
                      : <><KeyRound className="w-4 h-4 mr-2" /> Verify &amp; Enable</>
                    }
                  </Button>
                  <Button
                    size="sm" variant="ghost" className="h-9"
                    onClick={() => initMutation.mutate({ method: pickMethod })}
                    disabled={initMutation.isPending}
                  >
                    Resend
                  </Button>
                  <Button size="sm" variant="ghost" className="h-9" onClick={resetFlow}>Cancel</Button>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP: APP_SCANNING ── */}
          {step === STEP.APP_SCANNING && setupData && (
            <div className="space-y-5">
              <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 text-xs text-blue-800 dark:text-blue-300">
                <strong>Step 1:</strong> Open Google Authenticator, tap <strong>+</strong>, then scan the QR code below.
              </div>

              <div className="flex flex-col items-center gap-4">
                <div className="p-3 bg-white rounded-xl border-2 border-muted shadow-sm inline-block">
                  <img src={setupData.qr_code} alt="QR Code" className="w-52 h-52" draggable={false} />
                </div>

                <div className="w-full max-w-sm space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Can&apos;t scan? Enter this key manually:</Label>
                  <div className="flex gap-1.5">
                    <Input
                      readOnly
                      type={showSecret ? "text" : "password"}
                      value={setupData.secret}
                      className="font-mono text-xs h-8 tracking-wider"
                    />
                    <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => setShowSecret(v => !v)}>
                      {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 px-2" onClick={copySecret}>
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Account: <strong>{setupData.issuer}</strong> — select &quot;Time based&quot; in your app.
                  </p>
                </div>
              </div>

              <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 text-xs text-blue-800 dark:text-blue-300">
                <strong>Step 2:</strong> Enter the 6-digit code from your authenticator app to confirm.
              </div>

              <div className="space-y-3">
                <OtpInput value={code} onChange={setCode} disabled={confirmMutation.isPending} />
                <div className="flex gap-2 justify-center">
                  <Button
                    size="sm"
                    className="h-9 px-6"
                    onClick={() => confirmMutation.mutate(code)}
                    disabled={code.length < 6 || confirmMutation.isPending}
                  >
                    {confirmMutation.isPending
                      ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Verifying…</>
                      : <><KeyRound className="w-4 h-4 mr-2" /> Verify &amp; Enable</>
                    }
                  </Button>
                  <Button size="sm" variant="ghost" className="h-9" onClick={resetFlow}>Cancel</Button>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP: DONE ── */}
          {step === STEP.DONE && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">2FA activated successfully!</p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                    You&apos;ll now need to verify your identity on every sign-in.
                  </p>
                </div>
              </div>
              <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={resetFlow}>Back to settings</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Disable dialog ── */}
      <Dialog
        open={showDisable}
        onOpenChange={(o) => {
          if (!o) { setShowDisable(false); setDisableCode(""); setStep(STEP.IDLE); }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldOff className="w-5 h-5 text-destructive" /> Disable 2FA
            </DialogTitle>
            <DialogDescription>
              Verify your identity to remove the extra security layer from your account.
            </DialogDescription>
          </DialogHeader>

          {/* App: direct OTP entry */}
          {activeMethod === "app" && (
            <div className="space-y-4 py-2">
              <p className="text-xs text-muted-foreground text-center">
                Open your authenticator app and enter the current 6-digit code.
              </p>
              <OtpInput value={disableCode} onChange={setDisableCode} disabled={disableMutation.isPending} />
            </div>
          )}

          {/* SMS / Email: send OTP first */}
          {(activeMethod === "sms" || activeMethod === "email") && (
            <div className="space-y-4 py-2">
              {step === STEP.DISABLE_REQUEST && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground text-center">
                    We&apos;ll send a verification code to{" "}
                    <strong>{activeMethod === "sms" ? status?.phone_hint : status?.email_hint}</strong>
                  </p>
                  <Button
                    size="sm"
                    className="w-full h-9"
                    onClick={() => disableRequestMutation.mutate()}
                    disabled={disableRequestMutation.isPending}
                  >
                    {disableRequestMutation.isPending
                      ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Sending…</>
                      : `Send Code via ${activeMethod === "sms" ? "SMS" : "Email"}`
                    }
                  </Button>
                </div>
              )}

              {step === STEP.DISABLE_OTP_SENT && (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground text-center">
                    Enter the code sent to <strong>{setupData?.sent_to}</strong>
                  </p>
                  <OtpInput value={disableCode} onChange={setDisableCode} disabled={disableMutation.isPending} />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full h-8 text-xs"
                    onClick={() => disableRequestMutation.mutate()}
                    disabled={disableRequestMutation.isPending}
                  >
                    Resend code
                  </Button>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setShowDisable(false); setDisableCode(""); setStep(STEP.IDLE); }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => disableMutation.mutate(disableCode)}
              disabled={
                disableCode.length < 6 ||
                disableMutation.isPending ||
                ((activeMethod === "sms" || activeMethod === "email") && step === STEP.DISABLE_REQUEST)
              }
            >
              {disableMutation.isPending
                ? <><RefreshCw className="w-4 h-4 mr-1.5 animate-spin" /> Disabling…</>
                : "Confirm Disable"
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TotpSettings;

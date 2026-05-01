/* eslint-disable react/prop-types */
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { toast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ShieldCheck, Loader2, CheckCircle2, XCircle,
  ExternalLink, AlertCircle, ChevronDown, ChevronUp, RefreshCw,
  User, Phone, CalendarDays, Globe, Hash, AlertTriangle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

// ─── helpers ─────────────────────────────────────────────────────────────────

const fmt = (n) => Number(n || 0).toLocaleString("en-UG");

function normalisePhone(v) {
  const digits = (v ?? "").replace(/\D/g, "");
  if (digits.startsWith("256")) return digits;
  if (digits.startsWith("0")) return "256" + digits.slice(1);
  if (digits.length === 9) return "256" + digits;
  return digits;
}

function scoreColor(score) {
  const s = Number(score ?? 0);
  if (s >= 700) return "text-green-600";
  if (s >= 600) return "text-emerald-600";
  if (s >= 500) return "text-amber-600";
  if (s >= 400) return "text-orange-600";
  return "text-red-600";
}

function scoreLabel(score) {
  const s = Number(score ?? 0);
  if (s >= 700) return "Excellent";
  if (s >= 600) return "Good";
  if (s >= 500) return "Fair";
  if (s >= 400) return "Poor";
  return "Very Poor";
}

const SCORE_CHECKS = [
  { code: "individual_credit_score", label: "Individual Credit Score", entityType: 0, mode: "score" },
  { code: "business_credit_score",   label: "Business Credit Score",   entityType: 1, mode: "score" },
  { code: "crb_report",              label: "Full CRB Report (PDF)",   entityType: 0, mode: "report" },
  { code: "nin_validation",          label: "NIN Validation (NIRA)",   entityType: 0, mode: "nin"    },
  { code: "NIN_VERIFICATION",        label: "NIN Verification (KYC)",  entityType: 0, mode: "nin"    },
  { code: "phone_verification",      label: "Phone Verification",      entityType: 0, mode: "phone"  },
  { code: "fcs_validation",          label: "FCS Validation (free)",   entityType: 0, mode: "fcs"    },
];

const ID_TYPES_INDIVIDUAL = [
  { value: "NIN",            label: "NIN (National ID)" },
  { value: "PASSPORT",       label: "Passport" },
  { value: "DRIVING_PERMIT", label: "Driving Permit" },
];

const ID_TYPES_BUSINESS = [
  { value: "COMPANY_REG", label: "Company Registration" },
  { value: "TIN",         label: "TIN" },
  { value: "NGO_REG",     label: "NGO Registration" },
];

const REASONS = [
  { value: "LOAN_APPLICATION", label: "Loan Application" },
  { value: "ACCOUNT_OPENING",  label: "Account Opening"  },
  { value: "CREDIT_REVIEW",    label: "Credit Review"    },
  { value: "DUE_DILIGENCE",    label: "Due Diligence"    },
];

// ─── Result display helpers ───────────────────────────────────────────────────

function InfoRow({ icon: Icon, label, value, mono }) {
  if (value == null || value === "") return null;
  return (
    <div className="flex items-start gap-2 py-1">
      {Icon && <Icon className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />}
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className={cn("text-sm font-medium break-all", mono && "font-mono")}>{String(value)}</p>
      </div>
    </div>
  );
}

function ScoreDisplay({ score, data }) {
  const s = Number(score ?? 0);
  const pct = Math.min(100, Math.max(0, ((s - 300) / (900 - 300)) * 100));
  const grade     = data?.grade ?? data?.data?.grade;
  const narrative = data?.narrative ?? data?.data?.narrative;
  const accounts  = data?.accounts ?? data?.data?.accounts ?? [];
  const derogatory = data?.derogatory_records ?? data?.data?.derogatory_records ?? [];

  return (
    <div className="space-y-3">
      <div className="text-center p-4 bg-muted/30 rounded-xl border space-y-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">Credit Score</p>
        <p className={cn("text-5xl font-bold tabular-nums", scoreColor(s))}>{s}</p>
        <div className="relative h-1.5 bg-muted rounded-full overflow-hidden mx-8">
          <div
            className={cn("absolute inset-y-0 left-0 rounded-full", s >= 600 ? "bg-green-500" : s >= 500 ? "bg-amber-500" : "bg-red-500")}
            style={{ width: `${pct}%` }}
          />
        </div>
        <Badge variant={s >= 600 ? "default" : s >= 500 ? "secondary" : "destructive"} className="text-xs">
          {scoreLabel(s)}
        </Badge>
        {grade && <p className="text-sm font-semibold text-muted-foreground">Grade: {grade}</p>}
      </div>

      {narrative && (
        <p className="text-xs text-muted-foreground italic bg-muted/30 rounded p-2 border-l-2 border-primary/40">{narrative}</p>
      )}

      {accounts.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            Accounts ({accounts.length})
          </p>
          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-xs">
              <tbody>
                {accounts.slice(0, 5).map((a, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="px-2 py-1.5">{a.account_type ?? a.type ?? "—"}</td>
                    <td className="px-2 py-1.5 text-right tabular-nums">{fmt(a.balance ?? a.outstanding_balance)}</td>
                    <td className="px-2 py-1.5 text-right">
                      <Badge
                        variant={(a.status ?? a.account_status)?.toLowerCase() === "active" ? "default" : "secondary"}
                        className="text-[9px]"
                      >
                        {a.status ?? a.account_status ?? "—"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {derogatory.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 space-y-1">
          <p className="text-xs font-semibold text-red-600 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> {derogatory.length} Adverse Record{derogatory.length !== 1 ? "s" : ""}
          </p>
          {derogatory.map((d, i) => (
            <p key={i} className="text-xs text-red-700">{d.type ?? d.record_type ?? "Record"}: {d.description ?? ""}</p>
          ))}
        </div>
      )}
    </div>
  );
}

function NinDisplay({ data }) {
  const raw    = data?.data ?? data;
  const person = raw?.person ?? raw?.individual ?? raw?.data ?? raw;

  const surname   = person?.surname    ?? person?.last_name  ?? "";
  const given     = person?.given_name ?? person?.first_name ?? person?.other_names ?? "";
  const other     = person?.other_name ?? person?.middle_name ?? "";
  const fullName  = [surname, given, other].filter(Boolean).join(" ") || "—";
  const dob       = person?.date_of_birth ?? person?.dob;
  const gender    = person?.gender ?? person?.sex;
  const nationality = person?.nationality ?? person?.citizenship;
  const nin       = person?.nin ?? raw?.nin ?? data?.nin;
  const photo     = person?.photo ?? person?.photo_base64;
  const status    = raw?.status ?? data?.status ?? "Valid";
  const isValid   = !["invalid", "not found", "failed"].includes(String(status).toLowerCase());

  return (
    <div className="space-y-3">
      <div className={cn("flex items-center gap-2 text-sm font-medium", isValid ? "text-green-600" : "text-destructive")}>
        {isValid ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
        NIN {isValid ? "validated successfully" : "validation failed"}
        <Badge variant={isValid ? "default" : "destructive"} className="text-xs ml-auto capitalize">{status}</Badge>
      </div>

      <div className="flex gap-3 bg-muted/30 rounded-lg border p-3">
        {photo ? (
          <img
            src={`data:image/jpeg;base64,${photo}`}
            alt="ID photo"
            className="w-16 h-20 object-cover rounded border shrink-0"
          />
        ) : (
          <div className="w-16 h-20 bg-muted rounded flex items-center justify-center shrink-0 border">
            <User className="w-6 h-6 text-muted-foreground opacity-40" />
          </div>
        )}
        <div className="flex-1 space-y-1 min-w-0">
          <p className="font-semibold text-sm capitalize">{fullName.toLowerCase()}</p>
          {nin && <p className="text-xs font-mono text-muted-foreground">{nin}</p>}
          <div className="grid grid-cols-2 gap-x-2 pt-1">
            <InfoRow icon={CalendarDays} label="DOB"         value={dob} />
            <InfoRow icon={User}         label="Gender"      value={gender} />
            <InfoRow icon={Globe}        label="Nationality" value={nationality} />
          </div>
        </div>
      </div>
    </div>
  );
}

function PhoneDisplay({ data }) {
  const raw     = data?.data ?? data;
  const status  = raw?.status ?? raw?.verification_status;
  const name    = raw?.subscriber_name ?? raw?.name;
  const network = raw?.network ?? raw?.carrier ?? raw?.operator;
  const phone   = raw?.phone_number ?? raw?.msisdn;
  const score   = raw?.score ?? raw?.mno_score;
  const isOk    = ["verified", "valid", "success"].includes(String(status ?? "").toLowerCase());

  return (
    <div className="space-y-3">
      <div className={cn("flex items-center gap-2 text-sm font-medium", isOk ? "text-green-600" : "text-amber-600")}>
        {isOk ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
        Phone verification {isOk ? "successful" : "completed"}
        {status && <Badge variant={isOk ? "default" : "secondary"} className="text-xs ml-auto capitalize">{status}</Badge>}
      </div>
      <div className="bg-muted/30 rounded-lg border p-3 space-y-1">
        <InfoRow icon={Phone} label="Phone"   value={phone} mono />
        <InfoRow icon={User}  label="Name"    value={name} />
        <InfoRow icon={Globe} label="Network" value={network} />
      </div>
      {score != null && <ScoreDisplay score={score} data={raw} />}
    </div>
  );
}

function FcsDisplay({ data }) {
  const raw      = data?.data ?? data;
  const score    = raw?.fcs_score ?? raw?.score ?? raw?.data?.score;
  const status   = raw?.status ?? "completed";
  const grade    = raw?.grade;
  const narrative = raw?.narrative ?? raw?.description;
  const isOk     = !["failed", "invalid"].includes(String(status).toLowerCase());

  return (
    <div className="space-y-3">
      <div className={cn("flex items-center gap-2 text-sm font-medium", isOk ? "text-green-600" : "text-destructive")}>
        {isOk ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
        FCS validation {isOk ? "completed" : "failed"}
      </div>
      {score != null ? (
        <ScoreDisplay score={score} data={raw} />
      ) : (
        <div className="bg-muted/30 rounded-lg border p-3 space-y-1">
          {grade && <InfoRow icon={Hash} label="Grade" value={grade} />}
          {narrative && <p className="text-xs text-muted-foreground">{narrative}</p>}
        </div>
      )}
    </div>
  );
}

function GenericDisplay({ data }) {
  const raw = data?.data ?? data;
  const flatten = (obj, prefix = "") => {
    const rows = [];
    if (!obj || typeof obj !== "object") return rows;
    for (const [k, v] of Object.entries(obj)) {
      if (k.startsWith("_")) continue;
      const key = prefix ? `${prefix}.${k}` : k;
      if (v !== null && typeof v === "object" && !Array.isArray(v)) {
        rows.push(...flatten(v, key));
      } else if (!Array.isArray(v)) {
        rows.push({ key, value: v });
      }
    }
    return rows;
  };
  const rows = flatten(raw);
  if (!rows.length) return <p className="text-xs text-muted-foreground">No structured data returned.</p>;
  return (
    <div className="border rounded-md overflow-hidden">
      <table className="w-full text-xs">
        <tbody>
          {rows.map(({ key, value }) => (
            <tr key={key} className="border-b last:border-0">
              <td className="px-3 py-1.5 text-muted-foreground capitalize w-2/5">{key.replace(/_/g, " ")}</td>
              <td className="px-3 py-1.5 break-all font-medium">{String(value ?? "—")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Result card ──────────────────────────────────────────────────────────────

function CrbResultCard({ result, mode, onDismiss }) {
  const [expanded, setExpanded] = useState(true);
  if (!result) return null;

  const data    = result?.data ?? result;
  const score   = data?.score ?? data?.crb_score ?? data?.data?.score;
  const pdfUrl  = data?.pdf_url ?? data?.data?.pdf_url;
  const success = result?.success !== false;

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors bg-muted/20"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-2">
          {success
            ? <CheckCircle2 className="w-4 h-4 text-green-600" />
            : <XCircle className="w-4 h-4 text-destructive" />}
          <span className="text-sm font-medium">{success ? "Check completed" : "Check failed"}</span>
        </div>
        <div className="flex items-center gap-2">
          {score != null && (
            <Badge variant={Number(score) >= 600 ? "default" : "destructive"} className="text-xs">
              Score: {score}
            </Badge>
          )}
          {pdfUrl && <Badge variant="secondary" className="text-xs">PDF ready</Badge>}
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t p-4 space-y-4 bg-background">
          {mode === "score"  && <ScoreDisplay score={score} data={data} />}
          {(mode === "nin" || mode === "nin_verify") && <NinDisplay data={data} />}
          {mode === "phone"  && <PhoneDisplay data={data} />}
          {mode === "fcs"    && <FcsDisplay data={data} />}
          {mode === "report" && (
            <div className="space-y-3">
              {pdfUrl ? (
                <a href={pdfUrl} target="_blank" rel="noreferrer">
                  <Button size="sm" variant="outline" className="gap-2 w-full">
                    <ExternalLink className="w-4 h-4" /> Open PDF Report
                  </Button>
                </a>
              ) : (
                <p className="text-xs text-muted-foreground">PDF link not available — may still be generating.</p>
              )}
            </div>
          )}
          {!["score","nin","nin_verify","phone","fcs","report"].includes(mode) && <GenericDisplay data={data} />}

          <Separator />
          <Button variant="ghost" size="sm" onClick={onDismiss} className="w-full">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Run another check
          </Button>
        </div>
      )}
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

/**
 * @param {object} props
 * @param {number}  props.entityType   0 = individual, 1 = business
 * @param {string}  [props.prefillNin]
 * @param {string}  [props.prefillPhone]
 * @param {string}  [props.prefillCompanyReg]
 */
export default function IntelligenceCRBPanel({
  entityType = 0,
  prefillNin,
  prefillPhone,
  prefillCompanyReg,
}) {
  const axiosPrivate = useAxiosPrivate();

  const { data: floatData } = useQuery({
    queryKey: ["crb-products"],
    queryFn: async () => {
      const res = await axiosPrivate.get("/float-management/crb-float");
      return res.data?.data ?? {};
    },
    staleTime: 10 * 60 * 1000,
  });

  const productPrices = (floatData?.products ?? []).reduce((acc, p) => {
    acc[p.code] = p;
    return acc;
  }, {});

  const relevantChecks = SCORE_CHECKS.filter(
    (c) => entityType === 1
      ? ["business_credit_score", "fcs_validation"].includes(c.code)
      : c.entityType === 0
  );

  const [selectedCheck, setSelectedCheck] = useState(relevantChecks[0]?.code ?? "");
  const [form, setForm] = useState({
    identifier:          prefillNin ?? prefillCompanyReg ?? "",
    phone_number:        prefillPhone ?? "",
    identification_type: entityType === 1 ? "COMPANY_REG" : "NIN",
    reason:              "LOAN_APPLICATION",
    client_consented:    0,
    entity_type:         entityType,
  });
  const [result, setResult] = useState(null);

  const set   = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const check = SCORE_CHECKS.find((c) => c.code === selectedCheck);
  const price = productPrices[selectedCheck];

  const ENDPOINT_MAP = {
    score:      "/credit-score/lookup",
    report:     "/credit-enquiry/request",
    nin:        "/credit-enquiry/nin-validation",
    nin_verify: "/credit-enquiry/nin-validation",
    phone:      "/credit-score/crb",
    fcs:        "/credit-enquiry/fcs-validation",
  };

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const mode     = check?.mode;
      const endpoint = ENDPOINT_MAP[mode] ?? "/credit-score/lookup";

      const payload = {
        entity_type:      check?.entityType ?? entityType,
        client_consented: form.client_consented,
      };

      if (mode === "nin" || mode === "nin_verify") {
        payload.identifier = form.identifier;

      } else if (mode === "fcs") {
        payload.identifier = form.identifier;

      } else if (mode === "phone") {
        payload.phone_number = normalisePhone(form.phone_number);

      } else if (mode === "report") {
        payload.identifier          = form.identifier;
        payload.identification_type = form.identification_type;
        payload.reason              = form.reason;

        const enqRes = await axiosPrivate.post("/credit-enquiry/request", payload);
        const enq    = enqRes.data?.data?.enquiry ?? enqRes.data?.data?.raw?.enquiry;
        const enquiry_id    = enq?.id;
        const individual_id = enqRes.data?.data?.individual_id;
        const reference     = enq?.reference;
        const timestamp     = enq?.timestamp;

        if (enquiry_id && individual_id) {
          const pdfRes = await axiosPrivate.post("/credit-enquiry/report-pdf", {
            enquiry_id, individual_id, reference, timestamp,
          });
          return pdfRes.data;
        }
        return enqRes.data;

      } else {
        // score
        payload.identifier          = form.identifier;
        payload.identification_type = form.identification_type;
        if (form.phone_number) payload.phone_number = normalisePhone(form.phone_number);
      }

      const res = await axiosPrivate.post(endpoint, payload);
      return res.data;
    },
    onSuccess: (data) => {
      setResult(data);
      toast({ title: "CRB check complete" });
    },
    onError: (err) => {
      toast({
        title: "CRB Error",
        description: err?.response?.data?.messages?.[0] ?? "Check failed",
        variant: "destructive",
      });
    },
  });

  const canSubmit = () => {
    const mode = check?.mode;
    if (mode === "phone")      return !!form.phone_number?.trim();
    if (mode === "nin" || mode === "nin_verify" || mode === "fcs") return !!form.identifier?.trim();
    if (mode === "report")     return !!form.identifier?.trim() && !!form.identification_type;
    if (!form.client_consented) return false;
    return !!form.identifier?.trim() && !!form.identification_type;
  };

  const idTypes = check?.entityType === 1 ? ID_TYPES_BUSINESS : ID_TYPES_INDIVIDUAL;
  const mode    = check?.mode;

  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <CardTitle className="text-base">Run CRB Check</CardTitle>
          </div>
          <CardDescription>
            Query Credit Reference Bureau for this {entityType === 1 ? "business" : "client"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Check selector */}
          <div>
            <Label>Check Type</Label>
            <Select value={selectedCheck} onValueChange={(v) => { setSelectedCheck(v); setResult(null); }}>
              <SelectTrigger>
                <SelectValue placeholder="Select check" />
              </SelectTrigger>
              <SelectContent>
                {relevantChecks.map((c) => {
                  const p = productPrices[c.code];
                  return (
                    <SelectItem key={c.code} value={c.code}>
                      <div className="flex items-center justify-between w-full gap-4">
                        <span>{c.label}</span>
                        {p && (
                          <span className="text-xs text-muted-foreground">
                            {p.is_free ? "FREE" : `UGX ${fmt(p.unit_price)}`}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Cost badge */}
          {price && (
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                Cost: {price.is_free ? "FREE" : `UGX ${fmt(price.unit_price)}`}
              </Badge>
              {price.is_overridden && <Badge variant="secondary" className="text-[10px]">Custom price</Badge>}
            </div>
          )}

          {/* Identifier field — shown for all except phone */}
          {mode !== "phone" && (
            <div>
              <Label>
                {entityType === 1 ? "Company Registration No." : "NIN / Identifier"} *
              </Label>
              <Input
                value={form.identifier}
                onChange={(e) => set("identifier", e.target.value)}
                placeholder={entityType === 1 ? "e.g. 80010012345678" : "e.g. CM961351008QHF"}
                className={mode === "nin" || mode === "nin_verify" ? "font-mono" : ""}
              />
            </div>
          )}

          {/* Phone field */}
          {mode === "phone" && (
            <div>
              <Label>Phone Number *</Label>
              <Input
                value={form.phone_number}
                onChange={(e) => set("phone_number", e.target.value)}
                placeholder="e.g. 0755876951"
              />
              {form.phone_number && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Will be sent as: <span className="font-mono">{normalisePhone(form.phone_number)}</span>
                </p>
              )}
            </div>
          )}

          {/* Phone optional for score */}
          {mode === "score" && (
            <div>
              <Label>
                Phone Number <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Input
                value={form.phone_number}
                onChange={(e) => set("phone_number", e.target.value)}
                placeholder="e.g. 0755876951"
              />
              {form.phone_number && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Will be sent as: <span className="font-mono">{normalisePhone(form.phone_number)}</span>
                </p>
              )}
            </div>
          )}

          {/* ID type — for score and report */}
          {(mode === "score" || mode === "report") && (
            <div>
              <Label>Identification Type *</Label>
              <Select value={form.identification_type} onValueChange={(v) => set("identification_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {idTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Reason — for report */}
          {mode === "report" && (
            <div>
              <Label>Reason *</Label>
              <Select value={form.reason} onValueChange={(v) => set("reason", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REASONS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Consent — required for score, report, phone, fcs */}
          {mode !== "nin" && mode !== "nin_verify" && (
            <div className="flex items-center gap-3">
              <Switch
                id="crb-consent"
                checked={!!form.client_consented}
                onCheckedChange={(v) => set("client_consented", v ? 1 : 0)}
              />
              <Label htmlFor="crb-consent" className="cursor-pointer">
                Client has consented to this credit check
              </Label>
            </div>
          )}

          {!form.client_consented && mode === "score" && (
            <div className="flex items-start gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-2 rounded">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              Client consent is required before running a credit score check.
            </div>
          )}

          <Button
            onClick={() => mutate()}
            disabled={isPending || !canSubmit()}
            className="w-full"
          >
            {isPending
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Running…</>
              : <><ShieldCheck className="w-4 h-4 mr-2" /> Run Check</>
            }
          </Button>
        </CardContent>
      </Card>

      {result && (
        <CrbResultCard
          result={result}
          mode={mode}
          onDismiss={() => setResult(null)}
        />
      )}
    </div>
  );
}

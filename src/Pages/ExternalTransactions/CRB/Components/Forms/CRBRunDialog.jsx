/* eslint-disable react/prop-types */
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { toast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
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
  Loader2, X, ExternalLink, CheckCircle2, AlertCircle,
  XCircle, User, Phone, Shield, Hash,
  CalendarDays, Globe, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function scoreBadgeVariant(score) {
  const s = Number(score ?? 0);
  if (s >= 600) return "default";
  if (s >= 500) return "secondary";
  return "destructive";
}

// ─── Field sets per mode ──────────────────────────────────────────────────────

function ScoreFields({ form, set, entityType }) {
  return (
    <div className="space-y-3">
      {entityType === 1 && (
        <div>
          <Label>Entity Type Category *</Label>
          <Select value={form.entity_type_category ?? ""} onValueChange={(v) => set("entity_type_category", v)}>
            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="company">Company</SelectItem>
              <SelectItem value="partnership">Partnership</SelectItem>
              <SelectItem value="ngo">NGO</SelectItem>
              <SelectItem value="government">Government</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      <div>
        <Label>Identifier *</Label>
        <Input
          placeholder={entityType === 1 ? "Company registration number" : "NIN / ID number"}
          value={form.identifier ?? ""}
          onChange={(e) => set("identifier", e.target.value)}
        />
      </div>
      <div>
        <Label>Identification Type *</Label>
        <Select value={form.identification_type ?? ""} onValueChange={(v) => set("identification_type", v)}>
          <SelectTrigger><SelectValue placeholder="Select ID type" /></SelectTrigger>
          <SelectContent>
            {entityType === 0 ? (
              <>
                <SelectItem value="NIN">NIN (National ID)</SelectItem>
                <SelectItem value="PASSPORT">Passport</SelectItem>
                <SelectItem value="DRIVING_PERMIT">Driving Permit</SelectItem>
                <SelectItem value="REFUGEE_ID">Refugee ID</SelectItem>
              </>
            ) : (
              <>
                <SelectItem value="COMPANY_REG">Company Registration</SelectItem>
                <SelectItem value="TIN">TIN</SelectItem>
                <SelectItem value="NGO_REG">NGO Registration</SelectItem>
              </>
            )}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Phone Number <span className="text-muted-foreground text-xs">(optional — improves score accuracy)</span></Label>
        <Input
          placeholder="e.g. 0755876951 or 256755876951"
          value={form.phone_number ?? ""}
          onChange={(e) => set("phone_number", e.target.value)}
        />
        {form.phone_number && (
          <p className="text-xs text-muted-foreground mt-0.5">
            Will be sent as: <span className="font-mono">{normalisePhone(form.phone_number)}</span>
          </p>
        )}
      </div>
      <div className="flex items-center gap-3 pt-1">
        <Switch
          id="consented-score"
          checked={!!form.client_consented}
          onCheckedChange={(v) => set("client_consented", v ? 1 : 0)}
        />
        <Label htmlFor="consented-score" className="cursor-pointer">
          Client has consented to this credit check
        </Label>
      </div>
    </div>
  );
}

function ReportFields({ form, set }) {
  return (
    <div className="space-y-3">
      <div>
        <Label>NIN / Identifier *</Label>
        <Input
          placeholder="e.g. CM961351008QHF"
          value={form.identifier ?? ""}
          onChange={(e) => set("identifier", e.target.value)}
        />
      </div>
      <div>
        <Label>Identification Type *</Label>
        <Select value={form.identification_type ?? ""} onValueChange={(v) => set("identification_type", v)}>
          <SelectTrigger><SelectValue placeholder="Select ID type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="NIN">NIN (National ID)</SelectItem>
            <SelectItem value="PASSPORT">Passport</SelectItem>
            <SelectItem value="DRIVING_PERMIT">Driving Permit</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Reason *</Label>
        <Select value={form.reason ?? ""} onValueChange={(v) => set("reason", v)}>
          <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="LOAN_APPLICATION">Loan Application</SelectItem>
            <SelectItem value="ACCOUNT_OPENING">Account Opening</SelectItem>
            <SelectItem value="CREDIT_REVIEW">Credit Review</SelectItem>
            <SelectItem value="DUE_DILIGENCE">Due Diligence</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-3 pt-1">
        <Switch
          id="consented-report"
          checked={!!form.client_consented}
          onCheckedChange={(v) => set("client_consented", v ? 1 : 0)}
        />
        <Label htmlFor="consented-report" className="cursor-pointer">
          Client has consented to this credit check
        </Label>
      </div>
    </div>
  );
}

function NinFields({ form, set, mode }) {
  const isVerify = mode === "nin_verify";
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded p-2">
        <Shield className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          {isVerify
            ? "NIN Verification confirms that the provided national ID belongs to a real, registered person. Used for identity assurance."
            : "NIN Validation queries NIRA to retrieve the person's registered details (name, DOB, gender) linked to this NIN."}
        </span>
      </div>
      <div>
        <Label>National Identification Number (NIN) *</Label>
        <Input
          placeholder="e.g. CM961351008QHF"
          value={form.identifier ?? ""}
          onChange={(e) => set("identifier", e.target.value.toUpperCase())}
          className="font-mono"
        />
      </div>
    </div>
  );
}

function PhoneFields({ form, set }) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Phone Number *</Label>
        <Input
          placeholder="e.g. 0755876951"
          value={form.phone_number ?? ""}
          onChange={(e) => set("phone_number", e.target.value)}
        />
        {form.phone_number && (
          <p className="text-xs text-muted-foreground mt-0.5">
            Will be sent as: <span className="font-mono">{normalisePhone(form.phone_number)}</span>
          </p>
        )}
      </div>
      <div className="flex items-center gap-3 pt-1">
        <Switch
          id="consented-phone"
          checked={!!form.client_consented}
          onCheckedChange={(v) => set("client_consented", v ? 1 : 0)}
        />
        <Label htmlFor="consented-phone" className="cursor-pointer">Client has consented</Label>
      </div>
    </div>
  );
}

function FcsFields({ form, set }) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded p-2">
        <Shield className="w-4 h-4 shrink-0 mt-0.5" />
        <span>Financial Competency Score (FCS) measures financial behaviour. This check is free of charge.</span>
      </div>
      <div>
        <Label>Identifier (NIN or ID) *</Label>
        <Input
          placeholder="e.g. CM961351008QHF"
          value={form.identifier ?? ""}
          onChange={(e) => set("identifier", e.target.value)}
          className="font-mono"
        />
      </div>
      <div className="flex items-center gap-3 pt-1">
        <Switch
          id="consented-fcs"
          checked={!!form.client_consented}
          onCheckedChange={(v) => set("client_consented", v ? 1 : 0)}
        />
        <Label htmlFor="consented-fcs" className="cursor-pointer">Client has consented</Label>
      </div>
    </div>
  );
}

// ─── Result renderers ─────────────────────────────────────────────────────────

function InfoRow({ icon: Icon, label, value, mono }) {
  if (value == null || value === "") return null;
  return (
    <div className="flex items-start gap-2.5 py-1.5">
      {Icon && <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />}
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn("text-sm font-medium break-all", mono && "font-mono")}>{String(value)}</p>
      </div>
    </div>
  );
}

function ScoreGauge({ score }) {
  const s = Number(score ?? 0);
  const pct = Math.min(100, Math.max(0, ((s - 300) / (900 - 300)) * 100));
  return (
    <div className="text-center p-4 rounded-xl border bg-muted/30 space-y-2">
      <p className="text-xs text-muted-foreground uppercase tracking-wide">Credit Score</p>
      <p className={cn("text-5xl font-bold tabular-nums", scoreColor(s))}>{s}</p>
      <div className="relative h-2 bg-muted rounded-full overflow-hidden mx-6">
        <div
          className={cn("absolute inset-y-0 left-0 rounded-full transition-all", s >= 600 ? "bg-green-500" : s >= 500 ? "bg-amber-500" : "bg-red-500")}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground mx-6">
        <span>300</span><span>600</span><span>900</span>
      </div>
      <Badge variant={scoreBadgeVariant(s)} className="text-xs">
        {scoreLabel(s)}
      </Badge>
    </div>
  );
}

function ScoreResult({ data }) {
  const score  = data?.score ?? data?.crb_score ?? data?.data?.score;
  const grade  = data?.grade ?? data?.data?.grade;

  const accounts   = data?.accounts   ?? data?.data?.accounts   ?? [];
  const enquiries  = data?.enquiries  ?? data?.data?.enquiries  ?? [];
  const derogatory = data?.derogatory_records ?? data?.data?.derogatory_records ?? [];
  const narrative  = data?.narrative  ?? data?.data?.narrative;

  const activeAcc = accounts.filter((a) => (a.status ?? a.account_status)?.toLowerCase() === "active").length;
  const closedAcc = accounts.filter((a) => (a.status ?? a.account_status)?.toLowerCase() !== "active").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle2 className="h-4 w-4" />
        <span className="text-sm font-medium">Credit score retrieved successfully</span>
      </div>

      {score != null && <ScoreGauge score={score} />}

      <div className="grid grid-cols-2 gap-2">
        {grade && (
          <div className="bg-muted/40 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">Grade</p>
            <p className="text-2xl font-bold">{grade}</p>
          </div>
        )}
        {accounts.length > 0 && (
          <div className="bg-muted/40 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">Accounts</p>
            <p className="text-2xl font-bold">{accounts.length}</p>
            <p className="text-xs text-muted-foreground">{activeAcc} active · {closedAcc} closed</p>
          </div>
        )}
        {enquiries.length > 0 && (
          <div className="bg-muted/40 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">Enquiries</p>
            <p className="text-2xl font-bold">{enquiries.length}</p>
          </div>
        )}
        {derogatory.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
            <p className="text-xs text-red-600">Adverse Records</p>
            <p className="text-2xl font-bold text-red-600">{derogatory.length}</p>
          </div>
        )}
      </div>

      {narrative && (
        <div className="bg-muted/30 rounded-lg p-3 text-sm text-muted-foreground italic border-l-2 border-primary/40">
          {narrative}
        </div>
      )}

      {accounts.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Accounts</p>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/40 border-b">
                  <th className="px-3 py-2 text-left text-muted-foreground">Type</th>
                  <th className="px-3 py-2 text-left text-muted-foreground">Institution</th>
                  <th className="px-3 py-2 text-right text-muted-foreground">Balance</th>
                  <th className="px-3 py-2 text-center text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {accounts.slice(0, 8).map((a, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="px-3 py-2">{a.account_type ?? a.type ?? "—"}</td>
                    <td className="px-3 py-2">{a.institution ?? a.lender ?? "—"}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{fmt(a.balance ?? a.outstanding_balance)}</td>
                    <td className="px-3 py-2 text-center">
                      <Badge
                        variant={(a.status ?? a.account_status)?.toLowerCase() === "active" ? "default" : "secondary"}
                        className="text-[10px]"
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
        <div>
          <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Adverse Records
          </p>
          <div className="space-y-2">
            {derogatory.map((d, i) => (
              <div key={i} className="border border-red-200 bg-red-50 rounded-lg p-3 text-xs">
                <p className="font-medium text-red-800">{d.type ?? d.record_type ?? "Record"}</p>
                {d.description && <p className="text-red-700 mt-0.5">{d.description}</p>}
                {d.amount && <p className="text-red-700">Amount: UGX {fmt(d.amount)}</p>}
                {d.date && <p className="text-muted-foreground">Date: {d.date}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NinResult({ data }) {
  // gnugrid returns various shapes — handle all common ones
  const raw    = data?.data ?? data;
  const person = raw?.person ?? raw?.individual ?? raw?.data ?? raw;

  const surname     = person?.surname     ?? person?.last_name    ?? person?.family_name ?? "";
  const givenName   = person?.given_name  ?? person?.first_name   ?? person?.other_names ?? "";
  const otherName   = person?.other_name  ?? person?.middle_name  ?? "";
  const fullName    = [surname, givenName, otherName].filter(Boolean).join(" ") || "—";
  const dob         = person?.date_of_birth ?? person?.dob ?? person?.birth_date;
  const gender      = person?.gender ?? person?.sex;
  const nationality = person?.nationality ?? person?.citizenship;
  const nin         = person?.nin ?? raw?.nin ?? data?.nin;
  const status      = raw?.status ?? data?.status ?? "Valid";
  const photo       = person?.photo ?? person?.photo_base64 ?? person?.image;
  const cardNumber  = person?.card_number ?? person?.id_number;
  const district    = person?.district ?? person?.place_of_birth;
  const address     = person?.address ?? person?.residence;

  const isValid = String(status).toLowerCase() !== "invalid" && String(status).toLowerCase() !== "not found";

  return (
    <div className="space-y-4">
      <div className={cn("flex items-center gap-2 text-sm font-medium", isValid ? "text-green-600" : "text-destructive")}>
        {isValid ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
        NIN {isValid ? "validated successfully" : "validation failed"}
        <Badge variant={isValid ? "default" : "destructive"} className="text-xs ml-auto capitalize">{status}</Badge>
      </div>

      <div className="flex gap-4 bg-muted/30 rounded-xl border p-4">
        {photo ? (
          <img
            src={`data:image/jpeg;base64,${photo}`}
            alt="ID photo"
            className="w-20 h-24 object-cover rounded-lg border shrink-0"
          />
        ) : (
          <div className="w-20 h-24 bg-muted rounded-lg flex items-center justify-center shrink-0 border">
            <User className="w-8 h-8 text-muted-foreground opacity-50" />
          </div>
        )}
        <div className="flex-1 min-w-0 space-y-0.5">
          <p className="font-semibold text-base capitalize">{fullName.toLowerCase()}</p>
          {nin && <p className="text-xs font-mono text-muted-foreground">{nin}</p>}
          {cardNumber && <p className="text-xs text-muted-foreground">Card: {cardNumber}</p>}
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-x-4">
        <InfoRow icon={CalendarDays} label="Date of Birth"  value={dob} />
        <InfoRow icon={User}         label="Gender"         value={gender} />
        <InfoRow icon={Globe}        label="Nationality"    value={nationality} />
        <InfoRow icon={Hash}         label="District/Place" value={district} />
        {address && <div className="col-span-2"><InfoRow icon={Hash} label="Address" value={address} /></div>}
      </div>
    </div>
  );
}

function PhoneResult({ data }) {
  const raw    = data?.data ?? data;
  const status = raw?.status ?? raw?.verification_status ?? raw?.result;
  const name   = raw?.subscriber_name ?? raw?.name;
  const network = raw?.network ?? raw?.carrier ?? raw?.operator;
  const phone  = raw?.phone_number ?? raw?.msisdn;
  const score  = raw?.score ?? raw?.mno_score;

  const isVerified = String(status ?? "").toLowerCase() === "verified"
    || String(status ?? "").toLowerCase() === "valid"
    || String(status ?? "").toLowerCase() === "success";

  return (
    <div className="space-y-4">
      <div className={cn("flex items-center gap-2 text-sm font-medium", isVerified ? "text-green-600" : "text-amber-600")}>
        {isVerified ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
        Phone verification {isVerified ? "successful" : "returned results"}
      </div>

      <div className="bg-muted/30 rounded-xl border p-4 space-y-2">
        <InfoRow icon={Phone}      label="Phone Number"    value={phone} mono />
        <InfoRow icon={User}       label="Subscriber Name" value={name} />
        <InfoRow icon={Globe}      label="Network"         value={network} />
        {status && (
          <div className="flex items-center gap-2 pt-1">
            <Badge variant={isVerified ? "default" : "secondary"} className="capitalize">{status}</Badge>
          </div>
        )}
        {score != null && (
          <>
            <Separator />
            <ScoreGauge score={score} />
          </>
        )}
      </div>
    </div>
  );
}

function FcsResult({ data }) {
  const raw    = data?.data ?? data;
  const score  = raw?.fcs_score ?? raw?.score ?? raw?.data?.score;
  const status = raw?.status ?? raw?.validation_status;
  const grade  = raw?.grade;
  const narrative = raw?.narrative ?? raw?.description;

  const isValid = String(status ?? "success").toLowerCase() !== "failed"
    && String(status ?? "success").toLowerCase() !== "invalid";

  return (
    <div className="space-y-4">
      <div className={cn("flex items-center gap-2 text-sm font-medium", isValid ? "text-green-600" : "text-destructive")}>
        {isValid ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
        FCS validation {isValid ? "completed" : "failed"}
        {status && <Badge variant={isValid ? "default" : "destructive"} className="text-xs ml-auto capitalize">{status}</Badge>}
      </div>

      {score != null ? (
        <ScoreGauge score={score} />
      ) : (
        <div className="bg-muted/30 rounded-xl border p-4 space-y-2">
          {grade && <InfoRow icon={Shield} label="Grade" value={grade} />}
          {narrative && <p className="text-sm text-muted-foreground italic">{narrative}</p>}
        </div>
      )}

      {grade && score != null && (
        <div className="bg-muted/40 rounded-lg p-3 flex items-center gap-3">
          <Shield className="w-5 h-5 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Grade</p>
            <p className="font-bold text-lg">{grade}</p>
          </div>
          {narrative && <p className="text-sm text-muted-foreground ml-2">{narrative}</p>}
        </div>
      )}
    </div>
  );
}

function ReportResult({ data }) {
  const raw    = data?.data ?? data;
  const pdfUrl = raw?.pdf_url ?? raw?.data?.pdf_url ?? raw?.report_url;
  const enquiryRef = raw?.reference ?? raw?.enquiry?.reference;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
        <CheckCircle2 className="h-4 w-4" />
        Full credit report generated
      </div>
      {enquiryRef && (
        <div className="bg-muted/30 rounded-lg p-3">
          <p className="text-xs text-muted-foreground">Enquiry Reference</p>
          <p className="font-mono text-sm font-medium">{enquiryRef}</p>
        </div>
      )}
      {pdfUrl ? (
        <a href={pdfUrl} target="_blank" rel="noreferrer" className="block">
          <Button className="w-full gap-2">
            <ExternalLink className="w-4 h-4" /> Open Full Credit Report PDF
          </Button>
        </a>
      ) : (
        <p className="text-sm text-muted-foreground bg-amber-50 border border-amber-200 rounded p-3">
          PDF link is being generated. The report may take a few moments. Retry if not available.
        </p>
      )}
    </div>
  );
}

function GenericResult({ data, label }) {
  // Try to render sensibly — show key/value pairs for flat objects, table for arrays
  const raw = data?.data ?? data;

  const flatten = (obj, prefix = "") => {
    const rows = [];
    if (!obj || typeof obj !== "object") return rows;
    for (const [k, v] of Object.entries(obj)) {
      if (k.startsWith("_")) continue; // skip internal gnugrid fields
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

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
        <CheckCircle2 className="h-4 w-4" />
        {label ?? "Request completed successfully"}
      </div>
      {rows.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <tbody>
              {rows.map(({ key, value }) => (
                <tr key={key} className="border-b last:border-0 hover:bg-muted/20">
                  <td className="px-3 py-2 font-medium text-muted-foreground capitalize w-2/5">
                    {key.replace(/_/g, " ")}
                  </td>
                  <td className="px-3 py-2 break-all">{String(value ?? "—")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Check completed. No structured data returned.</p>
      )}
    </div>
  );
}

// ─── Main dialog ──────────────────────────────────────────────────────────────

const ENDPOINT_MAP = {
  score:      "/credit-score/lookup",
  report:     "/credit-enquiry/request",
  nin:        "/credit-enquiry/nin-validation",
  nin_verify: "/credit-enquiry/nin-validation",
  phone:      "/credit-score/crb",
  fcs:        "/credit-enquiry/fcs-validation",
};

export default function CRBRunDialog({ isOpen, onClose, product, meta }) {
  const axiosPrivate = useAxiosPrivate();
  const [form, setForm] = useState({
    entity_type:      meta.entityType,
    client_consented: 0,
  });
  const [result, setResult]     = useState(null);
  const [pdfResult, setPdfResult] = useState(null);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const endpoint = ENDPOINT_MAP[meta.mode] ?? "/credit-score/lookup";
      const payload  = { ...form };

      // normalise phone number
      if (payload.phone_number) {
        payload.phone_number = normalisePhone(payload.phone_number);
      }

      // clean empties
      if (!payload.entity_type_category) delete payload.entity_type_category;
      if (!payload.reason && meta.mode !== "report") delete payload.reason;

      const res = await axiosPrivate.post(endpoint, payload);
      return res.data;
    },
    onSuccess: async (data) => {
      if (meta.mode === "report") {
        const enq          = data?.data?.enquiry ?? data?.data?.raw?.enquiry;
        const enquiry_id   = enq?.id;
        const individual_id = data?.data?.individual_id;
        const reference    = enq?.reference;
        const timestamp    = enq?.timestamp;

        if (enquiry_id && individual_id) {
          try {
            const pdfRes = await axiosPrivate.post("/credit-enquiry/report-pdf", {
              enquiry_id, individual_id, reference, timestamp,
            });
            setPdfResult(pdfRes.data);
          } catch {
            setPdfResult(data);
          }
        } else {
          setPdfResult(data);
        }
      } else {
        setResult(data);
      }
      toast({ title: "CRB check completed" });
    },
    onError: (err) => {
      toast({
        title: "CRB Error",
        description: err?.response?.data?.messages?.[0] ?? err?.response?.data?.message ?? "Request failed",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setForm({ entity_type: meta.entityType, client_consented: 0 });
    setResult(null);
    setPdfResult(null);
    onClose();
  };

  const canSubmit = () => {
    const f = form;
    if (meta.mode === "nin" || meta.mode === "nin_verify") return !!f.identifier?.trim();
    if (meta.mode === "phone")  return !!f.phone_number?.trim();
    if (meta.mode === "fcs")    return !!f.identifier?.trim();
    if (meta.mode === "report") return !!f.identifier?.trim() && !!f.identification_type && !!f.reason;
    // score — consent required
    if (!f.client_consented) return false;
    return !!f.identifier?.trim() && !!f.identification_type;
  };

  const displayResult = pdfResult ?? result;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2 pr-8">
            {meta.label}
            <Badge variant="outline" className="text-[10px] shrink-0">
              {product.is_free ? "FREE" : `UGX ${Number(product.unit_price).toLocaleString()}`}
            </Badge>
          </DialogTitle>
          <DialogClose asChild>
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 opacity-70 hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          </DialogClose>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-0.5">
          {displayResult ? (
            <>
              {meta.mode === "score" && <ScoreResult data={displayResult?.data} />}
              {meta.mode === "report" && <ReportResult data={displayResult?.data} />}
              {(meta.mode === "nin" || meta.mode === "nin_verify") && <NinResult data={displayResult?.data} />}
              {meta.mode === "phone" && <PhoneResult data={displayResult?.data} />}
              {meta.mode === "fcs"   && <FcsResult   data={displayResult?.data} />}
            </>
          ) : (
            <>
              {meta.mode === "score"      && <ScoreFields form={form} set={set} entityType={meta.entityType} />}
              {meta.mode === "report"     && <ReportFields form={form} set={set} />}
              {(meta.mode === "nin" || meta.mode === "nin_verify") && <NinFields form={form} set={set} mode={meta.mode} />}
              {meta.mode === "phone"      && <PhoneFields form={form} set={set} />}
              {meta.mode === "fcs"        && <FcsFields form={form} set={set} />}

              {!form.client_consented && meta.mode === "score" && (
                <div className="flex items-start gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>Client consent is required before submitting a credit check.</span>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="shrink-0 pt-2 border-t mt-2">
          {displayResult ? (
            <>
              <Button variant="outline" onClick={() => { setResult(null); setPdfResult(null); }}>
                Run another
              </Button>
              <Button variant="ghost" onClick={handleClose}>Close</Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={handleClose}>Cancel</Button>
              <Button onClick={() => mutate()} disabled={isPending || !canSubmit()}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {meta.mode === "report" ? "Generate Report" : "Run Check"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

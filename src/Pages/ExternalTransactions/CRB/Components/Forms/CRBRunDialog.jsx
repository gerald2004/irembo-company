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
  CalendarDays, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n) => Number(n || 0).toLocaleString("en-UG");
const toArray = (v) => (Array.isArray(v) ? v.filter(Boolean) : []);

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
                <SelectItem value="ii_country_id">NIN (National ID)</SelectItem>
                <SelectItem value="ii_passport_number">Passport</SelectItem>
                <SelectItem value="ii_drivers_license_permit_number">Driving Permit</SelectItem>
              </>
            ) : (
              <>
                <SelectItem value="ii_company_reg">Company Registration</SelectItem>
                <SelectItem value="ii_tin">TIN</SelectItem>
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
            <SelectItem value="ii_country_id">NIN (National ID)</SelectItem>
            <SelectItem value="ii_passport_number">Passport</SelectItem>
            <SelectItem value="ii_drivers_license_permit_number">Driving Permit</SelectItem>
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

function ltdColor(ltd) {
  const l = String(ltd ?? "").toLowerCase();
  if (l.includes("unlikely")) return "text-green-600";
  if (l.includes("possible") || l.includes("likely")) return "text-amber-600";
  return "text-red-600";
}

function ScoreResult({ data }) {
  // gnugrid: { message, status, count, data: { Enquiry, CRB, MNO } }
  const scoreData = data?.data ?? {};
  const crb       = scoreData.CRB ?? {};
  const mno       = scoreData.MNO ?? {};
  const enquiry   = scoreData.Enquiry ?? {};

  const crbScore  = crb.Scoring?.Score != null ? Number(crb.Scoring.Score) : null;
  const mnoScore  = mno.Scoring?.Score != null ? Number(mno.Scoring.Score) : null;

  const customerName   = crb.Customer?.Name ?? mno.Customer?.Name;
  const customerDob    = crb.Customer?.Date_of_Birth ?? mno.Customer?.Date_of_Birth;
  const customerGender = crb.Customer?.Gender ?? mno.Customer?.Gender;
  const customerAge    = crb.Customer?.Age ?? mno.Customer?.Age;
  const customerDisputed = crb.Customer?.Disputed;

  const crbAccounts    = crb.Credit_Accounts ?? {};
  const crbApps        = crb.Credit_Applications ?? {};
  const crbAccountList = toArray(crbAccounts?.Accounts ?? crbAccounts?.accounts);
  const crbCollMat     = toArray(crb.Collateral_Material);
  const crbCollGuar    = toArray(crb.Collateral_Guarantor);
  const bouncedCheques = toArray(crb.Bounced_Cheques);
  const financialFraud = toArray(crb.Financial_Fraud);

  const mnoAccounts = mno.Credit_Accounts ?? {};
  const mnoIncome   = mno.Income_Proxy ?? {};
  const mnoPhones   = toArray(mno.Customer?.Phone_Numbers);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle2 className="h-4 w-4" />
        <span className="text-sm font-medium">Credit score retrieved successfully</span>
        {enquiry.Reference && (
          <span className="text-xs font-mono text-muted-foreground ml-auto">Ref: {enquiry.Reference}</span>
        )}
      </div>

      {/* Customer card */}
      {customerName && (
        <div className="bg-muted/30 rounded-xl border p-3 flex items-center gap-3">
          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-muted-foreground opacity-50" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{customerName}</p>
            <p className="text-xs text-muted-foreground">
              {[customerGender, customerDob, customerAge != null && `Age ${customerAge}`].filter(Boolean).join(" · ")}
            </p>
          </div>
          {customerDisputed === "YES" && (
            <Badge variant="destructive" className="text-[10px] shrink-0">Disputed</Badge>
          )}
        </div>
      )}

      {/* CRB Score */}
      {crbScore != null && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">CRB Credit Score</p>
          <ScoreGauge score={crbScore} />
          <div className="grid grid-cols-3 gap-1.5">
            {crb.Scoring?.Band && (
              <div className="bg-muted/40 rounded p-2 text-center">
                <p className="text-[10px] text-muted-foreground">Band</p>
                <p className="font-bold">{crb.Scoring.Band}</p>
              </div>
            )}
            {crb.Scoring?.Probability_of_Default_Percent != null && (
              <div className="bg-muted/40 rounded p-2 text-center">
                <p className="text-[10px] text-muted-foreground">Default Prob.</p>
                <p className="font-bold">{crb.Scoring.Probability_of_Default_Percent}%</p>
              </div>
            )}
            {crb.Scoring?.Likelihood_to_Default && (
              <div className="bg-muted/40 rounded p-2 text-center">
                <p className="text-[10px] text-muted-foreground">Likelihood</p>
                <p className={cn("font-semibold text-[11px]", ltdColor(crb.Scoring.Likelihood_to_Default))}>
                  {crb.Scoring.Likelihood_to_Default}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MNO Score */}
      {mnoScore != null && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">MNO Score</p>
          <ScoreGauge score={mnoScore} />
          <div className="grid grid-cols-3 gap-1.5">
            {mno.Scoring?.Band && (
              <div className="bg-muted/40 rounded p-2 text-center">
                <p className="text-[10px] text-muted-foreground">Band</p>
                <p className="font-bold">{mno.Scoring.Band}</p>
              </div>
            )}
            {mno.Scoring?.Probability_of_Default_Percent != null && (
              <div className="bg-muted/40 rounded p-2 text-center">
                <p className="text-[10px] text-muted-foreground">Default Prob.</p>
                <p className="font-bold">{mno.Scoring.Probability_of_Default_Percent}%</p>
              </div>
            )}
            {mno.Scoring?.Likelihood_to_Default && (
              <div className="bg-muted/40 rounded p-2 text-center">
                <p className="text-[10px] text-muted-foreground">Likelihood</p>
                <p className={cn("font-semibold text-[11px]", ltdColor(mno.Scoring.Likelihood_to_Default))}>
                  {mno.Scoring.Likelihood_to_Default}
                </p>
              </div>
            )}
          </div>
          {(mnoIncome.Monthly_Turnover_Amount != null || mnoAccounts.Months_Active != null) && (
            <div className="grid grid-cols-2 gap-1.5">
              {mnoIncome.Monthly_Turnover_Amount != null && (
                <div className="bg-muted/40 rounded p-2">
                  <p className="text-[10px] text-muted-foreground">Monthly Turnover</p>
                  <p className="font-semibold text-sm">UGX {fmt(mnoIncome.Monthly_Turnover_Amount)}</p>
                </div>
              )}
              {mnoAccounts.Months_Active != null && (
                <div className="bg-muted/40 rounded p-2">
                  <p className="text-[10px] text-muted-foreground">Months Active</p>
                  <p className="font-semibold text-sm">{mnoAccounts.Months_Active}</p>
                </div>
              )}
            </div>
          )}
          {mnoPhones.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {mnoPhones.map((p, i) => (
                <Badge key={i} variant={p.status === "Y" ? "default" : "secondary"} className="font-mono text-[10px]">
                  <Phone className="w-2.5 h-2.5 mr-1" />{p.msisdn}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Credit Accounts */}
      {(crbAccountList.length > 0 || crbAccounts.Total != null) && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
            Credit Accounts
            {crbAccounts.Total != null && <span className="text-foreground font-bold ml-1">{crbAccounts.Total}</span>}
            {crbAccounts.Open != null && (
              <span className="font-normal ml-1">· {crbAccounts.Open} open</span>
            )}
          </p>
          {crbAccountList.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/40 border-b">
                    <th className="px-3 py-1.5 text-left text-muted-foreground font-medium">Type</th>
                    <th className="px-3 py-1.5 text-right text-muted-foreground font-medium">Balance</th>
                    <th className="px-3 py-1.5 text-center text-muted-foreground font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {crbAccountList.slice(0, 8).map((a, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-muted/20">
                      <td className="px-3 py-1.5">{a.Account_Type ?? a.account_type ?? "—"}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{fmt(a.Balance ?? a.balance ?? 0)}</td>
                      <td className="px-3 py-1.5 text-center">
                        <Badge
                          variant={(a.Status ?? a.status ?? "").toLowerCase() === "active" ? "default" : "secondary"}
                          className="text-[9px]"
                        >
                          {a.Status ?? a.status ?? "—"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Applications */}
      {crbApps.Total != null && (
        <div className="bg-muted/30 rounded-lg border p-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Credit Applications</p>
          <div className="flex gap-6">
            <div className="text-center">
              <p className="text-lg font-bold">{crbApps.Total}</p>
              <p className="text-[10px] text-muted-foreground">Total</p>
            </div>
            {crbApps.Approvals != null && (
              <div className="text-center">
                <p className="text-lg font-bold text-green-600">{crbApps.Approvals}</p>
                <p className="text-[10px] text-muted-foreground">Approved</p>
              </div>
            )}
            {crbApps.Declined != null && (
              <div className="text-center">
                <p className="text-lg font-bold text-red-600">{crbApps.Declined}</p>
                <p className="text-[10px] text-muted-foreground">Declined</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Collateral */}
      {(crbCollMat.length > 0 || crbCollGuar.length > 0) && (
        <div className="bg-muted/30 rounded-lg border p-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Collateral</p>
          <div className="flex gap-6">
            {crbCollMat.length > 0 && (
              <div>
                <p className="text-lg font-bold">{crbCollMat.length}</p>
                <p className="text-[10px] text-muted-foreground">Material items</p>
              </div>
            )}
            {crbCollGuar.length > 0 && (
              <div>
                <p className="text-lg font-bold">{crbCollGuar.length}</p>
                <p className="text-[10px] text-muted-foreground">Guarantors</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Adverse records */}
      {(bouncedCheques.length > 0 || financialFraud.length > 0) && (
        <div>
          <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Adverse Records
          </p>
          {bouncedCheques.length > 0 && (
            <div className="mb-2">
              <p className="text-xs font-medium text-red-700 mb-1">Bounced Cheques ({bouncedCheques.length})</p>
              {bouncedCheques.map((d, i) => (
                <div key={i} className="border border-red-200 bg-red-50 rounded p-2 text-xs mb-1">
                  <p className="font-medium text-red-800">{d.Cheque_Number ?? d.cheque_number ?? `Cheque ${i + 1}`}</p>
                  {(d.Amount ?? d.amount) && <p>Amount: UGX {fmt(d.Amount ?? d.amount)}</p>}
                  {(d.Date ?? d.date) && <p className="text-muted-foreground">{d.Date ?? d.date}</p>}
                </div>
              ))}
            </div>
          )}
          {financialFraud.length > 0 && (
            <div>
              <p className="text-xs font-medium text-red-700 mb-1">Financial Fraud ({financialFraud.length})</p>
              {financialFraud.map((d, i) => (
                <div key={i} className="border border-red-200 bg-red-50 rounded p-2 text-xs mb-1">
                  <p className="font-medium text-red-800">{d.Type ?? d.type ?? `Record ${i + 1}`}</p>
                  {(d.Amount ?? d.amount) && <p>Amount: UGX {fmt(d.Amount ?? d.amount)}</p>}
                  {(d.Date ?? d.date) && <p className="text-muted-foreground">{d.Date ?? d.date}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NinResult({ data }) {
  // gnugrid: { message, status, count, validation: { nin, name, date_of_birth, nin_status, status } }
  const val = data?.validation ?? {};

  const fullName  = val.name ?? "—";
  const dob       = val.date_of_birth;
  const nin       = val.nin;
  const ninStatus = val.nin_status;
  const status    = val.status;

  const isValid = String(ninStatus ?? "").toUpperCase() === "VALID"
    || (String(status ?? "").toUpperCase() === "SUCCESSFUL" && String(ninStatus ?? "").toUpperCase() !== "INVALID");

  return (
    <div className="space-y-4">
      <div className={cn("flex items-center gap-2 text-sm font-medium", isValid ? "text-green-600" : "text-destructive")}>
        {isValid ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
        NIN {isValid ? "validated successfully" : "validation failed"}
        <Badge variant={isValid ? "default" : "destructive"} className="text-xs ml-auto">
          {ninStatus ?? status ?? "—"}
        </Badge>
      </div>

      <div className="flex gap-4 bg-muted/30 rounded-xl border p-4">
        <div className="w-20 h-24 bg-muted rounded-lg flex items-center justify-center shrink-0 border">
          <User className="w-8 h-8 text-muted-foreground opacity-50" />
        </div>
        <div className="flex-1 min-w-0 space-y-0.5">
          <p className="font-semibold text-base">{fullName}</p>
          {nin && <p className="text-xs font-mono text-muted-foreground">{nin}</p>}
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-x-4">
        <InfoRow icon={CalendarDays} label="Date of Birth" value={dob} />
        <InfoRow icon={Hash}         label="NIN Status"    value={ninStatus} />
      </div>
    </div>
  );
}

function PhoneResult({ data }) {
  // gnugrid: { message, status, count, validation: { phonenumber, surname, firstname, middlename, phone_status, status, error_message } }
  const val = data?.validation ?? {};

  const surname    = val.surname ?? "";
  const firstname  = val.firstname ?? "";
  const middlename = val.middlename ?? "";
  const fullName   = [firstname, middlename, surname].filter(Boolean).join(" ") || null;
  const phone      = val.phonenumber;
  const phoneStatus = val.phone_status;
  const status     = val.status;
  const errorMsg   = val.error_message;

  const isFound = String(phoneStatus ?? "").toUpperCase() === "FOUND"
    || String(status ?? "").toUpperCase() === "SUCCESSFUL";

  return (
    <div className="space-y-4">
      <div className={cn("flex items-center gap-2 text-sm font-medium", isFound ? "text-green-600" : "text-amber-600")}>
        {isFound ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
        Phone verification {isFound ? "successful" : "returned results"}
        <Badge variant={isFound ? "default" : "secondary"} className="text-xs ml-auto capitalize">
          {phoneStatus ?? status ?? "—"}
        </Badge>
      </div>

      <div className="bg-muted/30 rounded-xl border p-4 space-y-2">
        <InfoRow icon={Phone}  label="Phone Number"    value={phone} mono />
        <InfoRow icon={User}   label="Subscriber Name" value={fullName} />
        <InfoRow icon={Shield} label="Phone Status"    value={phoneStatus} />
        {errorMsg && (
          <div className="flex items-start gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded p-2 mt-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            {errorMsg}
          </div>
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

function ReportResult({ data, enquiry }) {
  const raw    = data?.data ?? data;
  const pdfUrl = raw?.pdf_url ?? raw?.data?.pdf_url ?? raw?.report_url;

  const individual = enquiry?.formal?.individuals?.[0]
    ?? enquiry?.informal?.individuals?.[0]
    ?? {};
  const name       = individual?.name;
  const identifier = enquiry?.identifier;
  const reference  = enquiry?.reference;
  const timestamp  = enquiry?.timestamp?.split(" ")?.[0];
  const entity     = enquiry?.entity;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
        <CheckCircle2 className="h-4 w-4" />
        Credit report enquiry completed
      </div>

      <div className="bg-muted/30 rounded-xl border p-3 space-y-0.5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Enquiry Summary</p>
        <InfoRow icon={User}         label="Individual"  value={name} />
        <InfoRow icon={Hash}         label="Identifier"  value={identifier} mono />
        <InfoRow icon={Hash}         label="Reference"   value={reference} mono />
        <InfoRow icon={Hash}         label="Entity"      value={entity} />
        <InfoRow icon={CalendarDays} label="Date"        value={timestamp} />
      </div>

      {pdfUrl ? (
        <a href={pdfUrl} target="_blank" rel="noreferrer" className="block">
          <Button className="w-full gap-2">
            <ExternalLink className="w-4 h-4" /> Open Full Credit Report PDF
          </Button>
        </a>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded p-3 space-y-1">
          <p className="text-sm text-amber-700 font-medium">PDF is being generated</p>
          <p className="text-xs text-amber-600">The report may take a few moments to be ready.</p>
          {reference && <p className="text-xs font-mono text-amber-700">Ref: {reference}</p>}
        </div>
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
  phone:      "/credit-enquiry/phone-validation",
  fcs:        "/credit-enquiry/fcs-validation",
};

export default function CRBRunDialog({ isOpen, onClose, product, meta }) {
  const axiosPrivate = useAxiosPrivate();
  const [form, setForm] = useState({
    entity_type:         meta.entityType,
    client_consented:    0,
    identifier:          meta.prefillIdentifier ?? "",
    phone_number:        meta.prefillPhone ?? "",
    identification_type: meta.entityType === 1 ? "ii_company_reg" : "ii_country_id",
  });
  const [result, setResult]         = useState(null);
  const [pdfResult, setPdfResult]   = useState(null);
  const [enquiry, setEnquiry]       = useState(null);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const endpoint = ENDPOINT_MAP[meta.mode] ?? "/credit-score/lookup";
      const payload  = { ...form };

      if (payload.phone_number) {
        payload.phone_number = normalisePhone(payload.phone_number);
      }

      if (!payload.entity_type_category) delete payload.entity_type_category;
      if (!payload.reason && meta.mode !== "report") delete payload.reason;

      const res = await axiosPrivate.post(endpoint, payload);
      return res.data;
    },
    onSuccess: async (data) => {
      if (meta.mode === "report") {
        const enq          = data?.data?.enquiry ?? data?.data?.raw?.enquiry;
        const enquiry_id   = enq?.id ?? data?.data?.enquiry_id;
        const individual_id = data?.data?.individual_id;
        const reference    = enq?.reference ?? data?.data?.reference;
        const timestamp    = enq?.timestamp ?? data?.data?.timestamp;

        if (enq) setEnquiry(enq);

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
    setForm({
      entity_type:         meta.entityType,
      client_consented:    0,
      identifier:          meta.prefillIdentifier ?? "",
      phone_number:        meta.prefillPhone ?? "",
      identification_type: meta.entityType === 1 ? "ii_company_reg" : "ii_country_id",
    });
    setResult(null);
    setPdfResult(null);
    setEnquiry(null);
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
              {meta.mode === "report" && <ReportResult data={displayResult?.data} enquiry={enquiry} />}
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

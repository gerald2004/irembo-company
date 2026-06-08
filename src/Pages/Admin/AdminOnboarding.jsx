import React, { useState, useRef, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { format } from "date-fns";
import {
  PlusCircle, Plus, Upload, CheckCircle2, Copy, AlertCircle, Loader2,
  FileArchive, X, ChevronDown, ChevronUp, Eye, EyeOff, Pencil,
  Building2, MessageSquare, CreditCard, Smartphone, Globe,
  Users, ChevronRight, ChevronLeft, Calendar, Briefcase, ImageIcon,
  BookOpen, FileSpreadsheet,
} from "lucide-react";
import { DatePicker, DatePickerField } from "@/components/ui/date-picker";
import useAdminAxios from "@/MiddleWares/Hooks/useAdminAxios";

// ── Primitive helpers ─────────────────────────────────────────────────────────

const cls = "w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent";

const Input = React.forwardRef(({ className = "", ...props }, ref) => (
  <input ref={ref} className={`${cls} ${className}`} {...props} />
));
Input.displayName = "Input";

const Textarea = React.forwardRef(({ ...props }, ref) => (
  <textarea ref={ref} className={`${cls} resize-none`} rows={2} {...props} />
));
Textarea.displayName = "Textarea";

function Select({ options, ...props }) {
  return (
    <select className={cls} {...props}>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
}
function Field({ label, error, hint, children, required }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-gray-600 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}

// Converts YYYY-MM-DD string ↔ Date object for the shadcn DatePicker
function FormDatePicker({ name, control, label, required, hint }) {
  return (
    <Field label={label} required={required} hint={hint}>
      <Controller
        name={name}
        control={control}
        render={({ field }) => {
          const asDate = field.value ? new Date(field.value + "T00:00:00") : undefined;
          return (
            <DatePicker
              selectedDate={asDate}
              onChange={(d) => field.onChange(d ? format(d, "yyyy-MM-dd") : "")}
            />
          );
        }}
      />
    </Field>
  );
}

// Logo file upload with preview
function LogoUpload({ value, onChange }) {
  const inputRef = useRef(null);
  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => onChange({ file, preview: reader.result });
    reader.readAsDataURL(file);
  };
  const clear = (e) => { e.stopPropagation(); onChange(null); if (inputRef.current) inputRef.current.value = ""; };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      className="flex items-center gap-4 cursor-pointer group"
    >
      <div className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 group-hover:border-zinc-500 transition-colors flex items-center justify-center overflow-hidden shrink-0">
        {value?.preview
          ? <img src={value.preview} alt="logo" className="w-full h-full object-cover" />
          : <ImageIcon className="w-5 h-5 text-gray-600 group-hover:text-zinc-400 transition-colors" />}
      </div>
      <div className="flex-1 min-w-0">
        {value?.file
          ? (
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-900 dark:text-white truncate">{value.file.name}</p>
              <button type="button" onClick={clear} className="text-gray-500 hover:text-red-400 shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )
          : <p className="text-sm text-gray-500 group-hover:text-gray-300 transition-colors">Click to upload logo</p>
        }
        <p className="text-xs text-gray-600 mt-0.5">PNG, JPG — max 2 MB</p>
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}

function YesNoToggle({ value, onChange }) {
  const on = value === "yes";
  return (
    <button type="button" onClick={() => onChange(on ? "no" : "yes")}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${on ? "bg-zinc-900" : "bg-gray-700"}`}>
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${on ? "translate-x-5" : "translate-x-1"}`} />
    </button>
  );
}
function ToggleRow({ label, name, control, hint }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-200 dark:border-gray-800/60 last:border-0">
      <div>
        <span className="text-sm text-gray-300">{label}</span>
        {hint && <p className="text-xs text-gray-600 mt-0.5">{hint}</p>}
      </div>
      <Controller name={name} control={control} render={({ field }) => (
        <YesNoToggle value={field.value} onChange={field.onChange} />
      )} />
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-start gap-3 pb-4 mb-4 border-b border-gray-200 dark:border-gray-800">
      <div className="p-2 bg-zinc-800 rounded-lg shrink-0">
        <Icon className="w-4 h-4 text-zinc-400" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function CredRow({ label, value }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-200 dark:border-gray-800 last:border-0">
      <span className="text-xs text-gray-500 w-28 shrink-0">{label}</span>
      <span className="font-mono text-sm text-gray-900 dark:text-white flex-1 px-2 truncate">{value}</span>
      <button onClick={copy} className="text-gray-500 hover:text-zinc-400 transition-colors">
        {copied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
}

// ── Step progress bar ─────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "SACCO",        icon: Building2    },
  { id: 2, label: "Branch",       icon: Building2    },
  { id: 3, label: "Fiscal Year",  icon: Calendar     },
  { id: 4, label: "Department",   icon: Briefcase    },
  { id: 5, label: "Admin User",   icon: Users        },
  { id: 6, label: "Review",       icon: CheckCircle2 },
];

// Searchable SACCO selector — fetches the full list and lets the user pick by name
function SaccoPicker({ value, onChange }) {
  const api     = useAdminAxios();
  const dropRef = useRef(null);
  const [saccos,   setSaccos]   = useState([]);
  const [query,    setQuery]    = useState("");
  const [open,     setOpen]     = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [fetchErr, setFetchErr] = useState(false);

  const load = () => {
    setLoading(true); setFetchErr(false);
    api.get("/admin/saccos?per_page=100")
      .then(res => setSaccos(res.data?.data?.saccos ?? []))
      .catch(() => setFetchErr(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = saccos.find(s => s.sacco_id === value);

  const q = query.toLowerCase();
  const filtered = q
    ? saccos.filter(s =>
        s.sacco_name?.toLowerCase().includes(q) ||
        s.sacco_short_name?.toLowerCase().includes(q) ||
        s.sacco_emails?.toLowerCase().includes(q) ||
        s.sacco_contact?.toLowerCase().includes(q) ||
        String(s.sacco_code ?? "").includes(q) ||
        String(s.sacco_id).includes(q)
      )
    : saccos;

  const hint = (s) => {
    if (!q) return null;
    if (s.sacco_emails?.toLowerCase().includes(q)) return s.sacco_emails;
    if (s.sacco_contact?.toLowerCase().includes(q)) return s.sacco_contact;
    if (String(s.sacco_code ?? "").includes(q)) return `Code ${s.sacco_code}`;
    if (s.sacco_short_name?.toLowerCase().includes(q)) return s.sacco_short_name;
    return null;
  };

  if (fetchErr) {
    return (
      <div className="flex items-center gap-3 px-3 py-2.5 bg-red-900/20 border border-red-800/30 rounded-lg">
        <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
        <span className="text-sm text-red-400 flex-1">Failed to load SACCOs</span>
        <button type="button" onClick={load} className="text-xs text-zinc-400 hover:text-zinc-300 underline shrink-0">Retry</button>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropRef}>
      <div className="relative">
        <input
          type="text"
          className={cls}
          placeholder={loading ? "Loading SACCOs…" : "Search by name, email, phone or code…"}
          value={open ? query : (selected ? `${selected.sacco_name}  ·  ID #${selected.sacco_id}` : "")}
          disabled={loading}
          onFocus={() => { setOpen(true); setQuery(""); }}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-500" />}
      </div>
      {open && !loading && (
        <div className="absolute z-50 mt-1 w-full bg-gray-900 border border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="px-3 py-2.5 text-sm text-gray-500">No SACCOs found</p>
          ) : filtered.map(s => (
            <button
              key={s.sacco_id}
              type="button"
              className={`w-full text-left px-3 py-2.5 text-sm flex items-center justify-between gap-3 transition-colors ${
                s.sacco_id === value ? "bg-zinc-700/60 text-white" : "hover:bg-gray-800 text-gray-200"
              }`}
              onClick={() => { onChange(s); setOpen(false); setQuery(""); }}
            >
              <div className="min-w-0">
                <p className="truncate">{s.sacco_name}</p>
                {hint(s) && <p className="text-xs text-zinc-400 truncate">{hint(s)}</p>}
              </div>
              <span className="text-xs text-gray-500 shrink-0">#{s.sacco_id}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StepBar({ current }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((s, i) => {
        const done    = s.id < current;
        const active  = s.id === current;
        const Icon    = s.icon;
        return (
          <React.Fragment key={s.id}>
            <div className="flex flex-col items-center gap-1.5 min-w-[56px]">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                done   ? "bg-zinc-900 text-white"
                : active ? "bg-zinc-900 text-white ring-2 ring-zinc-400 ring-offset-2 ring-offset-gray-950"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600"
              }`}>
                {done ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
              </div>
              <span className={`text-[10px] font-medium whitespace-nowrap ${active ? "text-zinc-400" : done ? "text-gray-600 dark:text-gray-400" : "text-gray-600"}`}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mt-[-14px] mx-1 transition-colors ${done ? "bg-zinc-900" : "bg-gray-800"}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Step 1: SACCO Profile ─────────────────────────────────────────────────────

function Step1({ register, control, errors, logoData, setLogoData }) {
  return (
    <div className="space-y-6">
      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
        <SectionHeader icon={Building2} title="Basic Information" subtitle="Core identity of the SACCO" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="SACCO Name" required error={errors.sacco_name?.message}>
            <Input placeholder="e.g. Kampala Teachers SACCO" {...register("sacco_name", { required: "Required" })} />
          </Field>
          <Field label="Short Name" hint="Abbreviation for reports">
            <Input placeholder="e.g. KTSACCO" {...register("sacco_short_name")} />
          </Field>
          <Field label="Primary Contact">
            <Input placeholder="+256 700 000000" {...register("sacco_contact")} />
          </Field>
          <Field label="Additional Contacts" hint="Other phone numbers">
            <Input placeholder="+256 700 111111, +256 700 222222" {...register("sacco_contacts")} />
          </Field>
          <Field label="Primary Email(s)" hint="Comma-separated if multiple">
            <Input placeholder="info@sacco.ug" {...register("sacco_emails")} />
          </Field>
          <Field label="Extra Emails" hint="CC / notification addresses">
            <Input placeholder="ceo@sacco.ug, accounts@sacco.ug" {...register("sacco_extra_emails")} />
          </Field>
          <Field label="Location">
            <Input placeholder="Kampala, Uganda" {...register("sacco_location")} />
          </Field>
          <FormDatePicker name="sacco_registration_date" control={control} label="Registration Date" />
          <Field label="SACCO Code" hint="Internal numeric code">
            <Input type="number" placeholder="e.g. 1001" {...register("sacco_code")} />
          </Field>
          <Field label="Logo">
            <LogoUpload value={logoData} onChange={setLogoData} />
          </Field>
        </div>
      </section>

      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
        <SectionHeader icon={Globe} title="System Status" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="SACCO Status">
            <Controller name="sacco_status" control={control} render={({ field }) => (
              <Select options={[["active","Active"],["inactive","Inactive"]]} value={field.value} onChange={field.onChange} />
            )} />
          </Field>
          <Field label="System Status" hint="Locked blocks all logins">
            <Controller name="sacco_system_status" control={control} render={({ field }) => (
              <Select options={[["open","Open"],["locked","Locked"]]} value={field.value} onChange={field.onChange} />
            )} />
          </Field>
        </div>
      </section>

      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
        <SectionHeader icon={MessageSquare} title="Communication" subtitle="SMS and email settings" />
        <div className="divide-y divide-gray-200 dark:divide-gray-800/60 mb-4">
          <ToggleRow label="SMS Enabled"   name="sacco_sms_status"   control={control} />
          <ToggleRow label="Email Enabled" name="sacco_email_status" control={control} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="SMS Billing Type">
            <Controller name="sms_billing_type" control={control} render={({ field }) => (
              <Select options={[["","— Not set —"],["prepaid","Prepaid"],["postpaid","Postpaid"]]} value={field.value} onChange={field.onChange} />
            )} />
          </Field>
          <Field label="Email Billing Type">
            <Controller name="email_billing_type" control={control} render={({ field }) => (
              <Select options={[["","— Not set —"],["monthly","Monthly"],["postpaid","Postpaid"]]} value={field.value} onChange={field.onChange} />
            )} />
          </Field>
        </div>
      </section>

      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
        <SectionHeader icon={CreditCard} title="Loan Settings" />
        <div className="divide-y divide-gray-200 dark:divide-gray-800/60">
          <ToggleRow label="Loan Penalties"               name="sacco_loan_penalties"               control={control} />
          <ToggleRow label="Loan Alerts (system)"         name="sacco_sacco_loan_alerts"            control={control} />
          <ToggleRow label="Loan Alerts (client SMS)"     name="sacco_loan_alerts"                  control={control} />
          <ToggleRow label="Auto Loan Charges"            name="sacco_loan_auto_charge"             control={control} />
          <ToggleRow label="Monthly Auto Charge Settings" name="sacco_monthly_auto_charge_settings" control={control} />
        </div>
      </section>

      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
        <SectionHeader icon={Smartphone} title="Digital Access" subtitle="Mobile app and portal toggles" />
        <div className="divide-y divide-gray-200 dark:divide-gray-800/60">
          <ToggleRow label="Client Mobile App Login"  name="sacco_mobile_app_login"    control={control} />
          <ToggleRow label="Staff Mobile App"         name="sacco_staff_mobile_app"    control={control} />
          <ToggleRow label="Client Web Portal Login"  name="sacco_client_portal_login" control={control} />
        </div>
      </section>

      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
        <SectionHeader icon={Globe} title="Staff App Feature Toggles" subtitle="What staff can do inside the mobile app" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
          <div className="divide-y divide-gray-200 dark:divide-gray-800/60">
            <ToggleRow label="Deposits"             name="app_deposits"             control={control} />
            <ToggleRow label="Withdrawals"          name="app_withdrawals"          control={control} />
            <ToggleRow label="Group Deposits"       name="app_group_deposits"       control={control} />
            <ToggleRow label="Group Withdrawals"    name="app_group_withdrawals"    control={control} />
            <ToggleRow label="Loan Applications"    name="app_loan_applications"    control={control} />
            <ToggleRow label="New Client"           name="app_new_client"           control={control} />
            <ToggleRow label="Show Balance"         name="app_show_balance"         control={control} />
            <ToggleRow label="Loan Calculator"      name="app_loan_calculator"      control={control} />
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-800/60">
            <ToggleRow label="Group Registration"   name="app_group_registration"   control={control} />
            <ToggleRow label="Company Registration" name="app_company_registration" control={control} />
            <ToggleRow label="Joint Registration"   name="app_joint_registration"   control={control} />
            <ToggleRow label="Joint Deposits"       name="app_joint_deposits"       control={control} />
            <ToggleRow label="Company Deposits"     name="app_company_deposits"     control={control} />
            <ToggleRow label="Joint Withdrawals"    name="app_joint_withdrawals"    control={control} />
            <ToggleRow label="Company Withdrawals"  name="app_company_withdrawals"  control={control} />
          </div>
        </div>
      </section>
    </div>
  );
}

// ── Step 2: Branch ────────────────────────────────────────────────────────────

function Step2({ register }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-4">
      <SectionHeader icon={Building2} title="Head Office Branch" subtitle="This is the first branch created for the SACCO" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Branch Name" required>
          <Input defaultValue="Head Office" {...register("branch_name")} />
        </Field>
        <Field label="Branch Code" required>
          <Input defaultValue="HQ-001" {...register("branch_code")} />
        </Field>
        <Field label="Contact">
          <Input placeholder="+256 700 000000" {...register("branch_contact")} />
        </Field>
        <Field label="Email Address">
          <Input type="email" placeholder="branch@sacco.ug" {...register("branch_email_address")} />
        </Field>
        <Field label="Physical Address">
          <Input placeholder="Plot 12, Kampala Road, Kampala" {...register("branch_address")} />
        </Field>
        <Field label="Description">
          <Textarea placeholder="e.g. Main headquarters branch" {...register("branch_description")} />
        </Field>
      </div>
    </div>
  );
}

// ── Step 3: Fiscal Year ───────────────────────────────────────────────────────

function Step3({ register, control, errors }) {
  const year = new Date().getFullYear();
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-4">
      <SectionHeader icon={Calendar} title="First Fiscal Year" subtitle="The active accounting period for this SACCO" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Fiscal Year Name" required error={errors.fiscal_year_name?.message}>
          <Input placeholder={`FY ${year}`} {...register("fiscal_year_name", { required: "Required" })} />
        </Field>
        <div />
        <FormDatePicker name="fiscal_year_start" control={control} label="Start Date" required />
        <FormDatePicker name="fiscal_year_end"   control={control} label="End Date"   required />
      </div>
      <p className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800/50 rounded-lg px-4 py-3">
        The fiscal year cannot be changed after it is used in journals. Ensure the dates are correct.
      </p>
    </div>
  );
}

// ── Step 4: Department ────────────────────────────────────────────────────────

function Step4({ register, control, errors }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-4">
      <SectionHeader icon={Briefcase} title="Initial Department" subtitle="The first department linked to the head office branch" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Department Name" required error={errors.department_name?.message}>
          <Input placeholder="Administration" {...register("department_name", { required: "Required" })} />
        </Field>
        <Field label="Department Code" required error={errors.department_code?.message}>
          <Input placeholder="ADMIN" {...register("department_code", { required: "Required" })} />
        </Field>
        <Field label="Contact">
          <Input placeholder="+256 700 000000" {...register("department_contact")} />
        </Field>
        <Field label="Email">
          <Input type="email" placeholder="admin@sacco.ug" {...register("department_email")} />
        </Field>
        <Field label="Description">
          <Textarea placeholder="Describe the department…" {...register("department_description")} />
        </Field>
        <Field label="Status">
          <Controller name="department_status" control={control} render={({ field }) => (
            <Select options={[["active","Active"],["inactive","Inactive"]]} value={field.value} onChange={field.onChange} />
          )} />
        </Field>
      </div>
    </div>
  );
}

// ── Step 5: Admin User ────────────────────────────────────────────────────────

function Step5({ register, control, errors, adminImageData, setAdminImageData }) {
  const [showPass, setShowPass] = useState(false);
  return (
    <div className="space-y-5">
      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-4">
        <SectionHeader icon={Users} title="Personal Information" subtitle="First admin user for this SACCO" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="First Name" required error={errors.admin_firstname?.message}>
            <Input {...register("admin_firstname", { required: "Required" })} />
          </Field>
          <Field label="Last Name" required error={errors.admin_lastname?.message}>
            <Input {...register("admin_lastname", { required: "Required" })} />
          </Field>
          <Field label="Email" required error={errors.admin_email?.message}>
            <Input type="email" {...register("admin_email", { required: "Required" })} />
          </Field>
          <Field label="Contact" required error={errors.admin_contact?.message}>
            <Input placeholder="+256 700 000000" {...register("admin_contact", { required: "Required" })} />
          </Field>
          <Field label="Gender">
            <Controller name="admin_gender" control={control} render={({ field }) => (
              <Select options={[["male","Male"],["female","Female"]]} value={field.value} onChange={field.onChange} />
            )} />
          </Field>
          <FormDatePicker name="admin_date_of_birth" control={control} label="Date of Birth" />
          <Field label="Identification Code" hint="National ID / passport number">
            <Input placeholder="CM12345678" {...register("admin_identification_code")} />
          </Field>
          <Field label="Profile Image">
            <LogoUpload value={adminImageData} onChange={setAdminImageData} />
          </Field>
        </div>
      </section>

      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-4">
        <SectionHeader icon={Briefcase} title="Employment Details" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Job Title">
            <Input placeholder="System Administrator" {...register("admin_job_title")} />
          </Field>
          <Field label="Salary" hint="Monthly gross">
            <Input type="number" step="0.01" placeholder="0.00" {...register("admin_salary")} />
          </Field>
          <Field label="Account Status">
            <Controller name="admin_status" control={control} render={({ field }) => (
              <Select options={[["active","Active"],["inactive","Inactive"]]} value={field.value} onChange={field.onChange} />
            )} />
          </Field>
          <Field label="Default Dashboard">
            <Controller name="admin_default_dashboard" control={control} render={({ field }) => (
              <Select options={[
                ["members","Members"],["loans","Loans"],["overview","Overview"],
                ["accounting","Accounting"],["notifications","Notifications"],
              ]} value={field.value} onChange={field.onChange} />
            )} />
          </Field>
          <Field label="Data Privileges" hint="Which records this user can see">
            <Controller name="admin_data_privileges" control={control} render={({ field }) => (
              <Select options={[["sacco","All (SACCO)"],["branch","Branch"],["personal","Personal"]]} value={field.value} onChange={field.onChange} />
            )} />
          </Field>
          <Field label="Client Data Privileges">
            <Controller name="admin_client_data_privileges" control={control} render={({ field }) => (
              <Select options={[["sacco","All (SACCO)"],["branch","Branch"],["personal","Personal"]]} value={field.value} onChange={field.onChange} />
            )} />
          </Field>
        </div>
      </section>

      <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-4">
        <SectionHeader icon={CreditCard} title="Login & Security" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Password" hint="Leave blank to auto-generate">
            <div className="relative">
              <Input type={showPass ? "text" : "password"} placeholder="Auto-generated if blank" className="pr-10" {...register("admin_password")} />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </Field>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-800/60">
          <ToggleRow label="Two-Factor Authentication" name="admin_two_factor_enabled" control={control} hint="Recommended for all admin accounts" />
        </div>
        <Field label="2FA Method">
          <Controller name="admin_two_factor_method" control={control} render={({ field }) => (
            <Select options={[["sms","SMS"],["email","Email"],["app","Authenticator App"]]} value={field.value} onChange={field.onChange} />
          )} />
        </Field>
      </section>
    </div>
  );
}

// ── Step 6: Review ────────────────────────────────────────────────────────────

function ReviewRow({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex items-start justify-between py-2 border-b border-gray-200 dark:border-gray-800/60 last:border-0 gap-4">
      <span className="text-xs text-gray-500 shrink-0 w-40">{label}</span>
      <span className="text-xs text-gray-900 dark:text-white text-right break-all">{String(value)}</span>
    </div>
  );
}

function ReviewSection({ title, icon: Icon, rows }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-3.5 h-3.5 text-zinc-400" />
        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">{title}</p>
      </div>
      {rows.map(([l, v]) => <ReviewRow key={l} label={l} value={v} />)}
    </div>
  );
}

function Step6({ data }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Review all details before provisioning. You can go back to edit any step.</p>

      <ReviewSection title="SACCO" icon={Building2} rows={[
        ["Name",              data.sacco_name],
        ["Short name",        data.sacco_short_name],
        ["Contact",           data.sacco_contact],
        ["Emails",            data.sacco_emails],
        ["Location",          data.sacco_location],
        ["Registration date", data.sacco_registration_date],
        ["Status",            data.sacco_status],
        ["System status",     data.sacco_system_status],
        ["SMS status",        data.sacco_sms_status],
        ["Email status",      data.sacco_email_status],
        ["SMS billing",       data.sms_billing_type || "Not set"],
        ["Email billing",     data.email_billing_type || "Not set"],
      ]} />

      <ReviewSection title="Loan Settings" icon={CreditCard} rows={[
        ["Loan penalties",       data.sacco_loan_penalties],
        ["Loan alerts",          data.sacco_loan_alerts],
        ["Auto charges",         data.sacco_loan_auto_charge],
        ["Monthly auto charge",  data.sacco_monthly_auto_charge_settings],
      ]} />

      <ReviewSection title="Digital Access" icon={Smartphone} rows={[
        ["Client mobile app",   data.sacco_mobile_app_login],
        ["Staff mobile app",    data.sacco_staff_mobile_app],
        ["Client web portal",   data.sacco_client_portal_login],
      ]} />

      <ReviewSection title="Head Office Branch" icon={Building2} rows={[
        ["Name",        data.branch_name],
        ["Code",        data.branch_code],
        ["Contact",     data.branch_contact],
        ["Email",       data.branch_email_address],
        ["Address",     data.branch_address],
      ]} />

      <ReviewSection title="Fiscal Year" icon={Calendar} rows={[
        ["Name",       data.fiscal_year_name],
        ["Start date", data.fiscal_year_start],
        ["End date",   data.fiscal_year_end],
      ]} />

      <ReviewSection title="Department" icon={Briefcase} rows={[
        ["Name",   data.department_name],
        ["Code",   data.department_code],
        ["Status", data.department_status],
      ]} />

      <ReviewSection title="Admin User" icon={Users} rows={[
        ["Name",              `${data.admin_firstname} ${data.admin_lastname}`],
        ["Email",             data.admin_email],
        ["Contact",           data.admin_contact],
        ["Gender",            data.admin_gender],
        ["Job title",         data.admin_job_title],
        ["Data privileges",   data.admin_data_privileges],
        ["Default dashboard", data.admin_default_dashboard],
        ["2FA",               data.admin_two_factor_enabled],
        ["2FA method",        data.admin_two_factor_method],
        ["Password",          data.admin_password ? "Provided" : "Auto-generate"],
      ]} />
    </div>
  );
}

// ── Provision wizard ──────────────────────────────────────────────────────────

const YEAR = new Date().getFullYear();

const DEFAULTS = {
  // SACCO
  sacco_name: "", sacco_short_name: "", sacco_contact: "", sacco_contacts: "",
  sacco_emails: "", sacco_extra_emails: "", sacco_location: "",
  sacco_registration_date: "", sacco_logo: "", sacco_code: "",
  sacco_status: "active", sacco_system_status: "open",
  sacco_sms_status: "yes", sacco_email_status: "yes",
  sms_billing_type: "", email_billing_type: "",
  sacco_loan_penalties: "yes", sacco_sacco_loan_alerts: "yes",
  sacco_loan_alerts: "yes", sacco_loan_auto_charge: "yes",
  sacco_monthly_auto_charge_settings: "no",
  sacco_mobile_app_login: "no", sacco_staff_mobile_app: "no",
  sacco_client_portal_login: "no",
  app_deposits: "yes", app_withdrawals: "yes",
  app_group_deposits: "yes", app_group_withdrawals: "yes",
  app_loan_applications: "yes", app_new_client: "yes",
  app_show_balance: "yes", app_loan_calculator: "yes",
  app_group_registration: "yes", app_company_registration: "yes",
  app_joint_registration: "yes", app_joint_deposits: "yes",
  app_company_deposits: "yes", app_joint_withdrawals: "yes",
  app_company_withdrawals: "yes",
  // Branch
  branch_name: "Head Office", branch_code: "HQ-001",
  branch_contact: "", branch_email_address: "", branch_address: "", branch_description: "",
  // Fiscal Year
  fiscal_year_name: `FY ${YEAR}`,
  fiscal_year_start: `${YEAR}-01-01`,
  fiscal_year_end:   `${YEAR}-12-31`,
  // Department
  department_name: "Administration", department_code: "ADMIN",
  department_contact: "", department_email: "", department_description: "",
  department_status: "active",
  // Admin User
  admin_firstname: "", admin_lastname: "", admin_email: "", admin_contact: "",
  admin_gender: "male", admin_date_of_birth: "", admin_identification_code: "",
  admin_image: "", admin_job_title: "System Administrator", admin_salary: "",
  admin_status: "active", admin_default_dashboard: "members",
  admin_data_privileges: "sacco", admin_client_data_privileges: "sacco",
  admin_password: "", admin_two_factor_enabled: "yes", admin_two_factor_method: "sms",
};

const STORAGE_KEY = "onboard_draft";

function ProvisionTab() {
  const api      = useAdminAxios();
  const navigate = useNavigate();

  // Read draft synchronously so useForm gets the right defaultValues on first render.
  // Using a lazy useState ensures this runs once before anything else.
  const [draft] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const d = JSON.parse(stored);
        if (d?.values && Object.keys(d.values).length > 0) return d;
      }
    } catch { localStorage.removeItem(STORAGE_KEY); }
    return null;
  });

  const [step,     setStep]     = useState(draft?.step ?? 1);
  const [result,   setResult]   = useState(null);
  const [apiError, setApiError] = useState("");
  const [hasDraft, setHasDraft] = useState(!!draft);
  const [saveMsg,  setSaveMsg]  = useState("");
  const [logoData,       setLogoData]       = useState(null);
  const [adminImageData, setAdminImageData] = useState(null);
  const [stepError,      setStepError]      = useState("");

  const { register, handleSubmit, control, trigger, getValues, reset, watch,
    formState: { errors, isSubmitting } } = useForm({
    defaultValues: draft?.values ?? DEFAULTS,
  });

  const saveProgress = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ step, values: getValues() }));
    setSaveMsg("Progress saved!");
    setTimeout(() => setSaveMsg(""), 2000);
  };

  const clearDraft = () => {
    localStorage.removeItem(STORAGE_KEY);
    setHasDraft(false);
    reset(DEFAULTS);
    setStep(1);
  };

  // Fields that must pass validation per step before advancing
  const STEP_FIELDS = {
    1: ["sacco_name"],
    2: [],
    3: ["fiscal_year_name", "fiscal_year_start", "fiscal_year_end"],
    4: ["department_name", "department_code"],
    5: ["admin_firstname", "admin_lastname", "admin_email", "admin_contact"],
  };

  const goNext = async () => {
    setStepError("");
    const fields = STEP_FIELDS[step] ?? [];
    const valid  = fields.length ? await trigger(fields) : true;
    if (!valid) return;

    if (step === 1) {
      try {
        await api.post("/admin/onboard/check", { sacco_name: getValues("sacco_name") });
      } catch (err) {
        const msg = err?.response?.data?.messages;
        setStepError(Array.isArray(msg) ? msg[0] : (msg ?? "SACCO already exists."));
        return;
      }
    }

    if (step === 5) {
      try {
        await api.post("/admin/onboard/check", { admin_email: getValues("admin_email") });
      } catch (err) {
        const msg = err?.response?.data?.messages;
        setStepError(Array.isArray(msg) ? msg[0] : (msg ?? "Email already in use."));
        return;
      }
    }

    setStep((s) => Math.min(s + 1, 6));
  };
  const goBack = () => { setStepError(""); setStep((s) => Math.max(s - 1, 1)); };

  const onSubmit = async (data) => {
    setApiError("");
    const payload = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== ""));
    if (logoData?.preview)       payload.sacco_logo   = logoData.preview;
    if (adminImageData?.preview) payload.admin_image  = adminImageData.preview;
    try {
      const res = await api.post("/admin/onboard/provision", payload);
      localStorage.removeItem(STORAGE_KEY);
      setResult(res.data?.data);
    } catch (err) {
      const msg = err?.response?.data?.messages;
      setApiError(Array.isArray(msg) ? msg.join(" ") : (msg ?? "Provisioning failed."));
      setStep(6);
    }
  };

  if (result) {
    return (
      <div className="max-w-lg space-y-5">
        <div className="bg-green-900/20 border border-green-700/40 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="w-6 h-6 text-green-400 shrink-0" />
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">SACCO Provisioned Successfully</h2>
              <p className="text-xs text-green-400">{result.sacco_name} · ID #{result.sacco_id}</p>
            </div>
          </div>
          <div className="bg-gray-100 dark:bg-gray-950 rounded-lg px-4 py-1">
            <CredRow label="Email"          value={result.email} />
            <CredRow label="Password"       value={result.password} />
            <CredRow label="PIN"            value={result.pin} />
            <CredRow label="SACCO ID"       value={String(result.sacco_id)} />
            <CredRow label="Branch ID"      value={String(result.branch_id)} />
            <CredRow label="Fiscal Year"    value={String(result.fiscal_year_id)} />
            <CredRow label="Department"     value={String(result.department_id)} />
          </div>
          <p className="text-xs text-amber-400 mt-4 bg-amber-900/20 border border-amber-700/30 rounded-md px-3 py-2">
            Share these credentials securely. The admin should change the password and PIN on first login.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/admin/onboard?tab=migrate&sacco_id=${result.sacco_id}&name=${encodeURIComponent(result.sacco_name)}`)}
            className="flex-1 bg-zinc-900 hover:bg-zinc-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
          >
            Run Migration for this SACCO
          </button>
          <button onClick={() => { setResult(null); setStep(1); reset(DEFAULTS); setHasDraft(false); }}
            className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            Provision Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <StepBar current={step} />

      {hasDraft && (
        <div className="flex items-start justify-between bg-zinc-800/40 border border-zinc-600/40 rounded-lg px-4 py-3 mb-5 gap-4">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-zinc-300 font-medium">Draft loaded — resuming from step {draft?.step ?? 1}</p>
              <p className="text-xs text-gray-500 mt-0.5">Your previously saved data has been restored. Continue filling in the remaining steps.</p>
            </div>
          </div>
          <button onClick={clearDraft} className="text-xs text-gray-500 hover:text-red-400 transition-colors whitespace-nowrap shrink-0">
            Start fresh
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        {apiError && (
          <div className="flex gap-2 items-start text-red-400 bg-red-900/20 border border-red-800/30 rounded-lg px-4 py-3 mb-5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><p className="text-sm">{apiError}</p>
          </div>
        )}

        {stepError && (
          <div className="flex gap-2 items-start text-red-400 bg-red-900/20 border border-red-800/30 rounded-lg px-4 py-3 mb-4">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><p className="text-sm">{stepError}</p>
          </div>
        )}

        <div className="mb-6">
          {step === 1 && <Step1 register={register} control={control} errors={errors} logoData={logoData} setLogoData={setLogoData} />}
          {step === 2 && <Step2 register={register} />}
          {step === 3 && <Step3 register={register} control={control} errors={errors} />}
          {step === 4 && <Step4 register={register} control={control} errors={errors} />}
          {step === 5 && <Step5 register={register} control={control} errors={errors} adminImageData={adminImageData} setAdminImageData={setAdminImageData} />}
          {step === 6 && <Step6 data={getValues()} />}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-800">
          <button type="button" onClick={goBack} disabled={step === 1}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>

          <div className="flex items-center gap-3">
            {step < 6 && (
              <button type="button" onClick={saveProgress}
                className="text-xs text-gray-500 hover:text-zinc-400 transition-colors px-2 py-1">
                {saveMsg || "Save & continue later"}
              </button>
            )}

            {step < 6 ? (
              <button type="button" onClick={goNext}
                className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors">
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button type="submit" disabled={isSubmitting}
                className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-6 py-2.5 rounded-lg text-sm transition-colors">
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSubmitting ? "Provisioning…" : "Create SACCO"}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

// ── Shared sub-components (migrate tab) ───────────────────────────────────────

const SHEETS = [
  "01_chart_of_accounts", "02_fiscal_year", "03_sacco_defaults",
  "04_users", "05_tills", "06_clients_individual", "07_clients_group",
  "08_clients_group_members", "09_clients_company", "10_clients_joint",
  "11_loans", "12_group_loan_allocations", "13_account_statements",
];

function SheetResult({ name, result }) {
  const [open, setOpen] = useState(result?.errors?.length > 0);
  if (!result) return null;
  const hasErrors = result.errors?.length > 0;
  return (
    <div className={`border rounded-lg overflow-hidden ${hasErrors ? "border-red-800/50" : "border-gray-200 dark:border-gray-800"}`}>
      <button className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-gray-800/40" onClick={() => setOpen(!open)}>
        <div className="flex items-center gap-3">
          {hasErrors ? <AlertCircle className="w-4 h-4 text-red-400 shrink-0" /> : <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />}
          <span className="text-sm font-medium text-gray-900 dark:text-white">{name.replace(/_/g, " ")}</span>
          <span className="text-xs text-gray-500 font-mono">
            {result.created != null && `+${result.created} created`}
            {result.skipped != null && ` · ${result.skipped} skipped`}
          </span>
        </div>
        {hasErrors && (open ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />)}
      </button>
      {open && hasErrors && (
        <div className="px-4 pb-3 space-y-1">
          {result.errors.map((e, i) => <p key={i} className="text-xs text-red-300 bg-red-900/20 rounded px-2 py-1 font-mono">{e}</p>)}
        </div>
      )}
    </div>
  );
}

// ── Migrate tab ───────────────────────────────────────────────────────────────

function MigrateTab({ defaultSaccoId, defaultSaccoName }) {
  const api = useAdminAxios();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [selectedSacco,  setSelectedSacco]  = useState(defaultSaccoId ? { sacco_id: Number(defaultSaccoId), sacco_name: defaultSaccoName || "" } : null);
  const [file,           setFile]           = useState(null);
  const [report,         setReport]         = useState(null);
  const [validateReport, setValidateReport] = useState(null);
  const [loading,        setLoading]        = useState(false);
  const [validating,     setValidating]     = useState(false);
  const [error,          setError]          = useState("");

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f?.name.endsWith(".zip")) { setFile(f); setError(""); }
    else setError("Only .zip files are accepted.");
  };

  const saccoId = selectedSacco?.sacco_id || "";

  const handleValidate = async (e) => {
    e.preventDefault();
    if (!saccoId) { setError("Select a SACCO."); return; }
    if (!file)    { setError("Select a ZIP file."); return; }
    setValidating(true); setError(""); setValidateReport(null);
    const form = new FormData();
    form.append("sacco_id", saccoId);
    form.append("file", file);
    try {
      const res = await api.post("/admin/onboard/validate", form, { headers: { "Content-Type": "multipart/form-data" } });
      setValidateReport(res.data?.data ?? {});
    } catch (err) {
      const msg = err?.response?.data?.messages;
      setError(Array.isArray(msg) ? msg.join(", ") : (msg ?? "Validation failed."));
    } finally { setValidating(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!saccoId) { setError("Select a SACCO."); return; }
    if (!file)    { setError("Select a ZIP file."); return; }
    setLoading(true); setError(""); setReport(null);
    const form = new FormData();
    form.append("sacco_id", saccoId);
    form.append("file", file);
    try {
      const res = await api.post("/admin/onboard/migrate", form, { headers: { "Content-Type": "multipart/form-data" } });
      setReport(res.data?.data ?? {});
    } catch (err) {
      const d = err?.response?.data?.data;
      const msg = err?.response?.data?.messages;
      if (d) setReport(d);
      else setError(Array.isArray(msg) ? msg.join(", ") : (msg ?? "Migration failed."));
    } finally { setLoading(false); }
  };

  const sheetKeys   = report ? Object.keys(report.sheets ?? {}) : [];
  const totalErrors = report?.errors?.length ?? 0;

  if (report) {
    return (
      <div className="max-w-2xl space-y-4">
        <div className={`border rounded-xl p-4 flex gap-3 ${totalErrors === 0 ? "bg-green-900/10 border-green-700/40" : "bg-amber-900/10 border-amber-700/40"}`}>
          {totalErrors === 0 ? <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />}
          <div>
            <p className={`font-semibold text-sm ${totalErrors === 0 ? "text-green-300" : "text-amber-300"}`}>
              {totalErrors === 0 ? "Migration completed successfully" : `Completed with ${totalErrors} error(s)`}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{sheetKeys.length} sheet(s) processed</p>
          </div>
        </div>
        <div className="space-y-2">{sheetKeys.map((k) => <SheetResult key={k} name={k} result={report.sheets[k]} />)}</div>
        <div className="flex gap-3 pt-2">
          <button onClick={() => { setReport(null); setFile(null); }} className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            Run Another
          </button>
          <button onClick={() => navigate("/admin/dashboard")} className="flex-1 bg-zinc-900 hover:bg-zinc-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">SACCO *</label>
        <SaccoPicker value={selectedSacco?.sacco_id} onChange={setSelectedSacco} />
      </div>

      <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-zinc-500 rounded-xl p-10 text-center cursor-pointer transition-colors">
        <input type="file" accept=".zip" ref={fileRef} className="hidden"
          onChange={(e) => { const f = e.target.files[0]; if (f) { setFile(f); setError(""); } }} />
        {file ? (
          <div className="flex items-center justify-center gap-3">
            <FileArchive className="w-6 h-6 text-zinc-400" />
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</p>
              <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); }} className="ml-2 text-gray-600 hover:text-red-400">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div>
            <Upload className="w-8 h-8 text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Drop your <span className="text-white font-medium">.zip</span> file here, or click to browse</p>
            <p className="text-xs text-gray-600 mt-1">Max 20 MB · CSVs at root level</p>
          </div>
        )}
      </div>

      {error && (
        <div className="flex gap-2 text-red-400 bg-red-900/20 border border-red-800/30 rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><p className="text-sm">{error}</p>
        </div>
      )}

      {validateReport && (
        <div className={`border rounded-xl p-4 space-y-3 ${validateReport.total_errors === 0 ? "bg-green-900/10 border-green-700/40" : "bg-amber-900/10 border-amber-700/40"}`}>
          <div className="flex items-center gap-2">
            {validateReport.total_errors === 0
              ? <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
              : <AlertCircle  className="w-5 h-5 text-amber-400 shrink-0" />}
            <div>
              <p className={`text-sm font-semibold ${validateReport.total_errors === 0 ? "text-green-300" : "text-amber-300"}`}>
                {validateReport.total_errors === 0 ? "Validation passed — ready to migrate" : `${validateReport.total_errors} error(s) found`}
              </p>
              {validateReport.total_warnings > 0 && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{validateReport.total_warnings} warning(s) — existing records will be skipped</p>
              )}
            </div>
            <button onClick={() => setValidateReport(null)} className="ml-auto text-gray-600 hover:text-gray-600 dark:text-gray-400"><X className="w-4 h-4" /></button>
          </div>
          <div className="space-y-1">
            {Object.entries(validateReport.sheets ?? {}).map(([sheet, r]) => {
              const hasIssues = r.errors?.length > 0 || r.warnings?.length > 0;
              return (
                <div key={sheet} className="text-xs">
                  <div className="flex items-center gap-2">
                    {!r.present ? (
                      <span className="text-gray-600 font-mono">{sheet} — not found</span>
                    ) : r.errors?.length > 0 ? (
                      <span className="text-red-400 font-mono">{sheet} · {r.rows} rows · {r.errors.length} error(s)</span>
                    ) : (
                      <span className="text-emerald-400 font-mono">{sheet} · {r.rows} rows ✓</span>
                    )}
                  </div>
                  {hasIssues && (
                    <div className="ml-4 mt-1 space-y-0.5">
                      {r.errors?.slice(0, 5).map((e, i) => <p key={i} className="text-red-300 bg-red-900/20 rounded px-2 py-0.5 font-mono">{e}</p>)}
                      {r.warnings?.slice(0, 3).map((w, i) => <p key={i} className="text-amber-300 bg-amber-900/20 rounded px-2 py-0.5 font-mono">{w}</p>)}
                      {(r.errors?.length ?? 0) > 5 && <p className="text-gray-500">…and {r.errors.length - 5} more errors</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Expected CSV files (all optional)</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
          {SHEETS.map((s) => <p key={s} className="text-xs text-gray-500 font-mono">{s}.csv</p>)}
        </div>
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={handleValidate} disabled={validating || !file || !saccoId}
          className="flex-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-700 border border-gray-300 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 dark:text-white font-medium py-3 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
          {validating ? <><Loader2 className="w-4 h-4 animate-spin" /> Validating…</> : <><CheckCircle2 className="w-4 h-4" /> Validate First</>}
        </button>
        <button type="submit" disabled={loading || !file || !saccoId}
          className="flex-1 bg-zinc-900 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing…</> : <><Upload className="w-4 h-4" /> Run Migration</>}
        </button>
      </div>
    </form>
  );
}

// ── Chart of Accounts migration tab ──────────────────────────────────────────

function CoaMigrateTab({ defaultSaccoId }) {
  const api      = useAdminAxios();
  const navigate = useNavigate();
  const fileRef  = useRef(null);
  const [selectedSacco, setSelectedSacco] = useState(defaultSaccoId ? { sacco_id: Number(defaultSaccoId), sacco_name: "" } : null);
  const [file,       setFile]       = useState(null);
  const [result,     setResult]     = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [coaStatus,  setCoaStatus]  = useState(null);   // { has_accounts, account_count, group_count }
  const [coaChecking, setCoaChecking] = useState(false);

  const [coaTree, setCoaTree] = useState([]);

  useEffect(() => {
    const id = selectedSacco?.sacco_id;
    if (!id) { setCoaStatus(null); setCoaTree([]); return; }
    setCoaChecking(true); setCoaStatus(null); setCoaTree([]);
    api.get(`/admin/onboard/coa?sacco_id=${id}`)
      .then(res => {
        const data = res.data?.data ?? null;
        setCoaStatus(data);
        setCoaTree(data?.coa ?? []);
      })
      .catch(() => { setCoaStatus(null); setCoaTree([]); })
      .finally(() => setCoaChecking(false));
  }, [selectedSacco?.sacco_id]); // eslint-disable-line react-hooks/exhaustive-deps

  const saccoId = selectedSacco?.sacco_id || "";

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f?.name.endsWith(".csv")) { setFile(f); setError(""); }
    else setError("Only .csv files are accepted.");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!saccoId) { setError("Select a SACCO."); return; }
    if (!file)    { setError("Select a CSV file."); return; }
    setLoading(true); setError(""); setResult(null);
    const form = new FormData();
    form.append("sacco_id", saccoId);
    form.append("file", file);
    try {
      const res = await api.post("/admin/onboard/coa", form, { headers: { "Content-Type": "multipart/form-data" } });
      setResult(res.data?.data ?? {});
      // Refresh the COA tree to show newly imported accounts
      api.get(`/admin/onboard/coa?sacco_id=${saccoId}`)
        .then(r => { const d = r.data?.data; if (d) { setCoaStatus(d); setCoaTree(d.coa ?? []); } })
        .catch(() => {});
    } catch (err) {
      const msg = err?.response?.data?.messages;
      setError(Array.isArray(msg) ? msg.join(", ") : (msg ?? "Upload failed."));
    } finally { setLoading(false); }
  };

  if (result) {
    const hasErrors   = result.errors?.length > 0;
    const hasWarnings = result.warnings?.length > 0;
    return (
      <div className="max-w-xl space-y-4">
        <div className={`border rounded-xl p-4 flex gap-3 ${hasErrors ? "bg-red-900/10 border-red-700/40" : "bg-green-900/10 border-green-700/40"}`}>
          {hasErrors
            ? <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            : <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />}
          <div>
            <p className={`font-semibold text-sm ${hasErrors ? "text-red-300" : "text-green-300"}`}>
              {hasErrors ? `Completed with ${result.errors.length} error(s)` : "Chart of Accounts imported successfully"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {result.created} account(s) created · {result.skipped} skipped
              {result.opening_balance_posted && " · Opening balance journal posted"}
            </p>
          </div>
        </div>

        {hasWarnings && (
          <div className="space-y-1">
            {result.warnings.map((w, i) => (
              <div key={i} className="flex gap-2 text-amber-300 bg-amber-900/20 border border-amber-700/30 rounded-lg px-3 py-2 text-xs">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />{w}
              </div>
            ))}
          </div>
        )}

        {hasErrors && (
          <div className="space-y-1">
            {result.errors.map((e, i) => (
              <p key={i} className="text-xs text-red-300 bg-red-900/20 border border-red-800/30 rounded-lg px-3 py-1.5 font-mono">{e}</p>
            ))}
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <button onClick={() => { setResult(null); setFile(null); }}
            className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            Upload Another
          </button>
          {saccoId && (
            <button type="button"
              onClick={() => navigate(`/admin/onboard?tab=defaults&sacco_id=${saccoId}`)}
              className="flex-1 bg-zinc-900 hover:bg-zinc-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
              Set Defaults →
            </button>
          )}
        </div>

        {coaTree.length > 0 && <CoaTree coa={coaTree} />}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-5">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-3">
        <div className="flex items-start gap-3">
          <BookOpen className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <p>Upload a single CSV with these columns:</p>
            <p className="font-mono text-xs text-gray-500">group_title, group_code, sub_group_title, sub_group_code, account_name, account_code, debit, credit</p>
            <p className="text-xs">The <span className="text-white">debit</span> and <span className="text-white">credit</span> columns are optional — include them only if you have opening balances.</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-3">
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">SACCO *</label>
        <SaccoPicker value={selectedSacco?.sacco_id} onChange={setSelectedSacco} />
        {coaChecking && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking existing accounts…
          </div>
        )}
        {!coaChecking && coaStatus?.has_accounts && (
          <div className="flex items-start gap-2 text-xs bg-amber-900/20 border border-amber-700/30 rounded-lg px-3 py-2 text-amber-300">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              This SACCO already has <strong>{coaStatus.account_count}</strong> account(s) across <strong>{coaStatus.group_count}</strong> group(s).
              Uploading will add new accounts and skip any that already exist.
            </span>
          </div>
        )}
        {!coaChecking && coaStatus && !coaStatus.has_accounts && (
          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> No existing chart of accounts — ready for first import.
          </div>
        )}
      </div>

      <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-zinc-500 rounded-xl p-10 text-center cursor-pointer transition-colors">
        <input type="file" accept=".csv" ref={fileRef} className="hidden"
          onChange={(e) => { const f = e.target.files[0]; if (f) { setFile(f); setError(""); } }} />
        {file ? (
          <div className="flex items-center justify-center gap-3">
            <FileSpreadsheet className="w-6 h-6 text-zinc-400" />
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</p>
              <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); }} className="ml-2 text-gray-600 hover:text-red-400">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div>
            <FileSpreadsheet className="w-8 h-8 text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Drop your <span className="text-white font-medium">.csv</span> file here, or click to browse</p>
            <p className="text-xs text-gray-600 mt-1">Max 10 MB</p>
          </div>
        )}
      </div>

      {error && (
        <div className="flex gap-2 text-red-400 bg-red-900/20 border border-red-800/30 rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><p className="text-sm">{error}</p>
        </div>
      )}

      <button type="submit" disabled={loading || !file || !saccoId}
        className="w-full bg-zinc-900 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Importing…</> : <><Upload className="w-4 h-4" /> Import Chart of Accounts</>}
      </button>

      {coaTree.length > 0 && <CoaTree coa={coaTree} />}
    </form>
  );
}

// ── SACCO Defaults tab ────────────────────────────────────────────────────────

const DEFAULTS_FIELDS = [
  { key: "share_account",               label: "Share Capital Account",         group: "Shares" },
  { key: "member_saving_account",        label: "Member Savings Account",        group: "Savings" },
  { key: "ussd_savings_till",            label: "USSD Savings Till Account",     group: "Savings" },
  { key: "frozen_funds_account",         label: "Frozen Funds Account",          group: "Savings" },
  { key: "disbursment_account",          label: "Loan Disbursement Account",     group: "Loans" },
  { key: "interest_account",             label: "Loan Interest Income Account",  group: "Loans" },
  { key: "interest_receivable_account",  label: "Interest Receivable Account",   group: "Loans" },
  { key: "penalty_account",              label: "Loan Penalty Income Account",   group: "Loans" },
  { key: "penalty_receivable_account",   label: "Penalty Receivable Account",    group: "Loans" },
  { key: "bad_loans_account",            label: "Bad Loans / Provision Account", group: "Loans" },
  { key: "writeoff_income_account",      label: "Write-off Income Account",      group: "Write-offs" },
  { key: "writeoff_expense_account",     label: "Write-off Expense Account",     group: "Write-offs" },
  { key: "transfer_clearing_account",    label: "Transfer Clearing Account",     group: "Other" },
  { key: "default_capital_account",      label: "Capital / Equity Account",      group: "Other" },
  { key: "monitoring_fees_account",      label: "Monitoring Fees Account",       group: "Other" },
];

const EMPTY_DEFAULTS = () => ({
  currency: "UGX", share_price: "",
  ...Object.fromEntries(DEFAULTS_FIELDS.map((f) => [f.key, null])),
});

// Searchable account combobox
function AccountCombobox({ accounts, value, onChange, onQuickAdd }) {
  const [open,  setOpen]  = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);

  const selected = accounts.find((a) => a.id === value) ?? null;

  const filtered = query.trim()
    ? accounts.filter((a) =>
        (a.code + " " + a.title).toLowerCase().includes(query.toLowerCase())
      )
    : accounts;

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const pick = (a) => { onChange(a.id); setOpen(false); setQuery(""); };
  const clear = (e) => { e.stopPropagation(); onChange(null); setQuery(""); };

  return (
    <div ref={ref} className="relative">
      <div
        className={`${cls} flex items-center justify-between cursor-pointer pr-8`}
        onClick={() => { setOpen((o) => !o); setQuery(""); }}
      >
        {selected
          ? <span className="truncate text-gray-900 dark:text-white">{selected.code} — {selected.title}</span>
          : <span className="text-gray-500">— Select account —</span>}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {selected && (
            <button type="button" onClick={clear} className="text-gray-500 hover:text-red-400 p-0.5">
              <X className="w-3 h-3" />
            </button>
          )}
          <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-700">
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search code or title…"
              className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
              onClick={(e) => e.stopPropagation()}
            />
            {query && <button type="button" onClick={() => setQuery("")}><X className="w-3.5 h-3.5 text-gray-500" /></button>}
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0
              ? <p className="text-xs text-gray-500 px-3 py-2">No match</p>
              : filtered.map((a) => (
                <button key={a.id} type="button"
                  onClick={() => pick(a)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-zinc-700/60 flex items-center gap-2 ${a.id === value ? "bg-zinc-700/50 text-zinc-300" : "text-gray-200"}`}>
                  <span className="text-gray-500 font-mono text-xs w-16 shrink-0 truncate">{a.code}</span>
                  <span className="truncate">{a.title}</span>
                </button>
              ))}
          </div>
          {onQuickAdd && (
            <div className="border-t border-gray-700 px-3 py-2">
              <button type="button" onClick={() => { setOpen(false); onQuickAdd(); }}
                className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-300">
                <Plus className="w-3.5 h-3.5" /> Quick-add new account
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Quick-add account modal
function QuickAddAccountModal({ saccoId, coa, api, onCreated, onClose }) {
  const [groupId,    setGroupId]    = useState("");
  const [subGroupId, setSubGroupId] = useState("");
  const [title,      setTitle]      = useState("");
  const [code,       setCode]       = useState("");
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState("");

  const groups    = coa ?? [];
  const subGroups = groups.find((g) => g.id === Number(groupId))?.sub_groups ?? [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subGroupId) { setError("Select a sub-group."); return; }
    if (!title.trim()) { setError("Account title is required."); return; }
    if (!code.trim())  { setError("Account code is required."); return; }
    setSaving(true); setError("");
    try {
      const res = await api.post("/admin/onboard/account", {
        sacco_id: saccoId, sub_group_id: Number(subGroupId), title: title.trim(), code: code.trim(),
      });
      onCreated(res.data?.data?.account);
    } catch (err) {
      const msg = err?.response?.data?.messages;
      setError(Array.isArray(msg) ? msg.join(", ") : (msg ?? "Failed to create account."));
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h3 className="text-sm font-semibold text-white">Quick-Add Account</h3>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <Field label="Account Group" required>
            <select value={groupId} onChange={(e) => { setGroupId(e.target.value); setSubGroupId(""); }} className={cls}>
              <option value="">— Select group —</option>
              {groups.map((g) => <option key={g.id} value={g.id}>{g.code} — {g.title}</option>)}
            </select>
          </Field>
          <Field label="Sub-Group" required>
            <select value={subGroupId} onChange={(e) => setSubGroupId(e.target.value)} className={cls} disabled={!groupId}>
              <option value="">— Select sub-group —</option>
              {subGroups.map((sg) => <option key={sg.id} value={sg.id}>{sg.code} — {sg.title}</option>)}
            </select>
          </Field>
          <Field label="Account Title" required>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Cash in Hand" />
          </Field>
          <Field label="Account Code" required>
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. 1001" />
          </Field>
          {error && (
            <div className="flex gap-2 text-red-400 bg-red-900/20 border border-red-800/30 rounded-lg px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /><p className="text-xs">{error}</p>
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-gray-700 text-sm text-gray-400 hover:text-white transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 bg-zinc-900 hover:bg-zinc-700 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
              {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</> : "Create Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Inline COA tree view
function CoaTree({ coa }) {
  const [openGroups, setOpenGroups] = useState({});
  const [openSubs,   setOpenSubs]   = useState({});
  const [query,      setQuery]      = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return coa;
    const q = query.toLowerCase();
    return coa
      .map((g) => {
        const gMatch = g.title.toLowerCase().includes(q) || g.code.toLowerCase().includes(q);
        const subs = g.sub_groups
          .map((sg) => {
            const sgMatch = sg.title.toLowerCase().includes(q) || sg.code.toLowerCase().includes(q);
            const accs = sg.accounts.filter((a) => a.title.toLowerCase().includes(q) || a.code.toLowerCase().includes(q));
            return (sgMatch || accs.length > 0) ? { ...sg, accounts: sgMatch ? sg.accounts : accs } : null;
          })
          .filter(Boolean);
        return (gMatch || subs.length > 0) ? { ...g, sub_groups: gMatch ? g.sub_groups : subs } : null;
      })
      .filter(Boolean);
  }, [coa, query]);

  const totalAccounts = coa.reduce((s, g) => s + g.sub_groups.reduce((ss, sg) => ss + sg.accounts.length, 0), 0);

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-zinc-400" />
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Chart of Accounts</span>
          <span className="text-xs text-gray-500 ml-1">{totalAccounts} accounts</span>
        </div>
        <div className="relative">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className="bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md pl-7 pr-3 py-1 text-xs text-gray-900 dark:text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-zinc-500 w-44"
          />
          <input className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" style={{display:"none"}} />
          <svg className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" /></svg>
          {query && <button type="button" onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"><X className="w-3 h-3" /></button>}
        </div>
      </div>
      <div className="max-h-96 overflow-y-auto divide-y divide-gray-200 dark:divide-gray-800">
        {filtered.length === 0
          ? <p className="text-xs text-gray-500 px-5 py-4">No accounts match your search.</p>
          : filtered.map((g) => {
            const gOpen = openGroups[g.id];
            return (
              <div key={g.id}>
                <button type="button"
                  onClick={() => setOpenGroups((p) => ({ ...p, [g.id]: !p[g.id] }))}
                  className="w-full flex items-center gap-2 px-5 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 text-left">
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-500 shrink-0 transition-transform ${gOpen ? "" : "-rotate-90"}`} />
                  <span className="text-xs font-semibold text-gray-900 dark:text-white">{g.title}</span>
                  <span className="text-xs text-gray-500 font-mono ml-1">({g.code})</span>
                </button>
                {gOpen && g.sub_groups.map((sg) => {
                  const sgOpen = openSubs[sg.id];
                  return (
                    <div key={sg.id} className="bg-gray-50 dark:bg-gray-800/30">
                      <button type="button"
                        onClick={() => setOpenSubs((p) => ({ ...p, [sg.id]: !p[sg.id] }))}
                        className="w-full flex items-center gap-2 pl-10 pr-5 py-2 hover:bg-gray-100 dark:hover:bg-gray-800/60 text-left">
                        <ChevronDown className={`w-3 h-3 text-gray-500 shrink-0 transition-transform ${sgOpen ? "" : "-rotate-90"}`} />
                        <span className="text-xs text-gray-700 dark:text-gray-300">{sg.title}</span>
                        <span className="text-xs text-gray-500 font-mono ml-1">({sg.code})</span>
                        <span className="ml-auto text-xs text-gray-500">{sg.accounts.length}</span>
                      </button>
                      {sgOpen && sg.accounts.map((a) => (
                        <div key={a.id} className="flex items-center gap-2 pl-16 pr-5 py-1.5 border-t border-gray-200 dark:border-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800/40">
                          <span className="text-xs font-mono text-gray-500 w-20 shrink-0">{a.code}</span>
                          <span className="text-xs text-gray-700 dark:text-gray-300 truncate">{a.title}</span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            );
          })}
      </div>
    </div>
  );
}

function DefaultsTab({ defaultSaccoId }) {
  const api = useAdminAxios();
  const [selectedSacco, setSelectedSacco] = useState(defaultSaccoId ? { sacco_id: Number(defaultSaccoId), sacco_name: "" } : null);
  const [accounts,   setAccounts]   = useState([]);
  const [coa,        setCoa]        = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState("");
  const [success,    setSuccess]    = useState("");
  const [form,       setForm]       = useState(EMPTY_DEFAULTS);
  const [addModal,   setAddModal]   = useState(false);
  const [pendingKey, setPendingKey] = useState(null);

  const saccoId = selectedSacco?.sacco_id;

  const loadData = (id) => {
    setLoading(true); setError(""); setSuccess("");
    api.get(`/admin/onboard/defaults?sacco_id=${id}`)
      .then((res) => {
        const { accounts: accs, defaults: defs, coa: tree } = res.data?.data ?? {};
        setAccounts(accs ?? []);
        setCoa(tree ?? []);
        if (defs) {
          setForm({
            currency:    defs.currency    ?? "UGX",
            share_price: defs.share_price ?? "",
            ...Object.fromEntries(DEFAULTS_FIELDS.map((f) => [f.key, defs[f.key]?.id ?? null])),
          });
        } else {
          setForm(EMPTY_DEFAULTS());
        }
      })
      .catch(() => setError("Failed to load accounts. Check the SACCO selection and retry."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!saccoId) { setAccounts([]); setCoa([]); return; }
    loadData(saccoId);
  }, [saccoId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!saccoId) { setError("Select a SACCO first."); return; }
    setSaving(true); setError(""); setSuccess("");
    try {
      await api.post("/admin/onboard/defaults", { sacco_id: saccoId, ...form });
      setSuccess("Defaults saved successfully.");
    } catch (err) {
      const msg = err?.response?.data?.messages;
      setError(Array.isArray(msg) ? msg.join(", ") : (msg ?? "Failed to save defaults."));
    } finally { setSaving(false); }
  };

  const handleQuickAdd = (fieldKey) => { setPendingKey(fieldKey); setAddModal(true); };

  const handleAccountCreated = (account) => {
    setAddModal(false);
    const newAcc = { id: account.id, title: account.title, code: account.code };
    setAccounts((prev) => [...prev, newAcc].sort((a, b) => a.code.localeCompare(b.code)));
    if (pendingKey) setForm((f) => ({ ...f, [pendingKey]: account.id }));
    setPendingKey(null);
    loadData(saccoId);
  };

  const fieldGroups = [...new Set(DEFAULTS_FIELDS.map((f) => f.group))];

  return (
    <>
      {addModal && (
        <QuickAddAccountModal
          saccoId={saccoId}
          coa={coa}
          api={api}
          onCreated={handleAccountCreated}
          onClose={() => { setAddModal(false); setPendingKey(null); }}
        />
      )}

      <div className="max-w-2xl space-y-5">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-3">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">SACCO *</label>
          <SaccoPicker value={saccoId} onChange={setSelectedSacco} />
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading accounts…
          </div>
        )}

        {!loading && saccoId && accounts.length === 0 && (
          <div className="flex items-start gap-2 text-sm text-amber-300 bg-amber-900/20 border border-amber-700/30 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            No accounts found for this SACCO. Upload the Chart of Accounts first.
          </div>
        )}

        {!loading && saccoId && accounts.length > 0 && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">General</p>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Currency">
                  <Input
                    value={form.currency}
                    onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                    placeholder="e.g. UGX"
                    maxLength={8}
                  />
                </Field>
                <Field label="Default Share Price">
                  <Input
                    type="number" step="0.01" min="0"
                    value={form.share_price}
                    onChange={(e) => setForm((f) => ({ ...f, share_price: e.target.value }))}
                    placeholder="0.00"
                  />
                </Field>
              </div>
            </div>

            {fieldGroups.map((group) => (
              <div key={group} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{group}</p>
                <div className="space-y-3">
                  {DEFAULTS_FIELDS.filter((f) => f.group === group).map(({ key, label }) => (
                    <Field key={key} label={label}>
                      <AccountCombobox
                        accounts={accounts}
                        value={form[key]}
                        onChange={(v) => setForm((f) => ({ ...f, [key]: v }))}
                        onQuickAdd={() => handleQuickAdd(key)}
                      />
                    </Field>
                  ))}
                </div>
              </div>
            ))}

            {error && (
              <div className="flex gap-2 text-red-400 bg-red-900/20 border border-red-800/30 rounded-lg px-4 py-3">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><p className="text-sm">{error}</p>
              </div>
            )}
            {success && (
              <div className="flex gap-2 text-emerald-400 bg-emerald-900/20 border border-emerald-700/30 rounded-lg px-4 py-3">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /><p className="text-sm">{success}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button type="button" onClick={() => setAddModal(true)}
                className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Account
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 bg-zinc-900 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : "Save Defaults"}
              </button>
            </div>
          </form>
        )}

      </div>
    </>
  );
}

// ── Notifications tab ─────────────────────────────────────────────────────────

// Available SMS template variables — shown as instructions to the admin
const SMS_VARS = [
  { key: "{firstName}",    desc: "Member's first name" },
  { key: "{lastName}",     desc: "Member's last name" },
  { key: "{saccoName}",    desc: "Name of the SACCO" },
  { key: "{accountNumber}",desc: "Member's account number" },
  { key: "{amountPaid}",   desc: "Transaction amount (UGX)" },
  { key: "{accountBalance}",desc:"Account balance after transaction" },
  { key: "{loanBalance}",  desc: "Outstanding loan balance" },
  { key: "{loanAmount}",   desc: "Loan principal amount" },
  { key: "{loanNumber}",   desc: "Loan reference number" },
  { key: "{shareBalance}", desc: "Shares/equity balance" },
  { key: "{savingProduct}",desc: "Savings product name" },
  { key: "{transactionId}",desc: "Unique transaction ID" },
  { key: "{timeStamp}",    desc: "Date and time of the event" },
];

const MESSAGE_META = {
  welcome_message:                  { label: "Welcome / Registration",       hint: "Sent when a new member registers." },
  shares_account_creation:          { label: "Shares Account Created",       hint: "Sent when a shares account is opened." },
  savings_withdraw:                  { label: "Savings Withdrawal",           hint: "Sent on savings withdrawal." },
  savings_deposit:                   { label: "Savings Deposit",              hint: "Sent on savings deposit." },
  savings_account_transaction:       { label: "Savings Transaction",          hint: "Catch-all for any savings debit or credit." },
  savings_account_creation:          { label: "Savings Account Created",      hint: "Sent when a savings account is opened." },
  loan_reminder_before:              { label: "Loan Reminder (Before Due)",   hint: "Reminder before loan repayment is due." },
  loan_defaulters:                   { label: "Loan Defaulters",              hint: "Alert when loan is overdue." },
  loan_approve_notification:         { label: "Loan Approved",                hint: "Sent when a loan is approved and disbursed." },
  loan_processing_notifications:     { label: "Loan Processing",              hint: "Sent while a loan application is under review." },
  loan_rejecting_notification:       { label: "Loan Rejected",                hint: "Sent when a loan application is rejected." },
  loan_guarantors:                   { label: "Loan Guarantors",              hint: "Reminder sent to loan guarantors." },
  account_transfer_out:              { label: "Transfer Out",                 hint: "Sent when funds leave via inter-account transfer." },
  account_transfer_in:               { label: "Transfer In",                  hint: "Sent when funds arrive via inter-account transfer." },
  account_charge:                    { label: "Account Charge",               hint: "Sent when a fee is applied to an account." },
  fixed_deposit_notifications:       { label: "Fixed Deposit",                hint: "Sent for fixed deposit events (creation, maturity)." },
  loan_applications_notifications:   { label: "Loan Application Submitted",   hint: "Sent when a loan application is submitted." },
  loan_disbursement_notifications:   { label: "Loan Disbursement",            hint: "Sent when loan funds are disbursed." },
  loan_repayment_notifications:      { label: "Loan Repayment",               hint: "Sent when a repayment instalment is recorded." },
  other_message:                     { label: "Other",                        hint: "Custom message for miscellaneous notifications." },
};

const STANDARD_TRIGGERS = [
  { identifier: "savings_withdraws",              name: "Savings Withdraws",                desc: "Fires when a savings withdrawal transaction is posted." },
  { identifier: "savings_deposit",                name: "Savings Deposit",                  desc: "Fires when a deposit is posted to a savings account." },
  { identifier: "member_account_opening",         name: "Member Registration",              desc: "Fires when a new member account is created." },
  { identifier: "on_transfer_in",                 name: "Transfer In Notification",         desc: "Fires when funds are received via an inter-account transfer." },
  { identifier: "on_transfer_out",                name: "Transfer Out",                     desc: "Fires when funds are sent via an inter-account transfer." },
  { identifier: "savings_product_creation",       name: "Savings Product Creation",         desc: "Fires when a new savings product is created in the system." },
  { identifier: "account_charge",                 name: "Account Charge",                   desc: "Fires when a fee or penalty charge is applied to an account." },
  { identifier: "fixed_deposit_notifications",    name: "Fixed Deposit Notifications",      desc: "Fires for fixed deposit events such as creation or maturity." },
  { identifier: "loan_applications_notifications",name: "Loan Applications Notifications",  desc: "Fires on any loan application status change." },
  { identifier: "loan_disbursement_notifications",name: "Loan Disbursement Notifications",  desc: "Fires when a loan disbursement is processed." },
  { identifier: "loan_repayment_notifications",   name: "Loan Repayment Notifications",     desc: "Fires when a loan repayment instalment is recorded." },
  { identifier: "loan_application_submitted",     name: "Loan Application Submitted",       desc: "Fires as soon as a loan application is submitted by a member." },
  { identifier: "loan_pending_first_approval",    name: "Loan Pending First Approval",      desc: "Fires when a loan moves to the first-approval queue." },
  { identifier: "loan_first_approved",            name: "Loan First Approved",              desc: "Fires when the first approver approves a loan application." },
  { identifier: "loan_pending_second_approval",   name: "Loan Pending Second Approval",     desc: "Fires when a loan moves to the second-approval queue." },
  { identifier: "loan_second_approved",           name: "Loan Second Approved",             desc: "Fires when the second approver approves a loan application." },
  { identifier: "loan_pending_final_approval",    name: "Loan Pending Final Approval",      desc: "Fires when a loan moves to the final-approval queue." },
  { identifier: "loan_final_approved",            name: "Loan Final Approved",              desc: "Fires when the final approver signs off on a loan." },
  { identifier: "loan_rejected",                  name: "Loan Rejected",                    desc: "Fires when a loan application is rejected at any stage." },
  { identifier: "loan_sent_back_for_correction",  name: "Loan Sent Back for Correction",    desc: "Fires when a loan is returned to the applicant for corrections." },
  { identifier: "loan_ready_for_disbursement",    name: "Loan Ready for Disbursement",      desc: "Fires when a fully-approved loan is queued for disbursement." },
  { identifier: "loan_disbursed",                 name: "Loan Disbursed",                   desc: "Fires when the disbursement officer marks the loan as disbursed." },
];

function NotificationsTab({ defaultSaccoId }) {
  const api = useAdminAxios();
  const [selectedSacco, setSelectedSacco] = useState(
    defaultSaccoId ? { sacco_id: Number(defaultSaccoId), sacco_name: "" } : null
  );
  const [triggers,      setTriggers]      = useState([]);
  const [messages,      setMessages]      = useState({});
  const [loading,       setLoading]       = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [seeding,       setSeeding]       = useState(false);
  const [togglingId,    setTogglingId]    = useState(null);
  const [addingId,      setAddingId]      = useState(null); // identifier string while adding
  const [error,         setError]         = useState("");
  const [success,       setSuccess]       = useState("");

  const saccoId = selectedSacco?.sacco_id;

  const applyData = (data) => {
    setTriggers(data.triggers ?? []);
    const msgs = data.messages ?? {};
    setMessages(Object.fromEntries(Object.keys(MESSAGE_META).map((k) => [k, msgs[k] ?? ""])));
  };

  const loadData = (id) => {
    setLoading(true); setError(""); setSuccess("");
    api.get(`/admin/onboard/notifications?sacco_id=${id}`)
      .then((res) => applyData(res.data?.data ?? {}))
      .catch(() => setError("Failed to load notification settings."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!saccoId) { setTriggers([]); setMessages({}); return; }
    loadData(saccoId);
  }, [saccoId]); // eslint-disable-line react-hooks/exhaustive-deps

  const seedDefaults = async () => {
    setSeeding(true); setError(""); setSuccess("");
    try {
      const res = await api.post("/admin/onboard/notifications", { sacco_id: saccoId, action: "create" });
      applyData(res.data?.data ?? {});
      setSuccess(res.data?.messages?.[0] ?? "Notifications created.");
    } catch {
      setError("Failed to create notifications.");
    } finally {
      setSeeding(false);
    }
  };

  const toggleTrigger = async (trigger) => {
    const newStatus = trigger.status === "Active" ? "Inactive" : "Active";
    setTogglingId(trigger.id);
    try {
      await api.post("/admin/onboard/notifications", {
        sacco_id:   saccoId,
        trigger_id: trigger.id,
        status:     newStatus,
      });
      setTriggers((prev) =>
        prev.map((t) => (t.id === trigger.id ? { ...t, status: newStatus } : t))
      );
    } catch {
      setError("Failed to update trigger.");
    } finally {
      setTogglingId(null);
    }
  };

  const addTrigger = async (std) => {
    setAddingId(std.identifier); setError("");
    try {
      const res = await api.post("/admin/onboard/notifications", {
        sacco_id:   saccoId,
        action:     "add_trigger",
        identifier: std.identifier,
        name:       std.name,
      });
      setTriggers((prev) => [...prev, res.data?.data]);
      setSuccess(`"${std.name}" trigger added.`);
    } catch {
      setError(`Failed to add trigger "${std.name}".`);
    } finally {
      setAddingId(null);
    }
  };

  const saveMessages = async (e) => {
    e.preventDefault();
    if (!saccoId) { setError("Select a SACCO first."); return; }
    setSaving(true); setError(""); setSuccess("");
    try {
      await api.post("/admin/onboard/notifications", { sacco_id: saccoId, messages });
      setSuccess("Message templates saved.");
    } catch {
      setError("Failed to save message templates.");
    } finally {
      setSaving(false);
    }
  };


  return (
    <div className="space-y-6">

      {/* Instructions */}
      <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-700 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">How notifications work</h2>
        <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400 list-disc list-inside">
          <li><strong>Triggers</strong> control which system events fire an SMS. Toggle each one on or off per SACCO.</li>
          <li><strong>Message templates</strong> are the actual SMS text sent for each event. Leave a template blank to use the global system default.</li>
          <li>When setting up a new SACCO with no triggers yet, click <strong>Create All Notifications</strong> to add all 22 standard triggers at once.</li>
          <li>Changes to triggers take effect immediately. Message templates are saved as a batch when you click <em>Save Templates</em>.</li>
        </ul>
      </div>

      {/* SACCO picker */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Select SACCO</h2>
        <SaccoPicker value={saccoId} onChange={setSelectedSacco} />
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-300">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> {success}
        </div>
      )}

      {saccoId && loading && (
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading notification settings…
        </div>
      )}

      {saccoId && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Triggers */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
            {(() => {
              const existingIds = new Set(triggers.map((t) => t.identifier));
              const missingCount = STANDARD_TRIGGERS.filter((s) => !existingIds.has(s.identifier)).length;
              const activeCount  = triggers.filter((t) => t.status === "Active").length;
              return (
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">Notification Triggers</h2>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {missingCount > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium">
                        <AlertCircle className="w-3 h-3" /> {missingCount} missing
                      </span>
                    )}
                    <span className="text-xs text-gray-400">{activeCount}/{triggers.length} active</span>
                  </div>
                </div>
              );
            })()}
            <p className="text-xs text-gray-500 mb-1">Toggle events on/off. Missing triggers haven't been created yet — click <strong>Add</strong> to enable them.</p>

            {triggers.length === 0 && (
              <div className="my-3">
                <button
                  type="button"
                  disabled={seeding}
                  onClick={seedDefaults}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-60"
                >
                  {seeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Create All Notifications
                </button>
              </div>
            )}

            <ul className="mt-3 space-y-0 divide-y divide-gray-100 dark:divide-gray-800">
              {STANDARD_TRIGGERS.map((std) => {
                const existing = triggers.find((t) => t.identifier === std.identifier);
                const missing  = !existing;
                const active   = existing?.status === "Active";
                const toggling = togglingId === existing?.id;
                const adding   = addingId === std.identifier;
                return (
                  <li key={std.identifier}
                    className={`flex items-start justify-between gap-3 py-3 ${missing ? "opacity-60" : ""}`}>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{std.name}</p>
                        {missing && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                            missing
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{std.desc}</p>
                    </div>
                    {missing ? (
                      <button
                        type="button"
                        disabled={adding}
                        onClick={() => addTrigger(std)}
                        className="shrink-0 mt-0.5 flex items-center gap-1 px-2.5 py-1 rounded-md border border-zinc-300 dark:border-zinc-600 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                      >
                        {adding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                        Add
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={toggling}
                        onClick={() => toggleTrigger(existing)}
                        title={active ? "Click to disable" : "Click to enable"}
                        className={`relative mt-0.5 inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                          active ? "bg-zinc-900" : "bg-gray-300 dark:bg-gray-600"
                        } ${toggling ? "opacity-50" : ""}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${active ? "translate-x-4" : "translate-x-0"}`} />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Message templates */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
            {(() => {
              const total   = Object.keys(MESSAGE_META).length;
              const missing = Object.keys(MESSAGE_META).filter((k) => !messages[k]).length;
              const filled  = total - missing;
              return (
                <div className="flex items-start justify-between mb-1 gap-2">
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">SMS Message Templates</h2>
                  {missing > 0 ? (
                    <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium">
                      <AlertCircle className="w-3 h-3" /> {missing} missing
                    </span>
                  ) : (
                    <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium">
                      <CheckCircle2 className="w-3 h-3" /> {filled}/{total} set
                    </span>
                  )}
                </div>
              );
            })()}
            <p className="text-xs text-gray-500 mb-3">Fields marked <span className="text-amber-600 font-medium">missing</span> have no custom template — the system default will be used until you add one.</p>

            {/* Dynamic variable reference */}
            <div className="mb-5 p-3 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-700 rounded-lg">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Available dynamic variables</p>
              <div className="flex flex-wrap gap-1.5">
                {SMS_VARS.map(({ key, desc }) => (
                  <span key={key} title={desc} className="inline-flex items-center px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-xs font-mono text-zinc-800 dark:text-zinc-200 cursor-default">
                    {key}
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">Hover a variable to see what it inserts. Paste directly into any template below.</p>
            </div>

            <form onSubmit={saveMessages} className="space-y-4">
              {Object.entries(MESSAGE_META).map(([key, { label, hint }]) => {
                const empty = !messages[key];
                return (
                  <div key={key} className={`rounded-lg p-3 -mx-1 ${empty ? "bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40" : ""}`}>
                    <div className="flex items-center gap-2 mb-1.5">
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-400">{label}</label>
                      {empty
                        ? <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">· missing</span>
                        : <span className="text-xs text-green-600 dark:text-green-400">· set</span>
                      }
                    </div>
                    {hint && <p className="text-xs text-gray-500 mb-1.5">{hint}</p>}
                    <Textarea
                      value={messages[key] ?? ""}
                      onChange={(e) => setMessages((prev) => ({ ...prev, [key]: e.target.value }))}
                      placeholder="Type your custom template here…"
                      rows={2}
                    />
                  </div>
                );
              })}
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Save Templates
              </button>
            </form>
          </div>

        </div>
      )}
    </div>
  );
}

// ── Products & Vendors tab ────────────────────────────────────────────────────

const EMPTY_VENDOR       = () => ({ firstname: "", lastname: "", email: "", contact: "", company: "", address: "" });
const EMPTY_LOAN = () => ({
  title: "", code: "",
  loan_type: "fixed", interval: "monthly",
  interest_rate: "", interest_rate_type: "per_period",
  penalty_interval: "daily", penalty_amount: "", penalty_mode: "value", penalty_basis: "principal",
  penalty_offset_period: "0", penalty_offset_interval: "",
  grace_period: "0", grace_interval: "",
  monitoring_fee_enabled: "0", monitoring_fee_type: "fixed", monitoring_fee_value: "", monitoring_fee_base: "principal",
});
const EMPTY_SAVINGS      = () => ({ title: "", code: "", min_balance: "", min_deposit: "", max_deposit: "", min_withdraw: "", max_withdraw: "" });

function ProductsTab({ defaultSaccoId }) {
  const api = useAdminAxios();
  const [selectedSacco, setSelectedSacco] = useState(
    defaultSaccoId ? { sacco_id: Number(defaultSaccoId), sacco_name: "" } : null
  );
  const [vendors,         setVendors]         = useState([]);
  const [loanProducts,    setLoanProducts]    = useState([]);
  const [savingsProducts, setSavingsProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving,  setSaving]  = useState(null); // 'vendor'|'loan_product'|'savings_product'|null
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");

  const [showVendorForm,   setShowVendorForm]   = useState(false);
  const [showLoanForm,     setShowLoanForm]     = useState(false);
  const [showSavingsForm,  setShowSavingsForm]  = useState(false);
  const [vendorForm,   setVendorForm]   = useState(EMPTY_VENDOR);
  const [loanForm,     setLoanForm]     = useState(EMPTY_LOAN);
  const [savingsForm,  setSavingsForm]  = useState(EMPTY_SAVINGS);

  const [editingVendorId,  setEditingVendorId]  = useState(null);
  const [editingLoanId,    setEditingLoanId]    = useState(null);
  const [editingSavingsId, setEditingSavingsId] = useState(null);
  const [vendorEditForm,   setVendorEditForm]   = useState({});
  const [loanEditForm,     setLoanEditForm]     = useState({});
  const [savingsEditForm,  setSavingsEditForm]  = useState({});

  const saccoId = selectedSacco?.sacco_id;

  const loadData = (id) => {
    setLoading(true); setError(""); setSuccess("");
    api.get(`/admin/onboard/products?sacco_id=${id}`)
      .then((res) => {
        const d = res.data?.data ?? {};
        setVendors(d.vendors ?? []);
        setLoanProducts(d.loan_products ?? []);
        setSavingsProducts(d.savings_products ?? []);
      })
      .catch(() => setError("Failed to load products."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!saccoId) { setVendors([]); setLoanProducts([]); setSavingsProducts([]); return; }
    loadData(saccoId);
  }, [saccoId]); // eslint-disable-line react-hooks/exhaustive-deps

  const startEditVendor = (v) => {
    setEditingVendorId(v.id);
    setVendorEditForm({ firstname: v.firstname, lastname: v.lastname, contact: v.contact, email: v.email || "", company: v.company || "", address: v.address || "" });
  };

  const startEditLoan = (p) => {
    setEditingLoanId(p.id);
    setLoanEditForm({
      title: p.title, code: p.code || "",
      loan_type: p.type, interval: p.interval,
      interest_rate: String(p.interest_rate), interest_rate_type: p.interest_rate_type,
      penalty_interval: p.penalty_interval, penalty_amount: String(p.penalty_amount),
      penalty_mode: p.penalty_mode, penalty_basis: p.penalty_basis || "principal",
      penalty_offset_period: String(p.penalty_offset_period ?? 0), penalty_offset_interval: p.penalty_offset_interval || "",
      grace_period: String(p.grace_period ?? 0), grace_interval: p.grace_interval || "",
      monitoring_fee_enabled: p.monitoring_fee_enabled ? "1" : "0",
      monitoring_fee_type: p.monitoring_fee_type || "fixed",
      monitoring_fee_value: p.monitoring_fee_value != null ? String(p.monitoring_fee_value) : "",
      monitoring_fee_base: p.monitoring_fee_base || "principal",
    });
  };

  const startEditSavings = (p) => {
    setEditingSavingsId(p.id);
    setSavingsEditForm({ title: p.title, code: p.code, min_balance: String(p.min_balance), min_deposit: String(p.min_deposit), max_deposit: String(p.max_deposit), min_withdraw: String(p.min_withdraw), max_withdraw: String(p.max_withdraw) });
  };

  const submitEdit = async (type, id, formData, clearEdit) => {
    setSaving(type); setError(""); setSuccess("");
    try {
      const res = await api.put("/admin/onboard/products", { sacco_id: saccoId, type, id, ...formData });
      const d = res.data?.data ?? {};
      setVendors(d.vendors ?? []);
      setLoanProducts(d.loan_products ?? []);
      setSavingsProducts(d.savings_products ?? []);
      setSuccess(res.data?.messages?.[0] ?? "Updated.");
      clearEdit();
    } catch (e) {
      setError(e?.response?.data?.messages?.[0] ?? "Failed to update.");
    } finally {
      setSaving(null);
    }
  };

  const submit = async (type, formData, resetFn, hideFn) => {
    setSaving(type); setError(""); setSuccess("");
    try {
      const res = await api.post("/admin/onboard/products", { sacco_id: saccoId, type, ...formData });
      const d = res.data?.data ?? {};
      setVendors(d.vendors ?? []);
      setLoanProducts(d.loan_products ?? []);
      setSavingsProducts(d.savings_products ?? []);
      setSuccess(res.data?.messages?.[0] ?? "Saved.");
      resetFn(); hideFn(false);
    } catch (e) {
      setError(e?.response?.data?.messages?.[0] ?? "Failed to save.");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-6">

      {/* Instructions */}
      <div className="bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-700 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">How to use this section</h2>
        <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400 list-disc list-inside">
          <li><strong>Vendors</strong> are suppliers used in expense/bill payments. Demo vendors (Airtel, MTN, General) are pre-seeded on provision.</li>
          <li><strong>Loan products</strong> define the interest rate, interval, and penalty rules for all loans under this SACCO.</li>
          <li><strong>Savings products</strong> define the account types available to members (Savings Account, Fixed Deposit, Current Account, etc.).</li>
        </ul>
      </div>

      {/* SACCO picker */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Select SACCO</h2>
        <SaccoPicker value={saccoId} onChange={setSelectedSacco} />
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-300">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> {success}
        </div>
      )}

      {saccoId && loading && (
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      )}

      {saccoId && !loading && (
        <div className="flex flex-col gap-6">

          {/* ── Vendors ── */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Vendors</h2>
              <button type="button" onClick={() => { setShowVendorForm((v) => !v); setVendorForm(EMPTY_VENDOR()); }}
                className="flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>

            {showVendorForm && (
              <form onSubmit={(e) => { e.preventDefault(); submit("vendor", vendorForm, () => setVendorForm(EMPTY_VENDOR()), setShowVendorForm); }}
                className="mb-4 space-y-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="grid grid-cols-2 gap-2">
                  <Field label="First Name" required><Input value={vendorForm.firstname} onChange={(e) => setVendorForm((f) => ({ ...f, firstname: e.target.value }))} /></Field>
                  <Field label="Last Name" required><Input value={vendorForm.lastname} onChange={(e) => setVendorForm((f) => ({ ...f, lastname: e.target.value }))} /></Field>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Contact" required><Input value={vendorForm.contact} onChange={(e) => setVendorForm((f) => ({ ...f, contact: e.target.value }))} /></Field>
                  <Field label="Email"><Input type="email" value={vendorForm.email} onChange={(e) => setVendorForm((f) => ({ ...f, email: e.target.value }))} /></Field>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Company"><Input value={vendorForm.company} onChange={(e) => setVendorForm((f) => ({ ...f, company: e.target.value }))} /></Field>
                  <Field label="Address"><Input value={vendorForm.address} onChange={(e) => setVendorForm((f) => ({ ...f, address: e.target.value }))} /></Field>
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="submit" disabled={saving === "vendor"} className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-700 text-white rounded-md text-xs font-medium disabled:opacity-60">
                    {saving === "vendor" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Save
                  </button>
                  <button type="button" onClick={() => setShowVendorForm(false)} className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900">Cancel</button>
                </div>
              </form>
            )}

            {vendors.length === 0 ? (
              <p className="text-xs text-gray-500">No vendors yet.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {vendors.map((v) => (
                  <div key={v.id} className={editingVendorId === v.id ? "col-span-full" : "border border-gray-100 dark:border-gray-800 rounded-lg p-2.5 group relative"}>
                    {editingVendorId === v.id ? (
                      <form onSubmit={(e) => { e.preventDefault(); submitEdit("vendor", v.id, vendorEditForm, () => setEditingVendorId(null)); }}
                        className="space-y-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">Editing: {v.firstname} {v.lastname}</p>
                        <div className="grid grid-cols-2 gap-2">
                          <Field label="First Name" required><Input value={vendorEditForm.firstname} onChange={(e) => setVendorEditForm((f) => ({ ...f, firstname: e.target.value }))} /></Field>
                          <Field label="Last Name" required><Input value={vendorEditForm.lastname} onChange={(e) => setVendorEditForm((f) => ({ ...f, lastname: e.target.value }))} /></Field>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Field label="Contact" required><Input value={vendorEditForm.contact} onChange={(e) => setVendorEditForm((f) => ({ ...f, contact: e.target.value }))} /></Field>
                          <Field label="Email"><Input type="email" value={vendorEditForm.email} onChange={(e) => setVendorEditForm((f) => ({ ...f, email: e.target.value }))} /></Field>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Field label="Company"><Input value={vendorEditForm.company} onChange={(e) => setVendorEditForm((f) => ({ ...f, company: e.target.value }))} /></Field>
                          <Field label="Address"><Input value={vendorEditForm.address} onChange={(e) => setVendorEditForm((f) => ({ ...f, address: e.target.value }))} /></Field>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button type="submit" disabled={saving === "vendor"} className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-700 text-white rounded-md text-xs font-medium disabled:opacity-60">
                            {saving === "vendor" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Save Changes
                          </button>
                          <button type="button" onClick={() => setEditingVendorId(null)} className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900">Cancel</button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <button type="button" onClick={() => startEditVendor(v)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-opacity">
                          <Pencil className="w-3 h-3" />
                        </button>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 pr-5">{v.firstname} {v.lastname}</p>
                        {v.company && <p className="text-xs text-gray-500">{v.company}</p>}
                        <p className="text-xs text-gray-500">{v.contact}{v.email ? ` · ${v.email}` : ""}</p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Loan Products ── */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Loan Products</h2>
              <button type="button" onClick={() => { setShowLoanForm((v) => !v); setLoanForm(EMPTY_LOAN()); }}
                className="flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>

            {showLoanForm && (
              <form onSubmit={(e) => { e.preventDefault(); submit("loan_product", loanForm, () => setLoanForm(EMPTY_LOAN()), setShowLoanForm); }}
                className="mb-4 space-y-2.5 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">

                {/* Basic Details */}
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Basic Details</p>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Product Name" required>
                    <Input value={loanForm.title} onChange={(e) => setLoanForm((f) => ({ ...f, title: e.target.value }))} />
                  </Field>
                  <Field label="Product Code" hint="Leave blank to auto-generate">
                    <Input value={loanForm.code} placeholder="e.g. PL001" onChange={(e) => setLoanForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Type">
                    <Select options={[["fixed","Fixed"],["reducing_balance","Reducing Balance"]]} value={loanForm.loan_type} onChange={(e) => setLoanForm((f) => ({ ...f, loan_type: e.target.value }))} />
                  </Field>
                  <Field label="Repayment Interval">
                    <Select options={[["monthly","Monthly"],["weekly","Weekly"],["daily","Daily"],["yearly","Yearly"]]} value={loanForm.interval} onChange={(e) => setLoanForm((f) => ({ ...f, interval: e.target.value }))} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Interest Rate (%)">
                    <Input type="number" step="0.01" placeholder="e.g. 12.5" value={loanForm.interest_rate} onChange={(e) => setLoanForm((f) => ({ ...f, interest_rate: e.target.value }))} />
                  </Field>
                  <Field label="Rate Type">
                    <Select options={[["per_period","Per Period"],["total_flat","Total Flat"]]} value={loanForm.interest_rate_type} onChange={(e) => setLoanForm((f) => ({ ...f, interest_rate_type: e.target.value }))} />
                  </Field>
                </div>

                {/* Penalty */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Penalty</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Penalty Mode">
                    <Select options={[["value","Fixed Value"],["percentage","Percentage"]]} value={loanForm.penalty_mode} onChange={(e) => setLoanForm((f) => ({ ...f, penalty_mode: e.target.value }))} />
                  </Field>
                  <Field label="Penalty Interval">
                    <Select options={[["daily","Daily"],["weekly","Weekly"],["monthly","Monthly"],["yearly","Yearly"]]} value={loanForm.penalty_interval} onChange={(e) => setLoanForm((f) => ({ ...f, penalty_interval: e.target.value }))} />
                  </Field>
                </div>
                <Field label={loanForm.penalty_mode === "percentage" ? "Penalty (%)" : "Penalty Amount"}>
                  <Input type="number" step="0.01" placeholder={loanForm.penalty_mode === "percentage" ? "Enter percentage" : "Enter amount"} value={loanForm.penalty_amount} onChange={(e) => setLoanForm((f) => ({ ...f, penalty_amount: e.target.value }))} />
                </Field>
                {loanForm.penalty_mode === "percentage" && (
                  <Field label="Penalty Basis" hint="What the % is applied to">
                    <Select options={[["principal","Principal Only"],["principal_interest","Principal + Interest"],["outstanding_total","Outstanding Total"]]} value={loanForm.penalty_basis} onChange={(e) => setLoanForm((f) => ({ ...f, penalty_basis: e.target.value }))} />
                  </Field>
                )}

                {/* Offset & Grace */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Offset & Grace Period</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Offset Period">
                    <Input type="number" min="0" value={loanForm.penalty_offset_period} onChange={(e) => setLoanForm((f) => ({ ...f, penalty_offset_period: e.target.value }))} />
                  </Field>
                  <Field label="Offset Interval">
                    <Select options={[["","None"],["days","Days"],["weeks","Weeks"],["months","Months"],["years","Years"],["one_time","One Time"]]} value={loanForm.penalty_offset_interval} onChange={(e) => setLoanForm((f) => ({ ...f, penalty_offset_interval: e.target.value }))} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Grace Period">
                    <Input type="number" min="0" value={loanForm.grace_period} onChange={(e) => setLoanForm((f) => ({ ...f, grace_period: e.target.value }))} />
                  </Field>
                  <Field label="Grace Interval">
                    <Select options={[["","None"],["days","Days"],["weeks","Weeks"],["months","Months"],["years","Years"],["one_time","One Time"]]} value={loanForm.grace_interval} onChange={(e) => setLoanForm((f) => ({ ...f, grace_interval: e.target.value }))} />
                  </Field>
                </div>

                {/* Monitoring Fee */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Monitoring Fee</p>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="lp-mon-fee" checked={loanForm.monitoring_fee_enabled === "1"} onChange={(e) => setLoanForm((f) => ({ ...f, monitoring_fee_enabled: e.target.checked ? "1" : "0" }))} className="rounded" />
                  <label htmlFor="lp-mon-fee" className="text-xs text-gray-600 dark:text-gray-400">Enable Monitoring Fee</label>
                </div>
                <div className={`space-y-2 ${loanForm.monitoring_fee_enabled !== "1" ? "opacity-40 pointer-events-none" : ""}`}>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Fee Type">
                      <Select options={[["fixed","Fixed Amount"],["percent","Percentage"]]} value={loanForm.monitoring_fee_type} onChange={(e) => setLoanForm((f) => ({ ...f, monitoring_fee_type: e.target.value }))} />
                    </Field>
                    <Field label={loanForm.monitoring_fee_type === "percent" ? "Fee (%)" : "Fee Amount"}>
                      <Input type="number" step="0.01" placeholder={loanForm.monitoring_fee_type === "percent" ? "Enter %" : "Enter amount"} value={loanForm.monitoring_fee_value} onChange={(e) => setLoanForm((f) => ({ ...f, monitoring_fee_value: e.target.value }))} />
                    </Field>
                  </div>
                  <Field label="Fee Base">
                    <Select options={[["principal","Principal"],["interest","Interest"],["payment","Payment"],["balance","Balance"],["amount","Amount"]]} value={loanForm.monitoring_fee_base} onChange={(e) => setLoanForm((f) => ({ ...f, monitoring_fee_base: e.target.value }))} />
                  </Field>
                </div>

                <div className="flex gap-2 pt-1 border-t border-gray-200 dark:border-gray-700">
                  <button type="submit" disabled={saving === "loan_product"} className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-700 text-white rounded-md text-xs font-medium disabled:opacity-60">
                    {saving === "loan_product" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Save
                  </button>
                  <button type="button" onClick={() => setShowLoanForm(false)} className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900">Cancel</button>
                </div>
              </form>
            )}

            {loanProducts.length === 0 ? (
              <p className="text-xs text-gray-500">No loan products yet.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {loanProducts.map((p) => (
                  <div key={p.id} className={editingLoanId === p.id ? "col-span-full" : "border border-gray-100 dark:border-gray-800 rounded-lg p-2.5 group relative"}>
                    {editingLoanId === p.id ? (
                      <form onSubmit={(e) => { e.preventDefault(); submitEdit("loan_product", p.id, loanEditForm, () => setEditingLoanId(null)); }}
                        className="space-y-2.5 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">Editing: {p.title}</p>
                        <div className="grid grid-cols-2 gap-2">
                          <Field label="Product Name" required><Input value={loanEditForm.title} onChange={(e) => setLoanEditForm((f) => ({ ...f, title: e.target.value }))} /></Field>
                          <Field label="Product Code" hint="Leave blank to auto-generate"><Input value={loanEditForm.code} placeholder="e.g. PL001" onChange={(e) => setLoanEditForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} /></Field>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Field label="Type"><Select options={[["fixed","Fixed"],["reducing_balance","Reducing Balance"]]} value={loanEditForm.loan_type} onChange={(e) => setLoanEditForm((f) => ({ ...f, loan_type: e.target.value }))} /></Field>
                          <Field label="Repayment Interval"><Select options={[["monthly","Monthly"],["weekly","Weekly"],["daily","Daily"],["yearly","Yearly"]]} value={loanEditForm.interval} onChange={(e) => setLoanEditForm((f) => ({ ...f, interval: e.target.value }))} /></Field>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Field label="Interest Rate (%)"><Input type="number" step="0.01" value={loanEditForm.interest_rate} onChange={(e) => setLoanEditForm((f) => ({ ...f, interest_rate: e.target.value }))} /></Field>
                          <Field label="Rate Type"><Select options={[["per_period","Per Period"],["total_flat","Total Flat"]]} value={loanEditForm.interest_rate_type} onChange={(e) => setLoanEditForm((f) => ({ ...f, interest_rate_type: e.target.value }))} /></Field>
                        </div>
                        <div className="border-t border-blue-200 dark:border-blue-700 pt-1.5">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400 mb-2">Penalty</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Field label="Penalty Mode"><Select options={[["value","Fixed Value"],["percentage","Percentage"]]} value={loanEditForm.penalty_mode} onChange={(e) => setLoanEditForm((f) => ({ ...f, penalty_mode: e.target.value }))} /></Field>
                          <Field label="Penalty Interval"><Select options={[["daily","Daily"],["weekly","Weekly"],["monthly","Monthly"],["yearly","Yearly"]]} value={loanEditForm.penalty_interval} onChange={(e) => setLoanEditForm((f) => ({ ...f, penalty_interval: e.target.value }))} /></Field>
                        </div>
                        <Field label={loanEditForm.penalty_mode === "percentage" ? "Penalty (%)" : "Penalty Amount"}>
                          <Input type="number" step="0.01" value={loanEditForm.penalty_amount} onChange={(e) => setLoanEditForm((f) => ({ ...f, penalty_amount: e.target.value }))} />
                        </Field>
                        {loanEditForm.penalty_mode === "percentage" && (
                          <Field label="Penalty Basis" hint="What the % is applied to"><Select options={[["principal","Principal Only"],["principal_interest","Principal + Interest"],["outstanding_total","Outstanding Total"]]} value={loanEditForm.penalty_basis} onChange={(e) => setLoanEditForm((f) => ({ ...f, penalty_basis: e.target.value }))} /></Field>
                        )}
                        <div className="border-t border-blue-200 dark:border-blue-700 pt-1.5">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400 mb-2">Offset & Grace Period</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Field label="Offset Period"><Input type="number" min="0" value={loanEditForm.penalty_offset_period} onChange={(e) => setLoanEditForm((f) => ({ ...f, penalty_offset_period: e.target.value }))} /></Field>
                          <Field label="Offset Interval"><Select options={[["","None"],["days","Days"],["weeks","Weeks"],["months","Months"],["years","Years"],["one_time","One Time"]]} value={loanEditForm.penalty_offset_interval} onChange={(e) => setLoanEditForm((f) => ({ ...f, penalty_offset_interval: e.target.value }))} /></Field>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Field label="Grace Period"><Input type="number" min="0" value={loanEditForm.grace_period} onChange={(e) => setLoanEditForm((f) => ({ ...f, grace_period: e.target.value }))} /></Field>
                          <Field label="Grace Interval"><Select options={[["","None"],["days","Days"],["weeks","Weeks"],["months","Months"],["years","Years"],["one_time","One Time"]]} value={loanEditForm.grace_interval} onChange={(e) => setLoanEditForm((f) => ({ ...f, grace_interval: e.target.value }))} /></Field>
                        </div>
                        <div className="border-t border-blue-200 dark:border-blue-700 pt-1.5">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400 mb-2">Monitoring Fee</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="le-mon-fee" checked={loanEditForm.monitoring_fee_enabled === "1"} onChange={(e) => setLoanEditForm((f) => ({ ...f, monitoring_fee_enabled: e.target.checked ? "1" : "0" }))} className="rounded" />
                          <label htmlFor="le-mon-fee" className="text-xs text-gray-600 dark:text-gray-400">Enable Monitoring Fee</label>
                        </div>
                        <div className={`space-y-2 ${loanEditForm.monitoring_fee_enabled !== "1" ? "opacity-40 pointer-events-none" : ""}`}>
                          <div className="grid grid-cols-2 gap-2">
                            <Field label="Fee Type"><Select options={[["fixed","Fixed Amount"],["percent","Percentage"]]} value={loanEditForm.monitoring_fee_type} onChange={(e) => setLoanEditForm((f) => ({ ...f, monitoring_fee_type: e.target.value }))} /></Field>
                            <Field label={loanEditForm.monitoring_fee_type === "percent" ? "Fee (%)" : "Fee Amount"}><Input type="number" step="0.01" value={loanEditForm.monitoring_fee_value} onChange={(e) => setLoanEditForm((f) => ({ ...f, monitoring_fee_value: e.target.value }))} /></Field>
                          </div>
                          <Field label="Fee Base"><Select options={[["principal","Principal"],["interest","Interest"],["payment","Payment"],["balance","Balance"],["amount","Amount"]]} value={loanEditForm.monitoring_fee_base} onChange={(e) => setLoanEditForm((f) => ({ ...f, monitoring_fee_base: e.target.value }))} /></Field>
                        </div>
                        <div className="flex gap-2 pt-1 border-t border-blue-200 dark:border-blue-700">
                          <button type="submit" disabled={saving === "loan_product"} className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-700 text-white rounded-md text-xs font-medium disabled:opacity-60">
                            {saving === "loan_product" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Save Changes
                          </button>
                          <button type="button" onClick={() => setEditingLoanId(null)} className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900">Cancel</button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <button type="button" onClick={() => startEditLoan(p)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-opacity">
                          <Pencil className="w-3 h-3" />
                        </button>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 pr-5">{p.title} <span className="font-mono text-xs text-gray-400">{p.code}</span></p>
                        <p className="text-xs text-gray-500">{p.interest_rate}% {p.interest_rate_type === "total_flat" ? "flat" : "per period"} · {p.interval}</p>
                        <p className="text-xs text-gray-500">Penalty: {p.penalty_amount?.toLocaleString()} {p.penalty_mode} / {p.penalty_interval}</p>
                        {p.penalty_mode === "percentage" && <p className="text-xs text-gray-500">Basis: {p.penalty_basis}</p>}
                        {p.grace_period > 0 && <p className="text-xs text-gray-500">Grace: {p.grace_period} {p.grace_interval || "days"}</p>}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Savings Products ── */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Savings Products</h2>
              <button type="button" onClick={() => { setShowSavingsForm((v) => !v); setSavingsForm(EMPTY_SAVINGS()); }}
                className="flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>

            {showSavingsForm && (
              <form onSubmit={(e) => { e.preventDefault(); submit("savings_product", savingsForm, () => setSavingsForm(EMPTY_SAVINGS()), setShowSavingsForm); }}
                className="mb-4 space-y-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Product Name" required><Input value={savingsForm.title} onChange={(e) => setSavingsForm((f) => ({ ...f, title: e.target.value }))} /></Field>
                  <Field label="Product Code" required><Input value={savingsForm.code} onChange={(e) => setSavingsForm((f) => ({ ...f, code: e.target.value }))} placeholder="e.g. A001" /></Field>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Field label="Min Balance"><Input type="number" step="0.01" value={savingsForm.min_balance} onChange={(e) => setSavingsForm((f) => ({ ...f, min_balance: e.target.value }))} /></Field>
                  <Field label="Min Deposit"><Input type="number" step="0.01" value={savingsForm.min_deposit} onChange={(e) => setSavingsForm((f) => ({ ...f, min_deposit: e.target.value }))} /></Field>
                  <Field label="Max Deposit"><Input type="number" step="0.01" value={savingsForm.max_deposit} onChange={(e) => setSavingsForm((f) => ({ ...f, max_deposit: e.target.value }))} /></Field>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Min Withdraw"><Input type="number" step="0.01" value={savingsForm.min_withdraw} onChange={(e) => setSavingsForm((f) => ({ ...f, min_withdraw: e.target.value }))} /></Field>
                  <Field label="Max Withdraw"><Input type="number" step="0.01" value={savingsForm.max_withdraw} onChange={(e) => setSavingsForm((f) => ({ ...f, max_withdraw: e.target.value }))} /></Field>
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="submit" disabled={saving === "savings_product"} className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-700 text-white rounded-md text-xs font-medium disabled:opacity-60">
                    {saving === "savings_product" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Save
                  </button>
                  <button type="button" onClick={() => setShowSavingsForm(false)} className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900">Cancel</button>
                </div>
              </form>
            )}

            {savingsProducts.length === 0 ? (
              <p className="text-xs text-gray-500">No savings products yet.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {savingsProducts.map((p) => (
                  <div key={p.id} className={editingSavingsId === p.id ? "col-span-full" : "border border-gray-100 dark:border-gray-800 rounded-lg p-2.5 group relative"}>
                    {editingSavingsId === p.id ? (
                      <form onSubmit={(e) => { e.preventDefault(); submitEdit("savings_product", p.id, savingsEditForm, () => setEditingSavingsId(null)); }}
                        className="space-y-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">Editing: {p.title}</p>
                        <div className="grid grid-cols-2 gap-2">
                          <Field label="Product Name" required><Input value={savingsEditForm.title} onChange={(e) => setSavingsEditForm((f) => ({ ...f, title: e.target.value }))} /></Field>
                          <Field label="Product Code" required><Input value={savingsEditForm.code} onChange={(e) => setSavingsEditForm((f) => ({ ...f, code: e.target.value }))} /></Field>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <Field label="Min Balance"><Input type="number" step="0.01" value={savingsEditForm.min_balance} onChange={(e) => setSavingsEditForm((f) => ({ ...f, min_balance: e.target.value }))} /></Field>
                          <Field label="Min Deposit"><Input type="number" step="0.01" value={savingsEditForm.min_deposit} onChange={(e) => setSavingsEditForm((f) => ({ ...f, min_deposit: e.target.value }))} /></Field>
                          <Field label="Max Deposit"><Input type="number" step="0.01" value={savingsEditForm.max_deposit} onChange={(e) => setSavingsEditForm((f) => ({ ...f, max_deposit: e.target.value }))} /></Field>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Field label="Min Withdraw"><Input type="number" step="0.01" value={savingsEditForm.min_withdraw} onChange={(e) => setSavingsEditForm((f) => ({ ...f, min_withdraw: e.target.value }))} /></Field>
                          <Field label="Max Withdraw"><Input type="number" step="0.01" value={savingsEditForm.max_withdraw} onChange={(e) => setSavingsEditForm((f) => ({ ...f, max_withdraw: e.target.value }))} /></Field>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button type="submit" disabled={saving === "savings_product"} className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-700 text-white rounded-md text-xs font-medium disabled:opacity-60">
                            {saving === "savings_product" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Save Changes
                          </button>
                          <button type="button" onClick={() => setEditingSavingsId(null)} className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900">Cancel</button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <button type="button" onClick={() => startEditSavings(p)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-opacity">
                          <Pencil className="w-3 h-3" />
                        </button>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 pr-5">{p.title} <span className="font-mono text-xs text-gray-400">{p.code}</span></p>
                        <p className="text-xs text-gray-500">Min balance: {p.min_balance.toLocaleString()}</p>
                        {p.min_deposit > 0 && <p className="text-xs text-gray-500">Deposit: {p.min_deposit.toLocaleString()} – {p.max_deposit.toLocaleString()}</p>}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

// ── Payroll Settings Tab ──────────────────────────────────────────────────────

const EMPTY_PAYROLL = () => ({
  expense_account:       null,
  income_account:        null,
  auto_generate_payslip: "No",
  auto_generate_date:    "",
});

const EMPTY_DEDUCTION = () => ({
  name: "", type: "Deduction", value_type: "Fixed Amount", value: "", account_id: null,
});

function PayrollTab({ defaultSaccoId }) {
  const api = useAdminAxios();
  const [selectedSacco, setSelectedSacco] = useState(defaultSaccoId ? { sacco_id: Number(defaultSaccoId) } : null);
  const [accounts,    setAccounts]    = useState([]);
  const [coa,         setCoa]         = useState([]);
  const [deductions,  setDeductions]  = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState("");
  const [success,     setSuccess]     = useState("");
  const [form,        setForm]        = useState(EMPTY_PAYROLL());
  const [addModal,    setAddModal]    = useState(false);
  const [pendingKey,  setPendingKey]  = useState(null);
  const [newDed,      setNewDed]      = useState(null);  // non-null = add row open
  const [dedSaving,   setDedSaving]   = useState(false);
  const [dedError,    setDedError]    = useState("");

  const saccoId = selectedSacco?.sacco_id;

  const loadData = (id) => {
    setLoading(true); setError(""); setSuccess("");
    api.get(`/admin/onboard/payroll?sacco_id=${id}`)
      .then((res) => {
        const { settings, accounts: accs, coa: tree, deductions: deds } = res.data?.data ?? {};
        setAccounts(accs ?? []);
        setCoa(tree ?? []);
        setDeductions(deds ?? []);
        setForm(settings ? {
          expense_account:       settings.expense_account       ?? null,
          income_account:        settings.income_account        ?? null,
          auto_generate_payslip: settings.auto_generate_payslip ?? "No",
          auto_generate_date:    settings.auto_generate_date    ?? "",
        } : EMPTY_PAYROLL());
      })
      .catch(() => setError("Failed to load payroll settings. Check the SACCO selection and retry."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!saccoId) { setAccounts([]); setCoa([]); setDeductions([]); return; }
    loadData(saccoId);
  }, [saccoId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!saccoId) { setError("Select a SACCO first."); return; }
    setSaving(true); setError(""); setSuccess("");
    try {
      await api.post("/admin/onboard/payroll", { sacco_id: saccoId, ...form });
      setSuccess("Payroll settings saved successfully.");
    } catch (err) {
      const msg = err?.response?.data?.messages;
      setError(Array.isArray(msg) ? msg.join(", ") : (msg ?? "Failed to save payroll settings."));
    } finally { setSaving(false); }
  };

  const handleQuickAdd = (fieldKey) => { setPendingKey(fieldKey); setAddModal(true); };

  const handleAccountCreated = (account) => {
    setAddModal(false);
    const newAcc = { id: account.id, title: account.title, code: account.code };
    setAccounts((prev) => [...prev, newAcc].sort((a, b) => a.code.localeCompare(b.code)));
    if (pendingKey) setForm((f) => ({ ...f, [pendingKey]: account.id }));
    setPendingKey(null);
    loadData(saccoId);
  };

  const submitDeduction = async () => {
    if (!newDed.name || !newDed.value) { setDedError("Name and value are required."); return; }
    setDedSaving(true); setDedError("");
    try {
      const res = await api.post("/admin/onboard/payroll", {
        sacco_id: saccoId, sub: "deduction_add", ...newDed,
      });
      setDeductions((prev) => [...prev, res.data.data.deduction]);
      setNewDed(null);
    } catch (err) {
      const msg = err?.response?.data?.messages;
      setDedError(Array.isArray(msg) ? msg.join(", ") : (msg ?? "Failed to add."));
    } finally { setDedSaving(false); }
  };

  const deleteDeduction = async (id) => {
    try {
      await api.post("/admin/onboard/payroll", { sacco_id: saccoId, sub: "deduction_delete", id });
      setDeductions((prev) => prev.filter((d) => d.id !== id));
    } catch {
      // silent — list stays intact
    }
  };

  return (
    <>
      {addModal && (
        <QuickAddAccountModal
          saccoId={saccoId}
          coa={coa}
          api={api}
          onCreated={handleAccountCreated}
          onClose={() => { setAddModal(false); setPendingKey(null); }}
        />
      )}

      <div className="max-w-2xl space-y-5">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-3">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">SACCO *</label>
          <SaccoPicker value={saccoId} onChange={setSelectedSacco} />
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading payroll settings…
          </div>
        )}

        {!loading && saccoId && accounts.length === 0 && (
          <div className="flex items-start gap-2 text-sm text-amber-300 bg-amber-900/20 border border-amber-700/30 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            No accounts found for this SACCO. Upload the Chart of Accounts first.
          </div>
        )}

        {!loading && saccoId && accounts.length > 0 && (
          <>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Payroll Accounts</p>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Salary Expense Account" hint="Debited when payroll is posted">
                    <AccountCombobox
                      accounts={accounts}
                      value={form.expense_account}
                      onChange={(v) => setForm((f) => ({ ...f, expense_account: v }))}
                      onQuickAdd={() => handleQuickAdd("expense_account")}
                    />
                  </Field>
                  <Field label="Cash / Bank Account" hint="Credited for net salary paid out">
                    <AccountCombobox
                      accounts={accounts}
                      value={form.income_account}
                      onChange={(v) => setForm((f) => ({ ...f, income_account: v }))}
                      onQuickAdd={() => handleQuickAdd("income_account")}
                    />
                  </Field>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Auto Payslip Generation</p>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Auto Generate Payslip">
                    <Select
                      options={[["No", "No"], ["Yes", "Yes"]]}
                      value={form.auto_generate_payslip}
                      onChange={(e) => setForm((f) => ({ ...f, auto_generate_payslip: e.target.value }))}
                    />
                  </Field>
                  {form.auto_generate_payslip === "Yes" && (
                    <Field label="Auto Generate Date" hint="Day of month payslips are generated">
                      <DatePickerField
                        value={form.auto_generate_date}
                        onChange={(v) => setForm((f) => ({ ...f, auto_generate_date: v }))}
                        clearable
                      />
                    </Field>
                  )}
                </div>
              </div>

              {error   && <p className="text-sm text-red-400">{error}</p>}
              {success && <p className="text-sm text-green-400">{success}</p>}

              <button type="submit" disabled={saving}
                className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg disabled:opacity-50">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : "Save Payroll Settings"}
              </button>
            </form>

            {/* ── Deductions & Allowances ── */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Deductions &amp; Allowances</p>
                {!newDed && (
                  <button type="button" onClick={() => setNewDed(EMPTY_DEDUCTION())}
                    className="flex items-center gap-1 text-xs bg-zinc-900 hover:bg-zinc-700 text-white px-3 py-1.5 rounded-lg">
                    <Plus className="w-3 h-3" /> Add
                  </button>
                )}
              </div>

              {deductions.length === 0 && !newDed && (
                <p className="text-xs text-gray-400 italic">No deductions or allowances configured.</p>
              )}

              {deductions.length > 0 && (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {deductions.map((d) => (
                    <div key={d.id} className="flex items-center justify-between py-2.5 gap-3 text-sm">
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-gray-800 dark:text-gray-200">{d.name}</span>
                        <span className={`ml-2 text-xs font-medium ${d.type === "Deduction" ? "text-red-500" : "text-green-500"}`}>
                          {d.type}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 shrink-0">
                        {d.value_type === "Percentage" ? `${d.value}%` : Number(d.value).toLocaleString()}
                      </div>
                      {d.account_name ? (
                        <div className="text-xs text-gray-400 shrink-0 max-w-[140px] truncate" title={d.account_name}>
                          <span className="font-mono">{d.account_code}</span> {d.account_name}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-300 italic shrink-0">Default acct</div>
                      )}
                      <button type="button" onClick={() => deleteDeduction(d.id)}
                        className="text-gray-400 hover:text-red-500 shrink-0">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {newDed && (
                <div className="border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Name" required>
                      <Input value={newDed.name} onChange={(e) => setNewDed((d) => ({ ...d, name: e.target.value }))} placeholder="e.g. NSSF" />
                    </Field>
                    <Field label="Type">
                      <Select options={[["Deduction","Deduction"],["Allowance","Allowance"]]}
                        value={newDed.type} onChange={(e) => setNewDed((d) => ({ ...d, type: e.target.value }))} />
                    </Field>
                    <Field label="Value Type">
                      <Select options={[["Fixed Amount","Fixed Amount"],["Percentage","Percentage"]]}
                        value={newDed.value_type} onChange={(e) => setNewDed((d) => ({ ...d, value_type: e.target.value }))} />
                    </Field>
                    <Field label={newDed.value_type === "Percentage" ? "Percentage (%)" : "Amount"} required>
                      <Input type="number" step="0.01" min="0" value={newDed.value}
                        onChange={(e) => setNewDed((d) => ({ ...d, value: e.target.value }))} />
                    </Field>
                  </div>
                  <Field label="GL Account" hint="Optional — overrides default expense account on journal posting">
                    <AccountCombobox
                      accounts={accounts}
                      value={newDed.account_id}
                      onChange={(v) => setNewDed((d) => ({ ...d, account_id: v }))}
                      onQuickAdd={() => handleQuickAdd(null)}
                    />
                  </Field>
                  {dedError && <p className="text-xs text-red-400">{dedError}</p>}
                  <div className="flex gap-2">
                    <button type="button" onClick={submitDeduction} disabled={dedSaving}
                      className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-700 text-white text-xs px-4 py-2 rounded-lg disabled:opacity-50">
                      {dedSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} Save
                    </button>
                    <button type="button" onClick={() => { setNewDed(null); setDedError(""); }}
                      className="text-xs px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}

// ── Client Migration Tab ──────────────────────────────────────────────────────

const STEP_DEFS = [
  {
    key: "clients",
    label: "Individual Clients",
    desc: "Import individual members only. One row per savings product — repeat the same Account Number with a different Savings Product Code to open extra accounts. NOK columns are optional.",
    needs: ["branch_id", "user_id"],
    templateFile: "template_clients_individual.csv",
    templateContent: [
      "Account Number,First Name,Middle Name,Last Name,Phone,Gender,Email,Date of Birth,Date of Joining,National ID,Status,Address,Employment Status,Marital Status,Notes,Estimated Monthly Income,Email Notifications,SMS Notifications,Savings Product Code,NOK First Name,NOK Last Name,NOK Phone,NOK Relationship,NOK Identification,NOK Gender,NOK Address",
      "100001,John,Bosco,Doe,0700000001,male,john.doe@example.com,1990-06-15,2024-01-01,CM/NIN/123456,active,P.O Box 123 Kampala,employed,single,,500000.00,yes,yes,SA001,Mary,Doe,0700000002,spouse,CM/NIN/789012,female,Kampala",
      "100001,John,Bosco,Doe,0700000001,male,john.doe@example.com,1990-06-15,2024-01-01,CM/NIN/123456,active,P.O Box 123 Kampala,employed,single,,500000.00,yes,yes,FD001,,,,,,,,",
      "100002,Jane,,Akello,0700000004,female,jane@example.com,1992-09-20,2024-01-15,CM/NIN/654321,active,Entebbe Road Kampala,selfemployed,single,,300000.00,yes,yes,SA001,,,,,,,,",
    ].join("\n") + "\n",
  },
  {
    key: "groups",
    label: "Savings Groups",
    desc: "Import savings groups only. Members are NOT attached here — use Step 5 (Group Members) after both clients and groups have been imported.",
    needs: ["branch_id", "user_id"],
    templateFile: "template_clients_groups.csv",
    templateContent: [
      "Account Number,Group Name,Phone,Email,Date of Joining,Address,Status,Notes,Estimated Monthly Income,Email Notifications,SMS Notifications,Savings Product Code",
      "300001,Kampala Women Group,0700100001,kwg@example.com,2023-06-01,Kampala Uganda,active,,0,yes,yes,SA001",
      "300002,Bukoto Youth Savings,0700100002,,2023-08-01,Bukoto Kampala,active,Youth savings group,0,yes,yes,SA001",
    ].join("\n") + "\n",
  },
  {
    key: "companies",
    label: "Company Clients",
    desc: "Import corporate / company clients. Company name goes in the Company Name column. Optional detail columns (Company Registration, Tax ID, etc.) create a company-detail record when present.",
    needs: ["branch_id", "user_id"],
    templateFile: "template_clients_companies.csv",
    templateContent: [
      "Account Number,Company Name,Phone,Email,Date of Joining,Address,Status,Notes,Estimated Monthly Income,Email Notifications,SMS Notifications,Savings Product Code,Company Registration,Company Tax ID,Company Industry,Company Type,Date Incorporated,Company Website,Physical Address,Annual Revenue,Num Employees",
      "200001,ACME Uganda Ltd,0700000003,info@acme.ug,2024-01-10,Kampala Industrial Area,active,Corporate client,1000000.00,yes,yes,SA001,REG-UG-001,UG-TAX-001,Manufacturing,Limited,2010-01-15,https://acme.ug,Plot 5 Industrial Area,500000000.00,120",
      "200002,Sunrise Traders,0700000005,,2024-02-01,Owino Market Kampala,active,,500000.00,yes,yes,SA001,,,Retail,,,,,,",
    ].join("\n") + "\n",
  },
  {
    key: "joint_accounts",
    label: "Joint Accounts",
    desc: "Import joint / shared accounts with 2–4 named holders. Holder1 is required (primary holder). Holder2–4 are optional. Each holder creates a ClientJointHolder record.",
    needs: ["branch_id", "user_id"],
    templateFile: "template_clients_joint.csv",
    templateContent: [
      "Account Number,Account Name,Phone,Email,Date of Joining,Address,Status,Notes,Estimated Monthly Income,Email Notifications,SMS Notifications,Savings Product Code,Holder1 First Name,Holder1 Last Name,Holder1 Phone,Holder1 Identification,Holder1 Ownership %,Holder1 Gender,Holder1 Date of Birth,Holder2 First Name,Holder2 Last Name,Holder2 Phone,Holder2 Identification,Holder2 Ownership %,Holder2 Gender,Holder2 Date of Birth",
      "400001,Okello Joint Account,0700200001,,2023-06-01,Nakawa Kampala,active,,0,yes,yes,SA001,James,Okello,0700200001,CM/NIN/001,60,male,1985-03-10,Sarah,Okello,0700200002,CM/NIN/002,40,female,1988-07-22",
      "400002,Kato & Nambi Joint,0700200003,,2024-01-01,Rubaga Kampala,active,,0,yes,yes,SA001,Peter,Kato,0700200003,CM/NIN/003,50,male,1980-11-05,Nambi,Kato,0700200004,CM/NIN/004,50,female,1983-04-18",
    ].join("\n") + "\n",
  },
  {
    key: "group_members",
    label: "Group Members",
    desc: "Link individual clients to their savings group. Run after Steps 1 & 2. Creates GroupMemberSavings records and auto-opens any missing member sub-accounts.",
    needs: [],
    templateFile: "template_group_members.csv",
    templateContent: [
      "Group Account Number,Member Account Number,Member Role",
      "300001,100001,chairperson",
      "300001,100002,secretary",
      "300001,100003,member",
    ].join("\n") + "\n",
  },
  {
    key: "statements",
    label: "Account Statements & Opening Balances",
    desc: "Import transaction history. To set an opening balance only, use Transaction Type = opening_balance, Debit or Credit = C, Running Balance = the balance. The account balance is synced to the last running balance.",
    needs: [],
    templateFile: "template_statements.csv",
    templateContent: [
      "Account Number,Savings Product Code,Transaction Code,Transaction Type,Amount,Debit or Credit,Transaction Date,Description,Running Balance",
      "100001,SA001,OB-100001-SA001,opening_balance,1500000.00,C,2024-01-01,Opening balance — migration,1500000.00",
      "100001,SA001,TXN-100001-001,deposit,200000.00,C,2024-02-10,Monthly contribution,1700000.00",
      "100001,SA001,TXN-100001-002,withdrawal,100000.00,D,2024-03-05,Emergency withdrawal,1600000.00",
      "100001,FD001,OB-100001-FD001,opening_balance,3000000.00,C,2024-01-01,Fixed deposit opening balance,3000000.00",
    ].join("\n") + "\n",
  },
  {
    key: "loans",
    label: "Loans",
    desc: "Import individual and group loan applications. Active loans record the outstanding balance as a single schedule entry. Use Step 8 to distribute group loans to members.",
    needs: ["branch_id", "user_id"],
    templateFile: "template_loans.csv",
    templateContent: [
      "Account Number,Loan Code,Loan Product Code,Amount Disbursed,Tenure,Repayment Interval,Disbursed Date,Amount Paid,Status,Notes",
      "100001,LN-2024-001,LP001,5000000.00,12,monthly,2024-02-01,2000000.00,active,",
      "100002,LN-2023-005,LP001,3000000.00,6,monthly,2023-07-01,3000000.00,cleared,",
      "300001,LN-2024-010,LP002,15000000.00,18,monthly,2024-03-01,1500000.00,active,Group loan",
    ].join("\n") + "\n",
  },
  {
    key: "loan_allocations",
    label: "Group Loan Allocations",
    desc: "Distribute a group loan's principal among individual members. Each row references the group's Loan Code and the member's Account Number. Run after Step 7.",
    needs: [],
    templateFile: "template_loan_allocations.csv",
    templateContent: [
      "Loan Code,Member Account Number,Allocated Amount,Amount Paid",
      "LN-2024-010,100001,5000000.00,500000.00",
      "LN-2024-010,100002,5000000.00,500000.00",
      "LN-2024-010,100003,5000000.00,500000.00",
    ].join("\n") + "\n",
  },
];

function downloadCsv(filename, content) {
  const blob = new Blob([content], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function StepCard({ def, idx, saccoId, branchId, userId, api }) {
  const fileRef  = React.useRef(null);
  const [file,       setFile]       = React.useState(null);
  const [result,     setResult]     = React.useState(null);
  const [busy,       setBusy]       = React.useState(false);
  const [err,        setErr]        = React.useState("");
  const [importedAt,  setImportedAt]  = React.useState(null); // timestamp of last successful import
  const [lastAction,  setLastAction]  = React.useState(null); // "validate" | "import"

  const missingContext = () => {
    if (!saccoId) return "Select a SACCO first.";
    if (def.needs.includes("branch_id") && !branchId) return "Select a branch first.";
    if (def.needs.includes("user_id")   && !userId)   return "Select a staff user first.";
    return null;
  };

  const clearFile = () => {
    setFile(null);
    setResult(null);
    setErr("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const run = async (action) => {
    const ctxErr = missingContext();
    if (ctxErr) { setErr(ctxErr); return; }
    if (!file)  { setErr("Upload a CSV file first."); return; }

    setBusy(true); setErr(""); setResult(null);
    const form = new FormData();
    form.append("sacco_id",  saccoId);
    form.append("branch_id", branchId || "0");
    form.append("user_id",   userId   || "0");
    form.append("step",      def.key);
    form.append("file",      file);

    try {
      const res = await api.post(`/admin/onboard/client_migrate?action=${action}`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const data = { ok: true, ...res.data?.data, message: res.data?.messages };
      setResult(data);
      setLastAction(action);
      if (action === "import" && data.ok) {
        setImportedAt(new Date());
        clearFile();
      }
    } catch (e) {
      const d = e?.response?.data;
      setResult({ ok: false, ...d?.data, message: d?.messages ?? "Request failed." });
      setLastAction(action);
    } finally {
      setBusy(false);
    }
  };

  const skippedWarnings  = (result?.warnings ?? []).filter(w => w.includes("skipped"));
  const otherWarnings    = (result?.warnings ?? []).filter(w => !w.includes("skipped"));

  return (
    <div className={`rounded-xl border bg-gray-900 overflow-hidden transition-colors ${
      importedAt ? "border-green-800/60" : "border-gray-800"
    }`}>
      {/* Header */}
      <div className="flex items-start gap-3 px-5 py-4 border-b border-gray-800">
        <span className={`flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold transition-colors ${
          importedAt
            ? "bg-green-900/40 border-green-700 text-green-400"
            : "bg-zinc-800 border-gray-700 text-gray-400"
        }`}>
          {importedAt ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-white">{def.label}</p>
            {importedAt && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-green-900/50 text-green-400 border border-green-800/60">
                Imported {importedAt.toLocaleTimeString()}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{def.desc}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {importedAt && (
            <button type="button" onClick={() => { setImportedAt(null); setResult(null); }}
              className="text-xs text-gray-500 hover:text-amber-400 border border-gray-700 hover:border-amber-700 px-2 py-1 rounded-md transition-colors">
              Re-import
            </button>
          )}
          <button
            type="button"
            onClick={() => downloadCsv(def.templateFile, def.templateContent)}
            className="text-xs text-zinc-400 hover:text-white border border-gray-700 hover:border-gray-500 px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3 h-3" /> Template
          </button>
        </div>
      </div>

      {/* Imported success banner — shown after a completed import */}
      {importedAt && !file && (
        <div className="mx-5 mt-4 flex items-center gap-3 bg-green-900/20 border border-green-700/40 rounded-lg px-4 py-3">
          <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-green-300">Import successful</p>
            {result && (
              <p className="text-xs text-gray-400 mt-0.5">
                {result.imported ?? 0} imported
                {skippedWarnings.length > 0 && ` · ${skippedWarnings.length} already existed and were skipped`}
              </p>
            )}
          </div>
          <button type="button" onClick={() => { setImportedAt(null); setResult(null); }}
            className="text-gray-500 hover:text-gray-300 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Body — hidden after successful import unless re-importing */}
      {(!importedAt || file) && (
        <div className="px-5 py-4 space-y-3">
          {/* File drop zone */}
          <div
            onClick={() => fileRef.current?.click()}
            className="border border-dashed border-gray-700 hover:border-zinc-500 rounded-lg px-4 py-3 cursor-pointer transition-colors flex items-center gap-3"
          >
            <input type="file" accept=".csv" ref={fileRef} className="hidden"
              onChange={(e) => { const f = e.target.files[0]; if (f) { setFile(f); setResult(null); setErr(""); } }} />
            {file ? (
              <>
                <FileSpreadsheet className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                <span className="text-sm text-white truncate flex-1">{file.name}</span>
                <button type="button" onClick={(e) => { e.stopPropagation(); clearFile(); }}
                  className="text-gray-500 hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 text-gray-600 flex-shrink-0" />
                <span className="text-sm text-gray-500">Click to upload CSV</span>
              </>
            )}
          </div>

          {/* Error banner */}
          {err && (
            <div className="flex gap-2 text-red-400 text-xs bg-red-900/20 border border-red-800/30 rounded-lg px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />{err}
            </div>
          )}

          {/* Result panel */}
          {result && (() => {
            const isDryRun  = result.dry_run ?? (lastAction === "validate");
            const isSuccess = result.ok;
            const panelCls  = !isSuccess
              ? "border-red-700/40 bg-red-900/10"
              : isDryRun
                ? "border-amber-700/40 bg-amber-900/10"
                : "border-green-700/40 bg-green-900/10";
            const iconEl = !isSuccess
              ? <AlertCircle  className="w-4 h-4 text-red-400    flex-shrink-0" />
              : isDryRun
                ? <AlertCircle  className="w-4 h-4 text-amber-400  flex-shrink-0" />
                : <CheckCircle2 className="w-4 h-4 text-green-400  flex-shrink-0" />;
            const textCls = !isSuccess ? "text-red-300" : isDryRun ? "text-amber-300" : "text-green-300";
            return (
            <div className={`rounded-lg border px-4 py-3 space-y-2 ${panelCls}`}>
              <div className="flex items-center gap-2">
                {iconEl}
                <p className={`text-sm font-medium ${textCls}`}>
                  {Array.isArray(result.message) ? result.message.join(" ") : result.message}
                </p>
              </div>
              {isDryRun && isSuccess && (
                <p className="text-xs text-amber-400 bg-amber-900/20 rounded px-2 py-1.5 border border-amber-800/40">
                  Validation only — no data was saved. Click <strong>Import</strong> to write records to the database.
                </p>
              )}
              <div className="grid grid-cols-3 gap-2 text-xs text-gray-400">
                <span>Total rows: <strong className="text-white">{result.total_rows ?? "—"}</strong></span>
                <span>Valid:      <strong className="text-white">{result.valid_rows ?? "—"}</strong></span>
                <span>Imported:   <strong className={result.imported > 0 ? "text-green-400" : "text-white"}>{result.imported ?? "—"}</strong></span>
              </div>

              {/* Already-imported skipped rows */}
              {skippedWarnings.length > 0 && (
                <div className="rounded-md bg-zinc-800/60 border border-zinc-700/40 px-3 py-2">
                  <p className="text-xs font-semibold text-zinc-400 mb-1">
                    {skippedWarnings.length} row{skippedWarnings.length > 1 ? "s" : ""} already imported — skipped
                  </p>
                  <div className="space-y-0.5 max-h-28 overflow-y-auto">
                    {skippedWarnings.slice(0, 10).map((w, i) => (
                      <p key={i} className="text-xs text-zinc-400 font-mono">{w}</p>
                    ))}
                    {skippedWarnings.length > 10 && <p className="text-xs text-gray-500">…and {skippedWarnings.length - 10} more</p>}
                  </div>
                </div>
              )}

              {result.errors?.length > 0 && (
                <div className="space-y-0.5 max-h-40 overflow-y-auto">
                  {result.errors.slice(0, 20).map((e, i) => (
                    <p key={i} className="text-xs text-red-300 font-mono bg-red-900/20 rounded px-2 py-0.5">{e}</p>
                  ))}
                  {result.errors.length > 20 && <p className="text-xs text-gray-500">…and {result.errors.length - 20} more</p>}
                </div>
              )}

              {otherWarnings.length > 0 && (
                <div className="space-y-0.5">
                  {otherWarnings.slice(0, 5).map((w, i) => (
                    <p key={i} className="text-xs text-amber-300 font-mono bg-amber-900/20 rounded px-2 py-0.5">{w}</p>
                  ))}
                  {otherWarnings.length > 5 && <p className="text-xs text-gray-500">…and {otherWarnings.length - 5} more warnings</p>}
                </div>
              )}
            </div>
          ); })()}

          {/* Actions */}
          {(() => {
            const validatePassed = result?.ok && (result?.dry_run ?? lastAction === "validate");
            return (
            <div className="flex gap-2">
              <button type="button" onClick={() => run("validate")} disabled={busy || !file}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-lg border border-gray-700 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-white">
                {busy && lastAction === "validate" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Validate
              </button>
              <button type="button" onClick={() => run("import")} disabled={busy || !file}
                className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed border transition-colors text-white ${
                  validatePassed
                    ? "bg-amber-700 hover:bg-amber-600 border-amber-600"
                    : "bg-zinc-900 hover:bg-zinc-700 border-zinc-700"
                }`}>
                {busy && lastAction === "import" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                {validatePassed ? "Import Now ↑" : "Import"}
              </button>
            </div>
            );
          })()}
        </div>
      )}

      {/* Padding when showing success banner without body */}
      {importedAt && !file && <div className="pb-4" />}
    </div>
  );
}

function ClientMigrateTab({ defaultSaccoId }) {
  const api = useAdminAxios();
  const [selectedSacco, setSelectedSacco] = useState(defaultSaccoId ? { sacco_id: Number(defaultSaccoId) } : null);
  const [branchId,      setBranchId]      = useState("");
  const [userId,        setUserId]        = useState("");
  const [products,      setProducts]      = useState({ savings_products: [], loan_products: [] });
  const [branches,      setBranches]      = useState([]);
  const [staffList,     setStaffList]     = useState([]);
  const [ctxLoading,    setCtxLoading]    = useState(false);

  const saccoId = selectedSacco?.sacco_id;

  useEffect(() => {
    if (!saccoId) {
      setBranches([]); setStaffList([]); setBranchId(""); setUserId("");
      setProducts({ savings_products: [], loan_products: [] });
      return;
    }
    setCtxLoading(true);
    setBranchId(""); setUserId("");
    Promise.all([
      api.get(`/admin/onboard/client_migrate?sacco_id=${saccoId}`),
      api.get(`/admin/saccos/${saccoId}/staff`),
    ])
      .then(([prodRes, staffRes]) => {
        setProducts(prodRes.data?.data ?? {});
        const sd = staffRes.data?.data ?? {};
        setBranches(sd.branches ?? []);
        setStaffList(sd.staff ?? sd.users ?? []);
      })
      .catch(() => {})
      .finally(() => setCtxLoading(false));
  }, [saccoId]); // eslint-disable-line

  return (
    <div className="max-w-3xl space-y-5">
      {/* Context panel */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-4">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Migration Settings</p>
          <p className="text-xs text-gray-500 mt-0.5">Select the target SACCO then pick the branch and staff user to stamp on imported records.</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">SACCO *</label>
          <SaccoPicker value={saccoId} onChange={setSelectedSacco} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              Branch <span className="text-gray-500">(for clients &amp; loans)</span>
              {ctxLoading && <Loader2 className="inline w-3 h-3 animate-spin ml-1 text-gray-500" />}
            </label>
            <select
              className={cls}
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              disabled={!saccoId || ctxLoading}
            >
              <option value="">— Select branch —</option>
              {branches.map((b) => (
                <option key={b.branch_id} value={b.branch_id}>
                  {b.branch_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              Staff User <span className="text-gray-500">(performing import)</span>
              {ctxLoading && <Loader2 className="inline w-3 h-3 animate-spin ml-1 text-gray-500" />}
            </label>
            <select
              className={cls}
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              disabled={!saccoId || ctxLoading}
            >
              <option value="">— Select user —</option>
              {staffList.map((u) => (
                <option key={u.user_id} value={u.user_id}>
                  {u.name}{u.job_title ? ` · ${u.job_title}` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Product reference */}
        {(products.savings_products?.length > 0 || products.loan_products?.length > 0) && (
          <div className="border-t border-gray-200 dark:border-gray-800 pt-3 grid grid-cols-2 gap-4">
            {products.savings_products?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Savings Products</p>
                <div className="space-y-0.5">
                  {products.savings_products.map((p) => (
                    <p key={p.product_id} className="text-xs font-mono text-gray-400">
                      <span className="text-white">{p.product_code}</span> — {p.product_title}
                    </p>
                  ))}
                </div>
              </div>
            )}
            {products.loan_products?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Loan Products</p>
                <div className="space-y-0.5">
                  {products.loan_products.map((p) => (
                    <p key={p.loan_product_id} className="text-xs font-mono text-gray-400">
                      <span className="text-white">{p.loan_product_code}</span> — {p.loan_product_title}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Step cards */}
      <div className="space-y-3">
        {STEP_DEFS.map((def, idx) => (
          <StepCard key={def.key} def={def} idx={idx} saccoId={saccoId} branchId={branchId} userId={userId} api={api} />
        ))}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminOnboarding() {
  const [params] = useSearchParams();
  const rawTab = params.get("tab");
  const defaultTab = ["migrate", "coa", "defaults", "notifications", "products", "payroll", "client_migrate"].includes(rawTab) ? rawTab : "provision";
  const [tab, setTab] = useState(defaultTab);

  const saccoId   = params.get("sacco_id") || "";
  const saccoName = params.get("name")     || "";

  const tabs = [
    { id: "provision",      label: "Provision New SACCO", icon: PlusCircle },
    { id: "coa",            label: "Chart of Accounts",   icon: BookOpen },
    { id: "defaults",       label: "Set Defaults",         icon: FileSpreadsheet },
    { id: "notifications",  label: "Notifications",        icon: MessageSquare },
    { id: "products",       label: "Products & Vendors",   icon: Briefcase },
    { id: "payroll",        label: "Payroll Settings",     icon: Users },
    { id: "client_migrate", label: "Client Migration",     icon: ChevronRight },
    { id: "migrate",        label: "Full Migration",       icon: Upload },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Onboarding</h1>
        <p className="text-sm text-gray-500 mt-0.5">Provision new SACCOs, import chart of accounts, and run historical data migrations.</p>
      </div>

      <div className="flex gap-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-1 w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === id ? "bg-zinc-900 text-white" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {tab === "provision"     && <ProvisionTab />}
      {tab === "coa"           && <CoaMigrateTab defaultSaccoId={saccoId} />}
      {tab === "defaults"      && <DefaultsTab defaultSaccoId={saccoId} />}
      {tab === "notifications" && <NotificationsTab defaultSaccoId={saccoId} />}
      {tab === "products"      && <ProductsTab defaultSaccoId={saccoId} />}
      {tab === "payroll"        && <PayrollTab       defaultSaccoId={saccoId} />}
      {tab === "client_migrate" && <ClientMigrateTab defaultSaccoId={saccoId} />}
      {tab === "migrate"        && <MigrateTab       defaultSaccoId={saccoId} defaultSaccoName={saccoName} />}
    </div>
  );
}

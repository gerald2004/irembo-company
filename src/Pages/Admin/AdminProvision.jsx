import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import {
  Building2, CheckCircle2, Loader2, Copy, Eye, EyeOff, ArrowLeft,
} from "lucide-react";
import adminAxios from "@/Config/AdminAxios";
import { DatePickerField } from "@/components/ui/date-picker";

function Field({ label, error, children, hint }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
      {children}
      {hint && !error && <p className="text-xs text-gray-600 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}

function Input({ className = "", ...props }) {
  return (
    <input
      className={`w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${className}`}
      {...props}
    />
  );
}

function CredentialRow({ label, value }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-800 last:border-0">
      <span className="text-xs text-gray-500 w-24 shrink-0">{label}</span>
      <span className="font-mono text-sm text-white flex-1 px-2 truncate">{value}</span>
      <button onClick={copy} className="text-gray-500 hover:text-indigo-400 transition-colors">
        {copied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
}

export default function AdminProvision() {
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const { register, control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      sacco_name: "", sacco_short_name: "", sacco_contact: "",
      sacco_emails: "", sacco_location: "", sacco_registration_date: "",
      branch_name: "Head Office", branch_code: "HQ-001",
      admin_firstname: "", admin_lastname: "", admin_email: "",
      admin_contact: "", admin_gender: "male", admin_password: "",
    },
  });

  const onSubmit = async (data) => {
    const payload = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== "")
    );
    try {
      const res = await adminAxios.post("/migrations/provision", payload);
      setResult(res.data?.data);
    } catch (err) {
      const msg = err?.response?.data?.messages;
      alert(Array.isArray(msg) ? msg.join("\n") : (msg ?? "Provisioning failed. Check the console."));
    }
  };

  if (result) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div className="bg-green-900/20 border border-green-700/40 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="w-6 h-6 text-green-400 shrink-0" />
            <div>
              <h2 className="font-semibold text-white">SACCO Provisioned</h2>
              <p className="text-xs text-green-400">{result.sacco_name} · ID #{result.sacco_id}</p>
            </div>
          </div>
          <div className="bg-gray-950 rounded-lg px-4 py-1">
            <CredentialRow label="Email"    value={result.email}    />
            <CredentialRow label="Password" value={result.password} />
            <CredentialRow label="PIN"      value={result.pin}      />
            <CredentialRow label="SACCO ID" value={String(result.sacco_id)} />
            <CredentialRow label="Branch"   value={String(result.branch_id)} />
          </div>
          <p className="text-xs text-amber-400 mt-4 bg-amber-900/20 border border-amber-700/30 rounded-md px-3 py-2">
            Share these credentials securely. The admin should change password and PIN on first login.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/admin/migrate?sacco_id=${result.sacco_id}&name=${encodeURIComponent(result.sacco_name)}`)}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
          >
            Run Migration for this SACCO
          </button>
          <button
            onClick={() => { setResult(null); reset(); }}
            className="px-4 py-2.5 rounded-lg border border-gray-700 text-sm text-gray-400 hover:text-white hover:border-gray-600 transition-colors"
          >
            Provision Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-white">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">Provision New SACCO</h1>
          <p className="text-sm text-gray-500">Creates a SACCO, branch, admin role, and admin user in one step.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* SACCO Details */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-white">SACCO Details</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="SACCO Name *" error={errors.sacco_name?.message}>
              <Input
                placeholder="e.g. Kampala Teachers SACCO"
                {...register("sacco_name", { required: "Required" })}
              />
            </Field>
            <Field label="Short Name" hint="Abbreviation used in SMS/emails">
              <Input placeholder="e.g. KTSACCO" {...register("sacco_short_name")} />
            </Field>
            <Field label="Contact">
              <Input placeholder="+256 700 000000" {...register("sacco_contact")} />
            </Field>
            <Field label="Email(s)" hint="Comma-separated if multiple">
              <Input placeholder="info@sacco.ug" {...register("sacco_emails")} />
            </Field>
            <Field label="Location">
              <Input placeholder="Kampala, Uganda" {...register("sacco_location")} />
            </Field>
            <Field label="Registration Date">
              <Controller
                name="sacco_registration_date"
                control={control}
                render={({ field }) => (
                  <DatePickerField value={field.value} onChange={field.onChange} clearable />
                )}
              />
            </Field>
          </div>
        </section>

        {/* Branch */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">Head Office Branch</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Branch Name">
              <Input {...register("branch_name")} />
            </Field>
            <Field label="Branch Code">
              <Input {...register("branch_code")} />
            </Field>
          </div>
        </section>

        {/* Admin User */}
        <section className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white">Admin User</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="First Name *" error={errors.admin_firstname?.message}>
              <Input {...register("admin_firstname", { required: "Required" })} />
            </Field>
            <Field label="Last Name *" error={errors.admin_lastname?.message}>
              <Input {...register("admin_lastname", { required: "Required" })} />
            </Field>
            <Field label="Email *" error={errors.admin_email?.message}>
              <Input
                type="email"
                {...register("admin_email", { required: "Required" })}
              />
            </Field>
            <Field label="Contact">
              <Input {...register("admin_contact")} />
            </Field>
            <Field label="Gender">
              <select
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                {...register("admin_gender")}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </Field>
            <Field label="Password" hint="Leave blank to auto-generate">
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Auto-generated if blank"
                  className="pr-10"
                  {...register("admin_password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Field>
          </div>
        </section>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSubmitting ? "Provisioning…" : "Create SACCO"}
        </button>
      </form>
    </div>
  );
}

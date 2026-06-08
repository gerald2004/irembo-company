/* eslint-disable react/prop-types */
import { useState, useEffect, useCallback } from "react";
import {
  User, Lock, Shield, Eye, EyeOff, CheckCircle2, XCircle,
  Loader2, AlertCircle, Smartphone, Mail, KeyRound, Copy,
  RefreshCw, ShieldOff,
} from "lucide-react";
import useAdminAxios from "@/MiddleWares/Hooks/useAdminAxios";
import useAdminAuth from "@/MiddleWares/Hooks/useAdminAuth";

const TABS = [
  { id: "profile",  label: "Profile",  icon: User },
  { id: "password", label: "Password", icon: Lock },
  { id: "security", label: "Security", icon: Shield },
];

export default function AdminAccount() {
  const [tab, setTab] = useState("profile");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">My Account</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Manage your profile, password and two-factor authentication</p>
      </div>

      <div className="flex gap-1 bg-gray-100 dark:bg-gray-900 rounded-xl p-1 w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === id
                ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {tab === "profile"  && <ProfileTab />}
      {tab === "password" && <PasswordTab />}
      {tab === "security" && <SecurityTab />}
    </div>
  );
}

// ── Profile ────────────────────────────────────────────────────────────────────

function ProfileTab() {
  const api = useAdminAxios();
  const { adminAuth, setAdminAuth } = useAdminAuth();
  const [form,    setForm]    = useState({ admin_firstname: "", admin_lastname: "", admin_contact: "", admin_avatar: "" });
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState(null); // {type, text}

  useEffect(() => {
    api.get("/admin/account/profile")
      .then(r => {
        const d = r.data?.data ?? {};
        setForm({ admin_firstname: d.admin_firstname ?? "", admin_lastname: d.admin_lastname ?? "", admin_contact: d.admin_contact ?? "", admin_avatar: d.admin_avatar ?? "" });
      })
      .catch(() => setMsg({ type: "error", text: "Failed to load profile" }))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  const save = async () => {
    setSaving(true); setMsg(null);
    try {
      const r = await api.put("/admin/account/profile", form);
      const updated = r.data?.data?.admin ?? {};
      // Sync auth context so name updates in sidebar
      setAdminAuth(prev => ({ ...prev, admin: { ...prev.admin, ...updated } }));
      setMsg({ type: "success", text: "Profile updated successfully" });
    } catch (e) {
      setMsg({ type: "error", text: e.response?.data?.messages?.[0] ?? "Update failed" });
    } finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>;

  const admin = adminAuth?.admin ?? {};

  return (
    <div className="max-w-lg space-y-6">
      {/* Avatar preview */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-indigo-600/20 flex items-center justify-center border-2 border-indigo-500/30 overflow-hidden">
          {form.admin_avatar
            ? <img src={form.admin_avatar} alt="" className="w-full h-full object-cover" />
            : <span className="text-2xl font-bold text-indigo-400">{(form.admin_firstname[0] ?? "A").toUpperCase()}</span>
          }
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{admin.admin_firstname} {admin.admin_lastname}</p>
          <p className="text-xs text-gray-500 capitalize mt-0.5">{admin.admin_role?.replace("_", " ")}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="First Name" value={form.admin_firstname} onChange={v => setForm(f => ({ ...f, admin_firstname: v }))} />
          <Field label="Last Name"  value={form.admin_lastname}  onChange={v => setForm(f => ({ ...f, admin_lastname: v }))} />
        </div>
        <Field label="Email" value={admin.admin_email ?? ""} disabled hint="Email cannot be changed" />
        <Field label="Contact / Phone" value={form.admin_contact} onChange={v => setForm(f => ({ ...f, admin_contact: v }))} placeholder="+256 7XX XXX XXX" />
        <Field label="Avatar URL" value={form.admin_avatar} onChange={v => setForm(f => ({ ...f, admin_avatar: v }))} placeholder="https://…" />

        {msg && <Alert type={msg.type} text={msg.text} />}

        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg disabled:opacity-50">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <User className="w-3.5 h-3.5" />}
          Save Profile
        </button>
      </div>
    </div>
  );
}

// ── Password ───────────────────────────────────────────────────────────────────

function PasswordTab() {
  const api = useAdminAxios();
  const [form,   setForm]   = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [show,   setShow]   = useState({ cur: false, nw: false, cf: false });
  const [saving, setSaving] = useState(false);
  const [msg,    setMsg]    = useState(null);

  const save = async () => {
    setSaving(true); setMsg(null);
    try {
      await api.put("/admin/account/password", form);
      setMsg({ type: "success", text: "Password changed. Other sessions have been revoked." });
      setForm({ current_password: "", new_password: "", confirm_password: "" });
    } catch (e) {
      setMsg({ type: "error", text: e.response?.data?.messages?.[0] ?? "Failed to change password" });
    } finally { setSaving(false); }
  };

  const strength = (() => {
    const p = form.new_password;
    if (!p) return null;
    let s = 0;
    if (p.length >= 8)  s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength ?? 0];
  const strengthColor = ["", "bg-red-500", "bg-yellow-500", "bg-blue-500", "bg-emerald-500"][strength ?? 0];

  return (
    <div className="max-w-md">
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
        <PasswordField label="Current Password" value={form.current_password}
          show={show.cur} onToggle={() => setShow(s => ({ ...s, cur: !s.cur }))}
          onChange={v => setForm(f => ({ ...f, current_password: v }))} />

        <PasswordField label="New Password" value={form.new_password}
          show={show.nw} onToggle={() => setShow(s => ({ ...s, nw: !s.nw }))}
          onChange={v => setForm(f => ({ ...f, new_password: v }))} />

        {form.new_password && (
          <div>
            <div className="flex gap-1 mb-1">
              {[1,2,3,4].map(i => (
                <div key={i} className={`flex-1 h-1 rounded-full transition-colors ${i <= (strength ?? 0) ? strengthColor : "bg-gray-200 dark:bg-gray-700"}`} />
              ))}
            </div>
            <p className={`text-xs ${["","text-red-500","text-yellow-500","text-blue-500","text-emerald-500"][strength ?? 0]}`}>
              {strengthLabel}
            </p>
          </div>
        )}

        <PasswordField label="Confirm New Password" value={form.confirm_password}
          show={show.cf} onToggle={() => setShow(s => ({ ...s, cf: !s.cf }))}
          onChange={v => setForm(f => ({ ...f, confirm_password: v }))} />

        {form.confirm_password && form.new_password !== form.confirm_password && (
          <p className="text-xs text-red-400">Passwords do not match</p>
        )}

        {msg && <Alert type={msg.type} text={msg.text} />}

        <button onClick={save} disabled={saving || !form.current_password || !form.new_password || form.new_password !== form.confirm_password}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg disabled:opacity-50">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
          Change Password
        </button>
      </div>
    </div>
  );
}

// ── Security / 2FA ─────────────────────────────────────────────────────────────

const METHOD_INFO = {
  sms:   { icon: Smartphone, label: "SMS",             desc: "OTP sent to your registered phone number" },
  email: { icon: Mail,       label: "Email OTP",       desc: "OTP sent to your admin email address" },
  totp:  { icon: KeyRound,   label: "Authenticator App", desc: "Google Authenticator, Microsoft Authenticator, or any TOTP app" },
};

function SecurityTab() {
  const api = useAdminAxios();
  const [profile,   setProfile]   = useState(null);
  const [loading,   setLoading]   = useState(true);

  // setup flow
  const [phase,     setPhase]     = useState("idle"); // idle | choosing | setup | confirm
  const [method,    setMethod]    = useState(null);
  const [setupData, setSetupData] = useState(null); // { secret, qr_data_uri, otpauth }
  const [code,      setCode]      = useState("");
  const [working,   setWorking]   = useState(false);
  const [msg,       setMsg]       = useState(null);

  // disable flow
  const [disablePass, setDisablePass] = useState("");
  const [showDisable, setShowDisable] = useState(false);
  const [disabling,   setDisabling]   = useState(false);
  const [copied,      setCopied]      = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const r = await api.get("/admin/account");
      setProfile(r.data?.data ?? {});
    } catch {
      setMsg({ type: "error", text: "Failed to load security info" });
    } finally { setLoading(false); }
  }, [api]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const startSetup = async (m) => {
    setWorking(true); setMsg(null); setMethod(m);
    try {
      const r = await api.post("/admin/account/2fa/setup", { method: m });
      const d = r.data?.data ?? {};
      setSetupData(d);
      setPhase("confirm");
      if (d.message) setMsg({ type: "info", text: d.message });
    } catch (e) {
      setMsg({ type: "error", text: e.response?.data?.messages?.[0] ?? "Setup failed" });
      setPhase("choosing");
    } finally { setWorking(false); }
  };

  const confirmSetup = async () => {
    setWorking(true); setMsg(null);
    try {
      await api.post("/admin/account/2fa/confirm", { code });
      setMsg({ type: "success", text: "2FA enabled successfully!" });
      setPhase("idle"); setCode("");
      loadProfile();
    } catch (e) {
      setMsg({ type: "error", text: e.response?.data?.messages?.[0] ?? "Invalid code" });
    } finally { setWorking(false); }
  };

  const disable2fa = async () => {
    setDisabling(true); setMsg(null);
    try {
      await api.delete("/admin/account/2fa", { data: { password: disablePass } });
      setMsg({ type: "success", text: "2FA disabled" });
      setShowDisable(false); setDisablePass("");
      loadProfile();
    } catch (e) {
      setMsg({ type: "error", text: e.response?.data?.messages?.[0] ?? "Failed to disable 2FA" });
    } finally { setDisabling(false); }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(setupData?.secret ?? "");
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>;

  return (
    <div className="max-w-lg space-y-5">
      {msg && <Alert type={msg.type} text={msg.text} onClose={() => setMsg(null)} />}

      {/* Current Status */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              Two-Factor Authentication
              {profile?.two_factor_enabled
                ? <span className="flex items-center gap-1 text-xs text-emerald-500"><CheckCircle2 className="w-3.5 h-3.5" />Enabled</span>
                : <span className="flex items-center gap-1 text-xs text-gray-400"><XCircle className="w-3.5 h-3.5" />Disabled</span>
              }
            </h3>
            {profile?.two_factor_enabled
              ? <p className="text-xs text-gray-500 mt-1">
                  Method: <span className="font-medium text-indigo-400 capitalize">{METHOD_INFO[profile.two_factor_method]?.label ?? profile.two_factor_method}</span>
                  {profile.two_factor_confirmed_at && <span className="ml-2">· Enabled {new Date(profile.two_factor_confirmed_at).toLocaleDateString("en-UG")}</span>}
                </p>
              : <p className="text-xs text-gray-500 mt-1">Add an extra layer of security to your account</p>
            }
          </div>

          {profile?.two_factor_enabled ? (
            <button onClick={() => setShowDisable(v => !v)}
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-400 px-3 py-1.5 border border-red-500/30 rounded-lg">
              <ShieldOff className="w-3.5 h-3.5" /> Disable
            </button>
          ) : (
            phase === "idle" && (
              <button onClick={() => { setPhase("choosing"); setMsg(null); }}
                className="flex items-center gap-1 text-xs text-white bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-lg">
                <Shield className="w-3.5 h-3.5" /> Set Up 2FA
              </button>
            )
          )}
        </div>

        {/* Disable confirmation */}
        {showDisable && profile?.two_factor_enabled && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 mb-3">Enter your password to disable 2FA:</p>
            <div className="flex gap-2">
              <input type="password" value={disablePass} onChange={e => setDisablePass(e.target.value)}
                placeholder="Your password"
                className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 text-gray-900 dark:text-white" />
              <button onClick={disable2fa} disabled={disabling || !disablePass}
                className="flex items-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-500 text-white text-xs rounded-lg disabled:opacity-50">
                {disabling ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldOff className="w-3 h-3" />}
                Disable
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Method chooser */}
      {phase === "choosing" && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Choose a 2FA method</p>
          <div className="space-y-3">
            {Object.entries(METHOD_INFO).map(([key, info]) => {
              const Icon = info.icon;
              return (
                <button key={key} onClick={() => startSetup(key)} disabled={working}
                  className="w-full flex items-start gap-3 p-4 border-2 border-gray-200 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-xl text-left transition-colors disabled:opacity-50">
                  <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{info.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{info.desc}</p>
                  </div>
                  {working && <Loader2 className="w-4 h-4 animate-spin text-indigo-400 ml-auto mt-1" />}
                </button>
              );
            })}
          </div>
          <button onClick={() => setPhase("idle")} className="mt-3 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">Cancel</button>
        </div>
      )}

      {/* Confirm step */}
      {phase === "confirm" && method && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-4">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {method === "totp" ? "Scan QR Code" : "Enter Verification Code"}
          </p>

          {method === "totp" && setupData && (
            <div className="space-y-3">
              {setupData.qr_data_uri ? (
                <div className="flex justify-center p-4 bg-white rounded-xl border border-gray-200 dark:border-gray-700">
                  <img src={setupData.qr_data_uri} alt="QR Code" className="w-40 h-40" />
                </div>
              ) : (
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl text-center">
                  <p className="text-xs text-gray-500 mb-2">No QR code available. Enter this secret manually:</p>
                  <div className="flex items-center justify-center gap-2">
                    <code className="text-sm font-mono text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded">{setupData.secret}</code>
                    <button onClick={copySecret} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                      {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                  <KeyRound className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500">Or enter manually:</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <code className="text-sm font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded truncate">{setupData.secret}</code>
                    <button onClick={copySecret} className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                      {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500">Open your authenticator app → Add account → Scan the QR or enter the secret above → then enter the 6-digit code below.</p>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">
              {method === "totp" ? "Enter the 6-digit code from your app" : "Enter the code we sent you"}
            </label>
            <input
              type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6}
              value={code} onChange={e => setCode(e.target.value.replace(/\D/g,""))}
              onKeyDown={e => e.key === "Enter" && code.length === 6 && confirmSetup()}
              placeholder="000000"
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2.5 text-center text-2xl font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white" />
          </div>

          <div className="flex gap-2">
            <button onClick={confirmSetup} disabled={working || code.length !== 6}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg disabled:opacity-50">
              {working ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Confirm & Enable
            </button>
            {(method === "sms" || method === "email") && (
              <button onClick={() => startSetup(method)} disabled={working}
                className="flex items-center gap-1 px-3 py-2 text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-700 rounded-lg disabled:opacity-50">
                <RefreshCw className="w-3 h-3" /> Resend
              </button>
            )}
            <button onClick={() => { setPhase("idle"); setCode(""); setMsg(null); }}
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 px-2">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Reusable field components ──────────────────────────────────────────────────

function Field({ label, value, onChange, disabled, hint, placeholder }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      <input
        value={value} disabled={disabled}
        onChange={e => onChange?.(e.target.value)}
        placeholder={placeholder}
        className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white ${
          disabled
            ? "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
            : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
        }`}
      />
      {hint && <p className="text-[10px] text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

function PasswordField({ label, value, onChange, show, onToggle }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      <div className="relative">
        <input type={show ? "text" : "password"} value={value} onChange={e => onChange(e.target.value)}
          className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white" />
        <button type="button" onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function Alert({ type, text, onClose }) {
  const styles = {
    success: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    error:   "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
    info:    "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  };
  const icons = { success: CheckCircle2, error: AlertCircle, info: AlertCircle };
  const Icon = icons[type] ?? AlertCircle;
  return (
    <div className={`flex items-start gap-2 p-3 rounded-lg border text-sm ${styles[type]}`}>
      <Icon className="w-4 h-4 mt-0.5 shrink-0" />
      <p className="flex-1">{text}</p>
      {onClose && <button onClick={onClose} className="shrink-0 opacity-60 hover:opacity-100"><XCircle className="w-4 h-4" /></button>}
    </div>
  );
}

import { useEffect, useState } from "react";
import {
  Users, Plus, Loader2, AlertCircle, CheckCircle2, XCircle,
  Building2, Edit2, UserX, X, Eye, EyeOff, ShieldOff,
} from "lucide-react";
import useAdminAxios from "@/MiddleWares/Hooks/useAdminAxios";
import useAdminAuth from "@/MiddleWares/Hooks/useAdminAuth";

// ── Sub-components ────────────────────────────────────────────────────────────

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}

function Input({ className = "", ...props }) {
  return (
    <input
      className={`w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${className}`}
      {...props}
    />
  );
}

function RoleBadge({ role }) {
  return role === "general_admin"
    ? <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-900/40 text-indigo-400">General Admin</span>
    : <span className="text-xs px-2 py-0.5 rounded-full bg-sky-900/40 text-sky-400">Customer Support</span>;
}

// ── User form (create / edit) ─────────────────────────────────────────────────

function UserForm({ user, saccos, onSave, onClose }) {
  const api = useAdminAxios();
  const isEdit = !!user;
  const [form, setForm] = useState({
    admin_firstname: user?.admin_firstname ?? "",
    admin_lastname:  user?.admin_lastname  ?? "",
    admin_email:     user?.admin_email     ?? "",
    admin_contact:   user?.admin_contact   ?? "",
    admin_role:      user?.admin_role      ?? "customer_support",
    admin_status:    user?.admin_status    ?? "active",
    admin_password:  "",
  });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    setError("");
    setSaving(true);
    const payload = { ...form };
    if (!payload.admin_password) delete payload.admin_password;
    try {
      const res = isEdit
        ? await api.put(`/admin/users/${user.admin_user_id}`, payload)
        : await api.post("/admin/users", payload);
      onSave(res.data?.data?.user);
    } catch (err) {
      const msg = err?.response?.data?.messages;
      setError(Array.isArray(msg) ? msg.join(" ") : (msg ?? "Save failed."));
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{isEdit ? "Edit Admin User" : "New Admin User"}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900 dark:hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          {error && <div className="flex gap-2 text-red-400 bg-red-900/20 border border-red-800/30 rounded-lg px-3 py-2"><AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><p className="text-sm">{error}</p></div>}
          <div className="grid grid-cols-2 gap-4">
            <Field label="First Name *"><Input value={form.admin_firstname} onChange={set("admin_firstname")} /></Field>
            <Field label="Last Name *"><Input value={form.admin_lastname} onChange={set("admin_lastname")} /></Field>
          </div>
          <Field label="Email *"><Input type="email" value={form.admin_email} onChange={set("admin_email")} /></Field>
          <Field label="Contact"><Input value={form.admin_contact} onChange={set("admin_contact")} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Role *">
              <select value={form.admin_role} onChange={set("admin_role")} className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="general_admin">General Admin</option>
                <option value="customer_support">Customer Support</option>
              </select>
            </Field>
            {isEdit && (
              <Field label="Status">
                <select value={form.admin_status} onChange={set("admin_status")} className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </Field>
            )}
          </div>
          <Field label={isEdit ? "New Password (leave blank to keep)" : "Password *"}>
            <div className="relative">
              <Input type={showPass ? "text" : "password"} value={form.admin_password} onChange={set("admin_password")} className="pr-10" />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </Field>
        </div>
        <div className="flex justify-end gap-3 px-5 py-4 border-t border-gray-200 dark:border-gray-800">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-700 rounded-lg transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm text-gray-900 dark:text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-2">
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isEdit ? "Save Changes" : "Create User"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Access panel ──────────────────────────────────────────────────────────────

function AccessPanel({ user, saccos, onClose }) {
  const api = useAdminAxios();
  const [access, setAccess]   = useState(user.sacco_access ?? []);
  const [saving, setSaving]   = useState(false);
  const [error,  setError]    = useState("");

  const toggle = async (saccoId) => {
    const has = access.includes(saccoId);
    setSaving(true); setError("");
    try {
      const res = has
        ? await api.delete(`/admin/users/${user.admin_user_id}/access`, { data: { sacco_ids: [saccoId] } })
        : await api.post(`/admin/users/${user.admin_user_id}/access`, { sacco_ids: [saccoId] });
      setAccess(res.data?.data?.sacco_access ?? []);
    } catch (err) {
      const msg = err?.response?.data?.messages;
      setError(Array.isArray(msg) ? msg.join(" ") : (msg ?? "Failed to update access."));
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">SACCO Access</h2>
            <p className="text-xs text-gray-500">{user.admin_firstname} {user.admin_lastname}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900 dark:hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-3 max-h-96 overflow-y-auto">
          {error && <div className="flex gap-2 text-red-400 bg-red-900/20 border border-red-800/30 rounded-lg px-3 py-2 text-sm"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
          {saccos.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No SACCOs loaded.</p>}
          {saccos.map((s) => {
            const has = access.includes(s.sacco_id);
            return (
              <button key={s.sacco_id} onClick={() => toggle(s.sacco_id)} disabled={saving} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:bg-gray-800 transition-colors disabled:opacity-50 text-left">
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${has ? "bg-indigo-600 border-indigo-600" : "border-gray-600"}`}>
                  {has && <CheckCircle2 className="w-3 h-3 text-gray-900 dark:text-white" />}
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-500 shrink-0" />
                  <span className="text-sm text-gray-900 dark:text-white">{s.sacco_name}</span>
                  <span className="text-xs text-gray-500">#{s.sacco_id}</span>
                </div>
              </button>
            );
          })}
        </div>
        <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-800 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-900 dark:text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors">Done</button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminUsers() {
  const api = useAdminAxios();
  const { adminAuth } = useAdminAuth();
  const currentAdmin = adminAuth?.admin ?? {};
  const isGeneralAdmin = currentAdmin.admin_role === "general_admin";
  const [users,   setUsers]   = useState([]);
  const [saccos,  setSaccos]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [form,    setForm]    = useState(null);  // null | 'new' | user obj
  const [access,  setAccess]  = useState(null);  // user with sacco_access[]

  const loadUsers = () => {
    api.get("/admin/users")
      .then((r) => setUsers(r.data?.data?.users ?? []))
      .catch((e) => setError(e?.response?.data?.messages?.[0] ?? "Failed to load users"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadUsers();
    // Load SACCO list for access panel (just names + IDs)
    api.get("/admin/saccos", { params: { per_page: 100 } })
      .then((r) => setSaccos(r.data?.data?.saccos ?? []));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openAccess = async (user) => {
    const res = await api.get(`/admin/users/${user.admin_user_id}`);
    setAccess({ ...res.data?.data?.user, sacco_access: res.data?.data?.sacco_access ?? [] });
  };

  const handleDeactivate = async (u) => {
    if (!confirm(`Deactivate ${u.admin_firstname} ${u.admin_lastname}?`)) return;
    try {
      await api.delete(`/admin/users/${u.admin_user_id}`);
      loadUsers();
    } catch (err) {
      alert(err?.response?.data?.messages?.[0] ?? "Failed to deactivate.");
    }
  };

  const handleDisable2fa = async (u) => {
    if (!confirm(`Disable 2FA for ${u.admin_firstname} ${u.admin_lastname}?`)) return;
    try {
      await api.delete(`/admin/users/${u.admin_user_id}/2fa`);
      loadUsers();
    } catch (err) {
      alert(err?.response?.data?.messages?.[0] ?? "Failed to disable 2FA.");
    }
  };

  const handleSave = (savedUser) => {
    setForm(null);
    loadUsers();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Users</h1>
          <p className="text-sm text-gray-500 mt-0.5">{users.length} system administrators</p>
        </div>
        <button
          onClick={() => setForm("new")}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> New Admin
        </button>
      </div>

      {error && (
        <div className="flex gap-3 text-red-400 bg-red-900/20 border border-red-800/30 rounded-lg p-4">
          <AlertCircle className="w-5 h-5 shrink-0" /><p className="text-sm">{error}</p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-8 h-8 text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No admin users yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-500 uppercase tracking-wide border-b border-gray-200 dark:border-gray-800">
              <tr>
                <th className="px-5 py-3 text-left">Name</th>
                <th className="px-5 py-3 text-left">Email</th>
                <th className="px-5 py-3 text-left">Role</th>
                <th className="px-5 py-3 text-center">Status</th>
                <th className="px-5 py-3 text-center">Last Login</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800/60">
              {users.map((u) => (
                <tr key={u.admin_user_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 dark:text-white">{u.admin_firstname} {u.admin_lastname}</p>
                      {u.two_factor_enabled
                        ? <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-medium">2FA</span>
                        : u.two_factor_method
                          ? <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-medium">2FA?</span>
                          : null
                      }
                    </div>
                    <p className="text-xs text-gray-500">{u.admin_contact || "—"}</p>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400 text-xs">{u.admin_email}</td>
                  <td className="px-5 py-3.5"><RoleBadge role={u.admin_role} /></td>
                  <td className="px-5 py-3.5 text-center">
                    {u.admin_status === "active"
                      ? <span className="flex items-center justify-center gap-1 text-emerald-400 text-xs"><CheckCircle2 className="w-3 h-3" /> Active</span>
                      : <span className="flex items-center justify-center gap-1 text-gray-500 text-xs"><XCircle className="w-3 h-3" /> Inactive</span>}
                  </td>
                  <td className="px-5 py-3.5 text-center text-xs text-gray-500">
                    {u.last_login ? new Date(u.last_login).toLocaleDateString() : "Never"}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      {u.admin_role === "customer_support" && (
                        <button onClick={() => openAccess(u)} className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1" title="Manage SACCO access">
                          <Building2 className="w-3.5 h-3.5" /> Access
                        </button>
                      )}
                      <button onClick={() => setForm(u)} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </button>
                      {isGeneralAdmin && u.admin_user_id !== currentAdmin.admin_user_id && (
                        <button
                          onClick={() => handleDisable2fa(u)}
                          disabled={!u.two_factor_enabled && !u.two_factor_method}
                          className={`text-xs flex items-center gap-1 ${
                            u.two_factor_enabled || u.two_factor_method
                              ? "text-amber-400 hover:text-amber-300"
                              : "text-gray-400 cursor-not-allowed opacity-50"
                          }`}
                          title={u.two_factor_enabled || u.two_factor_method ? "Disable 2FA" : "2FA not configured"}
                        >
                          <ShieldOff className="w-3.5 h-3.5" /> Disable 2FA
                        </button>
                      )}
                      {u.admin_status === "active" && (
                        <button onClick={() => handleDeactivate(u)} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                          <UserX className="w-3.5 h-3.5" /> Deactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {form && (
        <UserForm
          user={form === "new" ? null : form}
          saccos={saccos}
          onSave={handleSave}
          onClose={() => setForm(null)}
        />
      )}
      {access && (
        <AccessPanel
          user={access}
          saccos={saccos}
          onClose={() => setAccess(null)}
        />
      )}
    </div>
  );
}

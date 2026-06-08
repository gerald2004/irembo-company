/* eslint-disable react/prop-types */
import { useEffect, useState, useCallback } from "react";
import {
  Shield, Activity, Radio, Ticket, Search, Plus, X, CheckCircle2,
  XCircle, Loader2, AlertCircle, ChevronLeft, ChevronRight,
  RefreshCw, Wifi, WifiOff, Mail, MessageSquare, Zap, ToggleLeft,
  ToggleRight, Edit2, Trash2, Clock, Globe, Lock, Unlock,
  Monitor, AlertTriangle, LogOut, User, ShieldCheck, Save, Copy,
} from "lucide-react";
import useAdminAxios from "@/MiddleWares/Hooks/useAdminAxios";
import { DatePickerField } from "@/components/ui/date-picker";

// ── Helpers ────────────────────────────────────────────────────────────────────

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-UG", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const fmtDateTime = (d) =>
  d ? new Date(d).toLocaleString("en-UG", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

function Pager({ page, total, perPage, onPage }) {
  const pages = Math.ceil(total / perPage);
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-800">
      <span className="text-xs text-gray-500">{total} total · page {page} of {pages}</span>
      <div className="flex gap-1">
        <button disabled={page <= 1} onClick={() => onPage(page - 1)}
          className="p-1 rounded text-gray-500 hover:text-gray-900 dark:hover:text-white disabled:opacity-30">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button disabled={page >= pages} onClick={() => onPage(page + 1)}
          className="p-1 rounded text-gray-500 hover:text-gray-900 dark:hover:text-white disabled:opacity-30">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function SeverityBadge({ v }) {
  const map = {
    critical: "bg-red-500/10 text-red-400 border border-red-500/20",
    high:     "bg-orange-500/10 text-orange-400 border border-orange-500/20",
    medium:   "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
    low:      "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[v] ?? "bg-gray-500/10 text-gray-400"}`}>
      {v}
    </span>
  );
}

const TABS = [
  { id: "security",  label: "Security",      icon: Shield },
  { id: "activity",  label: "Activity",      icon: Activity },
  { id: "providers", label: "Providers",     icon: Radio },
  { id: "tickets",   label: "Tickets",       icon: Ticket },
  { id: "qms",       label: "QMS Policies",  icon: ShieldCheck },
];

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function AdminSystemSettings() {
  const [tab, setTab] = useState("security");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">System Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Security, rate limits, providers, and platform configuration
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-900 rounded-xl p-1 w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === id
                ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === "security"  && <SecurityTab />}
      {tab === "activity"  && <ActivityTab />}
      {tab === "providers" && <ProvidersTab />}
      {tab === "tickets"   && <TicketsTab />}
      {tab === "qms"       && <QmsPoliciesTab />}
    </div>
  );
}

// ── Security Tab ───────────────────────────────────────────────────────────────

function SecurityTab() {
  const api = useAdminAxios();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  // Add IP block form
  const [showAdd,  setShowAdd]  = useState(false);
  const [ipForm,   setIpForm]   = useState({ ip_address: "", reason: "", block_type: "temporary", blocked_until: "" });
  const [saving,   setSaving]   = useState(false);
  const [formErr,  setFormErr]  = useState("");

  // Inline edit for rate limit rule
  const [editRule, setEditRule] = useState(null);

  // Active sessions
  const [sessions,        setSessions]        = useState(null);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [forcingOut,      setForcingOut]      = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const r = await api.get("/admin/system/security");
      setData(r.data?.data);
    } catch (e) {
      setError(e.response?.data?.messages?.[0] ?? "Failed to load security data");
    } finally {
      setLoading(false);
    }
  }, [api]);

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const r = await api.get("/admin/system/sessions");
      setSessions(r.data?.data);
    } catch {
      setSessions({ sessions: [], suspicious: 0 });
    } finally {
      setSessionsLoading(false);
    }
  }, [api]);

  const forceLogout = async (sessionId) => {
    setForcingOut(sessionId);
    try {
      await api.delete(`/admin/system/sessions/${sessionId}`);
      setSessions(d => ({ ...d, sessions: d.sessions.filter(s => s.id !== sessionId) }));
    } catch {} finally {
      setForcingOut(null);
    }
  };

  useEffect(() => { load(); loadSessions(); }, [load, loadSessions]); // eslint-disable-line

  const addIpBlock = async () => {
    if (!ipForm.ip_address || !ipForm.reason) { setFormErr("IP address and reason are required"); return; }
    setSaving(true); setFormErr("");
    try {
      await api.post("/admin/system/security", ipForm);
      setShowAdd(false);
      setIpForm({ ip_address: "", reason: "", block_type: "temporary", blocked_until: "" });
      load();
    } catch (e) {
      setFormErr(e.response?.data?.messages?.[0] ?? "Failed to add IP block");
    } finally {
      setSaving(false);
    }
  };

  const unblockIp = async (id) => {
    try {
      await api.delete(`/admin/system/security/${id}`);
      setData(d => ({ ...d, ip_blocks: d.ip_blocks.filter(b => b.id !== id) }));
    } catch {}
  };

  const toggleRule = async (rule) => {
    const updated = { is_active: !rule.is_active };
    try {
      const r = await api.put(`/admin/system/security/${rule.id}`, updated);
      const newRule = r.data?.data?.rule;
      setData(d => ({ ...d, rate_limit_rules: d.rate_limit_rules.map(x => x.id === rule.id ? { ...x, ...newRule } : x) }));
    } catch {}
  };

  const saveRule = async () => {
    if (!editRule) return;
    try {
      const r = await api.put(`/admin/system/security/${editRule.id}`, {
        max_attempts:   editRule.max_attempts,
        window_seconds: editRule.window_seconds,
        block_seconds:  editRule.block_seconds,
      });
      const newRule = r.data?.data?.rule;
      setData(d => ({ ...d, rate_limit_rules: d.rate_limit_rules.map(x => x.id === editRule.id ? { ...x, ...newRule } : x) }));
      setEditRule(null);
    } catch {}
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>;
  if (error)   return <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-600 dark:text-red-400 text-sm"><AlertCircle className="w-4 h-4" />{error}</div>;

  const activeBlocks  = data?.ip_blocks?.filter(b => b.is_active) ?? [];
  const recentHits    = data?.recent_hits ?? [];
  const rateLimitRules = data?.rate_limit_rules ?? [];

  return (
    <div className="space-y-6">
      {/* Rate Limit Rules */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Rate Limit Rules</h2>
            <p className="text-xs text-gray-500 mt-0.5">{rateLimitRules.length} rules — controls how many requests are allowed per endpoint</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                {["Rule", "Endpoint", "Max Attempts", "Window", "Block For", "Scope", "Status", ""].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {rateLimitRules.map(rule => (
                <tr key={rule.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{rule.name}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{rule.endpoint}</td>
                  <td className="px-4 py-3">
                    {editRule?.id === rule.id
                      ? <input type="number" value={editRule.max_attempts} onChange={e => setEditRule(r => ({...r, max_attempts: +e.target.value}))}
                          className="w-20 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs" />
                      : <span className="text-gray-900 dark:text-white">{rule.max_attempts}</span>
                    }
                  </td>
                  <td className="px-4 py-3">
                    {editRule?.id === rule.id
                      ? <input type="number" value={editRule.window_seconds} onChange={e => setEditRule(r => ({...r, window_seconds: +e.target.value}))}
                          className="w-20 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs" />
                      : <span className="text-gray-500">{rule.window_seconds}s</span>
                    }
                  </td>
                  <td className="px-4 py-3">
                    {editRule?.id === rule.id
                      ? <input type="number" value={editRule.block_seconds} onChange={e => setEditRule(r => ({...r, block_seconds: +e.target.value}))}
                          className="w-20 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs" />
                      : <span className="text-gray-500">{rule.block_seconds}s</span>
                    }
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded-full">{rule.scope}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleRule(rule)}>
                      {rule.is_active
                        ? <ToggleRight className="w-5 h-5 text-emerald-500" />
                        : <ToggleLeft  className="w-5 h-5 text-gray-400" />}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    {editRule?.id === rule.id ? (
                      <div className="flex gap-1">
                        <button onClick={saveRule} className="text-xs px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded">Save</button>
                        <button onClick={() => setEditRule(null)} className="text-xs px-2 py-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setEditRule({ ...rule })} className="text-gray-400 hover:text-indigo-400">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* IP Blocks */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white text-sm">IP Blocks</h2>
            <p className="text-xs text-gray-500 mt-0.5">{activeBlocks.length} active block{activeBlocks.length !== 1 ? "s" : ""}</p>
          </div>
          <button onClick={() => { setShowAdd(true); setFormErr(""); }}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg">
            <Plus className="w-3.5 h-3.5" /> Block IP
          </button>
        </div>

        {showAdd && (
          <div className="p-5 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <input placeholder="IP address (e.g. 192.168.1.1)" value={ipForm.ip_address}
                onChange={e => setIpForm(f => ({...f, ip_address: e.target.value}))}
                className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <input placeholder="Reason" value={ipForm.reason}
                onChange={e => setIpForm(f => ({...f, reason: e.target.value}))}
                className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <select value={ipForm.block_type} onChange={e => setIpForm(f => ({...f, block_type: e.target.value}))}
                className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm">
                <option value="temporary">Temporary</option>
                <option value="permanent">Permanent</option>
              </select>
              {ipForm.block_type === "temporary" && (
                <DatePickerField value={ipForm.blocked_until} onChange={v => setIpForm(f => ({...f, blocked_until: v}))} placeholder="Block until" />
              )}
            </div>
            {formErr && <p className="text-xs text-red-400 mt-2">{formErr}</p>}
            <div className="flex gap-2 mt-3">
              <button onClick={addIpBlock} disabled={saving}
                className="flex items-center gap-1.5 text-sm px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg disabled:opacity-50">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                Block IP
              </button>
              <button onClick={() => setShowAdd(false)} className="text-sm px-4 py-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">Cancel</button>
            </div>
          </div>
        )}

        {activeBlocks.length === 0 ? (
          <div className="py-10 text-center text-gray-400 text-sm">No active IP blocks</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                {["IP Address", "Reason", "Type", "Blocked Until", ""].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {activeBlocks.map(b => (
                <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 font-mono text-gray-900 dark:text-white font-medium">{b.ip_address}</td>
                  <td className="px-4 py-3 text-gray-500">{b.reason}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${b.block_type === "permanent" ? "bg-red-500/10 text-red-400" : "bg-yellow-500/10 text-yellow-400"}`}>
                      {b.block_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{b.blocked_until ? fmtDateTime(b.blocked_until) : "—"}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => unblockIp(b.id)} className="flex items-center gap-1 text-xs text-emerald-500 hover:text-emerald-400">
                      <Unlock className="w-3.5 h-3.5" /> Unblock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Recent Rate-limit Hits */}
      {recentHits.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Rate-limit Hot-spots (last 24h)</h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {recentHits.map((h, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3">
                <span className="font-mono text-sm text-gray-900 dark:text-white">{h.ip_address}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">Last: {fmtDateTime(h.last_hit)}</span>
                  <span className="text-xs px-2 py-0.5 bg-red-500/10 text-red-400 rounded-full font-bold">{h.hit_count} hits</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Sessions */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white text-sm flex items-center gap-2">
              <Monitor className="w-4 h-4 text-indigo-400" />
              Active Sessions
              {sessions?.suspicious > 0 && (
                <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-orange-500/10 text-orange-400 rounded-full border border-orange-500/20">
                  <AlertTriangle className="w-3 h-3" /> {sessions.suspicious} suspicious
                </span>
              )}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">{(sessions?.sessions ?? []).length} active session{(sessions?.sessions ?? []).length !== 1 ? "s" : ""} — sessions with IP changes &gt; 2 are flagged</p>
          </div>
          <button onClick={loadSessions} disabled={sessionsLoading} className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40">
            <RefreshCw className={`w-4 h-4 ${sessionsLoading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {sessionsLoading ? (
          <div className="py-10 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-indigo-400" /></div>
        ) : (sessions?.sessions ?? []).length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">No active sessions</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {["User", "SACCO", "Device", "Location", "IP Address", "Login At", "Last Active", "IP Changes", ""].map(h => (
                    <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {(sessions?.sessions ?? []).map(s => {
                  const suspicious = s.ip_change_count > 2;
                  return (
                    <tr key={s.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 ${suspicious ? "bg-orange-500/5" : ""}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-indigo-600/20 flex items-center justify-center shrink-0">
                            <User className="w-3 h-3 text-indigo-400" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-900 dark:text-white">{s.user_name ?? "—"}</p>
                            <p className="text-[10px] text-gray-500 truncate max-w-[120px]">{s.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{s.sacco_name ?? "—"}</td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-gray-900 dark:text-white">{s.browser ?? "—"}</p>
                        <p className="text-[10px] text-gray-500">{s.os ?? ""}</p>
                      </td>
                      <td className="px-4 py-3">
                        {s.country ? (
                          <>
                            <p className="text-xs text-gray-900 dark:text-white">{s.country}</p>
                            <p className="text-[10px] text-gray-500">{s.city ?? ""}</p>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-900 dark:text-white">{s.ip_address}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{fmtDateTime(s.login_at)}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{fmtDateTime(s.last_seen_at)}</td>
                      <td className="px-4 py-3 text-center">
                        {suspicious ? (
                          <span className="flex items-center gap-1 justify-center text-xs font-bold text-orange-400">
                            <AlertTriangle className="w-3 h-3" />{s.ip_change_count}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">{s.ip_change_count}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => forceLogout(s.id)}
                          disabled={forcingOut === s.id}
                          className="flex items-center gap-1 text-xs text-red-500 hover:text-red-400 disabled:opacity-40"
                        >
                          {forcingOut === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <LogOut className="w-3 h-3" />}
                          Force out
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Activity Tab ───────────────────────────────────────────────────────────────

function ActivityTab() {
  const api = useAdminAxios();
  const [data,     setData]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [page,     setPage]     = useState(1);
  const [severity, setSeverity] = useState("");
  const [type,     setType]     = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo,   setDateTo]   = useState("");

  const load = useCallback(async (pg = 1, sev = severity, evType = type, from = dateFrom, to = dateTo) => {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams({ page: pg });
      if (sev)    params.append("severity",   sev);
      if (evType) params.append("event_type", evType);
      if (from)   params.append("date_from",  from);
      if (to)     params.append("date_to",    to);
      const r = await api.get(`/admin/system/activity?${params}`);
      setData(r.data?.data);
      setPage(pg);
    } catch (e) {
      setError(e.response?.data?.messages?.[0] ?? "Failed to load activity");
    } finally {
      setLoading(false);
    }
  }, [api, severity, type, dateFrom, dateTo]);

  useEffect(() => { load(); }, []);

  const applyFilters = () => load(1, severity, type, dateFrom, dateTo);

  const SEVERITY_COLORS = {
    critical: "bg-red-500",
    high:     "bg-orange-500",
    medium:   "bg-yellow-500",
    low:      "bg-blue-500",
  };

  const summaryTotal = Object.values(data?.severity_summary ?? {}).reduce((s, v) => s + v, 0);

  return (
    <div className="space-y-6">
      {/* Severity summary */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {["critical", "high", "medium", "low"].map(sev => (
            <div key={sev} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 cursor-pointer hover:border-indigo-400 transition-colors"
              onClick={() => { setSeverity(sev === severity ? "" : sev); load(1, sev === severity ? "" : sev, type, dateFrom, dateTo); }}>
              <div className={`w-2.5 h-2.5 rounded-full mb-2 ${SEVERITY_COLORS[sev]}`} />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{data.severity_summary?.[sev] ?? 0}</p>
              <p className="text-xs text-gray-500 capitalize mt-0.5">{sev} (7d)</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <select value={severity} onChange={e => setSeverity(e.target.value)}
          className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm">
          <option value="">All severities</option>
          {["critical","high","medium","low"].map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
        <input placeholder="Event type filter" value={type} onChange={e => setType(e.target.value)}
          onKeyDown={e => e.key === "Enter" && applyFilters()}
          className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        <DatePickerField value={dateFrom} onChange={setDateFrom} placeholder="From date" clearable />
        <DatePickerField value={dateTo}   onChange={setDateTo}   placeholder="To date"   clearable />
        <button onClick={applyFilters} className="flex items-center gap-1.5 text-sm px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg">
          <Search className="w-3.5 h-3.5" /> Filter
        </button>
        {(severity || type || dateFrom || dateTo) && (
          <button onClick={() => { setSeverity(""); setType(""); setDateFrom(""); setDateTo(""); load(1,"","","",""); }}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex items-center gap-1">
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {/* Events table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>
        ) : error ? (
          <div className="p-4 text-red-400 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    {["Time", "IP", "User", "Event", "Severity", "Message"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {(data?.events ?? []).map(ev => (
                    <tr key={ev.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                      ev.severity === "critical" ? "bg-red-50/50 dark:bg-red-900/10" : ""
                    }`}>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">{fmtDateTime(ev.created_at)}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-900 dark:text-white">{ev.ip_address || "—"}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{ev.user_name || `#${ev.user_id}` || "—"}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white text-xs">{ev.event_type}</td>
                      <td className="px-4 py-3"><SeverityBadge v={ev.severity} /></td>
                      <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">{ev.message}</td>
                    </tr>
                  ))}
                  {(data?.events ?? []).length === 0 && (
                    <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm">No events found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pager page={page} total={data?.total ?? 0} perPage={30} onPage={p => load(p)} />
          </>
        )}
      </div>

      {/* Top event types */}
      {(data?.top_types ?? []).length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Top Event Types (7 days)</h3>
          <div className="space-y-2">
            {data.top_types.map(t => {
              const max = data.top_types[0]?.count ?? 1;
              const pct = Math.round((t.count / max) * 100);
              return (
                <div key={t.event_type} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-48 truncate font-mono">{t.event_type}</span>
                  <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                    <div className="bg-indigo-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-medium text-gray-900 dark:text-white w-8 text-right">{t.count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Providers Tab ──────────────────────────────────────────────────────────────

const PROVIDER_LOGOS = {
  mailtrap:        { bg: "bg-yellow-500/10",  text: "text-yellow-400",  label: "MT" },
  resend:          { bg: "bg-purple-500/10",  text: "text-purple-400",  label: "RS" },
  smtp:            { bg: "bg-blue-500/10",    text: "text-blue-400",    label: "SM" },
  ismsug:          { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "iS" },
  egosms:          { bg: "bg-orange-500/10",  text: "text-orange-400",  label: "EG" },
  africas_talking: { bg: "bg-indigo-500/10",  text: "text-indigo-400",  label: "AT" },
  pandora:         { bg: "bg-rose-500/10",    text: "text-rose-400",    label: "PN" },
};

const MSG_STATUS = {
  N: { label: "Unsent",  cls: "bg-gray-500/10 text-gray-400" },
  Q: { label: "Queued",  cls: "bg-blue-500/10 text-blue-400" },
  Y: { label: "Sent",    cls: "bg-emerald-500/10 text-emerald-400" },
  B: { label: "Bounced", cls: "bg-orange-500/10 text-orange-400" },
  F: { label: "Failed",  cls: "bg-red-500/10 text-red-400" },
};

function ProviderCard({ p, type, onSwitch, switching }) {
  const logo = PROVIDER_LOGOS[p.id] ?? { bg: "bg-gray-500/10", text: "text-gray-400", label: "??" };
  return (
    <div className={`rounded-xl border-2 p-4 transition-all ${
      p.is_active ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20" : "border-gray-200 dark:border-gray-700"
    }`}>
      <div className="flex items-start gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl ${logo.bg} flex items-center justify-center shrink-0`}>
          <span className={`text-xs font-bold ${logo.text}`}>{logo.label}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 dark:text-white text-sm">{p.name}</p>
          {p.username && <p className="text-[10px] text-gray-500 mt-0.5 truncate">{p.username}</p>}
          {p.host    && <p className="text-[10px] text-gray-500 truncate">{p.host}:{p.port}</p>}
          {p.from    && <p className="text-[10px] text-gray-500 truncate">From: {p.from}</p>}
          {p.env     && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded mt-1 inline-block ${
              p.env === "sandbox" ? "bg-yellow-500/10 text-yellow-400" : "bg-emerald-500/10 text-emerald-400"
            }`}>{p.env}</span>
          )}
        </div>
        <div className="shrink-0">
          {p.is_active
            ? <span className="flex items-center gap-1 text-xs text-emerald-500 font-medium"><CheckCircle2 className="w-3 h-3" />Active</span>
            : <span className="flex items-center gap-1 text-xs text-gray-400"><XCircle className="w-3 h-3" />Off</span>
          }
        </div>
      </div>
      {!p.is_active && (
        <button onClick={() => onSwitch(type, p.id)} disabled={switching === p.id}
          className="w-full text-xs py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-50 flex items-center justify-center gap-1.5">
          {switching === p.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
          Set Active
        </button>
      )}
    </div>
  );
}

function ProvidersTab() {
  const api = useAdminAxios();
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [switching, setSwitching] = useState(null);

  // Email log state
  const [emailPage,   setEmailPage]   = useState(1);
  const [emails,      setEmails]      = useState(null);
  const [emailStatus, setEmailStatus] = useState("F");
  const [emailSearch, setEmailSearch] = useState("");
  const [resendingE,  setResendingE]  = useState(null);

  // SMS log state
  const [smsPage,   setSmsPage]   = useState(1);
  const [smsLog,    setSmsLog]    = useState(null);
  const [smsStatus, setSmsStatus] = useState("F");
  const [smsSearch, setSmsSearch] = useState("");
  const [resendingS, setResendingS] = useState(null);

  // Active log section
  const [logSection, setLogSection] = useState("email");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const r = await api.get("/admin/system/providers");
      setData(r.data?.data);
    } catch (e) {
      setError(e.response?.data?.messages?.[0] ?? "Failed to load providers");
    } finally { setLoading(false); }
  }, [api]);

  const loadEmails = useCallback(async (pg = 1, status = emailStatus, search = emailSearch) => {
    try {
      const params = new URLSearchParams({ page: pg });
      if (status) params.append("status", status);
      if (search) params.append("search", search);
      const r = await api.get(`/admin/system/emails?${params}`);
      setEmails(r.data?.data);
      setEmailPage(pg);
    } catch {}
  }, [api, emailStatus, emailSearch]);

  const loadSms = useCallback(async (pg = 1, status = smsStatus, search = smsSearch) => {
    try {
      const params = new URLSearchParams({ page: pg });
      if (status) params.append("status", status);
      if (search) params.append("search", search);
      const r = await api.get(`/admin/system/sms?${params}`);
      setSmsLog(r.data?.data);
      setSmsPage(pg);
    } catch {}
  }, [api, smsStatus, smsSearch]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadEmails(); loadSms(); }, []); // eslint-disable-line

  const switchProvider = async (type, providerId) => {
    setSwitching(providerId);
    try { await api.put("/admin/system/providers", { type, provider: providerId }); load(); }
    catch {} finally { setSwitching(null); }
  };

  const resendEmail = async (id) => {
    setResendingE(id);
    try { await api.post(`/admin/system/emails/${id}`); loadEmails(emailPage); }
    catch {} finally { setResendingE(null); }
  };

  const resendSmsItem = async (id) => {
    setResendingS(id);
    try { await api.post(`/admin/system/sms/${id}`); loadSms(smsPage); }
    catch {} finally { setResendingS(null); }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>;
  if (error)   return <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-400 text-sm">{error}</div>;

  const activeEmail = data?.active_email ?? "";

  return (
    <div className="space-y-6">

      {/* SMS Providers */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white text-sm flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-400" /> SMS Providers
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Switch which provider handles outgoing SMS messages</p>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(data?.sms_providers ?? []).length === 0
            ? <p className="text-sm text-gray-400 col-span-3 py-4 text-center">No SMS providers configured in .env</p>
            : (data?.sms_providers ?? []).map(p => (
                <ProviderCard key={p.id} p={p} type="sms" onSwitch={switchProvider} switching={switching} />
              ))
          }
        </div>
      </div>

      {/* Email Providers */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-white text-sm flex items-center gap-2">
            <Mail className="w-4 h-4 text-blue-400" /> Email Providers
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Active: <span className="font-medium text-indigo-400 capitalize">{activeEmail || "—"}</span>
          </p>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(data?.email_providers ?? []).length === 0
            ? <p className="text-sm text-gray-400 col-span-3 py-4 text-center">No email providers configured in .env</p>
            : (data?.email_providers ?? []).map(p => (
                <ProviderCard key={p.id} p={p} type="email" onSwitch={switchProvider} switching={switching} />
              ))
          }
        </div>
        {data?.email_stats && (
          <div className="px-5 pb-4 flex flex-wrap gap-2">
            {Object.entries(data.email_stats).map(([s, c]) => (
              <span key={s} className={`text-xs px-2.5 py-1 rounded-full font-medium ${MSG_STATUS[s]?.cls ?? "bg-gray-500/10 text-gray-400"}`}>
                {MSG_STATUS[s]?.label ?? s}: {c}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Message Logs — SMS + Email */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Message Logs</h2>
            <p className="text-xs text-gray-500 mt-0.5">View and resend failed or unsent messages across all SACCOs</p>
          </div>
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {[["email","Email"],["sms","SMS"]].map(([id, label]) => (
              <button key={id} onClick={() => setLogSection(id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  logSection === id ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}>{label}</button>
            ))}
          </div>
        </div>

        {/* Email log */}
        {logSection === "email" && (
          <>
            <div className="flex flex-wrap gap-2 px-5 py-3 border-b border-gray-100 dark:border-gray-800">
              <input placeholder="Search email or subject…" value={emailSearch}
                onChange={e => setEmailSearch(e.target.value)}
                onKeyDown={e => e.key === "Enter" && loadEmails(1)}
                className="bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm flex-1 min-w-[160px] focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <select value={emailStatus} onChange={e => { setEmailStatus(e.target.value); loadEmails(1, e.target.value); }}
                className="bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white">
                <option value="">All statuses</option>
                {Object.entries(MSG_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <button onClick={() => loadEmails(1)} className="text-sm px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5" /> Search
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    {["To", "Subject", "SACCO", "Status", "Date", ""].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {(emails?.emails ?? []).map(e => (
                    <tr key={e.email_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3 text-gray-900 dark:text-white text-xs max-w-[160px] truncate">{e.email_address}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs max-w-[200px] truncate">{e.email_subject}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{e.sacco_name || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${MSG_STATUS[e.email_status]?.cls ?? "bg-gray-500/10 text-gray-400"}`}>
                          {MSG_STATUS[e.email_status]?.label ?? e.email_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{fmtDateTime(e.email_timestamp)}</td>
                      <td className="px-4 py-3">
                        {["F","B","N"].includes(e.email_status) && (
                          <button onClick={() => resendEmail(e.email_id)} disabled={resendingE === e.email_id}
                            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 disabled:opacity-40">
                            {resendingE === e.email_id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                            Resend
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(emails?.emails ?? []).length === 0 && (
                    <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm">No emails found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pager page={emailPage} total={emails?.total ?? 0} perPage={25} onPage={p => loadEmails(p)} />
          </>
        )}

        {/* SMS log */}
        {logSection === "sms" && (
          <>
            <div className="flex flex-wrap gap-2 px-5 py-3 border-b border-gray-100 dark:border-gray-800">
              <input placeholder="Search phone or message…" value={smsSearch}
                onChange={e => setSmsSearch(e.target.value)}
                onKeyDown={e => e.key === "Enter" && loadSms(1)}
                className="bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm flex-1 min-w-[160px] focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              <select value={smsStatus} onChange={e => { setSmsStatus(e.target.value); loadSms(1, e.target.value); }}
                className="bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white">
                <option value="">All statuses</option>
                {Object.entries(MSG_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <button onClick={() => loadSms(1)} className="text-sm px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5" /> Search
              </button>
            </div>
            {smsLog?.stats && (
              <div className="px-5 py-3 flex flex-wrap gap-2 border-b border-gray-100 dark:border-gray-800">
                {[["total","Total","bg-gray-500/10 text-gray-400"],["sent","Sent","bg-emerald-500/10 text-emerald-400"],["failed","Failed","bg-red-500/10 text-red-400"],["pending","Pending","bg-amber-500/10 text-amber-400"]].map(([k,l,cls]) => (
                  <span key={k} className={`text-xs px-2.5 py-1 rounded-full font-medium ${cls}`}>{l}: {smsLog.stats[k] ?? 0}</span>
                ))}
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    {["Phone", "Message", "SACCO", "Status", "Date", ""].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {(smsLog?.sms ?? []).map(s => (
                    <tr key={s.sms_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3 text-gray-900 dark:text-white text-xs font-mono">{s.sms_contact}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs max-w-[220px] truncate">{s.preview}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{s.sacco_name || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${MSG_STATUS[s.sms_status]?.cls ?? "bg-gray-500/10 text-gray-400"}`}>
                          {MSG_STATUS[s.sms_status]?.label ?? s.sms_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{fmtDateTime(s.sms_timestamp)}</td>
                      <td className="px-4 py-3">
                        {["F","B","N"].includes(s.sms_status) && (
                          <button onClick={() => resendSmsItem(s.sms_id)} disabled={resendingS === s.sms_id}
                            className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 disabled:opacity-40">
                            {resendingS === s.sms_id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                            Resend
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(smsLog?.sms ?? []).length === 0 && (
                    <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm">No SMS found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pager page={smsPage} total={smsLog?.total ?? 0} perPage={25} onPage={p => loadSms(p)} />
          </>
        )}
      </div>
    </div>
  );
}

// ── Tickets Tab ────────────────────────────────────────────────────────────────

function TicketsTab() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-5">
        <Ticket className="w-8 h-8 text-indigo-400" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Tickets Coming Soon</h2>
      <p className="text-sm text-gray-500 max-w-sm">
        The ticketing system is under development. You&apos;ll be able to create, assign,
        and track support tickets for SACCOs directly from here.
      </p>
      <div className="mt-6 flex gap-2 text-xs text-gray-400">
        <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">Open/Close tickets</span>
        <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">Priority levels</span>
        <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">SACCO assignment</span>
        <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">Email notifications</span>
      </div>
    </div>
  );
}

// ── QMS Policies Tab ───────────────────────────────────────────────────────────

const MODULE_LABELS = {
  deposit:               "Deposit",
  withdrawal:            "Withdrawal",
  loan_disbursement:     "Loan Disbursement",
  loan_repayment:        "Loan Repayment",
  cash_transfer:         "Cash Transfer",
  inter_branch_transfer: "Inter-Branch Transfer",
  journal_entry:         "Manual Journal Entry",
  income:                "External Income",
  expense:               "Expense",
  shares:                "Shares",
  fixed_deposit:         "Fixed Deposit",
  asset:                 "Asset Registration",
  vendor_payment:        "Vendor Payment",
  compulsory_saving:     "Compulsory Saving",
};

function AdminPolicyRow({ policy, onSave, savingId }) {
  const [form, setForm] = useState({
    requires_approval: !!policy.requires_approval,
    is_active:         !!policy.is_active,
    min_amount:        String(policy.min_amount ?? "0"),
    max_amount:        policy.max_amount != null ? String(policy.max_amount) : "",
    auto_approve_self: !!policy.auto_approve_self,
    notify_on_pending: !!policy.notify_on_pending,
  });
  const [dirty, setDirty] = useState(false);

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setDirty(true); };
  const isSaving = savingId === policy.id;

  const handleSave = () => {
    onSave(policy.id, {
      requires_approval: form.requires_approval,
      is_active:         form.is_active,
      auto_approve_self: form.auto_approve_self,
      notify_on_pending: form.notify_on_pending,
      min_amount:        parseFloat(form.min_amount) || 0,
      max_amount:        form.max_amount !== "" ? parseFloat(form.max_amount) : null,
    });
    setDirty(false);
  };

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-3 ${!form.is_active ? "opacity-60" : ""}`}>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="min-w-[180px] flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {MODULE_LABELS[policy.source_module] ?? policy.source_module}
          </p>
          <p className="text-[10px] text-gray-400 font-mono">{policy.source_module}</p>
        </div>

        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={form.requires_approval}
            onChange={e => set("requires_approval", e.target.checked)}
            className="w-4 h-4 rounded accent-indigo-500" />
          <span className="text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">Requires Approval</span>
        </label>

        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={form.auto_approve_self}
            onChange={e => set("auto_approve_self", e.target.checked)}
            className="w-4 h-4 rounded accent-indigo-500" />
          <span className="text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">Self-Approve</span>
        </label>

        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={form.notify_on_pending}
            onChange={e => set("notify_on_pending", e.target.checked)}
            className="w-4 h-4 rounded accent-indigo-500" />
          <span className="text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">Notify</span>
        </label>

        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-400">Min</span>
          <input type="number" min={0} step="any" value={form.min_amount}
            onChange={e => set("min_amount", e.target.value)}
            className="w-24 h-7 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 text-gray-900 dark:text-white" />
        </div>

        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-400">Max</span>
          <input type="number" min={0} step="any" value={form.max_amount}
            onChange={e => set("max_amount", e.target.value)} placeholder="Unlimited"
            className="w-24 h-7 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 text-gray-900 dark:text-white" />
        </div>

        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={form.is_active}
            onChange={e => set("is_active", e.target.checked)}
            className="w-4 h-4 rounded accent-emerald-500" />
          <span className={`text-xs whitespace-nowrap font-medium ${form.is_active ? "text-emerald-500" : "text-gray-400"}`}>
            {form.is_active ? "Active" : "Inactive"}
          </span>
        </label>

        <button onClick={handleSave} disabled={!dirty || isSaving}
          className={`flex items-center gap-1 h-7 px-3 rounded-lg text-xs font-medium transition-colors ${
            dirty ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-default"
          } disabled:opacity-40`}>
          {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
          {isSaving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

function QmsPoliciesTab() {
  const api = useAdminAxios();
  const [saccos,      setSaccos]      = useState([]);
  const [saccoId,     setSaccoId]     = useState("");
  const [policies,    setPolicies]    = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [savingId,    setSavingId]    = useState(null);
  const [copyOpen,    setCopyOpen]    = useState(false);
  const [copySource,  setCopySource]  = useState("");
  const [copyTarget,  setCopyTarget]  = useState("");
  const [copying,     setCopying]     = useState(false);

  // Load SACCO list on mount
  useEffect(() => {
    api.get("/admin/system/qms").then(r => {
      setSaccos(r.data?.data?.saccos ?? []);
    }).catch(() => {});
  }, [api]);

  // Load policies when SACCO changes
  useEffect(() => {
    if (!saccoId) { setPolicies([]); return; }
    setLoading(true);
    api.get(`/admin/system/qms?sacco_id=${saccoId}`)
      .then(r => setPolicies(r.data?.data?.policies ?? []))
      .catch(() => setPolicies([]))
      .finally(() => setLoading(false));
  }, [api, saccoId]);

  const handleSave = async (id, payload) => {
    setSavingId(id);
    try {
      await api.put(`/admin/system/qms/${id}`, payload);
      setPolicies(ps => ps.map(p => p.id === id ? { ...p, ...payload } : p));
    } catch {
      /* toast not imported here; silent fail is ok — row stays dirty */
    } finally {
      setSavingId(null);
    }
  };

  const handleCopy = async () => {
    if (!copySource || !copyTarget) return;
    setCopying(true);
    try {
      const r = await api.post("/admin/system/qms", {
        source_sacco_id: parseInt(copySource),
        target_sacco_id: parseInt(copyTarget),
      });
      const msg = r.data?.data?.message ?? "Policies copied.";
      alert(msg);
      setCopyOpen(false);
      if (saccoId === copyTarget) {
        // Refresh the current view if we just copied into the selected SACCO
        setSaccoId(""); setTimeout(() => setSaccoId(copyTarget), 10);
      }
    } catch (e) {
      alert(e?.response?.data?.messages?.[0] ?? "Copy failed.");
    } finally {
      setCopying(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            QMS Checker-Maker Policies
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            View and edit QMS policies for any SACCO. Use Copy to clone a well-configured SACCO&apos;s policies as defaults for another.
          </p>
        </div>
        <button onClick={() => setCopyOpen(true)}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700">
          <Copy className="w-3.5 h-3.5" /> Copy Policies
        </button>
      </div>

      {/* SACCO selector */}
      <div className="flex items-center gap-3">
        <label className="text-xs font-medium text-gray-500 whitespace-nowrap">Select SACCO</label>
        <select value={saccoId} onChange={e => setSaccoId(e.target.value)}
          className="flex-1 max-w-xs h-9 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm px-3 text-gray-900 dark:text-white">
          <option value="">— choose a SACCO —</option>
          {saccos.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        {saccoId && (
          <span className="text-xs text-gray-400">{policies.length} polic{policies.length !== 1 ? "ies" : "y"}</span>
        )}
      </div>

      {/* Policies list */}
      {!saccoId ? (
        <div className="py-14 text-center text-sm text-gray-400">Select a SACCO above to view its QMS policies.</div>
      ) : loading ? (
        <div className="py-14 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-indigo-400" /></div>
      ) : policies.length === 0 ? (
        <div className="py-14 text-center">
          <p className="text-sm text-gray-400 mb-3">No QMS policies configured for this SACCO.</p>
          <p className="text-xs text-gray-400">Use <strong>Copy Policies</strong> to clone from a SACCO that already has them set up.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {policies.map(p => (
            <AdminPolicyRow key={p.id} policy={p} onSave={handleSave} savingId={savingId} />
          ))}
        </div>
      )}

      {/* Copy dialog */}
      {copyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Copy className="w-4 h-4 text-indigo-400" /> Copy QMS Policies
              </h3>
              <button onClick={() => setCopyOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              All policies from the source SACCO will be copied to the target. Existing policies in the target will be overwritten.
            </p>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 mb-5">
              <p className="text-xs text-amber-400 font-medium">Copied policies are always set to Inactive.</p>
              <p className="text-xs text-amber-300/70 mt-0.5">You must manually enable each policy for the target SACCO after copying — this prevents accidentally activating QMS in SACCOs that don&apos;t need it.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Source SACCO (copy from)</label>
                <select value={copySource} onChange={e => setCopySource(e.target.value)}
                  className="w-full h-9 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm px-3 text-gray-900 dark:text-white">
                  <option value="">— select source —</option>
                  {saccos.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Target SACCO (copy to)</label>
                <select value={copyTarget} onChange={e => setCopyTarget(e.target.value)}
                  className="w-full h-9 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm px-3 text-gray-900 dark:text-white">
                  <option value="">— select target —</option>
                  {saccos.filter(s => String(s.id) !== copySource).map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setCopyOpen(false)}
                className="flex-1 h-9 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800">
                Cancel
              </button>
              <button onClick={handleCopy} disabled={!copySource || !copyTarget || copying}
                className="flex-1 h-9 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 flex items-center justify-center gap-2">
                {copying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
                {copying ? "Copying…" : "Copy Policies"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* eslint-disable react/prop-types */
import { useEffect, useState, useCallback } from "react";
import {
  Cpu, HardDrive, MemoryStick, Clock, Server, Building2,
  Users, CreditCard, Wallet, TrendingUp, AlertTriangle,
  CheckCircle2, Activity, RefreshCw, Loader2, AlertCircle,
  ArrowUpRight, ArrowDownRight, Zap, Database,
} from "lucide-react";
import useAdminAxios from "@/MiddleWares/Hooks/useAdminAxios";

// ── Helpers ────────────────────────────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_BASE_URL ?? "http://localhost:8081";
const saccoLogoUrl = (logo) => {
  if (!logo) return null;
  if (logo.startsWith("http")) return logo;
  if (logo.startsWith("/")) return `${BASE_URL}${logo}`;
  return `${BASE_URL}/${logo}`;
};

const fmt = (n) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
  : n >= 1_000   ? `${(n / 1_000).toFixed(1)}K`
  : String(n ?? 0);

const fmtCur = (n) => Number(n ?? 0).toLocaleString("en-UG", { minimumFractionDigits: 0 });

const fmtUptime = (s) => {
  if (!s) return "—";
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-UG", { day: "2-digit", month: "short" }) : "—";

// ── Gauge / Progress ───────────────────────────────────────────────────────────

function GaugeRing({ pct, color = "#6366f1", size = 80 }) {
  const r = 30;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const gapColor =
    pct >= 85 ? "#ef4444"
    : pct >= 65 ? "#f97316"
    : color;

  return (
    <svg width={size} height={size} viewBox="0 0 80 80" className="-rotate-90">
      <circle cx="40" cy="40" r={r} strokeWidth="8" stroke="currentColor"
        className="text-gray-200 dark:text-gray-700" fill="none" />
      <circle cx="40" cy="40" r={r} strokeWidth="8" stroke={gapColor} fill="none"
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.5s ease" }} />
    </svg>
  );
}

function ProgressBar({ pct, color = "bg-indigo-500" }) {
  const barColor =
    pct >= 85 ? "bg-red-500"
    : pct >= 65 ? "bg-orange-500"
    : color;
  return (
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
      <div className={`${barColor} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ── Sparkline ─────────────────────────────────────────────────────────────────

function Sparkline({ data = [], color = "#6366f1" }) {
  if (!data || data.length < 2) return <div className="w-24 h-8 opacity-30" />;
  const max = Math.max(...data, 1);
  const W = 96, H = 32;
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * W,
    H - (v / max) * (H - 4),
  ]);
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `${path} L${W},${H} L0,${H} Z`;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <path d={area} fill={color} opacity={0.15} />
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function AdminPerformance() {
  const api = useAdminAxios();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [lastFetch, setLastFetch] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const r = await api.get("/admin/performance");
      setData(r.data?.data);
      setLastFetch(new Date());
    } catch (e) {
      setError(e.response?.data?.messages?.[0] ?? "Failed to load performance data");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { load(); }, [load]);

  if (loading && !data) return (
    <div className="flex flex-col items-center justify-center py-32">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mb-3" />
      <p className="text-sm text-gray-500">Gathering system metrics…</p>
    </div>
  );

  if (error && !data) return (
    <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-600 dark:text-red-400">
      <AlertCircle className="w-4 h-4" />{error}
    </div>
  );

  const server   = data?.server   ?? {};
  const platform = data?.platform ?? {};
  const saccos   = data?.saccos   ?? [];
  const notPerf  = data?.not_performing ?? [];

  const cpuLoad1 = server.cpu_load?.[0] ?? 0;
  const cpuPct   = Math.min(100, Math.round(cpuLoad1 * 100));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">System Performance</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Server health, SACCO activity, and platform metrics
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastFetch && (
            <span className="text-xs text-gray-400">
              Updated {lastFetch.toLocaleTimeString("en-UG", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button onClick={load} disabled={loading}
            className="flex items-center gap-1.5 text-sm px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Server Health ── */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Server className="w-4 h-4" /> Server Health
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* CPU */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">CPU Load</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{cpuPct}%</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {server.cpu_load?.join(" / ")} <span className="text-gray-400">(1m/5m/15m)</span>
                </p>
              </div>
              <div className="relative">
                <GaugeRing pct={cpuPct} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Cpu className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>
            <div className={`text-xs font-medium ${cpuPct >= 85 ? "text-red-400" : cpuPct >= 65 ? "text-orange-400" : "text-emerald-400"}`}>
              {cpuPct >= 85 ? "⚠ High load" : cpuPct >= 65 ? "Moderate" : "✓ Normal"}
            </div>
          </div>

          {/* Memory */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Memory</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {server.memory?.percent ?? 0}%
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {server.memory?.used_mb ?? 0} / {server.memory?.total_mb ?? 0} MB
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <MemoryStick className="w-6 h-6 text-purple-400" />
              </div>
            </div>
            <ProgressBar pct={server.memory?.percent ?? 0} color="bg-purple-500" />
          </div>

          {/* Disk */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Disk Usage</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {server.disk?.percent ?? 0}%
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {server.disk?.free_gb ?? 0} GB free of {server.disk?.total_gb ?? 0} GB
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <HardDrive className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <ProgressBar pct={server.disk?.percent ?? 0} color="bg-blue-500" />
          </div>

          {/* Uptime */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Server Uptime</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {fmtUptime(server.uptime_seconds)}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{server.os}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> PHP {server.php_version} · {server.php_memory_limit} limit
            </div>
          </div>
        </div>
      </section>

      {/* ── Platform Overview ── */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Database className="w-4 h-4" /> Platform Overview
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {[
            { label: "Total Members",   value: fmt(platform.total_clients),  icon: Users,       color: "bg-indigo-500/10 text-indigo-400" },
            { label: "Staff",           value: fmt(platform.total_staff),    icon: Users,       color: "bg-purple-500/10 text-purple-400" },
            { label: "Active Loans",    value: fmt(platform.active_loans),   icon: CreditCard,  color: "bg-blue-500/10 text-blue-400" },
            { label: "Loan Portfolio",  value: `UGX ${fmt(platform.loan_portfolio)}`, icon: TrendingUp, color: "bg-emerald-500/10 text-emerald-400" },
            { label: "Total Savings",   value: `UGX ${fmt(platform.total_savings)}`,  icon: Wallet,    color: "bg-yellow-500/10 text-yellow-400" },
            { label: "Tx Today",        value: fmt(platform.tx_today),       icon: Activity,    color: "bg-orange-500/10 text-orange-400" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
              <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center mb-3`}>
                <Icon className="w-4.5 h-4.5 w-[18px] h-[18px]" />
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Monthly Tx Chart */}
        {(platform.monthly_tx ?? []).length > 0 && (
          <div className="mt-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-4">Transaction Volume (6 months)</p>
            <div className="flex items-end gap-2 h-24">
              {platform.monthly_tx.map((m, i) => {
                const max = Math.max(...platform.monthly_tx.map(x => x.count), 1);
                const h   = Math.max(4, Math.round((m.count / max) * 88));
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-gray-400">{m.count}</span>
                    <div className="w-full bg-indigo-500 rounded-t-md transition-all hover:bg-indigo-400" style={{ height: `${h}px` }} />
                    <span className="text-[10px] text-gray-400">{m.month.slice(5)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* ── Needs Attention ── */}
      {notPerf.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-400" />
            <span className="text-orange-400">Needs Attention</span>
            <span className="px-2 py-0.5 bg-orange-500/10 text-orange-400 text-xs rounded-full font-bold">{notPerf.length}</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {notPerf.map(s => (
              <div key={s.sacco_id}
                className="bg-white dark:bg-gray-900 rounded-xl border border-orange-300 dark:border-orange-500/40 p-4 flex items-start gap-4">
                <div className="relative w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0 overflow-hidden">
                  <Building2 className="w-5 h-5 text-orange-400" />
                  {s.sacco_logo && (
                    <img src={saccoLogoUrl(s.sacco_logo)} alt="" className="absolute inset-0 w-full h-full object-cover"
                      onError={e => { e.currentTarget.style.display = "none"; }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{s.sacco_name}</p>
                  <p className="text-xs text-orange-400 mt-0.5">Low activity in last 30 days</p>
                  <div className="flex gap-3 mt-2 text-xs text-gray-500">
                    <span>{s.clients} members</span>
                    <span>{s.tx_30d} tx (30d)</span>
                    <span>{s.new_clients_30d} new</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Per-SACCO Performance ── */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Building2 className="w-4 h-4" /> Per-SACCO Performance
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {saccos.map(s => (
            <SaccoCard key={s.sacco_id} s={s} />
          ))}
        </div>
      </section>
    </div>
  );
}

// ── SACCO Performance Card ─────────────────────────────────────────────────────

function SaccoCard({ s }) {
  const isPerforming = s.is_performing;

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-2xl border ${
      isPerforming
        ? "border-gray-200 dark:border-gray-800"
        : "border-orange-300 dark:border-orange-500/40"
    } p-5`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative w-10 h-10 rounded-full bg-indigo-600/20 flex items-center justify-center shrink-0 overflow-hidden">
          <Building2 className="w-5 h-5 text-indigo-400" />
          {s.sacco_logo && (
            <img src={saccoLogoUrl(s.sacco_logo)} alt="" className="absolute inset-0 w-full h-full object-cover"
              onError={e => { e.currentTarget.style.display = "none"; }} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{s.sacco_name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-xs ${s.sacco_status === "active" ? "text-emerald-400" : "text-gray-400"}`}>
              {s.sacco_status}
            </span>
            {!isPerforming && (
              <span className="text-xs flex items-center gap-0.5 text-orange-400">
                <AlertTriangle className="w-3 h-3" /> Low activity
              </span>
            )}
          </div>
        </div>
        {/* Sparkline */}
        <div className="shrink-0">
          <Sparkline data={s.sparkline} color={isPerforming ? "#6366f1" : "#f97316"} />
          <p className="text-[10px] text-gray-400 text-center mt-0.5">4-wk tx</p>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-3 gap-3">
        <MetricCell label="Members"    value={fmt(s.clients)}
          sub={`+${s.new_clients_30d} this month`}
          icon={Users} color="text-indigo-400"
          trend={s.new_clients_30d > 0 ? "up" : "flat"} />
        <MetricCell label="Active Loans"  value={fmt(s.active_loans)}
          sub={`UGX ${fmt(s.loan_portfolio)}`}
          icon={CreditCard} color="text-blue-400" />
        <MetricCell label="Transactions"  value={fmt(s.tx_30d)}
          sub="last 30 days"
          icon={Activity} color="text-emerald-400"
          trend={s.tx_30d > 10 ? "up" : s.tx_30d === 0 ? "down" : "flat"} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Zap className="w-3.5 h-3.5 text-yellow-400" />
          <span>{fmt(s.sms_30d)} SMS sent (30d)</span>
        </div>
        <div className="text-xs text-gray-400">
          Last tx: {s.last_tx_at ? fmtDate(s.last_tx_at) : "—"}
        </div>
      </div>
    </div>
  );
}

function MetricCell({ label, value, sub, icon: Icon, color, trend }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-3">
      <div className="flex items-center justify-between mb-1">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        {trend === "up"   && <ArrowUpRight   className="w-3 h-3 text-emerald-400" />}
        {trend === "down" && <ArrowDownRight  className="w-3 h-3 text-red-400" />}
      </div>
      <p className="text-base font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs font-medium text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2, Users, CreditCard, TrendingUp, Wallet,
  ArrowUpRight, Loader2, AlertCircle, PlusCircle,
} from "lucide-react";
import useAdminAxios from "@/MiddleWares/Hooks/useAdminAxios";

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

export default function AdminDashboard() {
  const api = useAdminAxios();
  const navigate = useNavigate();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    let mounted = true;
    api.get("/admin/dashboard")
      .then((r) => { if (mounted) setData(r.data?.data); })
      .catch((e) => { if (mounted) setError(e?.response?.data?.messages?.[0] ?? "Failed to load dashboard"); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 dark:text-indigo-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg p-4">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  const { kpis, recently_onboarded = [], scope } = data ?? {};

  const colorMap = {
    indigo: "bg-indigo-600/15 text-indigo-600 dark:text-indigo-400",
    sky:    "bg-sky-600/15 text-sky-600 dark:text-sky-400",
    amber:  "bg-amber-600/15 text-amber-600 dark:text-amber-400",
    green:  "bg-emerald-600/15 text-emerald-600 dark:text-emerald-400",
    purple: "bg-purple-600/15 text-purple-600 dark:text-purple-400",
    teal:   "bg-teal-600/15 text-teal-600 dark:text-teal-400",
  };

  const CARDS = [
    { label: "Total SACCOs",   value: fmt(kpis?.total_saccos),                   sub: `${kpis?.active_saccos} active`,    icon: Building2,  color: "indigo" },
    { label: "Total Clients",  value: fmt(kpis?.total_clients),                  sub: `+${kpis?.new_clients_today} today`, icon: Users,      color: "sky"    },
    { label: "Active Loans",   value: fmt(kpis?.active_loans),                   sub: "disbursed",                         icon: CreditCard, color: "amber"  },
    { label: "Loan Portfolio", value: `UGX ${fmt(kpis?.loan_portfolio ?? 0)}`,   sub: "outstanding",                       icon: TrendingUp, color: "green"  },
    { label: "Total Savings",  value: `UGX ${fmt(kpis?.total_savings ?? 0)}`,    sub: "active accounts",                   icon: Wallet,     color: "purple" },
    { label: "Staff Users",    value: fmt(kpis?.total_staff),                    sub: "across all SACCOs",                 icon: Users,      color: "teal"   },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {scope === "restricted" ? "Showing data for your assigned SACCOs" : "Platform-wide overview"}
          </p>
        </div>
        <button
          onClick={() => navigate("/admin/onboard")}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          New SACCO
        </button>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {CARDS.map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
                <p className="text-xs text-gray-500 mt-1">{sub}</p>
              </div>
              <div className={`p-2 rounded-lg ${colorMap[color]}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Today's activity */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Deposits Today</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">UGX {fmtCur(kpis?.deposits_today)}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Collections Today</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">UGX {fmtCur(kpis?.collections_today)}</p>
        </div>
      </div>

      {/* Recently onboarded */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Recently Onboarded SACCOs</h2>
          <button
            onClick={() => navigate("/admin/saccos")}
            className="text-xs text-indigo-500 dark:text-indigo-400 hover:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1"
          >
            View all <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-800">
          {recently_onboarded.length === 0 ? (
            <p className="text-sm text-gray-500 px-5 py-4">No SACCOs yet.</p>
          ) : (
            recently_onboarded.map((s) => (
              <button
                key={s.sacco_id}
                onClick={() => navigate(`/admin/saccos/${s.sacco_id}`)}
                className="flex items-center justify-between w-full px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-8 h-8 rounded-full bg-indigo-600/20 flex items-center justify-center shrink-0 overflow-hidden">
                    <Building2 className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                    {s.sacco_logo && (
                      <img
                        src={saccoLogoUrl(s.sacco_logo)}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                      />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{s.sacco_name}</p>
                    <p className="text-xs text-gray-500">{s.sacco_location}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  s.sacco_status === "active"
                    ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                }`}>
                  {s.sacco_status}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

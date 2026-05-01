/* eslint-disable react/prop-types */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Users, UsersRound, UserCheck, UserX, Smartphone, PiggyBank,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell, AreaChart, Area,
} from "recharts";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import StatCard from "./StatCard";

const fmt = (n) => (n != null ? Number(n).toLocaleString() : "—");
const fmtPct = (n) => (n != null ? `${Number(n).toFixed(1)}%` : "—");

const PIE_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

const DashboardMembership = ({ startDate }) => {
  const axiosPrivate = useAxiosPrivate();
  const navigate     = useNavigate();

  const year = startDate ? new Date(startDate).getFullYear() : new Date().getFullYear();

  const { data = {}, isLoading } = useQuery({
    queryKey: ["dashboard-membership-data", year],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get(`/dashboards/membership?year=${year}`);
        return res.data.data ?? {};
      } catch (err) {
        if (err?.response?.status === 401) navigate("/", { replace: true });
      }
    },
  });

  const totals   = data?.totals ?? {};
  const savings  = data?.savings_portfolio ?? {};
  const growth   = data?.growth_trend ?? [];
  const shares   = data?.shares_trend ?? [];
  const demos    = data?.demographics ?? {};
  const byBranch = data?.by_branch ?? [];

  const genderPie  = demos.gender ?? [];
  const typePie    = demos.type ?? [];
  const statusPie  = demos.status ?? [];
  const mobilePie  = demos.mobile_banking ?? [];

  return (
    <div className="space-y-6">

      {/* ── Member Totals ─────────────────────────────────────────────────── */}
      <section>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Member Overview</p>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[108px] rounded-xl" />) : (
            <>
              <StatCard
                label="Total Members"
                value={fmt(totals.total)}
                subtitle={`${fmt(totals.individual)} individual · ${fmt(totals.groups)} groups`}
                icon={Users}
                colorClass="text-violet-600 dark:text-violet-400"
                bgClass="bg-violet-100 dark:bg-violet-900/30"
              />
              <StatCard
                label="Male Members"
                value={fmt(totals.male)}
                subtitle="Individual male"
                icon={Users}
                colorClass="text-sky-600 dark:text-sky-400"
                bgClass="bg-sky-100 dark:bg-sky-900/30"
              />
              <StatCard
                label="Female Members"
                value={fmt(totals.female)}
                subtitle="Individual female"
                icon={Users}
                colorClass="text-pink-600 dark:text-pink-400"
                bgClass="bg-pink-100 dark:bg-pink-900/30"
              />
              <Card className="border shadow-sm hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1.5 min-w-0">
                      <p className="text-sm font-medium text-muted-foreground">Status</p>
                      <p className="text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <UserCheck className="h-3.5 w-3.5 shrink-0" /> {fmt(totals.active)} Active
                      </p>
                      <p className="text-sm font-semibold tabular-nums text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                        <UserX className="h-3.5 w-3.5 shrink-0" /> {fmt(totals.inactive)} Inactive
                      </p>
                    </div>
                    <div className="p-2.5 rounded-xl shrink-0 bg-slate-100 dark:bg-slate-900/30">
                      <UsersRound className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </section>

      {/* ── Savings Portfolio ─────────────────────────────────────────────── */}
      <section>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Savings Portfolio</p>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-[108px] rounded-xl" />) : (
            <>
              <StatCard
                label="Total Savings Balance"
                value={fmt(savings.total_balance)}
                subtitle={`${fmt(savings.account_count)} active accounts`}
                icon={PiggyBank}
                colorClass="text-emerald-600 dark:text-emerald-400"
                bgClass="bg-emerald-100 dark:bg-emerald-900/30"
              />
              <StatCard
                label="Available Savings"
                value={fmt(savings.available)}
                subtitle="Liquid (unfrozen)"
                icon={PiggyBank}
                colorClass="text-teal-600 dark:text-teal-400"
                bgClass="bg-teal-100 dark:bg-teal-900/30"
              />
              <StatCard
                label="Frozen Savings"
                value={fmt(savings.total_frozen)}
                subtitle="Locked / held"
                icon={PiggyBank}
                colorClass="text-amber-600 dark:text-amber-400"
                bgClass="bg-amber-100 dark:bg-amber-900/30"
              />
              <StatCard
                label="Mobile Banking"
                value={fmt(totals.mobile_banking)}
                subtitle={`${fmtPct(totals.mobile_adoption_pct)} adoption rate`}
                icon={Smartphone}
                colorClass="text-indigo-600 dark:text-indigo-400"
                bgClass="bg-indigo-100 dark:bg-indigo-900/30"
              />
            </>
          )}
        </div>
      </section>

      {/* ── Demographics ─────────────────────────────────────────────────── */}
      {!isLoading && (
        <section>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Demographics</p>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Gender Split",   data: genderPie },
              { label: "Member Type",    data: typePie },
              { label: "Status",         data: statusPie },
              { label: "Mobile Banking", data: mobilePie },
            ].map(({ label, data: pieData }) => (
              <Card key={label} className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">{label}</CardTitle>
                </CardHeader>
                <CardContent>
                  {pieData.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">No data</p>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height={110}>
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" outerRadius={45} dataKey="value" label={false}>
                            {pieData.map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v) => [v, "Count"]} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-1 mt-1">
                        {pieData.map((d, i) => (
                          <div key={d.name} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5">
                              <div className="h-2 w-2 rounded-sm" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                              <span className="text-muted-foreground">{d.name}</span>
                            </div>
                            <span className="font-semibold tabular-nums">{fmt(d.value)}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* ── Membership Growth + Shares Trend ──────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">
        {isLoading ? (
          <>
            <Skeleton className="h-[300px] rounded-xl" />
            <Skeleton className="h-[300px] rounded-xl" />
          </>
        ) : (
          <>
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Membership Growth</CardTitle>
                <p className="text-xs text-muted-foreground">New registrations &amp; cumulative total</p>
              </CardHeader>
              <CardContent className="pl-1">
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={growth}>
                    <defs>
                      <linearGradient id="gCumul" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} tickFormatter={(v) => v?.slice(5)} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => [Number(v).toLocaleString(), ""]} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="cumulative" name="Total" stroke="hsl(var(--chart-1))" fill="url(#gCumul)" strokeWidth={2} />
                    <Bar dataKey="new_members" name="New" fill="hsl(var(--chart-2))" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Shares Activity</CardTitle>
                <p className="text-xs text-muted-foreground">Shares in vs shares out by month</p>
              </CardHeader>
              <CardContent className="pl-1">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={shares} margin={{ left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} tickFormatter={(v) => v?.slice(5)} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => [Number(v).toLocaleString(), ""]} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="in" name="Shares In" fill="hsl(var(--chart-1))" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="out" name="Shares Out" fill="hsl(var(--chart-2))" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* ── By Branch ────────────────────────────────────────────────────── */}
      {!isLoading && byBranch.length > 0 && (
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Members by Branch</CardTitle>
            <p className="text-xs text-muted-foreground">Distribution across branches</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {byBranch.map((b) => {
                const pct = totals.total > 0 ? Math.round((b.total / totals.total) * 100) : 0;
                return (
                  <div key={b.branch_id} className="space-y-1">
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="font-medium truncate">{b.branch_name}</span>
                      <div className="flex gap-4 text-xs tabular-nums shrink-0">
                        <span className="text-emerald-600 dark:text-emerald-400">{fmt(b.active)} active</span>
                        <span className="font-semibold">{fmt(b.total)} total</span>
                        <span className="text-muted-foreground">{pct}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-violet-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardMembership;

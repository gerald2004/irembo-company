import { useQuery } from "@tanstack/react-query";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, FileSearch, BookOpen, Shield } from "lucide-react";

const StatCard = ({ title, value, sub, icon: Icon, color }) => (
  <Card>
    <CardContent className="pt-5 pb-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1">{value ?? 0}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const AMLDashboard = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["aml-dashboard"],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get("/aml/dashboard");
        return res?.data?.data ?? null;
      } catch (err) {
        if (err?.response?.status === 401) navigate("/", { replace: true });
        throw err;
      }
    },
    retry: 1,
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Open Alerts"    value={0} sub="No data available" icon={AlertTriangle} color="bg-red-100 text-red-600" />
        <StatCard title="Under Review"   value={0} sub="—"                  icon={FileSearch}   color="bg-amber-100 text-amber-600" />
        <StatCard title="Open Cases"     value={0} sub="—"                  icon={BookOpen}     color="bg-orange-100 text-orange-600" />
        <StatCard title="Active Policies" value={0} sub="—"                 icon={Shield}       color="bg-green-100 text-green-600" />
      </div>
    );
  }

  const alerts   = data.alerts   ?? {};
  const cases    = data.cases    ?? {};
  const policies = data.policies ?? {};
  const recent   = Array.isArray(data.recent_alerts) ? data.recent_alerts : [];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Open Alerts"
          value={alerts.open ?? 0}
          sub={`${alerts.today ?? 0} today · ${alerts.this_week ?? 0} this week`}
          icon={AlertTriangle}
          color="bg-red-100 text-red-600"
        />
        <StatCard
          title="Under Review"
          value={alerts.under_review ?? 0}
          sub={`${alerts.closed ?? 0} closed`}
          icon={FileSearch}
          color="bg-amber-100 text-amber-600"
        />
        <StatCard
          title="Open Cases"
          value={cases.open ?? 0}
          sub={`${cases.critical ?? 0} critical · ${cases.investigating ?? 0} investigating`}
          icon={BookOpen}
          color="bg-orange-100 text-orange-600"
        />
        <StatCard
          title="Active Policies"
          value={policies.active ?? 0}
          sub={`${policies.total ?? 0} total policies`}
          icon={Shield}
          color="bg-green-100 text-green-600"
        />
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Recent Alerts</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No alerts yet</p>
          ) : (
            <div className="divide-y">
              {recent.map((a) => (
                <div key={a.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/40 text-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge variant={a.severity === "critical" || a.severity === "high" ? "destructive" : "outline"} className="text-xs capitalize shrink-0">
                      {a.severity ?? "—"}
                    </Badge>
                    <span className="font-medium truncate">{a.rule_name ?? "—"}</span>
                    <span className="text-muted-foreground text-xs hidden sm:inline">
                      {a.txn_table} #{a.txn_id}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-muted-foreground">{a.score ?? 0} pts</span>
                    <Badge variant={a.status === "open" ? "destructive" : "secondary"} className="text-xs capitalize">
                      {(a.status ?? "").replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AMLDashboard;

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { RefreshCw, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";

const STATUS_OPTS = ["all", "open", "under_review", "closed"];

const severityColor = {
  low:      "bg-blue-50 text-blue-700",
  medium:   "bg-amber-50 text-amber-700",
  high:     "bg-orange-50 text-orange-700",
  critical: "bg-red-100 text-red-800",
};

const AMLAlerts = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate     = useNavigate();
  const queryClient  = useQueryClient();

  const [statusFilter, setStatusFilter] = useState("open"); // "all" = no filter
  const [expanded,     setExpanded]     = useState(null);

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["aml-alerts", statusFilter],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get("/aml/alerts", {
          params: { status: statusFilter === "all" ? undefined : statusFilter, limit: 200 },
        });
        return Array.isArray(res?.data?.data) ? res.data.data : [];
      } catch (e) {
        if (e?.response?.status === 401) navigate("/", { replace: true });
        throw e;
      }
    },
    retry: 1,
  });

  const alerts = Array.isArray(data) ? data : [];

  const updateMut = useMutation({
    mutationFn: ({ id, payload }) => axiosPrivate.patch(`/aml/alerts/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aml-alerts"] });
      toast({ title: "Alert updated", variant: "success" });
    },
    onError: () => toast({ title: "Update failed", variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-semibold text-base">AML Alerts</h3>
          <p className="text-xs text-muted-foreground">{alerts.length} record{alerts.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="All statuses" /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTS.map((s) => (
                <SelectItem key={s} value={s} className="text-xs capitalize">{s === "all" ? "All" : s.replace("_", " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isRefetching}>
            <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
      ) : isError ? (
        <div className="flex items-center gap-2 text-destructive text-sm py-6">
          <AlertCircle className="h-4 w-4" /> Failed to load alerts.
        </div>
      ) : alerts.length === 0 ? (
        <Card><CardContent className="text-center py-10 text-muted-foreground text-sm">No alerts found.</CardContent></Card>
      ) : (
        <div className="space-y-1.5">
          {alerts.map((a) => {
            const isOpen = expanded === a.id;
            const severity = a.rule_severity ?? a.severity ?? "low";
            return (
              <Card key={a.id}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full ${severityColor[severity] ?? "bg-gray-100 text-gray-700"}`}>
                          {severity}
                        </span>
                        <span className="font-medium text-sm">{a.rule_name ?? "—"}</span>
                        <span className="text-xs text-muted-foreground font-mono">{a.rule_code ?? ""}</span>
                        <Badge
                          variant={a.status === "open" ? "destructive" : "secondary"}
                          className="text-xs capitalize"
                        >
                          {(a.status ?? "").replace("_", " ")}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-3 flex-wrap">
                        <span>Client #{a.customer_id ?? "—"}</span>
                        <span>{a.transaction_table ?? ""} #{a.transaction_id ?? ""}</span>
                        {a.case_ref && <span className="text-blue-600">Case: {a.case_ref}</span>}
                        <span>{a.created_at ? new Date(a.created_at).toLocaleString() : ""}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs text-muted-foreground">{a.score ?? 0} pts</span>
                      {a.status === "open" && (
                        <Button
                          variant="outline" size="sm" className="h-6 text-xs"
                          onClick={() => updateMut.mutate({ id: a.id, payload: { status: "closed" } })}
                          disabled={updateMut.isPending}
                        >
                          Close
                        </Button>
                      )}
                      <button
                        onClick={() => setExpanded(isOpen ? null : a.id)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {isOpen && a.payload && typeof a.payload === "object" && (
                    <div className="mt-2 rounded-md bg-muted/40 p-2.5 text-xs space-y-0.5">
                      {Object.entries(a.payload).map(([k, v]) => (
                        <div key={k} className="flex gap-2">
                          <span className="text-muted-foreground min-w-28">{k}</span>
                          <span className="font-mono">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AMLAlerts;

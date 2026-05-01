import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { RefreshCw, FolderOpen, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";

const STATUS_OPTS     = ["all", "open", "investigating", "closed"];
const PRIORITY_OPTS   = ["all", "low", "medium", "high"];
const RESOLUTION_OPTS = ["suspicious_activity", "false_positive", "referred", "filed_report", "no_action"];

const priorityColor = {
  low:    "text-blue-600",
  medium: "text-amber-600",
  high:   "text-red-600",
};

const UpdateCaseDialog = ({ caseItem, onClose, onSave, isSaving }) => {
  const [status,     setStatus]     = useState(caseItem.status ?? "open");
  const [resolution, setResolution] = useState(caseItem.resolution ?? "");
  const [notes,      setNotes]      = useState(caseItem.notes ?? "");

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Update Case {caseItem.case_ref}</DialogTitle></DialogHeader>
        <div className="space-y-3 pt-1">
          <div className="space-y-1">
            <label className="text-xs font-medium">Status</label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTS.filter(Boolean).map((s) => (
                  <SelectItem key={s} value={s} className="text-xs capitalize">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {status === "closed" && (
            <div className="space-y-1">
              <label className="text-xs font-medium">Resolution</label>
              <Select value={resolution} onValueChange={setResolution}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  {RESOLUTION_OPTS.map((r) => (
                    <SelectItem key={r} value={r} className="text-xs capitalize">{r.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1">
            <label className="text-xs font-medium">Notes</label>
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className="text-xs resize-none" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" disabled={isSaving} onClick={() => onSave({ status, resolution: resolution || null, notes })}>
            {isSaving ? "Saving…" : "Update Case"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const AMLCases = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate     = useNavigate();
  const queryClient  = useQueryClient();

  const [statusFilter,   setStatusFilter]   = useState("open");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [updateTarget,   setUpdateTarget]   = useState(null);
  const [expanded,       setExpanded]       = useState(null);

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["aml-cases", statusFilter, priorityFilter],
    queryFn: async () => {
      try {
        const res = await axiosPrivate.get("/aml/cases", {
          params: {
            status:   statusFilter   === "all" ? undefined : statusFilter,
            priority: priorityFilter === "all" ? undefined : priorityFilter,
            limit: 200,
          },
        });
        return Array.isArray(res?.data?.data) ? res.data.data : [];
      } catch (e) {
        if (e?.response?.status === 401) navigate("/", { replace: true });
        throw e;
      }
    },
    retry: 1,
  });

  const cases = Array.isArray(data) ? data : [];

  const updateMut = useMutation({
    mutationFn: ({ id, payload }) => axiosPrivate.patch(`/aml/cases/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aml-cases"] });
      setUpdateTarget(null);
      toast({ title: "Case updated", variant: "success" });
    },
    onError: () => toast({ title: "Update failed", variant: "destructive" }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-semibold text-base">AML Cases</h3>
          <p className="text-xs text-muted-foreground">{cases.length} record{cases.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="All statuses" /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTS.map((s) => <SelectItem key={s} value={s} className="text-xs capitalize">{s === "all" ? "All" : s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="h-8 w-32 text-xs"><SelectValue placeholder="All priorities" /></SelectTrigger>
            <SelectContent>
              {PRIORITY_OPTS.map((p) => <SelectItem key={p} value={p} className="text-xs capitalize">{p === "all" ? "All" : p}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isRefetching}>
            <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : isError ? (
        <div className="flex items-center gap-2 text-destructive text-sm py-6">
          <AlertCircle className="h-4 w-4" /> Failed to load cases.
        </div>
      ) : cases.length === 0 ? (
        <Card><CardContent className="text-center py-10 text-muted-foreground text-sm">No cases found.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {cases.map((c) => {
            const isOpen = expanded === c.id;
            return (
              <Card key={c.id}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <FolderOpen className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm font-semibold">{c.case_ref ?? "—"}</span>
                          <Badge variant={c.status === "open" ? "destructive" : "secondary"} className="text-xs capitalize">
                            {c.status ?? "—"}
                          </Badge>
                          <span className={`text-xs font-medium capitalize ${priorityColor[c.priority] ?? ""}`}>
                            {c.priority ?? ""}
                          </span>
                          <span className="text-xs text-muted-foreground">{c.alerts_count ?? 0} alert(s)</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 flex gap-3 flex-wrap">
                          {c.client_name && <span>Client: <strong className="text-foreground">{c.client_name}</strong></span>}
                          {c.opened_at && <span>Opened: {new Date(c.opened_at).toLocaleDateString()}</span>}
                          {c.closed_at && <span>Closed: {new Date(c.closed_at).toLocaleDateString()}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {c.status !== "closed" && (
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setUpdateTarget(c)}>
                          Update
                        </Button>
                      )}
                      <button onClick={() => setExpanded(isOpen ? null : c.id)} className="text-muted-foreground hover:text-foreground">
                        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="mt-3 ml-6 space-y-1.5 text-xs border rounded-md p-2.5 bg-muted/30">
                      {c.resolution && (
                        <div className="flex gap-2">
                          <span className="text-muted-foreground w-24">Resolution</span>
                          <span className="capitalize">{String(c.resolution).replace(/_/g, " ")}</span>
                        </div>
                      )}
                      {c.notes && (
                        <div className="flex gap-2">
                          <span className="text-muted-foreground w-24">Notes</span>
                          <span className="whitespace-pre-wrap">{c.notes}</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {updateTarget && (
        <UpdateCaseDialog
          caseItem={updateTarget}
          onClose={() => setUpdateTarget(null)}
          onSave={(payload) => updateMut.mutate({ id: updateTarget.id, payload })}
          isSaving={updateMut.isPending}
        />
      )}
    </div>
  );
};

export default AMLCases;

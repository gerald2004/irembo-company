/* eslint-disable react/prop-types */
import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Users, Plus, Edit2, Trash2, CalendarDays, Clock, MapPin,
  UserCheck, UserMinus, ChevronRight, X, Layers,
} from "lucide-react";

// ── constants ─────────────────────────────────────────────────────────────────

const DAYS = [
  { value: "monday",    label: "Monday" },
  { value: "tuesday",   label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday",  label: "Thursday" },
  { value: "friday",    label: "Friday" },
  { value: "saturday",  label: "Saturday" },
  { value: "sunday",    label: "Sunday" },
];

const FREQS = [
  { value: "daily",    label: "Daily" },
  { value: "weekly",   label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "monthly",  label: "Monthly" },
];

const DAY_COLORS = {
  monday: "bg-blue-100 text-blue-700",
  tuesday: "bg-violet-100 text-violet-700",
  wednesday: "bg-emerald-100 text-emerald-700",
  thursday: "bg-amber-100 text-amber-700",
  friday: "bg-rose-100 text-rose-700",
  saturday: "bg-orange-100 text-orange-700",
  sunday: "bg-slate-100 text-slate-600",
};

const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : "";

const EMPTY_FORM = {
  sub_group_name:    "",
  sub_group_code:    "",
  meeting_day:       "",
  meeting_frequency: "weekly",
  meeting_time:      "",
  meeting_location:  "",
  notes:             "",
};

// ── Sub-group form dialog ─────────────────────────────────────────────────────

function SubGroupFormDialog({ groupId, existing, open, onClose, onSaved }) {
  const axiosPrivate = useAxiosPrivate();
  const [form, setForm] = useState(existing ? {
    sub_group_name:    existing.sub_group_name ?? "",
    sub_group_code:    existing.sub_group_code ?? "",
    meeting_day:       existing.meeting_day ?? "",
    meeting_frequency: existing.meeting_frequency ?? "weekly",
    meeting_time:      existing.meeting_time ?? "",
    meeting_location:  existing.meeting_location ?? "",
    notes:             existing.notes ?? "",
  } : EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.sub_group_name.trim()) {
      toast({ title: "Sub-group name is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        meeting_day:      form.meeting_day || null,
        meeting_time:     form.meeting_time || null,
        meeting_location: form.meeting_location || null,
        sub_group_code:   form.sub_group_code || null,
        notes:            form.notes || null,
      };
      if (existing) {
        await axiosPrivate.put(`/clients/groups/sub-groups/${existing.id}`, payload);
        toast({ title: "Sub-group updated" });
      } else {
        await axiosPrivate.post(`/clients/groups/${groupId}/sub-groups`, payload);
        toast({ title: "Sub-group created" });
      }
      onSaved();
    } catch (e) {
      toast({
        title: "Error",
        variant: "destructive",
        description: e?.response?.data?.messages?.[0] ?? "Failed to save sub-group",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            {existing ? "Edit Sub-Group" : "New Sub-Group"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <Label>Sub-Group Name <span className="text-red-500">*</span></Label>
              <Input
                placeholder="e.g. Zone A, Cluster 1"
                value={form.sub_group_name}
                onChange={(e) => set("sub_group_name", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Code (optional)</Label>
              <Input
                placeholder="e.g. SG-01"
                value={form.sub_group_code}
                onChange={(e) => set("sub_group_code", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Meeting Frequency</Label>
              <Select value={form.meeting_frequency} onValueChange={(v) => set("meeting_frequency", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FREQS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Meeting Day</Label>
              <Select value={form.meeting_day || "__none"} onValueChange={(v) => set("meeting_day", v === "__none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Any day" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">Any day</SelectItem>
                  {DAYS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Meeting Time</Label>
              <Input
                type="time"
                value={form.meeting_time}
                onChange={(e) => set("meeting_time", e.target.value)}
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Meeting Location</Label>
              <Input
                placeholder="e.g. Community Hall, Bwaise"
                value={form.meeting_location}
                onChange={(e) => set("meeting_location", e.target.value)}
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Notes</Label>
              <Input
                placeholder="Any additional notes…"
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : existing ? "Save Changes" : "Create Sub-Group"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Members assignment dialog ─────────────────────────────────────────────────

function MembersDialog({ subGroup, groupId, allMembers, open, onClose, onChanged }) {
  const axiosPrivate  = useAxiosPrivate();
  const [busy, setBusy] = useState(null); // attach_id being toggled

  const assignedIds = useMemo(
    () => new Set((subGroup?.members ?? []).map((m) => m.attach_id)),
    [subGroup]
  );

  const toggle = async (attachRecord, action) => {
    setBusy(attachRecord.id);
    try {
      await axiosPrivate.patch(
        `/clients/groups/sub-groups/${subGroup.id}/members/${attachRecord.id}`,
        { action }
      );
      toast({ title: action === "assign" ? "Member assigned" : "Member removed from sub-group" });
      onChanged();
    } catch (e) {
      toast({
        title: "Error",
        variant: "destructive",
        description: e?.response?.data?.messages?.[0] ?? "Action failed",
      });
    } finally {
      setBusy(null);
    }
  };

  // allMembers comes from /clients/groups/:id/attaches — each has .id (attach_id) and .member
  const grouped = useMemo(() => {
    const assigned   = [];
    const unassigned = [];
    for (const m of allMembers) {
      if (!m.member) continue;
      if (assignedIds.has(m.id)) assigned.push(m);
      else unassigned.push(m);
    }
    return { assigned, unassigned };
  }, [allMembers, assignedIds]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            {subGroup?.sub_group_name} — Members
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 space-y-4 pr-1">
          {/* Assigned members */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              In this sub-group ({grouped.assigned.length})
            </p>
            {grouped.assigned.length === 0 ? (
              <p className="text-xs text-muted-foreground italic px-1">No members assigned yet.</p>
            ) : (
              <div className="border rounded-lg divide-y">
                {grouped.assigned.map((m) => (
                  <div key={m.id} className="flex items-center justify-between px-3 py-2.5 gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {m.member.client_firstname} {m.member.client_lastname}
                      </p>
                      <p className="text-xs text-muted-foreground">{m.member.client_account_number}</p>
                    </div>
                    <Button
                      size="xs"
                      variant="ghost"
                      className="h-7 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 shrink-0"
                      disabled={busy === m.id}
                      onClick={() => toggle(m, "unassign")}
                    >
                      <UserMinus className="w-3.5 h-3.5 mr-1" />
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Unassigned members */}
          {grouped.unassigned.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Other group members ({grouped.unassigned.length})
              </p>
              <div className="border rounded-lg divide-y">
                {grouped.unassigned.map((m) => (
                  <div key={m.id} className="flex items-center justify-between px-3 py-2.5 gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {m.member.client_firstname} {m.member.client_lastname}
                      </p>
                      <p className="text-xs text-muted-foreground">{m.member.client_account_number}</p>
                    </div>
                    <Button
                      size="xs"
                      className="h-7 px-2 text-xs shrink-0"
                      disabled={busy === m.id}
                      onClick={() => toggle(m, "assign")}
                    >
                      <UserCheck className="w-3.5 h-3.5 mr-1" />
                      Assign
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Sub-group card ────────────────────────────────────────────────────────────

function SubGroupCard({ sg, onEdit, onDelete, onManageMembers }) {
  const dayColor = DAY_COLORS[sg.meeting_day] ?? "bg-slate-100 text-slate-600";

  return (
    <div className="border rounded-xl p-4 space-y-3 hover:shadow-sm transition-shadow bg-card">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm">{sg.sub_group_name}</p>
            {sg.sub_group_code && (
              <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                {sg.sub_group_code}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-muted-foreground">
            <Users className="w-3.5 h-3.5 shrink-0" />
            <span className="text-xs">{sg.member_count ?? 0} member{sg.member_count !== 1 ? "s" : ""}</span>
          </div>
        </div>
        <Badge
          variant={sg.status === "active" ? "default" : "secondary"}
          className="text-xs shrink-0 capitalize"
        >
          {sg.status}
        </Badge>
      </div>

      {/* Meeting info */}
      <div className="space-y-1.5">
        {sg.meeting_day && (
          <div className="flex items-center gap-2">
            <CalendarDays className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${dayColor}`}>
              {cap(sg.meeting_day)}
            </span>
            <span className="text-xs text-muted-foreground">
              · {cap(sg.meeting_frequency)}
            </span>
          </div>
        )}
        {sg.meeting_time && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            {sg.meeting_time.slice(0, 5)}
          </div>
        )}
        {sg.meeting_location && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{sg.meeting_location}</span>
          </div>
        )}
        {!sg.meeting_day && !sg.meeting_time && !sg.meeting_location && (
          <p className="text-xs text-muted-foreground italic">No meeting schedule set</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t">
        <Button
          size="xs"
          variant="outline"
          className="h-7 px-2 text-xs flex-1"
          onClick={() => onManageMembers(sg)}
        >
          <Users className="w-3.5 h-3.5 mr-1" />
          Members
          <ChevronRight className="w-3 h-3 ml-auto" />
        </Button>
        <Button
          size="xs"
          variant="ghost"
          className="h-7 px-2 text-xs"
          onClick={() => onEdit(sg)}
        >
          <Edit2 className="w-3.5 h-3.5" />
        </Button>
        <Button
          size="xs"
          variant="ghost"
          className="h-7 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
          onClick={() => onDelete(sg)}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const GroupSubGroups = () => {
  const axiosPrivate  = useAxiosPrivate();
  const queryClient   = useQueryClient();
  const params        = useParams();
  const groupId       = params.id;

  const [formOpen, setFormOpen]       = useState(false);
  const [editing, setEditing]         = useState(null);
  const [membersFor, setMembersFor]   = useState(null); // sub-group being managed
  const [membersOpen, setMembersOpen] = useState(false);

  // All sub-groups for this group
  const { data: subGroups = [], isLoading, refetch } = useQuery({
    queryKey: ["sub-groups", groupId],
    queryFn: async () => {
      const res = await axiosPrivate.get(`/clients/groups/${groupId}/sub-groups`);
      return res.data.data?.sub_groups ?? [];
    },
  });

  // All group members (for the assignment dialog)
  const { data: allMembers = [] } = useQuery({
    queryKey: ["group-members", groupId],
    queryFn: async () => {
      const res = await axiosPrivate.get(`/clients/groups/${groupId}/attaches`);
      return res.data.data?.members ?? [];
    },
  });

  // Sub-group detail with its current members (refreshed when dialog opens)
  const { data: subGroupDetail, refetch: refetchDetail } = useQuery({
    queryKey: ["sub-group-detail", membersFor?.id],
    queryFn: async () => {
      const res = await axiosPrivate.get(`/clients/groups/sub-groups/${membersFor.id}`);
      return res.data.data ?? {};
    },
    enabled: !!membersFor,
  });

  const deleteMut = useMutation({
    mutationFn: (id) => axiosPrivate.delete(`/clients/groups/sub-groups/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-groups", groupId] });
      toast({ title: "Sub-group deactivated" });
    },
    onError: (e) => toast({
      title: "Error",
      variant: "destructive",
      description: e?.response?.data?.messages?.[0] ?? "Failed to delete sub-group",
    }),
  });

  const handleEdit = (sg) => { setEditing(sg); setFormOpen(true); };
  const handleNew  = ()   => { setEditing(null); setFormOpen(true); };

  const handleDelete = (sg) => {
    if (!window.confirm(`Deactivate "${sg.sub_group_name}" and unlink its members?`)) return;
    deleteMut.mutate(sg.id);
  };

  const handleManageMembers = (sg) => {
    setMembersFor(sg);
    setMembersOpen(true);
  };

  const handleFormSaved = () => {
    setFormOpen(false);
    setEditing(null);
    queryClient.invalidateQueries({ queryKey: ["sub-groups", groupId] });
  };

  const handleMembersChanged = () => {
    refetch();
    refetchDetail();
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary" />
          <span className="font-semibold text-sm">
            {subGroups.length} Sub-Group{subGroups.length !== 1 ? "s" : ""}
          </span>
        </div>
        <Button size="sm" onClick={handleNew}>
          <Plus className="w-4 h-4 mr-1.5" /> New Sub-Group
        </Button>
      </div>

      {/* Empty state */}
      {subGroups.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center border rounded-xl">
          <Layers className="w-12 h-12 text-muted-foreground/30" />
          <div>
            <p className="text-sm font-medium text-muted-foreground">No sub-groups yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Divide this group into zones or clusters for easier collection management
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={handleNew}>
            <Plus className="w-4 h-4 mr-1.5" /> Create First Sub-Group
          </Button>
        </div>
      )}

      {/* Grid of sub-group cards */}
      {subGroups.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subGroups.map((sg) => (
            <SubGroupCard
              key={sg.id}
              sg={sg}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onManageMembers={handleManageMembers}
            />
          ))}
        </div>
      )}

      {/* Create / Edit dialog */}
      {formOpen && (
        <SubGroupFormDialog
          groupId={groupId}
          existing={editing}
          open={formOpen}
          onClose={() => { setFormOpen(false); setEditing(null); }}
          onSaved={handleFormSaved}
        />
      )}

      {/* Members assignment dialog */}
      {membersOpen && membersFor && (
        <MembersDialog
          subGroup={{ ...membersFor, members: subGroupDetail?.members ?? [] }}
          groupId={groupId}
          allMembers={allMembers}
          open={membersOpen}
          onClose={() => { setMembersOpen(false); setMembersFor(null); }}
          onChanged={handleMembersChanged}
        />
      )}
    </div>
  );
};

export default GroupSubGroups;

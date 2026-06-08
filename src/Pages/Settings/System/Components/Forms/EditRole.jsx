import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import useRefreshToken from "@/MiddleWares/Hooks/useRefreshToken";
import { toast } from "@/hooks/use-toast";

export default function EditRole() {
  const axiosPrivate = useAxiosPrivate();
  const refresh = useRefreshToken();
  const { id } = useParams();
  const queryClient = useQueryClient();

  const [selected, setSelected] = useState(new Set());

  /* ── data ── */
  const { data: roleData, isLoading: loadingRole } = useQuery({
    queryKey: ["role", id],
    queryFn: async () => {
      const res = await axiosPrivate.get(`/settings/rights/roles/${id}`);
      return res.data.data;
    },
  });

  const { data: permissionsData = [], isLoading: loadingPerms } = useQuery({
    queryKey: ["permissions"],
    queryFn: async () => {
      const res = await axiosPrivate.get("/settings/rights/permissions");
      return res.data.data.permissions ?? [];
    },
  });

  /* seed selected set when role loads */
  useEffect(() => {
    if (roleData?.permissions) {
      setSelected(new Set(roleData.permissions.map((p) => p.id)));
    }
  }, [roleData]);

  /* ── helpers ── */
  const toggle = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const groupIds = (group) => group.permissions.map((p) => p.id);

  const allGroupSelected = (group) =>
    groupIds(group).every((id) => selected.has(id));

  const someGroupSelected = (group) =>
    groupIds(group).some((id) => selected.has(id));

  const toggleGroup = (group) => {
    const ids = groupIds(group);
    const allOn = allGroupSelected(group);
    setSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => (allOn ? next.delete(id) : next.add(id)));
      return next;
    });
  };

  const selectAll = () =>
    setSelected(
      new Set(permissionsData.flatMap((g) => g.permissions.map((p) => p.id)))
    );

  const clearAll = () => setSelected(new Set());

  /* ── mutation ── */
  const mutation = useMutation({
    mutationFn: (data) =>
      axiosPrivate.put(`/settings/rights/roles/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["role", id]);
      toast({ title: "Success", description: "Permissions updated successfully." });
      refresh();
    },
    onError: (err) =>
      toast({
        title: "Error",
        description: err?.response?.data?.messages?.[0] ?? "Failed to update role.",
        variant: "destructive",
      }),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate({ permissions: [...selected] });
  };

  const isLoading = loadingRole || loadingPerms;

  const allKnownIds = new Set(
    permissionsData.flatMap((g) => g.permissions.map((p) => p.id))
  );
  const totalSelected = [...selected].filter((id) => allKnownIds.has(id)).length;
  const totalPermissions = allKnownIds.size;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Editing role</p>
            <h2 className="text-xl font-bold">{roleData?.title}</h2>
          </div>
          <Badge variant="outline" className="text-sm">
            {totalSelected} / {totalPermissions} selected
          </Badge>
        </div>
      </Card>

      {/* Global actions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Assign permissions by group or pick individually
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={selectAll}>
            Select All
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={clearAll}>
            Clear All
          </Button>
        </div>
      </div>

      {/* Permission groups */}
      {permissionsData.map((group) => {
        const groupSelected = groupIds(group).filter((id) => selected.has(id)).length;
        const groupTotal = group.permissions.length;
        const isAllOn = allGroupSelected(group);
        const isSomeOn = someGroupSelected(group) && !isAllOn;

        return (
          <Card key={group.id} className="p-4 space-y-3">
            {/* Group header row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={isAllOn}
                  data-state={
                    isSomeOn ? "indeterminate" : isAllOn ? "checked" : "unchecked"
                  }
                  onCheckedChange={() => toggleGroup(group)}
                />
                <span className="font-semibold text-sm">{group.name}</span>
              </div>
              <Badge variant={groupSelected > 0 ? "default" : "secondary"}>
                {groupSelected} / {groupTotal}
              </Badge>
            </div>

            {/* Individual permissions */}
            <div className="border-t pt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-2">
              {group.permissions.map((perm) => (
                <label
                  key={perm.id}
                  className="flex items-center gap-2 cursor-pointer group"
                >
                  <Checkbox
                    checked={selected.has(perm.id)}
                    onCheckedChange={() => toggle(perm.id)}
                  />
                  <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                    {perm.name}
                  </span>
                </label>
              ))}
            </div>
          </Card>
        );
      })}

      <Button
        type="submit"
        disabled={mutation.isPending}
        className="w-full sm:w-auto"
      >
        {mutation.isPending ? "Saving…" : "Save Changes"}
      </Button>
    </form>
  );
}

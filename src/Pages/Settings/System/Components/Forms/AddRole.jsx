import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { usePermissions } from "@/Queries/Settings/permissions";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { toast } from "@/hooks/use-toast";

export function AddRoleForm() {
  const axiosPrivate = useAxiosPrivate();
  const { data: permissionData = [], isLoading } = usePermissions();

  const [role, setRole] = useState("");
  const [selected, setSelected] = useState(new Set());

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
      new Set(permissionData.flatMap((g) => g.permissions.map((p) => p.id)))
    );

  const clearAll = () => setSelected(new Set());

  /* ── mutation ── */
  const createRole = useMutation({
    mutationFn: (payload) =>
      axiosPrivate.post("/settings/rights/roles", payload),
    onSuccess: () => {
      toast({ title: "Success", description: "Role created successfully." });
      setRole("");
      setSelected(new Set());
    },
    onError: (err) =>
      toast({
        title: "Error",
        description: err?.response?.data?.messages?.[0] ?? "Failed to create role.",
        variant: "destructive",
      }),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!role.trim()) {
      toast({ title: "Validation", description: "Role title is required.", variant: "destructive" });
      return;
    }
    createRole.mutate({ role: role.trim(), permissions: [...selected] });
  };

  const totalSelected = selected.size;
  const totalPermissions = permissionData.reduce(
    (s, g) => s + g.permissions.length,
    0
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Role name */}
      <Card className="p-4 space-y-3">
        <div className="space-y-1">
          <label className="text-sm font-medium">Role Title</label>
          <Input
            placeholder="e.g. Branch Manager"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
        </div>
      </Card>

      {/* Global actions */}
      {!isLoading && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {totalSelected} / {totalPermissions} permissions selected
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
      )}

      {/* Permission groups */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading permissions…</p>
      ) : (
        permissionData.map((group) => {
          const groupSelected = groupIds(group).filter((id) => selected.has(id)).length;
          const groupTotal = group.permissions.length;
          const isAllOn = allGroupSelected(group);
          const isSomeOn = someGroupSelected(group) && !isAllOn;

          return (
            <Card key={group.id} className="p-4 space-y-3">
              {/* Group header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={isAllOn}
                    data-state={isSomeOn ? "indeterminate" : isAllOn ? "checked" : "unchecked"}
                    onCheckedChange={() => toggleGroup(group)}
                  />
                  <span className="font-semibold text-sm">{group.name}</span>
                </div>
                <Badge variant={groupSelected > 0 ? "default" : "secondary"}>
                  {groupSelected} / {groupTotal}
                </Badge>
              </div>

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
        })
      )}

      <Button type="submit" disabled={createRole.isPending} className="w-full sm:w-auto">
        {createRole.isPending ? "Creating…" : "Create Role"}
      </Button>
    </form>
  );
}

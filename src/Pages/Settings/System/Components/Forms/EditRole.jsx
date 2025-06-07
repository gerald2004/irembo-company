import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useEffect } from "react";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { toast } from "@/hooks/use-toast";
export default function EditRole() {
  const axiosPrivate = useAxiosPrivate();
  const { id } = useParams();
  const queryClient = useQueryClient();

  // Fetch role details
  const { data: roleData, isLoading: isLoadingRole } = useQuery({
    queryKey: ["role", id],
    queryFn: async () => {
      const res = await axiosPrivate.get(`/settings/rights/roles/${id}`);
      return res.data.data;
    },
  });

  // Fetch all permissions
  const { data: permissionsData, isLoading: isLoadingPermissions } = useQuery({
    queryKey: ["permissions"],
    queryFn: async () => {
      const res = await axiosPrivate.get("/settings/rights/permissions");
      return res.data.data.permissions; // grouped permissions
    },
  });

  const { handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      permissions: [],
    },
  });

  // Populate selected permissions on load
  useEffect(() => {
    if (roleData) {
      const selected = roleData.permissions.map((p) => p.id);
      setValue("permissions", selected);
    }
  }, [roleData, setValue]);

  const selectedPermissions = watch("permissions");

  const mutation = useMutation({
    mutationFn: async (data) => {
      return axiosPrivate.put(`/settings/rights/roles/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["role", id]);
      toast({
        title: "Success",
        description: "Permissions updated successfully",
      });
    },
  });

  const onSubmit = (data) => {
    mutation.mutate({
      permissions: data.permissions,
    });
  };

  if (isLoadingRole || isLoadingPermissions) return <p>Loading...</p>;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <h2 className="text-xl font-bold">Edit Role: {roleData.title}</h2>

      {permissionsData.map((group) => (
        <div key={group.id} className="border p-4 rounded">
          <h3 className="font-semibold mb-2">{group.name}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {group.permissions.map((perm) => (
              <label key={perm.id} className="flex items-center gap-2 text-xs">
                <Checkbox
                  checked={selectedPermissions.includes(perm.id)}
                  onCheckedChange={(checked) => {
                    const updated = checked
                      ? [...selectedPermissions, perm.id]
                      : selectedPermissions.filter((id) => id !== perm.id);
                    setValue("permissions", updated);
                  }}
                />
                {perm.name}
              </label>
            ))}
          </div>
        </div>
      ))}

      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  );
}

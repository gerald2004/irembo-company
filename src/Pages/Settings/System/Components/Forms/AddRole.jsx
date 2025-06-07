import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Card } from "@/components/ui/card";
import { usePermissions } from "@/Queries/Settings/permissions";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { toast } from "@/hooks/use-toast";
export function AddRoleForm() {
  const axiosPrivate = useAxiosPrivate();
  const form = useForm({
    defaultValues: {
      role: "",
      permissions: [],
    },
  });

  const { data: permissionData, isLoading } = usePermissions();

  const createRole = useMutation({
    mutationFn: async (payload) => {
      return await axiosPrivate.post("/settings/rights/roles", payload);
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Role created successfully." });
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create role.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values) => {
    createRole.mutate(values);
  };

  return (
    <Card className="p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role Title</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Manager" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {!isLoading &&
            permissionData?.map((group) => (
              <div key={group.id} className="border rounded-md p-4">
                <h4 className="text-lg font-semibold mb-2">{group.name}</h4>
                <div className="grid grid-cols-2 gap-2">
                  {group.permissions.map((perm) => (
                    <FormField
                      key={perm.id}
                      control={form.control}
                      name="permissions"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(perm.id)}
                              onCheckedChange={(checked) => {
                                const newValue = checked
                                  ? [...(field.value || []), perm.id]
                                  : (field.value || []).filter(
                                      (id) => id !== perm.id
                                    );
                                field.onChange(newValue);
                              }}
                            />
                          </FormControl>
                          <FormLabel className="text-xs">{perm.name}</FormLabel>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>
            ))}

          <Button type="submit" disabled={createRole.isPending}>
            {createRole.isPending ? "Saving..." : "Create Role"}
          </Button>
        </form>
      </Form>
    </Card>
  );
}

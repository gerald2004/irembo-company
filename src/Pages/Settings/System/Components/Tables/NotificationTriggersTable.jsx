import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";

import Datatable from "@/Pages/Components/Datatable";
import { toast } from "@/hooks/use-toast";

export function NotificationTriggersTable() {
  const navigate = useNavigate();
  const axiosPrivate = useAxiosPrivate();
  const queryClient = useQueryClient(); // ✅ Use QueryClient for cache invalidation

  // ✅ Fetch Notification Triggers
  const {
    data = [],
    isLoading,
    isRefetching,
    isError,
  } = useQuery({
    queryKey: ["notification_triggers"],
    queryFn: async () => {
            const controller = new AbortController();

      const fetchURL = `/settings/notification-triggers`;
      try {
        const response = await axiosPrivate.get(fetchURL, {
          signal: controller.signal,
        });
        return response?.data?.data?.notification_triggers ?? [];
      } catch (error) {
        if (error?.response?.status === 401) {
          navigate("/", { state: { from: location }, replace: true });
        }
        throw error;
      }
    },
    keepPreviousData: true,
  });

  // ✅ Mutation to update status
  const mutation = useMutation({
    mutationFn: async ({ trigger_id, status }) => {
            const controller = new AbortController();

      return axiosPrivate.patch(
        `/settings/notification-triggers/${trigger_id}`,
        { status },
        { signal: controller.signal }
      );
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Status updated successfully" });

      // ✅ Use `invalidateQueries` instead of manual `refetch()`
      queryClient.invalidateQueries(["notification_triggers"]);
    },
    onError: (error) => {
      toast({
        title: "Error updating status",
        variant: "destructive",
        description: error?.response?.data?.messages || "An error occurred",
      });
    },
  });

  // ✅ Toggle Status Handler
  const handleToggleStatus = async (trigger) => {
    const newStatus = trigger.status === "Active" ? "Inactive" : "Active";
    mutation.mutate({ trigger_id: trigger.trigger_id, status: newStatus });
  };

  // ✅ Table Columns
  const columns = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
    },
    {
      accessorKey: "trigger_name",
      header: "Trigger Name",
      cell: ({ row }) => (
        <p className="capitalize">{row.original.trigger_name}</p>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Switch
          checked={row.original.status === "Active"}
          onCheckedChange={() => handleToggleStatus(row.original)}
        />
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => <p>{row.original.description || "N/A"}</p>,
    },
  ];

  return (
    <Datatable
      columns={columns}
      data={data}
      fetchData={() => queryClient.invalidateQueries(["notification_triggers"])}
      isLoading={isLoading}
      isRefetching={isRefetching}
      isError={isError}
    />
  );
}

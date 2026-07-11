import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import Datatable from "@/Pages/Components/Datatable";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";

export function SaccoSystemSettingsTable() {
  const navigate = useNavigate();
  const axiosPrivate = useAxiosPrivate();
  const queryClient = useQueryClient();

  // ✅ Mapping setting keys to readable names
  const settingLabels = {
    sacco_sms_status: {
      label: "SMS Notifications",
      description:
        "Enable or disable sending SMS notifications to users or clients for various system actions like transactions or alerts.",
    },
    sacco_email_status: {
      label: "Email Notifications",
      description:
        "Control whether emails should be sent for system activities such as approvals, alerts, and reports.",
    },
    sacco_loan_penalties: {
      label: "Loan Penalties",
      description:
        "Enable or disable automatic penalties for overdue loan repayments based on Business policy.",
    },
    sacco_mobile_app_login: {
      label: "Client App Login",
      description:
        "Enable or disable login access to the mobile application for Business clients.",
    },
    sacco_staff_mobile_app: {
      label: "Staff App Access",
      description:
        "Toggle mobile app login for Business staff members like tellers or loan officers.",
    },
    sacco_client_portal_login: {
      label: "Client Portal Access",
      description:
        "Allow or block clients from accessing their accounts via the online client portal.",
    },
    sacco_system_status: {
      label: "System Access",
      description:
        "Lock or open the Business system. When locked, no operations can be performed except by administrators.",
    },
    sacco_loan_auto_charge: {
      label: "Auto Loan Charge",
      description:
        "Automatically deduct interest and other charges from client accounts based on loan settings.",
    },
    sacco_monthly_auto_charge_settings: {
      label: "Monthly Charges",
      description:
        "Enable monthly automatic deductions for fees or savings products assigned to clients.",
    },
    sacco_salary_advances: {
      label: "Salary Advances",
      description:
        "Enable or disable the salary advance module for this Business.",
    },
  };
  // ✅ Fetch current settings
  const {
    data: settings = {},
    isLoading,
    isRefetching,
    isError,
  } = useQuery({
    queryKey: ["sacco_system_settings"],
    queryFn: async () => {
      const controller = new AbortController();
      try {
        const response = await axiosPrivate.get(`/settings/general-triggers`, {
          signal: controller.signal,
        });
        return response?.data?.data?.settings ?? {};
      } catch (error) {
        if (error?.response?.status === 401) {
          navigate("/", { state: { from: location }, replace: true });
        }
        throw error;
      }
    },
  });

  // ✅ Mutation to update a single setting
  const mutation = useMutation({
    mutationFn: async ({ key, value }) => {
      return axiosPrivate.patch(`/settings/general-triggers/${key}`, {
        value,
      });
    },
    onSuccess: () => {
      toast({ title: "Updated", description: "Setting updated successfully" });
      queryClient.invalidateQueries(["sacco_system_settings"]);
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        variant: "destructive",
        description:
          error?.response?.data?.messages || "Unable to update setting",
      });
    },
  });

  // ✅ Toggle status
  const handleToggle = (key, currentValue) => {
    const newValue =
      currentValue === "yes"
        ? "no"
        : currentValue === "no"
        ? "yes"
        : currentValue === "open"
        ? "locked"
        : "open";

    mutation.mutate({ key, value: newValue });
  };

  // Loan alert toggles are managed in Loan Notifications Admin — exclude from this table
  const EXCLUDED_KEYS = ['sacco_sacco_loan_alerts', 'sacco_loan_alerts'];

  // ✅ Format settings into rows
  const settingData = Object.entries(settings)
    .filter(([key]) => !EXCLUDED_KEYS.includes(key))
    .map(([key, value]) => ({
      key,
      label: settingLabels[key]?.label || key,
      value,
      description: settingLabels[key]?.description || "No description available.",
    }));

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
      accessorKey: "label",
      header: "Setting",
    },
    {
      accessorKey: "value",
      header: "Status",
      cell: ({ row }) => (
        <Switch
          checked={["yes", "open"].includes(row.original.value)}
          onCheckedChange={() =>
            handleToggle(row.original.key, row.original.value)
          }
        />
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
    },
  ];

  return (
    <Datatable
      columns={columns}
      data={settingData}
      fetchData={() => queryClient.invalidateQueries(["sacco_system_settings"])}
      isLoading={isLoading}
      isRefetching={isRefetching}
      isError={isError}
    />
  );
}

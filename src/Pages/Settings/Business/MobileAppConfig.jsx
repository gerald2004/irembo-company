import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { useNavigate } from "react-router-dom";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Users,
  UserMinus,
  FileText,
  Calculator,
  UserPlus,
  Eye,
  Smartphone,
  Building2,
  UsersRound,
} from "lucide-react";

const FEATURE_GROUPS = [
  {
    group: "Teller",
    description: "Controls what transaction types staff can process on the mobile app.",
    features: [
      {
        key: "app_deposits",
        label: "Individual Deposits",
        description: "Allow staff to make savings deposits for individual clients.",
        icon: ArrowDownToLine,
      },
      {
        key: "app_withdrawals",
        label: "Individual Withdrawals",
        description: "Allow staff to process withdrawals for individual clients.",
        icon: ArrowUpFromLine,
      },
      {
        key: "app_group_deposits",
        label: "Group Deposits",
        description: "Allow staff to make savings deposits for group accounts.",
        icon: Users,
      },
      {
        key: "app_group_withdrawals",
        label: "Group Withdrawals",
        description: "Allow staff to process withdrawals for group accounts.",
        icon: UserMinus,
      },
      {
        key: "app_joint_deposits",
        label: "Joint Account Deposits",
        description: "Allow staff to make savings deposits for joint accounts.",
        icon: UsersRound,
      },
      {
        key: "app_company_deposits",
        label: "Company Deposits",
        description: "Allow staff to make savings deposits for company clients.",
        icon: Building2,
      },
      {
        key: "app_joint_withdrawals",
        label: "Joint Account Withdrawals",
        description: "Allow staff to process withdrawals for joint accounts.",
        icon: UsersRound,
      },
      {
        key: "app_company_withdrawals",
        label: "Company Withdrawals",
        description: "Allow staff to process withdrawals for company clients.",
        icon: Building2,
      },
    ],
  },
  {
    group: "Loans",
    description: "Controls loan-related features available to staff on the mobile app.",
    features: [
      {
        key: "app_loan_applications",
        label: "Loan Applications",
        description: "Allow staff to submit new loan applications from the mobile app.",
        icon: FileText,
      },
      {
        key: "app_loan_calculator",
        label: "Loan Calculator",
        description: "Show the loan repayment calculator in the mobile app.",
        icon: Calculator,
      },
    ],
  },
  {
    group: "Clients",
    description: "Controls client registration types available in the mobile app.",
    features: [
      {
        key: "app_new_client",
        label: "Register Individual Client",
        description: "Allow staff to register new individual clients via the mobile app.",
        icon: UserPlus,
      },
      {
        key: "app_group_registration",
        label: "Register Group",
        description: "Allow staff to register new savings groups via the mobile app.",
        icon: Users,
      },
      {
        key: "app_company_registration",
        label: "Register Company",
        description: "Allow staff to register new company clients via the mobile app.",
        icon: FileText,
      },
      {
        key: "app_joint_registration",
        label: "Register Joint Account",
        description: "Allow staff to open new joint accounts via the mobile app.",
        icon: UserPlus,
      },
    ],
  },
  {
    group: "Display",
    description: "Controls what financial information is visible to staff.",
    features: [
      {
        key: "app_show_balance",
        label: "Show Account Balances",
        description:
          "Display account balances in the mobile app. Disable to hide balances for tellers.",
        icon: Eye,
      },
    ],
  },
];

function FeatureRow({ feature, value, onToggle, isPending }) {
  const Icon = feature.icon;
  const enabled = value === "yes";

  return (
    <div className="flex items-start gap-4 py-4 border-b last:border-0">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-none">{feature.label}</p>
        <p className="mt-1 text-sm text-muted-foreground">{feature.description}</p>
      </div>
      <Switch
        checked={enabled}
        onCheckedChange={() => onToggle(feature.key, value)}
        disabled={isPending}
        className="mt-0.5"
      />
    </div>
  );
}

function FeatureGroupCard({ group, config, onToggle, isPending, isLoading }) {
  return (
    <div className="rounded-xl border bg-card">
      <div className="px-5 pt-5 pb-4 border-b">
        <p className="text-sm font-semibold">{group.group}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{group.description}</p>
      </div>
      <div className="px-5">
        {isLoading
          ? group.features.map((f) => (
              <div key={f.key} className="flex items-start gap-4 py-4 border-b last:border-0">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-64" />
                </div>
                <Skeleton className="h-5 w-9 rounded-full mt-0.5" />
              </div>
            ))
          : group.features.map((f) => (
              <FeatureRow
                key={f.key}
                feature={f}
                value={config[f.key] ?? "yes"}
                onToggle={onToggle}
                isPending={isPending}
              />
            ))}
      </div>
    </div>
  );
}

function MobileConfigSettings() {
  const axiosPrivate = useAxiosPrivate();
  const queryClient  = useQueryClient();
  const navigate     = useNavigate();

  const { data: config = {}, isLoading, isError } = useQuery({
    queryKey: ["mobile-app-config"],
    queryFn: async () => {
      const controller = new AbortController();
      try {
        const res = await axiosPrivate.get("/settings/mobile/config", {
          signal: controller.signal,
        });
        return res?.data?.data?.config ?? {};
      } catch (error) {
        if (error?.response?.status === 401) {
          navigate("/", { state: { from: location }, replace: true });
        }
        throw error;
      }
    },
  });

  const mutation = useMutation({
    mutationFn: ({ key, value }) =>
      axiosPrivate.patch(`/settings/mobile/config/${key}`, {
        value: value === "yes" ? "no" : "yes",
      }),
    onSuccess: (_, { key, value }) => {
      const next = value === "yes" ? "no" : "yes";
      toast({
        title: next === "yes" ? "Feature enabled" : "Feature disabled",
        description: `Setting updated successfully.`,
      });
      queryClient.invalidateQueries(["mobile-app-config"]);
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        variant: "destructive",
        description:
          error?.response?.data?.messages?.[0] ?? "Unable to update setting.",
      });
    },
  });

  const handleToggle = (key, currentValue) => {
    mutation.mutate({ key, value: currentValue });
  };

  if (isError) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
        Failed to load mobile app configuration. Please refresh the page.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {FEATURE_GROUPS.map((group) => (
        <FeatureGroupCard
          key={group.group}
          group={group}
          config={config}
          onToggle={handleToggle}
          isPending={mutation.isPending}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
}

const MobileAppConfig = () => {
  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="/dashboard">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink to="/settings">Settings</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Mobile App Config</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="space-y-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-muted">
            <Smartphone className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Mobile App Configuration</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Control which features are available to staff in the mobile app.
              Changes take effect within 15 minutes.
            </p>
          </div>
        </div>

        <MobileConfigSettings />
      </div>
    </>
  );
};

export default MobileAppConfig;

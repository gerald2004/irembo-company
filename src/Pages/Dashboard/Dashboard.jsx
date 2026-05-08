import { useState } from "react";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { CalendarDateRangePicker } from "@/components/date-range-picker";
import {
  LayoutDashboard,
  Landmark,
  CreditCard,
  Users,
  Bell,
  RefreshCw,
  BarChart3,
} from "lucide-react";
import DashboardOverview from "./components/DashboardOverview";
import DashboardTransactions from "./components/DashboardTransactions";
import DashboardLoans from "./components/DashboardLoans";
import DashboardMembership from "./components/DashboardMembership";
import DashboardNotifications from "./components/DashboardNotifications";
import DashboardFinancial from "./components/DashboardFinancial";
import LoanApprovalWidget from "./components/LoanApprovalWidget";
import useAuth from "@/MiddleWares/Hooks/useAuth";
import { hasPermission } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

const Dashboard = () => {
  const { auth } = useAuth();
  const roles = auth?.roles;
  const queryClient = useQueryClient();

  const fyStart = auth?.fiscalYear?.start_date;
  const [dateRange, setDateRange] = useState({
    from: fyStart ? new Date(fyStart) : new Date(new Date().getFullYear(), 0, 1),
    to: new Date(),
  });

  const startDate = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : null;
  const endDate   = dateRange?.to   ? format(dateRange.to,   "yyyy-MM-dd") : null;

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="dashboard">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Dashboard</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Welcome back, {auth?.user?.firstname}. Here&apos;s what&apos;s happening today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CalendarDateRangePicker
            defaultValue={dateRange}
            onChange={(range) => range?.from && range?.to && setDateRange(range)}
          />
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => queryClient.invalidateQueries({
              predicate: (q) => String(q.queryKey[0]).startsWith("dashboard-"),
            })}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue={auth?.user?.dashboard} className="space-y-6">
        <TabsList className="h-10 bg-muted/60 p-1 rounded-xl border gap-0.5 flex-wrap h-auto">
          {hasPermission(roles, 100002) && (
            <TabsTrigger
              value="overview"
              className="gap-1.5 rounded-lg text-xs font-medium px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              Overview
            </TabsTrigger>
          )}
          {hasPermission(roles, 100003) && (
            <TabsTrigger
              value="accounting"
              className="gap-1.5 rounded-lg text-xs font-medium px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Landmark className="h-3.5 w-3.5" />
              Accounting
            </TabsTrigger>
          )}
          {hasPermission(roles, 100005) && (
            <TabsTrigger
              value="loans"
              className="gap-1.5 rounded-lg text-xs font-medium px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <CreditCard className="h-3.5 w-3.5" />
              Loans
            </TabsTrigger>
          )}
          {hasPermission(roles, 100006) && (
            <TabsTrigger
              value="members"
              className="gap-1.5 rounded-lg text-xs font-medium px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Users className="h-3.5 w-3.5" />
              Members
            </TabsTrigger>
          )}
          {hasPermission(roles, 100007) && (
            <TabsTrigger
              value="financial"
              className="gap-1.5 rounded-lg text-xs font-medium px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Financial
            </TabsTrigger>
          )}
          {hasPermission(roles, 100004) && (
            <TabsTrigger
              value="notifications"
              className="gap-1.5 rounded-lg text-xs font-medium px-3 py-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Bell className="h-3.5 w-3.5" />
              Notifications
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview">
          {hasPermission(roles, 100002) && (
            <div className="space-y-6">
              <LoanApprovalWidget />
              <DashboardOverview />
            </div>
          )}
        </TabsContent>
        <TabsContent value="accounting">
          {hasPermission(roles, 100003) && <DashboardTransactions startDate={startDate} endDate={endDate} />}
        </TabsContent>
        <TabsContent value="loans">
          {hasPermission(roles, 100005) && <DashboardLoans startDate={startDate} endDate={endDate} />}
        </TabsContent>
        <TabsContent value="members">
          {hasPermission(roles, 100006) && <DashboardMembership startDate={startDate} endDate={endDate} />}
        </TabsContent>
        <TabsContent value="financial">
          {hasPermission(roles, 100007) && <DashboardFinancial startDate={startDate} endDate={endDate} />}
        </TabsContent>
        <TabsContent value="notifications">
          {hasPermission(roles, 100004) && <DashboardNotifications startDate={startDate} endDate={endDate} />}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;

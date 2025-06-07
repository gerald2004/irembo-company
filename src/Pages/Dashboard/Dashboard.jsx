import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDateRangePicker } from "@/components/date-range-picker";
import DashboardOverview from "./components/DashboardOverview";
import DashboardTransactions from "./components/DashboardTransactions";
import DashboardLoans from "./components/DashboardLoans";
import DashboardMembership from "./components/DashboardMembership";
import DashboardNotifications from "./components/DashboardNotifications";
import useAuth from "@/MiddleWares/Hooks/useAuth";
import { hasPermission } from "@/lib/utils";

const Dashboard = () => {
  const { auth } = useAuth();
  const roles = auth?.roles;

  return (
    <>
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
      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <div className="flex items-center justify-between space-y-2">
            <h5 className="text-2xl font-bold tracking-tight">Dashboard</h5>
            <div className="flex items-center space-x-2">
              <CalendarDateRangePicker />
              <Button size="sm">Update</Button>
            </div>
          </div>
          <Tabs defaultValue={auth?.user?.dashboard} className="space-y-4">
            <TabsList>
              {hasPermission(roles, 100002) && (
                <TabsTrigger value="overview">Overview</TabsTrigger>
              )}
              {hasPermission(roles, 100003) && (
                <TabsTrigger value="accounting">Accounting</TabsTrigger>
              )}
              {hasPermission(roles, 100005) && (
                <TabsTrigger value="loans">Loans</TabsTrigger>
              )}
              {hasPermission(roles, 100006) && (
                <TabsTrigger value="members">Members</TabsTrigger>
              )}
              {hasPermission(roles, 100004) && (
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
              )}
            </TabsList>
            <TabsContent value="overview" className="space-y-4">
              {hasPermission(roles, 100002) && <DashboardOverview />}
            </TabsContent>
            <TabsContent value="accounting" className="space-y-4">
              {hasPermission(roles, 100003) && <DashboardTransactions />}
            </TabsContent>
            <TabsContent value="loans" className="space-y-4">
              {hasPermission(roles, 100005) && <DashboardLoans />}
            </TabsContent>
            <TabsContent value="members" className="space-y-4">
              {hasPermission(roles, 100006) && <DashboardMembership />}
            </TabsContent>
            <TabsContent value="notifications" className="space-y-4">
              {hasPermission(roles, 100004) && <DashboardNotifications />}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default Dashboard;

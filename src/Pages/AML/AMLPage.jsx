import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, AlertTriangle, FolderOpen, BookOpen } from "lucide-react";
import AMLDashboard from "./AMLDashboard";
import AMLPolicies  from "./AMLPolicies";
import AMLAlerts    from "./AMLAlerts";
import AMLCases     from "./AMLCases";
import { useSearchParams } from "react-router-dom";

const AMLPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") ?? "overview";

  const setTab = (v) => setSearchParams({ tab: v }, { replace: true });

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="/dashboard">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Anti-Money Laundering</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between mt-2 mb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" /> AML Engine
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monitor transactions, manage policies, investigate alerts and cases
          </p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="overview" className="gap-1.5 text-xs">
            <Shield className="h-3.5 w-3.5" /> Overview
          </TabsTrigger>
          <TabsTrigger value="policies" className="gap-1.5 text-xs">
            <BookOpen className="h-3.5 w-3.5" /> Policies
          </TabsTrigger>
          <TabsTrigger value="alerts" className="gap-1.5 text-xs">
            <AlertTriangle className="h-3.5 w-3.5" /> Alerts
          </TabsTrigger>
          <TabsTrigger value="cases" className="gap-1.5 text-xs">
            <FolderOpen className="h-3.5 w-3.5" /> Cases
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview"><AMLDashboard /></TabsContent>
        <TabsContent value="policies"><AMLPolicies /></TabsContent>
        <TabsContent value="alerts"><AMLAlerts /></TabsContent>
        <TabsContent value="cases"><AMLCases /></TabsContent>
      </Tabs>
    </>
  );
};

export default AMLPage;

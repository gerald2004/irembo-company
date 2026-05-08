import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck, ListChecks, Settings2, Clock } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import QMSApprovals        from "./QMSApprovals";
import QMSPolicies         from "./QMSPolicies";
import QMSPendingApprovals from "./QMSPendingApprovals";

const QMSPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") ?? "approvals";

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
            <BreadcrumbPage>QMS — Checker / Maker</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center justify-between mt-2 mb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" /> Quality Management System
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Four-eyes control — checkers review and approve pending journal entries and operational actions; admins configure which modules require approval.
          </p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="approvals" className="gap-1.5 text-xs">
            <ListChecks className="h-3.5 w-3.5" /> JE Approval Queue
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-1.5 text-xs">
            <Clock className="h-3.5 w-3.5" /> Pending Actions
          </TabsTrigger>
          <TabsTrigger value="policies" className="gap-1.5 text-xs">
            <Settings2 className="h-3.5 w-3.5" /> Policies
          </TabsTrigger>
        </TabsList>

        <TabsContent value="approvals"><QMSApprovals /></TabsContent>
        <TabsContent value="pending"><QMSPendingApprovals /></TabsContent>
        <TabsContent value="policies"><QMSPolicies /></TabsContent>
      </Tabs>
    </>
  );
};

export default QMSPage;

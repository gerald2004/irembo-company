import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList,
  BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import AccountSummary from "./Components/AccountSummary";
import Accounts from "./Components/Accounts";
import Communication from "./Components/Communication";
import { SharesTable } from "./Components/Tables/SharesTable";
import useAuth from "@/MiddleWares/Hooks/useAuth";
import { hasPermission } from "@/lib/utils";
import { Users, CreditCard, MessageSquare, PieChart, Brain, Layers } from "lucide-react";
import GroupIntelligence from "./Components/GroupIntelligence";
import GroupSubGroups from "./Components/GroupSubGroups";

const TAB_CLASS =
  "rounded-none border-b-2 border-transparent px-4 py-2 text-sm font-medium text-muted-foreground " +
  "data-[state=active]:border-primary data-[state=active]:text-foreground";

const SingleGroupClient = () => {
  const navigate = useNavigate();
  const axiosPrivate = useAxiosPrivate();
  const params = useParams();
  const { auth } = useAuth();
  const roles = auth?.roles;

  const { data = [], isLoading, refetch, isRefetching, isError } = useQuery({
    queryKey: ["group-data", params.id],
    queryFn: async () => {
      try {
        const response = await axiosPrivate.get(`/clients/groups/${params.id}`);
        if (!response.data.data) throw new Error(response?.data?.message);
        return response.data.data;
      } catch (error) {
        if (error?.response?.status === 401) {
          navigate("/", { state: { from: location }, replace: true });
        }
        throw new Error(error?.response?.data?.message);
      }
    },
  });

  const group = data?.client;

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="/dashboard">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink to="/clients">Clients</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              {isLoading ? "Loading…" : (group?.client_group_name ?? "Group")}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Client header */}
      <div className="flex items-center gap-4 py-3 border-b">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <Skeleton className="h-5 w-48" />
          ) : (
            <>
              <p className="font-semibold capitalize">{group?.client_group_name || "—"}</p>
              <p className="text-xs text-muted-foreground font-mono">{group?.client_account_number}</p>
            </>
          )}
        </div>
        {!isLoading && group?.client_status && (
          <Badge variant={group.client_status === "active" ? "success" : "destructive"} className="capitalize">
            {group.client_status}
          </Badge>
        )}
      </div>

      <div className="flex-1 pt-2">
        <Tabs defaultValue="summary" className="space-y-4">
          <TabsList className="border-b w-full justify-start rounded-none bg-transparent p-0 h-auto gap-1">
            {hasPermission(roles, 100008) && (
              <TabsTrigger value="summary" className={TAB_CLASS}>Summary</TabsTrigger>
            )}
            {hasPermission(roles, 100033) && (
              <TabsTrigger value="accounts" className={TAB_CLASS}>
                <CreditCard className="w-3.5 h-3.5 mr-1.5" />Accounts
              </TabsTrigger>
            )}
            {hasPermission(roles, 100060) && (
              <TabsTrigger value="communication" className={TAB_CLASS}>
                <MessageSquare className="w-3.5 h-3.5 mr-1.5" />Communication
              </TabsTrigger>
            )}
            {hasPermission(roles, 100064) && (
              <TabsTrigger value="shares" className={TAB_CLASS}>
                <PieChart className="w-3.5 h-3.5 mr-1.5" />Shares
              </TabsTrigger>
            )}
            <TabsTrigger value="sub-groups" className={TAB_CLASS}>
              <Layers className="w-3.5 h-3.5 mr-1.5" />Sub-Groups
            </TabsTrigger>
            <TabsTrigger value="intelligence" className={TAB_CLASS}>
              <Brain className="w-3.5 h-3.5 mr-1.5" />Intelligence
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary">
            {hasPermission(roles, 100008) && (
              <AccountSummary
                data={group}
                isLoading={isLoading}
                refetch={refetch}
                isRefetching={isRefetching}
                isError={isError}
              />
            )}
          </TabsContent>
          <TabsContent value="accounts">
            {hasPermission(roles, 100033) && <Accounts />}
          </TabsContent>
          <TabsContent value="communication">
            {hasPermission(roles, 100060) && <Communication />}
          </TabsContent>
          <TabsContent value="shares">
            {hasPermission(roles, 100064) && <SharesTable />}
          </TabsContent>
          <TabsContent value="sub-groups">
            <GroupSubGroups groupId={group?.client_id} />
          </TabsContent>
          <TabsContent value="intelligence">
            <GroupIntelligence clientId={group?.client_id} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default SingleGroupClient;

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
import ClientAccountIntelligence from "./Components/Blocks/ClientAccountIntelligence";
import { User, CreditCard, MessageSquare, PieChart, Brain } from "lucide-react";

const TAB_CLASS =
  "rounded-none border-b-2 border-transparent px-4 py-2 text-sm font-medium text-muted-foreground " +
  "data-[state=active]:border-primary data-[state=active]:text-foreground";

const SingleIndividualClient = () => {
  const navigate = useNavigate();
  const axiosPrivate = useAxiosPrivate();
  const params = useParams();
  const { auth } = useAuth();
  const roles = auth?.roles;

  const { data = [], isLoading, refetch, isRefetching, isError } = useQuery({
    queryKey: ["individuals-data", params.id],
    queryFn: async () => {
      try {
        const response = await axiosPrivate.get(`/clients/individual/${params.id}`);
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

  const client = data?.client;
  const fullName = [client?.client_firstname, client?.client_middlename, client?.client_lastname]
    .filter(Boolean).join(" ");

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="/dashboard">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink to={hasPermission(roles, [100015, 100011]) ? "/clients" : ""}>
              Clients
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              {isLoading ? "Loading…" : fullName}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Client header */}
      <div className="flex items-center gap-4 py-3 border-b">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <User className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <Skeleton className="h-5 w-48" />
          ) : (
            <>
              <p className="font-semibold capitalize">{fullName || "—"}</p>
              <p className="text-xs text-muted-foreground font-mono">{client?.client_account_number}</p>
            </>
          )}
        </div>
        {!isLoading && client?.client_status && (
          <Badge variant={client.client_status === "active" ? "success" : "destructive"} className="capitalize">
            {client.client_status}
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
            {hasPermission(roles, 100064) && (
              <TabsTrigger value="client-intelligence" className={TAB_CLASS}>
                <Brain className="w-3.5 h-3.5 mr-1.5" />Intelligence
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="summary">
            {hasPermission(roles, 100008) && (
              <AccountSummary
                data={client}
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
          <TabsContent value="client-intelligence">
            {hasPermission(roles, 100064) && <ClientAccountIntelligence clientId={params.id} />}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default SingleIndividualClient;

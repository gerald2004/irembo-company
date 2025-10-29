import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AccountSummary from "./Components/AccountSummary";
import Accounts from "./Components/Accounts";
import Communication from "./Components/Communication";
import { SharesTable } from "./Components/Tables/SharesTable";
import useAuth from "@/MiddleWares/Hooks/useAuth";
import { hasPermission } from "@/lib/utils";
import ClientAccountIntelligence from "./Components/Blocks/ClientAccountIntelligence";

const SingleIndividualClient = () => {
  const navigate = useNavigate();
  const axiosPrivate = useAxiosPrivate();
  const params = useParams();
  const { auth } = useAuth();

  const roles = auth?.roles;
  const {
    data = [],
    isLoading,
    refetch,
    isRefetching,
    isError,
  } = useQuery({
    queryKey: ["individuals-data", params.id],
    queryFn: async () => {
      const controller = new AbortController();

      const fetchURL = `/clients/individual/${params.id}`;
      try {
        const response = await axiosPrivate.get(fetchURL, {
          signal: controller.signal,
        });
        if (!response.data.data) {
          throw new Error(response?.data?.message);
        }
        return response.data.data;
      } catch (error) {
        if (error?.response?.status === 401) {
          navigate("/", { state: { from: location }, replace: true });
        }
        throw new Error(error?.response?.data?.message);
      }
    },
  });
  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="/dashboard">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink
              to={hasPermission(roles, [100015, 100011]) ? "/clients" : ""}
            >
              Clients
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              <p className="capitalize hover:uppercase">
                {`${data?.client?.client_firstname} ${data?.client?.client_middlename} ${data?.client?.client_lastname} (${data?.client?.client_account_number})`}
              </p>
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 pt-2">
          <Tabs defaultValue="summary" className="space-y-4">
            <div className="flex justify-end">
              <TabsList className="overflow-x-auto scroll-smooth snap-x snap-start scrollbar-hide">
                {hasPermission(roles, 100008) && (
                  <TabsTrigger value="summary">Summary</TabsTrigger>
                )}
                {hasPermission(roles, 100033) && (
                  <TabsTrigger value="accounts">Accounts</TabsTrigger>
                )}
                {hasPermission(roles, 100060) && (
                  <TabsTrigger value="communication">Communication</TabsTrigger>
                )}
                {hasPermission(roles, 100064) && (
                  <TabsTrigger value="shares">Shares</TabsTrigger>
                )}
                {hasPermission(roles, 100064) && (
                  <TabsTrigger value="client-intelligence">
                    Client Intelligence
                  </TabsTrigger>
                )}
              </TabsList>
            </div>
            <TabsContent value="summary" className="space-y-4">
              {hasPermission(roles, 100008) && (
                <AccountSummary
                  data={data?.client}
                  isLoading={isLoading}
                  refetch={refetch}
                  isRefetching={isRefetching}
                  isError={isError}
                />
              )}
            </TabsContent>
            <TabsContent value="accounts" className="space-y-4">
              {hasPermission(roles, 100033) && <Accounts />}
            </TabsContent>
            <TabsContent value="communication" className="space-y-4">
              {hasPermission(roles, 100060) && <Communication />}
            </TabsContent>
            <TabsContent value="shares" className="space-y-4">
              {hasPermission(roles, 100064) && <SharesTable />}
            </TabsContent>
            <TabsContent value="client-intelligence" className="space-y-4">
              {hasPermission(roles, 100064) && <ClientAccountIntelligence clientId={params.id} />}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default SingleIndividualClient;

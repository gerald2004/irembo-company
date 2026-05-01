import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Individuals } from "./Components/Individuals/Individuals";
import { Groups } from "./Components/Groups/Groups";
import { Companies } from "./Components/Company/Companies";
import { JointAccounts } from "./Components/JointAccounts/JointAccounts";
import { hasPermission } from "@/lib/utils";
import useAuth from "@/MiddleWares/Hooks/useAuth";

const Clients = () => {
  const { auth } = useAuth();
  const roles = auth?.roles;

  const defaultTab = hasPermission(roles, 100011)
    ? "individuals"
    : hasPermission(roles, 100015)
    ? "groups"
    : "companies";

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="/dashboard">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Clients</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <div className="flex items-center justify-between space-y-2">
            <h5 className="text-2xl font-bold tracking-tight">Clients</h5>
          </div>
          <Tabs defaultValue={defaultTab} className="space-y-4">
            <TabsList>
              {hasPermission(roles, 100011) && (
                <TabsTrigger value="individuals">Individuals</TabsTrigger>
              )}
              {hasPermission(roles, 100015) && (
                <TabsTrigger value="groups">Groups</TabsTrigger>
              )}
              {hasPermission(roles, 100015) && (
                <TabsTrigger value="companies">Companies</TabsTrigger>
              )}
              {hasPermission(roles, 100015) && (
                <TabsTrigger value="joint-accounts">Joint Accounts</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="individuals" className="space-y-4">
              {hasPermission(roles, 100011) && <Individuals />}
            </TabsContent>

            <TabsContent value="groups" className="space-y-4">
              {hasPermission(roles, 100015) && <Groups />}
            </TabsContent>

            <TabsContent value="companies" className="space-y-4">
              {hasPermission(roles, 100015) && <Companies />}
            </TabsContent>

            <TabsContent value="joint-accounts" className="space-y-4">
              {hasPermission(roles, 100015) && <JointAccounts />}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default Clients;

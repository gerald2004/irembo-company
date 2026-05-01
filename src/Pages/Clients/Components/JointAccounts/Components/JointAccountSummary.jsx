/* eslint-disable react/prop-types */
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { User, Users2, FileText, Settings } from "lucide-react";
import { useMediaQuery } from "react-responsive";
import useAuth from "@/MiddleWares/Hooks/useAuth";
import { hasPermission } from "@/lib/utils";
import JointGeneralInfo from "./Tabs/JointGeneralInfo";
import JointHolders from "./Tabs/JointHolders";
import JointDocuments from "./Tabs/JointDocuments";
import JointSettings from "./Tabs/JointSettings";

const TAB_CLASS =
  "w-full justify-start gap-2 px-3 py-2.5 text-sm font-medium rounded-md transition-colors " +
  "text-slate-500 hover:bg-slate-100 hover:text-slate-900 " +
  "data-[state=active]:bg-slate-900 data-[state=active]:text-white";

const JointAccountSummary = ({ data, isLoading, refetch, isRefetching, isError }) => {
  const isMobile = useMediaQuery({ query: "(max-width: 1024px)" });
  const { auth } = useAuth();
  const roles = auth?.roles;

  return (
    <div className="flex gap-6">
      <Tabs defaultValue="bio" className="flex w-full">
        <TabsList className="flex flex-col justify-start w-1/6 border-r shadow-lg rounded-lg h-full p-4 gap-1 bg-white">
          {hasPermission(roles, 100008) && (
            <TabsTrigger value="bio" className={TAB_CLASS}>
              {isMobile ? <User className="w-5 h-5 mx-auto" /> : "General Information"}
            </TabsTrigger>
          )}
          {hasPermission(roles, 100008) && (
            <TabsTrigger value="holders" className={TAB_CLASS}>
              {isMobile ? <Users2 className="w-5 h-5 mx-auto" /> : "Holders"}
            </TabsTrigger>
          )}
          {hasPermission(roles, 100025) && (
            <TabsTrigger value="documents" className={TAB_CLASS}>
              {isMobile ? <FileText className="w-5 h-5 mx-auto" /> : "Documents"}
            </TabsTrigger>
          )}
          {hasPermission(roles, 100029) && (
            <TabsTrigger value="settings" className={TAB_CLASS}>
              {isMobile ? <Settings className="w-5 h-5 mx-auto" /> : "Settings"}
            </TabsTrigger>
          )}
        </TabsList>

        <div className="flex-1 px-2 rounded-sm shadow-lg overflow-y-auto">
          <TabsContent value="bio">
            {hasPermission(roles, 100008) && (
              <JointGeneralInfo
                data={data}
                isLoading={isLoading}
                refetch={refetch}
                isRefetching={isRefetching}
                isError={isError}
              />
            )}
          </TabsContent>
          <TabsContent value="holders">
            {hasPermission(roles, 100008) && <JointHolders />}
          </TabsContent>
          <TabsContent value="documents">
            {hasPermission(roles, 100025) && <JointDocuments />}
          </TabsContent>
          <TabsContent value="settings">
            {hasPermission(roles, 100029) && <JointSettings />}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default JointAccountSummary;

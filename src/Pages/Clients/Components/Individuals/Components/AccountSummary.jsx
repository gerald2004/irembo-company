/* eslint-disable react/prop-types */
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import BioInformation from "./Tabs/BioInformation";
import { User, Users, FileText, Settings } from "lucide-react";
import { useMediaQuery } from "react-responsive";
import Beneficiary from "./Tabs/Beneficiary";
import Documents from "./Tabs/Documents";
import Setting from "./Tabs/Setting";
import useAuth from "@/MiddleWares/Hooks/useAuth";
import { hasPermission } from "@/lib/utils";

const AccountSummary = ({
  data,
  isLoading,
  refetch,
  isRefetching,
  isError,
}) => {
  const isMobile = useMediaQuery({ query: "(max-width: 1024px)" }); // Mobile screens
  const { auth } = useAuth();
  const roles = auth?.roles;
  return (
    <div className="flex gap-6">
      <Tabs defaultValue="bio" className="flex w-full">
        <TabsList className="flex flex-col justify-start w-1/6 border-r shadow-lg rounded-lg h-full p-4">
          {hasPermission(roles, 100008) && (
            <TabsTrigger
              value="bio"
              className="lg:w-full py-3 text-left rounded-md hover:bg-black hover:text-white focus:bg-gray-200 focus:text-white transition"
            >
              {isMobile ? (
                <User className="w-5 h-5 mx-auto" />
              ) : (
                "General Information"
              )}
            </TabsTrigger>
          )}
          {hasPermission(roles, 100021) && (
            <TabsTrigger
              value="beneficiary"
              className="lg:w-full py-3 text-left rounded-md hover:bg-black hover:text-white focus:bg-gray-200 focus:text-white transition"
            >
              {isMobile ? <Users className="w-5 h-5 mx-auto" /> : "Beneficiary"}
            </TabsTrigger>
          )}
          {hasPermission(roles, 100025) && (
            <TabsTrigger
              value="documents"
              className="lg:w-full py-3 text-left rounded-md hover:bg-black hover:text-white focus:bg-gray-200 focus:text-white transition"
            >
              {isMobile ? (
                <FileText className="w-5 h-5 mx-auto" />
              ) : (
                "Documents"
              )}
            </TabsTrigger>
          )}
          {hasPermission(roles, 100029) && (
            <TabsTrigger
              value="settings"
              className="lg:w-full py-3 text-left rounded-md hover:bg-black hover:text-white focus:bg-gray-200 focus:text-white transition"
            >
              {isMobile ? <Settings className="w-5 h-5 mx-auto" /> : "Settings"}
            </TabsTrigger>
          )}
        </TabsList>
        {/* Main Content Section */}
        <div className="flex-1 px-2 rounded-sm shadow-lg overflow-y-auto">
          <TabsContent value="bio">
            {hasPermission(roles, 100008) && (
              <BioInformation
                data={data}
                isLoading={isLoading}
                refetch={refetch}
                isRefetching={isRefetching}
                isError={isError}
              />
            )}
          </TabsContent>
          <TabsContent value="beneficiary">
            {hasPermission(roles, 100021) && <Beneficiary />}
          </TabsContent>
          <TabsContent value="documents">
            {hasPermission(roles, 100025) && <Documents />}
          </TabsContent>
          <TabsContent value="settings">
            {hasPermission(roles, 100029) && <Setting />}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default AccountSummary;

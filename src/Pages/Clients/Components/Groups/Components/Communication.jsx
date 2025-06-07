import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Phone, Mail, Voicemail } from "lucide-react";
import { useMediaQuery } from "react-responsive";
import { SMS } from "./Tables/SMS";
import ComingSoon from "@/Pages/Components/ComingSoon";
import { Email } from "./Tables/Email";

const Communication = () => {
  const isMobile = useMediaQuery({ query: "(max-width: 1024px)" }); // Mobile screens

  return (
    <div className="flex gap-6">
      <Tabs defaultValue="sms" className="flex w-full">
        <TabsList className="flex flex-col justify-start w-1/6 border-r shadow-lg rounded-lg h-full p-4">
          <TabsTrigger
            value="sms"
            className="lg:w-full py-3 text-left rounded-md hover:bg-black hover:text-white focus:bg-gray-200 focus:text-white transition"
          >
            {isMobile ? <Phone className="w-5 h-5 mx-auto" /> : "Sms"}
          </TabsTrigger>
          <TabsTrigger
            value="email"
            className="lg:w-full py-3 text-left rounded-md hover:bg-black hover:text-white focus:bg-gray-200 focus:text-white transition"
          >
            {isMobile ? <Mail className="w-5 h-5 mx-auto" /> : "Email"}
          </TabsTrigger>
          <TabsTrigger
            value="robot-calls"
            className="lg:w-full py-3 text-left rounded-md hover:bg-black hover:text-white focus:bg-gray-200 focus:text-white transition"
          >
            {isMobile ? (
              <Voicemail className="w-5 h-5 mx-auto" />
            ) : (
              "Robot Calls"
            )}
          </TabsTrigger>
        </TabsList>

        {/* Main Content Section */}
        <div className="flex-1 px-2 rounded-sm shadow-lg overflow-y-auto">
          <TabsContent value="sms">
            <SMS />
          </TabsContent>
          <TabsContent value="email">
            <Email />
          </TabsContent>
          <TabsContent value="robot-calls">
            <ComingSoon fullScreen="off" className="mt-50" />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default Communication;

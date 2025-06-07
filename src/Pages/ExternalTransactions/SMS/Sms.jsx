import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SendSmsClient from "./Components/SendSmsClient";
import SendGeneralSms from "./Components/SendGeneralSms";

const Sms = () => {
  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="/dashboard">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>SMS Center</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <div className="flex items-center justify-between space-y-2">
            <h5 className="text-2xl font-bold tracking-tight">SMS Messaging</h5>
          </div>

          <Tabs defaultValue="specific" className="space-y-4">
            <div className="flex justify-center">
              <TabsList>
                <TabsTrigger value="specific">Specific Client(s)</TabsTrigger>
                <TabsTrigger value="general">General SMS</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="specific" className="space-y-4">
              <SendSmsClient />
            </TabsContent>

            <TabsContent value="general" className="space-y-4">
              <SendGeneralSms />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default Sms;

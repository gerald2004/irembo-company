import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import NotificationMessages from "./Components/NotificationSettings/NotificationMessages";
import NotificationLegend from "./Components/NotificationSettings/NotificationLegend";

const NotificationSettings = () => {
  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="/dashboard">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Notification Settings</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <div className="flex items-center justify-between space-y-2">
            <h5 className="text-2xl font-bold tracking-tight">
              Notification Settings
            </h5>
          </div>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-4 p-0 pt-2">
             <NotificationLegend />
             <NotificationMessages />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotificationSettings;

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { SaccoSystemSettingsTable } from "./Components/Tables/SaccoSystemSettingsTable";
const GeneralConfigurationTriggers = () => {
  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="/dashboard">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>General Config Triggers</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex items-center justify-between space-y-2">
          <h5 className="text-2xl font-bold tracking-tight">
            General Config Triggers
          </h5>
        </div>
        <SaccoSystemSettingsTable />
      </div>
    </>
  );
};

export default GeneralConfigurationTriggers;

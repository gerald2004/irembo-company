import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import BulkGroupRegistrationForm from "./Forms/BulkGroupRegistrationForm";
import Instructions from "./Components/Instructions";

const BulkGroupRegistration = () => {
  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="/dashboard">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Bulk Group Registration</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <div className="flex items-center justify-between space-y-2">
            <h5 className="text-2xl font-bold tracking-tight">
              Bulk Group Registration
            </h5>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 lg:grid-cols-12 gap-6">
            <div className="space-y-6 md:col-span-6 lg:col-span-6">
              <BulkGroupRegistrationForm />
            </div>
            <div className="md:col-span-6 lg:col-span-6">
              <Instructions  />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BulkGroupRegistration;
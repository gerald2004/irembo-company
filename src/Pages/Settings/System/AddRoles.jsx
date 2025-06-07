import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { AddRoleForm } from "./Components/Forms/AddRole";
const AddRoles = () => {
  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="/dashboard">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink to="/system-roles">Roles</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Add Roles</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex items-center justify-between space-y-2">
          <h5 className="text-2xl font-bold tracking-tight">Add New Roles</h5>
        </div>
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 space-y-4 p-0 pt-2">
            <AddRoleForm />
          </div>
        </div>
      </div>
    </>
  );
};

export default AddRoles;

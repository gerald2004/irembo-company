import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import BranchSummary from "./Components/Branches/BranchSummary";
import { DepartmentsTable } from "./Components/Branches/Tables/DepartmentsTable";
// import { BranchDepartments } from "./Components/BranchManagement/Tables/BranchDepartments";

const BranchManagementSummary = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const axiosPrivate = useAxiosPrivate();

  // ✅ Fetch Branch Details
  const {
    data: branchDetails,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["branch-details", id],
    queryFn: async () => {
            const controller = new AbortController();

      const fetchURL = `/settings/branches/${id}`;
      try {
        const response = await axiosPrivate.get(fetchURL, {
          signal: controller.signal,
        });
        if (!response.data.data) {
          throw new Error(response?.data?.messages || "No branch data found");
        }
        return response.data.data.branch;
      } catch (error) {
        if (error?.response?.status === 401) {
          navigate("/", { state: { from: location }, replace: true });
        }
        throw new Error(
          error?.response?.data?.messages || "Error fetching branch details"
        );
      }
    },
    enabled: !!id,
  });

  return (
    <>
      {/* ✅ Breadcrumb Navigation */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="/dashboard">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink to="/branch-management">Branches</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              {branchDetails?.name || "Loading..."}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <div className="flex items-center justify-between space-y-2">
            <h5 className="text-2xl font-bold tracking-tight">
              {isLoading
                ? "Loading..."
                : branchDetails?.name || "Branch Summary"}
            </h5>
          </div>

          {/* ✅ Tabs for Branch Management */}
          <Tabs defaultValue="branch-summary" className="space-y-4">
            <TabsList>
              <TabsTrigger value="branch-summary">Branch Summary</TabsTrigger>
              <TabsTrigger value="branch-departments">Departments</TabsTrigger>
            </TabsList>

            {/* ✅ Branch Summary */}
            <TabsContent value="branch-summary" className="space-y-4">
              <BranchSummary
                isLoading={isLoading}
                isError={isError}
                error={error}
                branch={branchDetails}
              />
            </TabsContent>

            {/* ✅ Branch Departments */}
            <TabsContent value="branch-departments" className="space-y-4">
              <DepartmentsTable />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default BranchManagementSummary;

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GroupLoansApplicationsTable } from "./Components/Tables/GroupLoanApplicationsTable";
import { GroupLoanActiveTable } from "./Components/Tables/GroupLoanActiveTable";
import { GroupLoanOverdueTable } from "./Components/Tables/GroupLoanOverdueTable";

const GroupLoans = () => {
  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="/dashboard">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Loans</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <div className="flex items-center justify-between space-y-2">
            <h5 className="text-2xl font-bold tracking-tight">Group Loans</h5>
          </div>
          <Tabs defaultValue="active" className="space-y-4">
            <TabsList>
              <TabsTrigger value="applications">Loan Applications</TabsTrigger>
              <TabsTrigger value="active">Active Loans</TabsTrigger>
              <TabsTrigger value="overdue">Overdue Loans</TabsTrigger>
              {/* <TabsTrigger value="">Companies</TabsTrigger> */}
            </TabsList>
            <TabsContent value="applications" className="space-y-4">
              <GroupLoansApplicationsTable />
            </TabsContent>
            <TabsContent value="active" className="space-y-4">
              <GroupLoanActiveTable />
            </TabsContent>
            <TabsContent value="overdue" className="space-y-4">
              <GroupLoanOverdueTable />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default GroupLoans;

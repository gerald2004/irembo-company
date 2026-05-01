import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IndividualLoansApplicationsTable } from "./Components/Tables/IndividualLoanApplicationsTable";
import { IndividualLoanActiveTable } from "./Components/Tables/IndividualLoanActiveTable";
import { IndividualLoanOverdueTable } from "./Components/Tables/IndividualLoanOverdueTable";

const JointLoans = () => {
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
            <h5 className="text-2xl font-bold tracking-tight">
              Joint Account Loans
            </h5>
          </div>
          <Tabs defaultValue="active" className="space-y-4">
            <TabsList>
              <TabsTrigger value="applications">Loan Applications</TabsTrigger>
              <TabsTrigger value="active">Active Loans</TabsTrigger>
              <TabsTrigger value="due_today">Due Today</TabsTrigger>
              <TabsTrigger value="overdue">Overdue Loans</TabsTrigger>
            </TabsList>
            <TabsContent value="applications" className="space-y-4">
              <IndividualLoansApplicationsTable
                clientType="joint_account"
                queryKeyPrefix="joint"
                clientRoute="/clients/joint-account"
              />
            </TabsContent>
            <TabsContent value="active" className="space-y-4">
              <IndividualLoanActiveTable
                clientType="joint_account"
                queryKeyPrefix="joint"
                clientRoute="/clients/joint-account"
              />
            </TabsContent>
            <TabsContent value="due_today" className="space-y-4">
              <IndividualLoanActiveTable
                clientType="joint_account"
                queryKeyPrefix="joint-due-today"
                clientRoute="/clients/joint-account"
                dueToday={true}
              />
            </TabsContent>
            <TabsContent value="overdue" className="space-y-4">
              <IndividualLoanOverdueTable
                clientType="joint_account"
                queryKeyPrefix="joint"
                clientRoute="/clients/joint-account"
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default JointLoans;

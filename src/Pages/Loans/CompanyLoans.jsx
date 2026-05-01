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

const CompanyLoans = () => {
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
              Company Loans
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
                clientType="company"
                queryKeyPrefix="company"
                clientRoute="/clients/company"
              />
            </TabsContent>
            <TabsContent value="active" className="space-y-4">
              <IndividualLoanActiveTable
                clientType="company"
                queryKeyPrefix="company"
                clientRoute="/clients/company"
              />
            </TabsContent>
            <TabsContent value="due_today" className="space-y-4">
              <IndividualLoanActiveTable
                clientType="company"
                queryKeyPrefix="company-due-today"
                clientRoute="/clients/company"
                dueToday={true}
              />
            </TabsContent>
            <TabsContent value="overdue" className="space-y-4">
              <IndividualLoanOverdueTable
                clientType="company"
                queryKeyPrefix="company"
                clientRoute="/clients/company"
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default CompanyLoans;

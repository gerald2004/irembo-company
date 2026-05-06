import { Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { FixedDepositTable } from "./Components/FixedDepositTable";
import { FixedDepositInterestLog } from "./Components/FixedDepositInterestLog";

const FixedDeposits = () => {
  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="/dashboard">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Fixed Deposits</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <div className="flex items-center justify-between">
            <h5 className="text-2xl font-bold tracking-tight">Fixed Deposits</h5>
            <Button variant="outline" size="sm" asChild>
              <Link to="/fixed-deposit-settings">
                <Settings className="h-3.5 w-3.5 mr-1.5" />
                Manage Products
              </Link>
            </Button>
          </div>

          <Tabs defaultValue="transactions">
            <TabsList>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="accrual-log">Accrual Log</TabsTrigger>
            </TabsList>

            <TabsContent value="transactions" className="mt-4">
              <FixedDepositTable />
            </TabsContent>

            <TabsContent value="accrual-log" className="mt-4">
              <FixedDepositInterestLog />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default FixedDeposits;

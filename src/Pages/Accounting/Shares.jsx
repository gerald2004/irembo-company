import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShareTable } from "./Components/Tables/ShareTable";
import DividendDeclarations from "./Components/Dividends/DividendDeclarations";
import DividendTransactions from "./Components/Dividends/DividendTransactions";

const Shares = () => {
  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="/dashboard">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Shares</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-2xl font-bold tracking-tight">Shares</h5>
              <p className="text-sm text-muted-foreground">
                Manage share transactions, dividend declarations and payouts.
              </p>
            </div>
          </div>

          <Tabs defaultValue="transactions" className="space-y-4">
            <TabsList>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="dividends-declarations">
                Dividends Declarations
              </TabsTrigger>
              <TabsTrigger value="dividends-transactions">
                Dividend Transactions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="transactions" className="space-y-4">
              <ShareTable />
            </TabsContent>

            <TabsContent value="dividends-declarations" className="space-y-4">
              <DividendDeclarations />
            </TabsContent>

            <TabsContent value="dividends-transactions" className="space-y-4">
              <DividendTransactions />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default Shares;

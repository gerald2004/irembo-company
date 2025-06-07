import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { TransactionTillTable } from "./Components/TransactionChannels/Tables/TransactionTillTable";

const TransactionChannels = () => {
  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="/dashboard">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Transaction Channels</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <div className="flex items-center justify-between space-y-2">
            <h5 className="text-2xl font-bold tracking-tight">
              Transaction Channels
            </h5>
          </div>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-4 p-0 pt-2">
                <TransactionTillTable />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TransactionChannels;

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import BulkWithdrawForm from "./Forms/BulkWithdrawForm";
import Instructions from "./Components/Instructions";

const BulkSavingsWithdraw = () => {
  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="/dashboard">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Bulk Savings Withdrawal</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <div className="flex items-center justify-between space-y-2">
            <h5 className="text-2xl font-bold tracking-tight">
              Bulk Savings Withdrawal
            </h5>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 lg:grid-cols-12 gap-6">
            <div className="space-y-6 md:col-span-6 lg:col-span-6">
              <BulkWithdrawForm />
            </div>
            <div className="md:col-span-6 lg:col-span-6">
              <Instructions variant="withdraw" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BulkSavingsWithdraw;
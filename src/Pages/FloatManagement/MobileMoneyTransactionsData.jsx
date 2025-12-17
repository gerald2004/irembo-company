import { useState } from "react";
import { useParams } from "react-router-dom";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import MobileMoneyTransactions from "./Components/MobileMoneyTransactions";

const MobileMoneyTransactionsData = () => {
  const { channelId } = useParams();
  const [provider, setProvider] = useState(null);

  return (
    <>
      {/* ================= Breadcrumb ================= */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="/dashboard">Home</BreadcrumbLink>
          </BreadcrumbItem>

          <BreadcrumbSeparator />

          <BreadcrumbItem>
            <BreadcrumbLink to="/mobile-banking-float-management">
              Mobile Money Float Management
            </BreadcrumbLink>
          </BreadcrumbItem>

          <BreadcrumbSeparator />

          <BreadcrumbItem>
            <BreadcrumbPage>
              {provider ? `${provider} Transactions` : "Transactions"}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* ================= Page ================= */}
      <div className="flex-col md:flex">
        <div className="border-b" />

        <div className="flex-1 space-y-4 p-0 pt-2">
          <div className="flex items-center justify-between">
            <h5 className="text-2xl font-bold tracking-tight">
              {provider
                ? `${provider} Mobile Money Transactions`
                : "Mobile Money Transactions"}
            </h5>
          </div>

          {/* Child passes provider name up */}
          <MobileMoneyTransactions
            channelId={channelId}
            onProviderResolved={setProvider}
          />
        </div>
      </div>
    </>
  );
};

export default MobileMoneyTransactionsData;

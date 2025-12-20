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

import UtilitiesFloatTransactions from "./Components/UtilitiesFloatTransactions";

const UtilitiesFloatTransactionsData = () => {
  const { utilityAccountId } = useParams();
  const [account, setAccount] = useState(null);

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="/dashboard">Home</BreadcrumbLink>
          </BreadcrumbItem>

          <BreadcrumbSeparator />

          <BreadcrumbItem>
            <BreadcrumbLink to="/utilities-float-management">
              Utilities Float Management
            </BreadcrumbLink>
          </BreadcrumbItem>

          <BreadcrumbSeparator />

          <BreadcrumbItem>
            <BreadcrumbPage>
              {account?.name ? `${account.name} Transactions` : "Transactions"}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-col md:flex">
        <div className="border-b" />

        <div className="flex-1 space-y-4 p-0 pt-2">
          <h5 className="text-2xl font-bold tracking-tight">
            {account?.name
              ? `${account.name} Transactions`
              : "Utility Transactions"}
          </h5>

          <UtilitiesFloatTransactions
            utilityAccountId={utilityAccountId}
            onAccountResolved={setAccount}
          />
        </div>
      </div>
    </>
  );
};

export default UtilitiesFloatTransactionsData;

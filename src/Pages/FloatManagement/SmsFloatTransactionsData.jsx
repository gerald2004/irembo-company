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

import SmsFloatTransactions from "./Components/SmsFloatTransactions";

const SmsFloatTransactionsData = () => {
  const { smsAccountId } = useParams(); // route: /sms-float-management/:smsAccountId
  const [account, setAccount] = useState(null); // { name, billing_type, charge_per_sms }

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
            <BreadcrumbLink to="/sms-float-management">
              SMS Float Management
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

      {/* ================= Page ================= */}
      <div className="flex-col md:flex">
        <div className="border-b" />

        <div className="flex-1 space-y-4 p-0 pt-2">
          <div className="flex items-center justify-between">
            <h5 className="text-2xl font-bold tracking-tight">
              {account?.name
                ? `${account.name} Transactions`
                : "SMS Transactions"}
              {account?.charge_per_sms != null ? (
                <span className="text-sm text-muted-foreground font-normal ml-2">
                  • Charge/SMS: UGX{" "}
                  {Number(account.charge_per_sms || 0).toLocaleString()}
                </span>
              ) : null}
            </h5>
          </div>

          {/* Child passes account info up */}
          <SmsFloatTransactions
            smsAccountId={smsAccountId}
            onAccountResolved={setAccount}
          />
        </div>
      </div>
    </>
  );
};

export default SmsFloatTransactionsData;

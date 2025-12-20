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

import EmailFloatTransactions from "./Components/EmailFloatTransactions";

const EmailFloatTransactionsData = () => {
  const { emailAccountId } = useParams(); // /email-float-management/:emailAccountId
  const [account, setAccount] = useState(null); // { name, billing_type, monthly_allowance, charge_per_email }

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="/dashboard">Home</BreadcrumbLink>
          </BreadcrumbItem>

          <BreadcrumbSeparator />

          <BreadcrumbItem>
            <BreadcrumbLink to="/email-float-management">
              Email Float Management
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
          <div className="flex items-center justify-between">
            <h5 className="text-2xl font-bold tracking-tight">
              {account?.name
                ? `${account.name} Transactions`
                : "Email Transactions"}

              {account?.billing_type === "monthly" ? (
                <span className="text-sm text-muted-foreground font-normal ml-2">
                  • Allowance: {account?.monthly_allowance ?? 250}/month
                </span>
              ) : account?.charge_per_email != null ? (
                <span className="text-sm text-muted-foreground font-normal ml-2">
                  • Charge/Email: UGX{" "}
                  {Number(account.charge_per_email || 0).toLocaleString()}
                </span>
              ) : null}
            </h5>
          </div>

          <EmailFloatTransactions
            emailAccountId={emailAccountId}
            onAccountResolved={setAccount}
          />
        </div>
      </div>
    </>
  );
};

export default EmailFloatTransactionsData;

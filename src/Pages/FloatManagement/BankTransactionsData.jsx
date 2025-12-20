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

import BankFloatTransactions from "./Components/BankFloatTransactions";

const BankTransactionsData = () => {
  const { bankAccountId } = useParams(); // route: /bank-float-management/:bankAccountId
  const [bank, setBank] = useState(null); // { bank_name, account_number }

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
            <BreadcrumbLink to="/bank-float-management">
              Bank Float Management
            </BreadcrumbLink>
          </BreadcrumbItem>

          <BreadcrumbSeparator />

          <BreadcrumbItem>
            <BreadcrumbPage>
              {bank?.bank_name
                ? `${bank.bank_name} Transactions`
                : "Transactions"}
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
              {bank?.bank_name
                ? `${bank.bank_name} Bank Transactions`
                : "Bank Transactions"}
              {bank?.account_number ? (
                <span className="text-sm text-muted-foreground font-normal ml-2">
                  • {bank.account_number}
                </span>
              ) : null}
            </h5>
          </div>

          {/* Child passes bank object up */}
          <BankFloatTransactions
            bankAccountId={bankAccountId}
            onBankResolved={setBank}
          />
        </div>
      </div>
    </>
  );
};

export default BankTransactionsData;

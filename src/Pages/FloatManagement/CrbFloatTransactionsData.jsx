import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import CrbFloatTransactions from "./Components/CrbFloatTransactions";

const CrbFloatTransactionsData = () => {
  const { crbAccountId } = useParams();
  const [searchParams] = useSearchParams();
  const productCode = searchParams.get("product");

  const [meta, setMeta] = useState(null); // { account, filter }

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="/dashboard">Home</BreadcrumbLink>
          </BreadcrumbItem>

          <BreadcrumbSeparator />

          <BreadcrumbItem>
            <BreadcrumbLink to="/crb-float-management">
              CRB Float Management
            </BreadcrumbLink>
          </BreadcrumbItem>

          <BreadcrumbSeparator />

          <BreadcrumbItem>
            <BreadcrumbPage>
              {meta?.filter?.product_name
                ? meta.filter.product_name
                : "Transactions"}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-col md:flex">
        <div className="border-b" />

        <div className="flex-1 space-y-4 p-0 pt-2">
          <h5 className="text-2xl font-bold tracking-tight">
            {meta?.filter?.product_name
              ? `${meta.filter.product_name} Transactions`
              : "CRB Transactions"}
          </h5>

          <CrbFloatTransactions
            crbAccountId={crbAccountId}
            productCode={productCode}
            onMetaResolved={setMeta}
          />
        </div>
      </div>
    </>
  );
};

export default CrbFloatTransactionsData;

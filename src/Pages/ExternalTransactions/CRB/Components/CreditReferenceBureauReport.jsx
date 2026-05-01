/* eslint-disable react/prop-types */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import CRBRunDialog from "./Forms/CRBRunDialog";

const PRODUCT_META = {
  individual_credit_score: {
    label: "Individual Credit Score",
    description: "Full CRB credit score for an individual client (includes MNO data)",
    entityType: 0,
    mode: "score",
  },
  business_credit_score: {
    label: "Business Credit Score",
    description: "Credit score for a company, partnership, or NGO",
    entityType: 1,
    mode: "score",
  },
  crb_report: {
    label: "Full CRB Report (PDF)",
    description: "Detailed credit history report — generates a downloadable PDF",
    entityType: 0,
    mode: "report",
  },
  nin_validation: {
    label: "NIN Validation (NIRA Lookup)",
    description: "Query NIRA to retrieve person details (name, DOB, gender) linked to a NIN",
    entityType: 0,
    mode: "nin",
  },
  NIN_VERIFICATION: {
    label: "NIN Verification (Identity Check)",
    description: "Verify that a NIN belongs to a real registered person — used for KYC identity assurance",
    entityType: 0,
    mode: "nin_verify",
  },
  phone_verification: {
    label: "Phone Number Verification",
    description: "Verify an Airtel or MTN mobile number against subscriber records",
    entityType: 0,
    mode: "phone",
  },
  mno_report: {
    label: "MNO Credit Report",
    description: "Mobile network operator credit behaviour report based on mobile usage patterns",
    entityType: 0,
    mode: "score",
  },
  kyc_validation: {
    label: "KYC Validation",
    description: "Know Your Customer full identity validation check",
    entityType: 0,
    mode: "score",
  },
  fcs_validation: {
    label: "FCS Validation",
    description: "Financial Competency Score — assesses financial behaviour (free check)",
    entityType: 0,
    mode: "fcs",
  },
};

function ProductCard({ product, onRun }) {
  const meta = PRODUCT_META[product.code] ?? {
    label: product.name,
    description: "",
    entityType: 0,
    mode: "score",
  };

  return (
    <Card className="flex flex-col justify-between h-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug">{meta.label}</CardTitle>
          <div className="flex flex-col items-end gap-1 shrink-0">
            {product.is_free ? (
              <Badge variant="secondary">Free</Badge>
            ) : null}
            {product.is_overridden ? (
              <Badge variant="outline" className="text-[10px]">Custom price</Badge>
            ) : null}
          </div>
        </div>
        {meta.description && (
          <p className="text-xs text-muted-foreground">{meta.description}</p>
        )}
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Cost:{" "}
          <span className="text-primary font-semibold">
            {product.is_free && Number(product.unit_price) === 0
              ? "FREE"
              : `UGX ${Number(product.unit_price).toLocaleString()}`}
          </span>
        </p>
        <Button size="sm" onClick={() => onRun(product, meta)}>
          Run
        </Button>
      </CardContent>
    </Card>
  );
}

const CreditReferenceBureauReport = () => {
  const axiosPrivate = useAxiosPrivate();
  const [selected, setSelected] = useState(null); // { product, meta }

  const { data, isLoading, isError } = useQuery({
    queryKey: ["crb-products"],
    queryFn: async () => {
      const res = await axiosPrivate.get("/float-management/crb-float");
      return res.data?.data ?? {};
    },
    staleTime: 5 * 60 * 1000,
  });

  const products = data?.products ?? [];

  return (
    <>
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-sm text-destructive mt-6">
          Failed to load CRB products. Check that a CRB account is configured.
        </p>
      ) : products.length === 0 ? (
        <p className="text-sm text-muted-foreground mt-6">
          No CRB products available.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {products.map((p) => (
            <ProductCard
              key={p.product_id}
              product={p}
              onRun={(product, meta) => setSelected({ product, meta })}
            />
          ))}
        </div>
      )}

      {selected && (
        <CRBRunDialog
          isOpen={!!selected}
          product={selected.product}
          meta={selected.meta}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
};

export default CreditReferenceBureauReport;

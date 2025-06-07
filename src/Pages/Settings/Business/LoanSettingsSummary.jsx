import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoanSummary from "./Components/Loan-settings/LoanSummary";
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { LoanFees } from "./Components/Loan-settings/Tables/LoanFees";
const LoanSettingsSummary = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const axiosPrivate = useAxiosPrivate();

  const {
    data: loanProduct,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["loanProduct", id],
    queryFn: async () => {
            const controller = new AbortController();

      const fetchURL = `/settings/loans/products/${id}`;
      try {
        const response = await axiosPrivate.get(fetchURL, {
          signal: controller.signal,
        });
        if (!response.data.data) {
          throw new Error(response?.data?.message);
        }
        return response.data.data.loan_product;
      } catch (error) {
        if (error?.response?.status === 401) {
          navigate("/", { state: { from: location }, replace: true });
        }
        throw new Error(
          error?.response?.data?.message || "Error fetching loan product"
        );
      }
    },
    enabled: !!id,
  });
  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="/dashboard">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink to="/loan-settings">Loan Settings</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{loanProduct?.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <div className="flex items-center justify-between space-y-2">
            <h5 className="text-2xl font-bold tracking-tight">Loan Summary</h5>
          </div>
          <Tabs defaultValue="loan-summary" className="space-y-4">
            <TabsList>
              <TabsTrigger value="loan-summary">Loan Summary</TabsTrigger>
              <TabsTrigger value="loan-fees">Loan Auto Fees</TabsTrigger>
            </TabsList>
            <TabsContent value="loan-summary" className="space-y-4">
              <LoanSummary
                isLoading={isLoading}
                isError={isError}
                error={error}
                loanProduct={loanProduct}
              />
            </TabsContent>
            <TabsContent value="loan-fees" className="space-y-4">
              <LoanFees />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default LoanSettingsSummary;

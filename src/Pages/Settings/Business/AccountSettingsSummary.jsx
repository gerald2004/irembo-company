import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import AccountSummary from "./Components/AccountSavingSettings/AccountSummary";
import { AccountFees } from "./Components/AccountSavingSettings/Tables/AccountFees";
const AccountSettingsSummary = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const axiosPrivate = useAxiosPrivate();

  const {
    data: accountProduct,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["account-product", id],
    queryFn: async () => {
            const controller = new AbortController();

      const fetchURL = `/settings/savings/accounts/${id}`;
      try {
        const response = await axiosPrivate.get(fetchURL, {
          signal: controller.signal,
        });
        if (!response.data.data) {
          throw new Error(response?.data?.message);
        }
        return response.data.data.savings_product;
      } catch (error) {
        if (error?.response?.status === 401) {
          navigate("/", { state: { from: location }, replace: true });
        }
        throw new Error(
          error?.response?.data?.message || "Error fetching account product"
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
            <BreadcrumbLink to="/account-savings-settings">
              Account Settings
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{accountProduct?.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <div className="flex items-center justify-between space-y-2">
            <h5 className="text-2xl font-bold tracking-tight">
              Account Summary
            </h5>
          </div>
          <Tabs defaultValue="account-summary" className="space-y-4">
            <TabsList>
              <TabsTrigger value="account-summary">Account Summary</TabsTrigger>
              <TabsTrigger value="account-fees">Account Auto Fees</TabsTrigger>
            </TabsList>
            <TabsContent value="account-summary" className="space-y-4">
              <AccountSummary
                isLoading={isLoading}
                isError={isError}
                error={error}
                savingsProduct={accountProduct}
              />
            </TabsContent>
            <TabsContent value="account-fees" className="space-y-4">
              <AccountFees />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default AccountSettingsSummary;

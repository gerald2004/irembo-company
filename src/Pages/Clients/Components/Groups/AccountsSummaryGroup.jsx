import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AccountStatementTable from "./Components/Tables/AccountStatementTable";
import FixedDepositTable from "./Components/Tables/FixedDepositTable";
import FrozenBalanceTable from "./Components/Tables/FrozenBalanceTable";
import LoansTable from "./Components/Tables/LoansTable";
import useAuth from "@/MiddleWares/Hooks/useAuth";
import { hasPermission } from "@/lib/utils";

const AccountsSummaryGroup = () => {
  const navigate = useNavigate();
  const axiosPrivate = useAxiosPrivate();
  const params = useParams();
  const { auth } = useAuth();
  const roles = auth?.roles;

  const { data = [] } = useQuery({
    queryKey: ["client-account-data", params.client_id],
    queryFn: async () => {
      const controller = new AbortController();
      const fetchURL = `/clients/accounts/${params.client_id}`;
      try {
        const response = await axiosPrivate.get(fetchURL, {
          signal: controller.signal,
        });
        if (!response.data.data) {
          throw new Error(response?.data?.message);
        }
        return response.data.data;
      } catch (error) {
        if (error?.response?.status === 401) {
          navigate("/", { state: { from: location }, replace: true });
        }
        throw new Error(error?.response?.data?.message);
      }
    },
  });
  const availableTabs = [
    hasPermission(roles, 100038) && "statement",
    hasPermission(roles, 100052) && "fixed-deposits",
    hasPermission(roles, 100156) && "frozen-compulsory",
    hasPermission(roles, 100054) && "loans",
  ].filter(Boolean);
  const defaultTab = availableTabs[0];
  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="/dashboard">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink to="/clients">Clients</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink to={`/clients/individual/${params.id}`}>
              {`${data?.client?.fullname}  (${data?.client?.account_number})`}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              <p className="capitalize hover:uppercase">
                {`${data?.client_account?.savings_product}`}
              </p>
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 pt-2">
          <Tabs defaultValue={defaultTab} className="space-y-4">
            <div className="flex justify-center">
              <TabsList className="overflow-x-auto scroll-smooth snap-x snap-start scrollbar-hide">
                {hasPermission(roles, 100038) && (
                  <TabsTrigger value="statement">Statement</TabsTrigger>
                )}
                {hasPermission(roles, 100052) && (
                  <TabsTrigger value="fixed-deposits">
                    Fixed Deposits
                  </TabsTrigger>
                )}
                {hasPermission(roles, 100156) && (
                  <TabsTrigger value="frozen-compulsory">
                    Frozen / Compulsory
                  </TabsTrigger>
                )}
                {hasPermission(roles, 100054) && (
                  <TabsTrigger value="loans">Loans</TabsTrigger>
                )}
              </TabsList>
            </div>
            <TabsContent value="statement" className="space-y-4">
              {hasPermission(roles, 100038) && <AccountStatementTable />}
            </TabsContent>
            <TabsContent value="fixed-deposits" className="space-y-4">
              {hasPermission(roles, 100052) && <FixedDepositTable />}
            </TabsContent>
            <TabsContent value="frozen-compulsory" className="space-y-4">
              {hasPermission(roles, 100156) && <FrozenBalanceTable />}
            </TabsContent>
            <TabsContent value="loans" className="space-y-4">
              {hasPermission(roles, 100054) && <LoansTable />}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default AccountsSummaryGroup;

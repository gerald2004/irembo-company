import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ALargeSmall, UmbrellaOffIcon, WavesIcon } from "lucide-react";
const LoansPortfolioReportSummary = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();

  const {
    data = [],
    isLoading,
    isRefetching,
    isError,
  } = useQuery({
    queryKey: ["portfolio-loans-summary"],
    queryFn: async () => {
      const fetchURL = `reports/loans/portfolio-summary`;
      try {
        const response = await axiosPrivate.get(fetchURL);
        return response?.data?.data ?? [];
      } catch (error) {
        if (error?.response?.status === 401) {
          navigate("/", { state: { from: location }, replace: true });
        }
        throw error;
      }
    },
    keepPreviousData: true,
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
            <BreadcrumbLink to="/loans-reports">Loans Reports</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Loans Portfolio Summary</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <div className="flex items-center justify-between space-y-2">
            <h5 className="text-2xl font-bold tracking-tight">
              Loans Portfolio Summary
            </h5>
          </div>
          {/* <Query isRefetching={isRefetching} refetch={refetch} /> */}
          <div className="grid gap-4 pt-5 md:grid-cols-1 lg:grid-cols-2">
            {isLoading || isRefetching || isError ? (
              <>
                <Skeleton className="h-[125px] w-full rounded-xl" />
                <Skeleton className="h-[125px] w-full rounded-xl" />
              </>
            ) : (
              <>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xl font-medium">
                      Outstanding Principal Balance
                    </CardTitle>
                    <WavesIcon />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {data?.total_outstanding_principal?.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xl font-medium">
                      Overdue Principal
                    </CardTitle>
                    <ALargeSmall />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {data?.overdue_principal?.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
          <div className="grid gap-4 pt-5 md:grid-cols-1 lg:grid-cols-1">
            {isLoading || isRefetching || isError ? (
              <>
                <Skeleton className="h-[125px] w-full rounded-xl" />
              </>
            ) : (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xl font-medium">
                    Portfolio At Risk
                  </CardTitle>
                  <UmbrellaOffIcon />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {data?.portfolio_at_risk_percent?.toLocaleString()} %
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default LoansPortfolioReportSummary;

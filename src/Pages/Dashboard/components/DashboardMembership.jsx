import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { useNavigate } from "react-router-dom";
import { MembershipByDate } from "./membersip/MembershipByDate";
import { SharesByDate } from "./membersip/SharesByDate";

const DashboardMembership = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["dashboard-membership-data"],
    queryFn: async () => {
      const fetchURL = `/dashboards/membership`;
      try {
        const response = await axiosPrivate.get(fetchURL);
        return response.data.data;
      } catch (error) {
        if (error?.response?.status === 401) {
          navigate("/", { state: { from: location }, replace: true });
        }
      }
    },
  });
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            <Skeleton className="h-[125px] w-full rounded-xl" />
            <Skeleton className="h-[125px] w-full rounded-xl" />
            <Skeleton className="h-[125px] w-full rounded-xl" />
            <Skeleton className="h-[125px] w-full rounded-xl" />
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Groups</CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <circle cx="8" cy="12" r="3" />
                  <circle cx="16" cy="12" r="3" />
                  <path d="M2 12h2M20 12h2M6.5 15.5L4 18M17.5 15.5L20 18" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-1xl font-bold">
                  {clients?.client_totals?.groups?.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">General Groups</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Male</CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <circle cx="12" cy="12" r="5" />
                  <path d="M16 3h5v5M16 3l5 5M12 7v2" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-1xl font-bold">
                  {clients?.client_totals?.male_clients?.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  General Male Clients
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Female</CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <circle cx="12" cy="8" r="5" />
                  <path d="M12 13v6M9 19h6" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-1xl font-bold">
                  {clients?.client_totals?.female_clients?.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  General Female Clients
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Membership Status
                </CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 12l2 2 4-4" />
                </svg>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-bold">
                  {clients?.client_totals?.active_clients?.toLocaleString()}{" "}
                  Active |{" "}
                  {clients?.client_totals?.inactive_clients?.toLocaleString()}{" "}
                  Inactive Clients
                </p>
                <p className="text-xs text-muted-foreground">General Clients</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        {isLoading ? (
          <>
            <Skeleton className="col-span-3 h-[300px]  rounded-xl" />
            <Skeleton className="col-span-3 h-[300px] rounded-xl" />
          </>
        ) : (
          <>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Shares</CardTitle>
                <Separator />
              </CardHeader>
              <CardContent className="pl-2">
                <SharesByDate chartData={clients?.shares} />
              </CardContent>
            </Card>
            <div className="col-span-3">
              <Card className="col-span-12">
                <CardHeader>
                  <CardTitle>Membership By Date</CardTitle>
                  <Separator />
                </CardHeader>
                <CardContent className="pl-2">
                  <MembershipByDate chartData={clients?.monthly_membership} />
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default DashboardMembership;

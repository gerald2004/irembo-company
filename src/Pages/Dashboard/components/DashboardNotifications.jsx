import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { useNavigate } from "react-router-dom";
import { SmsByDate } from "./membersip/SMSByDate";

const DashboardNotifications = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["dashboard-notifications-data"],
    queryFn: async () => {
      const fetchURL = `/dashboards/notifications`;
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
                <CardTitle className="text-sm font-medium">Sent SMS</CardTitle>
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
                  <rect x="3" y="8" width="18" height="13" rx="2" />
                  <polyline points="3,8 12,3 21,8" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-1xl font-bold">
                  {notifications?.sms?.statusCounts?.sent_sms?.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {notifications?.sms?.statusCounts?.pending_sms?.toLocaleString()}{" "}
                  Pending SMS
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Sent Emails
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
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <polyline points="3,4 12,13 21,4" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-1xl font-bold">
                  {notifications?.emails?.statusCounts?.sent_emails?.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {" "}
                  {notifications?.emails?.statusCounts?.pending_emails?.toLocaleString()}{" "}
                  Pending Emails
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  SMS Balance
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
                  <path d="M12 6v6l4 2" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-1xl font-bold">
                  {notifications?.sms_balance?.sacco_sms_balance?.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Not Paid SMS Balance
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Failed Notifications
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
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-bold">
                  {notifications?.failed_notifications?.sms?.toLocaleString()}{" "}
                  SMS |{" "}
                  {notifications?.failed_notifications?.emails?.toLocaleString()}{" "}
                  Emails
                </p>
                <p className="text-xs text-muted-foreground">
                  Failed Notifications
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
        {isLoading ? (
          <>
            <Skeleton className="col-span-3 h-[300px] rounded-xl" />
          </>
        ) : (
          <>
            <div className="col-span-3">
              <Card className="col-span-12">
                <CardHeader>
                  <CardTitle>SMS By Date</CardTitle>
                  <Separator />
                </CardHeader>
                <CardContent className="pl-2">
                  <SmsByDate chartData={notifications?.sms?.smsByMonth} />
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default DashboardNotifications;

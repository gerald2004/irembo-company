import { Link } from "react-router-dom";
import { Users, Star, LayoutDashboard } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import useAuth from "@/MiddleWares/Hooks/useAuth";
import { hasPermission } from "@/lib/utils";

const SECTIONS = [
  {
    title: "Client Reports",
    description: "Membership activity, share capital, and client lifecycle data",
    reports: [
      {
        title: "Membership Report",
        link: "client-reports/membership",
        description: "All registered members with join date, status, and account summary",
        icon: <Users className="w-5 h-5" />,
        color: "text-blue-600",
        bg: "bg-blue-50 dark:bg-blue-900/20",
        permission: 100248,
      },
      {
        title: "Shares Report",
        link: "client-reports/shares",
        description: "Share capital per member — units held, value, and transaction history",
        icon: <Star className="w-5 h-5" />,
        color: "text-violet-600",
        bg: "bg-violet-50 dark:bg-violet-900/20",
        permission: 100249,
      },
      {
        title: "Member Profile Report",
        link: "client-reports/member-profile",
        description: "Full member snapshot — savings accounts, loans, shares, deposits, withdrawals, and group memberships in one view",
        icon: <LayoutDashboard className="w-5 h-5" />,
        color: "text-sky-600",
        bg: "bg-sky-50 dark:bg-sky-900/20",
        permission: 100248,
      },
    ],
  },
];

const LEGACY = 100130;

export function ClientReportTable() {
  const { auth: { roles } } = useAuth();
  const totalReports = SECTIONS.reduce((sum, s) => sum + s.reports.length, 0);

  return (
    <div className="space-y-8">
      {SECTIONS.map((section) => {
        const visible = section.reports.filter(
          (r) => !r.permission || hasPermission(roles, r.permission) || hasPermission(roles, LEGACY)
        );
        if (!visible.length) return null;
        return (
          <div key={section.title} className="space-y-3">
            <div>
              <h3 className="text-base font-semibold">{section.title}</h3>
              <p className="text-xs text-muted-foreground">{section.description}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {visible.map((report) => (
                <Link key={report.link} to={`/${report.link}`}>
                  <Card className="h-full hover:shadow-md hover:border-primary/40 transition-all duration-150 cursor-pointer group">
                    <CardHeader className="pb-2 pt-4 px-4">
                      <div className="flex items-start gap-3">
                        <div className={`rounded-lg p-2 ${report.bg} ${report.color} shrink-0`}>
                          {report.icon}
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-sm leading-tight group-hover:text-primary transition-colors">
                            {report.title}
                          </CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <CardDescription className="text-xs leading-relaxed">
                        {report.description}
                      </CardDescription>
                      <p className="text-xs text-primary mt-2 font-medium group-hover:underline">
                        View report →
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        );
      })}

      <div className="flex items-center gap-2 pt-2">
        <Badge variant="outline" className="text-xs">{totalReports} reports</Badge>
        <span className="text-xs text-muted-foreground">
          Reports respect your branch access level and active fiscal year
        </span>
      </div>
    </div>
  );
}

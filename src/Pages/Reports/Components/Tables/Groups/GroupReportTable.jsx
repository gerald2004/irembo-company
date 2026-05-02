import { Link } from "react-router-dom";
import {
  Users, TrendingUp, PiggyBank, BarChart3, AlertTriangle, Briefcase, CalendarClock, Activity,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import useAuth from "@/MiddleWares/Hooks/useAuth";
import { hasPermission } from "@/lib/utils";

const SECTIONS = [
  {
    title: "Group Reports",
    description: "Consolidated data across all group accounts — loans, savings, and membership",
    reports: [
      {
        title: "Group Loans Report",
        link: "group-reports/group-loans",
        description: "All loans issued to group clients with status and outstanding balances",
        icon: <TrendingUp className="w-5 h-5" />,
        color: "text-blue-600",
        bg: "bg-blue-50 dark:bg-blue-900/20",
        permission: 100240,
      },
      {
        title: "Group Members Report",
        link: "group-reports/group-members",
        description: "All members across all groups with savings and loan summary",
        icon: <Users className="w-5 h-5" />,
        color: "text-violet-600",
        bg: "bg-violet-50 dark:bg-violet-900/20",
        permission: 100241,
      },
      {
        title: "Group Savings Report",
        link: "group-reports/group-savings",
        description: "Savings balances and deposit/withdrawal activity per group",
        icon: <PiggyBank className="w-5 h-5" />,
        color: "text-emerald-600",
        bg: "bg-emerald-50 dark:bg-emerald-900/20",
        permission: 100242,
      },
      {
        title: "Group Performance Report",
        link: "group-reports/group-performance",
        description: "PAR, repayment rate, interest earned and portfolio health per group",
        icon: <BarChart3 className="w-5 h-5" />,
        color: "text-amber-600",
        bg: "bg-amber-50 dark:bg-amber-900/20",
        permission: 100243,
      },
      {
        title: "Active Group Loans",
        link: "group-reports/active-group-loans",
        description: "All active (disbursed) group loans with outstanding balances — toggle individual or consolidated view",
        icon: <Activity className="w-5 h-5" />,
        color: "text-sky-600",
        bg: "bg-sky-50 dark:bg-sky-900/20",
        permission: 100244,
      },
      {
        title: "Overdue Group Loans",
        link: "group-reports/overdue-group-loans",
        description: "Group loans with overdue installments showing days past due and amounts at risk",
        icon: <AlertTriangle className="w-5 h-5" />,
        color: "text-red-600",
        bg: "bg-red-50 dark:bg-red-900/20",
        permission: 100245,
      },
      {
        title: "Group Loan Portfolio",
        link: "group-reports/group-portfolio",
        description: "Portfolio at risk (PAR) breakdown per group loan with outstanding and overdue principals",
        icon: <Briefcase className="w-5 h-5" />,
        color: "text-indigo-600",
        bg: "bg-indigo-50 dark:bg-indigo-900/20",
        permission: 100246,
      },
      {
        title: "Group Loans Due Today",
        link: "group-reports/loans-due-today",
        description: "Group loans with installments due today — principal, interest and penalties breakdown",
        icon: <CalendarClock className="w-5 h-5" />,
        color: "text-orange-600",
        bg: "bg-orange-50 dark:bg-orange-900/20",
        permission: 100247,
      },
      {
        title: "Group Member Loans",
        link: "group-reports/member-loans",
        description: "Loans belonging to individual members of groups — filter by group, toggle per-loan or per-member view",
        icon: <Users className="w-5 h-5" />,
        color: "text-teal-600",
        bg: "bg-teal-50 dark:bg-teal-900/20",
        permission: 100248,
      },
    ],
  },
];

// Legacy section permission — users with the old 100128 code still see all group report cards
const LEGACY = 100128;

export function GroupReportTable() {
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

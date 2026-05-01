import { Link } from "react-router-dom";
import {
  FileText, TrendingUp, AlertTriangle, BarChart2, BarChart3,
  Scale, PieChart, Layers, Clock, CheckCircle2, XCircle,
  ArrowDownToLine, Users, ShieldAlert, Wallet, Target,
  TrendingDown, BookOpen, Receipt,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import useAuth from "@/MiddleWares/Hooks/useAuth";
import { hasPermission } from "@/lib/utils";

const SECTIONS = [
  {
    title: "Portfolio Overview",
    description: "High-level portfolio metrics, balances, and disbursement activity",
    reports: [
      {
        title: "Loan Applications",
        link: "loans-reports/loan-applications",
        description: "All loan applications with status, product, and client details",
        icon: <FileText className="w-5 h-5" />,
        color: "text-blue-600",
        bg: "bg-blue-50 dark:bg-blue-900/20",
        permission: 100220,
      },
      {
        title: "Loan Portfolio",
        link: "loans-reports/loan-portfolio",
        description: "Full portfolio view across all loan products and statuses",
        icon: <BarChart2 className="w-5 h-5" />,
        color: "text-violet-600",
        bg: "bg-violet-50 dark:bg-violet-900/20",
        permission: 100223,
      },
      {
        title: "Portfolio Summary",
        link: "loans-reports/loan-portfolio/summary",
        description: "Consolidated totals by product, branch, and period",
        icon: <BarChart3 className="w-5 h-5" />,
        color: "text-indigo-600",
        bg: "bg-indigo-50 dark:bg-indigo-900/20",
        permission: 100224,
      },
      {
        title: "Loan Balances",
        link: "loans-reports/loan-balances",
        description: "Outstanding principal, interest, and penalty per borrower",
        icon: <Scale className="w-5 h-5" />,
        color: "text-emerald-600",
        bg: "bg-emerald-50 dark:bg-emerald-900/20",
        permission: 100225,
      },
      {
        title: "Loan Disbursements",
        link: "loans-reports/loan-disbursement-report",
        description: "All disbursed loans by date range, product, and officer",
        icon: <ArrowDownToLine className="w-5 h-5" />,
        color: "text-cyan-600",
        bg: "bg-cyan-50 dark:bg-cyan-900/20",
        permission: 100233,
      },
      {
        title: "Expected Interest",
        link: "loans-reports/loans-expected-interest",
        description: "Projected interest income across the active portfolio",
        icon: <Wallet className="w-5 h-5" />,
        color: "text-amber-600",
        bg: "bg-amber-50 dark:bg-amber-900/20",
        permission: 100231,
      },
    ],
  },
  {
    title: "Active & At-Risk Loans",
    description: "Monitor current portfolio health, overdue status, and risk exposure",
    reports: [
      {
        title: "Active Loans",
        link: "loans-reports/active-loans",
        description: "All currently disbursed loans with balance and next repayment",
        icon: <TrendingUp className="w-5 h-5" />,
        color: "text-green-600",
        bg: "bg-green-50 dark:bg-green-900/20",
        permission: 100221,
      },
      {
        title: "Overdue Loans",
        link: "loans-reports/overdue-loans",
        description: "Loans with missed repayments — PAR exposure by days overdue",
        icon: <AlertTriangle className="w-5 h-5" />,
        color: "text-red-600",
        bg: "bg-red-50 dark:bg-red-900/20",
        permission: 100222,
      },
      {
        title: "Loan Aging Report",
        link: "loans-reports/aging-loans",
        description: "Portfolio segmented by overdue bucket: 1–30, 31–90, 90+ days",
        icon: <Clock className="w-5 h-5" />,
        color: "text-orange-600",
        bg: "bg-orange-50 dark:bg-orange-900/20",
        permission: 100226,
      },
      {
        title: "Loan Arrears",
        link: "loans-reports/loan-arrears",
        description: "Detailed arrears schedule with principal and interest overdue",
        icon: <ShieldAlert className="w-5 h-5" />,
        color: "text-rose-600",
        bg: "bg-rose-50 dark:bg-rose-900/20",
        permission: 100236,
      },
      {
        title: "Loan Tracking",
        link: "loans-reports/loan-tracking",
        description: "Follow-up status and collection progress per overdue borrower",
        icon: <Target className="w-5 h-5" />,
        color: "text-pink-600",
        bg: "bg-pink-50 dark:bg-pink-900/20",
        permission: 100235,
      },
      {
        title: "Loan Maturity",
        link: "loans-reports/loan-maturity-report",
        description: "Loans maturing within the selected period — early-warning view",
        icon: <PieChart className="w-5 h-5" />,
        color: "text-teal-600",
        bg: "bg-teal-50 dark:bg-teal-900/20",
        permission: 100232,
      },
    ],
  },
  {
    title: "Loan Lifecycle",
    description: "Closed, restructured, and problem loan categories",
    reports: [
      {
        title: "Settled Loans",
        link: "loans-reports/settled-loans",
        description: "Loans fully settled by negotiated agreement or restructuring",
        icon: <CheckCircle2 className="w-5 h-5" />,
        color: "text-emerald-600",
        bg: "bg-emerald-50 dark:bg-emerald-900/20",
        permission: 100227,
      },
      {
        title: "Paid Off Loans",
        link: "loans-reports/paid-off-loans",
        description: "Loans fully repaid per the original schedule",
        icon: <CheckCircle2 className="w-5 h-5" />,
        color: "text-green-600",
        bg: "bg-green-50 dark:bg-green-900/20",
        permission: 100238,
      },
      {
        title: "Defaulted Loans",
        link: "loans-reports/defaulted-loans",
        description: "Loans classified as defaulted with outstanding exposure",
        icon: <TrendingDown className="w-5 h-5" />,
        color: "text-red-600",
        bg: "bg-red-50 dark:bg-red-900/20",
        permission: 100234,
      },
      {
        title: "Written Off Loans",
        link: "loans-reports/writtern-off-loans",
        description: "Loans written off the books — for regulatory and audit purposes",
        icon: <XCircle className="w-5 h-5" />,
        color: "text-gray-600",
        bg: "bg-gray-100 dark:bg-gray-800/40",
        permission: 100228,
      },
      {
        title: "Rejected Loans",
        link: "loans-reports/rejected-loans",
        description: "Applications rejected with reason and officer details",
        icon: <XCircle className="w-5 h-5" />,
        color: "text-slate-600",
        bg: "bg-slate-100 dark:bg-slate-800/40",
        permission: 100229,
      },
    ],
  },
  {
    title: "Relationships & Recovery",
    description: "Guarantors, recovery activity, and officer accountability",
    reports: [
      {
        title: "Guarantors Report",
        link: "loans-reports/guarantors",
        description: "All guarantors per loan — name, amount guaranteed, contact",
        icon: <Users className="w-5 h-5" />,
        color: "text-blue-600",
        bg: "bg-blue-50 dark:bg-blue-900/20",
        permission: 100237,
      },
      {
        title: "Loan Recovery",
        link: "loans-reports/loans-recovery",
        description: "Collections against overdue loans — recovery rate per officer",
        icon: <Receipt className="w-5 h-5" />,
        color: "text-amber-600",
        bg: "bg-amber-50 dark:bg-amber-900/20",
        permission: 100230,
      },
      {
        title: "Loan Officer Performance",
        link: "hr-reports/loan-officer-performance",
        description: "Disbursements, collection rates, and overdue rates per officer",
        icon: <BookOpen className="w-5 h-5" />,
        color: "text-violet-600",
        bg: "bg-violet-50 dark:bg-violet-900/20",
        permission: 100258,
      },
    ],
  },
];

// Legacy section permission — users with the old 100128 code still see all loan cards
const LEGACY = 100128;

export function LoansReportTable() {
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

import { Link } from "react-router-dom";
import {
  Scale, TrendingUp, LayoutList, ArrowRightLeft, BookOpen,
  Wallet, ClipboardList, CalendarDays, DollarSign, Receipt,
  FileSearch, FileBarChart2, BarChart3,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import useAuth from "@/MiddleWares/Hooks/useAuth";
import { hasPermission } from "@/lib/utils";

const SECTIONS = [
  {
    title: "Financial Statements",
    description: "Core statutory reports required for financial compliance and governance",
    reports: [
      {
        title: "Trial Balance",
        link: "accounting-reports/trial-balance",
        description: "Verify debits equal credits across all accounts for a period",
        icon: <Scale className="w-5 h-5" />,
        color: "text-blue-600",
        bg: "bg-blue-50 dark:bg-blue-900/20",
        permission: 100206,
      },
      {
        title: "Income Statement",
        link: "accounting-reports/income-statement",
        description: "Revenues minus expenses — the profit or loss for the period",
        icon: <TrendingUp className="w-5 h-5" />,
        color: "text-green-600",
        bg: "bg-green-50 dark:bg-green-900/20",
        permission: 100208,
      },
      {
        title: "Balance Sheet",
        link: "accounting-reports/balance-sheet",
        description: "Assets, liabilities, and equity at a point in time",
        icon: <LayoutList className="w-5 h-5" />,
        color: "text-violet-600",
        bg: "bg-violet-50 dark:bg-violet-900/20",
        permission: 100207,
      },
      {
        title: "Cash Flow Statement",
        link: "accounting-reports/cash-flow",
        description: "Cash inflows and outflows from operating, investing, and financing activities",
        icon: <ArrowRightLeft className="w-5 h-5" />,
        color: "text-cyan-600",
        bg: "bg-cyan-50 dark:bg-cyan-900/20",
        permission: 100209,
      },
      {
        title: "Comprehensive Income",
        link: "accounting-reports/comprehensive-income",
        description: "Full income picture including operational metrics and dividend distributions",
        icon: <BarChart3 className="w-5 h-5" />,
        color: "text-indigo-600",
        bg: "bg-indigo-50 dark:bg-indigo-900/20",
        permission: 100218,
      },
    ],
  },
  {
    title: "Ledgers & Books",
    description: "Detailed transaction records and daily operational books",
    reports: [
      {
        title: "General Ledger",
        link: "accounting-reports/general-ledger",
        description: "Full transaction history for any individual account with running balance",
        icon: <BookOpen className="w-5 h-5" />,
        color: "text-amber-600",
        bg: "bg-amber-50 dark:bg-amber-900/20",
        permission: 100210,
      },
      {
        title: "Cash Book",
        link: "accounting-reports/cash-book",
        description: "All cash and bank transactions with opening and closing balances",
        icon: <Wallet className="w-5 h-5" />,
        color: "text-emerald-600",
        bg: "bg-emerald-50 dark:bg-emerald-900/20",
        permission: 100211,
      },
      {
        title: "Till Sheet",
        link: "accounting-reports/till-sheet",
        description: "Per-teller transaction log — cash in, cash out, and running balance",
        icon: <ClipboardList className="w-5 h-5" />,
        color: "text-rose-600",
        bg: "bg-rose-50 dark:bg-rose-900/20",
        permission: 100212,
      },
      {
        title: "Day Sheet",
        link: "accounting-reports/day-sheet",
        description: "Daily summary of all inflows (deposits) and outflows (withdrawals)",
        icon: <CalendarDays className="w-5 h-5" />,
        color: "text-orange-600",
        bg: "bg-orange-50 dark:bg-orange-900/20",
        permission: 100213,
      },
    ],
  },
  {
    title: "Income & Expenses",
    description: "Breakdown of income sources and expense categories with line-level detail",
    reports: [
      {
        title: "Income Summary",
        link: "accounting-reports/income-reports",
        description: "Total income per account for the selected period",
        icon: <DollarSign className="w-5 h-5" />,
        color: "text-green-600",
        bg: "bg-green-50 dark:bg-green-900/20",
        permission: 100214,
      },
      {
        title: "Expense Summary",
        link: "accounting-reports/expense-reports",
        description: "Total expense per account — net spend by category",
        icon: <Receipt className="w-5 h-5" />,
        color: "text-red-600",
        bg: "bg-red-50 dark:bg-red-900/20",
        permission: 100215,
      },
      {
        title: "Income Detailed",
        link: "accounting-reports/income-report-detailed",
        description: "Line-by-line income transactions with dates, descriptions, and amounts",
        icon: <FileSearch className="w-5 h-5" />,
        color: "text-teal-600",
        bg: "bg-teal-50 dark:bg-teal-900/20",
        permission: 100216,
      },
      {
        title: "Expense Detailed",
        link: "accounting-reports/expense-report-detailed",
        description: "Line-by-line expense transactions with vendor, branch, and staff info",
        icon: <FileBarChart2 className="w-5 h-5" />,
        color: "text-pink-600",
        bg: "bg-pink-50 dark:bg-pink-900/20",
        permission: 100217,
      },
    ],
  },
];

// Legacy section permission — users with the old 100127 code still see all accounting cards
const LEGACY = 100127;

export function AccountingReportTable() {
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
          All reports respect your branch access level and active fiscal year
        </span>
      </div>
    </div>
  );
}

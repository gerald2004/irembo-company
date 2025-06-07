import {
  GalleryVerticalEnd,
  Settings,
  Settings2,
  Ungroup,
  Users,
  PiggyBank,
  ArrowUpFromLine,
  ArrowDownFromLine,
  Rotate3d,
  Tangent,
  FileDigit,
  NotebookTabs,
  Hash,
  ChartCandlestick,
  SquareSquare,
  BadgeDollarSign,
  // AudioLines,
  Target,
  MessagesSquare,
  AtSign,
  Drill,
  Cable,
  FolderGit,
  BookUp2,
  Asterisk,
  School,
  TabletSmartphone,
  UtilityPole,
  Footprints,
  CreditCard,
  // MessageCircle,
  PersonStanding,
  Banknote,
  LucidePanelsTopLeft,
  Accessibility,
  RadioReceiver,
  Mails,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
// import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import useAuth from "@/MiddleWares/Hooks/useAuth";
import { NavSingle } from "./nav-single";

export function AppSidebar({ ...props }) {
  const { auth } = useAuth();
  const initials = `${auth?.user?.firstname?.[0] || ""}${
    auth?.user?.lastname?.[0] || ""
  }`.toUpperCase();

  const data = {
    user: {
      name: `${auth?.user?.firstname} ${auth?.user?.lastname}`,
      email: auth?.user?.email,
      avatar: "",
      initials: initials,
      contact: auth?.user?.contact,
      role: auth?.user?.role,
    },
    teams: [
      {
        name: auth?.user?.sacco,
        logo: GalleryVerticalEnd,
        plan: auth?.user?.branch,
      },
    ],
    settings: {
      title: "Settings",
      items: [
        {
          title: "Business Settings",
          url: "#",
          icon: Settings,
          items: [
            {
              title: "Business Profile",
              url: "business-profile",
            },
            {
              title: "Business Defaults",
              url: "business-defaults",
            },
            {
              title: "Fiscal Years",
              url: "fiscal-years",
            },
            {
              title: "Chart Of Accounts",
              url: "chart-of-accounts",
            },
            {
              title: "Loan Settings",
              url: "loan-settings",
            },
            {
              title: "Fixed Deposit Settings",
              url: "fixed-deposit-settings",
            },

            {
              title: "Account Deposit Settings",
              url: "account-savings-settings",
            },
            {
              title: "Branch Management",
              url: "branch-management",
            },
            {
              title: "Vendor Management",
              url: "vendor-management",
            },
            {
              title: "Transaction Channels",
              url: "transaction-channels",
            },
            {
              title: "Payroll Settings",
              url: "payroll-settings",
            },
            {
              title: "Notifications Settings",
              url: "notifications-settings",
            },
          ],
        },
        {
          title: "System Settings",
          url: "#",
          icon: Settings2,
          items: [
            {
              title: "General Config",
              url: "general-config",
            },
            {
              title: "Roles",
              url: "system-roles",
            },
            // {
            //   title: "Backups",
            //   url: "system-backups",
            // },
            {
              title: "System Notification Triggers",
              url: "system-notification-triggers",
            },
            // {
            //   title: "Staff, Client Portal & App Status",
            //   url: "portal-app-config",
            // },
            // {
            //   title: "Client App Config",
            //   url: "client-app-config",
            // },
            // {
            //   title: "Client Portal Config",
            //   url: "client-portal-config",
            // },
            // {
            //   title: "System Health",
            //   url: "system-health",
            // },
          ],
        },
      ],
    },
    dashboard: {
      title: "Home",
      items: [
        {
          name: "Dashboard",
          url: "/dashboard",
          icon: Ungroup,
        },
      ],
    },
    clients: {
      title: "Clients",
      items: [
        {
          name: "Clients",
          url: "/clients",
          icon: Users,
        },
      ],
    },
    transactions: {
      title: "Financial Account Transactions",
      items: [
        {
          name: "Savings",
          url: "/savings",
          icon: ArrowUpFromLine,
        },
        {
          name: "Withdraws",
          url: "/withdraws",
          icon: ArrowDownFromLine,
        },
        {
          name: "Fixed Deposits",
          url: "/fixed-deposits",
          icon: PiggyBank,
        },
        {
          name: "Internal Transfers",
          url: "/internal-transfers",
          icon: Rotate3d,
        },
        {
          name: "Shares",
          url: "/shares",
          icon: Tangent,
        },
        // {
        //   name: "School Fees",
        //   url: "/school-fees",
        //   icon: GraduationCap,
        // },
      ],
    },

    loans: {
      title: "Loans",
      items: [
        {
          title: "Loans",
          url: "#",
          icon: SquareSquare,
          items: [
            {
              title: "Individual Loans",
              url: "individual-loans",
            },
            {
              title: "Group Loans",
              url: "group-loans",
            },
            // {
            //   title: "Loan Reversals",
            //   url: "loan-reversals",
            // },
          ],
        },
      ],
    },
    accounting: {
      title: "Accounting",
      items: [
        {
          name: "External Incomes",
          icon: NotebookTabs,
          url: "external-incomes",
        },
        {
          name: "Expenses",
          icon: FileDigit,
          url: "expenses",
        },
        {
          name: "Journal Entries",
          icon: Hash,
          url: "journal-entries",
        },
        {
          name: "Assets",
          icon: ChartCandlestick,
          url: "assets",
        },
      ],
    },
    float_management: {
      title: "Float Management, External Balances",
      items: [
        {
          name: "Mobile Banking Float Managament",
          icon: TabletSmartphone,
          url: "mobile-banking-float-management",
        },
        {
          name: "SMS Float Managament",
          icon: Mails,
          url: "sms-float-management",
        },
        {
          name: "Utilities Float Management",
          icon: UtilityPole,
          url: "utilities-float-management",
        },
        {
          name: "CRB Float Management",
          icon: CreditCard,
          url: "crb-float-management",
        },
      ],
    },
    human_resource: {
      title: "Human Resource",
      items: [
        {
          name: "Staff Management",
          url: "staff-management",
          icon: PersonStanding,
        },
        {
          name: "Payroll",
          url: "payroll",
          icon: BadgeDollarSign,
        },
        // {
        //   name: "Leave Management",
        //   url: "leave-management",
        //   icon: AudioLines,
        // },
      ],
    },
    bulk_studio: {
      title: "Bulk Studio",
      items: [
        {
          title: "Bulk Studio",
          url: "#",
          icon: Target,
          items: [
            {
              title: "Bulk Client Registration",
              url: "bulk-client-registration",
            },
            {
              title: "Bulk Group Registration",
              url: "bulk-group-registration",
            },
            {
              title: "Bulk Savings",
              url: "bulk-savings",
            },
            {
              title: "Bulk Withdraws",
              url: "bulk-withdraws",
            },
            {
              title: "Bulk Transfers",
              url: "bulk-transfers",
            },
            {
              title: "Bulk Loan Applications",
              url: "bulk-loan-applications",
            },
            {
              title: "Bulk Shares",
              url: "bulk-shares",
            },
            {
              title: "Bulk SMS Alerts",
              url: "bulk-sms-alerts",
            },
            {
              title: "Bulk Email Alerts",
              url: "bulk-email-alerts",
            },
          ],
        },
      ],
    },
    customer_care: {
      title: "Communications, Utlities, CRB",
      items: [
        {
          name: "SMS",
          url: "sms",
          icon: MessagesSquare,
        },
        {
          name: "Emails",
          url: "emails",
          icon: AtSign,
        },
        {
          name: "Utilities",
          url: "utilities",
          icon: Drill,
        },
        {
          name: "Credit Reference Bureau",
          url: "credit-reference-bureau",
          icon: Asterisk,
        },
      ],
    },
    reports: {
      title: "Reports",
      items: [
        {
          name: "Daily Reports",
          url: "daily-reports",
          icon: Cable,
        },
        {
          name: "Accounting Reports",
          url: "accounting-reports",
          icon: FolderGit,
        },
        {
          name: "Loans Reports",
          url: "loans-reports",
          icon: BookUp2,
        },
        {
          name: "Savings Reports",
          url: "savings-reports",
          icon: Banknote,
        },
        {
          name: "Client Reports",
          url: "client-reports",
          icon: LucidePanelsTopLeft,
        },
        {
          name: "Deposit Account Reports",
          url: "account-reports",
          icon: Accessibility,
        },
        {
          name: "Assets Reports",
          url: "assets-reports",
          icon: School,
        },
        {
          name: "Communication Reports",
          url: "communication-reports",
          icon: RadioReceiver,
        },
        {
          name: "Activity Log / Audit Trail",
          url: "activity-log",
          icon: Footprints,
        },
      ],
    },
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavSingle data={data.dashboard} />
        <NavSingle data={data.clients} />
        <NavMain data={data.loans} />
        <NavSingle data={data.transactions} />
        <NavSingle data={data.accounting} />
        <NavSingle data={data.human_resource} />
        <NavSingle data={data.customer_care} />
        <NavMain data={data.bulk_studio} />
        <NavSingle data={data.reports} />
        <NavSingle data={data.float_management} />
        <NavMain data={data.settings} />
        {/* <NavProjects projects={data.projects} /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

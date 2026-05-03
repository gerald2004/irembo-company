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
  DoorOpen,
  CircleX,
  MailCheck,
  BanknoteIcon,
  ArrowLeftRight,
  CalendarDays,
  CalendarOff,
  ClipboardList,
  Shield,
  ShieldCheck,
  BarChart3,
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
import { hasPermission, sideBarfilterItems } from "@/lib/utils";

export function AppSidebar({ ...props }) {
  const { auth, setAuth } = useAuth();
  const initials = `${auth?.user?.firstname?.[0] ?? ""}${
    auth?.user?.lastname?.[0] ?? ""
  }`.toUpperCase();

  const userPermissions = auth?.roles || [];

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
        name: auth?.user?.sacco_name,
        logo: GalleryVerticalEnd,
        plan: auth?.user?.branch_name,
      },
    ],
    settings: {
      title: "Settings",
      permissionCodes: [
        100136, 100137, 100138, 100139, 100140, 100141, 100142, 100143, 100144,
        100145, 100146, 100147, 100148, 100149, 100150,
      ],
      items: [
        {
          title: "Business Settings",
          url: "#",
          icon: Settings,
          permissionCodes: [
            100136, 100137, 100138, 100139, 100140, 100141, 100142, 100143,
            100144, 100145, 100146, 100147,
          ],
          items: [
            {
              title: "Business Profile",
              url: "business-profile",
              permissionCodes: [100136],
            },
            {
              title: "Business Defaults",
              url: "business-defaults",
              permissionCodes: [100137],
            },
            {
              title: "Fiscal Years",
              url: "fiscal-years",
              permissionCodes: [100138],
            },
            {
              title: "Chart Of Accounts",
              url: "chart-of-accounts",
              permissionCodes: [100139],
            },
            {
              title: "Loan Settings",
              url: "loan-settings",
              permissionCodes: [100140],
            },
            {
              title: "Fixed Deposit Settings",
              url: "fixed-deposit-settings",
              permissionCodes: [100141],
            },

            {
              title: "Account Deposit Settings",
              url: "account-savings-settings",
              permissionCodes: [100142],
            },
            {
              title: "Branch Management",
              url: "branch-management",
              permissionCodes: [100143],
            },
            {
              title: "Vendor Management",
              url: "vendor-management",
              permissionCodes: [100144],
            },
            {
              title: "Transaction Channels",
              url: "transaction-channels",
              permissionCodes: [100145],
            },
            {
              title: "Transaction Linked Accounts",
              url: "transaction-linked-accounts",
              permissionCodes: [100145],
            },
            {
              title: "Payroll Settings",
              url: "payroll-settings",
              permissionCodes: [100146],
            },
            {
              title: "Notifications Settings",
              url: "notifications-settings",
              permissionCodes: [100147],
            },
            {
              title: "Compulsory Savings",
              url: "compulsory-savings-settings",
              permissionCodes: [100137],
            },
          ],
        },
        {
          title: "System Settings",
          url: "#",
          icon: Settings2,
          permissionCodes: [100148, 100149, 100150, 100266],
          items: [
            {
              title: "General Config",
              url: "general-config",
              permissionCodes: [100148],
            },
            {
              title: "Roles",
              url: "system-roles",
              permissionCodes: [100149],
            },

            {
              title: "System Notification Triggers",
              url: "system-notification-triggers",
              permissionCodes: [100150],
            },
            {
              title: "Loan Notifications Admin",
              url: "loan-notifications-admin",
              permissionCodes: [100266],
            },
          ],
        },
      ],
    },
    dashboard: {
      title: "Home",
      permissionCodes: [100001],
      items: [
        {
          name: "Dashboard",
          url: "/dashboard",
          icon: Ungroup,
          permissionCodes: [100001],
        },
      ],
    },
    clients: {
      title: "Clients",
      permissionCodes: [100011, 100015],
      items: [
        {
          name: "Clients",
          url: "/clients",
          icon: Users,
        },
        {
          name: "Register Individual",
          url: "/clients/individual/new",
          icon: PersonStanding,
          permissionCodes: [100007],
        },
        {
          name: "Register Group",
          url: "/clients/group/new",
          icon: Accessibility,
          permissionCodes: [100012],
        },
        {
          name: "Register Company",
          url: "/clients/company/new",
          icon: CreditCard,
          permissionCodes: [100012],
        },
        {
          name: "Open Joint Account",
          url: "/clients/joint-account/new",
          icon: BanknoteIcon,
          permissionCodes: [100012],
        },
      ],
    },
    transactions: {
      title: "Financial Account Transactions",
      permissionCodes: [100099, 100100, 100101, 100102, 100103],
      items: [
        {
          name: "Savings",
          url: "/savings",
          icon: ArrowUpFromLine,
          permissionCodes: [100099],
        },
        {
          name: "Withdraws",
          url: "/withdraws",
          icon: ArrowDownFromLine,
          permissionCodes: [100100],
        },
        {
          name: "Fixed Deposits",
          url: "/fixed-deposits",
          icon: PiggyBank,
          permissionCodes: [100101],
        },
        {
          name: "Internal Transfers",
          url: "/internal-transfers",
          icon: Rotate3d,
          permissionCodes: [100102],
        },
        {
          name: "Shares",
          url: "/shares",
          icon: Tangent,
          permissionCodes: [100103],
        },
      ],
    },

    loans: {
      title: "Loans",
      permissionCodes: [100067, 100158, 100202, 100203],
      items: [
        {
          title: "Loans",
          url: "#",
          icon: SquareSquare,
          items: [
            {
              title: "Individual Loans",
              url: "individual-loans",
              permissionCodes: [100067],
            },
            {
              title: "Group Loans",
              url: "group-loans",
              permissionCodes: [100158],
            },
            {
              title: "Joint Account Loans",
              url: "joint-loans",
              permissionCodes: [100202],
            },
            {
              title: "Company Loans",
              url: "company-loans",
              permissionCodes: [100203],
            },
          ],
        },
      ],
    },
    accounting: {
      title: "Accounting",
      permissionCodes: [100104, 100107, 100109, 100111, 100204, 100270, 100275],
      items: [
        {
          name: "External Incomes",
          icon: NotebookTabs,
          url: "external-incomes",
          permissionCodes: [100104],
        },
        {
          name: "Expenses",
          icon: FileDigit,
          url: "expenses",
          permissionCodes: [100107],
        },
        {
          name: "Journal Entries",
          icon: Hash,
          url: "journal-entries",
          permissionCodes: [100109],
        },
        {
          name: "Opening A Business Day",
          icon: DoorOpen,
          url: "opening-a-business-day",
          permissionCodes: [100109],
        },
        {
          name: "Cash Transfers",
          icon: Rotate3d,
          url: "cash-transfers",
          permissionCodes: [100109],
        },

        {
          name: "Inter-Branch Transfers",
          icon: ArrowLeftRight,
          url: "inter-branch-transfers",
          permissionCodes: [100211],
        },
        {
          name: "Closing A Business Day",
          icon: CircleX,
          url: "closing-a-business-day",
          permissionCodes: [100109],
        },
        {
          name: "Assets",
          icon: ChartCandlestick,
          url: "assets",
          permissionCodes: [100111],
        },
        {
          name: "Budgets",
          icon: BarChart3,
          url: "budgets",
          permissionCodes: [100270, 100275],
        },
      ],
    },
    float_management: {
      title: "Float Management, External Balances",
      permissionCodes: [100135],
      items: [
        {
          name: "Mobile Banking Float Managament",
          icon: TabletSmartphone,
          url: "mobile-banking-float-management",
          permissionCodes: [100135],
        },
        {
          name: "Bank Float Managament",
          icon: BanknoteIcon,
          url: "bank-float-management",
          permissionCodes: [100135],
        },
        {
          name: "SMS Float Managament",
          icon: Mails,
          url: "sms-float-management",
          permissionCodes: [100135],
        },
        {
          name: "Email Float Managament",
          icon: MailCheck,
          url: "email-float-management",
          permissionCodes: [100135],
        },
        {
          name: "Utilities Float Management",
          icon: UtilityPole,
          url: "utilities-float-management",
          permissionCodes: [100135],
        },
        {
          name: "CRB Float Management",
          icon: CreditCard,
          url: "crb-float-management",
          permissionCodes: [100135],
        },
      ],
    },
    human_resource: {
      title: "Human Resource",
      permissionCodes: [100119, 100174],
      items: [
        {
          name: "Staff Management",
          url: "staff-management",
          icon: PersonStanding,
          permissionCodes: [100174],
        },
        {
          name: "Attendance",
          url: "attendance",
          icon: ClipboardList,
          permissionCodes: [100174],
        },
        {
          name: "Leave Management",
          url: "leave-management",
          icon: CalendarOff,
          permissionCodes: [100174],
        },
        {
          name: "Public Holidays",
          url: "public-holidays",
          icon: CalendarDays,
          permissionCodes: [100174],
        },
        {
          name: "Payroll",
          url: "payroll",
          icon: BadgeDollarSign,
          permissionCodes: [100119],
        },
      ],
    },
    bulk_studio: {
      title: "Bulk Studio",
      permissionCodes: [100125],
      items: [
        {
          title: "Bulk Studio",
          url: "#",
          icon: Target,
          permissionCodes: [100125],
          items: [
            {
              title: "Bulk Client Registration",
              permissionCodes: [100125],
              url: "bulk-client-registration",
            },
            {
              title: "Bulk Group Registration",
              permissionCodes: [100125],
              url: "bulk-group-registration",
            },
            {
              title: "Bulk Savings",
              permissionCodes: [100125],
              url: "bulk-savings",
            },
            {
              title: "Bulk Withdraws",
              permissionCodes: [100125],
              url: "bulk-withdraws",
            },
            {
              title: "Bulk Transfers",
              permissionCodes: [100125],
              url: "bulk-transfers",
            },
            {
              title: "Bulk Loan Applications",
              permissionCodes: [100125],
              url: "bulk-loan-applications",
            },
            {
              title: "Bulk Shares",
              permissionCodes: [100125],
              url: "bulk-shares",
            },
            {
              title: "Bulk SMS Alerts",
              permissionCodes: [100125],
              url: "bulk-sms-alerts",
            },
            {
              title: "Bulk Email Alerts",
              permissionCodes: [100125],
              url: "bulk-email-alerts",
            },
          ],
        },
      ],
    },
    customer_care: {
      title: "Communications, Utlities, CRB",
      permissionCodes: [100121, 100122, 100123, 100124],
      items: [
        {
          name: "SMS",
          url: "sms",
          icon: MessagesSquare,
          permissionCodes: [100121],
        },
        {
          name: "Emails",
          url: "emails",
          icon: AtSign,
          permissionCodes: [100122],
        },
        {
          name: "Utilities",
          url: "utilities",
          icon: Drill,
          permissionCodes: [100123],
        },
        {
          name: "Credit Reference Bureau",
          url: "credit-reference-bureau",
          icon: Asterisk,
          permissionCodes: [100124],
        },
      ],
    },
    qms: {
      title: "QMS — Checker / Maker",
      permissionCodes: [100001],
      items: [
        {
          name: "Approval Queue",
          url: "/qms",
          icon: ShieldCheck,
          permissionCodes: [100001],
        },
        {
          name: "QMS Policies",
          url: "/qms?tab=policies",
          icon: Settings2,
          permissionCodes: [100001],
        },
      ],
    },
    aml: {
      title: "AML & Compliance",
      permissionCodes: [100001],
      items: [
        {
          name: "AML Engine",
          url: "/aml",
          icon: Shield,
          permissionCodes: [100001],
        },
        {
          name: "AML Policies",
          url: "/aml?tab=policies",
          icon: BookUp2,
          permissionCodes: [100001],
        },
        {
          name: "AML Alerts",
          url: "/aml?tab=alerts",
          icon: Asterisk,
          permissionCodes: [100001],
        },
        {
          name: "AML Cases",
          url: "/aml?tab=cases",
          icon: FolderGit,
          permissionCodes: [100001],
        },
      ],
    },
    reports: {
      title: "Reports",
      permissionCodes: [
        100126, 100127, 100128, 100129, 100130, 100131, 100132, 100133, 100134,
        100194, 100174, 100257,
      ],
      items: [
        {
          name: "Daily Reports",
          url: "daily-reports",
          icon: Cable,
          permissionCodes: [100126],
        },
        {
          name: "Accounting Reports",
          url: "accounting-reports",
          icon: FolderGit,
          permissionCodes: [100127],
        },
        {
          name: "Loans Reports",
          url: "loans-reports",
          icon: BookUp2,
          permissionCodes: [100128],
        },
        {
          name: "Group Reports",
          url: "group-reports",
          icon: FolderGit,
          permissionCodes: [100128],
        },
        {
          name: "Savings Reports",
          url: "savings-reports",
          icon: Banknote,
          permissionCodes: [100129],
        },
        {
          name: "Client Reports",
          url: "client-reports",
          icon: LucidePanelsTopLeft,
          permissionCodes: [100130],
        },
        {
          name: "Deposit Account Reports",
          url: "account-reports",
          icon: Accessibility,
          permissionCodes: [100131],
        },
        {
          name: "Assets Reports",
          url: "assets-reports",
          icon: School,
          permissionCodes: [100132],
        },
        {
          name: "Communication Reports",
          url: "communication-reports",
          icon: RadioReceiver,
          permissionCodes: [100133],
        },
        {
          name: "Activity Log / Audit Trail",
          url: "activity-log",
          icon: Footprints,
          permissionCodes: [100134],
        },
        {
          name: "HR & Performance Reports",
          url: "hr-reports",
          icon: ClipboardList,
          permissionCodes: [100257, 100194, 100174],
        },
      ],
    },
  };
  const filteredSidebar = Object.entries(data).reduce((acc, [key, section]) => {
    const sectionPerm = section.permissionCodes;

    // 🔥 Pass userPermissions to the filtering function
    const filteredItems = sideBarfilterItems(section.items, userPermissions);

    if (
      (filteredItems && filteredItems.length > 0) ||
      hasPermission(userPermissions, sectionPerm)
    ) {
      acc[key] = {
        ...section,
        items: filteredItems,
      };
    }

    return acc;
  }, {});

  const handleBranchSwitched = ({ branch_id, branch_name }) => {
    // 1) update auth in memory
    setAuth((prev) => {
      const next = {
        ...prev,
        current_branch_id: Number(branch_id),
        user: {
          ...prev?.user,
          branch_id: Number(branch_id),
          branch_name,
        },
      };
      try {
        window.location.reload(); // 2) persist if you hydrate from LS
      } catch {
        // no worries
      }
      return next;
    });
  };


  const userId = auth?.user?.user_id; // whichever you store
  const currentBranchId = auth?.current_branch_id ?? auth?.user?.branch_id;
  const allowedBranches = auth?.allowed_branches ?? [];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher
          userId={userId}
          businessName={auth?.user?.sacco_name}
          currentBranchId={currentBranchId}
          allowedBranches={allowedBranches}
          onSwitched={handleBranchSwitched}
        />
      </SidebarHeader>
      <SidebarContent>
        {/* <NavSingle data={data.dashboard} />
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
        <NavProjects projects={data.projects} /> */}
        {filteredSidebar.dashboard && (
          <NavSingle data={filteredSidebar.dashboard} />
        )}
        {filteredSidebar.clients && (
          <NavSingle data={filteredSidebar.clients} />
        )}
        {filteredSidebar.loans && <NavMain data={filteredSidebar.loans} />}
        {filteredSidebar.transactions && (
          <NavSingle data={filteredSidebar.transactions} />
        )}
        {filteredSidebar.accounting && (
          <NavSingle data={filteredSidebar.accounting} />
        )}
        {filteredSidebar.human_resource && (
          <NavSingle data={filteredSidebar.human_resource} />
        )}
        {filteredSidebar.customer_care && (
          <NavSingle data={filteredSidebar.customer_care} />
        )}
        {filteredSidebar.qms && (
          <NavSingle data={filteredSidebar.qms} />
        )}
        {filteredSidebar.aml && (
          <NavSingle data={filteredSidebar.aml} />
        )}
        {filteredSidebar.bulk_studio && (
          <NavMain data={filteredSidebar.bulk_studio} />
        )}
        {filteredSidebar.reports && (
          <NavSingle data={filteredSidebar.reports} />
        )}
        {filteredSidebar.float_management && (
          <NavSingle data={filteredSidebar.float_management} />
        )}
        {filteredSidebar.settings && (
          <NavMain data={filteredSidebar.settings} />
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

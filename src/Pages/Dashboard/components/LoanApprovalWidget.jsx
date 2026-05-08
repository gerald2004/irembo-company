/* eslint-disable react/prop-types */
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle,
  Clock,
  ShieldCheck,
  Banknote,
  FileText,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";

const STAGE_CONFIG = {
  first_review: {
    label: "Awaiting First Approval",
    icon: Clock,
    colorClass: "text-sky-600",
    bgClass: "bg-sky-50",
    path: "/loans?status=first_review",
  },
  second_review: {
    label: "Awaiting Second Approval",
    icon: ShieldCheck,
    colorClass: "text-indigo-600",
    bgClass: "bg-indigo-50",
    path: "/loans?status=second_review",
  },
  final_review: {
    label: "Awaiting Final Approval",
    icon: CheckCircle,
    colorClass: "text-violet-600",
    bgClass: "bg-violet-50",
    path: "/loans?status=final_review",
  },
  ready_for_disbursement: {
    label: "Ready for Disbursement",
    icon: Banknote,
    colorClass: "text-emerald-600",
    bgClass: "bg-emerald-50",
    path: "/loans?status=approved",
  },
};

function ApprovalCard({ stageKey, count, isLoading }) {
  const navigate = useNavigate();
  const cfg = STAGE_CONFIG[stageKey];
  if (! cfg) return null;
  const Icon = cfg.icon;

  return (
    <Card
      className="border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => navigate(cfg.path)}
    >
      <CardContent className="p-5">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-16" />
          </div>
        ) : (
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <p className="text-sm font-medium text-muted-foreground truncate">
                {cfg.label}
              </p>
              <p className="text-3xl font-bold tabular-nums tracking-tight">
                {count ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">
                {count === 1 ? "loan" : "loans"} waiting
              </p>
            </div>
            <div className={`p-2.5 rounded-xl shrink-0 ${cfg.bgClass}`}>
              <Icon className={`h-5 w-5 ${cfg.colorClass}`} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MyLoansCard({ myLoans, isLoading }) {
  const navigate = useNavigate();
  if (isLoading) {
    return (
      <Card className="border shadow-sm">
        <CardContent className="p-5 space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-8 w-16" />
        </CardContent>
      </Card>
    );
  }
  return (
    <Card
      className="border shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => navigate("/loans")}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground">My Submitted Loans</p>
            <p className="text-3xl font-bold tabular-nums">{myLoans?.total ?? 0}</p>
            <div className="flex flex-wrap gap-2 mt-1 text-xs">
              {myLoans?.under_review > 0 && (
                <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                  {myLoans.under_review} under review
                </span>
              )}
              {myLoans?.approved > 0 && (
                <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                  {myLoans.approved} approved
                </span>
              )}
              {myLoans?.rejected > 0 && (
                <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                  {myLoans.rejected} rejected
                </span>
              )}
            </div>
          </div>
          <div className="p-2.5 rounded-xl shrink-0 bg-gray-50">
            <FileText className="h-5 w-5 text-gray-500" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LoanApprovalWidget() {
  const axiosPrivate = useAxiosPrivate();

  const { data, isLoading } = useQuery({
    queryKey: ["loans-pending-widget"],
    queryFn: () =>
      axiosPrivate.get("/dashboards/loans-pending").then((r) => r.data?.data),
    refetchInterval: 60_000,
  });

  const privileges = data?.privileges ?? [];
  const counts     = data?.counts ?? {};

  // Nothing to show if user has no loan workflow privileges
  const hasApproverRole = privileges.some((p) =>
    ["first_approver","second_approver","final_approver","disbursement_officer"].includes(p)
  );
  const hasOfficerRole = privileges.includes("loan_officer");

  if (! isLoading && ! hasApproverRole && ! hasOfficerRole) return null;

  const cards = [];

  if (hasOfficerRole || privileges.length === 0) {
    cards.push(
      <MyLoansCard key="my" myLoans={counts.my_loans} isLoading={isLoading} />
    );
  }

  if (privileges.includes("first_approver")) {
    cards.push(
      <ApprovalCard key="first" stageKey="first_review" count={counts.first_review} isLoading={isLoading} />
    );
  }

  if (privileges.includes("second_approver")) {
    cards.push(
      <ApprovalCard key="second" stageKey="second_review" count={counts.second_review} isLoading={isLoading} />
    );
  }

  if (privileges.includes("final_approver")) {
    cards.push(
      <ApprovalCard key="final" stageKey="final_review" count={counts.final_review} isLoading={isLoading} />
    );
  }

  if (privileges.includes("disbursement_officer")) {
    cards.push(
      <ApprovalCard key="disburse" stageKey="ready_for_disbursement" count={counts.ready_for_disbursement} isLoading={isLoading} />
    );
  }

  if (cards.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        Loan Approval Queue
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards}
      </div>
    </div>
  );
}

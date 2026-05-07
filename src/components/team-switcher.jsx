/* eslint-disable react/prop-types */
import * as React from "react";
import { ChevronsUpDown, Check, Globe } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";

const ALL_BRANCHES_ID = 0; // sentinel: "view all branches"

/**
 * Props:
 * userId
 * businessName
 * allowedBranches: [{ branch_id, branch_name }]
 * currentBranchId
 * onSwitched: (payload) => void (optional)
 */
export function TeamSwitcher({
  userId,
  businessName,
  allowedBranches = [],
  currentBranchId,
  onSwitched,
}) {
  const axiosPrivate = useAxiosPrivate();
  const { isMobile } = useSidebar();

  const [activeId, setActiveId] = React.useState(
    currentBranchId || ALL_BRANCHES_ID
  );
  const [loadingId, setLoadingId] = React.useState(null);

  React.useEffect(() => {
    if (currentBranchId != null) setActiveId(currentBranchId);
  }, [currentBranchId]);

  const isAllBranches = Number(activeId) === ALL_BRANCHES_ID;

  const activeBranch = React.useMemo(() => {
    if (isAllBranches || !allowedBranches.length) return null;
    return (
      allowedBranches.find((b) => Number(b.branch_id) === Number(activeId)) ||
      allowedBranches[0]
    );
  }, [allowedBranches, activeId, isAllBranches]);

  const initials = (name) =>
    (name || "?")
      .split(" ")
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();

  const switchBranch = async (branchId) => {
    const numId = Number(branchId);

    // "All Branches" — no API call, just local state
    if (numId === ALL_BRANCHES_ID) {
      setActiveId(ALL_BRANCHES_ID);
      toast({
        title: "Viewing all branches",
        description: `Showing data across all ${allowedBranches.length} branches`,
      });
      if (onSwitched)
        onSwitched({ branch_id: null, branch_name: null });
      window.dispatchEvent(
        new CustomEvent("branch-switched", {
          detail: { branch_id: null, branch_name: null },
        })
      );
      return;
    }

    if (numId === Number(activeId)) return;

    try {
      setLoadingId(branchId);
      await axiosPrivate.post(
        `/business/employees/${userId}?action=switch-branch`,
        { branch_id: numId }
      );

      setActiveId(numId);
      const picked = allowedBranches.find(
        (b) => Number(b.branch_id) === numId
      );

      toast({
        title: "Branch switched",
        description: picked?.branch_name || "Active branch updated.",
      });

      if (onSwitched)
        onSwitched({ branch_id: branchId, branch_name: picked?.branch_name });

      window.dispatchEvent(
        new CustomEvent("branch-switched", {
          detail: { branch_id: branchId, branch_name: picked?.branch_name },
        })
      );
    } catch (error) {
      const msg =
        error?.response?.data?.messages?.[0] ||
        error?.response?.data?.message ||
        "Failed to switch branch.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoadingId(null);
    }
  };

  const hasMultiple = allowedBranches.length > 1;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild disabled={!hasMultiple}>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              {/* Avatar / icon */}
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shrink-0">
                {isAllBranches ? (
                  <Globe className="size-4" />
                ) : (
                  <span className="text-xs font-bold">
                    {initials(activeBranch?.branch_name)}
                  </span>
                )}
              </div>

              {/* Text */}
              <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
                <span className="truncate font-semibold">
                  {businessName || "Business"}
                </span>
                <span className="truncate text-xs text-muted-foreground flex items-center gap-1">
                  {isAllBranches ? (
                    <>
                      <span>All branches</span>
                      <Badge
                        variant="secondary"
                        className="h-4 px-1 text-[10px] leading-none"
                      >
                        {allowedBranches.length}
                      </Badge>
                    </>
                  ) : (
                    activeBranch?.branch_name || "Select Branch"
                  )}
                </span>
              </div>

              {hasMultiple && <ChevronsUpDown className="ml-auto shrink-0" />}
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          {hasMultiple && (
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Branches
              </DropdownMenuLabel>

              {/* All Branches option */}
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  switchBranch(ALL_BRANCHES_ID);
                }}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-sm border bg-muted">
                  <Globe className="size-3" />
                </div>
                <div className="flex-1 truncate">
                  <span>All Branches</span>
                  <span className="ml-1.5 text-[10px] text-muted-foreground">
                    ({allowedBranches.length})
                  </span>
                </div>
                {isAllBranches && <Check className="size-4 shrink-0" />}
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Individual branches */}
              {allowedBranches.map((b) => {
                const isActive =
                  !isAllBranches &&
                  Number(b.branch_id) === Number(activeId);
                const isBusy = Number(b.branch_id) === Number(loadingId);
                return (
                  <DropdownMenuItem
                    key={b.branch_id}
                    onSelect={(e) => {
                      e.preventDefault();
                      if (!isBusy) switchBranch(b.branch_id);
                    }}
                    disabled={isBusy}
                    className="gap-2 p-2"
                  >
                    <div className="flex size-6 items-center justify-center rounded-sm border">
                      <span className="text-[10px] font-bold">
                        {initials(b.branch_name)}
                      </span>
                    </div>
                    <div className="flex-1 truncate">{b.branch_name}</div>
                    {isBusy && (
                      <span className="size-4 animate-spin border-2 border-current border-t-transparent rounded-full" />
                    )}
                    {isActive && !isBusy && (
                      <Check className="size-4 shrink-0" />
                    )}
                  </DropdownMenuItem>
                );
              })}

              <DropdownMenuSeparator />
              <div className="px-3 py-1.5 text-xs text-muted-foreground">
                {isAllBranches
                  ? `Viewing all ${allowedBranches.length} branches`
                  : "Select to change active branch"}
              </div>
            </DropdownMenuContent>
          )}
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

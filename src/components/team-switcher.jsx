/* eslint-disable react/prop-types */
import * as React from "react";
import { ChevronsUpDown, Check } from "lucide-react";

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

import { toast } from "@/hooks/use-toast";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";

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

  const [activeId, setActiveId] = React.useState(currentBranchId || null);
  const [loadingId, setLoadingId] = React.useState(null);

  React.useEffect(() => {
    if (currentBranchId) setActiveId(currentBranchId);
  }, [currentBranchId]);

  const activeBranch = React.useMemo(() => {
    if (!allowedBranches.length) return null;
    return (
      allowedBranches.find((b) => Number(b.branch_id) === Number(activeId)) ||
      allowedBranches.find(
        (b) => Number(b.branch_id) === Number(currentBranchId)
      ) ||
      allowedBranches[0]
    );
  }, [allowedBranches, activeId, currentBranchId]);

  const initials = (name) =>
    (name || "?")
      .split(" ")
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();

  const switchBranch = async (branchId) => {
    if (!userId || !branchId) return;
    if (Number(branchId) === Number(activeId)) return;

    try {
      setLoadingId(branchId);
      await axiosPrivate.post(
        `/business/employees/${userId}?action=switch-branch`,
        { branch_id: Number(branchId) }
      );

      setActiveId(Number(branchId));
      const picked = allowedBranches.find(
        (b) => Number(b.branch_id) === Number(branchId)
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

  const disabledAll = !allowedBranches.length || allowedBranches.length === 1;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild disabled={disabledAll}>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <span className="text-xs font-bold">
                  {initials(activeBranch?.branch_name)}
                </span>
              </div>

              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {businessName || "Business"}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {activeBranch?.branch_name || "Select Branch"}
                </span>
              </div>

              {!disabledAll && <ChevronsUpDown className="ml-auto" />}
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          {!disabledAll && (
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}
            >
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Branches
              </DropdownMenuLabel>

              {allowedBranches.map((b) => {
                const isActive = Number(b.branch_id) === Number(activeId);
                const isBusy = Number(b.branch_id) === Number(loadingId);
                return (
                  <DropdownMenuItem
                    key={b.branch_id}
                    onSelect={(e) => {
                      e.preventDefault(); // optional: keeps UX snappy with Radix
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
                    {isActive && <Check className="size-4 shrink-0" />}
                  </DropdownMenuItem>
                );
              })}

              <DropdownMenuSeparator />
              <div className="px-3 py-1.5 text-xs text-muted-foreground">
                Select to change active branch
              </div>
            </DropdownMenuContent>
          )}
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

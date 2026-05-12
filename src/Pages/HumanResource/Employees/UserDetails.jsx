import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Shield, ShieldCheck, ShieldOff, Smartphone, MessageSquare, Mail, AlertTriangle, Trash2, Plus, GitBranch, CreditCard, Building2, Info } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { useParams } from "react-router-dom";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { getInitials } from "@/lib/general-functions";
import useAuth from "@/MiddleWares/Hooks/useAuth";
import { hasPermission } from "@/lib/utils";

const StaffDetails = () => {
  const axiosPrivate = useAxiosPrivate();
  const params = useParams();
  const {
    auth: { roles },
  } = useAuth();

  // Staff core
  const {
    data: userData,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["staff", params.id],
    queryFn: async () => {
      const controller = new AbortController();
      const response = await axiosPrivate.get(
        `/business/employees/${params.id}`,
        { signal: controller.signal }
      );
      return response.data.data.user;
    },
    enabled: !!params.id,
  });

  // Branch meta (current + allowed)
  const { data: branchMeta, refetch: refetchBranches } = useQuery({
    queryKey: ["staff-branches", params.id],
    queryFn: async () => {
      const res = await axiosPrivate.get(
        `/business/employees/${params.id}?action=branches`
      );
      return res.data.data; // { user_id, current_branch_id, allowed_branches: [{branch_id,branch_name}] }
    },
    enabled: !!params.id,
  });

  // All branches (to add)
  // expects: { data: { branches: [{ id, name, ... }] } }
  const { data: allBranches } = useQuery({
    queryKey: ["all-branches"],
    queryFn: async () => {
      const res = await axiosPrivate.get(`/settings/branches`);
      return res.data?.data?.branches ?? [];
    },
  });

  const [isLoadingReset, setIsLoadingReset] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [show2faReset, setShow2faReset] = useState(false);
  const [twoFaLoading, setTwoFaLoading] = useState(false);

  const resetUserPassword = async () => {
    const controller = new AbortController();
    try {
      setIsLoadingReset(true);
      setIsDisabled(true);
      await axiosPrivate.patch(
        `/business/employees/${params.id}`,
        { reset_password: true },
        {
          signal: controller.signal,
          headers: { "Content-Type": "application/json" },
        }
      );
      toast({
        title: "Success",
        description: "Password reset successfully! Check your SMS.",
      });
    } catch (error) {
      console.error("Error:", error?.response?.data);
      toast({
        title: "Error",
        description: "Failed to reset password.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingReset(false);
      setIsDisabled(false);
    }
  };

  const resetUserPincode = async () => {
    const controller = new AbortController();
    try {
      setIsLoadingReset(true);
      setIsDisabled(true);
      await axiosPrivate.patch(
        `/business/employees/${params.id}`,
        { reset_pin: true },
        {
          signal: controller.signal,
          headers: { "Content-Type": "application/json" },
        }
      );
      toast({
        title: "Success",
        description: "Pincode reset successfully! Check your SMS.",
      });
    } catch (error) {
      console.error("Error:", error?.response?.data);
      toast({
        title: "Error",
        description: "Failed to reset pincode.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingReset(false);
      setIsDisabled(false);
    }
  };

  const unlockUser = async () => {
    const controller = new AbortController();
    try {
      setIsLoadingReset(true);
      setIsDisabled(true);
      await axiosPrivate.patch(
        `/business/employees/${params.id}`,
        { attempts: 0 },
        {
          signal: controller.signal,
          headers: { "Content-Type": "application/json" },
        }
      );
      await refetch();
      toast({ title: "Success", description: "User unlocked successfully." });
    } catch (error) {
      console.error("Error:", error?.response?.data);
      toast({
        title: "Error",
        description: "Failed to unlock user.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingReset(false);
      setIsDisabled(false);
    }
  };

  const updatePrivileges = async (newPrivilege) => {
    const controller = new AbortController();
    try {
      setIsLoadingReset(true);
      await axiosPrivate.patch(
        `/business/employees/${params.id}`,
        { privileges: newPrivilege },
        {
          signal: controller.signal,
          headers: { "Content-Type": "application/json" },
        }
      );
      await refetch();
      toast({
        title: "Success",
        description: `User privileges updated to ${
          newPrivilege === "sacco" ? "whole business" : newPrivilege
        }.`,
      });
    } catch (error) {
      console.error("Error:", error?.response?.data);
      toast({
        title: "Error",
        description: "Failed to update user privileges.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingReset(false);
    }
  };

  const updateDashboard = async (newDashboard) => {
    const controller = new AbortController();
    try {
      setIsLoadingReset(true);
      await axiosPrivate.patch(
        `/business/employees/${params.id}`,
        { dashboard: newDashboard },
        {
          signal: controller.signal,
          headers: { "Content-Type": "application/json" },
        }
      );
      await refetch();
      toast({
        title: "Success",
        description: `User dashboard updated to ${newDashboard}.`,
      });
    } catch (error) {
      console.error("Error:", error?.response?.data);
      toast({
        title: "Error",
        description: "Failed to update user dashboard.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingReset(false);
    }
  };

  // Branch handlers
  const switchBranch = async (branchId) => {
    const controller = new AbortController();
    try {
      setIsLoadingReset(true);
      await axiosPrivate.post(
        `/business/employees/${params.id}?action=switch-branch`,
        { branch_id: Number(branchId) },
        {
          signal: controller.signal,
          headers: { "Content-Type": "application/json" },
        }
      );
      await Promise.all([refetch(), refetchBranches()]);
      toast({ title: "Success", description: "Active branch switched." });
    } catch (error) {
      console.error(error?.response?.data);
      toast({
        title: "Error",
        description: "Failed to switch branch.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingReset(false);
    }
  };

  const assignBranch = async (branchId) => {
    const controller = new AbortController();
    try {
      setIsLoadingReset(true);
      await axiosPrivate.post(
        `/business/employees/${params.id}?action=assign-branch`,
        { branch_id: Number(branchId) },
        {
          signal: controller.signal,
          headers: { "Content-Type": "application/json" },
        }
      );
      await refetchBranches();
      toast({ title: "Success", description: "Branch added to allowed list." });
    } catch (error) {
      console.error(error?.response?.data);
      toast({
        title: "Error",
        description: "Failed to add branch.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingReset(false);
    }
  };

  const removeBranch = async (branchId) => {
    const controller = new AbortController();
    try {
      setIsLoadingReset(true);
      await axiosPrivate.post(
        `/business/employees/${params.id}?action=remove-branch`,
        { branch_id: Number(branchId) },
        {
          signal: controller.signal,
          headers: { "Content-Type": "application/json" },
        }
      );
      await refetchBranches();
      toast({ title: "Success", description: "Branch removed." });
    } catch (error) {
      console.error(error?.response?.data);
      toast({
        title: "Error",
        description: "Failed to remove branch.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingReset(false);
    }
  };

  const reset2fa = async () => {
    try {
      setTwoFaLoading(true);
      await axiosPrivate.patch(`/business/employees/${params.id}`, { reset_2fa: true }, {
        headers: { "Content-Type": "application/json" },
      });
      await refetch();
      setShow2faReset(false);
      toast({ title: "Success", description: "Two-factor authentication has been disabled for this user." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to reset 2FA.", variant: "destructive" });
    } finally {
      setTwoFaLoading(false);
    }
  };

  const update2faMethod = async (method) => {
    try {
      setTwoFaLoading(true);
      await axiosPrivate.patch(`/business/employees/${params.id}`, { two_fa_method: method }, {
        headers: { "Content-Type": "application/json" },
      });
      await refetch();
      toast({ title: "Success", description: `2FA method updated to ${method.toUpperCase()}.` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update 2FA method.", variant: "destructive" });
    } finally {
      setTwoFaLoading(false);
    }
  };

  // Compute addable branches (all - allowed)
  const allowedIds = new Set(
    (branchMeta?.allowed_branches || []).map((b) => b.branch_id)
  );
  const addableBranches =
    (allBranches || []).filter((b) => !allowedIds.has(b.id)) || [];

  // ── Loan Workflow Privileges ───────────────────────────────────────────────
  const LOAN_PRIVILEGE_LABELS = {
    loan_officer:         "Loan Officer",
    first_approver:       "First Approver",
    second_approver:      "Second Approver",
    final_approver:       "Final Approver",
    disbursement_officer: "Disbursement Officer",
  };
  const LOAN_PRIVILEGE_COLORS = {
    loan_officer:         "bg-gray-100 text-gray-800 border-gray-300",
    first_approver:       "bg-sky-100 text-sky-800 border-sky-300",
    second_approver:      "bg-indigo-100 text-indigo-800 border-indigo-300",
    final_approver:       "bg-violet-100 text-violet-800 border-violet-300",
    disbursement_officer: "bg-emerald-100 text-emerald-800 border-emerald-300",
  };

  const queryClient = useQueryClient();

  const { data: loanPrivileges = [] } = useQuery({
    queryKey: ["staff-loan-privileges", params.id],
    queryFn: () =>
      axiosPrivate
        .get(`/hr/loan-privileges?user_id=${params.id}`)
        .then((r) => r.data?.data ?? []),
    enabled: !!params.id,
  });

  const [lpForm, setLpForm] = useState({ privilege_types: [], branch_ids: [] });
  const [lpLoading, setLpLoading] = useState(false);

  const batchAddPrivileges = async () => {
    if (!lpForm.privilege_types.length) return;
    // empty branch_ids = sacco-wide (null); otherwise one record per branch
    const branchValues = lpForm.branch_ids.length ? lpForm.branch_ids.map(Number) : [null];
    const combinations = lpForm.privilege_types.flatMap((pt) =>
      branchValues.map((bId) => ({ privilege_type: pt, branch_id: bId }))
    );
    setLpLoading(true);
    try {
      const results = await Promise.allSettled(
        combinations.map(({ privilege_type, branch_id }) =>
          axiosPrivate.post("/hr/loan-privileges", {
            user_id: Number(params.id),
            privilege_type,
            branch_id,
          })
        )
      );
      const succeeded = results.filter((r) => r.status === "fulfilled").length;
      const skipped   = results.length - succeeded;
      toast({
        title: `${succeeded} privilege(s) assigned${skipped ? `, ${skipped} already existed` : ""}`,
      });
      queryClient.invalidateQueries({ queryKey: ["staff-loan-privileges", params.id] });
      setLpForm({ privilege_types: [], branch_ids: [] });
    } catch (err) {
      toast({ title: "Error", variant: "destructive", description: "Failed to assign privileges" });
    } finally {
      setLpLoading(false);
    }
  };

  const toggleLoanPrivilege = useMutation({
    mutationFn: (id) => axiosPrivate.patch(`/hr/loan-privileges/${id}`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["staff-loan-privileges", params.id] }),
    onError: () => toast({ title: "Failed to update", variant: "destructive" }),
  });

  const removeLoanPrivilege = useMutation({
    mutationFn: (id) => axiosPrivate.delete(`/hr/loan-privileges/${id}`),
    onSuccess: () => {
      toast({ title: "Privilege removed" });
      queryClient.invalidateQueries({ queryKey: ["staff-loan-privileges", params.id] });
    },
    onError: () => toast({ title: "Failed to remove", variant: "destructive" }),
  });

  // ── Client Branch Access (client-specific, separate from general data privilege) ──
  const { data: clientBranchAccess = { client_data_privileges: "sacco", branches: [] } } = useQuery({
    queryKey: ["staff-client-branch-access", params.id],
    queryFn: () =>
      axiosPrivate
        .get(`/hr/client-branch-access?user_id=${params.id}`)
        .then((r) => r.data?.data ?? { client_data_privileges: "sacco", branches: [] }),
    enabled: !!params.id,
  });

  const grantClientBranch = useMutation({
    mutationFn: (branchId) =>
      axiosPrivate.post("/hr/client-branch-access", {
        user_id: Number(params.id),
        branch_id: branchId,
      }),
    onSuccess: () => {
      toast({ title: "Branch access granted" });
      queryClient.invalidateQueries({ queryKey: ["staff-client-branch-access", params.id] });
    },
    onError: (err) =>
      toast({ title: "Error", description: err?.response?.data?.messages?.[0] ?? "Failed to grant access", variant: "destructive" }),
  });

  const revokeClientBranch = useMutation({
    mutationFn: (branchId) =>
      axiosPrivate.delete("/hr/client-branch-access", {
        data: { user_id: Number(params.id), branch_id: branchId },
      }),
    onSuccess: () => {
      toast({ title: "Branch access revoked" });
      queryClient.invalidateQueries({ queryKey: ["staff-client-branch-access", params.id] });
    },
    onError: () =>
      toast({ title: "Error", description: "Failed to revoke access", variant: "destructive" }),
  });

  const updateClientPriv = useMutation({
    mutationFn: (privilege) =>
      axiosPrivate.patch(`/hr/client-branch-access/${params.id}`, {
        client_data_privileges: privilege,
      }),
    onSuccess: () => {
      toast({ title: "Data access level updated" });
      queryClient.invalidateQueries({ queryKey: ["staff-client-branch-access", params.id] });
      queryClient.invalidateQueries({ queryKey: ["staff", params.id] });
    },
    onError: () =>
      toast({ title: "Error", description: "Failed to update access level", variant: "destructive" }),
  });

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="/dashboard">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink to="/staff-management">
              Staff Management
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>
              {userData?.user_lastname} {userData?.user_firstname}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-col md:flex">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <div className="flex items-center justify-between space-y-2">
            <h5 className="text-2xl font-bold tracking-tight">
              {userData?.user_lastname} {userData?.user_firstname}
            </h5>
          </div>

          <div className="mx-auto">
            {isLoading || isRefetching ? (
              <Skeleton className="h-[500px] rounded-xl" />
            ) : isError ? (
              <Button onClick={() => refetch()}>Retry</Button>
            ) : (
              <>
                {/* Top cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="shadow-lg rounded-xl">
                    <CardHeader className="p-4">
                      <CardTitle className="text-xl font-semibold">
                        {userData.user_firstname} {userData.user_lastname}
                      </CardTitle>
                      <CardDescription className="text-sm capitalize">
                        {userData.user_job_title}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4 text-sm">
                      <div className="flex items-center space-x-20">
                        <Avatar className="w-40 h-40 cursor-pointer">
                          <AvatarImage
                            src={userData.user_image || ""}
                            alt="Profile Picture"
                          />
                          <AvatarFallback className="text-1xl font-semibold">
                            {getInitials(
                              `${userData?.user_firstname} ${userData?.user_lastname}`
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-4 text-sm">
                          <p>
                            {" "}
                            Email:{" "}
                            <span className="font-semibold">
                              {userData.user_email}
                            </span>
                          </p>
                          <p>
                            {" "}
                            Contact:{" "}
                            <span className="font-semibold">
                              {userData.user_contact}
                            </span>
                          </p>
                          <p>
                            {" "}
                            Branch:{" "}
                            <span className="font-semibold">
                              {userData.branch?.branch_name || "N/A"}
                            </span>
                          </p>
                          <p>
                            {" "}
                            Department:{" "}
                            <span className="font-semibold">
                              {userData.department?.department_name || "N/A"}
                            </span>
                          </p>
                          <p>
                            {" "}
                            Role:{" "}
                            <span className="font-semibold">
                              {userData.role?.role_title}
                            </span>
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-lg rounded-xl">
                    <CardHeader className="p-4">
                      <CardTitle className="text-xl font-semibold">
                        More Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4 text-sm">
                      <p>
                        {" "}
                        Date Of Birth:{" "}
                        <span className="font-semibold">
                          {userData.user_date_of_birth}
                        </span>
                      </p>
                      <p>
                        {" "}
                        Login Attempts:{" "}
                        <span className="font-semibold">
                          {userData.user_login_attempts}
                        </span>
                      </p>
                      <p>
                        {" "}
                        Salary:{" "}
                        <span className="font-semibold">
                          {userData.user_salary}
                        </span>
                      </p>
                      <p>
                        {" "}
                        User Can Login:{" "}
                        <span className="font-semibold capitalize">
                          {userData.user_can_login}
                        </span>
                      </p>
                      <p>
                        {" "}
                        Account Status:{" "}
                        <span className="font-semibold capitalize">
                          {userData.user_status}
                        </span>
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Middle row: privileges/dashboard + branch access */}
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {hasPermission(roles, 100118) && (
                    <Card className="shadow-lg rounded-xl">
                      <CardHeader className="p-4">
                        <CardTitle className="text-xl font-semibold">
                          Staff Data Privileges & Dashboards
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Select
                            value={userData.user_data_privileges}
                            onValueChange={updatePrivileges}
                            disabled={isLoadingReset}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Privileges" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="personal">Personal</SelectItem>
                              <SelectItem value="branch">Branch</SelectItem>
                              <SelectItem value="sacco">
                                Whole Business
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground mt-1">General data access (loans, accounting, etc.)</p>
                        </div>
                        <div>
                          <Select
                            value={userData.user_default_dashboard}
                            onValueChange={updateDashboard}
                            disabled={isLoadingReset}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Default Dashboard" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="overview">Overview</SelectItem>
                              <SelectItem value="accounting">
                                Accounting
                              </SelectItem>
                              <SelectItem value="members">Members</SelectItem>
                              <SelectItem value="loans">Loans</SelectItem>
                              <SelectItem value="notifications">
                                Notifications
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        </div>

                        {/* Client Data Access — independent from general privilege above */}
                        <div className="border-t pt-3 space-y-3">
                          <div>
                            <p className="text-sm font-medium">Client Data Access</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Controls which branch clients this staff can see — separate from the general access level above.
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { val: "sacco",    label: "All Branches",      cls: "bg-emerald-100 text-emerald-800 border-emerald-300" },
                              { val: "branch",   label: "Specific Branches", cls: "bg-sky-100 text-sky-800 border-sky-300" },
                              { val: "personal", label: "Own Records Only",  cls: "bg-amber-100 text-amber-800 border-amber-300" },
                            ].map(({ val, label, cls }) => {
                              const isActive = clientBranchAccess.client_data_privileges === val;
                              return (
                                <button
                                  key={val}
                                  disabled={isActive || updateClientPriv.isPending}
                                  onClick={() => updateClientPriv.mutate(val)}
                                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                                    isActive
                                      ? `${cls} cursor-default`
                                      : "border-dashed border-muted-foreground/40 text-muted-foreground hover:border-primary/50 hover:text-foreground cursor-pointer disabled:opacity-50"
                                  }`}
                                >
                                  {isActive && "✓ "}{label}
                                </button>
                              );
                            })}
                          </div>
                          {clientBranchAccess.client_data_privileges === "branch" && clientBranchAccess.branches.length === 0 && (
                            <div className="flex items-center gap-2 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-2">
                              <Info className="w-4 h-4 text-amber-600 shrink-0" />
                              <p className="text-xs text-amber-800 dark:text-amber-300">
                                Set to "Specific Branches" but no branches assigned — this staff member won't see any clients.
                              </p>
                            </div>
                          )}
                          {clientBranchAccess.branches.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {clientBranchAccess.branches.map((b) => (
                                <Badge
                                  key={b.branch_id}
                                  variant="secondary"
                                  className="flex items-center gap-1 bg-sky-50 text-sky-800 border-sky-200"
                                >
                                  <Building2 className="h-3 w-3" />
                                  {b.branch_name}
                                  <button
                                    className="ml-1 inline-flex"
                                    onClick={() => revokeClientBranch.mutate(b.branch_id)}
                                    disabled={revokeClientBranch.isPending}
                                    title="Remove"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          )}
                          {(() => {
                            const assignedIds = new Set(clientBranchAccess.branches.map((b) => b.branch_id));
                            const available = (allBranches ?? []).filter((b) => !assignedIds.has(b.id));
                            if (available.length === 0) return null;
                            return (
                              <Select
                                onValueChange={(val) => grantClientBranch.mutate(Number(val))}
                                disabled={grantClientBranch.isPending}
                                value=""
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue placeholder="Grant access to a branch…" />
                                </SelectTrigger>
                                <SelectContent>
                                  {available.map((b) => (
                                    <SelectItem key={b.id} value={String(b.id)}>
                                      {b.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            );
                          })()}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Branch Access */}
                  <Card className="shadow-lg rounded-xl">
                    <CardHeader className="p-4">
                      <CardTitle className="text-xl font-semibold">
                        Branch Access
                      </CardTitle>
                      <CardDescription>
                        Manage allowed branches and set the active branch this
                        staff views.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 grid gap-4">
                      {/* Active Branch */}
                      <div className="grid gap-2">
                        <div className="text-sm font-medium">Active Branch</div>
                        <Select
                          value={
                            branchMeta?.current_branch_id
                              ? String(branchMeta.current_branch_id)
                              : undefined
                          }
                          onValueChange={(val) => switchBranch(Number(val))}
                          disabled={isLoadingReset || !branchMeta}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select active branch" />
                          </SelectTrigger>
                          <SelectContent>
                            {(branchMeta?.allowed_branches || []).map((b) => (
                              <SelectItem
                                key={b.branch_id}
                                value={String(b.branch_id)}
                              >
                                {b.branch_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          Only branches in the allowed list can be set active.
                        </p>
                      </div>

                      {/* Allowed list */}
                      <div className="grid gap-2">
                        <div className="text-sm font-medium">
                          Allowed Branches
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(branchMeta?.allowed_branches || []).length ===
                            0 && (
                            <span className="text-sm text-muted-foreground">
                              No branches yet.
                            </span>
                          )}
                          {(branchMeta?.allowed_branches || []).map((b) => (
                            <Badge
                              key={b.branch_id}
                              variant="secondary"
                              className="flex items-center gap-1"
                            >
                              {b.branch_name}
                              <button
                                className="ml-1 inline-flex"
                                onClick={() => removeBranch(b.branch_id)}
                                title="Remove branch"
                                disabled={isLoadingReset}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          You can’t remove the current active branch.
                        </p>
                      </div>

                      {/* Add branch */}
                      <div className="grid gap-2">
                        <div className="text-sm font-medium">Add Branch</div>
                        <Select
                          onValueChange={(val) => assignBranch(Number(val))}
                          disabled={
                            isLoadingReset ||
                            (addableBranches?.length ?? 0) === 0
                          }
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                (addableBranches?.length ?? 0) > 0
                                  ? "Choose branch to add"
                                  : "No more branches"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {addableBranches.map((b) => (
                              <SelectItem key={b.id} value={String(b.id)}>
                                {b.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* 2FA + Loan Workflow Privileges */}
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="shadow-lg rounded-xl overflow-hidden">
                    <div className={`h-1 ${userData?.two_factor_enabled === "yes" ? "bg-emerald-500" : "bg-slate-300"}`} />
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {userData?.two_factor_enabled === "yes"
                            ? <ShieldCheck className="w-5 h-5 text-emerald-600" />
                            : <Shield className="w-5 h-5 text-muted-foreground" />}
                          <CardTitle className="text-base font-semibold">Two-Factor Authentication</CardTitle>
                        </div>
                        <Badge variant="outline" className={userData?.two_factor_enabled === "yes"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-muted text-muted-foreground"}>
                          {userData?.two_factor_enabled === "yes" ? "Enabled" : "Disabled"}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs mt-1">Manage staff 2FA security settings</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-2 space-y-4">
                      {userData?.two_factor_enabled === "yes" ? (
                        <>
                          {/* Current method display */}
                          <div className="flex flex-wrap gap-3 text-sm">
                            {[
                              { id: "sms",   label: "SMS",   icon: MessageSquare },
                              { id: "email", label: "Email", icon: Mail },
                              { id: "app",   label: "App",   icon: Smartphone },
                            ].map(({ id, label, icon: Icon }) => (
                              <button
                                key={id}
                                disabled={twoFaLoading || userData?.two_factor_method === id}
                                onClick={() => update2faMethod(id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all
                                  ${userData?.two_factor_method === id
                                    ? "border-emerald-400 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 cursor-default"
                                    : "border-muted hover:border-primary/50 hover:bg-muted/50 text-muted-foreground cursor-pointer disabled:opacity-50"}`}
                              >
                                <Icon className="w-3.5 h-3.5" />
                                {label}
                                {userData?.two_factor_method === id && (
                                  <span className="ml-1 text-emerald-600">✓</span>
                                )}
                              </button>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground">Click a method to switch. Active method shown in green.</p>
                          {userData?.two_factor_confirmed_at && (
                            <p className="text-xs text-muted-foreground">
                              Enabled: <strong>{new Date(userData.two_factor_confirmed_at).toLocaleDateString()}</strong>
                            </p>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/5"
                            onClick={() => setShow2faReset(true)}
                            disabled={twoFaLoading}
                          >
                            <ShieldOff className="w-3.5 h-3.5 mr-1.5" /> Disable 2FA for this user
                          </Button>
                        </>
                      ) : (
                        <div className="space-y-3">
                          <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 flex gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-800 dark:text-amber-300">
                              This staff member has not set up two-factor authentication.
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground">Enable with a specific method:</p>
                          <div className="flex gap-2 flex-wrap">
                            {[
                              { id: "sms",   label: "Enable via SMS",   icon: MessageSquare },
                              { id: "email", label: "Enable via Email", icon: Mail },
                              { id: "app",   label: "Enable via App",   icon: Smartphone },
                            ].map(({ id, label, icon: Icon }) => (
                              <Button
                                key={id}
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs"
                                disabled={twoFaLoading}
                                onClick={() => update2faMethod(id)}
                              >
                                <Icon className="w-3.5 h-3.5 mr-1.5" /> {label}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Loan Workflow Privileges — sits alongside 2FA */}
                  <Card className="shadow-lg rounded-xl overflow-hidden">
                    <div className="h-1 bg-violet-400" />
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-violet-600" />
                        <CardTitle className="text-base font-semibold">Loan Workflow Privileges</CardTitle>
                      </div>
                      <CardDescription className="text-xs mt-1">
                        Control which loan approval stages this staff member can action.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                      {/* Existing privileges list */}
                      {loanPrivileges.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No loan privileges assigned yet.</p>
                      ) : (
                        <div className="divide-y rounded-lg border overflow-hidden">
                          {loanPrivileges.map((priv) => (
                            <div key={priv.privilege_id} className="flex items-center justify-between px-3 py-2.5 bg-background">
                              <div className="flex items-center gap-3 min-w-0">
                                <span className={`text-xs font-medium px-2 py-0.5 rounded border ${LOAN_PRIVILEGE_COLORS[priv.privilege_type] ?? "bg-gray-100 text-gray-700 border-gray-300"}`}>
                                  {LOAN_PRIVILEGE_LABELS[priv.privilege_type] ?? priv.privilege_type}
                                </span>
                                {priv.branch_name ? (
                                  <span className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                                    <GitBranch className="h-3 w-3 shrink-0" />
                                    {priv.branch_name}
                                  </span>
                                ) : (
                                  <span className="text-xs text-muted-foreground">All branches</span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 shrink-0 ml-3">
                                <Switch
                                  checked={!!priv.is_active}
                                  onCheckedChange={() => toggleLoanPrivilege.mutate(priv.privilege_id)}
                                  disabled={toggleLoanPrivilege.isPending}
                                />
                                <button
                                  onClick={() => removeLoanPrivilege.mutate(priv.privilege_id)}
                                  disabled={removeLoanPrivilege.isPending}
                                  className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                                  title="Remove privilege"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add privileges — multi-select toggle badges */}
                      <div className="space-y-3 pt-1 border-t">
                        <p className="text-xs font-medium text-muted-foreground">Select one or more to assign:</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(LOAN_PRIVILEGE_LABELS).map(([val, label]) => {
                            const alreadyHas = loanPrivileges.some((p) => p.privilege_type === val);
                            const selected = lpForm.privilege_types.includes(val);
                            return (
                              <button
                                key={val}
                                disabled={alreadyHas}
                                onClick={() =>
                                  setLpForm((f) => ({
                                    ...f,
                                    privilege_types: selected
                                      ? f.privilege_types.filter((t) => t !== val)
                                      : [...f.privilege_types, val],
                                  }))
                                }
                                className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${
                                  alreadyHas
                                    ? `${LOAN_PRIVILEGE_COLORS[val]} opacity-50 cursor-not-allowed`
                                    : selected
                                    ? `${LOAN_PRIVILEGE_COLORS[val]} ring-2 ring-offset-1 ring-primary/50 cursor-pointer`
                                    : "border-dashed border-muted-foreground/40 text-muted-foreground hover:border-primary/50 hover:text-foreground cursor-pointer"
                                }`}
                              >
                                {selected && !alreadyHas && "✓ "}
                                {label}
                                {alreadyHas && " (assigned)"}
                              </button>
                            );
                          })}
                        </div>
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">
                            Branch scope — leave all unselected for sacco-wide access:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {(allBranches ?? []).map((b) => {
                              const selected = lpForm.branch_ids.includes(String(b.id));
                              return (
                                <button
                                  key={b.id}
                                  onClick={() =>
                                    setLpForm((f) => ({
                                      ...f,
                                      branch_ids: selected
                                        ? f.branch_ids.filter((id) => id !== String(b.id))
                                        : [...f.branch_ids, String(b.id)],
                                    }))
                                  }
                                  className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-all ${
                                    selected
                                      ? "bg-primary text-primary-foreground border-primary cursor-pointer"
                                      : "border-dashed border-muted-foreground/40 text-muted-foreground hover:border-primary/50 hover:text-foreground cursor-pointer"
                                  }`}
                                >
                                  {selected && "✓ "}
                                  {b.name}
                                </button>
                              );
                            })}
                            {(allBranches ?? []).length === 0 && (
                              <span className="text-xs text-muted-foreground italic">No branches configured</span>
                            )}
                          </div>
                          {lpForm.branch_ids.length === 0 && (
                            <p className="text-xs text-muted-foreground">No branch selected → will apply to all branches</p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          className="h-8 gap-1.5"
                          disabled={!lpForm.privilege_types.length || lpLoading}
                          onClick={batchAddPrivileges}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          {lpLoading
                            ? "Assigning…"
                            : lpForm.privilege_types.length
                            ? `Assign (${lpForm.privilege_types.length}${lpForm.branch_ids.length ? ` × ${lpForm.branch_ids.length} branch${lpForm.branch_ids.length > 1 ? "es" : ""}` : ", all branches"})`
                            : "Assign"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Bottom: resets */}
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="shadow-lg rounded-xl">
                    <CardHeader className="p-4">
                      <CardTitle className="text-xl font-semibold">
                        Staff Resets
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-x-4">
                      {hasPermission(roles, 100117) && (
                        <Button
                          size="sm"
                          onClick={unlockUser}
                          disabled={
                            (userData?.user_login_attempts ?? 0) < 3 ||
                            isDisabled ||
                            isLoadingReset
                          }
                        >
                          {isLoadingReset ? "Resetting..." : "Unlock User"}
                        </Button>
                      )}
                      {hasPermission(roles, 100115) && (
                        <Button
                          size="sm"
                          onClick={resetUserPassword}
                          disabled={isDisabled || isLoadingReset}
                        >
                          {isLoadingReset ? "Resetting..." : "Reset Password"}
                        </Button>
                      )}
                      {hasPermission(roles, 100116) && (
                        <Button
                          size="sm"
                          onClick={resetUserPincode}
                          disabled={isDisabled || isLoadingReset}
                        >
                          {isLoadingReset ? "Resetting..." : "Reset Pincode"}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      {/* 2FA disable confirmation dialog */}
      <Dialog open={show2faReset} onOpenChange={setShow2faReset}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldOff className="w-5 h-5 text-destructive" /> Disable 2FA
            </DialogTitle>
            <DialogDescription>
              This will immediately disable two-factor authentication for{" "}
              <strong>{userData?.user_firstname} {userData?.user_lastname}</strong>.
              They will no longer need a verification code to sign in.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setShow2faReset(false)}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={reset2fa} disabled={twoFaLoading}>
              {twoFaLoading ? "Disabling…" : "Confirm Disable"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default StaffDetails;

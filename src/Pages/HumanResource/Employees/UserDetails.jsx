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
import { X } from "lucide-react";

import { useQuery } from "@tanstack/react-query";
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

  // Compute addable branches (all - allowed)
  const allowedIds = new Set(
    (branchMeta?.allowed_branches || []).map((b) => b.branch_id)
  );
  const addableBranches =
    (allBranches || []).filter((b) => !allowedIds.has(b.id)) || [];

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
                      <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
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
    </>
  );
};

export default StaffDetails;

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
const StaffDetails = () => {
  const axiosPrivate = useAxiosPrivate();
  const params = useParams();
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
  });

  const [isLoadingReset, setIsLoadingReset] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);

  const resetUserPassword = async () => {
          const controller = new AbortController();

    try {
      setIsLoadingReset(true);
      setIsDisabled(true); // 🔒 Disable button after click

      await axiosPrivate.patch(
        `/business/employees/${params.id}`,
        {
          reset_password: true,
        },
        { signal: controller.signal }
      );

      toast({
        title: "Success",
        description: "Password reset successfully! Check your SMS.",
      });
    } catch (error) {
      console.error("Error:", error.response?.data);
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
        `/business/employees/${params.id}`, // Backend endpoint
        { reset_pin: true }, // Request body
        { signal: controller.signal }
      );
      toast({
        title: "Success",
        description: "Pincode reset successfully! Check your SMS.",
      });
    } catch (error) {
      console.error("Error:", error.response?.data);
      toast({
        title: "Error",
        variant: "destructive",
        description: "Failed to reset pincode.",
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
        {
          attempts: 0,
        },
        { signal: controller.signal }
      );
      //   console.log(response);
      refetch();
      toast({
        title: "Success",
        description: "User unlocked successfully.",
      });
    } catch (error) {
      console.error("Error:", error.response?.data);
      toast({
        title: "Error",
        variant: "destructive",
        description: "Failed to unlock user.",
      });
    } finally {
      setIsLoadingReset(false);
      setIsDisabled(false);
    }
  };
  const updatePrivileges = async (newPrivilege) => {
          const controller = new AbortController();

    try {
      setIsLoadingReset(true); // Show loading state

      await axiosPrivate.patch(
        `/business/employees/${params.id}`,
        {
          privileges: newPrivilege, // ✅ Ensure correct field name
        },
        { signal: controller.signal }
      );

      refetch(); // Refresh user data
      toast({
        title: "Success",
        description: `User privileges updated to ${
          newPrivilege === "sacco" ? "whole business" : newPrivilege
        }.`,
      });
    } catch (error) {
      console.error("Error:", error.response?.data);
      toast({
        title: "Error",
        variant: "destructive",
        description: "Failed to update user privileges.",
      });
    } finally {
      setIsLoadingReset(false);
    }
  };

  const updateDashboard = async (newDashboard) => {
          const controller = new AbortController();

    try {
      setIsLoadingReset(true); // Show loading state
      console.log(newDashboard);
      
      await axiosPrivate.patch(
        `/business/employees/${params.id}`,
        {
          dashboard: newDashboard, // ✅ Ensure correct field name
        },
        { signal: controller.signal }
      );

      refetch(); // Refresh user data
      toast({
        title: "Success",
        description: `User dashbaord updated to ${newDashboard}.`,
      });
    } catch (error) {
      console.error("Error:", error.response?.data);
      toast({
        title: "Error",
        variant: "destructive",
        description: "Failed to update user privileges.",
      });
    } finally {
      setIsLoadingReset(false);
    }
  };

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
              <Button onClick={refetch}>Retry</Button>
            ) : (
              <>
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
                            Email:{" "}
                            <span className="font-semibold">
                              {userData.user_email}
                            </span>
                          </p>
                          <p>
                            Contact:{" "}
                            <span className="font-semibold">
                              {userData.user_contact}
                            </span>
                          </p>
                          <p>
                            Branch:{" "}
                            <span className="font-semibold">
                              {userData.branch?.branch_name || "N/A"}
                            </span>
                          </p>
                          <p>
                            Department:{" "}
                            <span className="font-semibold">
                              {userData.department?.department_name || "N/A"}
                            </span>
                          </p>
                          <p>
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
                        Date Of Birth:{" "}
                        <span className="font-semibold">
                          {userData.user_date_of_birth}
                        </span>
                      </p>
                      <p>
                        Login Attempts:{" "}
                        <span className="font-semibold">
                          {userData.user_login_attempts}
                        </span>
                      </p>
                      <p>
                        Salary:{" "}
                        <span className="font-semibold">
                          {userData.user_salary}
                        </span>
                      </p>
                      <p>
                        User Can Login:{" "}
                        <span className="font-semibold capitalize">
                          {userData.user_can_login}
                        </span>
                      </p>
                      <p>
                        Account Status:{" "}
                        <span className="font-semibold capitalize">
                          {userData.user_status}
                        </span>
                      </p>
                    </CardContent>
                  </Card>
                </div>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          onValueChange={updatePrivileges} // ✅ Call API directly on change
                          disabled={isLoadingReset} // ✅ Prevent multiple requests
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
                          onValueChange={updateDashboard} // ✅ Call API directly on change
                          disabled={isLoadingReset} // ✅ Prevent multiple requests
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
                  <Card className="shadow-lg rounded-xl">
                    <CardHeader className="p-4">
                      <CardTitle className="text-xl font-semibold">
                        Staff Resets
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-x-4">
                      <Button
                        size="sm"
                        onClick={unlockUser}
                        disabled={
                          userData.user_login_attempts < 3 ||
                          isDisabled ||
                          isLoadingReset
                        }
                      >
                        {isLoadingReset ? "Resetting..." : "Unlock User"}
                      </Button>
                      <Button
                        size="sm"
                        onClick={resetUserPassword}
                        disabled={isDisabled || isLoadingReset}
                      >
                        {isLoadingReset ? "Resetting..." : "Reset Password"}
                      </Button>
                      <Button
                        size="sm"
                        onClick={resetUserPincode}
                        disabled={isDisabled || isLoadingReset}
                      >
                        {isLoadingReset ? "Resetting..." : "Reset Pincode"}
                      </Button>
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

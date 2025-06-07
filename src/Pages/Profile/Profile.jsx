import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/icons";
import { toast } from "@/hooks/use-toast";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import {
  Card,
  CardContent,
  CardTitle,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { formatDateTimestamp } from "@/lib/utils";

const Profile = () => {
  const axiosPrivate = useAxiosPrivate();

  const { data, isLoading: isFetching, refetch } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
            const controller = new AbortController();

      const res = await axiosPrivate.get("/accounts/profile", {
        signal: controller.signal,
      });
      return res.data.data.user;
    },
    onSuccess: (user) => {
      reset({
        firstName: user.user_firstname,
        lastName: user.user_lastname,
        email: user.user_email,
        mobile: user.user_contact,
      });
    },
  });
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();


  // 📝 Submit profile update
  const onSubmit = async (formData) => {
    try {
      const res = await axiosPrivate.patch("/accounts/profile", {
        user_firstname: formData.firstName,
        user_lastname: formData.lastName,
        user_email: formData.email,
        user_contact: formData.mobile,
      });
      toast({ title: "Success", description: res.data.messages });
      refetch();
    } catch (err) {
      toast({
        title: "Update failed",
        variant: "destructive",
        description: err?.response?.data?.messages || "Server error",
      });
    }
  };

useEffect(() => {
  if (data) {
    reset({
      firstName: data.user_firstname || "",
      lastName: data.user_lastname || "",
      email: data.user_email || "",
      mobile: data.user_contact || "",
      gender: data.user_gender || "",
      status: data.user_status || "",
      role: data.role.role_title || "",
      branch: data.branch.branch_name || "",
      timestamp: formatDateTimestamp(data.user_timestamp) || "",
    });
  }
}, [data, reset]);

  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink to="/dashboard">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Profile</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-col md:flex mt-2">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <div className="flex items-center justify-between space-y-2">
            <h5 className="text-2xl font-bold">Profile Settings</h5>
          </div>

          <Card className="max-w-5xl mx-auto shadow-lg rounded-xl">
            <CardHeader className="p-4 rounded-t-xl">
              <CardTitle className="text-sm font-semibold">
                Update Profile
              </CardTitle>
              <div className="border-b" />
              <CardDescription className="text-sm capitalize">
                Update your personal information and contact details.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4 text-sm">
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="grid gap-6 grid-cols-1 md:grid-cols-3"
              >
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    disabled={isFetching}
                    {...register("firstName", {
                      required: "First name is required",
                    })}
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-sm">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    disabled={isFetching}
                    {...register("lastName", {
                      required: "Last name is required",
                    })}
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-sm">
                      {errors.lastName.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    disabled={true}
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Invalid email address",
                      },
                    })}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="mobile">Mobile Phone</Label>
                  <Input
                    id="mobile"
                    disabled={true}
                    {...register("mobile", {
                      required: "Mobile number is required",
                      pattern: {
                        value: /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/,
                        message: "Invalid mobile number",
                      },
                    })}
                  />
                  {errors.mobile && (
                    <p className="text-red-500 text-sm">
                      {errors.mobile.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Input
                    id="gender"
                    disabled={true}
                    className={"capitalize"}
                    {...register("gender")}
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Input
                    id="status"
                    disabled={true}
                    className={"capitalize"}
                    {...register("status")}
                  />
                </div>
                <div>
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    disabled={true}
                    className={"capitalize"}
                    {...register("role")}
                  />
                </div>
                <div>
                  <Label htmlFor="branch">Branch</Label>
                  <Input
                    id="branch"
                    disabled={true}
                    className={"capitalize"}
                    {...register("branch")}
                  />
                </div>

                <div>
                  <Label htmlFor="timestamp">Registered On</Label>
                  <Input
                    id="timestamp"
                    disabled={true}
                    className={"capitalize"}
                    {...register("timestamp")}
                  />
                </div>

                <div className="col-span-full flex justify-end mt-4">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && (
                      <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Update Profile
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Profile;

import { useState } from "react";
import { useForm } from "react-hook-form";
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

const ChangePassword = () => {
  const axiosPrivate = useAxiosPrivate();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const newPassword = watch("newPassword", "");

  // 📝 Submit password update
  const onSubmit = async (data) => {
        const controller = new AbortController();
    
    try {
      const res = await axiosPrivate.post("/accounts/password/update", data, {
        signal: controller.signal,
      });
      toast({ title: "Success", description: res.data.messages });
      reset();
    } catch (err) {
      toast({
        title: "Update failed",
        variant: "destructive",
        description: err?.response?.data?.messages || "Server error",
      });
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
            <BreadcrumbPage>Change Password</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-col md:flex mt-2">
        <div className="border-b" />
        <div className="flex-1 space-y-4 p-0 pt-2">
          <div className="flex items-center justify-between space-y-2">
            <h5 className="text-2xl font-bold">Password Settings</h5>
          </div>

          <Card className="max-w-2xl mx-auto shadow-lg rounded-xl">
            <CardHeader className="p-4 rounded-t-xl">
              <CardTitle className="text-sm font-semibold">
                Update Password
              </CardTitle>
              <div className="border-b" />
              <CardDescription className="text-sm capitalize">
                Update your password.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4 text-sm">
              <form onSubmit={handleSubmit(onSubmit)} >
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="oldPassword">Old Password</Label>
                    <div className="relative">
                      <Input
                        id="oldPassword"
                        placeholder="Enter old password"
                        type={showOldPassword ? "text" : "password"}
                        autoComplete="current-password"
                        disabled={isSubmitting}
                        {...register("oldPassword", {
                          required: "Old password is required",
                        })}
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-2.5 text-muted-foreground hover:text-primary"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                      >
                        {showOldPassword ? (
                          <Icons.eyeOff className="h-4 w-4" />
                        ) : (
                          <Icons.eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {errors.oldPassword && (
                      <p className="text-sm text-red-500">
                        {errors.oldPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        placeholder="Enter new password"
                        type={showNewPassword ? "text" : "password"}
                        autoComplete="new-password"
                        disabled={isSubmitting}
                        {...register("newPassword", {
                          required: "New password is required",
                          minLength: {
                            value: 8,
                            message: "Password must be at least 8 characters",
                          },
                        })}
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-2.5 text-muted-foreground hover:text-primary"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <Icons.eyeOff className="h-4 w-4" />
                        ) : (
                          <Icons.eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {errors.newPassword && (
                      <p className="text-sm text-red-500">
                        {errors.newPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        placeholder="Confirm new password"
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        disabled={isSubmitting}
                        {...register("confirmPassword", {
                          required: "Please confirm your password",
                          validate: (value) =>
                            value === newPassword || "Passwords do not match",
                        })}
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-2.5 text-muted-foreground hover:text-primary"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      >
                        {showConfirmPassword ? (
                          <Icons.eyeOff className="h-4 w-4" />
                        ) : (
                          <Icons.eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-sm text-red-500">
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end mt-4">
                    <Button
                      disabled={isSubmitting}
                      type="submit"
                      className="w-auto"
                    >
                      {isSubmitting && (
                        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Change Password
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default ChangePassword;

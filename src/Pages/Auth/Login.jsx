import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import axios from "@/Config/Axios";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import PropTypes from "prop-types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/icons";
import useAuth from "@/MiddleWares/Hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const Login = ({ className, ...props }) => {
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const [disabled, setDisabled] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const onLoginAction = async (data) => {
    try {
      setDisabled(true);
      data.otp_status = "yes";

      const response = await axios.post("/auth/advanced/sessions", data, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });

      const d = response.data.data;

      // No 2FA — direct login with full token
      if (d.accessToken) {
        setAuth({
          sessionid:         d.sessionId,
          accessToken:       d.accessToken,
          roles:             d.roles,
          user:              d.user,
          fiscalYear:        d.fiscal_year,
          current_branch_id: d.current_branch_id,
          allowed_branches:  d.allowed_branches,
          otpVerified:       true,
        });
        navigate("/dashboard", { replace: true });
        return;
      }

      // 2FA required
      setAuth({
        sessionid:         d.session_id,
        otpVerified:       false,
        twoFactorMethod:   d.method   ?? "sms",
        twoFactorSetup:    d.setup    ?? null,   // null = already verified, non-null = first-time TOTP setup
        requiresTotpSetup: d.requires_2fa_setup === true,
      });
      navigate("/verify", { replace: true });
    } catch (error) {
      setDisabled(false);
      toast({
        title: "Uh oh! Something went wrong.",
        variant: "destructive",
        description: error?.response?.data?.messages || "No server response",
        action: <ToastAction altText="Try again">Try again</ToastAction>,
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex justify-center mb-2">
          <img
            src="/bank.png"
            alt="App Logo"
            className="h-16 w-auto"
          />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Login</CardTitle>
            <CardDescription className="text-center">
              Enter your email below to login to your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit(onLoginAction)}
              autoComplete="off"
              className={cn("grid gap-4", className)}
              {...props}
            >
              <div className="grid gap-2">
                <div className="grid gap-1">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    placeholder="name@example.com"
                    type="email"
                    autoComplete="off"
                    disabled={disabled}
                    {...register("username", { required: true })}
                  />
                  {errors.username && (
                    <p className="text-red-600 text-sm">Email is required</p>
                  )}
                </div>
                <div className="grid gap-1 relative">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    placeholder="********"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    disabled={disabled}
                    {...register("password", { required: true })}
                  />
                  <span
                    className="absolute right-3 top-6 cursor-pointer"
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? (
                      <Icons.eyeOff className="h-5 w-5 text-gray-500" />
                    ) : (
                      <Icons.eye className="h-5 w-5 text-gray-500" />
                    )}
                  </span>
                  {errors.password && (
                    <p className="text-red-600 text-sm">Password is required</p>
                  )}
                </div>
                <Button disabled={disabled}>
                  {disabled && (
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Sign In
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <footer className="text-center text-sm text-muted-foreground mt-4">
          &copy; {import.meta.env.VITE_APP_POWERED_BY}
          {import.meta.env.VITE_APP_COMPANY} <br />
          {new Date().getFullYear()} {" All Rights Reserved"}
        </footer>
      </div>
    </div>
  );
};

Login.propTypes = {
  className: PropTypes.string,
  props: PropTypes.object,
};

export default Login;

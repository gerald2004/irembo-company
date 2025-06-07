import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import useAuth from "@/MiddleWares/Hooks/useAuth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import PropTypes from "prop-types";
import { Icons } from "@/components/icons";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ToastAction } from "@/components/ui/toast";

import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";

import useLogout from "@/MiddleWares/Hooks/useLogout";
import AlertModal from "@/components/AlertModal";

const TwoFactorAuthentication = ({ className, ...props }) => {
  const { auth } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const FormSchema = z.object({
    pin: z.string().min(6, {
      message: "Your one-time password must be 6 characters.",
    }),
  });

  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      pin: "",
    },
  });

  const onSubmit = async (data) => {
    const requestBody = {
      sessionId: auth?.sessionid,
      code: data?.pin,
    };

    try {
      setIsLoading(true);
      const controller = new AbortController();
      await axiosPrivate.post("/auth/advanced/two-factor", requestBody, {
        signal: controller.signal,
      });

      setIsLoading(false);
      navigate("/dashboard");
    } catch (error) {
      if (!error?.response) {
        toast({
          title: "Server Network Error",
          variant: "destructive",
          description: error?.response?.data?.messages,
          action: <ToastAction altText="Try again">Resend</ToastAction>,
        });
        setIsLoading(false);
      } else {
        console.log(error?.response);
        setIsLoading(false);
        if (error?.response?.status !== 401) {
          // navigate("/", { state: { from: location }, replace: true });
          toast({
            title: "Verification Error",
            variant: "destructive",
            description: error?.response?.data?.messages,
          });
        }
      }
    }
  };

  const [resendDisabled, setResendDisabled] = useState(true);
  const [counter, setCounter] = useState(30); // Start with a 1-minute countdown
  const [attemptCount, setAttemptCount] = useState(1);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const logout = useLogout();
  const signOut = async () => {
    await logout();
    navigate("/");
  };

  useEffect(() => {
    if (resendDisabled) {
      const timer = setInterval(() => {
        setCounter((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setResendDisabled(false); // Enable resend button after countdown
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer); // Clear interval on component unmount
    }
  }, [resendDisabled]);

  const handleResend = async () => {
    if (attemptCount >= 2) {
      setShowLogoutDialog(true); // Open dialog after too many attempts
    } else {
      const requestBody = {
        sessionId: auth?.sessionid,
      };

      try {
        setIsLoading(true);
        const controller = new AbortController();
        const response = await axiosPrivate.patch(
          "/auth/advanced/two-factor",
          requestBody,
          {
            signal: controller.signal,
          }
        );

        setAttemptCount((prev) => prev + 1);
        setCounter(attemptCount * 30);
        setResendDisabled(true);
        setIsLoading(false);
        toast({
          title: "Two Factor Authentication Code",
          description: response?.data?.messages,
          action: <ToastAction altText="Try again">Resend</ToastAction>,
        });
      } catch (error) {
        if (!error?.response) {
          toast({
            title: "Server Network Error",
            variant: "destructive",
            description: error?.response?.data?.messages,
            action: <ToastAction altText="Try again">Resend</ToastAction>,
          });
          setIsLoading(false);
        } else {
          console.log(error?.response);
          setIsLoading(false);
          if (error?.response?.status !== 401) {
            // navigate("/", { state: { from: location }, replace: true });
            toast({
              title: "Verification Error",
              variant: "destructive",
              description: error?.response?.data?.messages,
            });
          }
        }
      }
    }
  };

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="container relative flex flex-col items-center justify-center h-full md:grid lg:max-w-none lg:grid-cols-0 lg:px-0">
        <div className="flex items-center justify-center w-full h-full lg:p-8">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px] px-4">
            <div className="flex flex-col items-center space-y-2 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">
                Two Factor Authentication
              </h1>
            </div>

            <div className={cn("grid gap-6", className)} {...props}>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="grid gap-2"
                >
                  <FormField
                    control={form.control}
                    name="pin"
                    render={({ field }) => (
                      <FormItem className="text-center">
                        <FormLabel>One-Time Password</FormLabel>
                        <FormControl>
                          <InputOTP maxLength={6} {...field}>
                            <InputOTPGroup className="px-10">
                              <InputOTPSlot index={0} />
                              <InputOTPSlot index={1} />
                              <InputOTPSlot index={2} />
                              <InputOTPSeparator />
                              <InputOTPSlot index={3} />
                              <InputOTPSlot index={4} />
                              <InputOTPSlot index={5} />
                            </InputOTPGroup>
                          </InputOTP>
                        </FormControl>
                        <FormDescription>
                          Please enter the one-time password sent to your phone.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button disabled={isLoading}>
                    {isLoading && (
                      <Icons.spinner className="mr-2 h-4 w-100 animate-spin" />
                    )}
                    Submit
                  </Button>
                </form>
              </Form>
              <Button
                className="ml-auto inline-block text-xs pt-0 py-0 px-2"
                onClick={handleResend}
                disabled={resendDisabled}
              >
                {resendDisabled ? `Resend in ${counter}s` : "Resend"}
              </Button>
            </div>
          </div>
        </div>
      </div>
      <AlertModal
        showDialog={showLogoutDialog}
        setShowDialog={setShowLogoutDialog}
        title={"Too Many Attempts"}
        message={
          "You have requested OTP too many times. Would you like to log out?"
        }
        method={signOut}
        buttonName={"Logout"}
        // modalSize={"725px"}
      />
    </div>
  );
};

TwoFactorAuthentication.propTypes = {
  className: PropTypes.string, // `className` should be a string
  props: PropTypes.object, // Spread props should be an object
};

export default TwoFactorAuthentication;

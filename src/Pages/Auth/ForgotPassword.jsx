
import { buttonVariants, Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import PropTypes from "prop-types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/icons";

const ForgotPassword = ({ className, ...props }) => {
  const isLoading = false;
  const onSubmit = async () => {};
  return (
    <div>
      <div className="container relative flex flex-col items-center justify-center h-screen md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        <Link
          to="/"
          className={`absolute right-4 top-4 md:right-8 md:top-8 ${buttonVariants(
            { variant: "ghost" }
          )}`}
        >
          Login
        </Link>

        <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
          <div className="absolute inset-0 bg-zinc-900" />
          <div className="relative z-20 flex items-center text-lg font-medium">
            <img src="/logo.png" className="w-[30px] h-[30px]" />
            iRembo Finance
          </div>
          <div className="relative z-20 mt-auto">
            <blockquote className="space-y-2">
              <footer className="text-sm">
                Powered by Mobitungo © {new Date().getFullYear()} Ahuriire (U)
                LTD
              </footer>
            </blockquote>
          </div>
        </div>

        <div className="flex items-center justify-center w-full h-full lg:p-8">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px] px-4">
            <div className="flex flex-col space-y-2 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">
                Recover Password
              </h1>
              <p className="text-sm text-muted-foreground">
                Enter your email to recover account
              </p>
            </div>

            <div className={cn("grid gap-6", className)} {...props}>
              <form onSubmit={onSubmit}>
                <div className="grid gap-2">
                  <div className="grid gap-1">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      placeholder="name@example.com"
                      type="email"
                      autoCapitalize="none"
                      autoComplete="email"
                      autoCorrect="off"
                      disabled={isLoading}
                    />
                  </div>

                  <Button disabled={isLoading}>
                    {isLoading && (
                      <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Submit
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
ForgotPassword.propTypes = {
  className: PropTypes.string, // `className` should be a string
  props: PropTypes.object, // Spread props should be an object
};
export default ForgotPassword
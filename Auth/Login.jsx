import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import axios from "@/Config/Axios";
import { cn } from "@/lib/utils";
import PropTypes from "prop-types";
import { Icons } from "@/components/icons";
import useAuth from "@/MiddleWares/Hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";

const Login = ({ className, ...props }) => {
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const [disabled, setDisabled] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const submittingRef = useRef(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const onLoginAction = async (data) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
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
        twoFactorSetup:    d.setup    ?? null,
        requiresTotpSetup: d.requires_2fa_setup === true,
      });
      navigate("/verify", { replace: true });
    } catch (error) {
      submittingRef.current = false;
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
    <>
      <style>{`
        @keyframes shimmer {
          0%   { transform: translateX(-100%) skewX(-20deg); }
          100% { transform: translateX(250%) skewX(-20deg); }
        }
        .btn-shimmer::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
          transform: translateX(-100%) skewX(-20deg);
          animation: shimmer 2.6s infinite;
        }
        .grid-texture {
          background-image:
            linear-gradient(rgba(96,239,255,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(96,239,255,0.06) 1px, transparent 1px);
          background-size: 44px 44px;
        }
      `}</style>

      <div className="flex min-h-screen overflow-hidden" style={{ background: "#060b18" }}>
        {/* ── ambient glow blobs ── */}
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div
            style={{
              position: "absolute",
              top: "-160px",
              left: "-160px",
              width: "620px",
              height: "620px",
              borderRadius: "9999px",
              background: "radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)",
              filter: "blur(60px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "-100px",
              right: "30%",
              width: "520px",
              height: "520px",
              borderRadius: "9999px",
              background: "radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 70%)",
              filter: "blur(60px)",
            }}
          />
        </div>

        {/* ── left: hero image ── */}
        <div className="relative hidden lg:flex lg:w-1/2 xl:w-3/5 flex-col">
          <img
            src="/login.jpeg"
            alt="Banking portal"
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* overlays */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to right, rgba(6,11,24,0.78) 0%, rgba(6,11,24,0.30) 55%, transparent 100%)",
            }}
          />
          {/* right-edge feather into form bg */}
          <div
            className="absolute inset-y-0 right-0 w-28"
            style={{
              background: "linear-gradient(to left, #060b18, transparent)",
            }}
          />

          {/* brand copy */}
          <div className="relative z-10 mt-auto p-12 pb-16 select-none">
            <div
              className="inline-flex items-center gap-2 mb-4 w-fit px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase"
              style={{
                border: "1px solid rgba(6,182,212,0.35)",
                background: "rgba(6,182,212,0.10)",
                color: "#67e8f9",
                backdropFilter: "blur(8px)",
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full animate-pulse"
                style={{ background: "#67e8f9" }}
              />
              Secure Banking Portal
            </div>
            <h1 className="text-4xl font-bold leading-tight" style={{ color: "#fff" }}>
              Next-Generation<br />Financial Platform
            </h1>
            <p className="mt-3 max-w-sm text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.52)" }}>
              Intelligent banking infrastructure built for modern institutions.
            </p>
          </div>
        </div>

        {/* ── right: form panel ── */}
        <div
          className={cn(
            "relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-12 grid-texture",
            className
          )}
          {...props}
        >
          <div className="relative w-full max-w-sm space-y-8">

            {/* logo badge */}
            <div className="flex justify-center">
              <div
                className="p-3 rounded-2xl"
                style={{
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(255,255,255,0.05)",
                  backdropFilter: "blur(14px)",
                  boxShadow: "0 0 32px rgba(6,182,212,0.08)",
                }}
              >
                <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
              </div>
            </div>

            {/* heading */}
            <div className="text-center space-y-1">
              <h2 className="text-2xl font-bold tracking-tight" style={{ color: "#fff" }}>
                Welcome back
              </h2>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.38)" }}>
                Sign in to access your dashboard
              </p>
            </div>

            {/* glass card */}
            <div
              className="rounded-2xl p-6"
              style={{
                border: "1px solid rgba(255,255,255,0.09)",
                background: "rgba(255,255,255,0.04)",
                backdropFilter: "blur(20px)",
                boxShadow: "0 0 60px rgba(6,182,212,0.06), inset 0 1px 0 rgba(255,255,255,0.06)",
              }}
            >
              <form
                onSubmit={handleSubmit(onLoginAction)}
                autoComplete="off"
                className="space-y-5"
              >
                {/* email */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="email"
                    className="block text-xs font-semibold tracking-widest uppercase"
                    style={{ color: "rgba(255,255,255,0.45)" }}
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    placeholder="name@example.com"
                    type="email"
                    autoComplete="off"
                    disabled={disabled}
                    className="w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      border: errors.username
                        ? "1px solid rgba(248,113,113,0.6)"
                        : "1px solid rgba(255,255,255,0.10)",
                      color: "#fff",
                      boxShadow: "none",
                    }}
                    onFocus={(e) => {
                      e.target.style.border = "1px solid rgba(6,182,212,0.55)";
                      e.target.style.boxShadow = "0 0 0 3px rgba(6,182,212,0.12)";
                    }}
                    onBlur={(e) => {
                      e.target.style.border = errors.username
                        ? "1px solid rgba(248,113,113,0.6)"
                        : "1px solid rgba(255,255,255,0.10)";
                      e.target.style.boxShadow = "none";
                    }}
                    {...register("username", { required: true })}
                  />
                  {errors.username && (
                    <p className="text-xs" style={{ color: "#f87171" }}>Email is required</p>
                  )}
                </div>

                {/* password */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold tracking-widest uppercase"
                    style={{ color: "rgba(255,255,255,0.45)" }}
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      placeholder="••••••••"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      disabled={disabled}
                      className="w-full rounded-xl px-4 py-2.5 pr-11 text-sm outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: errors.password
                          ? "1px solid rgba(248,113,113,0.6)"
                          : "1px solid rgba(255,255,255,0.10)",
                        color: "#fff",
                        boxShadow: "none",
                      }}
                      onFocus={(e) => {
                        e.target.style.border = "1px solid rgba(6,182,212,0.55)";
                        e.target.style.boxShadow = "0 0 0 3px rgba(6,182,212,0.12)";
                      }}
                      onBlur={(e) => {
                        e.target.style.border = errors.password
                          ? "1px solid rgba(248,113,113,0.6)"
                          : "1px solid rgba(255,255,255,0.10)";
                        e.target.style.boxShadow = "none";
                      }}
                      {...register("password", { required: true })}
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                      style={{ color: "rgba(255,255,255,0.30)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.70)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.30)")}
                    >
                      {showPassword ? (
                        <Icons.eyeOff className="h-4 w-4" />
                      ) : (
                        <Icons.eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs" style={{ color: "#f87171" }}>Password is required</p>
                  )}
                </div>

                {/* submit */}
                <button
                  type="submit"
                  disabled={disabled}
                  className="btn-shimmer relative w-full overflow-hidden rounded-xl py-2.5 text-sm font-semibold tracking-wide text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    background: "linear-gradient(135deg, #06b6d4 0%, #6366f1 100%)",
                    boxShadow: disabled
                      ? "none"
                      : "0 0 20px rgba(6,182,212,0.30), 0 4px 15px rgba(0,0,0,0.3)",
                  }}
                  onMouseEnter={(e) => {
                    if (!disabled) {
                      e.currentTarget.style.boxShadow =
                        "0 0 32px rgba(6,182,212,0.50), 0 4px 20px rgba(0,0,0,0.4)";
                      e.currentTarget.style.transform = "scale(1.01)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow =
                      "0 0 20px rgba(6,182,212,0.30), 0 4px 15px rgba(0,0,0,0.3)";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {disabled && <Icons.spinner className="h-4 w-4 animate-spin" />}
                    Sign In
                  </span>
                </button>
              </form>
            </div>

            {/* footer */}
            <p className="text-center text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.22)" }}>
              &copy; {import.meta.env.VITE_APP_POWERED_BY}
              {import.meta.env.VITE_APP_COMPANY}
              {" · "}
              {new Date().getFullYear()} All Rights Reserved
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

Login.propTypes = {
  className: PropTypes.string,
  props: PropTypes.object,
};

export default Login;

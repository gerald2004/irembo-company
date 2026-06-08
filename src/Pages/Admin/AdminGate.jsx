import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Eye, EyeOff, Loader2, KeyRound, Mail, MessageSquare, Smartphone } from "lucide-react";
import adminAxios from "@/Config/AdminAxios";
import useAdminAuth from "@/MiddleWares/Hooks/useAdminAuth";

const METHOD_LABELS = {
  sms:   { icon: MessageSquare, label: "SMS", hint: "Enter the 6-digit code sent to your phone." },
  email: { icon: Mail,          label: "Email", hint: "Enter the 6-digit code sent to your email." },
  totp:  { icon: Smartphone,    label: "Authenticator", hint: "Enter the 6-digit code from your authenticator app." },
};

export default function AdminGate() {
  const navigate = useNavigate();
  const { setAdminAuth } = useAdminAuth();

  // Login phase
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [show,     setShow]     = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  // 2FA phase
  const [twoFa,    setTwoFa]    = useState(null); // { session_id, method }
  const [code,     setCode]     = useState("");
  const [verifying, setVerifying] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setError("");
    setLoading(true);

    try {
      const res = await adminAxios.post("/admin/auth/login", {
        admin_email: email.trim().toLowerCase(),
        admin_password: password,
      });
      const data = res.data?.data ?? {};
      if (data.requires_2fa) {
        setTwoFa({ session_id: data.session_id, method: data.method ?? "email" });
        setCode("");
        setError("");
      } else {
        setAdminAuth({ accessToken: data.accessToken, admin: data.admin });
        navigate("/admin/dashboard", { replace: true });
      }
    } catch (err) {
      const msg = err?.response?.data?.messages;
      setError(
        err?.response?.status === 401 ? "Invalid email or password." :
        err?.response?.status === 403 ? "Account is inactive. Contact a system administrator." :
        Array.isArray(msg) ? msg.join(", ") : (msg ?? "Could not connect to server.")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setError("");
    setVerifying(true);
    try {
      const res = await adminAxios.post("/admin/auth/verify-2fa", {
        session_id: twoFa.session_id,
        code: code.trim(),
      });
      const data = res.data?.data ?? {};
      setAdminAuth({ accessToken: data.accessToken, admin: data.admin });
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.messages;
      setError(
        err?.response?.status === 422 ? "Invalid verification code. Please try again." :
        err?.response?.status === 401 ? "Session expired. Please log in again." :
        Array.isArray(msg) ? msg.join(", ") : (msg ?? "Verification failed.")
      );
      if (err?.response?.status === 401) {
        setTwoFa(null);
      }
    } finally {
      setVerifying(false);
    }
  };

  const methodInfo = twoFa ? (METHOD_LABELS[twoFa.method] ?? METHOD_LABELS.email) : null;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-8">

          <div className="flex justify-center mb-6">
            <div className="p-3 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              {twoFa
                ? <KeyRound className="w-7 h-7 text-indigo-500 dark:text-indigo-400" />
                : <ShieldCheck className="w-7 h-7 text-gray-700 dark:text-gray-300" />
              }
            </div>
          </div>

          <div className="text-center mb-7">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {twoFa ? "Two-Factor Auth" : "iRembo MIS Admin Login"}
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              {twoFa
                ? methodInfo?.hint
                : "Core Banking System — Admin Portal"
              }
            </p>
          </div>

          {twoFa ? (
            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  Verification Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  autoComplete="one-time-code"
                  autoFocus
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-center font-mono tracking-widest text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={verifying || code.length < 6}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 mt-2"
              >
                {verifying && <Loader2 className="w-4 h-4 animate-spin" />}
                {verifying ? "Verifying…" : "Verify"}
              </button>

              <button
                type="button"
                onClick={() => { setTwoFa(null); setCode(""); setError(""); }}
                className="w-full text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-center py-1 transition-colors"
              >
                ← Back to login
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin"
                  autoComplete="username"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={show ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 focus:border-transparent transition pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !email.trim() || !password}
                className="w-full bg-gray-900 hover:bg-gray-700 dark:bg-gray-100 dark:hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-white dark:text-gray-900 font-medium py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 mt-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? "Signing in…" : "Sign In"}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-gray-500 mt-5">
          This portal is for system administrators only.
        </p>
      </div>
    </div>
  );
}

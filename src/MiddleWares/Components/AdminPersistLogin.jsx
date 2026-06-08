import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import adminAxios from "@/Config/AdminAxios";
import useAdminAuth from "@/MiddleWares/Hooks/useAdminAuth";

// Module-level singleton — survives React 18 Strict Mode's double-mount so only
// one token-rotation request is ever in flight at a time.
let _refreshPromise = null;

export default function AdminPersistLogin() {
  const { adminAuth, setAdminAuth } = useAdminAuth();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (adminAuth?.accessToken) { setChecking(false); return; }

    let mounted = true;

    if (!_refreshPromise) {
      _refreshPromise = adminAxios.post("/admin/auth/refresh")
        .finally(() => { _refreshPromise = null; });
    }

    _refreshPromise
      .then((res) => {
        if (!mounted) return;
        const { accessToken, admin } = res.data?.data ?? {};
        if (accessToken) setAdminAuth({ accessToken, admin });
      })
      .catch(() => { if (mounted) setAdminAuth({}); })
      .finally(() => { if (mounted) setChecking(false); });

    return () => { mounted = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (checking) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-white dark:bg-gray-950">
        <Loader2 className="animate-spin h-10 w-10 text-indigo-500 dark:text-indigo-400" />
      </div>
    );
  }

  return <Outlet />;
}

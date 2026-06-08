import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import useRefreshToken from "@/MiddleWares/Hooks/useRefreshToken";
import useAuth from "@/MiddleWares/Hooks/useAuth";
import { Loader2 } from "lucide-react";

const PersistLogin = () => {
  const [isLoading, setIsLoading] = useState(true);
  const refresh = useRefreshToken();
  const { auth, setAuth } = useAuth();

  useEffect(() => {
    let isMounted = true;

    const verifyRefreshToken = async () => {
      try {
        await refresh();
      } catch {
        // Refresh token missing or expired — ensure auth is cleared so
        // RequireAuth redirects to login instead of leaving a blank page.
        if (isMounted) setAuth({});
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    if (!auth?.accessToken) {
      verifyRefreshToken();
    } else {
      setIsLoading(false);
    }

    return () => (isMounted = false);
  }, [auth?.accessToken, refresh, setAuth]);

  return isLoading ? (
    <div className="flex items-center justify-center w-full h-[100vh]">
      <Loader2 className="animate-spin h-12 w-12 text-muted-foreground" />
    </div>
  ) : (
    <Outlet />
  );
};

export default PersistLogin;

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import adminAxios from "@/Config/AdminAxios";
import useAdminAuth from "./useAdminAuth";
import { getDeviceFingerprint } from "@/lib/deviceFingerprint";
import { toast } from "@/hooks/use-toast";

const useAdminAxios = () => {
  const { adminAuth, setAdminAuth } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const reqIntercept = adminAxios.interceptors.request.use(
      (config) => {
        if (!config.headers["Authorization"]) {
          config.headers["Authorization"] = `Bearer ${adminAuth?.accessToken}`;
        }
        if (["post", "put", "patch"].includes(config.method?.toLowerCase()) &&
            !config.headers["X-Idempotency-Key"]) {
          config.headers["X-Idempotency-Key"] = crypto.randomUUID();
        }
        const fp = getDeviceFingerprint();
        if (fp) config.headers["X-Device-Fingerprint"] = fp;
        return config;
      },
      (err) => Promise.reject(err)
    );

    const resIntercept = adminAxios.interceptors.response.use(
      (res) => res,
      async (err) => {
        const prev = err?.config;
        if (err?.response?.status === 401 && !prev?.sent) {
          prev.sent = true;
          try {
            const res = await adminAxios.post("/admin/auth/refresh");
            const { accessToken, admin } = res.data?.data ?? {};
            setAdminAuth({ accessToken, admin });
            prev.headers["Authorization"] = `Bearer ${accessToken}`;
            return adminAxios(prev);
          } catch {
            // Admin refresh token expired — force back to admin login
            setAdminAuth({});
            toast({
              title: "Session Expired",
              description: "Your admin session has expired. Please log in again.",
              variant: "destructive",
            });
            navigate("/admin", { replace: true });
          }
        }
        return Promise.reject(err);
      }
    );

    return () => {
      adminAxios.interceptors.request.eject(reqIntercept);
      adminAxios.interceptors.response.eject(resIntercept);
    };
  }, [adminAuth, setAdminAuth, navigate]);

  return adminAxios;
};

export default useAdminAxios;

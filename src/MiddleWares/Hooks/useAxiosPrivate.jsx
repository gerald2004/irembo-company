import { axiosPrivate } from "@/Config/Axios";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useRefreshToken from "./useRefreshToken";
import useAuth from "./useAuth";
import { getDeviceFingerprint } from "@/lib/deviceFingerprint";

// Module-level: ensures only one refresh is in-flight at a time.
// Multiple concurrent 401s share the same promise instead of each
// triggering a separate refresh call (which would rotate the token
// out from under the others and cause an immediate logout).
let _refreshPromise = null;

const useAxiosPrivate = () => {
  const refresh   = useRefreshToken();
  const { auth, setAuth } = useAuth();
  const navigate  = useNavigate();

  useEffect(() => {
    const requestIntercept = axiosPrivate.interceptors.request.use(
      (config) => {
        if (!config.headers["Authorization"]) {
          config.headers["Authorization"] = `Bearer ${auth?.accessToken}`;
        }
        if (["post", "put", "patch"].includes(config.method?.toLowerCase()) &&
            !config.headers["X-Idempotency-Key"]) {
          config.headers["X-Idempotency-Key"] = crypto.randomUUID();
        }
        const fp = getDeviceFingerprint();
        if (fp) config.headers["X-Device-Fingerprint"] = fp;
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseIntercept = axiosPrivate.interceptors.response.use(
      (response) => response,
      async (error) => {
        const prevRequest = error?.config;
        if (error?.response?.status === 401 && !prevRequest?._retry) {
          prevRequest._retry = true;
          try {
            if (!_refreshPromise) {
              _refreshPromise = refresh().finally(() => {
                _refreshPromise = null;
              });
            }
            const newAccessToken = await _refreshPromise;
            prevRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
            return axiosPrivate(prevRequest);
          } catch (refreshError) {
            _refreshPromise = null;
            setAuth({});
            const serverMsg = refreshError?.response?.data?.messages?.[0];
            navigate("/", {
              replace: true,
              state: { sessionExpired: true, sessionMessage: serverMsg ?? null },
            });
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axiosPrivate.interceptors.request.eject(requestIntercept);
      axiosPrivate.interceptors.response.eject(responseIntercept);
    };
  }, [auth, refresh, navigate, setAuth]);

  return axiosPrivate;
};

export default useAxiosPrivate;

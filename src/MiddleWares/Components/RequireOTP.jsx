import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "@/MiddleWares/Hooks/useAuth";

const RequireOTP = () => {
  const { auth } = useAuth();
  const location = useLocation();

  return auth?.otpVerified ? (
    <Outlet />
  ) : (
    <Navigate to="/verify" state={{ from: location }} replace />
  );
};

export default RequireOTP;

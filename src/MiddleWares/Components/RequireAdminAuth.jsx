import { Navigate, Outlet } from "react-router-dom";
import useAdminAuth from "@/MiddleWares/Hooks/useAdminAuth";

export default function RequireAdminAuth() {
  const { adminAuth } = useAdminAuth();
  if (!adminAuth?.accessToken) return <Navigate to="/admin" replace />;
  return <Outlet />;
}

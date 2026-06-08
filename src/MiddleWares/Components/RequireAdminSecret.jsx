import { Navigate, Outlet } from "react-router-dom";

// Guards admin routes — redirects to gate if secret is missing from sessionStorage
export default function RequireAdminSecret() {
  const secret = sessionStorage.getItem("admin_secret");
  if (!secret) return <Navigate to="/admin" replace />;
  return <Outlet />;
}

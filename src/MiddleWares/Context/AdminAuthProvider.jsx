/* eslint-disable react/prop-types */
import { createContext, useState, useCallback } from "react";
import adminAxios from "@/Config/AdminAxios";

const AdminAuthContext = createContext({});

export const AdminAuthProvider = ({ children }) => {
  const [adminAuth, setAdminAuth] = useState({});
  // adminAuth shape: { accessToken, admin: { admin_user_id, admin_role, ... } }

  const logout = useCallback(async () => {
    try {
      await adminAxios.delete("/admin/auth/logout", {
        headers: { Authorization: `Bearer ${adminAuth.accessToken}` },
      });
    } catch (_) { /* ignore — clear state regardless */ }
    setAdminAuth({});
  }, [adminAuth.accessToken]);

  return (
    <AdminAuthContext.Provider value={{ adminAuth, setAdminAuth, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export default AdminAuthContext;

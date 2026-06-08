import { Routes, Route } from "react-router-dom";
import Layout from "@/Layouts/Layout";
import AuthLayout from "@/Layouts/AuthLayout";
import AdminLayout from "@/Layouts/AdminLayout";
import PersistLogin from "@/MiddleWares/Components/PersistLogin";
import AdminPersistLogin from "@/MiddleWares/Components/AdminPersistLogin";
import RequireAuth from "@/MiddleWares/Components/RequireAuth";
import RequireAdminAuth from "@/MiddleWares/Components/RequireAdminAuth";
import RequireOTP from "@/MiddleWares/Components/RequireOTP";
import Missing from "@/Pages/Others/Missing";
import AdminGate from "@/Pages/Admin/AdminGate";
import AdminDashboard from "@/Pages/Admin/AdminDashboard";
import AdminSaccos from "@/Pages/Admin/AdminSaccos";
import AdminOnboarding from "@/Pages/Admin/AdminOnboarding";
import AdminUsers from "@/Pages/Admin/AdminUsers";
import AdminContracts from "@/Pages/Admin/AdminContracts";
import AdminFloats from "@/Pages/Admin/AdminFloats";
import AdminSystemSettings from "@/Pages/Admin/AdminSystemSettings";
import AdminPerformance from "@/Pages/Admin/AdminPerformance";
import AdminAccount from "@/Pages/Admin/AdminAccount";

// 📦 Route imports
import publicRoutes from "./routes/publicRoutes";
import clientRoutes from "./routes/clientRoutes";
import loansRoutes from "./routes/loansRoutes";
import transactionRoutes from "./routes/transactionRoutes";
import accountingRoutes from "./routes/accountingRoutes";
import reportsRoutes from "./routes/reportsRoutes";
import hrRoutes from "./routes/hrRoutes";
import settingsRoutes from "./routes/settingsRoutes";
import bulkRoutes from "./routes/bulkRoutes";
import floatRoutes from "./routes/floatRoutes";
import dashBoardRoutes from "./routes/dashBoardRoutes";
import profileRoutes from "./routes/profileRoutes";
import externalTransactionsRoutes from "./routes/externalTransactionsRoutes";
import amlRoutes from "./routes/amlRoutes";
import qmsRoutes from "./routes/qmsRoutes";

const protectedRoutes = [
  ...clientRoutes,
  ...loansRoutes,
  ...transactionRoutes,
  ...accountingRoutes,
  ...hrRoutes,
  ...reportsRoutes,
  ...settingsRoutes,
  ...bulkRoutes,
  ...floatRoutes,
  ...externalTransactionsRoutes,
  ...amlRoutes,
  ...qmsRoutes,
];

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route element={<Layout />}>
        {publicRoutes.map(({ path, element }, i) => (
          <Route key={i} path={path} element={element} />
        ))}
      </Route>

      {/* Main app — SACCO staff auth */}
      <Route element={<PersistLogin />}>
        <Route element={<RequireAuth allowedRoles={[100001]} />}>
          <Route element={<AuthLayout />}>
            <Route element={<RequireOTP />}>
              {profileRoutes.map(({ path, element }, i) => (
                <Route key={i} path={path} element={element} />
              ))}
              {dashBoardRoutes.map(({ path, element }, i) => (
                <Route key={i} path={path} element={element} />
              ))}
            </Route>
          </Route>
        </Route>

        <Route element={<Layout />}>
          <Route element={<AuthLayout />}>
            <Route element={<RequireOTP />}>
              {protectedRoutes.map(({ path, element, roles }, i) => (
                <Route element={<RequireAuth allowedRoles={roles} />} key={i}>
                  <Route path={path} element={element} />
                </Route>
              ))}
            </Route>
          </Route>
        </Route>
      </Route>

      {/* ──  Admin CRM — JWT cookie auth ───────────────────────── */}
      <Route path="/admin" element={<AdminGate />} />
      <Route element={<AdminPersistLogin />}>
        <Route element={<RequireAdminAuth />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard"        element={<AdminDashboard />} />
            <Route path="/admin/saccos"           element={<AdminSaccos />} />
            <Route path="/admin/saccos/:id"       element={<AdminSaccos />} />
            <Route path="/admin/contracts"        element={<AdminContracts />} />
            <Route path="/admin/floats"           element={<AdminFloats />} />
            <Route path="/admin/onboard"          element={<AdminOnboarding />} />
            <Route path="/admin/users"            element={<AdminUsers />} />
            <Route path="/admin/system-settings"  element={<AdminSystemSettings />} />
            <Route path="/admin/performance"      element={<AdminPerformance />} />
            <Route path="/admin/account"          element={<AdminAccount />} />
          </Route>
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<Missing />} />
    </Routes>
  );
};

export default AppRoutes;

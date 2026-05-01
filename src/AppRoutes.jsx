import { Routes, Route } from "react-router-dom";
import Layout from "@/Layouts/Layout";
import AuthLayout from "@/Layouts/AuthLayout";
import PersistLogin from "@/MiddleWares/Components/PersistLogin";
import RequireAuth from "@/MiddleWares/Components/RequireAuth";
import RequireOTP from "@/MiddleWares/Components/RequireOTP";
import Missing from "@/Pages/Others/Missing";

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
import dashBoardRoutes from "./routes/dashBoardRoutes"; // verify & dashboard
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
      {/* Public routes origanised */}
      <Route element={<Layout />}>
        {publicRoutes.map(({ path, element }, i) => (
          <Route key={i} path={path} element={element} />
        ))}
      </Route>

      {/* Auth-only routes */}
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

        {/* Main protected business routes under Layout */}
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

      {/* 404 */}
      <Route path="*" element={<Missing />} />
    </Routes>
  );
};

export default AppRoutes;

// routes/publicRoutes.js
import Login from "@/Pages/Auth/Login";
import ForgotPassword from "@/Pages/Auth/ForgotPassword";
import Unauthorized from "@/Pages/Others/Unauthorized";
import TwoFactorAuthentication from "@/Pages/Auth/TwoFactorAuthentication";

const publicRoutes = [
  { path: "/", element: <Login /> },
  { path: "/forgot-password", element: <ForgotPassword /> },
  { path: "/unauthorized", element: <Unauthorized /> },
  { path: "/verify", element: <TwoFactorAuthentication /> },
];

export default publicRoutes;

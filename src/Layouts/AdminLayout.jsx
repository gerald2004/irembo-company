import { Outlet, NavLink } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Building2, PlusCircle, LogOut,
  ShieldCheck, Users, Wallet, FileText, Sun, Moon,
  Settings, BarChart3, UserCircle,
} from "lucide-react";
import { useState } from "react";
import useAdminAuth from "@/MiddleWares/Hooks/useAdminAuth";
import adminAxios from "@/Config/AdminAxios";
import { useTheme } from "@/components/theme-provider";
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export default function AdminLayout() {
  const navigate = useNavigate();
  const { adminAuth, setAdminAuth } = useAdminAuth();
  const admin = adminAuth?.admin ?? {};
  const isGeneral = admin.admin_role === "general_admin";
  const [loggingOut, setLoggingOut] = useState(false);
  const { setTheme } = useTheme();

  const NAV_MAIN = [
    { to: "/admin/dashboard", label: "Dashboard",  icon: LayoutDashboard },
    { to: "/admin/saccos",    label: "SACCOs",     icon: Building2 },
    { to: "/admin/contracts", label: "Contracts",  icon: FileText },
    { to: "/admin/floats",    label: "Floats",     icon: Wallet },
    { to: "/admin/onboard",   label: "Onboarding", icon: PlusCircle },
  ];

  const NAV_SYSTEM = isGeneral ? [
    { to: "/admin/performance",      label: "Performance",    icon: BarChart3 },
    { to: "/admin/system-settings",  label: "System",         icon: Settings },
    { to: "/admin/users",            label: "Admin Users",    icon: Users },
  ] : [];

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await adminAxios.delete("/admin/auth/logout", {
        headers: { Authorization: `Bearer ${adminAuth.accessToken}` },
      });
    } catch (_) { /* ignore */ }
    setAdminAuth({});
    navigate("/admin", { replace: true });
  };

  return (
    <div className="flex h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 flex flex-col border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
        {/* Brand */}
        <div className="px-5 py-5 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
            <div>
              <p className="text-sm font-bold text-gray-900 dark:text-white">iRembo MIS</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">Core Banking</p>
            </div>
          </div>
        </div>

        {/* Admin info */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
            {admin.admin_firstname} {admin.admin_lastname}
          </p>
          <p className="text-[10px] text-indigo-500 dark:text-indigo-400 capitalize mt-0.5">
            {admin.admin_role?.replace("_", " ")}
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV_MAIN.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? "bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white font-medium"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                }`
              }>
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}

          {NAV_SYSTEM.length > 0 && (
            <>
              <div className="pt-4 pb-1 px-3">
                <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-widest">System</p>
              </div>
              {NAV_SYSTEM.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                      isActive
                        ? "bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white font-medium"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`
                  }>
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        {/* Account link */}
        <div className="px-3 pb-2 border-t border-gray-200 dark:border-gray-800 pt-2">
          <NavLink to="/admin/account"
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? "bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white font-medium"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
              }`
            }>
            <UserCircle className="w-4 h-4 shrink-0" />
            My Account
          </NavLink>
        </div>

        {/* Theme toggle + Logout */}
        <div className="px-3 py-4 border-t border-gray-200 dark:border-gray-800 space-y-0.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2.5 px-3 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span>Theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top">
              <DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>System</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-md text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {loggingOut ? "Signing out…" : "Sign Out"}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-white dark:bg-gray-950">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

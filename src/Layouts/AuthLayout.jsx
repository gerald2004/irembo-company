import { Link, Outlet } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Moon, Sun, Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/components/theme-provider";
import { Separator } from "@/components/ui/separator";
import useAuth from "@/MiddleWares/Hooks/useAuth";
import useLogout from "@/MiddleWares/Hooks/useLogout";
import { useNavigate } from "react-router-dom";

import AlertModal from "@/components/AlertModal";
import LoanCalculatorDialog from "@/Pages/Components/LoanCalculatorDialog";
import { hasPermission } from "@/lib/utils";

const AuthLayout = () => {
  const [notifications, setNotifications] = useState(0);
  const { setTheme } = useTheme();
  const { auth } = useAuth();
  const initials = `${auth?.user?.firstname?.[0] || ""}${
    auth?.user?.lastname?.[0] || ""
  }`.toUpperCase();
  const logout = useLogout();
  const navigate = useNavigate();
  const signOut = async () => {
    await logout();
    navigate("/");
  };
  useEffect(() => {
    setNotifications(0);
  }, []);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const roles = auth?.roles;
  return (
    <div className="flex flex-col">
      <SidebarProvider>
        <div className="flex flex-col lg:flex-row w-full">
          <div className="hidden lg:block fixed top-0 w-64 h-full"></div>
          <AppSidebar />

          <SidebarTrigger className="w-12 h-12 p-2 text-xl" />
          <div className="lg:hidden"></div>

          <div className="flex-grow">
            <div className="sticky top-0 bg-background z-10 flex items-center justify-between p-4">
              <Menubar className="hidden md:flex">
                {hasPermission(roles, [100007, 100011, 100015, 100012]) && (
                  <>
                    <MenubarMenu>
                      <MenubarTrigger>Clients</MenubarTrigger>
                      <MenubarContent>
                        {hasPermission(roles, 100007) && (
                          <MenubarItem>
                            <Link to="clients/individual/new">
                              New Individual
                            </Link>
                            <MenubarShortcut></MenubarShortcut>
                          </MenubarItem>
                        )}
                        {hasPermission(roles, 100012) && (
                          <MenubarItem>
                            <Link to="clients/group/new">New Group</Link>
                            <MenubarShortcut></MenubarShortcut>
                          </MenubarItem>
                        )}
                        {hasPermission(roles, [100011, 100015]) && (
                          <MenubarItem>
                            <Link to="clients">View Clients</Link>
                          </MenubarItem>
                        )}
                      </MenubarContent>
                    </MenubarMenu>
                    <Separator orientation="vertical" />
                  </>
                )}

                {hasPermission(roles, 100099) && (
                  <>
                    <MenubarMenu>
                      <MenubarTrigger>Savings</MenubarTrigger>
                      <MenubarContent>
                        {hasPermission(roles, 100099) && (
                          <MenubarItem>
                            <Link to="savings">View Savings</Link>
                          </MenubarItem>
                        )}
                      </MenubarContent>
                    </MenubarMenu>
                    <Separator orientation="vertical" />
                  </>
                )}
                {hasPermission(roles, 100100) && (
                  <>
                    <MenubarMenu>
                      <MenubarTrigger>Withdraws</MenubarTrigger>
                      <MenubarContent>
                        {hasPermission(roles, 100100) && (
                          <MenubarItem>
                            <Link to="withdraws">View Withdraws</Link>
                          </MenubarItem>
                        )}
                      </MenubarContent>
                    </MenubarMenu>
                    <Separator orientation="vertical" />
                  </>
                )}
                {hasPermission(roles, [100151, 100067]) && (
                  <>
                    <MenubarMenu>
                      <MenubarTrigger>Loans</MenubarTrigger>
                      <MenubarContent>
                        {hasPermission(roles, 100067) && (
                          <MenubarItem>
                            <Link to="individual-loans">View Loans</Link>
                          </MenubarItem>
                        )}
                        {hasPermission(roles, 100151) && (
                          <MenubarItem onClick={() => setShowCalculator(true)}>
                            Loan Calculator
                          </MenubarItem>
                        )}
                      </MenubarContent>
                    </MenubarMenu>
                    <Separator orientation="vertical" />
                  </>
                )}
                {hasPermission(roles, 100125) && (
                  <MenubarMenu>
                    <MenubarTrigger>Bulk Studio</MenubarTrigger>
                    <MenubarContent>
                      <MenubarItem>Bulk Client Registration</MenubarItem>
                      <MenubarItem>Bulk Group Registration</MenubarItem>
                      <MenubarItem>Bulk Savings</MenubarItem>
                      <MenubarItem>Bulk Withdraws</MenubarItem>
                      <MenubarItem>Bulk Transfers</MenubarItem>
                      <MenubarItem>Bulk Loan Applications</MenubarItem>
                      <MenubarItem>Bulk Shares</MenubarItem>
                      <MenubarItem>Bulk SMS Alerts</MenubarItem>
                      <MenubarItem>Bulk Email Alerts</MenubarItem>
                    </MenubarContent>
                  </MenubarMenu>
                )}
              </Menubar>
              <div className="hidden md:flex items-center space-x-4">
                <div>
                  <Input
                    type="search"
                    placeholder="Search..."
                    className="md:w-[100px] lg:w-[200px]"
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                      <span className="sr-only">Toggle theme</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setTheme("light")}>
                      Light
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("dark")}>
                      Dark
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("system")}>
                      System
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <div className="relative">
                  <Bell className="w-6 h-7 cursor-pointer" />
                  {notifications > 0 && (
                    <span
                      className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full"
                      style={{ fontSize: "8px" }}
                    >
                      {notifications}
                    </span>
                  )}
                </div>

                <Menubar>
                  <MenubarMenu>
                    <MenubarTrigger asChild>
                      <Avatar className="cursor-pointer h-9 w-9">
                        <AvatarImage src="#" alt={initials} />
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                    </MenubarTrigger>
                    <MenubarContent align="end">
                      <MenubarItem>
                        <Link to="/profile">Profile</Link>
                      </MenubarItem>
                      <MenubarItem>
                        <Link to="/change-password">Change Password</Link>
                      </MenubarItem>
                      <MenubarSeparator />
                      <MenubarItem>
                        <Link onClick={() => setShowLogoutDialog(true)}>
                          Logout
                        </Link>
                      </MenubarItem>
                    </MenubarContent>
                  </MenubarMenu>
                </Menubar>
              </div>
            </div>

            <div className="p-6">
              <Outlet />

              {showLogoutDialog && (
                <AlertModal
                  showDialog={showLogoutDialog}
                  setShowDialog={setShowLogoutDialog}
                  title="Logout"
                  message="Would you like to log out?"
                  method={signOut}
                  buttonName="Logout"
                  // modalSize="325px"
                />
              )}
              {showCalculator && (
                <LoanCalculatorDialog
                  isOpen={showCalculator}
                  onClose={() => setShowCalculator(false)}
                />
              )}
            </div>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
};

export default AuthLayout;

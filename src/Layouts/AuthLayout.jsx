import { Link, Outlet, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";

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
import AlertModal from "@/components/AlertModal";
import LoanCalculatorDialog from "@/Pages/Components/LoanCalculatorDialog";
import { hasPermission } from "@/lib/utils";

const AuthLayout = () => {
  const [notifications, setNotifications] = useState(0);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [notificationItems, setNotificationItems] = useState([]);

  const { setTheme } = useTheme();
  const { auth } = useAuth();
  const roles = auth?.roles;
  const initials = `${auth?.user?.firstname?.[0] || ""}${
    auth?.user?.lastname?.[0] || ""
  }`.toUpperCase();

  const logout = useLogout();
  const navigate = useNavigate();
  const signOut = async () => {
    await logout();
    navigate("/");
  };
  const axiosPrivate = useAxiosPrivate();
  const {
    data: notificationsData,
    isFetching: isFetchingNotifications,
    refetch: refetchNotifications,
  } = useQuery({
    queryKey: ["system-notifications"],
    queryFn: async () => {
      const controller = new AbortController();
      const res = await axiosPrivate.get(
        "/notifications/system?status=unread&limit=5",
        { signal: controller.signal }
      );
      return (
        res?.data?.data ?? {
          unread_count: 0,
          notifications: [],
        }
      );
    },
    refetchInterval: 30000, // poll every 30s
  });

  useEffect(() => {
    if (notificationsData) {
      setNotifications(notificationsData.unread_count || 0);
      setNotificationItems(notificationsData.notifications || []);
    }
  }, [notificationsData]);
const markNotificationRead = async (n) => {
  try {
    await axiosPrivate.post(
      "/notifications/system",
      new URLSearchParams({
        action: "read_one",
        id: String(n.id),
      })
    );

    // optimistic update
    setNotificationItems((prev) => prev.filter((x) => x.id !== n.id));
    setNotifications((prev) => Math.max(0, prev - 1));

    // optional deep link
    if (n.entity_type === "loan") {
      navigate(`/individual-loans/${n.entity_id}`);
    }
  } catch (err) {
    console.error("Failed to mark notification read", err);
  }
};
const markAllNotificationsRead = async () => {
  try {
    await axiosPrivate.post(
      "/notifications/system",
      new URLSearchParams({ action: "read_all" })
    );

    setNotificationItems([]);
    setNotifications(0);
  } catch (err) {
    console.error("Failed to mark all notifications read", err);
  }
};

  return (
    <SidebarProvider>
      {/* Lock viewport height; route scrolling to <main> only */}
      <div className="h-screen w-full overflow-hidden bg-background">
        {/* Make sidebar FIXED on lg+ so it doesn’t take layout space */}
        <div className="lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:w-64">
          <AppSidebar />
        </div>

        {/* Content column; offset for fixed sidebar on lg */}
        <div className="relative h-full flex flex-col min-w-0 lg:pl-64">
          {/* Header (compact & sticky) */}
          <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75 border-b">
            <div className="flex items-center justify-between px-3 md:px-4 lg:px-5 h-12">
              <div className="flex items-center gap-2 min-w-0">
                {/* Mobile: open sidebar drawer */}
                <SidebarTrigger
                  className="md:hidden w-9 h-9 p-2"
                  aria-label="Open sidebar"
                />

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
                              <MenubarShortcut />
                            </MenubarItem>
                          )}
                          {hasPermission(roles, 100012) && (
                            <MenubarItem>
                              <Link to="clients/group/new">New Group</Link>
                              <MenubarShortcut />
                            </MenubarItem>
                          )}
                          {hasPermission(roles, [100011, 100015]) && (
                            <MenubarItem>
                              <Link to="clients">View Clients</Link>
                            </MenubarItem>
                          )}
                        </MenubarContent>
                      </MenubarMenu>
                    </>
                  )}

                  {hasPermission(roles, 100099) && (
                    <>
                      <Separator orientation="vertical" />
                      <MenubarMenu>
                        <MenubarTrigger>Savings</MenubarTrigger>
                        <MenubarContent>
                          <MenubarItem>
                            <Link to="savings">View Savings</Link>
                          </MenubarItem>
                        </MenubarContent>
                      </MenubarMenu>
                    </>
                  )}

                  {hasPermission(roles, 100100) && (
                    <>
                      <Separator orientation="vertical" />
                      <MenubarMenu>
                        <MenubarTrigger>Withdraws</MenubarTrigger>
                        <MenubarContent>
                          <MenubarItem>
                            <Link to="withdraws">View Withdraws</Link>
                          </MenubarItem>
                        </MenubarContent>
                      </MenubarMenu>
                    </>
                  )}

                  {hasPermission(roles, [100151, 100067]) && (
                    <>
                      <Separator orientation="vertical" />
                      <MenubarMenu>
                        <MenubarTrigger>Loans</MenubarTrigger>
                        <MenubarContent>
                          {hasPermission(roles, 100067) && (
                            <MenubarItem>
                              <Link to="individual-loans">View Loans</Link>
                            </MenubarItem>
                          )}
                          {hasPermission(roles, 100151) && (
                            <MenubarItem
                              onClick={() => setShowCalculator(true)}
                            >
                              Loan Calculator
                            </MenubarItem>
                          )}
                        </MenubarContent>
                      </MenubarMenu>
                    </>
                  )}

                  {hasPermission(roles, 100125) && (
                    <>
                      <Separator orientation="vertical" />
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
                    </>
                  )}
                </Menubar>
              </div>

              <div className="hidden md:flex items-center space-x-3">
                <div className="min-w-0">
                  <Input
                    type="search"
                    placeholder="Search..."
                    className="w-[160px] lg:w-[220px]"
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

                <DropdownMenu
                  onOpenChange={(open) => open && refetchNotifications()}
                >
                  <DropdownMenuTrigger asChild>
                    <Button
                      className="relative cursor-pointer"
                      variant="outline"
                      size="icon"
                    >
                      <Bell className="w-6 h-7" />
                      {notifications > 0 && (
                        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold text-white bg-red-600 rounded-full">
                          {notifications}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-80">
                    <div className="px-3 py-2 text-sm font-semibold">
                      Notifications
                    </div>
                    <Separator />

                    {isFetchingNotifications && (
                      <div className="px-3 py-3 text-sm text-muted-foreground">
                        Loading…
                      </div>
                    )}

                    {!isFetchingNotifications &&
                      notificationItems.length === 0 && (
                        <div className="px-3 py-3 text-sm text-muted-foreground">
                          No new notifications
                        </div>
                      )}

                    {notificationItems.map((n) => (
                      <DropdownMenuItem
                        key={n.id}
                        className="flex flex-col items-start gap-1 cursor-pointer"
                        onClick={() => markNotificationRead(n)}
                      >
                        <span
                          className={`text-sm font-medium ${
                            n.level === "critical"
                              ? "text-red-600"
                              : n.level === "warning"
                              ? "text-orange-600"
                              : n.level === "success"
                              ? "text-green-600"
                              : "text-blue-600"
                          }`}
                        >
                          {n.title}
                        </span>
                        <span className="text-xs text-muted-foreground line-clamp-2">
                          {n.message}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {n.created_at}
                        </span>
                      </DropdownMenuItem>
                    ))}

                    {notificationItems.length > 0 && (
                      <>
                        <Separator />
                        <DropdownMenuItem
                          onClick={markAllNotificationsRead}
                          className="justify-center text-sm"
                        >
                          Mark all as read
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

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
          </header>

          {/* MAIN: takes remaining height; internal scrolling only */}
          <main className="flex-1 min-h-0 min-w-0 overflow-auto">
            <div className="px-3 md:px-4 lg:px-5 py-3 md:py-4 lg:py-5 min-w-0 [*:first-child]:mt-0 [*:last-child]:mb-0">
              <Outlet />

              {showLogoutDialog && (
                <AlertModal
                  showDialog={showLogoutDialog}
                  setShowDialog={setShowLogoutDialog}
                  title="Logout"
                  message="Would you like to log out?"
                  method={signOut}
                  buttonName="Logout"
                />
              )}
              {showCalculator && (
                <LoanCalculatorDialog
                  isOpen={showCalculator}
                  onClose={() => setShowCalculator(false)}
                />
              )}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AuthLayout;

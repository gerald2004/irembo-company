/* eslint-disable react/prop-types */
import {
  Bell,
  ChevronsUpDown,
  LockKeyhole,
  LogOut,
  UserCog,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import useLogout from "@/MiddleWares/Hooks/useLogout";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import AlertModal from "./AlertModal";
export function NavUser({ user }) {
  const { isMobile } = useSidebar();
  const logout = useLogout();
  const navigate = useNavigate();
  const signOut = async () => {
    await logout();
    navigate("/");
  };
   const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">
                    {user.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.name}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user.name}</span>
                    <span className="truncate text-xs">{user.role}</span>
                    <span className="truncate text-xs">{user.contact}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <UserCog />
                  <Link to="/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <LockKeyhole />
                  <Link to="/change-password">Change Password </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Bell />
                  <Link to="/notifications">
                  Notifications
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogOut />
                <Link onClick={() => setShowLogoutDialog(true)}>Log out</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
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
      )}{" "}
    </>
  );
}

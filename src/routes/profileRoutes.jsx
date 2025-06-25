import Profile from "@/Pages/Profile/Profile";
import ChangePassword from "@/Pages/Profile/ChangePassword";
import Notifications from "@/Pages/Profile/Notifications";
const profileRoutes = [
  {
    path: "/profile",
    element: <Profile />,
  },

  {
    path: "/change-password",
    element: <ChangePassword />,
  },

  {
    path: "/notifications",
    element: <Notifications />,
  },
];

export default profileRoutes;

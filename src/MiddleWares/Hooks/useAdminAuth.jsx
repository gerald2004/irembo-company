import { useContext } from "react";
import AdminAuthContext from "@/MiddleWares/Context/AdminAuthProvider";

const useAdminAuth = () => useContext(AdminAuthContext);
export default useAdminAuth;

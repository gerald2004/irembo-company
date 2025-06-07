import axios from "@/Config/Axios";
import useAuth from "./useAuth";

const useLogout = () => {
  const { setAuth } = useAuth();

  const logout = async () => {
    setAuth({});
    try {
    await axios.delete("/auth/advanced/sessions", {
      withCredentials: true,
    });
      // console.log(response)
    } catch (err) {
      console.error(err);
    }
  };

  return logout;
};

export default useLogout;

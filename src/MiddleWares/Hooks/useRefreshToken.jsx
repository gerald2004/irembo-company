import axios from "@/Config/Axios";
import useAuth from "./useAuth";

const useRefreshToken = () => {
  const { setAuth } = useAuth();

  const refresh = async () => {
    const response = await axios.patch(
      `/auth/advanced/sessions`,
      {},
      {
        withCredentials: true,
      }
    );
    setAuth((prev) => {
      return {
        ...prev,
        sessionid: response.data.data.sessionId,
        accessToken: response.data.data.accessToken,
        roles: response.data.data.roles,
        user: response.data.data.user,
        fiscalYear: response.data.data.fiscal_year,
      };
    });
    return response.data.accessToken;
  };
  return refresh;
};

export default useRefreshToken;

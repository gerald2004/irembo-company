// hooks/useClients.js
import { useQuery } from "@tanstack/react-query";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { useNavigate } from "react-router-dom";

export function useUsers() {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();

  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const controller = new AbortController();
      try {
        const response = await axiosPrivate.get("/business/employees", {
          signal: controller.signal,
        });
        return response.data.data.users ?? [];
      } catch (error) {
        if (error?.response?.status === 401) {
          navigate("/", { state: { from: location }, replace: true });
        }
        throw error;
      }
    },
  });
}


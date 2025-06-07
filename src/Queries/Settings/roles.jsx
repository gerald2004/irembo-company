import { useQuery } from "@tanstack/react-query";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { useNavigate } from "react-router-dom";

export function useRoles() {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();

  return useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const controller = new AbortController();
      try {
        const response = await axiosPrivate.get("/settings/rights/roles", {
          signal: controller.signal,
        });
        return response.data.data.roles ?? [];
      } catch (error) {
        if (error?.response?.status === 401) {
          navigate("/", { state: { from: location }, replace: true });
        }
        throw error;
      }
    },
  });
}


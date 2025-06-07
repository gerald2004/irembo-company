// hooks/useClients.js
import { useQuery } from "@tanstack/react-query";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { useNavigate } from "react-router-dom";

export function useBranches() {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();

  return useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const controller = new AbortController();
      try {
        const response = await axiosPrivate.get("/settings/branches", {
          signal: controller.signal,
        });
        return response.data.data.branches ?? [];
      } catch (error) {
        if (error?.response?.status === 401) {
          navigate("/", { state: { from: location }, replace: true });
        }
        throw error;
      }
    },
  });
}


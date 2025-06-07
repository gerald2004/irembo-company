// hooks/useClients.js
import { useQuery } from "@tanstack/react-query";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { useNavigate } from "react-router-dom";

export function useTills() {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();

  return useQuery({
    queryKey: ["transaction-tills"],
    queryFn: async () => {
      const controller = new AbortController();
      try {
        const response = await axiosPrivate.get(
          "/settings/transaction-channels",
          {
            signal: controller.signal,
          }
        );
        return response.data.data.transaction_tills ?? [];
      } catch (error) {
        if (error?.response?.status === 401) {
          navigate("/", { state: { from: location }, replace: true });
        }
        throw error;
      }
    },
  });
}


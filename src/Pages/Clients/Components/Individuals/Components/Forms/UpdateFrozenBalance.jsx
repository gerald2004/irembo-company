/* eslint-disable react/prop-types */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import AlertModal from "@/components/AlertModal";

const UpdateFrozenBalance = ({
  showDialog,
  setShowDialog,
  selectedId,
  clientAccountId,
}) => {
  const axiosPrivate = useAxiosPrivate();
  const queryClient = useQueryClient();

  const mutation = useMutation(
    async (status) => {
      const controller = new AbortController();

      await axiosPrivate.patch(
        `/accounting/frozen/update`,
        {
          tranfer_id: selectedId,
          client_account_id: clientAccountId,
          transfer_status: status,
        },
        { signal: controller.signal }
      );
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(["frozenBalances", clientAccountId]);
        toast({
          title: "Success",
          description: "Frozen balance updated successfully.",
        });
        setShowDialog(false);
      },
      onError: (error) => {
        toast({
          title: "Error",
          variant: "destructive",
          description:
            error?.response?.data?.messages || "Failed to update balance",
        });
      },
    }
  );

  return (
    <AlertModal
      showDialog={showDialog}
      setShowDialog={setShowDialog}
      title="Update Frozen Balance"
      message="Are you sure you want to update the frozen balance?"
      method={(status) => mutation.mutate(status)}
      buttonOptions={[
        { label: "Terminate", action: "terminated" },
        { label: "Reverse", action: "reversed" },
        { label: "Transfer", action: "transfered" },
      ]}
    />
  );
};

export default UpdateFrozenBalance;

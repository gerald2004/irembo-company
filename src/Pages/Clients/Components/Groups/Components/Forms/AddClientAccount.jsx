/* eslint-disable react/prop-types */
import { useForm, Controller } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { toast } from "@/hooks/use-toast";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AddClientAccount = ({ isOpen, onClose, refetch }) => {
  const axiosPrivate = useAxiosPrivate();
  const { id: clientId } = useParams(); // ✅ Get client_id from params

  const {
    // register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  // ✅ Fetch Account Products from API
  const { data: accountProducts = [], isLoading } = useQuery({
    queryKey: ["account_products"],
    queryFn: async () => {
            const controller = new AbortController();

      const response = await axiosPrivate.get(`/settings/savings/accounts`, {
        signal: controller.signal,
      }); // ✅ Change API endpoint as needed
      return response.data?.data?.savings_products || [];
    },
  });

  const onSubmit = async (data) => {
          const controller = new AbortController();

    try {
      const payload = { ...data, client_id: clientId };
      const response = await axiosPrivate.post(
        `/accounts/attached/accounts`,
        payload,
        { signal: controller.signal }
      );
      toast({
        title: "Success",
        description: response.data.messages,
      });
      reset();
      refetch();
      onClose();
    } catch (error) {
      const errorMessage =
        error?.response?.data?.messages || "No server response";
      toast({
        title: "Uh oh! Something went wrong.",
        variant: "destructive",
        description: errorMessage,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Add New Client Account</DialogTitle>
          <DialogDescription>New client account if you don&apos;t see the account product you can add it through settings.</DialogDescription>
          <DialogClose asChild>
            <button
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </button>
          </DialogClose>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Account Product Selection (ShadCN Select) */}
            <div className="col-span-full">
              <Label htmlFor="savings_product_id">Account Product</Label>
              <Controller
                name="savings_product_id"
                control={control}
                rules={{ required: "Account product is required" }}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          isLoading ? "Loading..." : "Select account product"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {accountProducts.map((product) => (
                        <SelectItem key={product.id} value={String(product.id)}>
                          {product.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.savings_product_id && (
                <p className="text-red-500 text-sm">
                  {errors.savings_product_id.message}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Add Account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddClientAccount;

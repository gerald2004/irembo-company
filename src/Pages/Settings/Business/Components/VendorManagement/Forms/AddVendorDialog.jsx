/* eslint-disable react/prop-types */
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { toast } from "@/hooks/use-toast";

const AddVendorDialog = ({ isOpen, onClose, refetch }) => {
  const axiosPrivate = useAxiosPrivate();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (data) => {
         const controller = new AbortController();

    try {
      const response = await axiosPrivate.post(
        "/accounting/vendors/account",
        data,
        { signal: controller.signal }
      );
      toast({
        title: "Success",
        description: response.data.messages,
      });
      console.log(response)
      reset();
      refetch();
      onClose();
    } catch (error) {
      console.log(error)
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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Vendor</DialogTitle>
          <DialogDescription>
            Fill in the details to add a new vendor.
          </DialogDescription>
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
            {/* First Name (Required) */}
            <div>
              <Label htmlFor="firstname">First Name</Label>
              <Input
                id="firstname"
                placeholder="e.g. John"
                {...register("firstname", {
                  required: "First name is required",
                })}
              />
              {errors.firstname && (
                <p className="text-red-500 text-sm">
                  {errors.firstname.message}
                </p>
              )}
            </div>

            {/* Last Name (Required) */}
            <div>
              <Label htmlFor="lastname">Last Name</Label>
              <Input
                id="lastname"
                placeholder="e.g. Doe"
                {...register("lastname", {
                  required: "Last name is required",
                })}
              />
              {errors.lastname && (
                <p className="text-red-500 text-sm">
                  {errors.lastname.message}
                </p>
              )}
            </div>

            {/* Email (Optional) */}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="e.g. vendor@example.com"
                {...register("email")}
              />
            </div>

            {/* Contact (Required) */}
            <div>
              <Label htmlFor="contact">Contact</Label>
              <Input
                id="contact"
                type="tel"
                placeholder="e.g. +256 700 000000"
                {...register("contact", {
                  required: "Contact number is required",
                })}
              />
              {errors.contact && (
                <p className="text-red-500 text-sm">{errors.contact.message}</p>
              )}
            </div>

            {/* Company (Optional) */}
            <div>
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                placeholder="e.g. ABC Traders"
                {...register("company")}
              />
            </div>

            {/* Address (Optional) */}
            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                placeholder="e.g. 123 Main St, Kampala"
                {...register("address")}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Vendor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddVendorDialog;

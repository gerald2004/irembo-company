/* eslint-disable react/prop-types */
import { useEffect } from "react";
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

const EditVendorDialog = ({ isOpen, onClose, refetch, defaultValues }) => {
  const axiosPrivate = useAxiosPrivate();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  // ✅ Ensure default values are loaded correctly
  useEffect(() => {
    if (defaultValues) {
      reset({
        firstname: defaultValues.vendor_firstname || "",
        lastname: defaultValues.vendor_lastname || "",
        email: defaultValues.vendor_email || "",
        contact: defaultValues.vendor_contact || "",
        company: defaultValues.vendor_company || "",
        address: defaultValues.vendor_address || "",
      });
    }
  }, [defaultValues, reset]);

  const onSubmit = async (data) => {
          const controller = new AbortController();

    try {
      const response = await axiosPrivate.patch(
        `/accounting/vendors/account/${defaultValues.vendor_id}`,
        data,
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
      const errorMessage = error?.response?.data?.messages || "No server response";
      toast({
        title: "Uh oh! Something went wrong.",
        variant: "destructive",
        description: errorMessage,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Vendor</DialogTitle>
          <DialogDescription>
            Modify the details to update this vendor.
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
                {...register("lastname", { required: "Last name is required" })}
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
              <Input id="email" type="email" {...register("email")} />
            </div>

            {/* Contact (Required) */}
            <div>
              <Label htmlFor="contact">Contact</Label>
              <Input
                id="contact"
                type="tel"
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
              <Input id="company" {...register("company")} />
            </div>

            {/* Address (Optional) */}
            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" {...register("address")} />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Vendor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditVendorDialog;

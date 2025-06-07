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

const EditBranchDialog = ({ isOpen, onClose, refetch, defaultValues }) => {
  const axiosPrivate = useAxiosPrivate();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  // Ensure default values are loaded correctly
  useEffect(() => {
    if (defaultValues) {
      reset({
        name: defaultValues.name || "",
        code: defaultValues.code || "",
        contact: defaultValues.contact || "",
        email: defaultValues.email || "",
        address: defaultValues.address || "",
        description: defaultValues.description || "",
      });
    }
  }, [defaultValues, reset]);

  const onSubmit = async (data) => {
    const controller = new AbortController();

    try {
      await axiosPrivate.patch(`/settings/branches/${defaultValues.id}`, data, {
        signal: controller.signal,
      });

      toast({
        title: "Success",
        description: "Branch updated successfully!",
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Branch</DialogTitle>
          <DialogDescription>
            Modify the details to update this branch.
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
            {/* Branch Name (Required) */}
            <div>
              <Label htmlFor="name">Branch Name</Label>
              <Input
                id="name"
                {...register("name", { required: "Branch name is required" })}
              />
              {errors.name && (
                <p className="text-red-500 text-sm">{errors.name.message}</p>
              )}
            </div>

            {/* Branch Code (Required) */}
            <div>
              <Label htmlFor="code">Branch Code</Label>
              <Input
                id="code"
                {...register("code", { required: "Branch code is required" })}
              />
              {errors.code && (
                <p className="text-red-500 text-sm">{errors.code.message}</p>
              )}
            </div>

            {/* Contact (Optional) */}
            <div>
              <Label htmlFor="contact">Contact</Label>
              <Input id="contact" type="tel" {...register("contact")} />
            </div>

            {/* Email (Optional) */}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email", {
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Invalid email address",
                  },
                })}
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email.message}</p>
              )}
            </div>

            {/* Address (Optional) */}
            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" {...register("address")} />
            </div>

            {/* Description (Optional) */}
            <div>
              <Label htmlFor="description">Address</Label>
              <Textarea id="description" {...register("description")} />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Branch"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditBranchDialog;

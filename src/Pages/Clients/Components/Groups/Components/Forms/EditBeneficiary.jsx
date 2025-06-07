/* eslint-disable react/prop-types */
import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
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
import {  X } from "lucide-react";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { toast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const EditExecutive = ({ isOpen, onClose, refetch, defaultValues }) => {
  const axiosPrivate = useAxiosPrivate();
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues,
  });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const onSubmit = async (data) => {
          const controller = new AbortController();

    try {
     
        const response = await axiosPrivate.patch(
          `/clients/executives/${defaultValues.id}/single`,
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
      }
     catch (error) {
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
          <DialogTitle>Edit Executive</DialogTitle>
          <DialogDescription>
            Fill in the details update to a executive.
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
            {/* Full Name */}
            <div>
              <Label htmlFor="fullname">Full Name</Label>
              <Input
                id="fullname"
                placeholder="Enter full name"
                {...register("fullname", {
                  required: "Full name is required",
                })}
              />
              {errors.fullname && (
                <p className="text-red-500 text-sm">
                  {errors.fullname.message}
                </p>
              )}
            </div>

            {/* Contact */}
            <div>
              <Label htmlFor="contact">Contact</Label>
              <Input
                id="contact"
                placeholder="Enter contact"
                {...register("contact", {
                  required: "Contact is required",
                })}
              />
              {errors.contact && (
                <p className="text-red-500 text-sm">{errors.contact.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email"
                {...register("email", {
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Invalid email format",
                  },
                })}
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email.message}</p>
              )}
            </div>

            {/* Identification */}
            <div>
              <Label htmlFor="identification">Identification</Label>
              <Input
                id="identification"
                placeholder="Enter national ID or passport"
                {...register("identification", {
                  required: "Identification is required",
                })}
              />
              {errors.identification && (
                <p className="text-red-500 text-sm">
                  {errors.identification.message}
                </p>
              )}
            </div>

            {/* Role */}
            <div>
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                placeholder="Enter role"
                {...register("role", {
                  required: "Role is required",
                })}
              />
              {errors.role && (
                <p className="text-red-500 text-sm">{errors.role.message}</p>
              )}
            </div>

            {/* Title */}
            <div>
              <Label htmlFor="title">Title</Label>
              <Controller
                name="title"
                control={control}
                rules={{ required: "Title is required" }}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select title" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mr">Mr</SelectItem>
                      <SelectItem value="Mrs">Mrs</SelectItem>
                      <SelectItem value="Miss">Miss</SelectItem>
                      <SelectItem value="Dr">Dr</SelectItem>
                      <SelectItem value="Rev">Rev</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.title && (
                <p className="text-red-500 text-sm">{errors.title.message}</p>
              )}
            </div>

            {/* Address */}
            <div className="col-span-full">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                placeholder="Enter address"
                {...register("address", {
                  required: "Address is required",
                })}
              />
              {errors.address && (
                <p className="text-red-500 text-sm">{errors.address.message}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Update Executive"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditExecutive;

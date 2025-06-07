/* eslint-disable react/prop-types */
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, X } from "lucide-react";
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
import { useParams } from "react-router-dom";
const AddBeneficiary = ({ isOpen, onClose, refetch }) => {
  const axiosPrivate = useAxiosPrivate();
  const {id} = useParams();
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (data) => {
    const controller = new AbortController();
    try {
      const response = await axiosPrivate.post(`/clients/beneficiary/${id}`, data, {signal: controller.signal});
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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add Next of Kin</DialogTitle>
          <DialogDescription>
            Fill in the details to add a next of kin.
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
            {/* Firstname */}
            <div>
              <Label htmlFor="client_next_of_kin_firstname">First Name</Label>
              <Input
                id="client_next_of_kin_firstname"
                placeholder="Enter first name"
                {...register("client_next_of_kin_firstname", {
                  required: "First name is required",
                })}
              />
              {errors.client_next_of_kin_firstname && (
                <p className="text-red-500 text-sm">
                  {errors.client_next_of_kin_firstname.message}
                </p>
              )}
            </div>

            {/* Lastname */}
            <div>
              <Label htmlFor="client_next_of_kin_lastname">Last Name</Label>
              <Input
                id="client_next_of_kin_lastname"
                placeholder="Enter last name"
                {...register("client_next_of_kin_lastname", {
                  required: "Last name is required",
                })}
              />
              {errors.client_next_of_kin_lastname && (
                <p className="text-red-500 text-sm">
                  {errors.client_next_of_kin_lastname.message}
                </p>
              )}
            </div>

            {/* Gender */}
            <div>
              <Label htmlFor="client_next_of_kin_gender">Gender</Label>
              <Controller
                name="client_next_of_kin_gender"
                control={control}
                rules={{ required: "Gender is required" }}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.client_next_of_kin_gender && (
                <p className="text-red-500 text-sm">
                  {errors.client_next_of_kin_gender.message}
                </p>
              )}
            </div>

            {/* Relationship */}
            <div>
              <Label htmlFor="client_next_of_kin_relationship">
                Relationship
              </Label>
              <Input
                id="client_next_of_kin_relationship"
                placeholder="e.g. Brother, Sister, Parent"
                {...register("client_next_of_kin_relationship", {
                  required: "Relationship is required",
                })}
              />
              {errors.client_next_of_kin_relationship && (
                <p className="text-red-500 text-sm">
                  {errors.client_next_of_kin_relationship.message}
                </p>
              )}
            </div>

            {/* Birth Date */}
            <div>
              <Label htmlFor="client_next_of_kin_date_birth">
                Date of Birth
              </Label>
              <Controller
                name="client_next_of_kin_date_birth"
                control={control}
                rules={{ required: "Birth date is required" }}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className="w-full pl-3 text-left font-normal"
                      >
                        {field.value ? (
                          new Date(field.value).toLocaleDateString() // ✅ Ensure value is a Date object
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={
                          field.value ? new Date(field.value) : undefined
                        } // ✅ Ensure value is a Date
                        onSelect={(date) => field.onChange(date?.toISOString())} // ✅ Store as ISO string
                        disabled={(date) => date < new Date("1920-01-01")}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.client_next_of_kin_date_birth && (
                <p className="text-red-500 text-sm">
                  {errors.client_next_of_kin_date_birth.message}
                </p>
              )}
            </div>

            {/* Heritance */}
            <div>
              <Label htmlFor="client_next_of_kin_heritance">
                Heritance (%)
              </Label>
              <Input
                id="client_next_of_kin_heritance"
                type="number"
                placeholder="Enter heritance percentage"
                {...register("client_next_of_kin_heritance", {
                  required: "Heritance percentage is required",
                })}
              />
              {errors.client_next_of_kin_heritance && (
                <p className="text-red-500 text-sm">
                  {errors.client_next_of_kin_heritance.message}
                </p>
              )}
            </div>

            {/* Identification */}
            <div>
              <Label htmlFor="client_next_of_kin_identification">
                Identification (Optional)
              </Label>
              <Input
                id="client_next_of_kin_identification"
                placeholder="Enter 14-digit ID (Optional)"
                {...register("client_next_of_kin_identification", {
                  validate: (value) =>
                    value === "" ||
                    /^[0-9]{14}$/.test(value) ||
                    "Must be 14 digits",
                })}
              />
              {errors.client_next_of_kin_identification && (
                <p className="text-red-500 text-sm">
                  {errors.client_next_of_kin_identification.message}
                </p>
              )}
            </div>

            {/* Email Address */}
            <div>
              <Label htmlFor="client_next_of_kin_email_address">
                Email Address (Optional)
              </Label>
              <Input
                id="client_next_of_kin_email_address"
                type="email"
                placeholder="Enter email address"
                {...register("client_next_of_kin_email_address", {
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Invalid email address",
                  },
                })}
              />
              {errors.client_next_of_kin_email_address && (
                <p className="text-red-500 text-sm">
                  {errors.client_next_of_kin_email_address.message}
                </p>
              )}
            </div>
            {/* Address */}
            <div className="col-span-full">
              <Label htmlFor="client_next_of_kin_address">Address</Label>
              <Textarea
                id="client_next_of_kin_address"
                placeholder="Enter address"
                {...register("client_next_of_kin_address", {
                  required: "Address is required",
                })}
              />
              {errors.client_next_of_kin_address && (
                <p className="text-red-500 text-sm">
                  {errors.client_next_of_kin_address.message}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Add Beneficiary"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddBeneficiary;

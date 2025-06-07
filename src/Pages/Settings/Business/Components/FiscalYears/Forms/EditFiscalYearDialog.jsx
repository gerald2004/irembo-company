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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { toast } from "@/hooks/use-toast";

const EditFiscalYearDialog = ({ isOpen, onClose, refetch, defaultValues }) => {
  const axiosPrivate = useAxiosPrivate();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  // Ensure correct default values when modal opens
  useEffect(() => {
    if (defaultValues) {
      reset({
        name: defaultValues.name,
        start_date: new Date(defaultValues.start_date),
        end_date: new Date(defaultValues.end_date),
        is_active: defaultValues.is_active === 1, // Convert to boolean
      });
    }
  }, [defaultValues, reset]);

  const isActive = watch("is_active");

  const onSubmit = async (data) => {
          const controller = new AbortController();

    try {
      await axiosPrivate.patch(
        `/settings/fiscal-years/${defaultValues.id}`,
        {
          ...data,
          is_active: isActive ? 1 : 0, // Ensure proper conversion
        },
        { signal: controller.signal }
      );

      toast({
        title: "Success",
        description: "Fiscal year updated successfully!",
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
          <DialogTitle>Edit Fiscal Year</DialogTitle>
          <DialogDescription>
            Modify the details to update this fiscal year.
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
            {/* Fiscal Year Name */}
            <div>
              <Label htmlFor="name">Fiscal Year Name</Label>
              <Input
                id="name"
                {...register("name", {
                  required: "Fiscal year name is required",
                })}
              />
              {errors.name && (
                <p className="text-red-500 text-sm">{errors.name.message}</p>
              )}
            </div>

            {/* Start Date */}
            <div>
              <Label htmlFor="start_date">Start Date</Label>
              <Controller
                name="start_date"
                control={control}
                rules={{ required: "Start date is required" }}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full pl-3 text-left font-normal"
                      >
                        {field.value ? (
                          field.value.toLocaleDateString()
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.start_date && (
                <p className="text-sm text-red-500">
                  {errors.start_date.message}
                </p>
              )}
            </div>

            {/* End Date */}
            <div>
              <Label htmlFor="end_date">End Date</Label>
              <Controller
                name="end_date"
                control={control}
                rules={{ required: "End date is required" }}
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full pl-3 text-left font-normal"
                      >
                        {field.value ? (
                          field.value.toLocaleDateString()
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
              {errors.end_date && (
                <p className="text-sm text-red-500">
                  {errors.end_date.message}
                </p>
              )}
            </div>

            {/* Active Status Toggle */}
            <div className="flex items-center justify-between">
              <Label>Fiscal Year Status</Label>
              <div className="flex items-center space-x-2">
                <Badge variant={isActive ? "default" : "secondary"}>
                  {isActive ? "Active" : "Inactive"}
                </Badge>
                <Switch
                  checked={isActive}
                  onCheckedChange={(checked) => setValue("is_active", checked)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Fiscal Year"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditFiscalYearDialog;

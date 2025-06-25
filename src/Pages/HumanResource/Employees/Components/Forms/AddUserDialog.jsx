/* eslint-disable react/prop-types */
import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm, Controller } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle,
  X,
  CalendarIcon,
  Cog,
  Image,
  Fingerprint,
  ArrowRight,
  ArrowLeft,
  UploadIcon,
  XCircle,
} from "lucide-react";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { toast } from "@/hooks/use-toast";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Progress } from "@/components/ui/progress";

const AddUserDialog = ({ isOpen, onClose, refetch }) => {
  const axiosPrivate = useAxiosPrivate();
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    control,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm();

  const [step, setStep] = useState(1);

  const validateStep = async () => {
    const valid = await trigger();
    if (valid && step < 3) {
      setStep((prev) => prev + 1);
    }
  };

  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const [selectedBranch, setSelectedBranch] = useState(null);

  // ✅ Fetch all branches
  const { data: branches = [] } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
            const controller = new AbortController();

      const response = await axiosPrivate.get("/settings/branches", {
        signal: controller.signal,
      });
      return response?.data?.data?.branches ?? [];
    },
  });

  // ✅ Fetch departments based on selected branch
  const { data: departments = [] } = useQuery({
    queryKey: ["departments", selectedBranch],
    queryFn: async () => {
            const controller = new AbortController();

      if (!selectedBranch) return [];
      const response = await axiosPrivate.get(
        `/settings/departments/${selectedBranch}/branch`,
        { signal: controller.signal }
      );
      return response?.data?.data?.departments ?? [];
    },
    enabled: !!selectedBranch, // Only run query when a branch is selected
  });

  // ✅ Fetch all roles
  const { data: roles = [] } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
            const controller = new AbortController();

      const response = await axiosPrivate.get("/settings/rights/roles", {
        signal: controller.signal,
      });
      return response?.data?.data?.roles ?? [];
    },
  });

  const onSubmit = async (data) => {
          const controller = new AbortController();

    try {
      if (!data.user_department) {
        data.user_department = null;
      }
      // console.log(data)
      const formData = new FormData();
      // Append all form fields
      Object.keys(data).forEach((key) => {
        if (key === "user_image" && data.user_image.length > 0) {
          formData.append(key, data.user_image[0]); // Append file
        } else {
          formData.append(key, data[key]); // Append other fields
        }
      });
      const response = await axiosPrivate.post(
        "/business/employees",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          signal: controller.signal,
        }
      );

      toast({ title: "Success", description: response?.data?.messages });
      reset();
      refetch();
      onClose();
      setStep(1);
    } catch (error) {
        // console.log(error)
      const errorMessage =
        error?.response?.data?.messages || "No server response";
      toast({
        title: "Uh oh! Something went wrong.",
        variant: "destructive",
        description: errorMessage,
      });
    }
  };

  const stepIcons = [
    {
      icon: <Fingerprint className="w-6 h-6 text-blue-500" />,
      label: "Bio Details",
    },
    {
      icon: <Cog className="w-6 h-6 text-yellow-500" />,
      label: "Staff Settings",
    },
    {
      icon: <Image className="w-6 h-6 text-green-500" />,
      label: "Staff Photo",
    },
  ];
  const [preview, setPreview] = useState(null);

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      setValue("user_image", file); // Update form state
    }
  };

  // Clear image preview
  const handleRemoveImage = () => {
    setPreview(null);
    setValue("user_image", null); // Reset form state
  };
  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Staff</DialogTitle>
          <DialogDescription>
            Fill in the required fields to add a new staff.
          </DialogDescription>
          <DialogClose asChild>
            <button
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </button>
          </DialogClose>
        </DialogHeader>
        <div className="flex items-center space-x-4 my-1">
          {stepIcons.map((stepIcon, index) => (
            <div
              key={index}
              className={`flex items-center ${
                step > index + 1 ? "opacity-100" : "opacity-50"
              } transition-opacity`}
            >
              {stepIcon.icon}
              <span className="ml-2 text-sm font-medium">{stepIcon.label}</span>
              {index < stepIcons.length - 1 && (
                <div className="h-[2px] w-8 bg-gray-300 mx-2"></div>
              )}
            </div>
          ))}
        </div>
        <Progress value={(step / 3) * 100} className="my-1" />

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          encType="multipart/form-data"
        >
          {step === 1 && (
            <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstname">First Name</Label>
                <Input
                  id="firstname"
                  placeholder="Enter first name"
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

              <div>
                <Label htmlFor="lastname">Last Name</Label>
                <Input
                  id="lastname"
                  placeholder="Enter last name"
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

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  {...register("email", {
                    required: "Email is required",
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

              <div>
                <Label htmlFor="contact">Contact</Label>
                <Input
                  id="contact"
                  type="tel"
                  placeholder="Enter contact number"
                  {...register("contact", { required: "Contact is required" })}
                />
                {errors.contact && (
                  <p className="text-red-500 text-sm">
                    {errors.contact.message}
                  </p>
                )}
              </div>
              <div>
                <Label>Salary</Label>
                <Input
                  id="salary"
                  type="number"
                  placeholder="Enter salary amount"
                  {...register("salary", {
                    required: "Salary is required",
                  })}
                />
                {errors.salary && (
                  <p className="text-red-500 text-sm">
                    {errors.salary.message}
                  </p>
                )}
              </div>

              <div>
                <Label>Job Title</Label>
                <Input
                  id="job_title"
                  placeholder="Enter job title"
                  {...register("job_title", {
                    required: "Job Title is required",
                  })}
                />
                {errors.job_title && (
                  <p className="text-red-500 text-sm">
                    {errors.job_title.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="date_of_birth">Date of Birth</Label>
                <Controller
                  name="date_of_birth"
                  control={control}
                  rules={{ required: "Date of birth is required" }}
                  render={({ field }) => {
                    const parsedDate = field.value
                      ? new Date(field.value)
                      : null;
                    return (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className="w-full pl-3 text-left font-normal"
                          >
                            {parsedDate
                              ? parsedDate.toLocaleDateString()
                              : "Pick a date"}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={parsedDate}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date("2000-01-01")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    );
                  }}
                />

                {errors.date_of_birth && (
                  <p className="text-red-500 text-sm">
                    {errors.date_of_birth.message}
                  </p>
                )}
              </div>

              <div>
                <Label>Gender</Label>
                <Select onValueChange={(value) => setValue("gender", value)}>
                  <SelectTrigger
                    {...register("gender", { required: "Gender is required" })}
                  >
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
                {errors.gender && (
                  <p className="text-red-500 text-sm">
                    {errors.gender.message}
                  </p>
                )}
              </div>
            </fieldset>
          )}
          {step === 2 && (
            <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Status</Label>
                <Select onValueChange={(value) => setValue("status", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Branch</Label>
                <Controller
                  name="branch_id"
                  control={control}
                  rules={{ required: "Branch is required" }}
                  render={({ field }) => (
                    <Select
                      value={field.value || ""} // Ensure empty value shows placeholder
                      onValueChange={(value) => {
                        field.onChange(value); // Update react-hook-form state
                        setSelectedBranch(value); // Set selected branch state
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Branch"></SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((branch) => (
                          <SelectItem key={branch.id} value={String(branch.id)}>
                            {branch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.branch_id && (
                  <p className="text-red-500 text-sm">
                    {errors.branch_id.message}
                  </p>
                )}
              </div>

              <div>
                <Label>Department</Label>
                <Controller
                  name="user_department"
                  control={control}
                  rules={{ required: "Department is required" }}
                  render={({ field }) => (
                    <Select
                      value={field.value || ""}
                      onValueChange={(value) => field.onChange(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((department) => (
                          <SelectItem
                            key={department.id}
                            value={String(department.id)}
                          >
                            {department.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.user_department && (
                  <p className="text-red-500 text-sm">
                    {errors.user_department.message}
                  </p>
                )}
              </div>

              <div>
                <Label>Role</Label>
                <Controller
                  name="role_id"
                  control={control}
                  rules={{ required: "Role is required" }}
                  render={({ field }) => (
                    <Select
                      value={field.value || ""}
                      onValueChange={(value) => field.onChange(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={String(role.id)}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.role_id && (
                  <p className="text-red-500 text-sm">
                    {errors.role_id.message}
                  </p>
                )}
              </div>

              <div>
                <Label className="mx-2 my-0">Can Login</Label>
                <Switch
                  checked={watch("can_login") === "yes"}
                  onCheckedChange={(checked) =>
                    setValue("can_login", checked ? "yes" : "no")
                  }
                />
              </div>
            </fieldset>
          )}
          {step === 3 && (
            <fieldset className="grid grid-cols-1 md:grid-cols-1 gap-4">
              <div className="flex flex-col items-center space-y-2">
                <Label className="text-center">Profile Picture</Label>

                {/* Image Preview Box */}
                <div className="relative w-32 h-32 border border-gray-300 rounded-full overflow-hidden flex items-center justify-center">
                  {preview ? (
                    <>
                      <img
                        src={preview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      {/* Remove Image Button - Now on top of the image */}
                      <button
                        type="button"
                        className="absolute top-2 right-4 bg-red-500 text-white p-1 rounded-full z-10 backdrop-blur-sm shadow-md"
                        onClick={handleRemoveImage}
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </>
                  ) : (
                    <span className="text-gray-400">No Image</span>
                  )}
                </div>

                {/* File Input (Hidden) */}
                <Input
                  type="file"
                  accept="image/*"
                  {...register("user_image")}
                  className="hidden"
                  id="file-upload"
                  onChange={handleFileChange}
                />

                {/* Upload Button */}
                <Button asChild variant="outline" className="w-full">
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex items-center gap-2"
                  >
                    <UploadIcon className="w-5 h-5 text-gray-600" />
                    Upload Image
                  </label>
                </Button>
              </div>
            </fieldset>
          )}

          <DialogFooter>
            <div className="flex justify-end w-full">
              {step > 1 && (
                <Button
                  type="button"
                  className="mx-2"
                  variant="secondary"
                  onClick={prevStep}
                >
                  <ArrowLeft className="mr-2" /> Back
                </Button>
              )}
              {step < 3 ? (
                <Button type="button" onClick={validateStep}>
                  Next <ArrowRight className="ml-2" />
                </Button>
              ) : (
                ""
              )}
              {step === 3 && (
                <Button type="submit">
                  {isSubmitting ? (
                    "Saving Please wait ..."
                  ) : (
                    <>
                      Submit <CheckCircle className="ml-2" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddUserDialog;

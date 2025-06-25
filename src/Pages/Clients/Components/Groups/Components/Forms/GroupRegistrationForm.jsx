import { useState } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BookUser, PlusCircle, Trash } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  ArrowRight,
  ArrowLeft,
  UploadIcon,
  XCircle,
  Cog,
  Image,
  CheckCircle,
  CalendarIcon,
  Phone,
  IdCard,
} from "lucide-react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import useAxiosPrivate from "@/MiddleWares/Hooks/useAxiosPrivate";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { Switch } from "@/components/ui/switch";

const GroupRegistrationForm = () => {
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setValue,
    control,
    trigger,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "executives", // Name of the array in your form
  });
  const [step, setStep] = useState(1);
  const [preview, setPreview] = useState(null);

  // Progress the form
  const validateStep = async () => {
    const valid = await trigger();
    if (valid && step < 5) {
      setStep((prev) => prev + 1);
    }
  };

  // Go back a step
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  // Handle image upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      setValue("user_image", file);
    }
  };

  const handleFileChange = (e, index = null, type = "group") => {
    const file = e.target.files[0];
    if (!file) return;

    if (type === "group") {
      // Handle main group photo
      setPreview(URL.createObjectURL(file));
      setValue("user_image", file);
    } else if (index !== null) {
      // Handle executive-specific files
      setValue(`executives.${index}.${type}`, file);
    }
  };

  // Remove selected image
  const handleRemoveImage = () => {
    setPreview(null);
    setValue("user_image", null);
  };

  // Handle Form Submission
  const uploadExecutiveImage = async (
    file,
    executiveId,
    fileType,
    clientId
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("file_type", fileType); // "photo" or "signature"
    formData.append("executive_id", executiveId);
    formData.append("client_id", clientId);
    const controller = new AbortController();

    try {
      await axiosPrivate.post(`clients/images/executives`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        signal: controller.signal,
      });
    } catch (error) {
      console.error(
        `Failed to upload ${fileType} for executive ${executiveId}`,
        error
      );
    }
  };

  const uploadClientImage = async (file, clientId) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("file_type", "passport");
    formData.append("client_id", clientId);
    const controller = new AbortController();

    try {
      await axiosPrivate.post(`clients/images`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        signal: controller.signal,
      });
    } catch (error) {
      console.error("Failed to upload group photo", error);
    }
  };

  const onSubmit = async (data) => {
          const controller = new AbortController();

    try {
      const response = await axiosPrivate.post(`/clients/groups`, data, {
        signal: controller.signal,
      });
      const clientId = response.data.data.client_id;
      const executiveIds = response.data.data.executive_ids;

      // Upload group image
      if (data.user_image instanceof File) {
        await uploadClientImage(data.user_image, clientId);
      }

      // Upload executive photos and signatures
      if (Array.isArray(executiveIds)) {
        for (let i = 0; i < executiveIds.length; i++) {
          const execId = executiveIds[i];
          const exec = data.executives[i];

          if (exec?.photo instanceof File) {
            await uploadExecutiveImage(exec.photo, execId, "photo", clientId);
          }

          if (exec?.signature instanceof File) {
            await uploadExecutiveImage(
              exec.signature,
              execId,
              "signature",
              clientId
            );
          }
        }
      }

      toast({ title: "Success", description: response?.data?.messages?.[0] });
      reset();
      setStep(1);
      navigate(`/clients/group/${clientId}`);
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

  const stepIcons = [
    {
      icon: <BookUser className="w-6 h-6 text-blue-500" />,
      label: "Details",
    },
    {
      icon: <Phone className="w-6 h-6 text-red-500" />,
      label: "Contact Information",
    },
    {
      icon: <Cog className="w-6 h-6 text-yellow-500" />,
      label: "Client Settings",
    },
    {
      icon: <IdCard className="w-6 h-6 text-orange-500" />,
      label: "Executive Information",
    },
    {
      icon: <Image className="w-6 h-6 text-green-500" />,
      label: "Group Photo",
    },
  ];
  // Watch for employment status changes
  return (
    <>
      <Card className="shadow-lg rounded-xl">
        <CardHeader className="p-4 rounded-t-xl">
          <CardTitle className="text-sm font-semibold">
            <div className="flex items-end space-x-4 my-1">
              {stepIcons.map((stepIcon, index) => (
                <div
                  key={index}
                  className={`flex items-center ${
                    step > index + 1 ? "opacity-100" : "opacity-50"
                  } transition-opacity`}
                >
                  {stepIcon.icon}
                  <span className="ml-5 text-sm font-medium">
                    {stepIcon.label}
                  </span>
                  {index < stepIcons.length - 1 && (
                    <div className="h-[2px] w-8 bg-gray-300 mx-2"></div>
                  )}
                </div>
              ))}
            </div>
          </CardTitle>
          <div className="border-b" />
          <CardDescription className="text-sm capitalize">
            <Progress value={(step / 5) * 100} className="my-1" />
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-4 text-sm">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            encType="multipart/form-data"
          >
            {step === 1 && (
              <fieldset className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="groupname">Group Name</Label>
                  <Input
                    id="groupname"
                    placeholder="Enter group name"
                    {...register("group_name", {
                      required: "Group name is required",
                    })}
                  />
                  {errors.group_name && (
                    <p className="text-red-500 text-sm">
                      {errors.group_name.message}
                    </p>
                  )}
                </div>
              </fieldset>
            )}

            {step === 2 && (
              <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email address"
                    {...register("client_email_address", {
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Invalid email address",
                      },
                    })}
                  />
                  {errors.client_email_address && (
                    <p className="text-red-500 text-sm">
                      {errors.client_email_address.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="contact">Contact</Label>
                  <Input
                    id="contact"
                    type="tel"
                    placeholder="Enter contact number"
                    {...register("client_contact", {
                      required: "Contact is required",
                    })}
                    maxLength={12}
                  />
                  {errors.client_contact && (
                    <p className="text-red-500 text-sm">
                      {errors.client_contact.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="client_address">Address</Label>
                  <Textarea
                    id="client_address"
                    type="client_address"
                    placeholder="Enter Residential address"
                    {...register("client_address", {
                      required: "Address Field Is Required",
                    })}
                  />
                  {errors.client_address && (
                    <p className="text-red-500 text-sm">
                      {errors.client_address.message}
                    </p>
                  )}
                </div>
              </fieldset>
            )}

            {step === 3 && (
              <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Client Status */}
                <div>
                  <Label>Status</Label>
                  <Select
                    onValueChange={(value) => setValue("client_status", value)}
                  >
                    <SelectTrigger
                      {...register("client_status", {
                        required: "Status is required",
                      })}
                    >
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.client_status && (
                    <p className="text-red-500 text-sm">
                      {errors.client_status.message}
                    </p>
                  )}
                </div>

                {/* Mobile Banking Status (Switch) */}
                <div className="flex items-center space-x-3">
                  <Switch
                    checked={watch("client_mobile_banking_status") === "yes"}
                    onCheckedChange={(checked) =>
                      setValue(
                        "client_mobile_banking_status",
                        checked ? "yes" : "no"
                      )
                    }
                  />
                  <Label>Enable Mobile Banking</Label>
                </div>
                <div>
                  <Label htmlFor="group_date_of_join">Date Of Joining</Label>
                  <Controller
                    name="group_date_of_join"
                    control={control}
                    rules={{ required: "Date of joining is required" }}
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

                  {errors.group_date_of_join && (
                    <p className="text-red-500 text-sm">
                      {errors.group_date_of_join.message}
                    </p>
                  )}
                </div>

                {/* Login Portal/App Access (Switch) */}
                <div className="flex items-center space-x-3">
                  <Switch
                    checked={watch("client_can_login_portal_app") === "yes"}
                    onCheckedChange={(checked) =>
                      setValue(
                        "client_can_login_portal_app",
                        checked ? "yes" : "no"
                      )
                    }
                  />
                  <Label>Allow Login to Portal/App</Label>
                </div>
              </fieldset>
            )}
            {step === 4 && (
              <fieldset className="space-y-4">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4 border p-4 rounded-md mb-4 relative"
                  >
                    {/* Full Name */}
                    <div>
                      <Label htmlFor={`executives.${index}.full_name`}>
                        Full Name
                      </Label>
                      <Input
                        id={`executives.${index}.full_name`}
                        placeholder="Enter full name"
                        {...register(`executives.${index}.full_name`, {
                          required: "Full name is required",
                        })}
                      />
                      {errors.executives?.[index]?.full_name && (
                        <p className="text-red-500 text-sm">
                          {errors.executives[index].full_name.message}
                        </p>
                      )}
                    </div>

                    {/* Contact */}
                    <div>
                      <Label htmlFor={`executives.${index}.contact`}>
                        Contact
                      </Label>
                      <Input
                        id={`executives.${index}.contact`}
                        type="tel"
                        placeholder="Enter contact number"
                        {...register(`executives.${index}.contact`, {
                          required: "Contact is required",
                        })}
                        maxLength={12}
                      />
                      {errors.executives?.[index]?.contact && (
                        <p className="text-red-500 text-sm">
                          {errors.executives[index].contact.message}
                        </p>
                      )}
                    </div>

                    {/* Email */}
                    <div>
                      <Label htmlFor={`executives.${index}.email`}>Email</Label>
                      <Input
                        id={`executives.${index}.email`}
                        type="email"
                        placeholder="Enter email address"
                        {...register(`executives.${index}.email`, {
                          pattern: {
                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                            message: "Invalid email address",
                          },
                        })}
                      />
                      {errors.executives?.[index]?.email && (
                        <p className="text-red-500 text-sm">
                          {errors.executives[index].email.message}
                        </p>
                      )}
                    </div>

                    {/* Identification */}
                    <div>
                      <Label
                        htmlFor={`executives.${index}.executive_identification`}
                      >
                        Identification
                      </Label>
                      <Input
                        id={`executives.${index}.executive_identification`}
                        placeholder="Enter National ID or Passport Number"
                        {...register(
                          `executives.${index}.executive_identification`,
                          {
                            required: "Identification is required",
                          }
                        )}
                        maxLength={14}
                      />
                      {errors.executives?.[index]?.executive_identification && (
                        <p className="text-red-500 text-sm">
                          {
                            errors.executives[index].executive_identification
                              .message
                          }
                        </p>
                      )}
                    </div>

                    {/* Role */}
                    <div>
                      <Label htmlFor={`executives.${index}.role`}>Role</Label>
                      <Input
                        id={`executives.${index}.role`}
                        type="text"
                        placeholder="Enter role in the group"
                        {...register(`executives.${index}.role`, {
                          required: "Role is required",
                        })}
                      />
                      {errors.executives?.[index]?.role && (
                        <p className="text-red-500 text-sm">
                          {errors.executives[index].role.message}
                        </p>
                      )}
                    </div>
                    {/* Address */}
                    <div>
                      <Label htmlFor={`executives.${index}.address`}>
                        Address
                      </Label>
                      <Input
                        id={`executives.${index}.address`}
                        type="text"
                        placeholder="Enter address in the executive"
                        {...register(`executives.${index}.address`, {
                          required: "Address is required",
                        })}
                      />
                      {errors.executives?.[index]?.address && (
                        <p className="text-red-500 text-sm">
                          {errors.executives[index].address.message}
                        </p>
                      )}
                    </div>

                    {/* Title */}
                    <div>
                      <Label>Title</Label>
                      <Select
                        onValueChange={(value) =>
                          setValue(`executives.${index}.title`, value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder="Select title"
                            {...register(`executives.${index}.title`, {
                              required: "Title is required",
                            })}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Mr">Mr.</SelectItem>
                          <SelectItem value="Mrs">Mrs.</SelectItem>
                          <SelectItem value="Dr">Dr.</SelectItem>
                          <SelectItem value="Rev">Rev.</SelectItem>
                          <SelectItem value="Miss">Miss.</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.executives?.[index]?.title && (
                        <p className="text-red-500 text-sm">
                          {errors.executives[index].title.message}
                        </p>
                      )}
                    </div>

                    {/* Photo */}
                    <div>
                      <Label htmlFor={`executives.${index}.photo`}>Photo</Label>
                      <Input
                        id={`executives.${index}.photo`}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, index, "photo")}
                      />
                    </div>

                    {/* Signature */}
                    <div>
                      <Label htmlFor={`executives.${index}.signature`}>
                        Signature
                      </Label>
                      <Input
                        id={`executives.${index}.signature`}
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          handleFileChange(e, index, "signature")
                        }
                      />
                    </div>

                    {/* Remove Button */}
                    <Button
                      onClick={() => remove(index)}
                      size="xs"
                      variant="danger"
                      className="absolute top-2 right-2"
                    >
                      <Trash className="h-5 w-5" />
                    </Button>
                  </div>
                ))}

                <Button
                  type="button"
                  size="sm"
                  onClick={() =>
                    append({
                      full_name: "",
                      contact: "",
                      email: "",
                      executive_identification: "",
                      role: "",
                      title: "",
                      photo: null,
                      signature: null,
                    })
                  }
                  className="mt-2 flex items-center space-x-2"
                >
                  <PlusCircle className="w-5 h-5" />
                  Executive
                </Button>
              </fieldset>
            )}

            {step === 5 && (
              <fieldset className="grid grid-cols-1 md:grid-cols-1 gap-4">
                <div className="flex flex-col items-center space-y-2">
                  <Label className="text-center">Group Logo</Label>

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
                    onChange={handleImageChange}
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
            <CardFooter>
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
                {step < 5 ? (
                  <Button type="button" onClick={validateStep}>
                    Next <ArrowRight className="ml-2" />
                  </Button>
                ) : (
                  ""
                )}
                {step === 5 && (
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
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </>
  );
};

export default GroupRegistrationForm;

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  Fingerprint,
  Cog,
  Image,
  CheckCircle,
  Phone,
  IdCard,
  BookDashed,
  Loader,
} from "lucide-react";
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
import { DatePicker } from "@/components/ui/date-picker";

const ClientRegistrationForm = () => {
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

  const [step, setStep] = useState(1);
  const [preview, setPreview] = useState(null);

  // Progress the form
  const validateStep = async () => {
    const valid = await trigger();
    if (valid && step < 6) {
      setStep((prev) => prev + 1);
    }
  };

  // Go back a step
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  // Handle image upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      setValue("user_image", file);
    }
  };

  // Remove selected image
  const handleRemoveImage = () => {
    setPreview(null);
    setValue("user_image", null);
  };

  // Handle Form Submission
  const onSubmitImage = async (formData) => {
    const controller = new AbortController();
    try {
      const response = await axiosPrivate.post(`clients/images`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        signal: controller.signal,
      });
      console.log(response);
    } catch (error) {
      console.log(error);
      const errorMessage =
        error?.response?.data?.messages || "No server response";
      toast({
        title: "Uh oh! Something went wrong.",
        variant: "destructive",
        description: errorMessage,
      });
    }
  };
  const onSubmit = async (data) => {
    const controller = new AbortController();

    try {
      // ✅ Send POST request to update other fields (excluding image)
      const response = await axiosPrivate.post(`/clients/individual`, data, {
        signal: controller.signal,
      });
      //  create the form datat
      const formData = new FormData();
      let isImageChanged = false; // Flag to check if image is updated
      // ✅ Check if user_image is valid (proper File type)
      if (data.user_image instanceof File) {
        formData.append("file", data.user_image); // Append file
        formData.append("file_type", "passport"); // Append attributes
        formData.append("client_id", response.data.data.client.client_id); // Append attributes
        isImageChanged = true;
      }
      // ✅ Only send image update if a new image was selected
      if (isImageChanged) {
        await onSubmitImage(formData);
      }
      // ✅ Show success toast
      toast({ title: "Success", description: response?.data?.messages });
      // ✅ Reset form and refresh data
      reset();
      setStep(1);
      navigate(`/clients/individual/${response.data.data.client.client_id}`);
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
  const [loading, setLoading] = useState(false);

  // Function to handle checking the national database
  const handleIdentificationChange = (e) => {
    const value = e.target.value;
    setValue("client_identification", value);

    if (value.length === 14) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false); // Simulate API check completion
      }, 80000);
    } else {
      setLoading(false);
    }
  };
  const [name, setName] = useState("");
  // Function to handle checking the national database
  const handlePhoneChange = async (e) => {
    const controller = new AbortController();

    const value = e.target.value;
    setValue("client_contact", value);

    if (value.length >= 10) {
      // console.log(value)
      setLoading(true);
      const response = await axiosPrivate.post(
        `/phone-name-verification`,
        {
          phone: value,
        },
        { signal: controller.signal }
      );
      // console.log(response)
      setName(`${response.data.firstname} ${response.data.lastname}`);
      setLoading(false);
    } else {
      setLoading(false);
    }
  };

  const stepIcons = [
    {
      icon: <Fingerprint className="w-6 h-6 text-blue-500" />,
      label: "Bio Details",
    },
    {
      icon: <IdCard className="w-6 h-6 text-orange-500" />,
      label: "Identification Information",
    },
    {
      icon: <Phone className="w-6 h-6 text-red-500" />,
      label: "Contact Information",
    },
    {
      icon: <BookDashed className="w-6 h-6 text-purple-500" />,
      label: "Employment Information",
    },
    {
      icon: <Cog className="w-6 h-6 text-yellow-500" />,
      label: "Client Settings",
    },
    {
      icon: <Image className="w-6 h-6 text-green-500" />,
      label: "Client Photo",
    },
  ];
  // Watch for employment status changes
  const employmentStatus = watch("client_employment_status");
  return (
    <>
      <Card className="shadow-lg rounded-xl">
        <CardHeader className="p-4 rounded-t-xl">
          <CardTitle className="text-sm font-semibold">
            <div className="flex items-center space-x-4 my-1">
              {stepIcons.map((stepIcon, index) => (
                <div
                  key={index}
                  className={`flex items-center ${
                    step > index + 1 ? "opacity-100" : "opacity-50"
                  } transition-opacity`}
                >
                  {stepIcon.icon}
                  <span className="ml-2 text-sm font-medium">
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
            <Progress value={(step / 6) * 100} className="my-1" />
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
                  <Label htmlFor="firstname">First Name</Label>
                  <Input
                    id="firstname"
                    placeholder="Enter first name"
                    {...register("client_firstname", {
                      required: "First name is required",
                    })}
                  />
                  {errors.client_firstname && (
                    <p className="text-red-500 text-sm">
                      {errors.client_firstname.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="middlename">Middle Name</Label>
                  <Input
                    id="middlename"
                    placeholder="Enter Middle name"
                    {...register("client_middlename")}
                  />
                </div>
                <div>
                  <Label htmlFor="lastname">Last Name</Label>
                  <Input
                    id="lastname"
                    placeholder="Enter last name"
                    {...register("client_lastname", {
                      required: "Last name is required",
                    })}
                  />
                  {errors.client_lastname && (
                    <p className="text-red-500 text-sm">
                      {errors.client_lastname.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="client_date_of_birth">Date of Birth</Label>
                  <Controller
                    name="client_date_of_birth"
                    control={control}
                    rules={{ required: "Date of birth is required" }}
                    render={({ field }) => {
                      const parsedDate = field.value
                        ? new Date(field.value)
                        : null;

                      return (
                        <DatePicker
                          selectedDate={parsedDate}
                          onChange={(date) => {
                            if (date) {
                              const formatted =
                                date.toLocaleDateString("en-CA");
                              field.onChange(formatted);
                            }
                          }}
                        />
                      );
                    }}
                  />

                  {errors.client_date_of_birth && (
                    <p className="text-red-500 text-sm">
                      {errors.client_date_of_birth.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label>Gender</Label>
                  <Select
                    onValueChange={(value) => setValue("client_gender", value)}
                  >
                    <SelectTrigger
                      {...register("client_gender", {
                        required: "Gender is required",
                      })}
                    >
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.client_gender && (
                    <p className="text-red-500 text-sm">
                      {errors.client_gender.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label>Marital Status</Label>
                  <Select
                    onValueChange={(value) =>
                      setValue("client_martial_status", value)
                    }
                  >
                    <SelectTrigger
                      {...register("client_martial_status", {
                        required: "Marital Status is required",
                      })}
                    >
                      <SelectValue placeholder="Select Marital Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="married">Married</SelectItem>
                      <SelectItem value="divorced">Divorced</SelectItem>
                      <SelectItem value="widowed">
                        Widowed / Widoweder
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.client_martial_status && (
                    <p className="text-red-500 text-sm">
                      {errors.client_martial_status.message}
                    </p>
                  )}
                </div>
              </fieldset>
            )}
            {step === 2 && (
              <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="client_identification">
                    Client Identification
                  </Label>
                  <Input
                    id="client_identification"
                    type="text"
                    placeholder="Enter National ID or Passport Number"
                    {...register("client_identification", {
                      required: "National ID is required",
                    })}
                    maxLength={14}
                    onChange={handleIdentificationChange}
                  />
                  {errors.client_identification && (
                    <p className="text-red-500 text-sm">
                      {errors.client_identification.message}
                    </p>
                  )}

                  {/* Show Loader when 14 digits entered */}
                  {loading && (
                    <div className="flex items-center mt-2 text-blue-500 text-sm">
                      <Loader className="animate-spin mr-2" />
                      Checking in the national database, please wait...
                    </div>
                  )}

                  {/* Allow user to continue without verification */}
                  {loading && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => setLoading(false)}
                    >
                      Continue without verification
                    </Button>
                  )}
                </div>
              </fieldset>
            )}
            {step === 3 && (
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
                    onChange={handlePhoneChange}
                  />
                  {errors.client_contact && (
                    <p className="text-red-500 text-sm">
                      {errors.client_contact.message}
                    </p>
                  )}
                  {/* Show Loader when 14 digits entered */}
                  {loading && (
                    <div className="flex items-center mt-2 text-blue-500 text-xs">
                      <Loader className="animate-spin mr-2 text-sm" />
                      Verifying phone number, please wait...
                    </div>
                  )}
                  {!loading && (
                    <div className="flex items-center mt-2 text-sm">{name}</div>
                  )}
                  {loading && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => setLoading(false)}
                    >
                      Continue without verification
                    </Button>
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
            {step === 4 && (
              <fieldset className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Employment Status */}
                <div>
                  <Label>Employment Status</Label>
                  <Controller
                    name="client_employment_status"
                    control={control}
                    defaultValue=""
                    rules={{ required: "Employment status is required" }}
                    render={({ field }) => (
                      <Select
                        onValueChange={(value) => {
                          setValue("client_employment_status", value);
                          setValue("client_extra_notes", ""); // Reset extra notes
                        }}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Employment Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="employed">Employed</SelectItem>
                          <SelectItem value="unemployed">Unemployed</SelectItem>
                          <SelectItem value="selfemployed">
                            Self-Employed
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.client_employment_status && (
                    <p className="text-red-500 text-sm">
                      {errors.client_employment_status.message}
                    </p>
                  )}
                </div>

                {/* Show fields only if "Employed" is selected */}
                {employmentStatus === "employed" && (
                  <>
                    <div>
                      <Label htmlFor="client_estimated_gross">
                        Gross Income
                      </Label>
                      <Input
                        id="client_estimated_gross"
                        type="number"
                        placeholder="Enter Gross Income"
                        {...register("client_estimated_gross", {
                          required:
                            employmentStatus === "employed"
                              ? "Gross income is required"
                              : false,
                        })}
                      />
                      {errors.client_estimated_gross && (
                        <p className="text-red-500 text-sm">
                          {errors.client_estimated_gross.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="client_extra_notes">
                        Employer & Location Details
                      </Label>
                      <Textarea
                        id="client_extra_notes"
                        placeholder="Describe your employer, location, and any additional details..."
                        {...register("client_extra_notes", {
                          required:
                            employmentStatus === "employed"
                              ? "This field is required"
                              : false,
                        })}
                      />
                      {errors.client_extra_notes && (
                        <p className="text-red-500 text-sm">
                          {errors.client_extra_notes.message}
                        </p>
                      )}
                    </div>
                  </>
                )}

                {/* Show only if "Unemployed" or "Self-Employed" */}
                {(employmentStatus === "unemployed" ||
                  employmentStatus === "selfemployed") && (
                  <div>
                    <Label htmlFor="client_extra_notes">
                      {employmentStatus === "unemployed"
                        ? "Describe Source of Income"
                        : "Business Details & Income Source"}
                    </Label>
                    <Textarea
                      id="client_extra_notes"
                      placeholder={
                        employmentStatus === "unemployed"
                          ? "Explain how you earn money while unemployed..."
                          : "Enter business name, type, and income sources..."
                      }
                      {...register("client_extra_notes", {
                        required: "This field is required",
                      })}
                    />
                    {errors.client_extra_notes && (
                      <p className="text-red-500 text-sm">
                        {errors.client_extra_notes.message}
                      </p>
                    )}
                  </div>
                )}
              </fieldset>
            )}
            {step === 5 && (
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
                  <Label htmlFor="client_date_of_join">
                    Client Date Of Joining
                  </Label>
                  <Controller
                    name="client_date_of_join"
                    control={control}
                    rules={{ required: "Date of birth is required" }}
                    render={({ field }) => {
                      const parsedDate = field.value
                        ? new Date(field.value)
                        : null;
                      return (
                        <DatePicker
                          selectedDate={parsedDate}
                          onChange={(date) => {
                            if (date) {
                              const formatted =
                                date.toLocaleDateString("en-CA");
                              field.onChange(formatted);
                            }
                          }}
                        />
                      );
                    }}
                  />

                  {errors.client_date_of_join && (
                    <p className="text-red-500 text-sm">
                      {errors.client_date_of_join.message}
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
            {step === 6 && (
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
                {step < 6 ? (
                  <Button
                    type="button"
                    disabled={loading}
                    onClick={validateStep}
                  >
                    Next <ArrowRight className="ml-2" />
                  </Button>
                ) : (
                  ""
                )}
                {step === 6 && (
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

export default ClientRegistrationForm;
